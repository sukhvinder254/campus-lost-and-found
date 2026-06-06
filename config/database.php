<?php
/**
 * ═══════════════════════════════════════════════════════════
 * Campus Lost & Found — Database Configuration
 * Team Code Nemesis | B.Tech CSE | K.R. Mangalam University
 * ═══════════════════════════════════════════════════════════
 */

// Database credentials (XAMPP defaults)
define('DB_HOST', 'localhost');
define('DB_NAME', 'campus_lost_found');
define('DB_USER', 'root');
define('DB_PASS', '');          // XAMPP default: empty password
define('DB_CHARSET', 'utf8mb4');

/**
 * Get a PDO database connection (singleton pattern)
 */
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
            exit;
        }
    }
    
    return $pdo;
}

/**
 * Start session if not already started
 */
function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Check if user is logged in, return user data or false
 */
function getLoggedInUser() {
    startSession();
    if (isset($_SESSION['user_id'])) {
        return [
            'id'         => $_SESSION['user_id'],
            'name'       => $_SESSION['user_name'],
            'email'      => $_SESSION['user_email'],
            'student_id' => $_SESSION['user_student_id'],
            'role'       => $_SESSION['user_role'],
        ];
    }
    return false;
}

/**
 * Require authentication — sends 401 and exits if not logged in
 */
function requireAuth() {
    $user = getLoggedInUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Please log in to continue.']);
        exit;
    }
    return $user;
}

/**
 * Require admin role — sends 403 and exits if not admin
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required.']);
        exit;
    }
    return $user;
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Sanitize string input
 */
function sanitize($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}
