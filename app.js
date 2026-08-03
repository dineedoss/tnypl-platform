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

// Tournament countdown.
// Until the exact first-ball time is confirmed, show calendar days in Chennai
// rather than misleading hours and minutes based on an assumed start time.
function getDatePartsInTimeZone(date, timeZone){
  const formatter=new Intl.DateTimeFormat('en-CA',{
    timeZone,
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  });
  const parts=Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
  );
  return {
    year:Number(parts.year),
    month:Number(parts.month),
    day:Number(parts.day)
  };
}

function calendarDaysUntilTournament(){
  const timeZone=cfg.TOURNAMENT_TIMEZONE||'Asia/Kolkata';
  const today=getDatePartsInTimeZone(new Date(),timeZone);
  const [targetYear,targetMonth,targetDay]=(cfg.TOURNAMENT_DATE||'2026-09-14')
    .split('-').map(Number);

  // UTC is used only to compare calendar-date components consistently.
  const todayCalendar=Date.UTC(today.year,today.month-1,today.day);
  const targetCalendar=Date.UTC(targetYear,targetMonth-1,targetDay);
  return Math.max(0,Math.ceil((targetCalendar-todayCalendar)/86400000));
}

function updateCountdown(){
  const daysElement=document.getElementById('countDays');
  const statusElement=document.getElementById('countdownTimeStatus');
  if(!daysElement)return;

  if(cfg.TOURNAMENT_START_TIME_CONFIRMED){
    const target=new Date(cfg.TOURNAMENT_START);
    const diff=Math.max(0,target-new Date());
    const days=Math.floor(diff/86400000);
    const hours=Math.floor((diff%86400000)/3600000);
    const minutes=Math.floor((diff%3600000)/60000);

    daysElement.textContent=String(days).padStart(2,'0');
    if(statusElement){
      statusElement.textContent=`${hours}h ${minutes}m remaining after ${days} full days`;
    }
  }else{
    daysElement.textContent=String(calendarDaysUntilTournament()).padStart(2,'0');
    if(statusElement){
      statusElement.textContent='First-ball time to be confirmed';
    }
  }
}
updateCountdown();
setInterval(updateCountdown,60000);

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


// Anonymous global visitor analytics and live registration counter.
(function initLiveAnalytics(){
  const ids={
    visitors:document.getElementById('metricVisitors'),
    views:document.getElementById('metricViews'),
    registrations:document.getElementById('metricRegistrations'),
    countries:document.getElementById('metricCountries'),
    online:document.getElementById('metricOnline')
  };
  if(!ids.visitors)return;

  const notice=document.getElementById('analyticsNotice');
  const countryList=document.getElementById('countryList');
  const updated=document.getElementById('statsUpdated');
  const storageKey='tnypl_anonymous_visitor_id';

  function getVisitorId(){
    let id=localStorage.getItem(storageKey);
    if(!id){
      id=crypto.randomUUID ? crypto.randomUUID() :
        `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey,id);
    }
    return id;
  }

  function number(value){return new Intl.NumberFormat('en-IN').format(Number(value||0))}
  function flag(code){
    if(!code||code==='XX'||code.length!==2)return '🌐';
    return [...code.toUpperCase()].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('');
  }
  function animateNumber(element,target){
    if(!element)return;
    const end=Number(target||0),start=Number(element.dataset.value||0);
    element.dataset.value=String(end);
    const begin=performance.now(),duration=650;
    function frame(now){
      const p=Math.min(1,(now-begin)/duration);
      const eased=1-Math.pow(1-p,3);
      element.textContent=number(Math.round(start+(end-start)*eased));
      if(p<1)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderCountries(countries){
    if(!Array.isArray(countries)||countries.length===0){
      countryList.innerHTML='<div class="analytics-empty">Visitor countries will appear here as people discover the league.</div>';
      return;
    }
    const max=Math.max(...countries.map(c=>Number(c.visitors||0)),1);
    countryList.innerHTML=countries.map(c=>`
      <div class="country-row">
        <span class="country-flag">${flag(c.country_code)}</span>
        <div class="country-info">
          <strong>${escapeHtml(c.country_name||'Unknown')}</strong>
          <span>${number(c.page_views)} page views</span>
        </div>
        <span class="country-number">${number(c.visitors)}</span>
        <div class="country-bar"><i style="width:${Math.max(8,(Number(c.visitors||0)/max)*100)}%"></i></div>
      </div>`).join('');
  }
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  async function track(){
    try{
      await fetch('/api/track-visit',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({visitorId:getVisitorId()})
      });
    }catch(error){console.warn('Visit tracking unavailable',error)}
  }

  async function refresh(){
    try{
      const response=await fetch('/api/public-stats',{cache:'no-store'});
      if(!response.ok)throw new Error('Live counter setup is incomplete');
      const data=await response.json();
      if(data.error)throw new Error(data.error);
      animateNumber(ids.visitors,data.unique_visitors);
      animateNumber(ids.views,data.page_views);
      animateNumber(ids.registrations,data.registrations);
      animateNumber(ids.countries,data.countries_reached);
      animateNumber(ids.online,data.online_now);
      renderCountries(data.countries);
      updated.textContent=`Updated ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
      notice.hidden=true;
    }catch(error){
      notice.hidden=false;
      updated.textContent='Setup required';
    }
  }

  (async()=>{await track();await refresh()})();
  setInterval(refresh,15000);
})();
