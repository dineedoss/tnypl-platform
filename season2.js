
const progress = document.getElementById('progress');
const menuBtn = document.getElementById('menuBtn');
const links = document.getElementById('links');

menuBtn?.addEventListener('click', () => links.classList.toggle('open'));

window.addEventListener('scroll', () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  progress.style.width = pct + '%';
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal,.reveal-card').forEach(el => revealObserver.observe(el));

document.querySelectorAll('.team-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 70}ms`;
});
