const {createClient}=require("@supabase/supabase-js");
exports.handler=async(event)=>{
 if(event.httpMethod!=="POST")return{statusCode:405,body:"Method not allowed"};
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,resend=process.env.RESEND_API_KEY;
 if(!url||!key)return{statusCode:500,body:"Missing Supabase variables"};
 const sb=createClient(url,key,{auth:{persistSession:false}});
 if(!resend)return{statusCode:200,body:JSON.stringify({ok:false,message:"RESEND_API_KEY is not configured. Email remains queued."})};
 const {data:items,error}=await sb.from("email_queue").select("*").eq("status","pending").limit(25);
 if(error)return{statusCode:500,body:error.message};
 const templates={
  registration_received:p=>({subject:"TNYPL Registration Received — Verification Pending",html:`<h2>Registration received</h2><p>Dear ${p.player_name||"Player"},</p><p>Your TNYPL application has been received. Reference: <strong>${p.registration_reference||""}</strong>.</p><p>Our admin team will verify your details, payment and age proof.</p>`}),
  verified:p=>({subject:"TNYPL Registration Verified — Draft Pool Confirmed",html:`<h2>Registration verified</h2><p>Congratulations ${p.player_name||""}. You are now confirmed in the official TNYPL draft pool.</p>`}),
  changes_requested:p=>({subject:"TNYPL Registration — Corrections Required",html:`<h2>Action required</h2><p>Please contact ttnypl@gmail.com to complete the requested corrections.</p>`}),
  drafted:p=>({subject:`Welcome to ${p.franchise||"Your TNYPL Franchise"}`,html:`<h2>You have been drafted!</h2><p>Welcome to <strong>${p.franchise||"your franchise"}</strong>. Further reporting and team instructions will follow.</p>`}),
  not_drafted:p=>({subject:"Thank You for Being Part of the TNYPL Draft",html:`<h2>Keep moving forward</h2><p>Although you were not selected in this draft, one result does not define your cricket journey. Continue training and pursuing every opportunity. Refund information will be shared according to the published policy.</p>`}),
  refund_paid:p=>({subject:"TNYPL Registration Refund Processed",html:`<h2>Refund processed</h2><p>Your eligible registration refund has been processed.</p>`})
 };
 let sent=0;
 for(const item of items||[]){
  const fn=templates[item.template_key]||templates.registration_received,mail=fn(item.payload||{});
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"authorization":`Bearer ${resend}`,"content-type":"application/json"},body:JSON.stringify({from:process.env.EMAIL_FROM||"TNYPL <info@tnypl.in>",to:[item.recipient_email],reply_to:"ttnypl@gmail.com",subject:mail.subject,html:mail.html+"<hr><p>TNYPL · tnypl.in · ttnypl@gmail.com</p>"})});
  if(response.ok){sent++;await sb.from("email_queue").update({status:"sent",sent_at:new Date().toISOString()}).eq("id",item.id)}
  else await sb.from("email_queue").update({status:"failed",last_error:await response.text()}).eq("id",item.id);
 }
 return{statusCode:200,headers:{"content-type":"application/json"},body:JSON.stringify({ok:true,sent})};
};