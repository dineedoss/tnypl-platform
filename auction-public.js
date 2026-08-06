document.write('<script src="auction-shared.js"><\/script>');
window.addEventListener("load",()=>{
 function streamEmbedUrl(url){
  try{
   const u=new URL(url);
   if(u.hostname.includes("youtube.com")){
    const id=u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop();
    return id?`https://www.youtube.com/embed/${id}?autoplay=0`:"";
   }
   if(u.hostname==="youtu.be"){
    return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=0`;
   }
   if(u.hostname.includes("vimeo.com")){
    const id=u.pathname.split("/").filter(Boolean).pop();
    return id?`https://player.vimeo.com/video/${id}`:"";
   }
  }catch{}
  return "";
 }

 async function render(){
  try{
   const {settings,lot,player,leader}=await getCurrentLot();
   const status=String(settings.status||"setup").toLowerCase();

   if(settings.live_stream_enabled&&settings.live_stream_url){
    publicBroadcast.hidden=false;
    publicStreamLabel.textContent=settings.stream_label||"Watch the TNYPL Live Auction";
    publicStreamButton.href=settings.live_stream_url;
    const embed=streamEmbedUrl(settings.live_stream_url);
    publicStreamEmbed.innerHTML=embed?`<div class="stream-frame"><iframe src="${embed}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`:"";
   }else{
    publicBroadcast.hidden=true;
    publicStreamEmbed.innerHTML="";
   }

   const showLive=!!(settings.public_visible&&player&&lot&&["open","paused","sold","unsold"].includes(status));
   publicLiveContent.hidden=!showLive;
   publicWaiting.hidden=showLive;

   if(!showLive){
    publicWaitingTitle.textContent=status==="closed"?"Auction Completed":"Auction Not Started";
    publicWaitingMessage.textContent=status==="closed"
      ?"The TNYPL Season 1 player auction has concluded. Final squads and auction results will be published shortly."
      :(settings.public_message||"The TNYPL player auction has not started yet. Please stay tuned.");
    return;
   }

   publicStatus.textContent=status.toUpperCase();
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
   publicPhoto.innerHTML=player.draft_photo_url?`<img src="${player.draft_photo_url}" alt="">`:`<span class="initials">${initials(player.full_name)}</span>`;
   startTimer(publicTimer,lot.closes_at);
   await renderBids(lot.id);
   await renderWallets(leader?.id);
  }catch(e){showAuctionMessage("publicMessage",e.message)}
 }

 async function renderBids(lotId){
  const {data}=await auctionSb.from("auction_bids").select("bid_points,created_at,franchises(name)")
   .eq("lot_id",lotId).eq("accepted",true).order("created_at",{ascending:false}).limit(12);
  publicBidHistory.innerHTML=data?.length?data.map(b=>`<div class="bid-row"><div><strong>${b.franchises?.name||"Franchise"}</strong><span>${new Date(b.created_at).toLocaleTimeString()}</span></div><strong>${b.bid_points} pts</strong></div>`).join(""):'<div class="empty-state">No bids yet.</div>';
 }

 async function renderWallets(leadingId){
  const {data}=await auctionSb.from("franchise_wallets").select("allocated_points,credit_limit,points_spent,squad_count,is_locked,franchises(id,name,slug)").order("points_spent");
  const valid=(data||[]).filter(w=>w.franchises?.name&&!/^Franchise\s+\d+$/i.test(w.franchises.name));
  publicWalletBoard.innerHTML=valid.map(w=>{
   const balance=w.allocated_points-w.points_spent;
   return `<article class="franchise-tile ${w.franchises?.id===leadingId?"leading":""}">
    <strong>${w.franchises.name}</strong>
    <span>Squad ${w.squad_count} / 13 players</span><br>
    <span>Spent <b>${w.points_spent} pts</b></span><br>
    <span>Allocation left <b>${Math.max(balance,0)} pts</b></span>
    ${w.is_locked?'<br><span>Bid access <b>LOCKED</b></span>':""}
   </article>`;
  }).join("");
 }

 auctionSb.channel("public-auction-v23")
  .on("postgres_changes",{event:"*",schema:"public",table:"auction_settings"},render)
  .on("postgres_changes",{event:"*",schema:"public",table:"auction_lots"},render)
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"auction_bids"},render)
  .on("postgres_changes",{event:"*",schema:"public",table:"franchise_wallets"},render)
  .subscribe();

 render();
 setInterval(render,10000);
});