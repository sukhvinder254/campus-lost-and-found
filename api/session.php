<?php
/**
 * GET /api/session.php
 * Check current session status
 */
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$user = getLoggedInUser();

if ($user) {
    jsonResponse([
        'success'   => true,
        'logged_in' => true,
        'user'      => $user,
    ]);
} else {
    jsonResponse([
        'success'   => true,
        'logged_in' => false,
    ]);
}
