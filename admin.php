<?php
/**
 * ═══════════════════════════════════════════════════════════
 * Admin Dashboard — Campus Lost & Found Management System
 * Team Code Nemesis | B.Tech CSE | K.R. Mangalam University
 * ═══════════════════════════════════════════════════════════
 */
require_once __DIR__ . '/config/database.php';

$user = getLoggedInUser();

// Redirect non-admins to main page
if (!$user || $user['role'] !== 'admin') {
    header('Location: index.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Admin Dashboard — Campus Lost & Found Management System, KRMU" />
  <title>Admin Dashboard | Campus Lost &amp; Found</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />

  <!-- Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  <!-- Admin Styles -->
  <link rel="stylesheet" href="admin.css" />
</head>
<body>

<div class="admin-wrapper">

  <!-- ══════════════ TOP BAR ══════════════ -->
  <div class="admin-topbar">
    <div class="admin-topbar-left">
      <div class="admin-logo"><i class="fas fa-shield-alt"></i></div>
      <h1>Admin <span>Dashboard</span></h1>
    </div>
    <div class="admin-topbar-right">
      <a href="index.html"><i class="fas fa-home"></i>&nbsp; Main Site</a>
      <a class="admin-user-badge"><i class="fas fa-user-shield"></i>&nbsp; <?php echo htmlspecialchars($user['name']); ?></a>
      <a href="#" class="btn-logout" onclick="doAdminLogout()"><i class="fas fa-sign-out-alt"></i>&nbsp; Logout</a>
    </div>
  </div>

  <!-- ══════════════ CONTENT ══════════════ -->
  <div class="admin-content">

    <h2 class="admin-page-title">Dashboard Overview</h2>
    <p class="admin-page-subtitle">Campus Lost &amp; Found Management System — K.R. Mangalam University</p>

    <!-- Stats Cards -->
    <div class="stats-grid" id="statsGrid">
      <div class="admin-loading"><i class="fas fa-spinner"></i> Loading stats…</div>
    </div>

    <!-- Items Table -->
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2><i class="fas fa-boxes-stacked"></i>&nbsp; All Items</h2>
        <span class="badge" id="itemsBadge">-</span>
      </div>
      <div class="admin-table-wrap" id="itemsTableWrap">
        <div class="admin-loading"><i class="fas fa-spinner"></i> Loading items…</div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2><i class="fas fa-users"></i>&nbsp; Registered Users</h2>
        <span class="badge" id="usersBadge">-</span>
      </div>
      <div class="admin-table-wrap" id="usersTableWrap">
        <div class="admin-loading"><i class="fas fa-spinner"></i> Loading users…</div>
      </div>
    </div>

  </div><!-- end .admin-content -->
</div><!-- end .admin-wrapper -->

<script>
'use strict';

// ═════════════════════════════════════════
// LOAD STATS
// ═════════════════════════════════════════
async function loadStats() {
  try {
    const res  = await fetch('api/admin_stats.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const s = data.stats;
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card sc-users">
        <div class="stat-card-icon">👥</div>
        <div class="stat-card-value">${s.total_users}</div>
        <div class="stat-card-label">Total Users</div>
      </div>
      <div class="stat-card sc-total">
        <div class="stat-card-icon">📦</div>
        <div class="stat-card-value">${s.total_items}</div>
        <div class="stat-card-label">Total Items</div>
      </div>
      <div class="stat-card sc-lost">
        <div class="stat-card-icon">🔴</div>
        <div class="stat-card-value">${s.lost_items}</div>
        <div class="stat-card-label">Lost Items</div>
      </div>
      <div class="stat-card sc-found">
        <div class="stat-card-icon">🔵</div>
        <div class="stat-card-value">${s.found_items}</div>
        <div class="stat-card-label">Found Items</div>
      </div>
      <div class="stat-card sc-active">
        <div class="stat-card-icon">⏳</div>
        <div class="stat-card-value">${s.active_items}</div>
        <div class="stat-card-label">Active Items</div>
      </div>
      <div class="stat-card sc-resolved">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-value">${s.resolved_items}</div>
        <div class="stat-card-label">Resolved</div>
      </div>
      <div class="stat-card sc-recent">
        <div class="stat-card-icon">📅</div>
        <div class="stat-card-value">${s.recent_items}</div>
        <div class="stat-card-label">Last 7 Days</div>
      </div>
    `;
  } catch (e) {
    document.getElementById('statsGrid').innerHTML = `<div class="admin-empty"><i class="fas fa-exclamation-triangle"></i> Failed to load stats.</div>`;
  }
}

// ═════════════════════════════════════════
// LOAD ITEMS TABLE
// ═════════════════════════════════════════
async function loadItems() {
  try {
    const res  = await fetch('api/items.php?limit=100');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    document.getElementById('itemsBadge').textContent = data.total + ' items';

    if (!data.items.length) {
      document.getElementById('itemsTableWrap').innerHTML = `<div class="admin-empty"><i class="fas fa-inbox"></i> No items found.</div>`;
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr>
        <th>ID</th><th>Name</th><th>Type</th><th>Category</th><th>Location</th><th>Date</th><th>Posted By</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>`;

    data.items.forEach(item => {
      const typeBadge   = item.type === 'lost' ? 't-badge-lost' : 't-badge-found';
      const statusBadge = item.status === 'claimed' ? 't-badge-claimed' : 't-badge-active';
      html += `<tr>
        <td>#${item.id}</td>
        <td><strong>${esc(item.name)}</strong></td>
        <td><span class="t-badge ${typeBadge}">${item.type}</span></td>
        <td>${esc(item.category)}</td>
        <td>${esc(item.location)}</td>
        <td>${item.item_date || item.date || '—'}</td>
        <td>${esc(item.posted_by || item.postedBy || '—')}</td>
        <td><span class="t-badge ${statusBadge}">${item.status}</span></td>
        <td>
          ${item.status === 'active' ? `<button class="btn-action btn-action-resolve" onclick="resolveItem(${item.id})"><i class="fas fa-check"></i> Resolve</button>` : ''}
          <button class="btn-action btn-action-danger" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('itemsTableWrap').innerHTML = html;
  } catch (e) {
    document.getElementById('itemsTableWrap').innerHTML = `<div class="admin-empty"><i class="fas fa-exclamation-triangle"></i> Failed to load items.</div>`;
  }
}

// ═════════════════════════════════════════
// LOAD USERS TABLE
// ═════════════════════════════════════════
async function loadUsers() {
  try {
    const res  = await fetch('api/admin_users.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    document.getElementById('usersBadge').textContent = data.users.length + ' users';

    if (!data.users.length) {
      document.getElementById('usersTableWrap').innerHTML = `<div class="admin-empty"><i class="fas fa-users-slash"></i> No users found.</div>`;
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Student ID</th><th>Role</th><th>Items Posted</th><th>Registered</th>
      </tr></thead><tbody>`;

    data.users.forEach(u => {
      const roleBadge = u.role === 'admin' ? 't-badge-admin' : 't-badge-user';
      html += `<tr>
        <td>#${u.id}</td>
        <td><strong>${esc(u.name)}</strong></td>
        <td>${esc(u.email)}</td>
        <td>${esc(u.student_id)}</td>
        <td><span class="t-badge ${roleBadge}">${u.role}</span></td>
        <td>${u.items_posted}</td>
        <td>${u.created_at ? u.created_at.split(' ')[0] : '—'}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('usersTableWrap').innerHTML = html;
  } catch (e) {
    document.getElementById('usersTableWrap').innerHTML = `<div class="admin-empty"><i class="fas fa-exclamation-triangle"></i> Failed to load users.</div>`;
  }
}

// ═════════════════════════════════════════
// ACTIONS
// ═════════════════════════════════════════
async function resolveItem(id) {
  if (!confirm('Mark this item as resolved?')) return;
  try {
    const res = await fetch('api/resolve_item.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: id })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    alert('Item resolved!');
    loadStats();
    loadItems();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to DELETE this item? This action cannot be undone.')) return;
  try {
    const res = await fetch('api/delete_item.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: id })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    alert('Item deleted!');
    loadStats();
    loadItems();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function doAdminLogout() {
  try {
    await fetch('api/logout.php', { method: 'POST' });
  } catch (e) { /* ignore */ }
  window.location.href = 'index.html';
}

function esc(s) {
  const el = document.createElement('span');
  el.textContent = s || '';
  return el.innerHTML;
}

// ═════════════════════════════════════════
// INIT
// ═════════════════════════════════════════
loadStats();
loadItems();
loadUsers();
</script>

</body>
</html>
