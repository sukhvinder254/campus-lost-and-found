<?php
/**
 * GET /api/admin_users.php
 * List all registered users (admin only)
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$user = requireAdmin();

$db = getDB();

$stmt = $db->query("
    SELECT u.id, u.name, u.email, u.student_id, u.role, u.created_at,
           COUNT(i.id) AS items_posted
    FROM users u
    LEFT JOIN items i ON i.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
");

$users = $stmt->fetchAll();

// Remove password hashes and cast types
foreach ($users as &$u) {
    $u['id']           = (int)$u['id'];
    $u['items_posted'] = (int)$u['items_posted'];
}
unset($u);

jsonResponse([
    'success' => true,
    'users'   => $users,
]);
