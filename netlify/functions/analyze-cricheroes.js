const { createClient } = require("@supabase/supabase-js");
const json=(statusCode,body)=>({statusCode,headers:{"content-type":"application/json","access-control-allow-origin":"*","access-control-allow-headers":"content-type, authorization"},body:JSON.stringify(body)});
const allowed=raw=>{try{const h=new URL(raw).hostname.toLowerCase().replace(/^www\./,"");return h==="cricheroes.com"||h.endsWith(".cricheroes.com")||h==="chshare.link"||h.endsWith(".chshare.link")}catch{return false}};
const textify=h=>h.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi," $1 ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ");
function find(t,labels,max){for(const l of labels){const e=l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");for(const r of [new RegExp(`${e}\\s*[:\\-]?\\s*([0-9]+(?:\\.[0-9]+)?)`,"i"),new RegExp(`"[^"]*${e}[^"]*"\\s*:\\s*"?([0-9]+(?:\\.[0-9]+)?)`,"i")]){const m=t.match(r);if(m){const n=+m[1];if(Number.isFinite(n)&&(!max||n<=max))return n}}}return null}
exports.handler=async event=>{
 if(event.httpMethod==="OPTIONS")return json(200,{ok:true}); if(event.httpMethod!=="POST")return json(405,{error:"Method not allowed"});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return json(500,{error:"Server configuration missing"});
 const sb=createClient(url,key,{auth:{persistSession:false}});
 try{
  const token=(event.headers.authorization||event.headers.Authorization||"").replace(/^Bearer\s+/i,"");
  const {data:a,error:ae}=await sb.auth.getUser(token);if(ae||!a.user)return json(401,{error:"Admin authentication required"});
  const {data:admin}=await sb.from("admin_users").select("user_id").eq("user_id",a.user.id).maybeSingle();if(!admin)return json(403,{error:"Admin access required"});
  const u=JSON.parse(event.body||"{}").url;if(!allowed(u))return json(400,{error:"Valid CricHeroes profile URL required"});
  const r=await fetch(u,{redirect:"follow",headers:{"user-agent":"Mozilla/5.0 TNYPL-Analytics/1.1","accept":"text/html"}});if(!r.ok)return json(502,{error:`CricHeroes returned HTTP ${r.status}. Enter stats manually.`});
  if(!allowed(r.url))return json(400,{error:"Profile redirect left allowed CricHeroes domains"});
  const t=textify(await r.text());
  const stats={matches:find(t,["matches","matches played"],5000),runs:find(t,["runs","total runs"],100000),batting_average:find(t,["batting average","bat avg"],500),strike_rate:find(t,["strike rate","batting strike rate"],500),wickets:find(t,["wickets","total wickets"],5000),economy:find(t,["economy","economy rate"],50),bowling_average:find(t,["bowling average","bowl avg"],500),dismissals:find(t,["dismissals","stumpings"],5000)};
  const found=Object.values(stats).filter(v=>v!=null).length,confidence=Math.round(found/Object.keys(stats).length*100);
  return json(200,{ok:true,stats,extraction_confidence:confidence,note:confidence<50?"Partial extraction. Review/edit values before scoring.":"Profile stats extracted. Review before saving."});
 }catch(e){return json(500,{error:e.message})}
};