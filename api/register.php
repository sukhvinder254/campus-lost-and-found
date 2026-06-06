<?php
/**
 * POST /api/register.php
 * Register a new user account
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

$name       = sanitize($input['name'] ?? '');
$email      = sanitize($input['email'] ?? '');
$student_id = sanitize($input['student_id'] ?? '');
$password   = $input['password'] ?? '';

// Validation
$errors = [];

if (strlen($name) < 2) {
    $errors[] = 'Name must be at least 2 characters.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if (strlen($student_id) < 4) {
    $errors[] = 'Student/Staff ID must be at least 4 characters.';
}
if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters.';
}

if (!empty($errors)) {
    jsonResponse(['success' => false, 'error' => implode(' ', $errors)], 400);
}

$db = getDB();

// Check if email already exists
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['success' => false, 'error' => 'An account with this email already exists.'], 409);
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Insert user
$stmt = $db->prepare("INSERT INTO users (name, email, student_id, password, role) VALUES (?, ?, ?, ?, 'user')");
$stmt->execute([$name, $email, $student_id, $hashedPassword]);

$userId = $db->lastInsertId();

// Auto-login after registration
startSession();
session_regenerate_id(true);
$_SESSION['user_id']         = $userId;
$_SESSION['user_name']       = $name;
$_SESSION['user_email']      = $email;
$_SESSION['user_student_id'] = $student_id;
$_SESSION['user_role']       = 'user';

jsonResponse([
    'success' => true,
    'message' => 'Account created successfully!',
    'user'    => [
        'id'         => (int)$userId,
        'name'       => $name,
        'email'      => $email,
        'student_id' => $student_id,
        'role'       => 'user',
    ]
]);
