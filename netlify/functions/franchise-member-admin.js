
const { createClient } = require("@supabase/supabase-js");
const URL=process.env.SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE="https://tnypl.in";
const reply=(statusCode,body)=>({statusCode,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify(body)});

const roleDefaults=(role)=>({
  co_owner:{can_bid:true,can_manage_watchlist:true,can_manage_players:true,can_view_settlement:true},
  coach:{can_bid:false,can_manage_watchlist:true,can_manage_players:true,can_view_settlement:false},
  manager:{can_bid:false,can_manage_watchlist:true,can_manage_players:true,can_view_settlement:false},
  analyst:{can_bid:false,can_manage_watchlist:true,can_manage_players:false,can_view_settlement:false},
  viewer:{can_bid:false,can_manage_watchlist:false,can_manage_players:false,can_view_settlement:false}
}[role]||{can_bid:false,can_manage_watchlist:false,can_manage_players:false,can_view_settlement:false});

exports.handler=async(event)=>{
 if(event.httpMethod!=="POST")return reply(405,{error:"Method not allowed"});
 if(!URL||!KEY)return reply(500,{error:"Missing Supabase server configuration"});

 const h=event.headers.authorization||event.headers.Authorization||"";
 const token=h.startsWith("Bearer ")?h.slice(7):"";
 if(!token)return reply(401,{error:"Authentication required"});

 const sb=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});

 try{
  const {data:a,error:ae}=await sb.auth.getUser(token);
  if(ae||!a?.user)return reply(401,{error:"Invalid or expired session"});
  const actor=a.user;
  const body=JSON.parse(event.body||"{}");
  const action=String(body.action||"invite");

  const {data:admin}=await sb.from("admin_users").select("user_id").eq("user_id",actor.id).maybeSingle();
  const {data:member}=await sb.from("franchise_members").select("*")
    .eq("user_id",actor.id).eq("is_active",true)
    .order("is_primary_owner",{ascending:false}).limit(1).maybeSingle();

  const isAdmin=!!admin;
  if(!isAdmin&&!member?.can_manage_members)
    return reply(403,{error:"You cannot manage franchise members"});

  const franchiseId=String(body.franchise_id||member?.franchise_id||"");
  if(!franchiseId)return reply(400,{error:"Franchise is required"});
  if(!isAdmin&&franchiseId!==member.franchise_id)
    return reply(403,{error:"You can manage only your own franchise"});

  if(action==="invite"){
    const fullName=String(body.full_name||"").trim();
    const email=String(body.email||"").trim().toLowerCase();
    const role=String(body.member_role||"viewer");
    if(!fullName||!email)return reply(400,{error:"Name and email are required"});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return reply(400,{error:"Enter a valid email"});
    if(!["co_owner","coach","manager","analyst","viewer"].includes(role))
      return reply(400,{error:"Invalid role"});

    const d=roleDefaults(role);
    const perms={
      can_bid:body.can_bid??d.can_bid,
      can_manage_watchlist:body.can_manage_watchlist??d.can_manage_watchlist,
      can_manage_players:body.can_manage_players??d.can_manage_players,
      can_view_settlement:body.can_view_settlement??d.can_view_settlement,
      can_manage_members:false
    };

    const {data:list,error:le}=await sb.auth.admin.listUsers({page:1,perPage:1000});
    if(le)throw le;
    let user=list?.users?.find(u=>String(u.email||"").toLowerCase()===email);
    let sent=false;

    if(!user){
      const {data:invite,error:ie}=await sb.auth.admin.inviteUserByEmail(email,{
        redirectTo:`${SITE}/owner-setup-password.html`,
        data:{full_name:fullName,franchise_id:franchiseId,member_role:role}
      });
      if(ie)throw ie;
      user=invite?.user;sent=true;
    }
    if(!user?.id)throw new Error("Unable to create member account");

    const {data:existing}=await sb.from("franchise_members").select("*")
      .eq("user_id",user.id).eq("franchise_id",franchiseId).maybeSingle();
    if(existing?.is_primary_owner)
      return reply(400,{error:"Primary owner cannot be changed here"});

    const row={
      user_id:user.id,franchise_id:franchiseId,full_name:fullName,email,
      member_role:role,...perms,is_primary_owner:false,is_active:true,
      invited_by:actor.id,updated_at:new Date().toISOString()
    };

    const {data:saved,error:se}=await sb.from("franchise_members")
      .upsert(row,{onConflict:"user_id,franchise_id"}).select().single();
    if(se)throw se;

    await sb.from("franchise_member_audit").insert({
      franchise_id:franchiseId,member_user_id:user.id,actor_user_id:actor.id,
      action:existing?"member_updated":"member_invited",
      previous_values:existing||null,new_values:saved
    });

    return reply(200,{success:true,member:saved,
      message:sent?`Invitation sent to ${email}`:`${email} was linked to the franchise`});
  }

  const id=String(body.member_id||"");
  if(!id)return reply(400,{error:"Member ID required"});

  const {data:target}=await sb.from("franchise_members").select("*")
    .eq("id",id).eq("franchise_id",franchiseId).maybeSingle();
  if(!target)return reply(404,{error:"Member not found"});
  if(target.is_primary_owner)return reply(400,{error:"Primary owner cannot be removed"});

  if(action==="update"){
    const role=String(body.member_role||target.member_role);
    if(!["co_owner","coach","manager","analyst","viewer"].includes(role))
      return reply(400,{error:"Invalid role"});
    const patch={
      member_role:role,
      can_bid:!!body.can_bid,
      can_manage_watchlist:!!body.can_manage_watchlist,
      can_manage_players:!!body.can_manage_players,
      can_view_settlement:!!body.can_view_settlement,
      can_manage_members:false,
      is_active:body.is_active!==false,
      updated_at:new Date().toISOString()
    };
    const {data:saved,error:e}=await sb.from("franchise_members")
      .update(patch).eq("id",id).select().single();
    if(e)throw e;
    await sb.from("franchise_member_audit").insert({
      franchise_id:franchiseId,member_user_id:target.user_id,actor_user_id:actor.id,
      action:"member_permissions_updated",previous_values:target,new_values:saved
    });
    return reply(200,{success:true,message:"Member access updated",member:saved});
  }

  if(action==="remove"||action==="disable"){
    const patch={
      is_active:false,can_bid:false,can_manage_watchlist:false,
      can_manage_players:false,can_view_settlement:false,
      can_manage_members:false,updated_at:new Date().toISOString()
    };
    const {data:saved,error:e}=await sb.from("franchise_members")
      .update(patch).eq("id",id).select().single();
    if(e)throw e;
    await sb.from("franchise_member_audit").insert({
      franchise_id:franchiseId,member_user_id:target.user_id,actor_user_id:actor.id,
      action:"member_disabled",previous_values:target,new_values:saved
    });
    return reply(200,{success:true,message:`${target.full_name} was removed from active access`,member:saved});
  }

  return reply(400,{error:"Unsupported action"});
 }catch(e){
  console.error(e);
  return reply(500,{error:e.message||"Unable to manage member"});
 }
};
