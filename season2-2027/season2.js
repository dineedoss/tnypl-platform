
const loader = document.getElementById('loader');
window.addEventListener('load', () => setTimeout(() => loader?.classList.add('hide'), 450));

const progress = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  progress.style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + '%';
});

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle?.addEventListener('click', () => navLinks.classList.toggle('open'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const glow = document.getElementById('cursorGlow');
window.addEventListener('pointermove', e => {
  if (!glow) return;
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

const heroLogo = document.getElementById('heroLogo');
window.addEventListener('pointermove', e => {
  if (!heroLogo || window.innerWidth < 900) return;
  const x = (e.clientX / window.innerWidth - .5) * 10;
  const y = (e.clientY / window.innerHeight - .5) * -10;
  heroLogo.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
});
window.addEventListener('pointerleave', () => {
  if (heroLogo) heroLogo.style.transform = '';
});
