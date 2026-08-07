(() => {
  'use strict';
  const ENH_ID='tnyplRegistrationEnhancement';
  const FILTER_ID='tnyplDuplicateFilter';
  const state={expanded:new Set(),filter:'all',busy:false,timer:null};

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const normEmail=v=>String(v||'').trim().toLowerCase();
  const normDob=v=>String(v||'').trim().slice(0,10);
  const keyOf=(email,dob)=>`${normEmail(email)}|${normDob(dob)}`;

  function playerArray(){
    try { return (typeof players!=='undefined' && Array.isArray(players)) ? players : []; }
    catch(_) { return []; }
  }

  function playerKey(p){ return keyOf(p?.email,p?.date_of_birth||p?.dob); }
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

  function cellEmail(row){
    const first=row.cells?.[0];
    if(!first) return '';
    const mail=first.querySelector('a[href^="mailto:"]')?.textContent || first.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.replace(/^mailto:/i,'');
    if(mail) return mail.trim();
    const m=(first.innerText||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m?.[0]||'';
  }

  function cellDob(row){
    const text=row.cells?.[1]?.innerText?.trim()||'';
    // Browser text may wrap yyyy-mm-dd; remove whitespace around separators.
    return text.replace(/\s+/g,'').slice(0,10);
  }

  function ensureTableWrap(table){
    if(table.parentElement?.classList.contains('tnypl-admin-table-wrap')) return;
    const wrap=document.createElement('div');
    wrap.className='tnypl-admin-table-wrap';
    table.parentNode.insertBefore(wrap,table);
    wrap.appendChild(table);
  }

  function buildSummary(table, groups){
    const all=playerArray();
    if(!all.length) return;
    const unique=groups.size;
    const dupGroups=[...groups.values()].filter(v=>v.length>1).length;
    const dupSubmissions=[...groups.values()].reduce((n,v)=>n+Math.max(0,v.length-1),0);
    let box=document.getElementById(ENH_ID);
    if(!box){
      box=document.createElement('section');
      box.id=ENH_ID;
      box.className='tnypl-reg-enhancement';
      const anchor=table.closest('.tnypl-admin-table-wrap')||table;
      anchor.parentNode.insertBefore(box,anchor);
    }
    box.innerHTML=`
      <div class="tnypl-reg-kpis">
        <div class="tnypl-reg-kpi"><small>Total registrations</small><strong>${all.length}</strong><span>All submitted records</span></div>
        <div class="tnypl-reg-kpi"><small>Unique players</small><strong>${unique}</strong><span>Grouped by Email + DOB</span></div>
        <div class="tnypl-reg-kpi"><small>Duplicate submissions</small><strong>${dupSubmissions}</strong><span>Preserved for admin review</span></div>
        <div class="tnypl-reg-kpi"><small>Duplicate groups</small><strong>${dupGroups}</strong><span>Need review / correction</span></div>
      </div>
      <div class="tnypl-reg-note"><span>ⓘ</span><div><b>Safe duplicate handling:</b> existing registrations are never deleted. Rows with the same normalized Email ID and Date of Birth are grouped in this admin view. The same parent email with a different DOB remains valid for siblings.</div></div>`;
  }

  function ensureFilter(table){
    let f=document.getElementById(FILTER_ID);
    if(f) return f;
    f=document.createElement('select');
    f.id=FILTER_ID; f.className='tnypl-reg-filter';
    f.innerHTML='<option value="all">All duplicates</option><option value="duplicates">Duplicates only</option><option value="unique">Unique only</option>';
    f.value=state.filter;
    f.addEventListener('change',()=>{state.filter=f.value;applyRowVisibility(table)});

    const search=document.querySelector('input[placeholder*="Search" i]');
    const toolbar=search?.parentElement || table.parentElement;
    if(toolbar) toolbar.appendChild(f);
    return f;
  }

  function ensureDuplicateColumn(table, groups){
    const headRow=table.tHead?.rows?.[0]||table.querySelector('thead tr');
    if(!headRow) return;
    let dupIndex=[...headRow.cells].findIndex(c=>c.dataset?.tnyplDupHead==='1');
    if(dupIndex<0){
      const th=document.createElement('th'); th.textContent='Duplicates'; th.dataset.tnyplDupHead='1';
      const actions=[...headRow.cells].find(c=>(c.textContent||'').trim().toLowerCase()==='actions');
      if(actions) headRow.insertBefore(th,actions); else headRow.appendChild(th);
      dupIndex=[...headRow.cells].indexOf(th);
    }

    const visibleGroups=new Map();
    for(const row of table.tBodies?.[0]?.rows||[]){
      const email=cellEmail(row),dob=cellDob(row),key=keyOf(email,dob);
      if(!visibleGroups.has(key)) visibleGroups.set(key,[]);
      visibleGroups.get(key).push(row);
    }

    for(const [key,rows] of visibleGroups){
      const total=groups.get(key)?.length || rows.length;
      rows.forEach((row,i)=>{
        row.dataset.tnyplDupKey=key;
        row.dataset.tnyplDupPrimary=i===0?'1':'0';
        row.dataset.tnyplDupCount=String(total);
        row.classList.toggle('tnypl-duplicate-row',i>0 && total>1);
        let td=[...row.cells].find(c=>c.dataset?.tnyplDupCell==='1');
        if(!td){
          td=document.createElement('td'); td.dataset.tnyplDupCell='1';
          const actionCell=[...row.cells].find(c=>/reject|pay|draft|action/i.test(c.innerText||''));
          if(actionCell) row.insertBefore(td,actionCell); else row.appendChild(td);
        }
        if(i===0){
          td.innerHTML=`<span class="tnypl-duplicate-badge ${total>1?'':'is-unique'}">${total}</span>${total>1?`<button type="button" class="tnypl-view-duplicates" data-key="${esc(key)}">${state.expanded.has(key)?'Hide':'View'}</button>`:''}`;
        }else{
          td.innerHTML='<span class="tnypl-duplicate-badge">↳</span>';
        }
      });
    }

    table.querySelectorAll('.tnypl-view-duplicates').forEach(btn=>{
      btn.onclick=()=>{
        const key=btn.dataset.key;
        if(state.expanded.has(key)) state.expanded.delete(key); else state.expanded.add(key);
        applyRowVisibility(table);
        btn.textContent=state.expanded.has(key)?'Hide':'View';
      };
    });
  }

  function applyRowVisibility(table){
    const rows=[...(table.tBodies?.[0]?.rows||[])];
    for(const row of rows){
      const key=row.dataset.tnyplDupKey||'';
      const primary=row.dataset.tnyplDupPrimary==='1';
      const count=Number(row.dataset.tnyplDupCount||1);
      let show=true;
      if(state.filter==='duplicates') show=count>1;
      if(state.filter==='unique') show=count===1;
      if(count>1 && !primary && !state.expanded.has(key)) show=false;
      row.hidden=!show;
    }
  }

  function enhance(){
    if(state.busy) return;
    state.busy=true;
    try{
      const table=findPlayerTable();
      if(!table) return;
      const groups=groupsFromPlayers();
      ensureTableWrap(table);
      buildSummary(table,groups);
      ensureFilter(table);
      ensureDuplicateColumn(table,groups);
      applyRowVisibility(table);
    } finally { state.busy=false; }
  }

  function schedule(){ clearTimeout(state.timer); state.timer=setTimeout(enhance,80); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance); else enhance();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
