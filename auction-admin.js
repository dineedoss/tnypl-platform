document.write('<script src="auction-shared.js"><\/script>');
window.addEventListener("load",async()=>{
 let selectedPlayer=null,currentLot=null,settings=null;
 const {data:{session}}=await auctionSb.auth.getSession();if(!session){location.href="admin.html";return}
 const {data:admin}=await auctionSb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();if(!admin){location.href="admin.html";return}
 adminAuctionLogout.onclick=async()=>{await auctionSb.auth.signOut();location.href="admin.html"};
 async function loadPlayers(){
  const {data,error}=await auctionSb.from("players").select("id,full_name,district,primary_role,draft_category,draft_base_points,draft_pool_approved,payment_verified,age_verified,status,drafted").eq("drafted",false).order("full_name");if(error)throw error;
  const q=adminPlayerSearch.value.toLowerCase();
  const filtered=(data||[]).filter(p=>(p.full_name+" "+(p.district||"")+" "+(p.primary_role||"")).toLowerCase().includes(q));
  adminPlayerList.innerHTML=filtered.map(p=>`<div class="player-list-row ${selectedPlayer?.id===p.id?"active":""}" data-player-id="${p.id}"><strong>${p.full_name}</strong><span>${p.primary_role||"Player"} · ${p.district||"—"} · ${p.payment_verified&&p.age_verified?"VERIFIED":"CHECK VERIFICATION"} · ${p.draft_category||"Uncategorized"}</span></div>`).join("")||'<div class="empty-state">No players found.</div>';
  adminPlayerList.querySelectorAll("[data-player-id]").forEach(row=>row.onclick=()=>{selectedPlayer=filtered.find(p=>p.id===row.dataset.playerId);adminSelectedPlayerId.value=selectedPlayer.id;adminSelectedName.value=selectedPlayer.full_name;adminCategory.value=selectedPlayer.draft_category||"Silver";adminBasePoints.value=selectedPlayer.draft_base_points||({Platinum:1000,Gold:600,Silver:300}[adminCategory.value]);loadPlayers()});
 }
 adminPlayerSearch.oninput=loadPlayers;adminCategory.onchange=()=>adminBasePoints.value=({Platinum:1000,Gold:600,Silver:300}[adminCategory.value]);
 async function render(){
  try{
   const cur=await getCurrentLot();settings=cur.settings;currentLot=cur.lot;
   adminCurrentPlayer.textContent=cur.player?.full_name||"—";adminCurrentBid.textContent=currentLot?`${currentLot.highest_bid||currentLot.base_points} pts`:"—";adminCurrentLeader.textContent=cur.leader?.name||"—";adminCurrentStatus.textContent=String(settings.status||"setup").toUpperCase();
   await loadWallets();if(currentLot)await loadBids(currentLot.id);
  }catch(e){showAuctionMessage("adminAuctionMessage",e.message)}
 }
 async function loadWallets(){
  const {data,error}=await auctionSb.from("franchise_wallets").select("*,franchises(name)").order("points_spent",{ascending:false});if(error)throw error;
  adminWalletTable.innerHTML=(data||[]).map(w=>{const excess=Math.max(w.points_spent-w.allocated_points,0),pay=excess*Number(settings?.points_to_rupees||10);return `<tr><td>${w.franchises?.name||"Team"}</td><td>${w.allocated_points}</td><td>${w.points_spent}</td><td>${Math.max(w.allocated_points-w.points_spent,0)}</td><td>${w.credit_limit}</td><td>${w.squad_count}/13</td><td class="${pay?"settlement-positive":"settlement-zero"}">${auctionMoney(pay)}</td><td><input type="checkbox" data-lock-franchise="${w.franchise_id}" ${w.is_locked?"checked":""}></td></tr>`}).join("");
  adminWalletTable.querySelectorAll("[data-lock-franchise]").forEach(c=>c.onchange=async()=>{const{error}=await auctionSb.from("franchise_wallets").update({is_locked:c.checked}).eq("franchise_id",c.dataset.lockFranchise);if(error)showAuctionMessage("adminAuctionMessage",error.message)});
 }
 async function loadBids(lotId){
  const {data}=await auctionSb.from("auction_bids").select("bid_points,created_at,accepted,rejection_reason,franchises(name)").eq("lot_id",lotId).order("created_at",{ascending:false}).limit(50);
  adminBidHistory.innerHTML=data?.length?data.map(b=>`<div class="bid-row"><div><strong>${b.franchises?.name||"Team"} ${b.accepted?"":"· REJECTED"}</strong><span>${new Date(b.created_at).toLocaleTimeString()}${b.rejection_reason?" · "+b.rejection_reason:""}</span></div><strong>${b.bid_points} pts</strong></div>`).join(""):'<div class="empty-state">No bids yet.</div>';
 }
 adminOpenAuction.onclick=async()=>{try{if(!selectedPlayer)throw new Error("Select a player first");const{data,error}=await auctionSb.rpc("admin_open_auction",{p_player_id:selectedPlayer.id,p_category:adminCategory.value,p_base_points:Number(adminBasePoints.value),p_timer_seconds:Number(adminTimerSeconds.value)});if(error)throw error;showAuctionMessage("adminAuctionMessage","Auction opened",true);await render();await loadPlayers()}catch(e){showAuctionMessage("adminAuctionMessage",e.message)}};
 adminPauseAuction.onclick=async()=>{const{error}=await auctionSb.rpc("admin_set_auction_status",{p_status:"paused"});if(error)showAuctionMessage("adminAuctionMessage",error.message);else render()};
 adminMarkSold.onclick=async()=>{try{if(!currentLot)throw new Error("No active lot");if(!confirm("Confirm SOLD to the current highest bidder?"))return;const{data,error}=await auctionSb.rpc("admin_finalize_auction",{p_lot_id:currentLot.id,p_result:"sold"});if(error)throw error;showAuctionMessage("adminAuctionMessage",`Sold to ${data.franchise} for ${data.points} points`,true);await render();await loadPlayers()}catch(e){showAuctionMessage("adminAuctionMessage",e.message)}};
 adminMarkUnsold.onclick=async()=>{try{if(!currentLot)throw new Error("No active lot");const{error}=await auctionSb.rpc("admin_finalize_auction",{p_lot_id:currentLot.id,p_result:"unsold"});if(error)throw error;showAuctionMessage("adminAuctionMessage","Player marked unsold",true);await render()}catch(e){showAuctionMessage("adminAuctionMessage",e.message)}};
 adminGenerateSettlement.onclick=async()=>{const{error}=await auctionSb.rpc("generate_auction_settlements");if(error)showAuctionMessage("adminAuctionMessage",error.message);else showAuctionMessage("adminAuctionMessage","Settlement statements generated",true)};
 await loadPlayers();await render();
 auctionSb.channel("admin-auction").on("postgres_changes",{event:"*",schema:"public",table:"auction_settings"},render).on("postgres_changes",{event:"*",schema:"public",table:"auction_lots"},render).on("postgres_changes",{event:"*",schema:"public",table:"auction_bids"},render).on("postgres_changes",{event:"*",schema:"public",table:"franchise_wallets"},render).subscribe();
 setInterval(render,10000);
});