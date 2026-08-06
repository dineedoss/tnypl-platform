
const cfg=window.TNYPL_CONFIG;
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
let session,myMembership,myFranchise;
const defaults={
 co_owner:{bid:true,watchlist:true,players:true,settlement:true},
 coach:{bid:false,watchlist:true,players:true,settlement:false},
 manager:{bid:false,watchlist:true,players:true,settlement:false},
 analyst:{bid:false,watchlist:true,players:false,settlement:false},
 viewer:{bid:false,watchlist:false,players:false,settlement:false}
};
function showMsg(t,ok=false){teamMessage.hidden=false;teamMessage.textContent=t;teamMessage.className="auction-alert"+(ok?" auction-success":"");setTimeout(()=>teamMessage.hidden=true,6500)}
function applyDefaults(){const d=defaults[memberRole.value]||defaults.viewer;permBid.checked=d.bid;permWatchlist.checked=d.watchlist;permPlayers.checked=d.players;permSettlement.checked=d.settlement}
memberRole.onchange=applyDefaults;

async function init(){
 const {data:{session:s}}=await sb.auth.getSession();session=s;
 if(!session){location.href="owner-login.html";return}
 const {data,error}=await sb.from("franchise_members").select("*,franchises(id,name,slug)")
  .eq("user_id",session.user.id).eq("is_active",true)
  .order("is_primary_owner",{ascending:false}).limit(1).maybeSingle();
 if(error||!data){showMsg("Your account is not linked to an active franchise.");return}
 myMembership=data;myFranchise=data.franchises;teamFranchise.textContent=myFranchise.name.toUpperCase();
 if(!myMembership.can_manage_members)document.querySelector(".team-form").innerHTML="<h1>View-only access</h1><p>Contact the primary owner to manage franchise members.</p>";
 applyDefaults();await loadMembers();
}
async function loadMembers(){
 const {data,error}=await sb.from("franchise_members").select("*").eq("franchise_id",myFranchise.id).order("is_primary_owner",{ascending:false}).order("invited_at");
 if(error)throw error;
 memberRows.innerHTML=(data||[]).map(m=>`<article class="member-card"><div><h3>${m.full_name}</h3><p>${m.email}</p><div class="member-badges">
 ${m.is_primary_owner?'<span class="member-badge primary">PRIMARY OWNER</span>':`<span class="member-badge">${m.member_role.replace("_"," ").toUpperCase()}</span>`}
 ${m.can_bid?'<span class="member-badge">BID</span>':''}${m.can_manage_watchlist?'<span class="member-badge">WATCHLIST</span>':''}${m.can_manage_players?'<span class="member-badge">PLAYER NOTES</span>':''}${m.can_view_settlement?'<span class="member-badge">SETTLEMENT</span>':''}${!m.is_active?'<span class="member-badge inactive">DISABLED</span>':''}
 </div></div><div class="member-actions">${!m.is_primary_owner&&myMembership.can_manage_members?`<button class="edit-member" data-edit="${m.id}">EDIT</button><button class="remove-member" data-remove="${m.id}">REMOVE</button>`:""}</div></article>`).join("")||"<p>No members found.</p>";
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editMember(data.find(m=>m.id===b.dataset.edit)));
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>removeMember(data.find(m=>m.id===b.dataset.remove)));
}
async function api(payload){
 const r=await fetch("/.netlify/functions/franchise-member-admin",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({...payload,franchise_id:myFranchise.id})});
 const b=await r.json();if(!r.ok)throw new Error(b.error||"Unable to manage member");return b;
}
inviteMember.onclick=async()=>{
 try{
  const full_name=memberName.value.trim(),email=memberEmail.value.trim();
  if(!full_name||!email)throw new Error("Enter name and email.");
  inviteMember.disabled=true;inviteMember.textContent="SENDING…";
  const b=await api({action:"invite",full_name,email,member_role:memberRole.value,can_bid:permBid.checked,can_manage_watchlist:permWatchlist.checked,can_manage_players:permPlayers.checked,can_view_settlement:permSettlement.checked});
  showMsg(b.message,true);memberName.value="";memberEmail.value="";memberRole.value="co_owner";applyDefaults();await loadMembers();
 }catch(e){showMsg(e.message)}finally{inviteMember.disabled=false;inviteMember.textContent="SEND TEAM INVITATION"}
};
async function editMember(m){
 const role=prompt("Role: co_owner, coach, manager, analyst or viewer",m.member_role);if(!role)return;
 const canBid=confirm("Allow this member to place bids?");
 const canSettlement=confirm("Allow this member to see settlement information?");
 try{const b=await api({action:"update",member_id:m.id,member_role:role,can_bid:canBid,can_manage_watchlist:true,can_manage_players:["co_owner","coach","manager"].includes(role),can_view_settlement:canSettlement,is_active:true});showMsg(b.message,true);await loadMembers()}catch(e){showMsg(e.message)}
}
async function removeMember(m){
 if(!confirm(`Remove active access for ${m.full_name}?`))return;
 try{const b=await api({action:"remove",member_id:m.id});showMsg(b.message,true);await loadMembers()}catch(e){showMsg(e.message)}
}
refreshMembers.onclick=()=>loadMembers().catch(e=>showMsg(e.message));
teamLogout.onclick=async()=>{await sb.auth.signOut();location.href="owner-login.html"};
window.addEventListener("load",init);
