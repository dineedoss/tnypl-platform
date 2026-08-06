const cfg=window.TNYPL_CONFIG;
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);

function msg(text,ok=false){
 const el=document.getElementById("setupMessage");
 el.hidden=false;el.textContent=text;
 el.className="auction-alert"+(ok?" auction-success":"");
}

async function establishInviteSession(){
 const hash=new URLSearchParams(location.hash.replace(/^#/,""));
 const query=new URLSearchParams(location.search);
 const accessToken=hash.get("access_token");
 const refreshToken=hash.get("refresh_token");
 const code=query.get("code");

 if(accessToken&&refreshToken){
  const {error}=await sb.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
  if(error)throw error;
 }else if(code){
  const {error}=await sb.auth.exchangeCodeForSession(code);
  if(error)throw error;
 }

 const {data:{session}}=await sb.auth.getSession();
 if(!session)throw new Error("The invitation link is invalid or expired. Ask TNYPL Admin to resend the invitation.");
 return session;
}

activateOwner.onclick=async()=>{
 try{
  const password=newPassword.value;
  const confirm=confirmPassword.value;
  if(password.length<8)throw new Error("Password must contain at least 8 characters.");
  if(password!==confirm)throw new Error("Passwords do not match.");
  activateOwner.disabled=true;
  activateOwner.textContent="ACTIVATING…";
  await establishInviteSession();
  const {error}=await sb.auth.updateUser({password});
  if(error)throw error;
  const {data:{user}}=await sb.auth.getUser();
  if(user){
    await sb.from("franchise_members")
      .update({accepted_at:new Date().toISOString(),updated_at:new Date().toISOString()})
      .eq("user_id",user.id);
  }
  msg("Account activated. Opening your franchise dashboard…",true);
  setTimeout(()=>location.href="owner-dashboard.html",1200);
 }catch(e){
  msg(e.message);
  activateOwner.disabled=false;
  activateOwner.textContent="ACTIVATE OWNER ACCOUNT";
 }
};

window.addEventListener("load",()=>{
 establishInviteSession().catch(e=>msg(e.message));
});