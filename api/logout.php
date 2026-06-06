<?php
/**
 * POST /api/logout.php
 * Destroy user session
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

startSession();

// Unset all session variables
$_SESSION = [];

// Destroy cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}

// Destroy session
session_destroy();

jsonResponse([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
