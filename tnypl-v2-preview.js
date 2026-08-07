(()=>{
  'use strict';
  const d=document, root=d.documentElement, body=d.body;
  if(!body||body.dataset.v2Preview==='1') return;
  body.dataset.v2Preview='1'; body.classList.add('v2-ready');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress=d.createElement('div'); progress.id='tnyplV2Progress'; body.append(progress);
  const glow=d.createElement('div'); glow.id='tnyplV2Glow'; body.append(glow);
  const hero=d.querySelector('.premium-hero');
  if(hero){
    const logo=d.createElement('img'); logo.className='v2-logo-preview'; logo.src='assets/v2/tnypl-v2-logo.svg'; logo.alt='TNYPL V2 logo concept'; hero.append(logo);
    requestAnimationFrame(()=>body.classList.add('v2-intro'));
  }

  function onScroll(){
    const max=Math.max(1,root.scrollHeight-innerHeight); progress.style.width=`${Math.min(100,scrollY/max*100)}%`;
    body.classList.toggle('v2-nav-scrolled',scrollY>60);
  }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  if(!reduce && matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';},{passive:true});
    const stage=d.querySelector('.hero-emblem .crest-stage');
    if(stage && hero){ hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;stage.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*5}deg) translate3d(${x*8}px,${y*5}px,0)`;},{passive:true}); hero.addEventListener('pointerleave',()=>stage.style.transform=''); }
  }

  const revealSelectors=['.section-head','.franchise-card','.leadership-card','.owner-directory-card','.venue-card','.prize-card','.live-stat-grid > article','.registration-goal','.draft-board','.payment-premium','.eligibility-panel'];
  let targets=[...d.querySelectorAll(revealSelectors.join(','))];
  targets.forEach((el,i)=>{el.classList.add('v2-reveal'); el.dataset.v2Delay=String(i%4)});
  if('IntersectionObserver' in window && !reduce){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v2-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -7%'});targets.forEach(el=>io.observe(el));} else targets.forEach(el=>el.classList.add('v2-in'));

  const nums=[...d.querySelectorAll('.quick-facts strong,.live-stat-grid strong,.hero-foot strong')];
  if('IntersectionObserver' in window && !reduce){const nio=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,text=el.textContent.trim(),m=text.match(/^(\d+)(\s*\/\s*\d+)?$/);if(m){const target=+m[1],suffix=m[2]||'',t0=performance.now(),dur=720;const step=now=>{const p=Math.min(1,(now-t0)/dur),v=Math.round(target*(1-Math.pow(1-p,3)));el.textContent=v+suffix;if(p<1)requestAnimationFrame(step);else el.classList.add('v2-counter-pop')};requestAnimationFrame(step)}nio.unobserve(el)}),{threshold:.6});nums.forEach(el=>nio.observe(el));}

  if('startViewTransition' in d){d.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id||id==='#')return;const target=d.querySelector(id);if(!target)return;e.preventDefault();d.startViewTransition(()=>target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}));}));}
})();
