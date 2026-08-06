const ccCfg=window.TNYPL_CONFIG;
const ccSb=supabase.createClient(ccCfg.SUPABASE_URL,ccCfg.SUPABASE_ANON_KEY);

async function countSafe(table,filter){
  try{
    let q=ccSb.from(table).select("*",{count:"exact",head:true});
    if(filter)q=q.eq(filter.column,filter.value);
    const {count,error}=await q;
    if(error)throw error;
    return count??0;
  }catch(e){console.error(e);return "—"}
}

async function loadCommissionerDashboard(){
  const {data:{session}}=await ccSb.auth.getSession();
  if(!session){location.href="admin.html";return}
  const {data:admin}=await ccSb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
  if(!admin){location.href="admin.html";return}

  statusRegistrations.textContent=await countSafe("players");
  statusOwners.textContent=await countSafe("owner_profiles");
  statusMatches.textContent=await countSafe("matches",{column:"is_published",value:true});
  try{
    const {data,error}=await ccSb.from("tournament_draws").select("status").order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;
    statusDraw.textContent=data?.status?data.status.toUpperCase():"NOT STARTED";
  }catch(e){
    console.error(e);
    statusDraw.textContent="NOT STARTED";
  }
}
loadCommissionerDashboard();
