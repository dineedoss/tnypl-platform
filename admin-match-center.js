const amCfg=window.TNYPL_CONFIG;
const amSb=supabase.createClient(amCfg.SUPABASE_URL,amCfg.SUPABASE_ANON_KEY);
let amSession=null,franchises=[];

function amMsg(text,ok=false){
 adminMatchMessage.hidden=false;adminMatchMessage.textContent=text;
 adminMatchMessage.style.background=ok?"#123e31":"#4c3910";
 setTimeout(()=>adminMatchMessage.hidden=true,6500);
}
function clearForm(){
 matchId.value="";matchFormTitle.textContent="Create Match";
 ["matchNumber","matchDay","matchDate","matchTime","matchVenue","matchGround","matchHomeScore","matchAwayScore","matchResult","matchPom","matchCricHeroes","matchYoutube","matchReplay","matchNotes"].forEach(id=>document.getElementById(id).value="");
 matchFormat.value="T30";matchStatus.value="scheduled";matchStream.value="false";matchPublished.value="false";matchHome.value="";matchAway.value="";matchWinner.value="";
}
function fillSelects(){
 const opts='<option value="">Select</option>'+franchises.map(f=>`<option value="${f.id}">${f.name}</option>`).join("");
 matchHome.innerHTML=opts;matchAway.innerHTML=opts;matchWinner.innerHTML='<option value="">No winner / pending</option>'+franchises.map(f=>`<option value="${f.id}">${f.name}</option>`).join("");
}
async function init(){
 const {data:{session}}=await amSb.auth.getSession();amSession=session;
 if(!session){location.href="admin.html";return}
 const {data:admin}=await amSb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
 if(!admin){location.href="admin.html";return}
 const {data,error}=await amSb.from("franchises").select("id,name,slug").eq("is_active",true).order("name");
 if(error)throw error;franchises=data||[];fillSelects();await loadMatches();
}
async function loadMatches(){
 const {data,error}=await amSb.from("matches").select(`
  *,
  home:franchises!matches_home_franchise_id_fkey(name),
  away:franchises!matches_away_franchise_id_fkey(name)
 `).order("match_date",{ascending:true}).order("start_time",{ascending:true});
 if(error){amMsg(error.message);return}
 adminMatchRows.innerHTML=(data||[]).map(m=>`<article class="admin-match-row">
 <div><h3>Match ${m.match_number||"—"} · ${m.home?.name||"TBA"} vs ${m.away?.name||"TBA"}</h3>
 <p>${m.match_date||"Date TBA"} · ${m.start_time||""} · ${m.status.toUpperCase()} · ${m.is_published?"PUBLISHED":"DRAFT"}</p>
 <p>${m.result_summary||m.venue||m.ground||""}</p></div>
 <div class="admin-match-actions"><button class="mc-button secondary" data-edit="${m.id}">EDIT</button><button class="mc-button danger" data-delete="${m.id}">DELETE</button></div>
 </article>`).join("")||"<p>No fixtures created yet.</p>";
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editMatch((data||[]).find(m=>m.id===b.dataset.edit)));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteMatch(b.dataset.delete));
}
function editMatch(m){
 matchId.value=m.id;matchFormTitle.textContent="Edit Match";
 matchNumber.value=m.match_number||"";matchDay.value=m.match_day||"";matchDate.value=m.match_date||"";matchTime.value=m.start_time||"";
 matchFormat.value=m.format||"T30";matchStatus.value=m.status||"scheduled";matchVenue.value=m.venue||"";matchGround.value=m.ground||"";
 matchHome.value=m.home_franchise_id||"";matchAway.value=m.away_franchise_id||"";matchHomeScore.value=m.home_score||"";matchAwayScore.value=m.away_score||"";
 matchResult.value=m.result_summary||"";matchWinner.value=m.winner_franchise_id||"";matchPom.value=m.player_of_match||"";
 matchCricHeroes.value=m.cricheroes_url||"";matchYoutube.value=m.youtube_url||"";matchReplay.value=m.youtube_replay_url||"";
 matchStream.value=String(!!m.stream_enabled);matchPublished.value=String(!!m.is_published);matchNotes.value=m.notes||"";
 window.scrollTo({top:0,behavior:"smooth"});
}
saveMatch.onclick=async()=>{
 try{
  if(matchHome.value&&matchHome.value===matchAway.value)throw new Error("Home and away franchises must be different.");
  const payload={
   match_number:matchNumber.value?Number(matchNumber.value):null,match_day:matchDay.value||null,match_date:matchDate.value||null,start_time:matchTime.value||null,
   format:matchFormat.value,venue:matchVenue.value||null,ground:matchGround.value||null,home_franchise_id:matchHome.value||null,away_franchise_id:matchAway.value||null,
   status:matchStatus.value,home_score:matchHomeScore.value||null,away_score:matchAwayScore.value||null,result_summary:matchResult.value||null,
   winner_franchise_id:matchWinner.value||null,player_of_match:matchPom.value||null,cricheroes_url:matchCricHeroes.value||null,
   youtube_url:matchYoutube.value||null,youtube_replay_url:matchReplay.value||null,stream_enabled:matchStream.value==="true",
   is_published:matchPublished.value==="true",notes:matchNotes.value||null,created_by:amSession.user.id
  };
  let q=matchId.value?amSb.from("matches").update(payload).eq("id",matchId.value):amSb.from("matches").insert(payload);
  const {error}=await q;if(error)throw error;amMsg("Match saved successfully.",true);clearForm();await loadMatches();
 }catch(e){amMsg(e.message)}
};
async function deleteMatch(id){
 if(!confirm("Delete this match record?"))return;
 const {error}=await amSb.from("matches").delete().eq("id",id);
 if(error)amMsg(error.message);else{amMsg("Match deleted.",true);await loadMatches()}
}
resetMatchForm.onclick=clearForm;
matchAdminLogout.onclick=async()=>{await amSb.auth.signOut();location.href="admin.html"};
window.addEventListener("load",init);
