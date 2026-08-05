const cfg=window.TNYPL_CONFIG;
const sb=window.supabase?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;

document.getElementById('menuToggle')?.addEventListener('click',()=>document.getElementById('navLinks')?.classList.toggle('open'));
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks')?.classList.remove('open')));

function getDatePartsInTimeZone(date,timeZone){
  const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  return Object.fromEntries(formatter.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function updateCountdown(){
  const el=document.getElementById('countDays');if(!el)return;
  const now=getDatePartsInTimeZone(new Date(),cfg.TOURNAMENT_TIMEZONE||'Asia/Kolkata');
  const [y,m,d]=(cfg.TOURNAMENT_DATE||'2026-09-14').split('-').map(Number);
  const diff=Date.UTC(y,m-1,d)-Date.UTC(now.year,now.month-1,now.day);
  el.textContent=String(Math.max(0,Math.ceil(diff/86400000))).padStart(2,'0');
}
updateCountdown();setInterval(updateCountdown,60000);

const modal=document.getElementById('ownerModal');
document.querySelectorAll('.owner-view').forEach(btn=>btn.addEventListener('click',()=>{
  const card=btn.closest('.premium-team-card');
  document.getElementById('modalTeam').textContent=card.dataset.team;
  document.getElementById('modalOwner').textContent=card.dataset.owner;
  document.getElementById('modalVision').textContent=card.dataset.vision;
  document.getElementById('modalInitials').textContent=card.dataset.owner.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}));
function closeModal(){modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true')}
document.getElementById('modalClose')?.addEventListener('click',closeModal);
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

(function loadDraft(){
  const id=cfg.YOUTUBE_DRAFT_VIDEO_ID,stage=document.getElementById('draftVideo');
  if(!stage||!id||id==='YOUR_LIVE_DRAFT_VIDEO_ID')return;
  stage.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&rel=0" title="TNYPL Live Player Draft" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe>`;
})();

const form=document.getElementById('registrationForm');
const dob=document.getElementById('dob');
const ageDisplay=document.getElementById('ageDisplay');
const formMessage=document.getElementById('formMessage');

function calculateAge(dateString){
  const birth=new Date(`${dateString}T00:00:00`);
  const ref=new Date('2026-09-14T00:00:00');
  let y=ref.getFullYear()-birth.getFullYear(),m=ref.getMonth()-birth.getMonth(),d=ref.getDate()-birth.getDate();
  if(d<0){m--;d+=new Date(ref.getFullYear(),ref.getMonth(),0).getDate()}
  if(m<0){y--;m+=12}
  return `${y} years, ${m} months, ${d} days`;
}
if(dob){
  dob.min=cfg.MIN_DOB;dob.max=cfg.MAX_DOB;
  dob.addEventListener('change',()=>ageDisplay.value=dob.value?calculateAge(dob.value):'');
}

async function uploadFile(file,folder){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${folder}/${crypto.randomUUID()}-${safe}`;
  const {error}=await sb.storage.from('player-documents').upload(path,file);
  if(error)throw error;
  return path;
}
form?.addEventListener('submit',async e=>{
  e.preventDefault();

  const button=document.getElementById('submitRegistrationBtn') || form.querySelector('button[type="submit"]');
  const originalText=button?.textContent || 'Submit Draft Registration';

  for(let step=1;step<=4;step++){
    if(!validateRegistrationStep(step)){
      showRegistrationStep(step,false);
      return;
    }
  }

  if(button){
    button.disabled=true;
    button.textContent='Submitting…';
  }
  formMessage.textContent='Uploading documents and submitting your registration…';
  formMessage.className='submitting';

  try{
    if(!sb)throw new Error('Registration service is unavailable. Please refresh and try again.');

    if(!dob.value)throw new Error('Please enter the player date of birth.');
    if(dob.value<cfg.MIN_DOB||dob.value>cfg.MAX_DOB){
      showRegistrationStep(1,false);
      throw new Error('Eligible DOB is 01 January 2010 through 31 December 2012, inclusive.');
    }

    const data=new FormData(form);
    const ageFile=document.getElementById('ageProof')?.files?.[0];
    const receiptFile=document.getElementById('paymentReceipt')?.files?.[0];

    if(!ageFile || !receiptFile){
      showRegistrationStep(3,false);
      throw new Error('Please upload both the age proof and payment receipt.');
    }

    const [agePath,receiptPath]=await Promise.all([
      uploadFile(ageFile,'age-proofs'),
      uploadFile(receiptFile,'payment-receipts')
    ]);

    const payload={
      full_name:data.get('full_name'),
      date_of_birth:data.get('date_of_birth'),
      parent_name:data.get('parent_name'),
      parent_phone:data.get('parent_phone'),
      email:data.get('email'),
      district:data.get('district'),
      school:data.get('school'),
      academy:data.get('academy'),
      cricheroes_url:data.get('cricheroes_url'),
      primary_role:data.get('primary_role'),
      batting_style:data.get('batting_style'),
      bowling_style:data.get('bowling_style'),
      tshirt_size:data.get('tshirt_size'),
      pant_size:data.get('pant_size'),
      age_proof_path:agePath,
      payment_receipt_path:receiptPath,
      status:'pending',privacy_consent_at:new Date().toISOString(),guardian_consent_at:new Date().toISOString()
    };

    const {error}=await sb.from('players').insert(payload);
    if(error)throw error;

    form.reset();
    if(ageDisplay)ageDisplay.value='';
    formMessage.textContent='Registration submitted successfully!';
    formMessage.className='success';

    const review=document.querySelector('.review-card');
    if(review){
      review.innerHTML=`
        <span>✓</span>
        <small>APPLICATION RECEIVED</small>
        <h4>Registration Submitted Successfully!</h4>
        <p>Welcome to the TNYPL 2026 player registration process.</p>
        <div class="success-next-steps">
          <div><b>1</b><span>Your documents will be verified.</span></div>
          <div><b>2</b><span>Your payment will be confirmed.</span></div>
          <div><b>3</b><span>Your cricket profile will be reviewed.</span></div>
          <div><b>4</b><span>Verified players enter the official draft pool.</span></div>
          <div><b>5</b><span>You will receive confirmation by email or WhatsApp.</span></div>
        </div>`;
    }
    showRegistrationStep(4,false);

    if(button){
      button.textContent='✓ Registration Submitted';
      button.disabled=true;
    }
  }catch(err){
    console.error('Registration submission failed:',err);
    formMessage.textContent=err?.message || 'Registration could not be submitted. Please try again.';
    formMessage.className='error';
    if(button){
      button.disabled=false;
      button.textContent=originalText;
    }
  }
});

// Multi-step registration with validation.
const registrationTabs=[...document.querySelectorAll('.step-tab')];
const registrationPanels=[...document.querySelectorAll('.form-step')];
let currentRegistrationStep=1;

function showRegistrationStep(stepNumber,scroll=true){
  currentRegistrationStep=Math.max(1,Math.min(4,Number(stepNumber)||1));
  registrationTabs.forEach(tab=>{
    tab.classList.toggle('active',Number(tab.dataset.step)===currentRegistrationStep);
  });
  registrationPanels.forEach(panel=>{
    panel.classList.toggle('active',Number(panel.dataset.stepPanel)===currentRegistrationStep);
  });
  if(scroll){
    document.querySelector('.premium-form')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
}

function fieldLabel(field){
  return field.closest('label')?.childNodes[0]?.textContent?.trim() || field.name || 'Required field';
}

function validateRegistrationStep(stepNumber){
  const panel=document.querySelector(`[data-step-panel="${stepNumber}"]`);
  if(!panel)return true;

  const requiredFields=[...panel.querySelectorAll('[required]')];
  for(const field of requiredFields){
    let valid=true;

    if(field.type==='checkbox'){
      valid=field.checked;
    }else if(field.type==='file'){
      valid=Boolean(field.files && field.files.length);
    }else{
      valid=Boolean(String(field.value||'').trim());
    }

    if(valid && field.type==='email'){
      valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    }

    if(!valid){
      field.classList.add('field-error');
      const message=document.getElementById('formMessage');
      if(message){
        message.textContent=`Please complete: ${fieldLabel(field)}.`;
        message.className='error';
      }
      setTimeout(()=>{
        field.focus({preventScroll:true});
        field.scrollIntoView({behavior:'smooth',block:'center'});
      },50);
      return false;
    }
    field.classList.remove('field-error');
  }
  return true;
}

registrationTabs.forEach(tab=>tab.addEventListener('click',()=>{
  const target=Number(tab.dataset.step);
  if(target>currentRegistrationStep && !validateRegistrationStep(currentRegistrationStep))return;
  showRegistrationStep(target);
}));

document.querySelectorAll('.next-step').forEach(button=>button.addEventListener('click',()=>{
  if(!validateRegistrationStep(currentRegistrationStep))return;
  showRegistrationStep(currentRegistrationStep+1);
}));

document.querySelectorAll('.prev-step').forEach(button=>button.addEventListener('click',()=>{
  showRegistrationStep(currentRegistrationStep-1);
}));

// Optional live public stats endpoint.
(async function loadPublicStats(){
  try{
    const r=await fetch('/api/public-stats',{cache:'no-store'});
    if(!r.ok)return;
    const data=await r.json();
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=new Intl.NumberFormat('en-IN').format(Number(v||0))};
    set('metricRegistrations',data.registrations);
    set('metricVisitors',data.unique_visitors);
    set('metricCountries',data.countries_reached);
    if(data.verified_players!==undefined)set('metricVerified',data.verified_players);
    const pct=Math.min(100,Math.round((Number(data.registrations||0)/78)*100));
    const bar=document.getElementById('goalProgress');if(bar)bar.style.width=`${pct}%`;
    const caption=document.getElementById('goalCaption');if(caption)caption.textContent=`${data.registrations||0} registrations received · ${pct}% of 78-player goal`;
  }catch(e){}
})();

// V10 real visitor analytics through Netlify Functions.
(async function v10Analytics(){
  try{await fetch('/.netlify/functions/track-visit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:location.pathname})});}catch(e){}
  try{
    const r=await fetch('/.netlify/functions/public-stats',{cache:'no-store'}); if(!r.ok) return;
    const d=await r.json(), fmt=n=>new Intl.NumberFormat('en-IN').format(Number(n||0));
    const vals={metricVisitors:d.unique_visitors,metricPageViews:d.page_views,metricRegistrations:d.registrations,metricCountries:d.countries_reached,metricOnline:d.online_now,metricVerified:d.verified_players};
    Object.entries(vals).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=fmt(v)});
    const list=document.getElementById('countryList'); if(list) list.innerHTML=(d.countries||[]).length?(d.countries||[]).map(c=>`<div><span>${c.country_name||c.country_code}</span><b>${fmt(c.visitors)}</b></div>`).join(''):'<p>No country data recorded yet.</p>';
  }catch(e){}
})();
