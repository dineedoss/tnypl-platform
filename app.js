const cfg=window.TNYPL_CONFIG;
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const form=document.getElementById('registrationForm');
const message=document.getElementById('formMessage');
const dob=document.getElementById('dob');
const ageDisplay=document.getElementById('ageDisplay');

document.getElementById('menuButton')?.addEventListener('click',()=>{
  document.getElementById('navLinks')?.classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(link=>link.addEventListener('click',()=>{
  document.getElementById('navLinks')?.classList.remove('open');
}));

function calculateAge(dateString){
  const birth=new Date(`${dateString}T00:00:00`);
  const reference=new Date(`${cfg.TOURNAMENT_START}T00:00:00`);
  let years=reference.getFullYear()-birth.getFullYear();
  let months=reference.getMonth()-birth.getMonth();
  let days=reference.getDate()-birth.getDate();
  if(days<0){months--;const priorMonth=new Date(reference.getFullYear(),reference.getMonth(),0);days+=priorMonth.getDate();}
  if(months<0){years--;months+=12;}
  return `${years}y ${months}m ${days}d on 14 Aug 2026`;
}

dob.min=cfg.MIN_DOB;
dob.max=cfg.MAX_DOB;
dob.addEventListener('change',()=>{
  ageDisplay.value=dob.value?calculateAge(dob.value):'';
});

async function uploadFile(file,folder){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${folder}/${crypto.randomUUID()}-${safe}`;
  const {error}=await sb.storage.from('player-documents').upload(path,file);
  if(error)throw error;
  return path;
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;
  message.textContent='Submitting registration...';
  message.className='';
  try{
    if(dob.value<cfg.MIN_DOB||dob.value>cfg.MAX_DOB){
      throw new Error('Eligible date of birth is 01 January 2010 through 01 January 2012, inclusive.');
    }
    const data=new FormData(form);
    const ageProof=document.getElementById('ageProof').files[0];
    const receipt=document.getElementById('paymentReceipt').files[0];
    const [agePath,receiptPath]=await Promise.all([
      uploadFile(ageProof,'age-proofs'),
      uploadFile(receipt,'payment-receipts')
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
      status:'pending'
    };
    const {error}=await sb.from('players').insert(payload);
    if(error)throw error;
    form.reset();
    ageDisplay.value='';
    message.textContent='Registration received. Age and payment verification are pending before draft eligibility.';
    message.className='success';
  }catch(error){
    message.textContent=error.message;
    message.className='error';
  }finally{
    button.disabled=false;
  }
});

// Load the YouTube live draft stream when a video ID is configured.
(function loadDraftStream(){
  const frame=document.getElementById('draftVideoFrame');
  const videoId=window.TNYPL_CONFIG?.YOUTUBE_DRAFT_VIDEO_ID;
  if(!frame||!videoId||videoId==='YOUR_LIVE_DRAFT_VIDEO_ID') return;
  frame.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0" title="TNYPL Live Player Draft" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
})();
