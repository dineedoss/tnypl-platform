const db=supabase.createClient(
  TNYPL_CONFIG.SUPABASE_URL,
  TNYPL_CONFIG.SUPABASE_ANON_KEY
);

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

async function render(){
  const matchResult=await db
    .from("matches")
    .select("*")
    .eq("is_published",true)
    .order("match_date",{ascending:true})
    .order("start_time",{ascending:true})
    .order("match_number",{ascending:true});

  if(matchResult.error){
    console.error("Match Center query failed:",matchResult.error);
    publicMatches.innerHTML='<div class="v25-panel"><h3>Fixtures are temporarily unavailable.</h3><p>Please check again shortly.</p></div>';
    return;
  }

  const matches=matchResult.data||[];
  const ids=[...new Set(matches.flatMap(m=>[
    m.team_a_id,m.team_b_id,m.home_franchise_id,m.away_franchise_id
  ]).filter(Boolean))];

  let franchiseMap=new Map();

  if(ids.length){
    const franchiseResult=await db
      .from("franchises")
      .select("id,name,slug")
      .in("id",ids);

    if(franchiseResult.error){
      console.error("Franchise lookup failed:",franchiseResult.error);
    }else{
      franchiseMap=new Map((franchiseResult.data||[]).map(f=>[f.id,f]));
    }
  }

  publicMatches.innerHTML=matches.map(m=>{
    const teamAId=m.team_a_id||m.home_franchise_id;
    const teamBId=m.team_b_id||m.away_franchise_id;
    const teamA=franchiseMap.get(teamAId);
    const teamB=franchiseMap.get(teamBId);
    const status=(m.status||"scheduled").toLowerCase();
    const chip=status==="live"?"live":status==="completed"?"done":"";

    return `<article class="match-card ${status==="live"?"live":""}">
      <span class="chip ${chip}">${escapeHtml(status.toUpperCase())}</span>
      <p style="color:#a8b8cd;font-size:.72rem">
        Match ${escapeHtml(m.match_number||"—")} ·
        ${escapeHtml(m.match_date||"Date TBA")} ·
        ${escapeHtml(m.start_time||"")} ·
        ${escapeHtml(m.format||"T20")}
      </p>
      <div class="team-line">
        <strong>${escapeHtml(teamA?.name||m.team_a_name||"TBA")}</strong>
        <span class="score">${escapeHtml(m.team_a_score||m.home_score||"—")}</span>
      </div>
      <div class="team-line">
        <strong>${escapeHtml(teamB?.name||m.team_b_name||"TBA")}</strong>
        <span class="score">${escapeHtml(m.team_b_score||m.away_score||"—")}</span>
      </div>
      <p>${escapeHtml(m.result_summary||m.venue||m.ground||"Venue TBA")}</p>
      <div class="actions">
        ${m.cricheroes_url?`<a href="${escapeHtml(m.cricheroes_url)}" target="_blank" rel="noopener noreferrer">SCORECARD</a>`:""}
        ${m.stream_enabled&&m.youtube_url?`<a class="live" href="${escapeHtml(m.youtube_url)}" target="_blank" rel="noopener noreferrer">WATCH LIVE</a>`:""}
        ${m.youtube_replay_url?`<a href="${escapeHtml(m.youtube_replay_url)}" target="_blank" rel="noopener noreferrer">REPLAY</a>`:""}
        ${m.map_url?`<a class="map" href="${escapeHtml(m.map_url)}" target="_blank" rel="noopener noreferrer">DIRECTIONS</a>`:""}
      </div>
    </article>`;
  }).join("")||'<div class="v25-panel"><h3>No fixtures published yet.</h3></div>';

  const sponsorResult=await db
    .from("sponsors")
    .select("*")
    .eq("is_active",true)
    .order("display_order");

  const sponsors=sponsorResult.data||[];
  matchSponsors.innerHTML=sponsors.map(x=>{
    const logo=`<div class="sponsor-card"><img src="${escapeHtml(x.logo_path)}" alt="${escapeHtml(x.name)}"></div>`;
    return `<div>${x.website_url
      ? `<a href="${escapeHtml(x.website_url)}" target="_blank" rel="noopener noreferrer">${logo}</a>`
      : logo}<div class="sponsor-name">${escapeHtml(x.name)}</div></div>`;
  }).join("");
}

render();
db.channel("matches-v26")
  .on("postgres_changes",{event:"*",schema:"public",table:"matches"},render)
  .subscribe();
