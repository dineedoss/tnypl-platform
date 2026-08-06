document.write('<script src="auction-shared.js"><\/script>');
window.addEventListener("load",()=>{
 let activeLotId=null;
 async function render(){
  try{
   const {settings,lot,player,leader}=await getCurrentLot();
   publicStatus.textContent=String(settings.status||"setup").toUpperCase();
   if(!player||!lot){publicPlayerName.textContent="Auction has not started";publicBid.textContent="0";publicLeader.textContent="No bids yet";return}
   activeLotId=lot.id;
   publicPlayerName.textContent=player.full_name;
   publicCategory.textContent=lot.category;
   publicCategory.className=`category-pill ${categoryClass(lot.category)}`;
   publicRole.textContent=player.primary_role||"Player";
   publicDistrict.textContent=player.district||"Tamil Nadu";
   publicAge.textContent=player.date_of_birth?`DOB ${player.date_of_birth}`:"Age verified";
   publicRating.textContent=player.coach_rating?`Coach rating ${player.coach_rating}/10`:"Coach evaluated";
   publicBase.textContent=`${lot.base_points} pts`;
   publicBid.textContent=lot.highest_bid||lot.base_points;
   publicLeader.textContent=leader?.name||"No bids yet";
   publicIncrement.textContent=`${lot.highest_bid&&lot.highest_bid>=2000?250:lot.highest_bid&&lot.highest_bid>=1000?100:50} pts`;
   publicInitials.textContent=initials(player.full_name);
   if(player.draft_photo_url){publicPhoto.innerHTML=`<img src="${player.draft_photo_url}" alt="">`}
   startTimer(publicTimer,lot.closes_at);
   await renderBids(lot.id);
   await renderWallets(leader?.id);
  }catch(e){showAuctionMessage("publicMessage",e.message)}
 }
 async function renderBids(lotId){
  const {data}=await auctionSb.from("auction_bids").select("bid_points,created_at,franchises(name)").eq("lot_id",lotId).eq("accepted",true).order("created_at",{ascending:false}).limit(12);
  publicBidHistory.innerHTML=data?.length?data.map(b=>`<div class="bid-row"><div><strong>${b.franchises?.name||"Franchise"}</strong><span>${new Date(b.created_at).toLocaleTimeString()}</span></div><strong>${b.bid_points} pts</strong></div>`).join(""):'<div class="empty-state">No bids yet.</div>';
 }
 async function renderWallets(leadingId){
  const {data}=await auctionSb.from("franchise_wallets").select("allocated_points,credit_limit,points_spent,squad_count,is_locked,franchises(id,name,slug)").order("points_spent");
  publicWalletBoard.innerHTML=(data||[]).map(w=>{
   const balance=w.allocated_points-w.points_spent;
   return `<article class="franchise-tile ${w.franchises?.id===leadingId?"leading":""}"><strong>${w.franchises?.name||"Team"}</strong><span>Squad ${w.squad_count}/13</span><span> · </span><span>Spent <b>${w.points_spent}</b></span><br><span>Allocation left <b>${Math.max(balance,0)}</b></span>${balance<0?`<br><span>Excess <b>${Math.abs(balance)}</b></span>`:""}</article>`
  }).join("");
 }
 auctionSb.channel("public-auction").on("postgres_changes",{event:"*",schema:"public",table:"auction_settings"},render).on("postgres_changes",{event:"*",schema:"public",table:"auction_lots"},render).on("postgres_changes",{event:"INSERT",schema:"public",table:"auction_bids"},render).on("postgres_changes",{event:"*",schema:"public",table:"franchise_wallets"},render).subscribe();
 render();setInterval(render,10000);
});