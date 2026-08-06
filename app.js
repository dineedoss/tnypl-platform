const cfg=window.TNYPL_CONFIG;
const sb=window.supabase?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
document.getElementById('menuToggle')?.addEventListener('click',()=>document.getElementById('navLinks')?.classList.toggle('open'));

function tzParts(date,tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'});return Object.fromEntries(f.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]))}
function countdown(){const e=document.getElementById('countDays');if(!e)return;const n=tzParts(new Date(),cfg.TOURNAMENT_TIMEZONE||'Asia/Kolkata');const [y,m,d]=(cfg.TOURNAMENT_DATE||'2026-09-12').split('-').map(Number);e.textContent=Math.max(0,Math.ceil((Date.UTC(y,m-1,d)-Date.UTC(n.year,n.month-1,n.day))/86400000))}
countdown();setInterval(countdown,60000);

const form=document.getElementById('registrationForm');
const tabs=[...document.querySelectorAll('.step-tab')];
const panels=[...document.querySelectorAll('.form-step')];
let current=1;
function showStep(n){
  current=Math.max(1,Math.min(panels.length,n));
  tabs.forEach(t=>t.classList.toggle('active',+t.dataset.step===current));
  panels.forEach(p=>p.classList.toggle('active',+p.dataset.stepPanel===current));
  form?.scrollIntoView({behavior:'smooth',block:'start'});
}
tabs.forEach(t=>t.addEventListener('click',()=>{const requested=+t.dataset.step;if(requested<current)showStep(requested)}));

const dob=document.getElementById('dob');
const ageDisplay=document.getElementById('ageDisplay');
const minDob=cfg.MIN_DOB||'2010-01-01';
const maxDob=cfg.MAX_DOB||'2012-12-31';
if(dob){
  dob.min=minDob;dob.max=maxDob;
  dob.addEventListener('change',()=>{
    dob.setCustomValidity('');
    if(!dob.value){ageDisplay.value='';return}
    if(dob.value<minDob||dob.value>maxDob){
      dob.setCustomValidity('Eligible date of birth is 01 January 2010 through 31 December 2012.');
      ageDisplay.value='Not eligible';
      return
    }
    const b=new Date(dob.value+'T00:00:00'),r=new Date('2026-09-12T00:00:00');
    let y=r.getFullYear()-b.getFullYear(),m=r.getMonth()-b.getMonth(),d=r.getDate()-b.getDate();
    if(d<0){m--;d+=new Date(r.getFullYear(),r.getMonth(),0).getDate()}
    if(m<0){y--;m+=12}
    ageDisplay.value=`${y} years, ${m} months, ${d} days`;
  })
}

const cric=document.getElementById('cricheroesUrl');
function normalizeCricHeroes(value){
  let v=(value||'').trim();
  if(v && !/^https?:\/\//i.test(v))v='https://'+v;
  return v;
}
function validCricHeroes(value){
  try{
    const u=new URL(normalizeCricHeroes(value));
    return /(^|\.)cricheroes\.com$/i.test(u.hostname) && u.pathname.length>1;
  }catch{return false}
}
cric?.addEventListener('blur',()=>{
  cric.value=normalizeCricHeroes(cric.value);
  cric.setCustomValidity(validCricHeroes(cric.value)?'':'Enter a complete CricHeroes profile URL from cricheroes.com.');
});

function panelError(panel,message=''){
  const box=panel.querySelector('.step-error');
  if(box)box.textContent=message;
}
function validatePanel(step){
  const panel=document.querySelector(`[data-step-panel="${step}"]`);
  panelError(panel,'');
  const controls=[...panel.querySelectorAll('input,select,textarea')];
  for(const el of controls){
    if(el.id==='cricheroesUrl'){
      el.value=normalizeCricHeroes(el.value);
      el.setCustomValidity(validCricHeroes(el.value)?'':'Enter a valid public CricHeroes profile URL.');
    }
    if(el.id==='dob' && el.value && (el.value<minDob||el.value>maxDob)){
      el.setCustomValidity('Player is outside the eligible DOB range.');
    }
    if(!el.checkValidity()){
      el.reportValidity();
      panelError(panel,el.validationMessage||'Please complete all required fields.');
      return false
    }
  }
  if(step===5){
    const p=document.getElementById('parentSignature').value.trim().toLowerCase();
    const w=document.getElementById('waiverSignature').value.trim().toLowerCase();
    if(p!==w){
      panelError(panel,'The final waiver signature must match the Parent/Guardian Consent signature.');
      document.getElementById('waiverSignature').focus();
      return false
    }
  }
  return true
}
document.querySelectorAll('.next-step').forEach(b=>b.addEventListener('click',()=>{if(validatePanel(current))showStep(current+1)}));
document.querySelectorAll('.prev-step').forEach(b=>b.addEventListener('click',()=>showStep(current-1)));

async function upload(file,folder){
  if(!file)throw new Error(`Required ${folder.replace('-',' ')} file is missing.`);
  const allowed=['application/pdf','image/jpeg','image/png'];
  if(!allowed.includes(file.type))throw new Error('Attachments must be PDF, JPG or PNG.');
  if(file.size>8*1024*1024)throw new Error('Each attachment must be smaller than 8 MB.');
  const path=`${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const {error}=await sb.storage.from('player-documents').upload(path,file);
  if(error)throw error;
  return path
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const msg=document.getElementById('formMessage');
  const btn=form.querySelector('[type=submit]');
  if(!validatePanel(5))return;
  btn.disabled=true;msg.textContent='Validating and submitting registration...';msg.style.color='';
  try{
    if(!sb)throw new Error('Registration service is unavailable.');
    if(!dob.value||dob.value<minDob||dob.value>maxDob)throw new Error('DOB must be between 01 January 2010 and 31 December 2012.');
    if(!validCricHeroes(cric.value))throw new Error('A valid CricHeroes profile link is required.');
    if(!document.getElementById('parentConsent').checked)throw new Error('Parent/Guardian Consent is required.');
    if(!document.getElementById('waiverAcceptance').checked)throw new Error('Waiver acceptance is required.');
    if(!document.getElementById('informationAccuracy').checked)throw new Error('Information accuracy confirmation is required.');

    const data=new FormData(form);
    const [agePath,payPath]=await Promise.all([
      upload(document.getElementById('ageProof').files[0],'age-proofs'),
      upload(document.getElementById('paymentReceipt').files[0],'payment-receipts')
    ]);

    const now=new Date().toISOString();
    const payload={
      full_name:data.get('full_name'),
      date_of_birth:data.get('date_of_birth'),
      district:data.get('district'),
      parent_name:data.get('parent_name'),
      parent_phone:data.get('parent_phone'),
      email:data.get('email'),
      school:data.get('school'),
      academy:data.get('academy'),
      cricheroes_url:normalizeCricHeroes(data.get('cricheroes_url')),
      primary_role:data.get('primary_role'),
      batting_style:data.get('batting_style'),
      bowling_style:data.get('bowling_style'),
      tshirt_size:data.get('tshirt_size'),
      pant_size:data.get('pant_size'),
      age_proof_path:agePath,
      payment_receipt_path:payPath,
      guardian_relationship:data.get('guardian_relationship'),
      emergency_contact_name:data.get('emergency_contact_name'),
      emergency_contact_phone:data.get('emergency_contact_phone'),
      parent_signature:data.get('parent_signature'),
      parent_consent:true,
      parent_consent_at:now,
      waiver_accepted:true,
      waiver_accepted_at:now,
      waiver_signature:data.get('waiver_signature'),
      media_consent:true,
      status:'pending'
    };

    const {data:inserted,error}=await sb.from('players').insert(payload).select('id').single();
    if(error)throw error;
    try{
      await fetch('/.netlify/functions/send-player-email',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({type:'registration',player_id:inserted.id})
      })
    }catch(emailError){console.warn('Registration saved; email could not be sent.',emailError)}
    form.reset();ageDisplay.value='';showStep(1);
    msg.textContent='Registration received. Parent consent and waiver were recorded. A confirmation email will be sent.';
    msg.style.color='#6ee7b7'
  }catch(err){
    msg.textContent=err.message;
    msg.style.color='#fca5a5'
  }finally{btn.disabled=false}
});
