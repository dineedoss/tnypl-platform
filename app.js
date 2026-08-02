/* ── TNYPL Public App ── */

const cfg = window.TNYPL_CONFIG;
const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ── YouTube embed ── */
const ytFrame = document.getElementById('youtubeFrame');
const liveBadge = document.getElementById('liveBadge');
if (ytFrame) {
  const vid = cfg.YOUTUBE_VIDEO_ID;
  if (vid && vid !== 'YOUR_YOUTUBE_VIDEO_ID') {
    ytFrame.src = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
    if (liveBadge) liveBadge.textContent = 'Latest Video';
  } else {
    ytFrame.src = 'about:blank';
    if (liveBadge) liveBadge.textContent = 'Coming Soon';
    ytFrame.closest('.video-wrap').style.display = 'flex';
    ytFrame.closest('.video-wrap').innerHTML =
      '<div style="color:rgba(255,255,255,.4);text-align:center;padding:40px;margin:auto">Live broadcast coming soon. Subscribe to the TNYPL YouTube channel.</div>';
  }
}

/* ── Age validation ── */
const dobInput = document.getElementById('dob');
const ageDisplay = document.getElementById('ageDisplay');
if (dobInput) {
  dobInput.min = cfg.MIN_DOB;
  dobInput.max = cfg.MAX_DOB;
  dobInput.addEventListener('change', () => {
    if (!dobInput.value) { ageDisplay.value = ''; return; }
    const d = new Date(dobInput.value), t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    ageDisplay.value = `${age} years old`;
    const inWindow = dobInput.value >= cfg.MIN_DOB && dobInput.value <= cfg.MAX_DOB;
    ageDisplay.style.color = inWindow ? 'var(--success)' : 'var(--danger)';
  });
}

/* ── File upload display ── */
function wireFileDisplay(inputId, displayId) {
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (!input || !display) return;
  input.addEventListener('change', () => {
    if (input.files[0]) {
      display.textContent = '✓ ' + input.files[0].name;
      display.classList.add('selected');
    } else {
      display.textContent = 'No file chosen';
      display.classList.remove('selected');
    }
  });
}
wireFileDisplay('ageProof', 'ageProofName');
wireFileDisplay('paymentReceipt', 'paymentReceiptName');

/* ── File upload helper ── */
async function uploadFile(file, folder) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await sb.storage.from('player-documents').upload(path, file);
  if (error) throw error;
  return path;
}

/* ── Registration form ── */
const regForm = document.getElementById('registrationForm');
const formMsg = document.getElementById('formMessage');

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + type;
}

if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnText = regForm.querySelector('.btn-text');
    const btnLoading = regForm.querySelector('.btn-loading');
    const submitBtn = regForm.querySelector('.reg-submit');

    if (btnText) btnText.hidden = true;
    if (btnLoading) btnLoading.hidden = false;
    submitBtn.disabled = true;
    showMsg(formMsg, 'Uploading documents and submitting…', 'info');

    try {
      const dob = document.getElementById('dob');
      if (dob.value < cfg.MIN_DOB || dob.value > cfg.MAX_DOB) {
        throw new Error('Player date of birth is outside the official U13–U14 window. Only players born between ' + cfg.MIN_DOB + ' and ' + cfg.MAX_DOB + ' may register.');
      }

      const fd = new FormData(regForm);
      const ageProofFile = document.getElementById('ageProof').files[0];
      const receiptFile = document.getElementById('paymentReceipt').files[0];

      if (!ageProofFile) throw new Error('Age proof document is required.');
      if (!receiptFile) throw new Error('Payment receipt is required.');
      if (ageProofFile.size > 5 * 1024 * 1024) throw new Error('Age proof file must be under 5 MB.');
      if (receiptFile.size > 5 * 1024 * 1024) throw new Error('Payment receipt file must be under 5 MB.');

      const [agePath, receiptPath] = await Promise.all([
        uploadFile(ageProofFile, 'age-proofs'),
        uploadFile(receiptFile, 'payment-receipts'),
      ]);

      const payload = {
        full_name: fd.get('full_name'),
        date_of_birth: fd.get('date_of_birth'),
        parent_name: fd.get('parent_name'),
        parent_phone: fd.get('parent_phone'),
        email: fd.get('email'),
        district: fd.get('district'),
        school: fd.get('school') || null,
        academy: fd.get('academy') || null,
        cricheroes_url: fd.get('cricheroes_url') || null,
        primary_role: fd.get('primary_role'),
        batting_style: fd.get('batting_style'),
        bowling_style: fd.get('bowling_style') || null,
        tshirt_size: fd.get('tshirt_size'),
        pant_size: fd.get('pant_size'),
        age_proof_path: agePath,
        payment_receipt_path: receiptPath,
        status: 'pending',
      };

      const { error } = await sb.from('players').insert(payload);
      if (error) throw error;

      regForm.reset();
      if (ageDisplay) ageDisplay.value = '';
      document.getElementById('ageProofName').textContent = 'No file chosen';
      document.getElementById('paymentReceiptName').textContent = 'No file chosen';
      document.getElementById('ageProofName').classList.remove('selected');
      document.getElementById('paymentReceiptName').classList.remove('selected');
      showMsg(formMsg,
        '✓ Registration received! Your application is pending payment and age verification. You will be contacted once reviewed.',
        'success');
      regForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showMsg(formMsg, err.message, 'error');
    } finally {
      if (btnText) btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
      submitBtn.disabled = false;
    }
  });
}

/* ── Owner inquiry form ── */
const inquiryForm = document.getElementById('inquiryForm');
const inquiryMsg = document.getElementById('inquiryMsg');

if (inquiryForm) {
  inquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(inquiryForm);
    const name = fd.get('owner_name');
    const phone = fd.get('owner_phone');
    const email = fd.get('owner_email');
    const district = fd.get('owner_district');
    const message = fd.get('owner_message') || 'No additional message.';

    /* For now: compose a mailto — can be swapped for Supabase insert or email API */
    const subject = encodeURIComponent(`TNYPL Franchise Enquiry — ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nDistrict: ${district}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:contact@tnypl.in?subject=${subject}&body=${body}`;

    showMsg(inquiryMsg,
      '✓ Thank you, ' + name + '! Your enquiry has been sent. We will contact you within 24 hours.',
      'success');
    inquiryForm.reset();
  });
}

/* ── Intersection observer for subtle entrance animations ── */
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.vision-card, .franchise-card, .format-block, .prize-sub, .step, .benefit-item, .sponsor-slot')
    .forEach(el => obs.observe(el));
}
