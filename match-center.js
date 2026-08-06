const mcCfg=window.TNYPL_CONFIG;
const mcSb=supabase.createClient(mcCfg.SUPABASE_URL,mcCfg.SUPABASE_ANON_KEY);
let mcFilter="all";

function mcDate(m){
 if(!m.match_date)return "Date to be announced";
 const d=new Date(m.match_date+"T12:00:00");
 return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"});
}
function mcTime(v){
 if(!v)return "";
 const [h,m]=v.split(":");const d=new Date();d.setHours(Number(h),Number(m));
 return d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
}
function mcStatusChip(s){
 const map={live:["LIVE","live-chip"],completed:["COMPLETED","completed"],scheduled:["UPCOMING","scheduled"],abandoned:["ABANDONED","cancelled"],cancelled:["CANCELLED","cancelled"]};
 return map[s]||[String(s||"scheduled").toUpperCase(),"scheduled"];
}
function ytEmbed(url){
 try{
  const u=new URL(url);
  if(u.hostname.includes("youtu.be"))return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
  if(u.hostname.includes("youtube.com")){
   const id=u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop();
   return id?`https://www.youtube.com/embed/${id}`:"";
  }
 }catch{}
 return "";
}
async function loadMatchCenter(){
 const {data,error}=await mcSb.from("matches").select(`
  *,
  home:franchises!matches_home_franchise_id_fkey(id,name,slug),
  away:franchises!matches_away_franchise_id_fkey(id,name,slug),
  winner:franchises!matches_winner_franchise_id_fkey(id,name)
 `).eq("is_published",true).order("match_date").order("start_time");
 if(error){matchCenterMessage.hidden=false;matchCenterMessage.textContent=error.message;return}
 const matches=data||[];
 const shown=mcFilter==="all"?matches:matches.filter(m=>m.status===mcFilter);
 matchCards.innerHTML=shown.map(m=>{
  const [label,cls]=mcStatusChip(m.status);
  const scoreUrl=m.cricheroes_url?`<a href="${m.cricheroes_url}" target="_blank" rel="noopener">LIVE SCORE / SCORECARD</a>`:"";
  const watch=m.stream_enabled&&m.youtube_url?`<a class="watch" href="${m.youtube_url}" target="_blank" rel="noopener">WATCH LIVE</a>`:"";
  const replay=m.youtube_replay_url?`<a class="replay" href="${m.youtube_replay_url}" target="_blank" rel="noopener">WATCH REPLAY</a>`:"";
  return `<article class="match-card ${m.status==="live"?"live":""}">
   <span class="status-chip ${cls}">${label}</span>
   <div class="match-meta"><span>Match ${m.match_number||"—"} · ${m.format}</span><span>${mcDate(m)} ${mcTime(m.start_time)}</span></div>
   <div class="match-teams">
    <div class="match-team"><strong>${m.home?.name||"TBA"}</strong><span class="match-score">${m.home_score||"—"}</span></div>
    <div class="match-team"><strong>${m.away?.name||"TBA"}</strong><span class="match-score">${m.away_score||"—"}</span></div>
   </div>
   <p class="match-result">${m.result_summary||`${m.venue||m.ground||"Venue to be announced"}`}</p>
   ${m.player_of_match?`<p style="color:#d9ad43;font-weight:800">Player of the Match: ${m.player_of_match}</p>`:""}
   <div class="match-actions">${scoreUrl}${watch}${replay}</div>
  </article>`;
 }).join("")||'<div class="panel"><h3>No matches published yet</h3><p style="color:#9fb0c5">The official schedule will appear here once published by TNYPL.</p></div>';

 renderPoints(matches);
}
function renderPoints(matches){
 const teams={};
 matches.forEach(m=>{
  [m.home,m.away].forEach(t=>{if(t&&!teams[t.id])teams[t.id]={name:t.name,p:0,w:0,l:0,nr:0,pts:0,nrr:"—"}});
  if(!["completed","abandoned"].includes(m.status))return;
  if(m.home)teams[m.home.id].p++;
  if(m.away)teams[m.away.id].p++;
  if(m.status==="abandoned"){
   if(m.home){teams[m.home.id].nr++;teams[m.home.id].pts++}
   if(m.away){teams[m.away.id].nr++;teams[m.away.id].pts++}
  }else if(m.winner_franchise_id){
   const loser=m.winner_franchise_id===m.home_franchise_id?m.away_franchise_id:m.home_franchise_id;
   teams[m.winner_franchise_id].w++;teams[m.winner_franchise_id].pts+=2;
   if(teams[loser])teams[loser].l++;
  }
 });
 pointsTableRows.innerHTML=Object.values(teams).sort((a,b)=>b.pts-a.pts||b.w-a.w).map(t=>`<tr><td><strong>${t.name}</strong></td><td>${t.p}</td><td>${t.w}</td><td>${t.l}</td><td>${t.nr}</td><td><strong>${t.pts}</strong></td><td>${t.nrr}</td></tr>`).join("")||'<tr><td colspan="7">No completed matches yet.</td></tr>';
}
document.querySelectorAll("[data-filter]").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll("[data-filter]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");mcFilter=btn.dataset.filter;loadMatchCenter();
});
mcSb.channel("public-matches").on("postgres_changes",{event:"*",schema:"public",table:"matches"},loadMatchCenter).subscribe();
loadMatchCenter();
