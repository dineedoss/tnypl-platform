const {createClient}=require("@supabase/supabase-js");
exports.handler=async()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return{statusCode:200,body:JSON.stringify({is_live:false})};
 const sb=createClient(url,key,{auth:{persistSession:false}});
 const {data:settings}=await sb.from("league_settings").select("key,value").in("key",["live_match_id","live_youtube_url"]);
 const map=Object.fromEntries((settings||[]).map(x=>[x.key,x.value]));
 if(!map.live_match_id)return{statusCode:200,headers:{"content-type":"application/json"},body:JSON.stringify({is_live:false})};
 const {data:m}=await sb.from("matches").select("*").eq("id",map.live_match_id).maybeSingle();
 return{statusCode:200,headers:{"content-type":"application/json","cache-control":"public,max-age=15"},body:JSON.stringify({is_live:m?.status==="live",teams:m?`${m.team_a_name} vs ${m.team_b_name}`:"",score:m?.live_score||"",situation:m?.live_situation||"",youtube_url:map.live_youtube_url||""})};
};