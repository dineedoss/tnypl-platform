const db = supabase.createClient(
  TNYPL_CONFIG.SUPABASE_URL,
  TNYPL_CONFIG.SUPABASE_ANON_KEY
);

let drawId = null;
let drawRecord = null;
let entries = [];
let winner = null;
let randomValue = null;
let wheelRotation = 0;
let wheelAnimating = false;
const SLOT_SEQUENCE=["A1","A2","A3","A4","B1","B2","B3","B4"];

function showMessage(text, success = false) {
  drawMessage.hidden = false;
  drawMessage.textContent = text;
  drawMessage.style.color = success ? "#62e6a7" : "#ffb6c1";
}
function clearMessage(){drawMessage.hidden=true;drawMessage.textContent=""}
function hasDraw(){if(drawId===null){showMessage("Create or load an official draw first.");return false}return true}

function currentPool(){
  return entries.filter(x=>!x.position_code);
}

function currentSlot(){
  const assigned=entries.filter(x=>x.position_code).length;
  return SLOT_SEQUENCE[assigned] || null;
}

function setButtons(){
  const hasValidDraw = drawId !== null;
  const isLive = hasValidDraw && drawRecord?.status === "live";
  const idle = !wheelAnimating;

  lockDraw.disabled = !hasValidDraw || !idle || isLive;
  undoSpin.disabled = !hasValidDraw || !idle;
  resetDraw.disabled = !hasValidDraw || !idle;
  spinWheel.disabled = !isLive || !idle || currentPool().length===0 || !currentSlot();
  acceptWinner.disabled = !isLive || !idle || !winner;
  generateFixtures.disabled = !hasValidDraw || !idle;
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
  const pool=currentPool();
  allFranchises.innerHTML = pool.map(x=>
    `<div class="franchise-row"><strong>${x.franchises?.name||"Franchise"}</strong><span>Available</span></div>`
  ).join("") || "<p>All eight positions have been assigned.</p>";

  franchiseSummary.textContent = pool.length
    ? `${pool.length} franchise${pool.length===1?"":"s"} remaining · next ${currentSlot()}`
    : "Draw complete.";
}

function drawWheel(rotation = wheelRotation){
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

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotation);
  ctx.translate(-cx,-cy);

  pool.forEach((item,i)=>{
    const start=-Math.PI/2+i*slice,end=start+slice;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];ctx.fill();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(start+slice/2);
    ctx.textAlign="right";
    ctx.fillStyle="#fff";
    ctx.font="700 24px Arial";
    const name=(item.franchises?.name||"Franchise").slice(0,22);
    ctx.fillText(name,r-24,8);
    ctx.restore();
  });

  ctx.restore();

  // Center button
  ctx.beginPath();ctx.arc(cx,cy,r*.17,0,Math.PI*2);ctx.fillStyle="#d9ad43";ctx.fill();
  ctx.fillStyle="#071a38";ctx.font="900 32px Arial";ctx.textAlign="center";ctx.fillText("SPIN",cx,cy+10);

  // Fixed pointer at the top, pointing down toward the selected slice
  ctx.beginPath();
  ctx.moveTo(cx-20,22);
  ctx.lineTo(cx+20,22);
  ctx.lineTo(cx,62);
  ctx.closePath();
  ctx.fillStyle="#ffd86b";
  ctx.fill();
}

function renderAll(){
  renderGroups();
  renderFranchiseList();
  drawWheel();
  drawStatus.textContent = drawRecord
    ? `Draw #${drawId} · ${drawRecord.status||"draft"} · ${entries.length} franchises`
    : "No draw loaded";
  if(window.nextSlot) nextSlot.textContent=currentSlot()||"COMPLETE";
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
  if(!hasDraw() || wheelAnimating)return;
  if(drawRecord?.status!=="live"){
    showMessage("Lock the draw before spinning.");
    return;
  }

  const pool=currentPool();
  if(!pool.length){
    winner=null;
    winnerText.textContent="No eligible franchise remains for this stage.";
    renderAll();
    return;
  }

  randomValue=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
  const selectedIndex=Math.floor(randomValue*pool.length);
  winner=pool[selectedIndex];

  const slice=Math.PI*2/pool.length;
  const selectedCenter=-Math.PI/2 + selectedIndex*slice + slice/2;

  // Rotate selected slice center to the fixed top pointer.
  const pointerAngle=-Math.PI/2;
  const desiredFinalRotation=pointerAngle-selectedCenter;
  const startRotation=wheelRotation;
  const normalize=(angle)=>((angle%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
  const delta=normalize(desiredFinalRotation-normalize(startRotation));
  const extraTurns=(6 + Math.floor(Math.random()*3))*Math.PI*2;
  const targetRotation=startRotation+extraTurns+delta;
  const duration=4200;
  const started=performance.now();

  wheelAnimating=true;
  spinWheel.disabled=true;
  acceptWinner.disabled=true;
  undoSpin.disabled=true;
  resetDraw.disabled=true;
  winnerText.textContent="Spinning…";

  function animate(now){
    const progress=Math.min(1,(now-started)/duration);
    const eased=1-Math.pow(1-progress,4);
    wheelRotation=startRotation+(targetRotation-startRotation)*eased;
    drawWheel(wheelRotation);

    if(progress<1){
      requestAnimationFrame(animate);
      return;
    }

    wheelRotation=((targetRotation%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
    drawWheel(wheelRotation);
    wheelAnimating=false;
    winnerText.textContent=`Selected: ${winner.franchises?.name||"Franchise"}`;
    acceptWinner.disabled=false;
    undoSpin.disabled=false;
    resetDraw.disabled=false;
    setButtons();
  }

  requestAnimationFrame(animate);
};
acceptWinner.onclick=async()=>{
  if(drawRecord?.status!=="live")return showMessage("Lock the draw before accepting a result.");
  if(!winner)return showMessage("Spin first.");

  const slot=currentSlot();
  if(!slot)return showMessage("All eight positions are already assigned.");

  const result=await db.rpc("admin_accept_draw_slot",{
    p_draw_id:Number(drawId),
    p_franchise_id:winner.franchise_id,
    p_position_code:slot,
    p_random_value:randomValue
  });

  if(result.error){
    showMessage(result.error.message);
    return;
  }

  showMessage(`${winner.franchises?.name||"Franchise"} assigned to ${slot}.`,true);
  winner=null;
  randomValue=null;
  wheelRotation=0;
  await loadDraw();
};
undoSpin.onclick=async()=>{if(!hasDraw())return;const result=await db.rpc("admin_undo_last_draw_spin",{p_draw_id:Number(drawId)});if(result.error){showMessage(result.error.message);return}showMessage("Last result undone.",true);await loadDraw()};
resetDraw.onclick=async()=>{if(!hasDraw())return;if(!confirm("Reset all assignments?"))return;const result=await db.rpc("admin_reset_tournament_draw",{p_draw_id:Number(drawId)});if(result.error){showMessage(result.error.message);return}showMessage("Draw reset.",true);await loadDraw()};
generateFixtures.onclick=async()=>{if(!hasDraw())return;if(!fixtureStartDate.value)return showMessage("Choose start date.");const result=await db.rpc("admin_generate_group_fixtures",{p_draw_id:Number(drawId),p_start_date:fixtureStartDate.value,p_venue:fixtureVenue.value.trim()||"TNYPL Official Venue",p_ground:fixtureGround.value.trim()||"Ground 1",p_first_time:fixtureTime1.value||"09:00",p_second_time:fixtureTime2.value||"13:30"});if(result.error){showMessage(result.error.message);return}showMessage(`${result.data} matches generated.`,true);await loadDraw()};

  randomValue=null;
  wheelRotation=0;
  winnerText.textContent="Press Spin to select an eligible franchise.";
  renderAll();
};
drawLogout.onclick=async()=>{await db.auth.signOut();location.href="admin.html"};

(async function init(){
  const s=(await db.auth.getSession()).data.session;if(!s)return location.href="admin.html";
  const a=await db.from("admin_users").select("user_id").eq("user_id",s.user.id).maybeSingle();
  if(!a.data)return location.href="admin.html";
  await loadDraw();
})();
