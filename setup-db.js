import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('📡 Connected to MySQL server');

    // Create database
    await connection.query('CREATE DATABASE IF NOT EXISTS saas_base');
    await connection.query('USE saas_base');
    
    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(15),
        password VARCHAR(255) NOT NULL,
        role ENUM('DSA', 'NBFC', 'Co-op', 'admin') NOT NULL,
        status ENUM('active', 'blocked') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        wallet_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00,
        valid_until DATE NULL,
        status ENUM('active', 'expired') DEFAULT 'active',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    
    // Create additional tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        txn_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'razorpay',
        txn_ref VARCHAR(255),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        app_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        form_type ENUM('basic', 'realtime_validation') NOT NULL,
        amount_charged DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    
    // Create trigger for wallet creation
    await connection.query(`
      CREATE TRIGGER IF NOT EXISTS create_wallet_after_user_insert
      AFTER INSERT ON users
      FOR EACH ROW
      INSERT INTO wallets (user_id, balance, status) VALUES (NEW.user_id, 0.00, 'active')
    `);
    
    console.log('✅ Database and tables created successfully');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();