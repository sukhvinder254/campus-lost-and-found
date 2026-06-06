<?php
/**
 * GET /api/admin_stats.php
 * Get dashboard statistics (admin only)
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$user = requireAdmin();

$db = getDB();

// Total users
$totalUsers = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();

// Total items
$totalItems = $db->query("SELECT COUNT(*) FROM items")->fetchColumn();

// Lost items
$lostItems = $db->query("SELECT COUNT(*) FROM items WHERE type = 'lost'")->fetchColumn();

// Found items
$foundItems = $db->query("SELECT COUNT(*) FROM items WHERE type = 'found'")->fetchColumn();

// Active items
$activeItems = $db->query("SELECT COUNT(*) FROM items WHERE status = 'active'")->fetchColumn();

// Resolved items
$resolvedItems = $db->query("SELECT COUNT(*) FROM items WHERE status = 'claimed'")->fetchColumn();

// Recent items (last 7 days)
$recentItems = $db->query("SELECT COUNT(*) FROM items WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();

jsonResponse([
    'success' => true,
    'stats'   => [
        'total_users'    => (int)$totalUsers,
        'total_items'    => (int)$totalItems,
        'lost_items'     => (int)$lostItems,
        'found_items'    => (int)$foundItems,
        'active_items'   => (int)$activeItems,
        'resolved_items' => (int)$resolvedItems,
        'recent_items'   => (int)$recentItems,
    ]
]);
