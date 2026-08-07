const db = supabase.createClient(
  TNYPL_CONFIG.SUPABASE_URL,
  TNYPL_CONFIG.SUPABASE_ANON_KEY
);

let drawId = null;
let entries = [];
let winner = null;
let randomValue = null;

function showMessage(text, success = false) {
  drawMessage.hidden = false;
  drawMessage.textContent = text;
  drawMessage.style.color = success ? "#62e6a7" : "#ffb6c1";
}

function clearMessage() {
  drawMessage.hidden = true;
  drawMessage.textContent = "";
}

function hasDraw() {
  if (drawId === null || drawId === undefined || drawId === "") {
    showMessage("Create or load an official draw first.");
    return false;
  }
  return true;
}

function setDrawButtons() {
  const enabled = drawId !== null && drawId !== undefined && drawId !== "";
  lockDraw.disabled = !enabled;
  undoSpin.disabled = !enabled;
  resetDraw.disabled = !enabled;
  spinWheel.disabled = !enabled;
  acceptWinner.disabled = !enabled || !winner;
  generateFixtures.disabled = !enabled;
}

function renderGroups() {
  groupA.innerHTML =
    entries
      .filter((x) => x.group_code === "A")
      .sort((a, b) => (a.position_code || "Z").localeCompare(b.position_code || "Z"))
      .map((x) => `<p>${x.position_code || "A"} · ${x.franchises?.name || "Franchise"}</p>`)
      .join("") || "<p>Waiting for draw</p>";

  groupB.innerHTML =
    entries
      .filter((x) => x.group_code === "B")
      .sort((a, b) => (a.position_code || "Z").localeCompare(b.position_code || "Z"))
      .map((x) => `<p>${x.position_code || "B"} · ${x.franchises?.name || "Franchise"}</p>`)
      .join("") || "<p>Waiting for draw</p>";
}

async function loadDraw(drawToLoad = null) {
  clearMessage();

  let draw = drawToLoad;

  if (!draw) {
    const result = await db
      .from("tournament_draws")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      showMessage(result.error.message);
      setDrawButtons();
      return;
    }

    draw = result.data;
  }

  if (!draw) {
    drawId = null;
    entries = [];
    renderGroups();
    winnerText.textContent = "Create a draw to begin.";
    setDrawButtons();
    return;
  }

  drawId = Number(draw.id);
  drawName.value = draw.draw_name || drawName.value;

  const entryResult = await db
    .from("tournament_draw_entries")
    .select("*,franchises(id,name,slug)")
    .eq("draw_id", drawId)
    .order("created_at");

  if (entryResult.error) {
    showMessage(entryResult.error.message);
    return;
  }

  entries = entryResult.data || [];
  winner = null;
  randomValue = null;
  winnerText.textContent = `Loaded draw #${drawId} · ${draw.status || "draft"}`;
  renderGroups();
  setDrawButtons();
}

createDraw.onclick = async () => {
  clearMessage();
  createDraw.disabled = true;

  const result = await db.rpc("admin_create_tournament_draw", {
    p_draw_name: drawName.value.trim() || "TNYPL Season 1 Official Draw",
  });

  createDraw.disabled = false;

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  drawId = Number(result.data);
  showMessage(`Official draw #${drawId} created successfully.`, true);
  await loadDraw({ id: drawId, draw_name: drawName.value, status: "draft" });
};

lockDraw.onclick = async () => {
  if (!hasDraw()) return;

  const result = await db.rpc("admin_lock_tournament_draw", {
    p_draw_id: Number(drawId),
  });

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  showMessage(`Draw #${drawId} is now live.`, true);
  await loadDraw();
};

spinWheel.onclick = () => {
  if (!hasDraw()) return;

  const stage = drawStage.value;
  const pool =
    stage === "group"
      ? entries.filter((x) => !x.group_code)
      : entries.filter(
          (x) =>
            x.group_code === (stage === "positionA" ? "A" : "B") &&
            !x.position_code
        );

  if (!pool.length) {
    winner = null;
    winnerText.textContent = "No eligible team remains for this stage.";
    setDrawButtons();
    return;
  }

  randomValue = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  winner = pool[Math.floor(randomValue * pool.length)];
  winnerText.textContent = winner.franchises?.name || "Selected franchise";
  setDrawButtons();
};

acceptWinner.onclick = async () => {
  if (!hasDraw() || !winner) {
    showMessage("Spin the wheel and select a franchise first.");
    return;
  }

  const stage = drawStage.value === "group" ? "group" : "position";

  const result = await db.rpc("admin_accept_draw_result", {
    p_draw_id: Number(drawId),
    p_franchise_id: winner.franchise_id,
    p_stage: stage,
    p_group_code: stage === "group" ? nextGroup.value : winner.group_code,
    p_position_code: stage === "position" ? nextPosition.value : null,
    p_random_value: randomValue,
  });

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  showMessage(`${winner.franchises?.name || "Franchise"} accepted.`, true);
  winner = null;
  await loadDraw();
};

undoSpin.onclick = async () => {
  if (!hasDraw()) return;

  const result = await db.rpc("admin_undo_last_draw_spin", {
    p_draw_id: Number(drawId),
  });

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  showMessage("Last accepted result was undone.", true);
  await loadDraw();
};

resetDraw.onclick = async () => {
  if (!hasDraw()) return;
  if (!confirm("Reset all group and position assignments for this draw?")) return;

  const result = await db.rpc("admin_reset_tournament_draw", {
    p_draw_id: Number(drawId),
  });

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  showMessage("Draw reset successfully.", true);
  await loadDraw();
};

generateFixtures.onclick = async () => {
  if (!hasDraw()) return;

  if (!fixtureStartDate.value) {
    showMessage("Choose the tournament start date first.");
    return;
  }

  const result = await db.rpc("admin_generate_group_fixtures", {
    p_draw_id: Number(drawId),
    p_start_date: fixtureStartDate.value,
    p_venue: fixtureVenue.value.trim() || "TNYPL Official Venue",
    p_ground: fixtureGround.value.trim() || "Ground 1",
    p_first_time: fixtureTime1.value || "09:00",
    p_second_time: fixtureTime2.value || "13:30",
  });

  if (result.error) {
    showMessage(result.error.message);
    return;
  }

  showMessage(`${result.data} matches generated and published.`, true);
  await loadDraw();
};

drawStage.onchange = () => {
  winner = null;
  winnerText.textContent = "Press Spin to select an eligible franchise.";
  setDrawButtons();
};

drawLogout.onclick = async () => {
  await db.auth.signOut();
  location.href = "admin.html";
};

(async function init() {
  const sessionResult = await db.auth.getSession();
  const session = sessionResult.data.session;

  if (!session) {
    location.href = "admin.html";
    return;
  }

  const adminResult = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!adminResult.data) {
    location.href = "admin.html";
    return;
  }

  await loadDraw();
})();
