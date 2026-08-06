document.write('<script src="auction-shared.js"><\/script>');
window.addEventListener("load",async()=>{
 let profile,franchise,wallet,currentLot,settings;
 const {data:{session}}=await auctionSb.auth.getSession();
 if(!session){location.href="owner-login.html";return}
 ownerLogout.onclick=async()=>{await auctionSb.auth.signOut();location.href="owner-login.html"};
 async function loadIdentity(){
  const {data,error}=await auctionSb.from("franchise_members").select("full_name,franchise_id,member_role,can_bid,can_view_settlement,franchises(id,name,slug)").eq("user_id",session.user.id).eq("is_active",true).order("is_primary_owner",{ascending:false}).limit(1).single();
  if(error)throw error;profile=data;franchise=data.franchises;
  ownerWelcome.textContent=`WELCOME, ${profile.full_name||session.user.email}`;ownerTeam.textContent=franchise.name;ownerLogo.src=teamLogoMap[franchise.slug]||"tnypl-official-logo.png";
 }
 async function render(){
  try{
   const {data:w,error}=await auctionSb.from("franchise_wallets").select("*").eq("franchise_id",profile.franchise_id).single();if(error)throw error;wallet=w;
   const cur=await getCurrentLot();settings=cur.settings;currentLot=cur.lot;
   ownerAllocated.textContent=`${wallet.allocated_points} pts`;ownerSpent.textContent=`${wallet.points_spent} pts`;
   const balance=wallet.allocated_points-wallet.points_spent,capacity=wallet.allocated_points+wallet.credit_limit-wallet.points_spent;
   ownerBalance.textContent=`${Math.max(balance,0)} pts`;ownerCredit.textContent=`${Math.max(wallet.credit_limit-Math.max(wallet.points_spent-wallet.allocated_points,0),0)} pts`;
   ownerPower.textContent=`${capacity} pts`;ownerSquad.textContent=wallet.squad_count;
   ownerPayable.textContent=auctionMoney(Math.max(wallet.points_spent-wallet.allocated_points,0)*Number(settings.points_to_rupees||10));
   const pct=Math.min(100,wallet.points_spent/wallet.allocated_points*100);ownerMeter.querySelector("span").style.width=`${pct}%`;ownerMeter.classList.toggle("excess",wallet.points_spent>wallet.allocated_points);
   if(!cur.player||!currentLot){ownerPlayerName.textContent="Waiting for admin";ownerBidButton.disabled=true;return}
   ownerPlayerName.textContent=cur.player.full_name;ownerCategory.textContent=currentLot.category;ownerCategory.className=`category-pill ${categoryClass(currentLot.category)}`;
   ownerRole.textContent=cur.player.primary_role||"Player";ownerDistrict.textContent=cur.player.district||"Tamil Nadu";ownerRating.textContent=cur.player.coach_rating?`${cur.player.coach_rating}/10 rating`:"Coach evaluated";
   ownerCricHeroes.href=cur.player.cricheroes_url||"#";ownerCurrentBid.textContent=currentLot.highest_bid||currentLot.base_points;ownerLeader.textContent=cur.leader?.name||"No bids";
   ownerInitials.textContent=initials(cur.player.full_name);if(cur.player.draft_photo_url)ownerPhoto.innerHTML=`<img src="${cur.player.draft_photo_url}" alt="">`;
   startTimer(ownerTimer,currentLot.closes_at);
   const min=Math.max(currentLot.base_points,(currentLot.highest_bid||currentLot.base_points-50)+(currentLot.highest_bid>=2000?250:currentLot.highest_bid>=1000?100:50));
   ownerBidInput.min=min;ownerBidInput.value=min;ownerBidButton.disabled=currentLot.status!=="open"||settings.status!=="open"||wallet.is_locked||wallet.squad_count>=13;
   const projected=Math.max(wallet.points_spent+min-wallet.allocated_points,0);
   ownerBidWarning.hidden=projected<=0;ownerBidWarning.textContent=projected>0?`This bid enters excess credit. If you win at ${min} points, projected additional payment is ${auctionMoney(projected*Number(settings.points_to_rupees||10))}.`:"";
   await renderBids(currentLot.id);
  }catch(e){showAuctionMessage("ownerMessage",e.message)}
 }
 async function renderBids(lotId){
  const {data}=await auctionSb.from("auction_bids").select("bid_points,created_at,franchise_id,franchises(name)").eq("lot_id",lotId).eq("accepted",true).order("created_at",{ascending:false}).limit(20);
  ownerBidHistory.innerHTML=data?.length?data.map(b=>`<div class="bid-row"><div><strong>${b.franchises?.name||"Team"}${b.franchise_id===profile.franchise_id?" · YOU":""}</strong><span>${new Date(b.created_at).toLocaleTimeString()}</span></div><strong>${b.bid_points} pts</strong></div>`).join(""):'<div class="empty-state">No bids yet.</div>';
 }
 ownerBidButton.onclick=async()=>{
  try{
   if(!currentLot)throw new Error("No active auction");
   const amount=Number(ownerBidInput.value);const projected=Math.max(wallet.points_spent+amount-wallet.allocated_points,0);
   if(projected>0&&!confirm(`This bid may create an excess payment obligation. Projected excess if won: ${projected} points (${auctionMoney(projected*Number(settings.points_to_rupees||10))}). Continue?`))return;
   ownerBidButton.disabled=true;
   const {data,error}=await auctionSb.rpc("place_auction_bid",{p_lot_id:currentLot.id,p_bid_points:amount});if(error)throw error;
   showAuctionMessage("ownerMessage",`Bid accepted: ${amount} points`,true);await render();
  }catch(e){showAuctionMessage("ownerMessage",e.message)}finally{ownerBidButton.disabled=false}
 };
 document.querySelectorAll("[data-bid-plus]").forEach(b=>b.onclick=()=>ownerBidInput.value=Number(ownerBidInput.value||0)+Number(b.dataset.bidPlus));
 ownerBidInput.oninput=()=>{
  if(!wallet||!settings)return;const projected=Math.max(wallet.points_spent+Number(ownerBidInput.value||0)-wallet.allocated_points,0);
  ownerBidWarning.hidden=projected<=0;ownerBidWarning.textContent=projected>0?`Projected excess payment if won: ${auctionMoney(projected*Number(settings.points_to_rupees||10))}`:"";
 };
 await loadIdentity();await render();
 auctionSb.channel("owner-auction").on("postgres_changes",{event:"*",schema:"public",table:"auction_settings"},render).on("postgres_changes",{event:"*",schema:"public",table:"auction_lots"},render).on("postgres_changes",{event:"INSERT",schema:"public",table:"auction_bids"},render).on("postgres_changes",{event:"*",schema:"public",table:"franchise_wallets"},render).subscribe();
 setInterval(render,10000);
});