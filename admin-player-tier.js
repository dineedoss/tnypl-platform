let tierPlayer=null,tierCalculation=null;
const $=id=>document.getElementById(id),val=id=>{const v=$(id)?.value;return v===''||v==null?null:Number(v)},setv=(id,v)=>{if($(id))$(id).value=v??''};
const label=v=>({platinum:'PLATINUM',gold:'GOLD',silver:'SILVER',review:'REVIEW'})[v]||'UNCLASSIFIED';
function stats(){return {matches:val('tierMatches'),runs:val('tierRuns'),batting_average:val('tierBatAvg'),strike_rate:val('tierSR'),wickets:val('tierWickets'),economy:val('tierEconomy'),bowling_average:val('tierBowlAvg'),dismissals:val('tierDismissals'),recent_form_score:val('tierRecent')??5,extraction_confidence:val('tierConfidence')??0}}
function coach(){const a=[val('coachTechnique'),val('coachAwareness'),val('coachFielding'),val('coachTemperament'),val('coachRoleFit')];if(a.every(v=>v==null))return null;return {technique:a[0]??0,awareness:a[1]??0,fielding:a[2]??0,temperament:a[3]??0,role_fit:a[4]??0}}
window.openTierAnalytics=id=>{tierPlayer=players.find(p=>p.id===id);if(!tierPlayer)return;tierCalculation=null;
$('tierPlayerName').textContent=tierPlayer.full_name;$('tierRole').textContent=tierPlayer.primary_role||'';
[['tierMatches','cricheroes_matches'],['tierRuns','cricheroes_runs'],['tierBatAvg','cricheroes_batting_average'],['tierSR','cricheroes_strike_rate'],['tierWickets','cricheroes_wickets'],['tierEconomy','cricheroes_economy'],['tierBowlAvg','cricheroes_bowling_average'],['tierDismissals','cricheroes_dismissals'],['tierRecent','cricheroes_recent_form_score'],['tierConfidence','cricheroes_extraction_confidence'],['coachTechnique','coach_technique_score'],['coachAwareness','coach_awareness_score'],['coachFielding','coach_fielding_score'],['coachTemperament','coach_temperament_score'],['coachRoleFit','coach_role_fit_score']].forEach(([a,b])=>setv(a,tierPlayer[b]));
if($('tierRecent').value==='')setv('tierRecent',5);setv('tierFinal',tierPlayer.player_tier||'');
$('tierProfileScore').textContent=tierPlayer.cricheroes_score??'—';$('tierOverallScore').textContent=tierPlayer.overall_player_score??'—';$('tierSuggested').textContent=label(tierPlayer.suggested_tier);
$('tierMessage').textContent='Review CricHeroes stats, calculate a suggestion, then keep or override the final tier.';$('tierModal').hidden=false};
$('closeTierModal')?.addEventListener('click',()=>$('tierModal').hidden=true);
$('analyzeCricHeroesBtn')?.addEventListener('click',async()=>{if(!tierPlayer?.cricheroes_url){$('tierMessage').textContent='No CricHeroes URL. Enter stats manually.';return}const b=$('analyzeCricHeroesBtn');b.disabled=true;b.textContent='Analyzing...';try{const {data:{session}}=await sb.auth.getSession();const r=await fetch('/.netlify/functions/analyze-cricheroes',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${session.access_token}`},body:JSON.stringify({url:tierPlayer.cricheroes_url})});const x=await r.json();if(!r.ok)throw new Error(x.error||'Analysis failed');const s=x.stats||{};[['tierMatches','matches'],['tierRuns','runs'],['tierBatAvg','batting_average'],['tierSR','strike_rate'],['tierWickets','wickets'],['tierEconomy','economy'],['tierBowlAvg','bowling_average'],['tierDismissals','dismissals']].forEach(([a,k])=>setv(a,s[k]));setv('tierConfidence',x.extraction_confidence);

// Immediately calculate the suggested tier after CricHeroes extraction.
tierCalculation=TNYPL_TIER.calculate(
  tierPlayer.primary_role,
  stats(),
  coach()
);

$('tierProfileScore').textContent=`${tierCalculation.profile_score}/70`;
$('tierOverallScore').textContent=tierCalculation.overall_score;
$('tierSuggested').textContent=label(tierCalculation.suggested_tier);

// Default Final Tier to the system recommendation unless previously overridden.
if(!tierPlayer.tier_override){
  $('tierFinal').value=tierCalculation.suggested_tier;
}

$('tierMessage').textContent=
  `${x.note||'CricHeroes statistics extracted.'} ` +
  `Suggested Tier: ${label(tierCalculation.suggested_tier)}. ` +
  `Review the statistics and change the Final Tier if required.`}catch(e){$('tierMessage').textContent=`Automatic extraction could not complete: ${e.message}. Enter stats manually and continue.`}finally{b.disabled=false;b.textContent='Analyze CricHeroes'}});
$('calculateTierBtn')?.addEventListener('click',()=>{if(!tierPlayer)return;tierCalculation=TNYPL_TIER.calculate(tierPlayer.primary_role,stats(),coach());$('tierProfileScore').textContent=`${tierCalculation.profile_score}/70`;$('tierOverallScore').textContent=tierCalculation.overall_score;$('tierSuggested').textContent=label(tierCalculation.suggested_tier);if(!$('tierFinal').value||!tierPlayer.tier_override)$('tierFinal').value=tierCalculation.suggested_tier;$('tierMessage').textContent=`Suggested ${label(tierCalculation.suggested_tier)}. Final tier remains editable.`});
$('saveTierBtn')?.addEventListener('click',async()=>{if(!tierPlayer)return;if(!tierCalculation)tierCalculation=TNYPL_TIER.calculate(tierPlayer.primary_role,stats(),coach());const s=stats(),c=coach(),final=$('tierFinal').value||null,{data:{session}}=await sb.auth.getSession();
const payload={player_tier:final,suggested_tier:tierCalculation.suggested_tier,cricheroes_score:tierCalculation.profile_score,overall_player_score:tierCalculation.overall_score,tier_override:!!final&&final!==tierCalculation.suggested_tier,tier_updated_at:new Date().toISOString(),cricheroes_matches:s.matches,cricheroes_runs:s.runs,cricheroes_batting_average:s.batting_average,cricheroes_strike_rate:s.strike_rate,cricheroes_wickets:s.wickets,cricheroes_economy:s.economy,cricheroes_bowling_average:s.bowling_average,cricheroes_dismissals:s.dismissals,cricheroes_recent_form_score:s.recent_form_score,cricheroes_extraction_confidence:s.extraction_confidence,cricheroes_analyzed_at:new Date().toISOString(),coach_technique_score:c?.technique??null,coach_awareness_score:c?.awareness??null,coach_fielding_score:c?.fielding??null,coach_temperament_score:c?.temperament??null,coach_role_fit_score:c?.role_fit??null,coach_review_score:tierCalculation.coach_score};
const {error}=await sb.from('players').update(payload).eq('id',tierPlayer.id);if(error){alert(error.message);return}$('tierModal').hidden=true;await loadPlayers()});