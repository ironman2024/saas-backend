-- Production Database Setup Script
-- Run this on your AWS RDS MySQL instance

CREATE DATABASE IF NOT EXISTS saas_base;
USE saas_base;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20),
  role ENUM('DSA', 'NBFC', 'Co-op', 'Admin') DEFAULT 'DSA',
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  valid_until DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_wallet (user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  txn_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  txn_ref VARCHAR(255),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_transactions (user_id, date),
  INDEX idx_type (type)
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  form_type ENUM('basic', 'realtime') NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  aadhaar VARCHAR(20) NULL,
  pan VARCHAR(20) NULL,
  bank_account VARCHAR(50) NULL,
  amount_charged DECIMAL(10,2) NOT NULL,
  status ENUM('submitted', 'processing', 'approved', 'rejected') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_submissions (user_id, created_at),
  INDEX idx_form_type (form_type)
);

-- Create default admin user (Change password after deployment)
INSERT IGNORE INTO users (name, email, mobile, role, password) 
VALUES ('Admin', 'admin@saasbase.com', '9876543210', 'Admin', '$2a$10$example.hash.here');

-- Create wallet for admin user
INSERT IGNORE INTO wallets (user_id, balance) 
SELECT user_id, 10000.00 FROM users WHERE email = 'admin@saasbase.com';