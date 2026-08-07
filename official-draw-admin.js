const db = supabase.createClient(
  TNYPL_CONFIG.SUPABASE_URL,
  TNYPL_CONFIG.SUPABASE_ANON_KEY
);

let drawId = null;
let drawRecord = null;
let entries = [];
let winner = null;
let randomValue = null;

function showMessage(text, success = false) {
  drawMessage.hidden = false;
  drawMessage.textContent = text;
  drawMessage.style.color = success ? "#62e6a7" : "#ffb6c1";
}
function clearMessage(){drawMessage.hidden=true;drawMessage.textContent=""}
function hasDraw(){if(drawId===null){showMessage("Create or load an official draw first.");return false}return true}

function currentPool(){
  const stage = drawStage.value;
  if(stage==="group") return entries.filter(x=>!x.group_code);
  if(stage==="positionA") return entries.filter(x=>x.group_code==="A"&&!x.position_code);
  return entries.filter(x=>x.group_code==="B"&&!x.position_code);
}

function setButtons(){
  const enabled = drawId !== null;
  lockDraw.disabled=!enabled;
  undoSpin.disabled=!enabled;
  resetDraw.disabled=!enabled;
  spinWheel.disabled=!enabled || currentPool().length===0;
  acceptWinner.disabled=!enabled || !winner;
  generateFixtures.disabled=!enabled;
}

function renderGroups(){
  groupA.innerHTML=entries.filter(x=>x.group_code==="A")
    .sort((a,b)=>(a.position_code||"Z").localeCompare(b.position_code||"Z"))
    .map(x=>`<p>${x.position_code||"A"} · ${x.franchises?.name||"Franchise"}</p>`).join("")||"<p>Waiting for draw</p>";
  groupB.innerHTML=entries.filter(x=>x.group_code==="B")
    .sort((a,b)=>(a.position_code||"Z").localeCompare(b.position_code||"Z"))
    .map(x=>`<p>${x.position_code||"B"} · ${x.franchises?.name||"Franchise"}</p>`).join("")||"<p>Waiting for draw</p>";
}

function renderFranchiseList(){
  allFranchises.innerHTML = entries.map(x=>{
    const status = x.position_code || (x.group_code ? `Group ${x.group_code}` : "Unassigned");
    return `<div class="franchise-row"><strong>${x.franchises?.name||"Franchise"}</strong><span>${status}</span></div>`;
  }).join("") || "<p>No franchises loaded for this draw.</p>";
  franchiseSummary.textContent = entries.length
    ? `${entries.length} franchises loaded · ${entries.filter(x=>!x.group_code).length} awaiting group allocation`
    : "No franchises loaded.";
}

function drawWheel(){
  const canvas=wheelCanvas, ctx=canvas.getContext("2d"), pool=currentPool();
  const cx=canvas.width/2, cy=canvas.height/2, r=canvas.width*.44;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!pool.length){
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle="#03142d";ctx.fill();
    ctx.fillStyle="#9fb1c8";ctx.font="700 30px Arial";ctx.textAlign="center";
    ctx.fillText(entries.length ? "NO ELIGIBLE FRANCHISES" : "CREATE OR LOAD DRAW",cx,cy);
    return;
  }
  const colors=["#173f7a","#9f2f4f","#1e6b59","#8c5a1e","#5a3f8c","#0e7183","#7c3f20","#285b9a"];
  const slice=Math.PI*2/pool.length;
  pool.forEach((item,i)=>{
    const start=-Math.PI/2+i*slice,end=start+slice;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];ctx.fill();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(start+slice/2);
    ctx.textAlign="right";ctx.fillStyle="#fff";ctx.font="700 24px Arial";
    const name=(item.franchises?.name||"Franchise").slice(0,22);
    ctx.fillText(name,r-24,8);ctx.restore();
  });
  ctx.beginPath();ctx.arc(cx,cy,r*.17,0,Math.PI*2);ctx.fillStyle="#d9ad43";ctx.fill();
  ctx.fillStyle="#071a38";ctx.font="900 32px Arial";ctx.textAlign="center";ctx.fillText("SPIN",cx,cy+10);
}

function renderAll(){
  renderGroups();
  renderFranchiseList();
  drawWheel();
  drawStatus.textContent = drawRecord
    ? `Draw #${drawId} · ${drawRecord.status||"draft"} · ${entries.length} franchises`
    : "No draw loaded";
  setButtons();
}

async function loadDraw(drawToLoad=null){
  clearMessage();
  let draw=drawToLoad;
  if(!draw){
    const result=await db.from("tournament_draws").select("*").order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(result.error){showMessage(result.error.message);return}
    draw=result.data;
  }
  if(!draw){
    drawId=null;drawRecord=null;entries=[];winner=null;winnerText.textContent="Create a draw to begin.";renderAll();return;
  }
  drawId=Number(draw.id);drawRecord=draw;drawName.value=draw.draw_name||drawName.value;
  const entryResult=await db.from("tournament_draw_entries").select("*,franchises(id,name,slug)").eq("draw_id",drawId).order("created_at");
  if(entryResult.error){showMessage(entryResult.error.message);return}
  entries=entryResult.data||[];winner=null;randomValue=null;
  winnerText.textContent=`Loaded draw #${drawId}`;
  renderAll();
}

createDraw.onclick=async()=>{
  createDraw.disabled=true;
  const result=await db.rpc("admin_create_tournament_draw",{p_draw_name:drawName.value.trim()||"TNYPL Season 1 Official Draw"});
  createDraw.disabled=false;
  if(result.error){showMessage(result.error.message);return}
  drawId=Number(result.data);showMessage(`Draw #${drawId} created.`,true);await loadDraw();
};
lockDraw.onclick=async()=>{if(!hasDraw())return;const result=await db.rpc("admin_lock_tournament_draw",{p_draw_id:Number(drawId)});if(result.error){showMessage(result.error.message);return}showMessage("Draw is live.",true);await loadDraw()};
spinWheel.onclick=()=>{
  if(!hasDraw())return;
  const pool=currentPool();
  if(!pool.length){winner=null;winnerText.textContent="No eligible franchise remains for this stage.";renderAll();return}
  randomValue=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
  winner=pool[Math.floor(randomValue*pool.length)];
  winnerText.textContent=`Selected: ${winner.franchises?.name||"Franchise"}`;
  acceptWinner.disabled=false;
};
acceptWinner.onclick=async()=>{
  if(!winner)return showMessage("Spin first.");
  const stage=drawStage.value==="group"?"group":"position";
  const result=await db.rpc("admin_accept_draw_result",{
    p_draw_id:Number(drawId),
    p_franchise_id:winner.franchise_id,
    p_stage:stage,
    p_group_code:stage==="group"?nextGroup.value:winner.group_code,
    p_position_code:stage==="position"?nextPosition.value:null,
    p_random_value:randomValue
  });
  if(result.error){showMessage(result.error.message);return}
  showMessage(`${winner.franchises?.name||"Franchise"} accepted.`,true);winner=null;await loadDraw();
};
undoSpin.onclick=async()=>{if(!hasDraw())return;const result=await db.rpc("admin_undo_last_draw_spin",{p_draw_id:Number(drawId)});if(result.error){showMessage(result.error.message);return}showMessage("Last result undone.",true);await loadDraw()};
resetDraw.onclick=async()=>{if(!hasDraw())return;if(!confirm("Reset all assignments?"))return;const result=await db.rpc("admin_reset_tournament_draw",{p_draw_id:Number(drawId)});if(result.error){showMessage(result.error.message);return}showMessage("Draw reset.",true);await loadDraw()};
generateFixtures.onclick=async()=>{if(!hasDraw())return;if(!fixtureStartDate.value)return showMessage("Choose start date.");const result=await db.rpc("admin_generate_group_fixtures",{p_draw_id:Number(drawId),p_start_date:fixtureStartDate.value,p_venue:fixtureVenue.value.trim()||"TNYPL Official Venue",p_ground:fixtureGround.value.trim()||"Ground 1",p_first_time:fixtureTime1.value||"09:00",p_second_time:fixtureTime2.value||"13:30"});if(result.error){showMessage(result.error.message);return}showMessage(`${result.data} matches generated.`,true);await loadDraw()};
drawStage.onchange=()=>{winner=null;winnerText.textContent="Press Spin to select an eligible franchise.";renderAll()};
drawLogout.onclick=async()=>{await db.auth.signOut();location.href="admin.html"};

(async function init(){
  const s=(await db.auth.getSession()).data.session;if(!s)return location.href="admin.html";
  const a=await db.from("admin_users").select("user_id").eq("user_id",s.user.id).maybeSingle();
  if(!a.data)return location.href="admin.html";
  await loadDraw();
})();
