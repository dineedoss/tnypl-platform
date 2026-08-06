const cfg=window.TNYPL_CONFIG;
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
let session=null;

const foundingOwners=[
 {slug:"chennai-strikers",franchise:"Chennai Strikers",owner:"Vimalesh Vedachalam",email:"vim22veda@gmail.com"},
 {slug:"kovai-kings",franchise:"Kovai Kings",owner:"Gopi Ramadoss",email:"Gopiramadoss@gmail.com"},
 {slug:"karaikudi-kings",franchise:"Karaikudi Kings",owner:"Porkai Pandian Gopalakrishnan",email:"porkai@cakepoint.in"},
 {slug:"trichy-titans",franchise:"Trichy Titans",owner:"Satish Raja",email:"Satishraja1509@gmail.com"},
 {slug:"nellai-falcons",franchise:"Nellai Falcons",owner:"Ramanathan Periyaraja",email:"rohan.ramanathan@gmail.com"},
 {slug:"tiruppur-blazers",franchise:"Tiruppur Blazers",owner:"P. C. Binny Jo",email:"binny.jo@rediffmail.com"},
 {slug:"thanjavur-royals",franchise:"Thanjavur Royals",owner:"Santhana Krishnan",email:"Santhanakrishnan1982@gmail.com"},
 {slug:"tuticorin-sharks",franchise:"Tuticorin Sharks",owner:"Suresh Durai",email:"d.suresh2003@gmail.com"}
];

const logoMap={
 "chennai-strikers":"assets/franchise-logos/chennai-strikers.svg",
 "kovai-kings":"assets/franchise-logos/kovai-kings.svg",
 "karaikudi-kings":"assets/franchise-logos/karaikudi-kings.svg",
 "trichy-titans":"assets/franchise-logos/trichy-titans.svg",
 "nellai-falcons":"assets/franchise-logos/nellai-falcons.svg",
 "tiruppur-blazers":"assets/franchise-logos/tiruppur-blazers.svg",
 "thanjavur-royals":"assets/franchise-logos/thanjavur-royals.svg",
 "tuticorin-sharks":"assets/franchise-logos/tuticorin-sharks.svg"
};

function showMsg(text,ok=false){
 const el=ownerAdminMessage;el.hidden=false;el.textContent=text;
 el.className="auction-alert"+(ok?" auction-success":"");
 setTimeout(()=>el.hidden=true,7000);
}

async function ensureAdmin(){
 const result=await sb.auth.getSession();session=result.data.session;
 if(!session){location.href="admin.html";return false}
 const {data,error}=await sb.from("admin_users").select("user_id,role").eq("user_id",session.user.id).maybeSingle();
 if(error||!data){location.href="admin.html";return false}
 return true;
}

async function loadState(){
 const [{data:franchises,error:fErr},{data:profiles,error:pErr},{data:invites,error:iErr}] = await Promise.all([
  sb.from("franchises").select("id,name,slug").eq("is_active",true),
  sb.from("owner_profiles").select("user_id,owner_name,franchise_id,is_active,created_at"),
  sb.from("owner_invites").select("email,franchise_id,status,invitation_sent,created_at").order("created_at",{ascending:false})
 ]);
 if(fErr)throw fErr;if(pErr)throw pErr;if(iErr)throw iErr;

 const franchiseBySlug=Object.fromEntries((franchises||[]).map(f=>[f.slug,f]));
 const profileByFranchise={};
 (profiles||[]).forEach(p=>{if(p.franchise_id)profileByFranchise[p.franchise_id]=p});
 const inviteByFranchise={};
 (invites||[]).forEach(i=>{if(!inviteByFranchise[i.franchise_id])inviteByFranchise[i.franchise_id]=i});

 let active=0,pending=0,missing=0;

 ownerCards.innerHTML=foundingOwners.map(item=>{
  const franchise=franchiseBySlug[item.slug];
  const profile=franchise?profileByFranchise[franchise.id]:null;
  const invite=franchise?inviteByFranchise[franchise.id]:null;

  let state="missing",label="NOT INVITED";
  if(profile?.is_active){state="active";label="ACTIVE";active++}
  else if(invite){state="pending";label="INVITED";pending++}
  else missing++;

  return `<article class="owner-card">
    <div class="owner-logo"><img src="${logoMap[item.slug]||"tnypl-official-logo.png"}" alt="${item.franchise}"></div>
    <div class="owner-info">
      <small>${item.franchise.toUpperCase()}</small>
      <h2>${item.owner}</h2>
      <strong>${item.email}</strong>
      <span>Owner login: ${location.origin}/owner-login.html</span>
      <span class="status-pill status-${state}">${label}</span>
    </div>
    <div class="owner-actions">
      <button class="invite-btn" data-invite-owner="${item.slug}" ${!franchise?"disabled":""}>${state==="active"?"RE-SEND / RE-LINK":"SEND INVITATION"}</button>
      <button class="copy-btn" data-copy-owner-login>COPY LOGIN URL</button>
    </div>
  </article>`;
 }).join("");

 summaryActive.textContent=active;
 summaryPending.textContent=pending;
 summaryMissing.textContent=missing;

 document.querySelectorAll("[data-copy-owner-login]").forEach(btn=>{
  btn.onclick=async()=>{await navigator.clipboard.writeText(`${location.origin}/owner-login.html`);showMsg("Owner login URL copied",true)}
 });

 document.querySelectorAll("[data-invite-owner]").forEach(btn=>{
  btn.onclick=()=>inviteOwner(btn.dataset.inviteOwner,franchiseBySlug[btn.dataset.inviteOwner],btn);
 });
}

async function inviteOwner(slug,franchise,button){
 const item=foundingOwners.find(o=>o.slug===slug);
 if(!item||!franchise){showMsg("Franchise setup is missing");return}
 if(!confirm(`Send secure owner access to ${item.owner} at ${item.email}?`))return;

 button.disabled=true;button.textContent="SENDING…";
 try{
  const res=await fetch("/.netlify/functions/invite-owner",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":`Bearer ${session.access_token}`},
   body:JSON.stringify({owner_name:item.owner,email:item.email,franchise_id:franchise.id})
  });
  const body=await res.json();
  if(!res.ok)throw new Error(body.error||"Unable to send invitation");
  showMsg(body.message||"Owner invitation completed",true);
  await loadState();
 }catch(e){showMsg(e.message)}
 finally{button.disabled=false}
}

ownerAdminLogout.onclick=async()=>{await sb.auth.signOut();location.href="admin.html"};

window.addEventListener("load",async()=>{
 try{
  if(!await ensureAdmin())return;
  await loadState();
 }catch(e){showMsg(e.message)}
});