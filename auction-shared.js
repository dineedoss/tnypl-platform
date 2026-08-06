const auctionCfg=window.TNYPL_CONFIG;
const auctionSb=supabase.createClient(auctionCfg.SUPABASE_URL,auctionCfg.SUPABASE_ANON_KEY);
const teamLogoMap={
 "chennai-strikers":"assets/franchise-logos/chennai-strikers.svg",
 "kovai-kings":"assets/franchise-logos/kovai-kings.svg",
 "karaikudi-kings":"assets/franchise-logos/karaikudi-kings.svg",
 "trichy-titans":"assets/franchise-logos/trichy-titans.svg",
 "nellai-falcons":"assets/franchise-logos/nellai-falcons.svg",
 "tiruppur-blazers":"assets/franchise-logos/tiruppur-blazers.svg",
 "thanjavur-royals":"assets/franchise-logos/thanjavur-royals.svg",
 "tuticorin-sharks":"assets/franchise-logos/tuticorin-sharks.svg"
};
function auctionMoney(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n||0))}
function categoryClass(c){return "category-"+String(c||"silver").toLowerCase()}
function initials(name){return String(name||"TNYPL").split(/\s+/).map(x=>x[0]).join("").slice(0,3).toUpperCase()}
function showAuctionMessage(id,text,success=false){const e=document.getElementById(id);if(!e)return;e.hidden=false;e.textContent=text;e.className="auction-alert"+(success?" auction-success":"");setTimeout(()=>e.hidden=true,6000)}
async function getCurrentLot(){
 const {data:settings,error}=await auctionSb.from("auction_settings").select("*").eq("id",1).single();
 if(error)throw error;
 if(!settings.current_player_id)return {settings,lot:null,player:null,leader:null};
 const {data:lots,error:le}=await auctionSb.from("auction_lots").select("*").eq("player_id",settings.current_player_id).order("created_at",{ascending:false}).limit(1);
 if(le)throw le;
 const lot=lots?.[0]||null;
 const {data:player,error:pe}=await auctionSb.from("players").select("id,full_name,date_of_birth,district,primary_role,cricheroes_url,draft_photo_url,draft_video_url,coach_rating,coach_notes,draft_category,draft_base_points").eq("id",settings.current_player_id).single();
 if(pe)throw pe;
 let leader=null;
 if(lot?.highest_franchise_id){
  const {data}=await auctionSb.from("franchises").select("id,name,slug").eq("id",lot.highest_franchise_id).single();leader=data;
 }
 return {settings,lot,player,leader};
}
function startTimer(element,closesAt){
 clearInterval(element._timer);
 const update=()=>{
  if(!closesAt){element.textContent="--:--";return}
  const secs=Math.max(0,Math.ceil((new Date(closesAt)-new Date())/1000));
  element.textContent=`${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`;
  element.classList.toggle("urgent",secs<=10&&secs>0);
 };
 update();element._timer=setInterval(update,500);
}
