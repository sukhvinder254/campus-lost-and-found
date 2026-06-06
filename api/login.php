<?php
/**
 * POST /api/login.php
 * Authenticate user and create session
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed.'], 405);
}

// Read input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email    = sanitize($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Please enter a valid email address.'], 400);
}
if (empty($password)) {
    jsonResponse(['success' => false, 'error' => 'Please enter your password.'], 400);
}

$db = getDB();

// Find user by email
$stmt = $db->prepare("SELECT id, name, email, student_id, password, role FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    jsonResponse(['success' => false, 'error' => 'Invalid email or password.'], 401);
}

// Create session
startSession();
session_regenerate_id(true);
$_SESSION['user_id']         = $user['id'];
$_SESSION['user_name']       = $user['name'];
$_SESSION['user_email']      = $user['email'];
$_SESSION['user_student_id'] = $user['student_id'];
$_SESSION['user_role']       = $user['role'];

jsonResponse([
    'success' => true,
    'message' => 'Login successful!',
    'user'    => [
        'id'         => (int)$user['id'],
        'name'       => $user['name'],
        'email'      => $user['email'],
        'student_id' => $user['student_id'],
        'role'       => $user['role'],
    ]
]);
