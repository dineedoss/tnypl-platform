const scSb=supabase.createClient(TNYPL_CONFIG.SUPABASE_URL,TNYPL_CONFIG.SUPABASE_ANON_KEY);
const modules=[
 ["Player registrations","players"],
 ["Franchises","franchises"],
 ["Owner profiles","owner_profiles"],
 ["Auction settings","auction_settings"],
 ["Auction lots","auction_lots"],
 ["Matches","matches"],
 ["Tournament draws","tournament_draws"]
];
async function run(){
 let rows=[];
 for(const [label,table] of modules){
  try{
   const {error}=await scSb.from(table).select("*",{head:true,count:"exact"});
   rows.push(`<div class="row"><strong>${label}</strong><span class="${error?"warn":"ok"}">${error?"Migration not detected":"READY"}</span></div>`);
  }catch(e){rows.push(`<div class="row"><strong>${label}</strong><span class="warn">Migration not detected</span></div>`)}
 }
 checks.className="";
 checks.innerHTML=rows.join("");
}
run();
