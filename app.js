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
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;formMessage.textContent='Submitting registration...';formMessage.className='';
  try{
    if(!sb)throw new Error('Registration service is unavailable.');
    if(dob.value<cfg.MIN_DOB||dob.value>cfg.MAX_DOB)throw new Error('Eligible DOB is 01 January 2010 through 01 January 2012, inclusive.');
    const data=new FormData(form);
    const ageFile=document.getElementById('ageProof').files[0];
    const receiptFile=document.getElementById('paymentReceipt').files[0];
    const [agePath,receiptPath]=await Promise.all([uploadFile(ageFile,'age-proofs'),uploadFile(receiptFile,'payment-receipts')]);
    const payload={
      full_name:data.get('full_name'),date_of_birth:data.get('date_of_birth'),parent_name:data.get('parent_name'),
      parent_phone:data.get('parent_phone'),email:data.get('email'),district:data.get('district'),school:data.get('school'),
      academy:data.get('academy'),cricheroes_url:data.get('cricheroes_url'),primary_role:data.get('primary_role'),
      batting_style:data.get('batting_style'),bowling_style:data.get('bowling_style'),tshirt_size:data.get('tshirt_size'),
      pant_size:data.get('pant_size'),age_proof_path:agePath,payment_receipt_path:receiptPath,status:'pending'
    };
    const {error}=await sb.from('players').insert(payload);
    if(error)throw error;
    form.reset();ageDisplay.value='';
    formMessage.textContent='Registration received. Verification is pending before entry into the official draft pool.';
    formMessage.className='success';
  }catch(err){formMessage.textContent=err.message;formMessage.className='error'}
  finally{button.disabled=false}
});

// Multi-step registration.
(function setupSteps(){
  const tabs=[...document.querySelectorAll('.step-tab')];
  const panels=[...document.querySelectorAll('.form-step')];
  if(!tabs.length)return;
  let step=1;
  function show(n){
    step=Math.max(1,Math.min(4,n));
    tabs.forEach(t=>t.classList.toggle('active',Number(t.dataset.step)===step));
    panels.forEach(p=>p.classList.toggle('active',Number(p.dataset.stepPanel)===step));
    document.querySelector('.premium-form')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  tabs.forEach(t=>t.addEventListener('click',()=>show(Number(t.dataset.step))));
  document.querySelectorAll('.next-step').forEach(b=>b.addEventListener('click',()=>show(step+1)));
  document.querySelectorAll('.prev-step').forEach(b=>b.addEventListener('click',()=>show(step-1)));
})();

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
