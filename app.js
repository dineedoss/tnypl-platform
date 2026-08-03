const cfg=window.TNYPL_CONFIG;
const sb=window.supabase?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;

// Intro plays once per browser session.
const intro=document.getElementById('intro');
function closeIntro(){if(!intro)return;intro.classList.add('hide');sessionStorage.setItem('tnyplIntroSeen','1');setTimeout(()=>intro.remove(),900)}
if(intro){
  if(sessionStorage.getItem('tnyplIntroSeen')==='1')intro.remove();
  else{document.getElementById('skipIntro')?.addEventListener('click',closeIntro);setTimeout(closeIntro,4200)}
}

// Mobile navigation.
document.getElementById('menuToggle')?.addEventListener('click',()=>document.getElementById('navLinks')?.classList.toggle('open'));
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks')?.classList.remove('open')));

// Countdown.
function updateCountdown(){
  const target=new Date(cfg.TOURNAMENT_START);
  const diff=Math.max(0,target-new Date());
  const days=Math.floor(diff/86400000);
  const hours=Math.floor((diff%86400000)/3600000);
  const mins=Math.floor((diff%3600000)/60000);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v).padStart(2,'0')};
  set('countDays',days);set('countHours',hours);set('countMinutes',mins);
}
updateCountdown();setInterval(updateCountdown,30000);

// Owner modal.
const modal=document.getElementById('ownerModal');
document.querySelectorAll('.owner-view').forEach(btn=>btn.addEventListener('click',()=>{
  const card=btn.closest('.franchise-card');
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

// YouTube live draft.
(function loadDraft(){
  const id=cfg.YOUTUBE_DRAFT_VIDEO_ID;
  const stage=document.getElementById('draftVideo');
  if(!stage||!id||id==='YOUR_LIVE_DRAFT_VIDEO_ID')return;
  stage.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&rel=0" title="TNYPL Live Player Draft" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe>`;
})();

// Registration and age calculation.
const form=document.getElementById('registrationForm');
const dob=document.getElementById('dob');
const ageDisplay=document.getElementById('ageDisplay');
const formMessage=document.getElementById('formMessage');

function calculateAge(dateString){
  const birth=new Date(`${dateString}T00:00:00`);
  const ref=new Date('2026-08-14T00:00:00');
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
