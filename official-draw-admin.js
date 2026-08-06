const odCfg=window.TNYPL_CONFIG;
const odSb=supabase.createClient(odCfg.SUPABASE_URL,odCfg.SUPABASE_ANON_KEY);
let odSession=null,drawId=null,entries=[],history=[],remaining=[],currentWinner=null,currentRandom=null;
let rotation=0,spinning=false;

function odMsg(text,ok=false){
 drawMessage.hidden=false;drawMessage.textContent=text;drawMessage.style.background=ok?"#123f32":"#4c3910";
 setTimeout(()=>drawMessage.hidden=true,6500);
}
function secureRandom(){
 const arr=new Uint32Array(2);crypto.getRandomValues(arr);
 return ((arr[0]*4294967296+arr[1])%9007199254740991)/9007199254740991;
}
function colors(i,n){
 const hues=[42,205,342,164,18,265,115,318];
 return `hsl(${hues[i%hues.length]} 68% ${i%2?42:48}%)`;
}
function drawWheel(){
 const c=wheelCanvas,ctx=c.getContext("2d"),w=c.width,h=c.height,cx=w/2,cy=h/2,r=Math.min(w,h)*.46;
 ctx.clearRect(0,0,w,h);
 if(!remaining.length){
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle="#071a38";ctx.fill();
  ctx.fillStyle="#d9ad43";ctx.font="800 44px Inter";ctx.textAlign="center";ctx.fillText("DRAW COMPLETE",cx,cy);
  return;
 }
 const slice=Math.PI*2/remaining.length;
 remaining.forEach((e,i)=>{
  const start=rotation+i*slice,end=start+slice;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();ctx.fillStyle=colors(i,remaining.length);ctx.fill();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(start+slice/2);ctx.textAlign="right";ctx.fillStyle="#fff";ctx.font=`800 ${remaining.length>6?24:30}px Inter`;ctx.shadowColor="rgba(0,0,0,.45)";ctx.shadowBlur=4;
  const label=e.franchises?.name||"Franchise";ctx.fillText(label.slice(0,24),r-32,8);ctx.restore();
 });
 ctx.beginPath();ctx.arc(cx,cy,r*.18,0,Math.PI*2);ctx.fillStyle="#061329";ctx.fill();ctx.lineWidth=10;ctx.strokeStyle="#d9ad43";ctx.stroke();
}
function selectedPool(){
 const stage=drawStage.value;
 if(stage==="group")return entries.filter(e=>!e.group_code);
 if(stage==="positionA")return entries.filter(e=>e.group_code==="A"&&!e.position_code);
 return entries.filter(e=>e.group_code==="B"&&!e.position_code);
}
function updatePool(){
 remaining=selectedPool();currentWinner=null;acceptWinner.disabled=true;winnerText.textContent=remaining.length?"Press SPIN to select from the remaining franchises.":"No eligible franchises remain for this stage.";
 stageLabel.textContent=drawStage.value==="group"?"Group Allocation":drawStage.value==="positionA"?"Group A Position Draw":"Group B Position Draw";
 drawWheel();
}
async function init(){
 const {data:{session}}=await odSb.auth.getSession();odSession=session;
 if(!session){location.href="admin.html";return}
 const {data:admin}=await odSb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
 if(!admin){location.href="admin.html";return}
 await loadLatestDraw();
}
async function loadLatestDraw(){
 const {data}=await odSb.from("tournament_draws").select("*").order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(data){drawId=data.id;drawName.value=data.draw_name;await loadDrawData()}else updatePool();
}
async function loadDrawData(){
 if(!drawId)return;
 const [{data:e,error:ee},{data:h,error:he}]=await Promise.all([
  odSb.from("tournament_draw_entries").select("*,franchises(id,name,slug)").eq("draw_id",drawId).order("created_at"),
  odSb.from("tournament_draw_history").select("*,franchises(name)").eq("draw_id",drawId).order("spin_number",{ascending:false})
 ]);
 if(ee)throw ee;if(he)throw he;entries=e||[];history=h||[];
 renderGroups();renderHistory();updatePool();
}
function renderGroups(){
 const render=g=>entries.filter(e=>e.group_code===g).sort((a,b)=>(a.position_code||"Z").localeCompare(b.position_code||"Z")).map(e=>`<div class="group-team"><strong>${e.position_code||g}</strong> · ${e.franchises?.name||"Franchise"}</div>`).join("")||'<div class="group-team">Waiting for draw</div>';
 groupA.innerHTML=render("A");groupB.innerHTML=render("B");
}
function renderHistory(){
 drawHistory.innerHTML=history.filter(h=>!h.undone).map(h=>`<div class="history-row"><div><strong>Spin ${h.spin_number}: ${h.franchises?.name||"Franchise"}</strong><br><span>${h.stage==="group"?"Group "+h.group_code:"Position "+h.position_code}</span></div><span>${new Date(h.created_at).toLocaleTimeString()}</span></div>`).join("")||"<p style='color:#9db0c8'>No accepted spins yet.</p>";
}
async function spin(){
 if(spinning||remaining.length===0)return;
 spinning=true;spinWheel.disabled=true;acceptWinner.disabled=true;currentRandom=secureRandom();
 const winnerIndex=Math.floor(currentRandom*remaining.length);
 currentWinner=remaining[winnerIndex];
 const slice=Math.PI*2/remaining.length;
 const target=-(winnerIndex*slice+slice/2)-Math.PI/2;
 const rounds=8+Math.floor(secureRandom()*4);
 const start=rotation,end=target+rounds*Math.PI*2;
 const duration=5200,startTime=performance.now();
 ceremonyOverlay.hidden=false;closeCeremony.hidden=true;ceremonyWinner.textContent="";ceremonyAssignment.textContent="";
 let count=3;ceremonyCountdown.textContent=count;
 const timer=setInterval(()=>{count--;ceremonyCountdown.textContent=count>0?count:"SPIN!";if(count<0){clearInterval(timer);ceremonyCountdown.textContent=""}},700);
 function animate(now){
  const t=Math.min(1,(now-startTime)/duration);const ease=1-Math.pow(1-t,4);rotation=start+(end-start)*ease;drawWheel();
  if(t<1)requestAnimationFrame(animate);else{
   rotation=target;drawWheel();spinning=false;spinWheel.disabled=false;acceptWinner.disabled=false;
   ceremonyWinner.textContent=currentWinner.franchises?.name||"Franchise";
   const assignment=drawStage.value==="group"?`Selected for Group ${nextGroup.value}`:`Selected for ${nextPosition.value}`;
   ceremonyAssignment.textContent=assignment;winnerText.textContent=`${currentWinner.franchises?.name} — ${assignment}`;closeCeremony.hidden=false;
  }
 }
 requestAnimationFrame(animate);
}
spinWheel.onclick=spin;
closeCeremony.onclick=()=>ceremonyOverlay.hidden=true;
acceptWinner.onclick=async()=>{
 if(!currentWinner||!drawId)return;
 try{
  const stage=drawStage.value==="group"?"group":"position";
  const group=stage==="group"?nextGroup.value:currentWinner.group_code;
  const position=stage==="position"?nextPosition.value:null;
  const {error}=await odSb.rpc("admin_accept_draw_result",{p_draw_id:drawId,p_franchise_id:currentWinner.franchise_id,p_stage:stage,p_group_code:group,p_position_code:position,p_random_value:currentRandom});
  if(error)throw error;
  odMsg("Draw result accepted and written to the audit history.",true);
  if(stage==="group"){
   const a=entries.filter(e=>e.group_code==="A").length+(group==="A"?1:0);
   const b=entries.filter(e=>e.group_code==="B").length+(group==="B"?1:0);
   if(a<4&&b<4)nextGroup.value=group==="A"?"B":"A";else if(a>=4)nextGroup.value="B";else nextGroup.value="A";
  }
  ceremonyOverlay.hidden=true;await loadDrawData();
 }catch(e){odMsg(e.message)}
};
createDraw.onclick=async()=>{
 try{
  const {data,error}=await odSb.rpc("admin_create_tournament_draw",{p_draw_name:drawName.value});
  if(error)throw error;drawId=data;odMsg("New draw created with the eight active franchises.",true);await loadDrawData();
 }catch(e){odMsg(e.message)}
};
lockDraw.onclick=async()=>{
 if(!drawId)return odMsg("Create a draw first.");
 try{const {error}=await odSb.rpc("admin_lock_tournament_draw",{p_draw_id:drawId});if(error)throw error;odMsg("Draw locked and live. Franchise list cannot change during the ceremony.",true);await loadDrawData()}catch(e){odMsg(e.message)}
};
undoSpin.onclick=async()=>{
 if(!drawId||!confirm("Undo the last accepted spin? The audit record will remain marked as undone."))return;
 try{const {error}=await odSb.rpc("admin_undo_last_draw_spin",{p_draw_id:drawId});if(error)throw error;odMsg("Last spin undone.",true);await loadDrawData()}catch(e){odMsg(e.message)}
};
resetDraw.onclick=async()=>{
 if(!drawId||!confirm("Reset every group, position and spin in this draw?"))return;
 try{const {error}=await odSb.rpc("admin_reset_tournament_draw",{p_draw_id:drawId});if(error)throw error;odMsg("Draw fully reset.",true);await loadDrawData()}catch(e){odMsg(e.message)}
};
generateFixtures.onclick=async()=>{
 if(!drawId)return odMsg("Create and complete the draw first.");
 if(!fixtureStartDate.value)return odMsg("Select the tournament start date.");
 if(!confirm("Generate and publish the official 15-match schedule? Existing fixtures previously generated by V25 will be replaced."))return;
 try{
  const {data,error}=await odSb.rpc("admin_generate_group_fixtures",{p_draw_id:drawId,p_start_date:fixtureStartDate.value,p_venue:fixtureVenue.value||"TNYPL Official Venue",p_ground:fixtureGround.value||"Ground 1",p_first_time:fixtureTime1.value,p_second_time:fixtureTime2.value});
  if(error)throw error;odMsg(`${data} matches generated and published to the Match Center.`,true);
 }catch(e){odMsg(e.message)}
};
drawStage.onchange=()=>{
 if(drawStage.value==="positionA")nextPosition.value="A1";
 if(drawStage.value==="positionB")nextPosition.value="B1";
 updatePool();
};
drawLogout.onclick=async()=>{await odSb.auth.signOut();location.href="admin.html"};
window.addEventListener("load",init);
