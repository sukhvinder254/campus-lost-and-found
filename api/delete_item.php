<?php
/**
 * POST /api/delete_item.php
 * Delete an item (admin only)
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$user = requireAdmin();

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$itemId = (int)($input['item_id'] ?? 0);

if ($itemId <= 0) {
    jsonResponse(['success' => false, 'error' => 'Invalid item ID.'], 400);
}

$db = getDB();

// Fetch item (to delete associated image)
$stmt = $db->prepare("SELECT id, image_path FROM items WHERE id = ?");
$stmt->execute([$itemId]);
$item = $stmt->fetch();

if (!$item) {
    jsonResponse(['success' => false, 'error' => 'Item not found.'], 404);
}

// Delete image file if exists
if (!empty($item['image_path'])) {
    $filePath = __DIR__ . '/../' . $item['image_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
}

// Delete item from database
$stmt = $db->prepare("DELETE FROM items WHERE id = ?");
$stmt->execute([$itemId]);

jsonResponse([
    'success' => true,
    'message' => 'Item deleted successfully.',
]);
