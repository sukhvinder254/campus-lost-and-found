-- ═══════════════════════════════════════════════════════════
-- Campus Lost & Found Management System — Database Schema
-- Team Code Nemesis | B.Tech CSE | K.R. Mangalam University
-- ═══════════════════════════════════════════════════════════

-- Create database
CREATE DATABASE IF NOT EXISTS campus_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_lost_found;

-- ════════════════════════════════════════
-- TABLE: users
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  student_id  VARCHAR(30)   NOT NULL,
  password    VARCHAR(255)  NOT NULL,  -- bcrypt hash
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ════════════════════════════════════════
-- TABLE: items
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT            NULL,
  type              ENUM('lost','found') NOT NULL,
  status            ENUM('active','claimed') NOT NULL DEFAULT 'active',
  name              VARCHAR(150)   NOT NULL,
  category          VARCHAR(60)    NOT NULL,
  location          VARCHAR(100)   NOT NULL,
  item_date         DATE           NOT NULL,
  description       TEXT           NOT NULL,
  contact_email     VARCHAR(150)   NOT NULL,
  posted_by         VARCHAR(100)   NOT NULL,
  holding_location  VARCHAR(150)   NULL,
  image_path        VARCHAR(255)   NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ════════════════════════════════════════
-- TABLE: claims
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS claims (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id     INT NOT NULL,
  claimer_id  INT NOT NULL,
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  message     TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id)    REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (claimer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ════════════════════════════════════════
-- INDEXES for search performance
-- ════════════════════════════════════════
CREATE INDEX idx_items_type     ON items(type);
CREATE INDEX idx_items_status   ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_location ON items(location);
CREATE INDEX idx_items_date     ON items(item_date);
CREATE FULLTEXT INDEX idx_items_search ON items(name, description);

-- ════════════════════════════════════════
-- SEED DATA: Admin Account
-- Password: admin123  (bcrypt hash)
-- ════════════════════════════════════════
INSERT INTO users (name, email, student_id, password, role) VALUES
('Admin', 'admin@krmangalam.edu.in', 'ADMIN001',
 '$2y$10$w1h.CSEmvpKSENrbNzrs8OInxJ2/yRTZ9C8DbAFdDH8rsMONMUYqa', 'admin');

-- ════════════════════════════════════════
-- SEED DATA: Sample Users
-- Password for all: password123
-- ════════════════════════════════════════
INSERT INTO users (name, email, student_id, password, role) VALUES
('Rohit Kumar',   'rk@student.krmangalam.edu.in',       '2501010001',
 '$2y$10$hGICSJ9ilFm.YWrG3Kju7erFZ.SG5kZdLb7JMCh/y9Dj44PfeslSa', 'user'),
('Meena Singh',   'ms@student.krmangalam.edu.in',       '2501010002',
 '$2y$10$hGICSJ9ilFm.YWrG3Kju7erFZ.SG5kZdLb7JMCh/y9Dj44PfeslSa', 'user'),
('Priya Sharma',  'priya.s@student.krmangalam.edu.in',  '2501010003',
 '$2y$10$hGICSJ9ilFm.YWrG3Kju7erFZ.SG5kZdLb7JMCh/y9Dj44PfeslSa', 'user'),
('Arjun Verma',   'arjun.v@student.krmangalam.edu.in',  '2501010004',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Tanveer Ahmad', 'tanveer@student.krmangalam.edu.in',  '2501010005',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Divya Nair',    'divya.n@student.krmangalam.edu.in',  '2501010006',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Suman Mishra',  'suman.m@student.krmangalam.edu.in',  '2501010007',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('Arman Kumar',   'arman.k@student.krmangalam.edu.in',  '2501010008',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- ════════════════════════════════════════
-- SEED DATA: Sample Items
-- ════════════════════════════════════════
INSERT INTO items (user_id, type, status, name, category, location, item_date, description, contact_email, posted_by) VALUES
(2, 'lost',  'active',  'Blue Leather Wallet',       'Bags & Accessories', 'Library',       '2026-02-18',
 'Dark blue leather wallet with initials "R.K." engraved inside. Contains student ID card, metro card, and some cash. Please contact if found.',
 'rk@student.krmangalam.edu.in', 'Rohit Kumar'),

(3, 'found', 'active',  'iPhone 13 (Black)',          'Electronics',        'Cafeteria',     '2026-02-20',
 'Black iPhone 13 found near the food counter. Screen has a minor scratch on the bottom corner. Currently being kept safely with me.',
 'ms@student.krmangalam.edu.in', 'Meena Singh'),

(4, 'lost',  'active',  'KRMU Student ID Card',       'Documents & ID',     'Block A',       '2026-02-19',
 'Student ID card for roll number 2501010090. Lost near classroom A-204 after the morning lecture. Very urgent — needed for examinations.',
 'priya.s@student.krmangalam.edu.in', 'Priya Sharma'),

(5, 'found', 'active',  'Grey Laptop Bag',            'Bags & Accessories', 'Block B',       '2026-02-21',
 'Grey and black laptop bag found near Lab B-108. Contains USB cables and a charger brick inside. No laptop. Kept at the DSW Office.',
 'arjun.v@student.krmangalam.edu.in', 'Arjun Verma'),

(6, 'lost',  'claimed', 'Casio FX-991EX Calculator',  'Electronics',        'Block C',       '2026-02-17',
 'Scientific calculator with blue electrical tape on the back and owner name in permanent marker. Lost during the mathematics exam.',
 'tanveer@student.krmangalam.edu.in', 'Tanveer Ahmad'),

(7, 'found', 'active',  'Set of 3 Keys (Red Chain)',  'Keys & Cards',       'Parking Area',  '2026-02-22',
 'Three keys on a red keychain with a small KRMU promotional tag. Found near the two-wheeler parking zone by the main gate entrance.',
 'divya.n@student.krmangalam.edu.in', 'Divya Nair'),

(8, 'lost',  'active',  'Black Umbrella',             'Other',              'Library',       '2026-03-01',
 'Black folding umbrella with a red logo. Left at the library entrance umbrella stand. Name "S. Mishra" written on handle with marker.',
 'suman.m@student.krmangalam.edu.in', 'Suman Mishra'),

(9, 'found', 'active',  'Prescription Glasses',       'Other',              'Cafeteria',     '2026-03-05',
 'Black-framed prescription glasses in a brown leather case. Found on a table in the cafeteria. Currently kept with me safely.',
 'arman.k@student.krmangalam.edu.in', 'Arman Kumar');
