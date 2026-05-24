/* ============================================================
   admin.js — Admin Panel Logic (Premium Upgrade)
   Login · Fetch RSVPs · Render table · CSV export
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG — must match api/get-rsvps.js and api/export-csv.js
───────────────────────────────────────────────────────────── */
const ADMIN_PASSWORD = 'wedding2025';  // !! CHANGE BEFORE DEPLOYING !!

/* ─────────────────────────────────────────────────────────────
   ELEMENT REFS
───────────────────────────────────────────────────────────── */
const loginScreen    = document.getElementById('login-screen');
const dashboard      = document.getElementById('dashboard');
const loginForm      = document.getElementById('login-form');
const loginError     = document.getElementById('login-error');
const adminPassInput = document.getElementById('admin-pass');

const adminLoading   = document.getElementById('admin-loading');
const adminError     = document.getElementById('admin-error');
const statsRow       = document.getElementById('stats-row');
const tableContainer = document.getElementById('table-container');
const tbody          = document.getElementById('rsvp-tbody');
const noRsvps        = document.getElementById('no-rsvps');

const exportBtn      = document.getElementById('export-btn');
const refreshBtn     = document.getElementById('refresh-btn');
const logoutBtn      = document.getElementById('logout-btn');

const statTotal      = document.getElementById('stat-total');
const statAttending  = document.getElementById('stat-attending');
const statDeclining  = document.getElementById('stat-declining');
const statGuests     = document.getElementById('stat-guests');

/* ─────────────────────────────────────────────────────────────
   SESSION HELPERS
───────────────────────────────────────────────────────────── */
const isLoggedIn = () => sessionStorage.getItem('admin_auth') === ADMIN_PASSWORD;

function login(pass) {
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', pass);
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('admin_auth');
  showLoginScreen();
}

/* ─────────────────────────────────────────────────────────────
   SCREEN SWITCHING
───────────────────────────────────────────────────────────── */
function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  dashboard.classList.add('hidden');
  adminPassInput.value = '';
  loginError.classList.add('hidden');
}

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  fetchRsvps();
}

/* ─────────────────────────────────────────────────────────────
   LOGIN HANDLER
───────────────────────────────────────────────────────────── */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const pass = adminPassInput.value.trim();
  if (login(pass)) {
    showDashboard();
  } else {
    loginError.classList.remove('hidden');
    adminPassInput.select();
  }
});

/* ─────────────────────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────────────────────── */
logoutBtn.addEventListener('click', logout);

/* ─────────────────────────────────────────────────────────────
   FETCH RSVPs
───────────────────────────────────────────────────────────── */
async function fetchRsvps() {
  // Reset state
  adminLoading.classList.remove('hidden');
  adminError.classList.add('hidden');
  statsRow.classList.add('hidden');
  tableContainer.classList.add('hidden');

  try {
    const res = await fetch('/api/get-rsvps', {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });

    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const rsvps = await res.json();
    adminLoading.classList.add('hidden');
    renderStats(rsvps);
    renderTable(rsvps);

  } catch (err) {
    console.error(err);
    adminLoading.classList.add('hidden');
    adminError.textContent = 'Could not load RSVP data. ' + err.message;
    adminError.classList.remove('hidden');
  }
}

/* ─────────────────────────────────────────────────────────────
   RENDER STATS
───────────────────────────────────────────────────────────── */
function renderStats(rsvps) {
  const total     = rsvps.length;
  const attending = rsvps.filter(r => r.attending).length;
  const declining = total - attending;
  const guests    = rsvps
    .filter(r => r.attending)
    .reduce((sum, r) => sum + (parseInt(r.guests, 10) || 1), 0);

  statTotal.textContent     = total;
  statAttending.textContent = attending;
  statDeclining.textContent = declining;
  statGuests.textContent    = guests;

  statsRow.classList.remove('hidden');
  // Show the grid
  statsRow.style.display = 'grid';
}

/* ─────────────────────────────────────────────────────────────
   RENDER TABLE
───────────────────────────────────────────────────────────── */
function renderTable(rsvps) {
  tableContainer.classList.remove('hidden');
  tbody.innerHTML = '';

  if (rsvps.length === 0) {
    noRsvps.classList.remove('hidden');
    return;
  }

  noRsvps.classList.add('hidden');

  rsvps.forEach((r, i) => {
    const tr = document.createElement('tr');

    // Format timestamp
    let dateStr = '—';
    if (r.timestamp) {
      try {
        dateStr = new Date(r.timestamp).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
      } catch { /* noop */ }
    }

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td style="font-weight: 400; color: var(--text);">${esc(r.name)}</td>
      <td>
        ${r.attending
          ? '<span class="badge badge-yes">Yes</span>'
          : '<span class="badge badge-no">No</span>'}
      </td>
      <td style="text-align: center;">${r.attending ? (r.guests || 1) : '—'}</td>
      <td class="msg-cell" style="${r.message ? '' : 'font-style: italic; color: var(--text-faint);'}">
        ${r.message ? esc(r.message) : 'No message'}
      </td>
      <td style="white-space: nowrap; font-size: 0.75rem; color: var(--text-faint);">${dateStr}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* Simple HTML escape to prevent XSS from guest-submitted content */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────────────
   REFRESH
───────────────────────────────────────────────────────────── */
refreshBtn.addEventListener('click', fetchRsvps);

/* ─────────────────────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────────────────────── */
exportBtn.addEventListener('click', async () => {
  const original = exportBtn.innerHTML;
  exportBtn.disabled   = true;
  exportBtn.textContent = 'Preparing…';

  try {
    const res = await fetch('/api/export-csv', {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });

    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert('Export failed: ' + err.message);
  } finally {
    exportBtn.disabled   = false;
    exportBtn.innerHTML  = original;
  }
});

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
if (isLoggedIn()) {
  showDashboard();
} else {
  showLoginScreen();
}
