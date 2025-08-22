-- SaaS Base Database Schema
CREATE DATABASE IF NOT EXISTS saas_base;
USE saas_base;

-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role ENUM('DSA', 'NBFC', 'Co-op', 'admin') NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE wallets (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    valid_until DATE NULL,
    status ENUM('active', 'expired') DEFAULT 'active',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    txn_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'razorpay',
    txn_ref VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE applications (
    app_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    form_type ENUM('basic', 'realtime_validation') NOT NULL,
    amount_charged DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    notif_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel ENUM('sms', 'whatsapp', 'email') NOT NULL,
    message_type ENUM('expiry_alert', 'low_balance', 'payment_success') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('sent', 'failed') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Subscriptions table for subscription model
CREATE TABLE subscriptions (
    sub_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Support tickets table
CREATE TABLE support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Invoices table
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create wallet for each user after registration
DELIMITER //
CREATE TRIGGER create_wallet_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id, balance, status) VALUES (NEW.user_id, 0.00, 'active');
END//
DELIMITER ;