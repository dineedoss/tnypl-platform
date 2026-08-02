/* ── TNYPL Admin Dashboard ── */

const cfg = window.TNYPL_CONFIG;
const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
let players = [];

const loginPanel = document.getElementById('loginPanel');
const dash = document.getElementById('dashboard');
const playersBody = document.getElementById('playersBody');

function showMsgEl(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + type;
}

async function checkSession() {
  const { data } = await sb.auth.getSession();
  data.session ? showDashboard() : showLogin();
}

function showLogin() {
  loginPanel.hidden = false;
  dash.hidden = true;
}

async function showDashboard() {
  loginPanel.hidden = true;
  dash.hidden = false;
  await loadPlayers();
}

/* ── Auth ── */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const loginMessage = document.getElementById('loginMessage');
  showMsgEl(loginMessage, 'Logging in…', 'info');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showMsgEl(loginMessage, error.message, 'error');
  } else {
    showDashboard();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  showLogin();
});

/* ── Data ── */
async function loadPlayers() {
  const { data, error } = await sb.from('players').select('*').order('created_at', { ascending: false });
  if (error) { alert('Failed to load players: ' + error.message); return; }
  players = data || [];
  renderStats();
  renderTable();
}

function renderStats() {
  document.getElementById('totalCount').textContent = players.length;
  document.getElementById('paymentCount').textContent = players.filter(p => p.payment_verified).length;
  document.getElementById('ageCount').textContent = players.filter(p => p.age_verified).length;
  document.getElementById('eligibleCount').textContent = players.filter(p => p.status === 'eligible').length;
}

function filtered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const s = document.getElementById('statusFilter').value;
  return players.filter(p =>
    (!s || p.status === s) &&
    (`${p.full_name} ${p.district} ${p.primary_role}`.toLowerCase().includes(q))
  );
}

function renderTable() {
  const rows = filtered();
  if (!rows.length) {
    playersBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6b7280;padding:32px">No players found.</td></tr>';
    return;
  }
  playersBody.innerHTML = rows.map(p => `
    <tr>
      <td>
        <strong style="display:block">${esc(p.full_name)}</strong>
        <small style="color:#6b7280">${esc(p.email)}</small>
        ${p.school ? `<small style="color:#6b7280;display:block">${esc(p.school)}</small>` : ''}
      </td>
      <td>${esc(p.date_of_birth)}</td>
      <td>${esc(p.district)}</td>
      <td>${esc(p.primary_role)}</td>
      <td>${p.cricheroes_url ? `<a href="${esc(p.cricheroes_url)}" target="_blank" rel="noopener" style="color:#0e4aa8;font-size:.82rem">View Profile</a>` : '—'}</td>
      <td style="text-align:center;font-size:1.1rem">${p.payment_verified ? '✅' : '⏳'}</td>
      <td style="text-align:center;font-size:1.1rem">${p.age_verified ? '✅' : '⏳'}</td>
      <td><span class="pill ${p.status}">${p.status}</span></td>
      <td>
        <button class="small-btn" onclick="toggleVerify('${p.id}','payment_verified',${!p.payment_verified})">
          ${p.payment_verified ? 'Unverify Pmt' : 'Verify Pmt'}
        </button>
        <button class="small-btn" onclick="toggleVerify('${p.id}','age_verified',${!p.age_verified})">
          ${p.age_verified ? 'Unverify Age' : 'Verify Age'}
        </button>
        <button class="small-btn" onclick="setStatus('${p.id}','eligible')">Eligible</button>
        <button class="small-btn" onclick="setStatus('${p.id}','rejected')">Reject</button>
        ${p.age_proof_path ? `<button class="small-btn" onclick="viewDoc('${p.age_proof_path}')">Age Doc</button>` : ''}
        ${p.payment_receipt_path ? `<button class="small-btn" onclick="viewDoc('${p.payment_receipt_path}')">Receipt</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function esc(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Actions ── */
window.toggleVerify = async (id, field, val) => {
  await sb.from('players').update({ [field]: val }).eq('id', id);
  await loadPlayers();
};

window.setStatus = async (id, status) => {
  const p = players.find(x => x.id === id);
  if (status === 'eligible' && (!p.payment_verified || !p.age_verified)) {
    alert('Both payment and age must be verified before marking a player as draft eligible.');
    return;
  }
  await sb.from('players').update({ status }).eq('id', id);
  await loadPlayers();
};

window.viewDoc = async (path) => {
  const { data, error } = await sb.storage.from('player-documents').createSignedUrl(path, 60);
  if (error) { alert('Could not load document: ' + error.message); return; }
  window.open(data.signedUrl, '_blank');
};

/* ── Search / Filter ── */
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('statusFilter').addEventListener('change', renderTable);

/* ── CSV Export ── */
document.getElementById('exportBtn').addEventListener('click', () => {
  const cols = [
    'full_name','date_of_birth','parent_name','parent_phone','email',
    'district','school','academy','cricheroes_url','primary_role',
    'batting_style','bowling_style','tshirt_size','pant_size',
    'payment_verified','age_verified','status','created_at'
  ];
  const escCsv = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = [
    cols.join(','),
    ...players.map(p => cols.map(c => escCsv(p[c])).join(','))
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'tnypl-players.csv';
  a.click();
});

/* ── Init ── */
checkSession();
