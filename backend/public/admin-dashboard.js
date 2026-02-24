const API = 'https://kabrak-exchange-pro-production.up.railway.app/api';
let token = localStorage.getItem('kabrak_admin_token');
let allLicenses = [], allPayments = [], allUsers = [];
let licenseFilter = '', paymentFilter = '';

// ─── Auth ───
if (token) showDashboard();

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    try {
        const res = await fetch(`${API}/admin/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: document.getElementById('loginUser').value, password: document.getElementById('loginPass').value })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            token = data.token;
            localStorage.setItem('kabrak_admin_token', token);
            showDashboard();
        } else {
            document.getElementById('loginError').textContent = data.error || 'Identifiants invalides';
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (err) {
        document.getElementById('loginError').textContent = 'Erreur réseau';
        document.getElementById('loginError').style.display = 'block';
    }
    btn.innerHTML = 'Se connecter';
    btn.disabled = false;
}

function handleLogout() {
    token = null;
    localStorage.removeItem('kabrak_admin_token');
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';
    refreshData();
}

// ─── API Helper ───
async function api(endpoint, opts = {}) {
    const res = await fetch(`${API}${endpoint}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...opts.headers }
    });
    if (res.status === 401) { handleLogout(); throw new Error('Session expirée'); }
    return res;
}

// ─── Data Loading ───
async function refreshData() {
    document.getElementById('lastRefresh').textContent = 'Chargement...';
    const results = await Promise.allSettled([loadDashboard(), loadLicenses(), loadPayments(), loadUsers()]);
    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length) { console.error('Erreurs chargement:', errors.map(e => e.reason)); }
    document.getElementById('lastRefresh').textContent = `Mis à jour: ${new Date().toLocaleTimeString('fr-FR')}`;
}

async function loadDashboard() {
    const res = await api('/admin/dashboard');
    const json = await res.json();
    if (!res.ok || !json.success) { console.error('Dashboard error:', json); throw new Error(json.error || 'Dashboard failed'); }
    const data = json.data;
    document.getElementById('statUsers').textContent = data.users?.total ?? 0;
    document.getElementById('statUsersActive').textContent = `${data.users?.active ?? 0} actifs`;
    document.getElementById('statLicenses').textContent = data.licenses?.active ?? 0;
    document.getElementById('statLicensesTotal').textContent = `/ ${data.licenses?.total ?? 0} total`;
    document.getElementById('statPending').textContent = data.payments?.pending ?? 0;
    document.getElementById('statPaymentsTotal').textContent = `/ ${data.payments?.total ?? 0} total`;
    document.getElementById('statExpiring').textContent = data.licenses?.expiringSoon ?? 0;

    // Pending badge
    const badge = document.getElementById('pendingBadge');
    const pendingCount = data.payments?.pending ?? 0;
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';

    // Recent users
    const ul = document.getElementById('recentUsersList');
    ul.innerHTML = (data.recentUsers || []).map(u => `
        <div class="activity-item">
            <div class="activity-avatar">${(u.firstName||'?')[0].toUpperCase()}</div>
            <div class="activity-info">
                <div class="activity-name">${u.firstName || ''} ${u.lastName || ''}</div>
                <div class="activity-meta">${u.email}</div>
            </div>
            <div class="activity-date">${fmtDate(u.createdAt)}</div>
        </div>
    `).join('') || '<div style="color:var(--gray-500);text-align:center;padding:16px;font-size:13px">Aucun inscrit récent</div>';

    // Recent payments
    const pl = document.getElementById('recentPaymentsList');
    pl.innerHTML = (data.recentPayments || []).map(p => {
        const av = p.status==='pending' ? 'background:#78350f;color:#fbbf24' : p.status==='validated' ? 'background:#064e3b;color:#34d399' : 'background:#7f1d1d;color:#f87171';
        const ic = p.status==='pending' ? 'fa-clock' : p.status==='validated' ? 'fa-check' : 'fa-times';
        return `<div class="activity-item">
            <div class="activity-avatar" style="${av}"><i class="fas ${ic}"></i></div>
            <div class="activity-info">
                <div class="activity-name">${p.user?.firstName||''} ${p.user?.lastName||''}</div>
                <div class="activity-meta">${p.plan||'-'} · ${fmtAmount(p.amount)} XOF</div>
            </div>
            <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
        </div>`;
    }).join('') || '<div style="color:var(--gray-500);text-align:center;padding:16px;font-size:13px">Aucun paiement récent</div>';
}

async function loadLicenses() {
    const res = await api('/admin/licenses');
    const data = await res.json();
    allLicenses = data.data || data || [];
    renderLicenses();
}

async function loadPayments() {
    const res = await api('/admin/payments');
    const data = await res.json();
    allPayments = data.data || data || [];
    renderPayments();
}

async function loadUsers() {
    const res = await api('/admin/users');
    const data = await res.json();
    allUsers = data.data || data || [];
    renderUsers();
}

// ─── Rendering ───
function renderLicenses() {
    const filtered = licenseFilter ? allLicenses.filter(l => l.status === licenseFilter) : allLicenses;
    const tbody = document.getElementById('licensesTable');
    tbody.innerHTML = filtered.map(l => `
        <tr>
            <td><div style="font-weight:600">${l.businessName}</div><div style="font-size:12px;color:var(--gray-400)">${l.ownerName}</div></td>
            <td>${l.ownerEmail}</td>
            <td class="center"><span class="badge badge-${l.plan}">${l.plan||'-'}</span></td>
            <td class="center"><span class="badge badge-${l.status}">${statusLabel(l.status)}</span></td>
            <td class="center">${l.expiresAt ? fmtDate(l.expiresAt) : '-'}</td>
            <td class="center">
                ${l.status === 'pending' ? `<button class="btn-action btn-green" onclick="approveLicense('${l.id}')"><i class="fas fa-check"></i></button>` : ''}
                ${l.status === 'active' ? `<button class="btn-action" onclick="extendLicense('${l.id}')"><i class="fas fa-calendar-plus"></i></button>` : ''}
                <button class="btn-action" onclick="changePlan('${l.id}')"><i class="fas fa-edit"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--gray-500)">Aucune licence</td></tr>';
}

function renderPayments() {
    const filtered = paymentFilter ? allPayments.filter(p => p.status === paymentFilter) : allPayments;
    const tbody = document.getElementById('paymentsTable');
    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td><div style="font-weight:600">${p.user?.firstName||''} ${p.user?.lastName||''}</div><div style="font-size:12px;color:var(--gray-400)">${p.user?.email||''}</div></td>
            <td class="center"><span class="badge badge-${p.plan}">${p.plan||'-'}</span></td>
            <td class="center">${fmtAmount(p.amount)}</td>
            <td class="center">${p.method||'-'}</td>
            <td class="center">${p.reference||'-'}</td>
            <td class="center"><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
            <td class="center">${fmtDate(p.createdAt)}</td>
            <td class="center">
                ${p.status === 'pending' ? `<button class="btn-action btn-green" onclick="validatePayment('${p.id}')"><i class="fas fa-check"></i></button>` : ''}
                ${p.status === 'pending' ? `<button class="btn-action btn-red" onclick="rejectPayment('${p.id}')"><i class="fas fa-times"></i></button>` : ''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--gray-500)">Aucun paiement</td></tr>';
}

function renderUsers() {
    const q = document.getElementById('userSearch')?.value?.toLowerCase() || '';
    const filtered = q ? allUsers.filter(u => (u.email||'').toLowerCase().includes(q) || (u.firstName||'').toLowerCase().includes(q) || (u.lastName||'').toLowerCase().includes(q)) : allUsers;
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td><div style="font-weight:600">${u.firstName||''} ${u.lastName||''}</div></td>
            <td>${u.email}</td>
            <td>${u.businessName||'-'}</td>
            <td class="center"><span class="badge badge-${u.role}">${u.role||'user'}</span></td>
            <td class="center"><span class="badge badge-${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Actif' : 'Inactif'}</span></td>
            <td class="center">${u.lastLogin ? fmtDate(u.lastLogin) : '-'}</td>
            <td class="center">
                <button class="btn-action" onclick="toggleUser('${u.id}')" title="${u.isActive ? 'Désactiver' : 'Activer'}">
                    <i class="fas fa-${u.isActive ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--gray-500)">Aucun utilisateur</td></tr>';
}

// ─── Actions ───
async function approveLicense(id) {
    const days = prompt('Durée (jours) :', '90');
    if (!days) return;
    const res = await api(`/admin/licenses/${id}/approve`, { method: 'POST', body: JSON.stringify({ days: parseInt(days) }) });
    if (res.ok) { toast('Licence approuvée'); refreshData(); }
}

async function extendLicense(id) {
    const days = prompt('Prolonger de (jours) :', '30');
    if (!days) return;
    const res = await api(`/admin/licenses/${id}/extend`, { method: 'POST', body: JSON.stringify({ days: parseInt(days) }) });
    if (res.ok) { toast('Licence prolongée'); refreshData(); }
}

async function changePlan(id) {
    const plan = prompt('Nouveau plan (basic/pro/premium) :', 'basic');
    if (!plan) return;
    const res = await api(`/admin/licenses/${id}/plan`, { method: 'POST', body: JSON.stringify({ plan }) });
    if (res.ok) { toast('Plan modifié'); refreshData(); }
}

async function validatePayment(id) {
    const res = await api(`/admin/payments/${id}/validate`, { method: 'POST' });
    if (res.ok) { toast('Paiement validé'); refreshData(); }
}

async function rejectPayment(id) {
    const res = await api(`/admin/payments/${id}/reject`, { method: 'POST' });
    if (res.ok) { toast('Paiement rejeté'); refreshData(); }
}

async function toggleUser(id) {
    const res = await api(`/admin/users/${id}/toggle`, { method: 'PUT' });
    if (res.ok) { toast('Statut modifié'); refreshData(); }
}

// ─── UI ───
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-nav li').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.target.closest('li').classList.add('active');
    document.title = `KABRAK Admin - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
}

function filterPayments(status) {
    paymentFilter = status;
    document.querySelectorAll('.payment-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderPayments();
}

function filterLicenses(status) {
    licenseFilter = status;
    document.querySelectorAll('.license-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderLicenses();
}

function openModal(title, content, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'flex';
    window.currentModalConfirm = onConfirm;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    window.currentModalConfirm = null;
}

document.getElementById('modalConfirmBtn').addEventListener('click', () => {
    if (window.currentModalConfirm) window.currentModalConfirm();
    closeModal();
});

// ─── Utils ───
function fmtDate(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtAmount(n) {
    if (!n) return '-';
    return parseInt(n).toLocaleString('fr-FR');
}

function statusLabel(s) {
    const map = { pending: 'En attente', validated: 'Validé', rejected: 'Rejeté', active: 'Active', expired: 'Expirée', suspended: 'Suspendue' };
    return map[s] || s;
}

function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ─── Init ───
document.getElementById('loginForm').addEventListener('submit', handleLogin);
