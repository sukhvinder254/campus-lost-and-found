/* ═══════════════════════════════════════════════════════════
   KRMU Campus Lost & Found Portal — app.js
   Team Code Nemesis | B.Tech CSE | K.R. Mangalam University
   Full-stack version — PHP + MySQL backend via fetch() API
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════
// EMOJI & CATEGORY MAP
// ════════════════════════════════════════
const EMOJI_MAP = {
  'Electronics':          '📱',
  'Documents & ID':       '🪪',
  'Bags & Accessories':   '👜',
  'Clothing':             '👕',
  'Books & Notes':        '📚',
  'Keys & Cards':         '🔑',
  'Other':                '📦',
};

// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
let items       = [];       // loaded from API
let totalItems  = 0;
let typeFilter  = 'all';
let currentUser = null;     // { id, name, email, student_id, role }

// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════
const todayStr = () => new Date().toISOString().split('T')[0];
const getEmoji = cat => EMOJI_MAP[cat] || '📦';
const isEmail  = v   => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '—';
  const p = d.split('-').map(Number);
  if (p.length < 3 || !p[0] || p[1] < 1 || p[1] > 12) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${p[2]} ${months[p[1]-1]} ${p[0]}`;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
const debouncedRender = debounce(renderBrowse, 260);

// ════════════════════════════════════════
// API HELPER
// ════════════════════════════════════════
async function apiFetch(url, options = {}) {
  try {
    const res  = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ════════════════════════════════════════
// LOAD ITEMS FROM API
// ════════════════════════════════════════
async function loadItems(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data  = await apiFetch(`api/items.php?${query}`);
  if (data.success) {
    items      = data.items;
    totalItems = data.total;
  }
  return data;
}

// ════════════════════════════════════════
// STATS
// ════════════════════════════════════════
function updateStats() {
  const el1 = document.getElementById('stat-total');
  const el2 = document.getElementById('stat-found-count');
  const el3 = document.getElementById('stat-recovered');
  if (el1) el1.textContent = totalItems;
  if (el2) el2.textContent = items.filter(i => i.type === 'found').length;
  if (el3) el3.textContent = items.filter(i => i.status === 'claimed').length;
}

async function loadAndUpdateStats() {
  await loadItems({ limit: 100 });
  updateStats();
}

// ════════════════════════════════════════
// CARD BUILDER
// ════════════════════════════════════════
function buildCard(item, showActions) {
  const claimed  = item.status === 'claimed';
  const imgClass = claimed ? 'resolved' : item.type;
  const bClass   = claimed ? 'badge-claimed' : `badge-${item.type}`;
  const bText    = claimed ? 'RESOLVED'      : item.type.toUpperCase();
  const emoji    = item.emoji || getEmoji(item.category);

  // Image display
  let imgContent = `<span aria-hidden="true">${emoji}</span>`;
  if (item.image_path) {
    imgContent = `<img src="${esc(item.image_path)}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;" />`;
  }

  const actionHtml = showActions
    ? claimed
      ? `<span class="recovered-tag"><i class="fas fa-check-circle"></i> Recovered</span>`
      : `<button class="contact-btn" onclick="event.stopPropagation();contactItem(${item.id})">
           <i class="fas fa-envelope"></i> Contact
         </button>
         ${currentUser ? `<button class="resolve-btn" onclick="event.stopPropagation();markResolved(${item.id})">
           <i class="fas fa-check"></i> Resolved
         </button>` : ''}`
    : '';

  return `
    <div class="item-card${claimed ? ' is-claimed' : ''}"
         onclick="openItemDetail(${item.id})"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openItemDetail(${item.id});}"
         role="button" tabindex="0" aria-label="${esc(item.name)}, ${bText}">
      <div class="item-img ${imgClass}">
        ${imgContent}
        <span class="item-badge ${bClass}">${bText}</span>
      </div>
      <div class="item-body">
        <h3 title="${esc(item.name)}">${esc(item.name)}</h3>
        <div class="item-meta">
          <span><i class="fas fa-map-marker-alt" aria-hidden="true"></i>${esc(item.location)}</span>
          <span><i class="fas fa-tag" aria-hidden="true"></i>${esc(item.category)}</span>
          <span><i class="fas fa-calendar-alt" aria-hidden="true"></i>${formatDate(item.date || item.item_date)}</span>
        </div>
        <p class="item-desc">${esc(item.desc || item.description)}</p>
        <div class="item-footer">
          ${actionHtml}
          <span class="item-date">${formatDate(item.date || item.item_date)}</span>
        </div>
      </div>
    </div>`;
}

// ════════════════════════════════════════
// RENDER FUNCTIONS
// ════════════════════════════════════════
function renderItems(list, containerId, showActions = true) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="big-icon">🔍</div>
        <h3>No items found</h3>
        <p>Try adjusting your search or filters.</p>
        ${containerId === 'browseGrid'
          ? `<br><button class="btn-primary" style="display:inline-flex;margin-top:12px" onclick="clearFilters()">
               <i class="fas fa-times"></i>&nbsp;Clear Filters
             </button>`
          : ''}
      </div>`;
    return;
  }
  el.innerHTML = list.map(i => buildCard(i, showActions)).join('');
}

async function renderBrowse() {
  // Build query params from filters
  const params = { limit: 100 };
  const q   = (document.getElementById('searchInput')?.value || '').trim();
  const cat = (document.getElementById('categoryFilter')?.value || '');
  const loc = (document.getElementById('locationFilter')?.value || '');

  if (q)   params.search   = q;
  if (cat) params.category = cat;
  if (loc) params.location = loc;
  if (typeFilter !== 'all') params.type = typeFilter;

  const data = await loadItems(params);
  if (data.success) {
    renderItems(items, 'browseGrid');
    const lbl = document.getElementById('itemCountLabel');
    if (lbl) lbl.innerHTML = `Showing <strong>${items.length}</strong> of <strong>${totalItems}</strong> items`;
  }
}

async function renderHome() {
  const data = await apiFetch('api/items.php?limit=6');
  if (data.success) {
    // Update global stats from all items too
    const allData = await apiFetch('api/items.php?limit=200');
    if (allData.success) {
      totalItems = allData.total;
      const el1 = document.getElementById('stat-total');
      const el2 = document.getElementById('stat-found-count');
      const el3 = document.getElementById('stat-recovered');
      if (el1) el1.textContent = allData.total;
      if (el2) el2.textContent = allData.items.filter(i => i.type === 'found').length;
      if (el3) el3.textContent = allData.items.filter(i => i.status === 'claimed').length;
    }
    renderItems(data.items, 'homeItemsGrid', false);
  }
}

// ════════════════════════════════════════
// FILTER LOGIC
// ════════════════════════════════════════
function setTypeFilter(t, el) {
  typeFilter = t;
  document.querySelectorAll('.tab-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderBrowse();
}

function clearFilters() {
  document.getElementById('searchInput').value   = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('locationFilter').value = '';
  typeFilter = 'all';
  document.querySelectorAll('.tab-filter').forEach((b, i) => b.classList.toggle('active', i === 0));
  renderBrowse();
}

// ════════════════════════════════════════
// QUICK SEARCH (from hero)
// ════════════════════════════════════════
function quickSearch() {
  const val = document.getElementById('heroSearch').value.trim();
  typeFilter = 'all';
  document.querySelectorAll('.tab-filter').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });
  showPage('browse');
  requestAnimationFrame(() => {
    const searchEl = document.getElementById('searchInput');
    if (searchEl) { searchEl.value = val; renderBrowse(); }
  });
}

function tagSearch(tag) {
  typeFilter = 'all';
  document.querySelectorAll('.tab-filter').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });
  showPage('browse');
  requestAnimationFrame(() => {
    const searchEl = document.getElementById('searchInput');
    if (searchEl) { searchEl.value = tag; renderBrowse(); }
  });
}

// ════════════════════════════════════════
// ITEM DETAIL MODAL
// ════════════════════════════════════════
function openItemDetail(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const claimed  = item.status === 'claimed';
  const hdrClass = claimed ? 'hdr-claimed' : `hdr-${item.type}`;
  const bClass   = claimed ? 'badge-claimed' : `badge-${item.type}`;
  const bText    = claimed ? 'RESOLVED'      : item.type.toUpperCase();
  const emoji    = item.emoji || getEmoji(item.category);
  const postedBy = item.postedBy || item.posted_by || '—';
  const contact  = item.contact || item.contact_email || '—';
  const desc     = item.desc || item.description || '—';
  const date     = item.date || item.item_date || '—';

  // Image section
  let imageHtml = '';
  if (item.image_path) {
    imageHtml = `<div class="detail-row">
      <i class="fas fa-image di"></i>
      <div><div class="dlabel">Photo</div><div class="dval"><img src="${esc(item.image_path)}" alt="${esc(item.name)}" style="max-width:100%;max-height:250px;border-radius:10px;margin-top:6px;" /></div></div>
    </div>`;
  }

  const actionsHtml = claimed
    ? `<div class="m-resolved-tag"><i class="fas fa-check-circle"></i> &nbsp;Item successfully recovered!</div>`
    : `<button class="m-contact-btn" onclick="contactItem(${id})"><i class="fas fa-envelope"></i> Send Email</button>
       ${currentUser ? `<button class="m-resolve-btn" onclick="markResolved(${id});closeItemDetailBtn()"><i class="fas fa-check"></i> Mark Resolved</button>` : ''}`;

  document.getElementById('itemModalBody').innerHTML = `
    <div class="item-modal-header ${hdrClass}">
      <div class="item-modal-header-left">
        <span class="item-modal-emoji">${emoji}</span>
        <div>
          <h2>${esc(item.name)}</h2>
          <p>
            <span class="item-badge ${bClass}" style="position:static;font-size:9.5px">${bText}</span>
            &nbsp;Posted by <strong>${esc(postedBy)}</strong>
          </p>
        </div>
      </div>
      <button class="modal-close" onclick="closeItemDetailBtn()" aria-label="Close"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="detail-row">
        <i class="fas fa-tag di"></i>
        <div><div class="dlabel">Category</div><div class="dval">${esc(item.category)}</div></div>
      </div>
      <div class="detail-row">
        <i class="fas fa-map-marker-alt di"></i>
        <div><div class="dlabel">Location ${item.type === 'lost' ? 'Lost' : 'Found'}</div><div class="dval">${esc(item.location)}</div></div>
      </div>
      <div class="detail-row">
        <i class="fas fa-calendar-alt di"></i>
        <div><div class="dlabel">Date ${item.type === 'lost' ? 'Lost' : 'Found'}</div><div class="dval">${formatDate(date)}</div></div>
      </div>
      <div class="detail-row">
        <i class="fas fa-align-left di"></i>
        <div><div class="dlabel">Description</div><div class="dval">${esc(desc)}</div></div>
      </div>
      ${imageHtml}
      <div class="detail-row">
        <i class="fas fa-user di"></i>
        <div><div class="dlabel">Posted By</div><div class="dval">${esc(postedBy)}</div></div>
      </div>
      <div class="detail-row">
        <i class="fas fa-envelope di"></i>
        <div><div class="dlabel">Contact Email</div><div class="dval">${esc(contact)}</div></div>
      </div>
      <div class="modal-actions">${actionsHtml}</div>
    </div>`;

  document.getElementById('itemModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeItemDetailOverlay(e) {
  if (e.target === document.getElementById('itemModal')) closeItemDetailBtn();
}
function closeItemDetailBtn() {
  document.getElementById('itemModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ════════════════════════════════════════
// CONTACT & RESOLVE
// ════════════════════════════════════════
function contactItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const postedBy = item.postedBy || item.posted_by || 'User';
  const contact  = item.contact || item.contact_email || '';
  const date     = item.date || item.item_date || '';
  const sub  = encodeURIComponent(`[KRMU Lost & Found] Regarding: ${item.name}`);
  const body = encodeURIComponent(
    `Hello ${postedBy},\n\nI saw your post on the KRMU Campus Lost & Found Portal about "${item.name}" (${item.type === 'lost' ? 'Lost' : 'Found'} on ${formatDate(date)} at ${item.location}).\n\nPlease get in touch with me so we can arrange a handover at a suitable campus location.\n\nThank you.`
  );
  const a = document.createElement('a');
  a.href = `mailto:${contact}?subject=${sub}&body=${body}`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Opening your email client…', 'info');
}

async function markResolved(id) {
  if (!currentUser) {
    showToast('Please log in to resolve items.', 'warn');
    return;
  }
  if (!confirm('Mark this item as Resolved / Recovered?\nThis will update its status on the portal.')) return;

  const data = await apiFetch('api/resolve_item.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: id }),
  });

  if (data.success) {
    showToast('Item marked as recovered! 🎉', 'success');
    // Reload items
    await renderHome();
    if (document.getElementById('browse').classList.contains('active')) {
      await renderBrowse();
    }
  } else {
    showToast(data.error || 'Failed to resolve item.', 'warn');
  }
}

// ════════════════════════════════════════
// FORM VALIDATION
// ════════════════════════════════════════
function setErr(groupId, hasErr) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.classList.toggle('has-error', hasErr);
  const inp = g.querySelector('input, select, textarea');
  if (inp) inp.classList.toggle('error', hasErr);
}

const LOST_RULES = [
  { id: 'lost-item',     fg: 'fg-li',    ok: v => v.length >= 2 },
  { id: 'lost-category', fg: 'fg-lcat',  ok: v => v !== '' },
  { id: 'lost-location', fg: 'fg-lloc',  ok: v => v !== '' },
  { id: 'lost-date',     fg: 'fg-ldt',   ok: v => v !== '' && v <= todayStr() },
  { id: 'lost-desc',     fg: 'fg-ldesc', ok: v => v.length >= 10 },
];

const FOUND_RULES = [
  { id: 'found-item',     fg: 'fg-fi',    ok: v => v.length >= 2 },
  { id: 'found-category', fg: 'fg-fcat',  ok: v => v !== '' },
  { id: 'found-location', fg: 'fg-floc',  ok: v => v !== '' },
  { id: 'found-date',     fg: 'fg-fdt',   ok: v => v !== '' && v <= todayStr() },
  { id: 'found-desc',     fg: 'fg-fdesc', ok: v => v.length >= 10 },
];

function validateRules(rules) {
  let valid = true;
  rules.forEach(r => {
    const el  = document.getElementById(r.id);
    const val = el ? el.value.trim() : '';
    const ok  = r.ok(val);
    setErr(r.fg, !ok);
    if (!ok) valid = false;
  });
  return valid;
}

// ════════════════════════════════════════
// FORM SUBMIT — API-BACKED
// ════════════════════════════════════════
async function submitReport(type) {
  if (!currentUser) {
    showToast('Please log in to report items.', 'warn');
    openAuth();
    return;
  }

  const prefix = type === 'lost' ? 'lost' : 'found';
  const rules  = type === 'lost' ? LOST_RULES : FOUND_RULES;

  if (!validateRules(rules)) {
    showToast('Please fix the highlighted fields.', 'warn');
    return;
  }

  const g = id => document.getElementById(`${prefix}-${id}`);
  const gv = id => g(id).value.trim();

  // Use FormData for file upload support
  const formData = new FormData();
  formData.append('type',             type);
  formData.append('item_name',        gv('item'));
  formData.append('category',         g('category').value);
  formData.append('location',         g('location').value);
  formData.append('item_date',        g('date').value);
  formData.append('description',      gv('desc'));

  // Optional: holding location (found form only)
  const holdingEl = document.getElementById(`${prefix}-holding`);
  if (holdingEl) {
    formData.append('holding_location', holdingEl.value.trim());
  }

  // Optional: image upload
  const imageEl = document.getElementById(`${prefix}-image`);
  if (imageEl && imageEl.files && imageEl.files[0]) {
    formData.append('image', imageEl.files[0]);
  }

  // Show loading state
  const submitBtn = document.querySelector(`#report-${prefix} .submit-btn`);
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
  submitBtn.disabled = true;

  const data = await apiFetch('api/add_item.php', {
    method: 'POST',
    body: formData,
  });

  submitBtn.innerHTML = originalHtml;
  submitBtn.disabled = false;

  if (data.success) {
    // Clear errors and form fields
    rules.forEach(r => setErr(r.fg, false));
    document.querySelectorAll(`#report-${prefix} input, #report-${prefix} select, #report-${prefix} textarea`)
      .forEach(el => el.value = '');

    // Clear image preview
    const previewEl = document.getElementById(`${prefix}-image-preview`);
    if (previewEl) previewEl.innerHTML = '';

    showToast(data.message || `${type === 'lost' ? 'Lost' : 'Found'} report submitted successfully!`, 'success');
    setTimeout(() => showPage('browse'), 900);
  } else {
    showToast(data.error || 'Failed to submit report.', 'warn');
  }
}

function submitLost()  { submitReport('lost');  }
function submitFound() { submitReport('found'); }

// ════════════════════════════════════════
// IMAGE UPLOAD PREVIEW
// ════════════════════════════════════════
function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validate
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a JPG, PNG, GIF, or WebP image.', 'warn');
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB.', 'warn');
      input.value = '';
      preview.innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `
        <div class="image-preview-box">
          <img src="${e.target.result}" alt="Preview" />
          <button type="button" class="image-preview-remove" onclick="removeImagePreview('${input.id}', '${previewId}')">
            <i class="fas fa-times"></i>
          </button>
        </div>`;
    };
    reader.readAsDataURL(file);
  }
}

function removeImagePreview(inputId, previewId) {
  document.getElementById(inputId).value = '';
  document.getElementById(previewId).innerHTML = '';
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('#desktopNav .nav-btn[data-page]').forEach(b => {
    const isActive = b.dataset.page === id;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (id === 'browse') requestAnimationFrame(renderBrowse);
  if (id === 'home')   { renderHome(); }
}

// ════════════════════════════════════════
// AUTH MODAL — API-BACKED
// ════════════════════════════════════════
function openAuth() {
  if (currentUser) {
    if (confirm(`You are logged in as ${currentUser.name} (${currentUser.email}).\n\nLog out?`)) {
      doLogout();
    }
    return;
  }
  document.querySelectorAll('#authModal input').forEach(el => el.classList.remove('error'));
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-pass').value  = '';
  document.getElementById('authModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('auth-email').focus(), 50);
}
function closeAuth() {
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeAuthOverlay(e) {
  if (e.target === document.getElementById('authModal')) closeAuth();
}

function switchTab(tab) {
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.modal-tab').forEach((b, i) => {
    const isActive = (i === 0 && tab === 'login') || (i === 1 && tab === 'register');
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
}

async function doLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  let ok = true;
  const eEl = document.getElementById('auth-email');
  const pEl = document.getElementById('auth-pass');
  if (!isEmail(email)) { eEl.classList.add('error'); ok = false; } else eEl.classList.remove('error');
  if (!pass)           { pEl.classList.add('error'); ok = false; } else pEl.classList.remove('error');
  if (!ok) { showToast('Please enter valid credentials.', 'warn'); return; }

  const data = await apiFetch('api/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  if (data.success) {
    currentUser = data.user;
    closeAuth();
    syncLoginBtn();
    showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`, 'success');
    updateAdminLink();
  } else {
    showToast(data.error || 'Login failed.', 'warn');
  }
}

async function doRegister() {
  const name  = document.getElementById('auth-rname').value.trim();
  const email = document.getElementById('auth-remail').value.trim();
  const rid   = document.getElementById('auth-rid').value.trim();
  const pass  = document.getElementById('auth-rpass').value;
  const fields = [
    ['auth-rname',  name.length >= 2],
    ['auth-remail', isEmail(email)],
    ['auth-rid',    rid.length >= 4],
    ['auth-rpass',  pass.length >= 6],
  ];
  let valid = true;
  fields.forEach(([fid, ok]) => {
    document.getElementById(fid).classList.toggle('error', !ok);
    if (!ok) valid = false;
  });
  if (!valid) { showToast('Please fill all fields correctly.', 'warn'); return; }

  const data = await apiFetch('api/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, student_id: rid, password: pass }),
  });

  if (data.success) {
    currentUser = data.user;
    closeAuth();
    syncLoginBtn();
    showToast(`Account created! Welcome, ${name.split(' ')[0]}! 🎉`, 'success');
    updateAdminLink();
  } else {
    showToast(data.error || 'Registration failed.', 'warn');
  }
}

async function doLogout() {
  await apiFetch('api/logout.php', { method: 'POST' });
  currentUser = null;
  syncLoginBtn();
  updateAdminLink();
  showToast('You have been logged out.', 'info');
}

function syncLoginBtn() {
  const btn = document.getElementById('loginBtn');
  const txt = document.getElementById('loginBtnText');
  const ico = document.getElementById('loginIcon');
  if (currentUser) {
    btn.classList.add('logged-in');
    txt.textContent = currentUser.name.split(' ')[0];
    ico.className   = 'fas fa-user-check';
  } else {
    btn.classList.remove('logged-in');
    txt.textContent = 'Login';
    ico.className   = 'fas fa-user';
  }
}

// ════════════════════════════════════════
// ADMIN LINK VISIBILITY
// ════════════════════════════════════════
function updateAdminLink() {
  const adminLink = document.getElementById('adminNavLink');
  if (adminLink) {
    adminLink.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-flex' : 'none';
  }
  const adminMobileLink = document.getElementById('adminMobileLink');
  if (adminMobileLink) {
    adminMobileLink.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
  }
}

// ════════════════════════════════════════
// SESSION CHECK ON PAGE LOAD
// ════════════════════════════════════════
async function checkSession() {
  const data = await apiFetch('api/session.php');
  if (data.success && data.logged_in) {
    currentUser = data.user;
    syncLoginBtn();
    updateAdminLink();
  }
}

// ════════════════════════════════════════
// MOBILE MENU
// ════════════════════════════════════════
function toggleMobile() {
  const menu     = document.getElementById('mobileMenu');
  const burger   = document.getElementById('hamburger');
  const isOpen   = menu.classList.toggle('open');
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  menu.setAttribute('aria-hidden', String(!isOpen));
}
function closeMobile() {
  const menu   = document.getElementById('mobileMenu');
  const burger = document.getElementById('hamburger');
  menu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}

// ════════════════════════════════════════
// TOAST NOTIFICATIONS
// ════════════════════════════════════════
let toastTimer;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimer);
  const t  = document.getElementById('toast');
  const ic = document.getElementById('toastIcon');
  document.getElementById('toastMsg').textContent = msg;
  t.className = 'toast';
  if      (type === 'success') { t.classList.add('t-success'); ic.className = 'fas fa-check-circle'; }
  else if (type === 'warn')    { t.classList.add('t-warn');    ic.className = 'fas fa-exclamation-triangle'; }
  else                         {                               ic.className = 'fas fa-info-circle'; }
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
}

// ════════════════════════════════════════
// KEYBOARD ACCESSIBILITY
// ════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeItemDetailBtn();
    closeAuth();
    closeMobile();
  }
});

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Set max date on date inputs
  ['lost-date', 'found-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.max = todayStr();
  });

  // Hero search enter key
  const heroSearch = document.getElementById('heroSearch');
  if (heroSearch) {
    heroSearch.addEventListener('keydown', e => { if (e.key === 'Enter') quickSearch(); });
  }

  // Item modal overlay click-outside-to-close
  const itemModal = document.getElementById('itemModal');
  if (itemModal) itemModal.addEventListener('click', closeItemDetailOverlay);

  // Set initial nav state
  const homeBtn = document.querySelector('#desktopNav [data-page="home"]');
  if (homeBtn) {
    homeBtn.classList.add('active');
    homeBtn.setAttribute('aria-current', 'page');
  }

  // Check session & load data
  await checkSession();
  renderHome();
});
