<?php
/**
 * POST /api/resolve_item.php
 * Mark an item as resolved/claimed
 * Only the item owner or an admin can resolve
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$user = requireAuth();

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$itemId = (int)($input['item_id'] ?? 0);

if ($itemId <= 0) {
    jsonResponse(['success' => false, 'error' => 'Invalid item ID.'], 400);
}

$db = getDB();

// Fetch the item
$stmt = $db->prepare("SELECT id, user_id, status FROM items WHERE id = ?");
$stmt->execute([$itemId]);
$item = $stmt->fetch();

if (!$item) {
    jsonResponse(['success' => false, 'error' => 'Item not found.'], 404);
}

if ($item['status'] === 'claimed') {
    jsonResponse(['success' => false, 'error' => 'Item is already resolved.'], 400);
}

// Only item owner or admin can resolve
if ($user['role'] !== 'admin' && (int)$item['user_id'] !== (int)$user['id']) {
    jsonResponse(['success' => false, 'error' => 'You can only resolve your own items.'], 403);
}

// Update status
$stmt = $db->prepare("UPDATE items SET status = 'claimed' WHERE id = ?");
$stmt->execute([$itemId]);

jsonResponse([
    'success' => true,
    'message' => 'Item marked as recovered!',
]);
