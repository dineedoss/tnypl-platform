(()=>{
  'use strict';
  const d=document,b=d.body,root=d.documentElement;
  if(!b||b.dataset.v2alpha==='1')return;
  b.dataset.v2alpha='1';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prog=d.createElement('div');prog.id='v2-progress';b.appendChild(prog);
  const badge=d.createElement('div');badge.id='v2-badge';badge.textContent='TNYPL V2 · CINEMATIC PREVIEW';b.appendChild(badge);
  const glow=d.createElement('div');glow.id='v2-cursor-glow';b.appendChild(glow);
  const hero=d.querySelector('.v9-hero');
  if(hero){
    const particles=d.createElement('div');particles.id='v2-particles';hero.appendChild(particles);
    for(let i=0;i<30;i++){
      const s=d.createElement('i');s.className='v2-spark';
      s.style.left=(5+Math.random()*90)+'%';s.style.bottom=(-10+Math.random()*42)+'%';
      s.style.setProperty('--dx',(-50+Math.random()*100)+'px');
      s.style.animationDuration=(4+Math.random()*5)+'s';s.style.animationDelay=(-Math.random()*8)+'s';
      particles.appendChild(s);
    }
    requestAnimationFrame(()=>b.classList.add('v2-intro'));
  }
  const onScroll=()=>{
    const max=Math.max(1,root.scrollHeight-innerHeight);prog.style.width=Math.min(100,scrollY/max*100)+'%';
    b.classList.toggle('v2-scrolled',scrollY>60);
  };addEventListener('scroll',onScroll,{passive:true});onScroll();
  if(!reduce&&matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'},{passive:true});
    const mark=d.querySelector('.hero-mark img');
    if(hero&&mark){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;mark.style.transform=`perspective(900px) rotateY(${x*8}deg) rotateX(${-y*6}deg) translate3d(${x*12}px,${y*8}px,0)`},{passive:true});hero.addEventListener('pointerleave',()=>mark.style.transform='')}
  }
  const sels=['.split-head','.section-title','.franchise-feature','.leader-cinematic','.draft-screen','.draft-layout aside','.value-grid article','.prize-total','.prize-list>div','.register-layout','.sponsors-v9>div','footer .shell'];
  const els=[...d.querySelectorAll(sels.join(','))];
  els.forEach((el,i)=>{el.classList.add('v2-reveal');el.dataset.v2d=String(i%4)});
  if('IntersectionObserver'in window&&!reduce){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v2-in');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -6%'});els.forEach(x=>io.observe(x))}else els.forEach(x=>x.classList.add('v2-in'));
  const nums=[...d.querySelectorAll('.hero-numbers strong')];
  if('IntersectionObserver'in window&&!reduce){const io2=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,t=el.textContent.trim(),m=t.match(/^(\d+)$/);if(m){const n=+m[1],st=performance.now(),dur=900;const tick=now=>{const p=Math.min(1,(now-st)/dur);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};el.textContent='0';requestAnimationFrame(tick)}io2.unobserve(el)}),{threshold:.7});nums.forEach(x=>io2.observe(x))}
})();
