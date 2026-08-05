const sb=supabase.createClient(TNYPL_CONFIG.SUPABASE_URL,TNYPL_CONFIG.SUPABASE_ANON_KEY);
const fmt=n=>new Intl.NumberFormat("en-IN").format(Number(n||0));
(async()=>{
 const {data:setting}=await sb.from("league_settings").select("value").eq("key","league_status").maybeSingle();
 ccStatus.textContent=setting?.value||"Registration Open";
 const {data:stats}=await sb.rpc("get_public_site_stats_v12");
 if(stats){
  ccRegistrations.textContent=fmt(stats.registrations);ccVerified.textContent=fmt(stats.verified_players);ccEligible.textContent=fmt(stats.draft_eligible_players);ccDrafted.textContent=fmt(stats.drafted_players);ccRefunds.textContent=fmt(stats.refunds_processed);ccVisitors.textContent=fmt(stats.unique_visitors);ccCountries.textContent=fmt(stats.countries_reached);
 }
 const health=[
  ["Registration readiness",stats?.registrations>0?"On Track":"Needs Attention"],
  ["Verification progress",stats?.verified_players>0?"On Track":"Needs Attention"],
  ["Draft readiness",stats?.draft_eligible_players>=78?"Ready":"In Progress"],
  ["Franchise readiness","In Progress"],
  ["Media readiness","In Progress"],
  ["Tournament readiness","In Progress"]
 ];
 healthRows.innerHTML=health.map(x=>`<div><span>${x[0]}</span><b class="${x[1].toLowerCase().replaceAll(" ","-")}">${x[1]}</b></div>`).join("");
 const {data:logs}=await sb.from("player_audit_logs").select("*").order("created_at",{ascending:false}).limit(15);
 if(logs?.length)activityRows.innerHTML=logs.map(l=>`<div class="activity-item"><strong>${l.action}</strong><span>${new Date(l.created_at).toLocaleString()}</span><p>${l.notes||""}</p></div>`).join("");
})();