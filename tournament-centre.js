const cfg=window.TNYPL_CONFIG||{};
const client=window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const fmtDate=v=>v?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v)):"—";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function loadTournamentCentre(){
 if(!client)return;
 const [matchesRes, standingsRes, statsRes, settingsRes]=await Promise.all([
   client.from("matches").select("*").order("match_number"),
   client.from("team_standings").select("*").order("points",{ascending:false}).order("net_run_rate",{ascending:false}),
   client.from("player_tournament_stats").select("*"),
   client.from("league_settings").select("key,value").in("key",["live_match_id","live_youtube_video_id"])
 ]);
 const matches=matchesRes.data||[], standings=standingsRes.data||[], stats=statsRes.data||[];
 const settings=Object.fromEntries((settingsRes.data||[]).map(x=>[x.key,x.value]));
 const live=matches.find(m=>m.id===settings.live_match_id)||matches.find(m=>m.status==="live");
 if(live){
   tcMatchTeams.textContent=`${live.team_a_name} vs ${live.team_b_name}`;
   tcScore.textContent=live.live_score||"Live";
   tcOvers.textContent=live.live_overs||"";
   tcSituation.textContent=live.live_situation||"";
 }
 const video=settings.live_youtube_video_id;
 if(video){
   youtubeEmbed.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(video)}" title="TNYPL live stream" allowfullscreen></iframe>`;
 }
 scheduleRows.innerHTML=matches.length?matches.map(m=>`<tr><td>${m.match_number||"—"}</td><td>${fmtDate(m.match_date)}</td><td>${esc(m.match_time||"")}</td><td>${esc(m.team_a_name)} vs ${esc(m.team_b_name)}</td><td>${esc(m.venue_name||"Official Venue")}</td><td><span class="status-pill ${esc(m.status)}">${esc(m.status||"upcoming")}</span></td></tr>`).join(""):'<tr><td colspan="6">Schedule will be published here.</td></tr>';
 standingsRows.innerHTML=standings.length?standings.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.team_name)}</td><td>${s.played||0}</td><td>${s.won||0}</td><td>${s.lost||0}</td><td>${s.no_result||0}</td><td>${Number(s.net_run_rate||0).toFixed(3)}</td><td><b>${s.points||0}</b></td></tr>`).join(""):'<tr><td colspan="8">Standings will update after results are recorded.</td></tr>';
 const orange=[...stats].sort((a,b)=>(b.runs||0)-(a.runs||0)).slice(0,10);
 const purple=[...stats].sort((a,b)=>(b.wickets||0)-(a.wickets||0)).slice(0,10);
 orangeCapRows.innerHTML=orange.length?orange.map((p,i)=>`<div><b>${i+1}</b><span><strong>${esc(p.player_name)}</strong><small>${esc(p.franchise_name||"")}</small></span><em>${p.runs||0} runs</em></div>`).join(""):"<p>No batting statistics yet.</p>";
 purpleCapRows.innerHTML=purple.length?purple.map((p,i)=>`<div><b>${i+1}</b><span><strong>${esc(p.player_name)}</strong><small>${esc(p.franchise_name||"")}</small></span><em>${p.wickets||0} wickets</em></div>`).join(""):"<p>No bowling statistics yet.</p>";
 const completed=matches.filter(m=>m.status==="completed");
 resultsGrid.innerHTML=completed.length?completed.map(m=>`<article><small>MATCH ${m.match_number}</small><h3>${esc(m.team_a_name)} vs ${esc(m.team_b_name)}</h3><strong>${esc(m.result_text||"Result published")}</strong><a href="${esc(m.scorecard_url||"#")}">Full Scorecard</a></article>`).join(""):"<article><strong>No results published yet.</strong></article>";
}
loadTournamentCentre();
