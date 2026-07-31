
const cfg = window.TNYPL_CONFIG;
const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
const form = document.getElementById('registrationForm');
const msg = document.getElementById('formMessage');
const dob = document.getElementById('dob');
const ageDisplay = document.getElementById('ageDisplay');
document.getElementById('youtubeFrame').src = `https://www.youtube.com/embed/${cfg.YOUTUBE_VIDEO_ID}`;

function ageOnToday(dateString){
  const d=new Date(dateString), t=new Date();
  let age=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) age--;
  return age;
}
dob.min=cfg.MIN_DOB; dob.max=cfg.MAX_DOB;
dob.addEventListener('change',()=> ageDisplay.value = dob.value ? `${ageOnToday(dob.value)} years` : '');

async function uploadFile(file, folder){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${folder}/${crypto.randomUUID()}-${safe}`;
  const {error}=await sb.storage.from('player-documents').upload(path,file);
  if(error) throw error;
  return path;
}

form.addEventListener('submit', async e=>{
  e.preventDefault(); msg.textContent='Submitting...'; msg.className='full';
  try{
    if(dob.value<cfg.MIN_DOB || dob.value>cfg.MAX_DOB) throw new Error('Player is outside the official U13–U14 date-of-birth window.');
    const fd=new FormData(form);
    const ageProof=document.getElementById('ageProof').files[0];
    const receipt=document.getElementById('paymentReceipt').files[0];
    const agePath=await uploadFile(ageProof,'age-proofs');
    const receiptPath=await uploadFile(receipt,'payment-receipts');
    const payload={
      full_name:fd.get('full_name'),date_of_birth:fd.get('date_of_birth'),parent_name:fd.get('parent_name'),
      parent_phone:fd.get('parent_phone'),email:fd.get('email'),district:fd.get('district'),school:fd.get('school'),
      academy:fd.get('academy'),cricheroes_url:fd.get('cricheroes_url'),primary_role:fd.get('primary_role'),
      batting_style:fd.get('batting_style'),bowling_style:fd.get('bowling_style'),tshirt_size:fd.get('tshirt_size'),
      pant_size:fd.get('pant_size'),age_proof_path:agePath,payment_receipt_path:receiptPath,status:'pending'
    };
    const {error}=await sb.from('players').insert(payload);
    if(error) throw error;
    form.reset(); ageDisplay.value='';
    msg.textContent='Registration received. Your application is pending payment and age verification.';
    msg.className='full success';
  }catch(err){msg.textContent=err.message;msg.className='full error';}
});
