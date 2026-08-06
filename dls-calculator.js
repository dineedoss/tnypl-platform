function dlsCalculate(){
 const score=Number(dlsScore.value),r1=Number(dlsR1.value),r2=Number(dlsR2.value);
 if(!Number.isFinite(score)||score<0||!Number.isFinite(r1)||r1<=0||!Number.isFinite(r2)||r2<=0){
  alert("Enter valid score and resource percentages.");return;
 }
 const par=Math.floor(score*(r2/r1));
 const target=par+1;
 dlsPar.textContent=par;
 dlsTarget.textContent=target;
 dlsDifference.textContent=`${(r2-r1).toFixed(1)}%`;
 dlsExplanation.textContent=`With Team 1 using ${r1.toFixed(1)}% resources and Team 2 receiving ${r2.toFixed(1)}%, the provisional par score is ${par} and the provisional winning target is ${target}. Confirm this with the official scorer or match referee.`;
}
function resourceApprox(overs,wickets,maxOvers){
 // Smooth operational estimate only; calibrated to reach 100% at full innings, 0 wickets.
 const wicketFactors=[1,.93,.85,.76,.66,.55,.43,.31,.20,.10];
 const time=Math.max(0,Math.min(1,overs/maxOvers));
 const shape=1-Math.exp(-3.25*time);
 const full=1-Math.exp(-3.25);
 return Math.max(0,Math.min(100,100*(shape/full)*wicketFactors[wickets]));
}
calculateDls.onclick=dlsCalculate;
estimateResource.onclick=()=>{
 const overs=Number(resourceOvers.value),wickets=Math.max(0,Math.min(9,Number(resourceWickets.value)||0)),maxOvers=Number(dlsFormat.value);
 const val=resourceApprox(overs,wickets,maxOvers);
 resourceResult.textContent=`${val.toFixed(1)}%`;
};
dlsFormat.onchange=()=>{resourceOvers.value=dlsFormat.value;dlsOvers.value=dlsFormat.value};
dlsCalculate();
