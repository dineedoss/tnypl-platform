(() => {
  'use strict';
  const VERSION='1.2.6';
  const state={filter:'all',expanded:new Set(),page:1,pageSize:10,busy:false,timer:null};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const normEmail=v=>String(v||'').replace(/\u200B/g,'').trim().toLowerCase();
  const normDob=v=>{
    const s=String(v||'').replace(/[\u200B\u00A0]/g,' ').trim();
    let m=s.match(/\b((?:19|20)\d{2})\D*(\d{1,2})\D*(\d{1,2})\b/);
    if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    m=s.match(/\b(\d{1,2})\D+(\d{1,2})\D+((?:19|20)\d{2})\b/);
    if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return s.toLowerCase().replace(/[^a-z0-9]/g,'');
  };
  const keyOf=(email,dob)=>`${normEmail(email)}|${normDob(dob)}`;

  function playersArray(){try{return (typeof players!=='undefined'&&Array.isArray(players))?players:[]}catch(_){return[]}}
  function phoneOf(p){return p?.phone||p?.phone_number||p?.mobile||p?.mobile_number||p?.contact_number||p?.contact_phone||p?.parent_phone||p?.guardian_phone||p?.whatsapp_number||p?.whatsapp||''}
  function emailOf(p){return p?.email||p?.player_email||p?.parent_email||''}

  function removeV125Shell(){
    document.getElementById('tnyplProSidebar')?.remove();
    document.querySelectorAll('.tnypl-legacy-admin-top,.tnypl-legacy-kpis').forEach(el=>el.classList.remove('tnypl-legacy-admin-top','tnypl-legacy-kpis'));
    document.body.classList.remove('tnypl-admin-pro-v125');
    document.body.classList.add('tnypl-admin-pro-v126');
  }

  function findPlayerTable(){
    return [...document.querySelectorAll('table')].find(t=>{
      const h=(t.tHead?.innerText||t.querySelector('thead')?.innerText||'').toLowerCase();
      return h.includes('player')&&h.includes('dob')&&h.includes('district');
    })||null;
  }
  function headRow(table){return table.tHead?.rows?.[0]||table.querySelector('thead tr')}
  function findHeaderIndex(table,matcher){const h=headRow(table);if(!h)return-1;return[...h.cells].findIndex(c=>matcher((c.textContent||'').trim().toLowerCase()))}
  function playerIdx(table){const i=findHeaderIndex(table,t=>t.includes('player'));return i<0?0:i}
  function dobIdx(table){const i=findHeaderIndex(table,t=>t==='dob'||t.includes('date of birth'));return i<0?1:i}
  function emailFromRow(row,table){
    const c=row.cells?.[playerIdx(table)];if(!c)return'';
    const ma=c.querySelector('a[href^="mailto:"]');
    if(ma)return(ma.getAttribute('href')||'').replace(/^mailto:/i,'').trim()||ma.textContent.trim();
    return(c.innerText||c.textContent||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||'';
  }
  function dobFromRow(row,table){return(row.cells?.[dobIdx(table)]?.innerText||row.cells?.[dobIdx(table)]?.textContent||'').trim()}
  function domGroups(table){
    const map=new Map();
    for(const row of table.tBodies?.[0]?.rows||[]){
      if(row.dataset.tnyplSynthetic==='1')continue;
      const email=emailFromRow(row,table),dob=dobFromRow(row,table),key=keyOf(email,dob);
      if(!normEmail(email)||!normDob(dob))continue;
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(row);
    }
    return map;
  }

  function wrapTable(table){
    if(table.parentElement?.classList.contains('tnypl-admin-table-wrap'))return table.parentElement;
    const wrap=document.createElement('div');wrap.className='tnypl-admin-table-wrap';table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);return wrap;
  }

  function preserveNativeNavigation(){
    // v1.2.6 deliberately does not generate, replace or hide any existing navigation.
    // Add style hooks only to existing admin navigation/headers when present.
    [...document.querySelectorAll('nav,header')].forEach(el=>{
      const txt=(el.innerText||'').toLowerCase();
      if(/player registrations|franchise|match|sponsor|admin team|league vision/.test(txt))el.classList.add('tnypl-native-admin-nav');
    });
  }

  function ensureShell(table){
    removeV125Shell();preserveNativeNavigation();
    const parent=table.closest('main')||table.closest('[class*="container" i]')||table.parentElement?.parentElement;
    if(parent)parent.classList.add('tnypl-admin-registration-shell');
    let hdr=document.getElementById('tnyplTopHeader');
    if(!hdr){
      hdr=document.createElement('div');hdr.id='tnyplTopHeader';hdr.className='tnypl-top-header';
      hdr.innerHTML=`<div><h2>Player Registrations</h2><p>View and manage player registrations. Exact Email + DOB duplicates are grouped without deleting source records.</p></div><div class="tnypl-top-actions"><button type="button" id="tnyplRefresh">↻ Refresh</button></div>`;
      const anchor=table.closest('.tnypl-admin-table-wrap')||table;anchor.parentNode.insertBefore(hdr,anchor);
      hdr.querySelector('#tnyplRefresh').onclick=()=>location.reload();
    }
  }

  function ensurePhone(table){
    const h=headRow(table);if(!h)return;
    let idx=findHeaderIndex(table,t=>t==='phone');
    if(idx<0){const th=document.createElement('th');th.textContent='Phone';th.dataset.tnyplPhoneHead='1';const p=playerIdx(table);h.insertBefore(th,h.cells[p+1]||null);idx=p+1;}
    const arr=playersArray();
    for(const row of table.tBodies?.[0]?.rows||[]){
      let td=[...row.cells].find(c=>c.dataset.tnyplPhoneCell==='1');
      if(!td){td=document.createElement('td');td.dataset.tnyplPhoneCell='1';const p=playerIdx(table);row.insertBefore(td,row.cells[p+1]||null);}
      const email=emailFromRow(row,table);const p=arr.find(x=>normEmail(emailOf(x))===normEmail(email));const phone=String(phoneOf(p)||'').trim();
      row.dataset.tnyplPhone=phone.toLowerCase();
      td.innerHTML=phone?`<a class="tnypl-phone-link" href="tel:${esc(phone.replace(/[^+\d]/g,''))}">☎ ${esc(phone)}</a>`:'<span class="tnypl-empty-value">—</span>';
    }
  }

  function ensureDuplicateColumn(table,groups){
    const h=headRow(table);if(!h)return;
    let di=findHeaderIndex(table,t=>t==='duplicates');
    if(di<0){const th=document.createElement('th');th.textContent='Duplicates';th.dataset.tnyplDupHead='1';const ai=findHeaderIndex(table,t=>t==='actions');if(ai>=0)h.insertBefore(th,h.cells[ai]);else h.appendChild(th);}
    for(const [key,rows] of groups){
      const count=rows.length;
      rows.forEach((row,i)=>{
        row.dataset.tnyplDupKey=key;row.dataset.tnyplDupPrimary=i===0?'1':'0';row.dataset.tnyplDupCount=String(count);
        row.classList.toggle('tnypl-duplicate-row',i>0&&count>1);
        let td=[...row.cells].find(c=>c.dataset.tnyplDupCell==='1');
        if(!td){td=document.createElement('td');td.dataset.tnyplDupCell='1';const ai=findHeaderIndex(table,t=>t==='actions');if(ai>=0)row.insertBefore(td,row.cells[ai]);else row.appendChild(td);}
        td.innerHTML=i===0?`<span class="tnypl-duplicate-badge ${count===1?'is-unique':''}">${count}</span>${count>1?`<button type="button" class="tnypl-view-duplicates" data-key="${esc(key)}">View</button>`:''}`:'<span class="tnypl-duplicate-badge">↳</span>';
      });
    }
    table.querySelectorAll('.tnypl-view-duplicates').forEach(b=>b.onclick=()=>{const k=b.dataset.key;state.expanded.has(k)?state.expanded.delete(k):state.expanded.add(k);state.page=1;applyVisibility(table)});
  }

  function buildDashboard(table,groups){
    const rows=[...(table.tBodies?.[0]?.rows||[])];
    const total=rows.length,unique=groups.size,dupGroups=[...groups.values()].filter(g=>g.length>1).length,dupSubs=[...groups.values()].reduce((n,g)=>n+Math.max(0,g.length-1),0);
    const rejected=rows.filter(r=>/rejected/i.test(r.innerText||'')).length;
    let box=document.getElementById('tnyplRegistrationEnhancement');
    if(!box){box=document.createElement('section');box.id='tnyplRegistrationEnhancement';box.className='tnypl-reg-enhancement';document.getElementById('tnyplTopHeader').insertAdjacentElement('afterend',box);}
    box.innerHTML=`<div class="tnypl-reg-kpis">
      <div class="tnypl-reg-kpi blue"><small>Total Registrations</small><strong>${total}</strong><span>All submitted records</span></div>
      <div class="tnypl-reg-kpi green"><small>Unique Players</small><strong>${unique}</strong><span>Grouped by Email + DOB</span></div>
      <div class="tnypl-reg-kpi orange"><small>Duplicate Submissions</small><strong>${dupSubs}</strong><span>Extra matching submissions</span></div>
      <div class="tnypl-reg-kpi purple"><small>Duplicate Groups</small><strong>${dupGroups}</strong><span>Groups with 2+ records</span></div>
      <div class="tnypl-reg-kpi red"><small>Rejected Players</small><strong>${rejected}</strong><span>Not eligible</span></div>
    </div><div class="tnypl-reg-note"><b>Safe duplicate handling:</b> Existing records remain in Supabase. Exact normalized Email + DOB matches are shown once by default and can be expanded for review.</div>`;
  }

  function toolbar(table){
    let bar=document.getElementById('tnyplProToolbar');
    if(!bar){
      bar=document.createElement('div');bar.id='tnyplProToolbar';bar.className='tnypl-pro-toolbar';
      bar.innerHTML=`<div class="tnypl-search-wrap">⌕ <input id="tnyplProSearch" type="search" placeholder="Search by name, email, phone, district or role..."></div><select id="tnyplDupFilter"><option value="all">All Records</option><option value="duplicates">Duplicates Only</option><option value="unique">Unique Only</option></select><button type="button" id="tnyplClearFilters">Clear Filters</button>`;
      const wrap=table.closest('.tnypl-admin-table-wrap');wrap.parentNode.insertBefore(bar,wrap);
      bar.querySelector('#tnyplProSearch').addEventListener('input',()=>{state.page=1;applyVisibility(table)});
      bar.querySelector('#tnyplDupFilter').addEventListener('change',e=>{state.filter=e.target.value;state.page=1;applyVisibility(table)});
      bar.querySelector('#tnyplClearFilters').onclick=()=>{bar.querySelector('#tnyplProSearch').value='';bar.querySelector('#tnyplDupFilter').value='all';state.filter='all';state.page=1;applyVisibility(table)};
      [...document.querySelectorAll('button')].filter(b=>!b.closest('#tnyplProToolbar')&&!b.closest('#tnyplRegistrationEnhancement')&&/Export CSV|Send Pending Registration Emails/i.test(b.textContent||'')).forEach(b=>bar.appendChild(b));
    }
  }

  function pagination(table){
    let p=document.getElementById('tnyplPagination');if(p)return;
    p=document.createElement('div');p.id='tnyplPagination';p.className='tnypl-pagination';
    p.innerHTML='<div id="tnyplPageInfo"></div><div class="tnypl-page-controls"><button type="button" data-p="prev">‹</button><span id="tnyplPageCurrent">1 / 1</span><button type="button" data-p="next">›</button><select id="tnyplPageSize"><option selected>10</option><option>15</option><option>25</option><option>50</option><option>100</option></select><span>per page</span></div>';
    table.closest('.tnypl-admin-table-wrap').insertAdjacentElement('afterend',p);
    p.querySelector('[data-p="prev"]').onclick=()=>{if(state.page>1){state.page--;applyVisibility(table)}};
    p.querySelector('[data-p="next"]').onclick=()=>{state.page++;applyVisibility(table)};
    p.querySelector('#tnyplPageSize').onchange=e=>{state.pageSize=Number(e.target.value)||10;state.page=1;applyVisibility(table)};
  }

  function applyVisibility(table){
    const rows=[...(table.tBodies?.[0]?.rows||[])],q=(document.getElementById('tnyplProSearch')?.value||'').trim().toLowerCase(),visible=[];
    for(const row of rows){
      const count=Number(row.dataset.tnyplDupCount||1),primary=row.dataset.tnyplDupPrimary!=='0',key=row.dataset.tnyplDupKey||'';
      let show=true;
      if(state.filter==='duplicates')show=count>1;
      if(state.filter==='unique')show=count===1;
      if(count>1&&!primary&&!state.expanded.has(key))show=false;
      if(q){const hay=`${row.innerText||''} ${row.dataset.tnyplPhone||''}`.toLowerCase();show=show&&hay.includes(q)}
      if(show)visible.push(row);
    }
    const max=Math.max(1,Math.ceil(visible.length/state.pageSize));if(state.page>max)state.page=max;
    rows.forEach(r=>{r.hidden=true;r.style.display='none'});
    const start=(state.page-1)*state.pageSize,end=start+state.pageSize;visible.slice(start,end).forEach(r=>{r.hidden=false;r.style.display=''});
    const info=document.getElementById('tnyplPageInfo');if(info)info.textContent=visible.length?`Showing ${start+1} to ${Math.min(end,visible.length)} of ${visible.length} grouped records`:'No matching records';
    const cur=document.getElementById('tnyplPageCurrent');if(cur)cur.textContent=`${state.page} / ${max}`;
    const prev=document.querySelector('#tnyplPagination [data-p="prev"]'),next=document.querySelector('#tnyplPagination [data-p="next"]');if(prev)prev.disabled=state.page<=1;if(next)next.disabled=state.page>=max;
    table.querySelectorAll('.tnypl-view-duplicates').forEach(b=>b.textContent=state.expanded.has(b.dataset.key)?'Hide':'View');
  }

  function enhance(){
    if(state.busy)return;state.busy=true;
    try{
      removeV125Shell();
      const table=findPlayerTable();if(!table)return;
      wrapTable(table);ensureShell(table);ensurePhone(table);
      const groups=domGroups(table);
      ensureDuplicateColumn(table,groups);buildDashboard(table,groups);toolbar(table);pagination(table);
      table.classList.add('tnypl-pro-player-table');applyVisibility(table);
    }finally{state.busy=false}
  }
  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(enhance,300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
