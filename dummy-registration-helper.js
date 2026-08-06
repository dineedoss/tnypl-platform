window.addEventListener("load",()=>{
 const form=document.getElementById("registrationForm");
 if(!form)return;

 const params=new URLSearchParams(location.search);
 const isDummy=params.get("dummy")==="1";

 const button=document.createElement("button");
 button.type="button";
 button.textContent="LOAD SAFE DUMMY REGISTRATION";
 button.style.cssText="margin:0 0 18px;padding:12px 18px;border:0;border-radius:9px;background:#174c86;color:white;font-weight:900;cursor:pointer";
 form.parentNode.insertBefore(button,form);

 function set(name,value){
  const el=form.elements[name];
  if(!el)return;
  if(el.type==="checkbox")el.checked=!!value;
  else el.value=value;
  el.dispatchEvent(new Event("change",{bubbles:true}));
 }

 function loadDummy(){
  const stamp=Date.now().toString().slice(-6);
  set("full_name",`TNYPL Dummy Player ${stamp}`);
  set("date_of_birth","2011-06-15");
  set("district","Chennai");
  set("parent_name","Dummy Parent");
  set("parent_phone","9000000000");
  set("email",`tnypl.dummy.${stamp}@example.com`);
  set("school","TNYPL Test School");
  set("academy","TNYPL Test Cricket Academy");
  set("cricheroes_url","https://chshare.link/player/nfujyU");
  set("primary_role","All-rounder");
  set("batting_style","Right-hand");
  set("bowling_style","Right-arm medium");
  set("tshirt_size","M");
  set("pant_size","30");
  set("guardian_relationship","Father");
  set("emergency_contact_name","Dummy Parent");
  set("emergency_contact_phone","9000000000");
  set("parent_signature","Dummy Parent");
  set("parent_consent",true);
  set("waiver_acceptance",true);
  set("information_accuracy",true);
  set("waiver_signature","Dummy Parent");
  alert("Dummy information loaded. Upload any required test files, review all fields, then submit normally. Delete the dummy record from Admin after testing.");
  form.scrollIntoView({behavior:"smooth",block:"start"});
 }

 button.onclick=loadDummy;
 if(isDummy)setTimeout(loadDummy,300);
});