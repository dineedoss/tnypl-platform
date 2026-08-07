const cfg=window.TNYPL_CONFIG;
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
let players=[];
const teams=["Chennai Strikers","Kovai Kings","Karaikudi Kings","Trichy Titans","Nellai Falcons","Tiruppur Blazers","Thanjavur Royals","Tuticorin Sharks"];
const loginPanel=document.getElementById('loginPanel'),dashboard=document.getElementById('dashboard'),body=document.getElementById('playersBody');

async function checkSession(){const{data}=await sb.auth.getSession();data.session?showDashboard():showLogin()}
function showLogin(){loginPanel.hidden=false;dashboard.hidden=true}
async function showDashboard(){loginPanel.hidden=true;dashboard.hidden=false;await loadPlayers()}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:adminEmail.value,password:adminPassword.value});loginMessage.textContent=error?error.message:'';if(!error)showDashboard()});
document.getElementById('logoutBtn').onclick=async()=>{await sb.auth.signOut();showLogin()};

async function loadPlayers(){const{data,error}=await sb.from('players').select('*').order('created_at',{ascending:false});if(error){alert(error.message);return}players=data||[];renderStats();renderTable()}
function renderStats(){totalCount.textContent=players.length;paymentCount.textContent=players.filter(p=>p.payment_verified).length;ageCount.textContent=players.filter(p=>p.age_verified).length;eligibleCount.textContent=players.filter(p=>p.status==='eligible'||p.drafted).length}
function filtered(){const q=searchInput.value.toLowerCase(),s=statusFilter.value;return players.filter(p=>(!s||(s==='drafted'?p.drafted:p.status===s))&&(`${p.full_name} ${p.district} ${p.primary_role} ${p.drafted_team||''}`.toLowerCase().includes(q)))}

async function signedLink(path){
  if(!path)return null;
  const {data,error}=await sb.storage.from('player-documents').createSignedUrl(path,900);
  return error?null:data.signedUrl;
}
async function openAttachment(path){
  const url=await signedLink(path);
  if(!url){alert('Unable to open this attachment. Confirm storage policies and admin access.');return}
  window.open(url,'_blank','noopener');
}
window.openAttachment=openAttachment;

function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
function renderTable(){body.innerHTML=filtered().map(p=>`<tr>
<td><strong>${esc(p.full_name)}</strong><br><small>${esc(p.email)}</small></td>
<td>${esc(p.date_of_birth)}</td><td>${esc(p.district)}</td><td>${esc(p.primary_role)}</td>
<td>${p.cricheroes_url?`<a href="${esc(p.cricheroes_url)}" target="_blank">Open</a>`:'—'}</td>
<td><button onclick="openAttachment('${esc(p.age_proof_path)}')">Age proof</button> <button onclick="openAttachment('${esc(p.payment_receipt_path)}')">Receipt</button></td>
<td>${p.payment_verified?'✅':'⏳'}</td><td>${p.age_verified?'✅':'⏳'}</td>
<td>${p.drafted?'Drafted':esc(p.status)}</td>
<td><select id="team-${p.id}"><option value="">Select team</option>${teams.map(t=>`<option ${p.drafted_team===t?'selected':''}>${t}</option>`).join('')}</select></td>
<td>
<button onclick="toggleVerify('${p.id}','payment_verified',${!p.payment_verified})">Payment</button>
<button onclick="toggleVerify('${p.id}','age_verified',${!p.age_verified})">Age</button>
<button onclick="setStatus('${p.id}','eligible')">Eligible</button>
<button onclick="draftPlayer('${p.id}')">Draft + Email</button>
<button onclick="setStatus('${p.id}','rejected')">Reject</button>
</td></tr>`).join('')}

window.toggleVerify=async(id,field,value)=>{const{error}=await sb.from('players').update({[field]:value}).eq('id',id);if(error)alert(error.message);await loadPlayers()}
window.setStatus=async(id,status)=>{const p=players.find(x=>x.id===id);if(status==='eligible'&&(!p.payment_verified||!p.age_verified)){alert('Verify payment and age first.');return}const{error}=await sb.from('players').update({status}).eq('id',id);if(error)alert(error.message);await loadPlayers()}
window.draftPlayer=async id=>{
  const p=players.find(x=>x.id===id),team=document.getElementById(`team-${id}`).value;
  if(!p.payment_verified||!p.age_verified){alert('Verify payment and age before drafting.');return}
  if(!team){alert('Select a franchise.');return}
  if(!confirm(`Draft ${p.full_name} to ${team} and send the congratulations email?`))return;
  const {error}=await sb.from('players').update({drafted:true,drafted_team:team,drafted_at:new Date().toISOString(),status:'drafted'}).eq('id',id);
  if(error){alert(error.message);return}
  const {data:{session}}=await sb.auth.getSession();
  const response=await fetch('/.netlify/functions/send-player-email',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${session.access_token}`},body:JSON.stringify({type:'drafted',player_id:id})});
  const result=await response.json();
  if(!response.ok)alert(`Player drafted, but email failed: ${result.error}`);else alert('Player drafted and congratulations email sent.');
  await loadPlayers()
}
searchInput.oninput=renderTable;statusFilter.onchange=renderTable;
exportBtn.onclick=()=>{const cols=['full_name','date_of_birth','parent_name','parent_phone','email','district','school','academy','cricheroes_url','primary_role','batting_style','bowling_style','tshirt_size','pant_size','payment_verified','age_verified','status','drafted','drafted_team','drafted_at'];const csv=[cols.join(','),...players.map(p=>cols.map(c=>`"${String(p[c]??'').replaceAll('"','""')}"`).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='tnypl-players.csv';a.click()}
checkSession();

document.getElementById('sendPendingRegistrationEmails')?.addEventListener('click',async()=>{
  const btn=document.getElementById('sendPendingRegistrationEmails');
  if(!confirm('Send confirmation emails only to registrations that have not yet received one?'))return;
  btn.disabled=true;
  const oldText=btn.textContent;
  btn.textContent='Sending...';
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(!session)throw new Error('Admin session expired. Please log in again.');
    const response=await fetch('/.netlify/functions/process-registration-emails',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'authorization':`Bearer ${session.access_token}`
      },
      body:JSON.stringify({limit:20})
    });
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Unable to process registration emails.');
    alert(
  `Registration emails processed: ${result.processed}\n` +
  `Sent: ${result.sent}\n` +
  `Failed: ${result.failed}\n\n` +
  (result.failed_items?.length
    ? `First error: ${result.failed_items[0].error}`
    : 'No error details returned.')
);
    await loadPlayers();
  }catch(err){
    alert(`Email processing failed: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
  }
});
