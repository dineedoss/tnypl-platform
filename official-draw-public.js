const pdCfg=window.TNYPL_CONFIG;
const pdSb=supabase.createClient(pdCfg.SUPABASE_URL,pdCfg.SUPABASE_ANON_KEY);

function showDrawNotStarted(){
  document.querySelector(".public-groups").style.display="none";
  document.querySelector(".draw-panel").style.display="none";
  TNYPL_PUBLIC_SAFE.empty(
    drawLoadingState,
    "🎡",
    "Official Draw Not Started",
    "The Commissioner has not conducted the Season 1 group draw yet. Groups, positions and the official fixture sequence will appear here during the live ceremony."
  );
}

async function loadPublicDraw(){
  TNYPL_PUBLIC_SAFE.loading(drawLoadingState,"Checking the official draw status…");
  try{
    const {data:draw,error}=await pdSb.from("tournament_draws")
      .select("*")
      .in("status",["live","completed","published"])
      .order("created_at",{ascending:false})
      .limit(1)
      .maybeSingle();

    if(error){
      console.error(error);
      showDrawNotStarted();
      return;
    }

    if(!draw){
      showDrawNotStarted();
      return;
    }

    const [{data:entries,error:entriesError},{data:history,error:historyError}]=await Promise.all([
      pdSb.from("tournament_draw_entries")
        .select("*,franchises(name)")
        .eq("draw_id",draw.id)
        .order("position_code"),
      pdSb.from("tournament_draw_history")
        .select("*,franchises(name)")
        .eq("draw_id",draw.id)
        .eq("accepted",true)
        .eq("undone",false)
        .order("spin_number",{ascending:false})
    ]);

    if(entriesError || historyError){
      console.error(entriesError || historyError);
      showDrawNotStarted();
      return;
    }

    drawLoadingState.innerHTML="";
    document.querySelector(".public-groups").style.display="grid";
    document.querySelector(".draw-panel").style.display="block";

    const render=g=>(entries||[])
      .filter(e=>e.group_code===g)
      .sort((a,b)=>(a.position_code||"Z").localeCompare(b.position_code||"Z"))
      .map(e=>`<div class="public-entry"><strong>${e.franchises?.name||"Franchise"}</strong><span>${e.position_code||"Group "+g}</span></div>`)
      .join("") || '<div class="public-entry">Waiting for the official draw</div>';

    publicGroupA.innerHTML=render("A");
    publicGroupB.innerHTML=render("B");

    publicHistory.innerHTML=(history||[]).map(h=>`
      <div class="history-row">
        <div>
          <strong>Spin ${h.spin_number}: ${h.franchises?.name||"Franchise"}</strong><br>
          <span>${h.stage==="group"?"Assigned to Group "+h.group_code:"Assigned position "+h.position_code}</span>
        </div>
        <span>${new Date(h.created_at).toLocaleTimeString()}</span>
      </div>`).join("") || "<p style='color:#9db0c8'>Waiting for the first accepted spin.</p>";
  }catch(error){
    console.error(error);
    showDrawNotStarted();
  }
}

pdSb.channel("public-official-draw")
  .on("postgres_changes",{event:"*",schema:"public",table:"tournament_draws"},loadPublicDraw)
  .on("postgres_changes",{event:"*",schema:"public",table:"tournament_draw_entries"},loadPublicDraw)
  .on("postgres_changes",{event:"*",schema:"public",table:"tournament_draw_history"},loadPublicDraw)
  .subscribe();

loadPublicDraw();
