(()=>{const band=(v,b)=>{v=Number(v);if(!Number.isFinite(v))return 0;for(const [m,p] of b)if(v>=m)return p;return 0},inv=(v,b)=>{v=Number(v);if(!Number.isFinite(v)||v<=0)return 0;for(const [m,p] of b)if(v<=m)return p;return b.at(-1)[1]},cl=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const exp=s=>band(s.matches,[[30,10],[20,8],[10,6],[5,3],[0,1]]);
const avg=s=>band(s.batting_average,[[40,15],[35,13],[30,11],[25,8],[20,5],[0,2]]);
const sr=s=>band(s.strike_rate,[[150,15],[135,13],[120,10],[110,7],[100,5],[0,2]]);
const runs15=s=>band(s.runs,[[1000,15],[700,12],[500,9],[250,6],[100,3],[0,1]]);
const runs10=s=>band(s.runs,[[1000,10],[700,8],[500,6],[250,4],[100,2],[0,1]]);
const wk20=s=>band(s.wickets,[[40,20],[30,17],[20,14],[10,9],[5,5],[0,2]]);
const wk10=s=>band(s.wickets,[[40,10],[30,9],[20,7],[10,5],[5,3],[0,1]]);
const eco20=s=>inv(s.economy,[[5.5,20],[6,18],[6.8,15],[7.5,11],[8.5,7],[999,3]]);
const eco10=s=>inv(s.economy,[[5.5,10],[6,9],[6.8,8],[7.5,6],[8.5,4],[999,2]]);
const bav10=s=>inv(s.bowling_average,[[15,10],[20,8],[25,6],[30,4],[40,2],[999,1]]);
const dis10=s=>band(s.dismissals,[[30,10],[20,8],[12,6],[6,4],[1,2],[0,0]]);
const rec10=s=>cl(s.recent_form_score,0,10), conf5=s=>Math.round(cl(s.extraction_confidence,0,100)/20);
function profile(role,s){let p={experience:exp(s)};role=(role||'').toLowerCase();
if(role.includes('bowler')&&!role.includes('all'))p={...p,wickets:wk20(s),economy:eco20(s),bowling_average:bav10(s),recent_form:Math.round(rec10(s)/2),confidence:conf5(s)};
else if(role.includes('wicket'))p={...p,batting_average:avg(s),strike_rate:sr(s),runs:runs10(s),dismissals:dis10(s),recent_form:Math.round(rec10(s)/2),confidence:conf5(s)};
else if(role.includes('all'))p={...p,batting_average:Math.round(avg(s)*10/15),strike_rate:Math.round(sr(s)*10/15),runs:Math.round(runs10(s)/2),wickets:wk10(s),economy:eco10(s),bowling_average:Math.round(bav10(s)/2),recent_form:Math.round(rec10(s)/2),confidence:conf5(s)};
else p={...p,batting_average:avg(s),strike_rate:sr(s),runs:runs15(s),recent_form:rec10(s),confidence:conf5(s)};
return {raw:Math.min(70,Object.values(p).reduce((a,b)=>a+(+b||0),0)),parts:p}}
function tier(n){return n>=80?'platinum':n>=65?'gold':n>=50?'silver':'review'}
function calc(role,s,c=null){const p=profile(role,s), p100=Math.round(p.raw/70*100); if(!c)return {profile_score:p.raw,overall_score:p100,suggested_tier:tier(p100),coach_score:null,parts:p.parts};
const cs=cl(c.technique,0,10)+cl(c.awareness,0,5)+cl(c.fielding,0,5)+cl(c.temperament,0,5)+cl(c.role_fit,0,5),o=Math.round(p.raw+cs);return {profile_score:p.raw,overall_score:o,suggested_tier:tier(o),coach_score:cs,parts:p.parts}}
window.TNYPL_TIER={calculate:calc};})();