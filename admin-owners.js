const cfg = window.TNYPL_CONFIG;
const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
let session = null;

function showMsg(text, ok=false){
  const el=document.getElementById("ownerAdminMessage");
  el.hidden=false; el.textContent=text;
  el.className="auction-alert"+(ok?" auction-success":"");
  setTimeout(()=>el.hidden=true,7000);
}

async function ensureAdmin(){
  const result=await sb.auth.getSession();
  session=result.data.session;
  if(!session){location.href="admin.html";return false}
  const {data,error}=await sb.from("admin_users").select("user_id,role").eq("user_id",session.user.id).maybeSingle();
  if(error||!data){location.href="admin.html";return false}
  return true;
}

async function loadFranchises(){
  const {data,error}=await sb.from("franchises").select("id,name").eq("is_active",true).order("name");
  if(error)throw error;
  inviteFranchise.innerHTML='<option value="">Select franchise</option>'+data.map(f=>`<option value="${f.id}">${f.name}</option>`).join("");
}

async function loadOwners(){
  const {data,error}=await sb
    .from("owner_profiles")
    .select("user_id,owner_name,role,is_active,created_at,franchises(name),owner_invites(email,status,invitation_sent,created_at)")
    .order("created_at");
  if(error)throw error;

  ownerAccessRows.innerHTML=(data||[]).map(row=>{
    const latest=[...(row.owner_invites||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
    const email=latest?.email||"Existing Auth user";
    const status=row.is_active ? (latest?.invitation_sent ? "INVITED" : "ACTIVE") : "DISABLED";
    const chip=row.is_active ? (latest?.invitation_sent ? "pending":"active") : "";
    return `<tr>
      <td><strong>${row.owner_name||"Owner"}</strong></td>
      <td>${email}</td>
      <td>${row.franchises?.name||"—"}</td>
      <td><span class="status-chip ${chip}">${status}</span></td>
      <td>${new Date(row.created_at).toLocaleDateString()}</td>
      <td><div class="inline-actions"><button class="copy-btn" data-copy-login>Copy Login URL</button></div></td>
    </tr>`;
  }).join("") || '<tr><td colspan="6">No owner accounts linked yet.</td></tr>';

  document.querySelectorAll("[data-copy-login]").forEach(btn=>{
    btn.onclick=async()=>{
      await navigator.clipboard.writeText(`${location.origin}/owner-login.html`);
      showMsg("Owner login URL copied",true);
    };
  });
}

sendOwnerInvite.onclick=async()=>{
  const owner_name=inviteOwnerName.value.trim();
  const email=inviteOwnerEmail.value.trim();
  const franchise_id=inviteFranchise.value;

  if(!owner_name||!email||!franchise_id){
    showMsg("Enter owner name, email and franchise");
    return;
  }

  sendOwnerInvite.disabled=true;
  sendOwnerInvite.textContent="SENDING INVITATION…";

  try{
    const res=await fetch("/.netlify/functions/invite-owner",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${session.access_token}`
      },
      body:JSON.stringify({owner_name,email,franchise_id})
    });
    const body=await res.json();
    if(!res.ok)throw new Error(body.error||"Unable to send invitation");

    showMsg(body.message||"Owner invitation completed",true);
    inviteOwnerName.value="";
    inviteOwnerEmail.value="";
    inviteFranchise.value="";
    await loadOwners();
  }catch(e){
    showMsg(e.message);
  }finally{
    sendOwnerInvite.disabled=false;
    sendOwnerInvite.textContent="SEND SECURE INVITATION";
  }
};

refreshOwnerAccess.onclick=()=>loadOwners().catch(e=>showMsg(e.message));
ownerAdminLogout.onclick=async()=>{await sb.auth.signOut();location.href="admin.html"};

window.addEventListener("load",async()=>{
  try{
    if(!await ensureAdmin())return;
    await Promise.all([loadFranchises(),loadOwners()]);
  }catch(e){showMsg(e.message)}
});