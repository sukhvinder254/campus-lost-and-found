<?php
/**
 * GET /api/items.php
 * List and search items with filtering & pagination
 *
 * Query params:
 *   search   - keyword search (name, description)
 *   category - filter by category
 *   location - filter by location
 *   type     - 'lost' or 'found'
 *   limit    - items per page (default 50)
 *   offset   - pagination offset (default 0)
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$db = getDB();

// Build dynamic query
$where  = [];
$params = [];

// Type filter
if (!empty($_GET['type']) && in_array($_GET['type'], ['lost', 'found'])) {
    $where[]  = "type = ?";
    $params[] = $_GET['type'];
}

// Category filter
if (!empty($_GET['category'])) {
    $where[]  = "category = ?";
    $params[] = $_GET['category'];
}

// Location filter
if (!empty($_GET['location'])) {
    $where[]  = "location = ?";
    $params[] = $_GET['location'];
}

// Status filter
if (!empty($_GET['status']) && in_array($_GET['status'], ['active', 'claimed'])) {
    $where[]  = "status = ?";
    $params[] = $_GET['status'];
}

// Keyword search
if (!empty($_GET['search'])) {
    $search   = '%' . $_GET['search'] . '%';
    $where[]  = "(name LIKE ? OR description LIKE ? OR location LIKE ? OR category LIKE ? OR posted_by LIKE ?)";
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
}

// Pagination
$limit  = isset($_GET['limit'])  ? max(1, min(100, (int)$_GET['limit']))  : 50;
$offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset'])           : 0;

// Build SQL
$sql = "SELECT * FROM items";
if (!empty($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}
$sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;

$stmt = $db->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();

// Get total count for pagination
$countSql = "SELECT COUNT(*) as total FROM items";
if (!empty($where)) {
    $countSql .= " WHERE " . implode(" AND ", array_slice($where, 0)); // reuse where clauses
}
$countParams = array_slice($params, 0, count($params) - 2); // exclude LIMIT and OFFSET
$countStmt   = $db->prepare($countSql);
$countStmt->execute($countParams);
$total = $countStmt->fetch()['total'];

// Format dates and add emoji mapping
$emojiMap = [
    'Electronics'        => '📱',
    'Documents & ID'     => '🪪',
    'Bags & Accessories' => '👜',
    'Clothing'           => '👕',
    'Books & Notes'      => '📚',
    'Keys & Cards'       => '🔑',
    'Other'              => '📦',
];

foreach ($items as &$item) {
    $item['id']     = (int)$item['id'];
    $item['emoji']  = $emojiMap[$item['category']] ?? '📦';
    $item['date']   = $item['item_date'];        // alias for frontend compatibility
    $item['desc']   = $item['description'];       // alias for frontend compatibility
    $item['contact'] = $item['contact_email'];    // alias for frontend compatibility
    $item['postedBy'] = $item['posted_by'];       // alias for frontend compatibility
}
unset($item);

jsonResponse([
    'success' => true,
    'items'   => $items,
    'total'   => (int)$total,
    'limit'   => $limit,
    'offset'  => $offset,
]);
