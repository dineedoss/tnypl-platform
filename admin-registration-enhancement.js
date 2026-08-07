(() => {
  'use strict';
  const VERSION='1.2.4';
  const ENH_ID='tnyplRegistrationEnhancement';
  const FILTER_ID='tnyplDuplicateFilter';
  const PAGE_SIZE_ID='tnyplPageSize';
  const PAGE_INFO_ID='tnyplPageInfo';
  const state={expanded:new Set(),filter:'all',busy:false,timer:null,page:1,pageSize:15};

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const normEmail=v=>String(v||'').trim().toLowerCase();
  const normDob=v=>String(v||'').trim().replace(/\s+/g,'').slice(0,10);
  const keyOf=(email,dob)=>`${normEmail(email)}|${normDob(dob)}`;

  function playerArray(){
    try { return (typeof players!=='undefined' && Array.isArray(players)) ? players : []; }
    catch(_) { return []; }
  }
  function dobOf(p){ return p?.date_of_birth||p?.dob||p?.dateOfBirth||''; }
  function phoneOf(p){
    return p?.phone || p?.phone_number || p?.mobile || p?.mobile_number || p?.contact_number ||
      p?.contact_phone || p?.parent_phone || p?.guardian_phone || p?.whatsapp_number || p?.whatsapp || '';
  }
  function playerKey(p){ return keyOf(p?.email,dobOf(p)); }
  function groupsFromPlayers(){
    const map=new Map();
    for(const p of playerArray()){
      const key=playerKey(p);
      if(key==='|') continue;
      if(!map.has(key)) map.set(key,[]);
      map.get(key).push(p);
    }
    return map;
  }

  function findPlayerTable(){
    return [...document.querySelectorAll('table')].find(t=>{
      const h=(t.tHead?.innerText||t.querySelector('thead')?.innerText||'').toLowerCase();
      return h.includes('player') && h.includes('dob') && h.includes('district');
    }) || null;
  }
  function headRow(table){ return table.tHead?.rows?.[0]||table.querySelector('thead tr'); }
  function headerIndex(table,label){
    const h=headRow(table); if(!h) return -1;
    label=String(label).toLowerCase();
    return [...h.cells].findIndex(c=>(c.textContent||'').trim().toLowerCase()===label);
  }
  function playerIndex(table){
    const h=headRow(table); if(!h) return 0;
    const i=[...h.cells].findIndex(c=>(c.textContent||'').toLowerCase().includes('player'));
    return i<0?0:i;
  }
  function dobIndex(table){
    const i=headerIndex(table,'dob'); return i<0?1:i;
  }
  function cellEmail(row,table){
    const first=row.cells?.[playerIndex(table)];
    if(!first) return '';
    const a=first.querySelector('a[href^="mailto:"]');
    const mail=a?.textContent || a?.getAttribute('href')?.replace(/^mailto:/i,'');
    if(mail) return mail.trim();
    return (first.innerText||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||'';
  }
  function cellDob(row,table){
    const text=row.cells?.[dobIndex(table)]?.innerText?.trim()||'';
    return normDob(text);
  }
  function findPlayerForRow(row,table,groups){
    const key=keyOf(cellEmail(row,table),cellDob(row,table));
    const arr=groups.get(key)||[];
    const dupOrdinal=[...row.parentElement?.rows||[]]
      .filter(r=>keyOf(cellEmail(r,table),cellDob(r,table))===key)
      .indexOf(row);
    return arr[Math.max(0,dupOrdinal)] || arr[0] || playerArray().find(p=>normEmail(p?.email)===normEmail(cellEmail(row,table))) || null;
  }

  function markLayout(table){
    document.body.classList.add('tnypl-admin-pro-v124');
    const main=table.closest('main') || table.closest('[class*="content" i]') || table.parentElement?.parentElement;
    if(main) main.classList.add('tnypl-admin-registration-shell');
  }
  function ensureTableWrap(table){
    if(table.parentElement?.classList.contains('tnypl-admin-table-wrap')) return;
    const wrap=document.createElement('div'); wrap.className='tnypl-admin-table-wrap';
    table.parentNode.insertBefore(wrap,table); wrap.appendChild(table);
  }

  function ensurePhoneColumn(table,groups){
    const h=headRow(table); if(!h) return;
    let idx=[...h.cells].findIndex(c=>c.dataset?.tnyplPhoneHead==='1' || (c.textContent||'').trim().toLowerCase()==='phone');
    if(idx<0){
      const th=document.createElement('th'); th.textContent='Phone'; th.dataset.tnyplPhoneHead='1';
      const pIdx=playerIndex(table);
      h.insertBefore(th,h.cells[pIdx+1]||null);
      idx=[...h.cells].indexOf(th);
    } else h.cells[idx].dataset.tnyplPhoneHead='1';

    for(const row of table.tBodies?.[0]?.rows||[]){
      let td=[...row.cells].find(c=>c.dataset?.tnyplPhoneCell==='1');
      if(!td){
        td=document.createElement('td'); td.dataset.tnyplPhoneCell='1';
        const pIdx=playerIndex(table);
        row.insertBefore(td,row.cells[pIdx+1]||null);
      }
      const p=findPlayerForRow(row,table,groups);
      const phone=String(phoneOf(p)||'').trim();
      if(phone){
        const tel=phone.replace(/[^+\d]/g,'');
        td.innerHTML=`<a class="tnypl-phone-link" href="tel:${esc(tel||phone)}" title="Call ${esc(phone)}"><span aria-hidden="true">☎</span><span>${esc(phone)}</span></a>`;
        row.dataset.tnyplPhone=phone.toLowerCase();
      }else{
        td.innerHTML='<span class="tnypl-empty-value">—</span>';
        row.dataset.tnyplPhone='';
      }
    }
  }

  function buildSummary(table,groups){
    const all=playerArray(); if(!all.length) return;
    const unique=groups.size;
    const dupGroups=[...groups.values()].filter(v=>v.length>1).length;
    const dupSubmissions=[...groups.values()].reduce((n,v)=>n+Math.max(0,v.length-1),0);
    let box=document.getElementById(ENH_ID);
    if(!box){
      box=document.createElement('section'); box.id=ENH_ID; box.className='tnypl-reg-enhancement';
      const anchor=table.closest('.tnypl-admin-table-wrap')||table; anchor.parentNode.insertBefore(box,anchor);
    }
    box.innerHTML=`
      <div class="tnypl-reg-heading"><div><h1>Player Registrations</h1><p>Manage registrations, contact details, eligibility, tiering and franchise assignment.</p></div><span class="tnypl-version-pill">Admin v${VERSION}</span></div>
      <div class="tnypl-reg-kpis">
        <div class="tnypl-reg-kpi"><small>Total registrations</small><strong>${all.length}</strong><span>All submitted records</span></div>
        <div class="tnypl-reg-kpi"><small>Unique players</small><strong>${unique}</strong><span>Grouped by Email + DOB</span></div>
        <div class="tnypl-reg-kpi"><small>Duplicate submissions</small><strong>${dupSubmissions}</strong><span>Preserved for review</span></div>
        <div class="tnypl-reg-kpi"><small>Duplicate groups</small><strong>${dupGroups}</strong><span>Need review / correction</span></div>
      </div>
      <div class="tnypl-reg-note"><span>ⓘ</span><div><b>Safe duplicate handling:</b> existing registrations are never deleted. Same Email + DOB submissions are grouped; the same parent email with a different DOB remains valid for siblings.</div></div>`;
  }

  function ensureFilter(table){
    let f=document.getElementById(FILTER_ID);
    if(!f){
      f=document.createElement('select'); f.id=FILTER_ID; f.className='tnypl-reg-filter';
      f.innerHTML='<option value="all">All records</option><option value="duplicates">Duplicates only</option><option value="unique">Unique only</option>';
      f.value=state.filter;
      f.addEventListener('change',()=>{state.filter=f.value;state.page=1;applyRowVisibility(table)});
      const search=document.querySelector('input[placeholder*="Search" i]');
      const toolbar=search?.parentElement || table.parentElement;
      if(toolbar){ toolbar.classList.add('tnypl-admin-toolbar'); toolbar.appendChild(f); }
    }
    const search=document.querySelector('input[placeholder*="Search" i]');
    if(search){
      search.placeholder='Search name, email, phone, district or role...';
      if(!search.dataset.tnyplPhoneSearch){
        search.dataset.tnyplPhoneSearch='1';
        search.addEventListener('input',()=>{state.page=1;setTimeout(()=>applyRowVisibility(table),0)});
      }
    }
    return f;
  }

  function ensureDuplicateColumn(table,groups){
    const h=headRow(table); if(!h) return;
    let dupIndex=[...h.cells].findIndex(c=>c.dataset?.tnyplDupHead==='1' || (c.textContent||'').trim().toLowerCase()==='duplicates');
    if(dupIndex<0){
      const th=document.createElement('th'); th.textContent='Duplicates'; th.dataset.tnyplDupHead='1';
      const actions=[...h.cells].find(c=>(c.textContent||'').trim().toLowerCase()==='actions');
      if(actions) h.insertBefore(th,actions); else h.appendChild(th);
    }
    const visibleGroups=new Map();
    for(const row of table.tBodies?.[0]?.rows||[]){
      const key=keyOf(cellEmail(row,table),cellDob(row,table));
      if(!visibleGroups.has(key)) visibleGroups.set(key,[]); visibleGroups.get(key).push(row);
    }
    for(const [key,rows] of visibleGroups){
      const total=groups.get(key)?.length || rows.length;
      rows.forEach((row,i)=>{
        row.dataset.tnyplDupKey=key; row.dataset.tnyplDupPrimary=i===0?'1':'0'; row.dataset.tnyplDupCount=String(total);
        row.classList.toggle('tnypl-duplicate-row',i>0 && total>1);
        let td=[...row.cells].find(c=>c.dataset?.tnyplDupCell==='1');
        if(!td){
          td=document.createElement('td'); td.dataset.tnyplDupCell='1';
          const actionCell=[...row.cells].find(c=>/reject|pay|draft|action/i.test(c.innerText||''));
          if(actionCell) row.insertBefore(td,actionCell); else row.appendChild(td);
        }
        td.innerHTML=i===0
          ? `<span class="tnypl-duplicate-badge ${total>1?'':'is-unique'}">${total}</span>${total>1?`<button type="button" class="tnypl-view-duplicates" data-key="${esc(key)}">${state.expanded.has(key)?'Hide':'View'}</button>`:''}`
          : '<span class="tnypl-duplicate-badge">↳</span>';
      });
    }
    table.querySelectorAll('.tnypl-view-duplicates').forEach(btn=>{
      btn.onclick=()=>{ const key=btn.dataset.key; state.expanded.has(key)?state.expanded.delete(key):state.expanded.add(key); applyRowVisibility(table); };
    });
  }

  function ensurePagination(table){
    let bar=document.getElementById('tnyplPagination');
    if(!bar){
      bar=document.createElement('div'); bar.id='tnyplPagination'; bar.className='tnypl-pagination';
      bar.innerHTML=`<div id="${PAGE_INFO_ID}"></div><div class="tnypl-page-controls"><button type="button" data-page="prev">‹</button><span class="tnypl-page-current">1</span><button type="button" data-page="next">›</button><select id="${PAGE_SIZE_ID}"><option>10</option><option selected>15</option><option>25</option><option>50</option><option>100</option></select><span>per page</span></div>`;
      const wrap=table.closest('.tnypl-admin-table-wrap'); wrap?.insertAdjacentElement('afterend',bar);
      bar.querySelector('[data-page="prev"]').onclick=()=>{if(state.page>1){state.page--;applyRowVisibility(table)}};
      bar.querySelector('[data-page="next"]').onclick=()=>{state.page++;applyRowVisibility(table)};
      bar.querySelector(`#${PAGE_SIZE_ID}`).onchange=e=>{state.pageSize=Number(e.target.value)||15;state.page=1;applyRowVisibility(table)};
    }
  }

  function baseVisible(row){
    // Respect rows hidden by the original admin filters before our pagination pass.
    const inline=row.style?.display;
    if(inline==='none' && row.dataset.tnyplHiddenByUs!=='1') return false;
    return true;
  }
  function applyRowVisibility(table){
    const rows=[...(table.tBodies?.[0]?.rows||[])];
    const search=(document.querySelector('input[placeholder*="Search" i]')?.value||'').trim().toLowerCase();
    const candidates=[];
    for(const row of rows){
      row.dataset.tnyplHiddenByUs='0';
      row.hidden=false;
      const key=row.dataset.tnyplDupKey||'';
      const primary=row.dataset.tnyplDupPrimary==='1';
      const count=Number(row.dataset.tnyplDupCount||1);
      let show=baseVisible(row);
      if(state.filter==='duplicates') show=show&&count>1;
      if(state.filter==='unique') show=show&&count===1;
      if(count>1 && !primary && !state.expanded.has(key)) show=false;
      if(search && row.dataset.tnyplPhone?.includes(search)) show=true;
      if(show) candidates.push(row);
    }
    const total=candidates.length;
    const maxPage=Math.max(1,Math.ceil(total/state.pageSize));
    if(state.page>maxPage) state.page=maxPage;
    const start=(state.page-1)*state.pageSize, end=start+state.pageSize;
    rows.forEach(row=>{ row.hidden=true; row.dataset.tnyplHiddenByUs='1'; });
    candidates.slice(start,end).forEach(row=>{ row.hidden=false; row.dataset.tnyplHiddenByUs='0'; });
    const info=document.getElementById(PAGE_INFO_ID);
    if(info) info.textContent=total?`Showing ${start+1}–${Math.min(end,total)} of ${total} records`:'No matching records';
    const cur=document.querySelector('.tnypl-page-current'); if(cur) cur.textContent=`${state.page} / ${maxPage}`;
    const prev=document.querySelector('[data-page="prev"]'), next=document.querySelector('[data-page="next"]');
    if(prev) prev.disabled=state.page<=1; if(next) next.disabled=state.page>=maxPage;
    table.querySelectorAll('.tnypl-view-duplicates').forEach(btn=>btn.textContent=state.expanded.has(btn.dataset.key)?'Hide':'View');
  }

  function enhance(){
    if(state.busy) return; state.busy=true;
    try{
      const table=findPlayerTable(); if(!table) return;
      markLayout(table);
      const groups=groupsFromPlayers();
      ensureTableWrap(table);
      ensurePhoneColumn(table,groups);
      buildSummary(table,groups);
      ensureFilter(table);
      ensureDuplicateColumn(table,groups);
      ensurePagination(table);
      table.classList.add('tnypl-pro-player-table');
      applyRowVisibility(table);
    } finally { state.busy=false; }
  }
  function schedule(){ clearTimeout(state.timer); state.timer=setTimeout(enhance,120); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance); else enhance();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
