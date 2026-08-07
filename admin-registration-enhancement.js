(() => {
  'use strict';
  const VERSION='1.2.5';
  const state={filter:'all',expanded:new Set(),page:1,pageSize:10,busy:false,timer:null};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const normEmail=v=>String(v||'').trim().toLowerCase();
  const normDob=v=>{
    const s=String(v||'').trim().replace(/\s+/g,' ');
    const iso=s.match(/(20\d{2}|19\d{2})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
    if(iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
    const d=new Date(s);
    if(!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return s.toLowerCase().replace(/[^a-z0-9]/g,'');
  };
  const keyOf=(email,dob)=>`${normEmail(email)}|${normDob(dob)}`;

  function playersArray(){
    try { return (typeof players!=='undefined' && Array.isArray(players)) ? players : []; }
    catch(_) { return []; }
  }
  function phoneOf(p){return p?.phone||p?.phone_number||p?.mobile||p?.mobile_number||p?.contact_number||p?.contact_phone||p?.parent_phone||p?.guardian_phone||p?.whatsapp_number||p?.whatsapp||'';}
  function emailOf(p){return p?.email||p?.player_email||p?.parent_email||'';}

  function findPlayerTable(){
    return [...document.querySelectorAll('table')].find(t=>{
      const h=(t.tHead?.innerText||t.querySelector('thead')?.innerText||'').toLowerCase();
      return h.includes('player') && h.includes('dob') && h.includes('district');
    })||null;
  }
  function headRow(table){return table.tHead?.rows?.[0]||table.querySelector('thead tr');}
  function findHeaderIndex(table,matcher){
    const h=headRow(table); if(!h) return -1;
    return [...h.cells].findIndex(c=>matcher((c.textContent||'').trim().toLowerCase()));
  }
  function playerIdx(table){const i=findHeaderIndex(table,t=>t.includes('player'));return i<0?0:i;}
  function dobIdx(table){const i=findHeaderIndex(table,t=>t==='dob'||t.includes('date of birth'));return i<0?1:i;}
  function emailFromRow(row,table){
    const c=row.cells?.[playerIdx(table)]; if(!c)return '';
    const ma=c.querySelector('a[href^="mailto:"]');
    if(ma) return (ma.getAttribute('href')||'').replace(/^mailto:/i,'').trim()||ma.textContent.trim();
    return (c.innerText||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||'';
  }
  function dobFromRow(row,table){return (row.cells?.[dobIdx(table)]?.innerText||'').trim();}
  function domGroups(table){
    const map=new Map();
    for(const row of table.tBodies?.[0]?.rows||[]){
      if(row.dataset.tnyplSynthetic==='1') continue;
      const email=emailFromRow(row,table), dob=dobFromRow(row,table);
      const key=keyOf(email,dob);
      if(!email||!dob||key==='|') continue;
      if(!map.has(key)) map.set(key,[]);
      map.get(key).push(row);
    }
    return map;
  }
  function findPlayerByEmail(email){return playersArray().find(p=>normEmail(emailOf(p))===normEmail(email))||null;}

  function buildSidebar(){
    if(document.getElementById('tnyplProSidebar')) return;
    const links=[...document.querySelectorAll('a[href]')]
      .filter(a=>a.offsetParent!==null && !a.closest('#tnyplProSidebar'))
      .map(a=>({text:(a.textContent||'').trim(),href:a.getAttribute('href')||'#'}))
      .filter(x=>x.text && x.text.length<45 && !/open|receipt|age proof|analyze/i.test(x.text));
    const pick=(re,fallback,href='#')=>links.find(x=>re.test(x.text))||{text:fallback,href};
    const items=[
      pick(/player registration/i,'Player Registrations','admin.html'),
      pick(/franchise/i,'Franchise Management','#'),
      pick(/^matches$|match center/i,'Matches','#'),
      pick(/sponsor/i,'Sponsors','#'),
      pick(/admin team/i,'Admin Team','#'),
      pick(/league vision/i,'League Vision','#')
    ];
    const side=document.createElement('aside'); side.id='tnyplProSidebar'; side.className='tnypl-pro-sidebar';
    side.innerHTML=`<div class="tnypl-side-brand"><div class="tnypl-side-mark">🏏</div><div><strong>TNYPL</strong><span>ADMIN</span></div></div><div class="tnypl-side-label">MAIN MENU</div><nav>${items.map((x,i)=>`<a class="${i===0?'active':''}" href="${esc(x.href)}"><span>${['▦','♙','⚔','♢','♧','◎'][i]}</span>${esc(x.text)}</a>`).join('')}</nav><div class="tnypl-side-label">QUICK ACTIONS</div><nav><a href="#tnyplRegistrationEnhancement"><span>⌕</span>Registration Analytics</a><a href="mailto:info@tnypl.in"><span>✉</span>Contact Support</a></nav><div class="tnypl-side-help"><strong>Need Help?</strong><p>For support or assistance, contact the TNYPL admin team.</p><a href="mailto:info@tnypl.in">info@tnypl.in</a></div>`;
    document.body.prepend(side);
  }

  function hideLegacyTop(table){
    const heading=[...document.querySelectorAll('h1,h2,h3,h4,strong')].find(e=>/ADMIN CONTROL CENTER/i.test(e.textContent||''));
    if(heading){
      let box=heading.parentElement;
      if(box && box!==document.body) box.classList.add('tnypl-legacy-admin-top');
    }
    // Hide the old 4-card KPI row only; the enhanced KPIs replace it.
    [...document.querySelectorAll('div,section')].forEach(el=>{
      if(el.closest('#tnyplRegistrationEnhancement')||el.contains(table)) return;
      const t=(el.innerText||'').replace(/\s+/g,' ').trim();
      if(t && t.length<300 && /Total registrations/i.test(t) && /Payment verified/i.test(t) && /Age verified/i.test(t) && /Draft eligible/i.test(t)) el.classList.add('tnypl-legacy-kpis');
    });
  }

  function ensureShell(table){
    document.body.classList.add('tnypl-admin-pro-v125');
    buildSidebar(); hideLegacyTop(table);
    const parent=table.closest('main')||table.closest('[class*="container" i]')||table.parentElement?.parentElement;
    if(parent) parent.classList.add('tnypl-admin-registration-shell');
    if(!document.getElementById('tnyplTopHeader')){
      const hdr=document.createElement('div'); hdr.id='tnyplTopHeader'; hdr.className='tnypl-top-header';
      hdr.innerHTML=`<div><h1>Player Registrations</h1><p>View and manage all player registrations. Duplicate entries (same Email + DOB) are grouped automatically.</p></div><div class="tnypl-top-actions"><button type="button" id="tnyplRefresh">↻ Refresh</button></div>`;
      const anchor=table.closest('.tnypl-admin-table-wrap')||table;
      anchor.parentNode.insertBefore(hdr,anchor);
      hdr.querySelector('#tnyplRefresh').onclick=()=>location.reload();
    }
  }

  function wrapTable(table){
    if(table.parentElement?.classList.contains('tnypl-admin-table-wrap')) return table.parentElement;
    const wrap=document.createElement('div');wrap.className='tnypl-admin-table-wrap';table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);return wrap;
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
    const h=headRow(table); if(!h)return;
    let di=findHeaderIndex(table,t=>t==='duplicates');
    if(di<0){const th=document.createElement('th');th.textContent='Duplicates';th.dataset.tnyplDupHead='1';const ai=findHeaderIndex(table,t=>t==='actions');if(ai>=0)h.insertBefore(th,h.cells[ai]);else h.appendChild(th);}
    for(const [key,rows] of groups){
      const count=rows.length;
      rows.forEach((row,i)=>{
        row.dataset.tnyplDupKey=key;row.dataset.tnyplDupPrimary=i===0?'1':'0';row.dataset.tnyplDupCount=String(count);
        row.classList.toggle('tnypl-duplicate-row',i>0&&count>1);
        let td=[...row.cells].find(c=>c.dataset.tnyplDupCell==='1');
        if(!td){td=document.createElement('td');td.dataset.tnyplDupCell='1';const ai=findHeaderIndex(table,t=>t==='actions');if(ai>=0)row.insertBefore(td,row.cells[ai]);else row.appendChild(td);}
        if(i===0) td.innerHTML=`<span class="tnypl-duplicate-badge ${count===1?'is-unique':''}">${count}</span>${count>1?`<button type="button" class="tnypl-view-duplicates" data-key="${esc(key)}">View</button>`:''}`;
        else td.innerHTML='<span class="tnypl-duplicate-badge">↳</span>';
      });
    }
    table.querySelectorAll('.tnypl-view-duplicates').forEach(b=>b.onclick=()=>{const k=b.dataset.key;state.expanded.has(k)?state.expanded.delete(k):state.expanded.add(k);state.page=1;applyVisibility(table);});
  }

  function buildDashboard(table,groups){
    const rows=[...(table.tBodies?.[0]?.rows||[])];
    const total=rows.length, unique=groups.size, dupGroups=[...groups.values()].filter(g=>g.length>1).length, dupSubs=total-unique;
    const rejected=rows.filter(r=>/rejected/i.test(r.innerText||'')).length;
    let box=document.getElementById('tnyplRegistrationEnhancement');
    if(!box){box=document.createElement('section');box.id='tnyplRegistrationEnhancement';box.className='tnypl-reg-enhancement';const top=document.getElementById('tnyplTopHeader');top.insertAdjacentElement('afterend',box);}
    box.innerHTML=`<div class="tnypl-reg-kpis">
      <div class="tnypl-reg-kpi blue"><div class="ico">♙</div><div><small>Total Registrations</small><strong>${total}</strong><span>All submitted records</span></div></div>
      <div class="tnypl-reg-kpi green"><div class="ico">◎</div><div><small>Unique Players</small><strong>${unique}</strong><span>Grouped by Email + DOB</span></div></div>
      <div class="tnypl-reg-kpi orange"><div class="ico">◉</div><div><small>Duplicate Submissions</small><strong>${dupSubs}</strong><span>Extra duplicate attempts</span></div></div>
      <div class="tnypl-reg-kpi purple"><div class="ico">♙</div><div><small>Duplicate Groups</small><strong>${dupGroups}</strong><span>Need review / correction</span></div></div>
      <div class="tnypl-reg-kpi red"><div class="ico">⊗</div><div><small>Rejected Players</small><strong>${rejected}</strong><span>Not eligible</span></div></div>
    </div><div class="tnypl-reg-note"><b>ⓘ &nbsp; Safe duplicate handling:</b>&nbsp; Existing registrations are never deleted. Rows with the same normalized Email ID and Date of Birth are grouped in this admin view. The same parent email with a different DOB remains valid for siblings.</div>`;
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
      // Move existing useful admin buttons into our toolbar without changing handlers.
      [...document.querySelectorAll('button')].filter(b=>!b.closest('#tnyplProToolbar')&&!b.closest('#tnyplProSidebar')&&/Export CSV|Send Pending Registration Emails/i.test(b.textContent||'')).forEach(b=>bar.appendChild(b));
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
    const rows=[...(table.tBodies?.[0]?.rows||[])];
    const q=(document.getElementById('tnyplProSearch')?.value||'').trim().toLowerCase();
    const visible=[];
    for(const row of rows){
      const count=Number(row.dataset.tnyplDupCount||1), primary=row.dataset.tnyplDupPrimary!=='0', key=row.dataset.tnyplDupKey||'';
      let show=true;
      if(state.filter==='duplicates') show=count>1;
      if(state.filter==='unique') show=count===1;
      // Core fix: duplicate secondary rows are hidden by default, independent of the global players array.
      if(count>1 && !primary && !state.expanded.has(key)) show=false;
      if(q){
        const hay=`${row.innerText||''} ${row.dataset.tnyplPhone||''}`.toLowerCase();
        show=show&&hay.includes(q);
      }
      if(show)visible.push(row);
    }
    const max=Math.max(1,Math.ceil(visible.length/state.pageSize));if(state.page>max)state.page=max;
    rows.forEach(r=>{r.hidden=true;r.style.display='none';});
    const start=(state.page-1)*state.pageSize,end=start+state.pageSize;
    visible.slice(start,end).forEach(r=>{r.hidden=false;r.style.display='';});
    const info=document.getElementById('tnyplPageInfo');if(info)info.textContent=visible.length?`Showing ${start+1} to ${Math.min(end,visible.length)} of ${visible.length} unique/grouped records`:'No matching records';
    const cur=document.getElementById('tnyplPageCurrent');if(cur)cur.textContent=`${state.page} / ${max}`;
    const prev=document.querySelector('#tnyplPagination [data-p="prev"]'),next=document.querySelector('#tnyplPagination [data-p="next"]');if(prev)prev.disabled=state.page<=1;if(next)next.disabled=state.page>=max;
    table.querySelectorAll('.tnypl-view-duplicates').forEach(b=>b.textContent=state.expanded.has(b.dataset.key)?'Hide':'View');
  }

  function enhance(){
    if(state.busy)return;state.busy=true;
    try{
      const table=findPlayerTable();if(!table)return;
      wrapTable(table);ensureShell(table);ensurePhone(table);
      const groups=domGroups(table);
      ensureDuplicateColumn(table,groups);buildDashboard(table,groups);toolbar(table);pagination(table);
      table.classList.add('tnypl-pro-player-table');applyVisibility(table);
    } finally{state.busy=false;}
  }
  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(enhance,250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
