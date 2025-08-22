import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created/verified`);

    // Close and reconnect with database
    await connection.end();
    
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Create tables
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(15),
        password VARCHAR(255) NOT NULL,
        role ENUM('DSA', 'NBFC', 'Co-op', 'admin') NOT NULL,
        status ENUM('active', 'blocked') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Wallets table
      `CREATE TABLE IF NOT EXISTS wallets (
        wallet_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00,
        valid_until DATE NULL,
        status ENUM('active', 'expired') DEFAULT 'active',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        txn_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'razorpay',
        txn_ref VARCHAR(255),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,

      // Support tickets table
      `CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,

      // Subscriptions table
      `CREATE TABLE IF NOT EXISTS subscriptions (
        sub_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`
    ];

    for (const table of tables) {
      await dbConnection.execute(table);
    }

    console.log('All tables created successfully');
    await dbConnection.end();
    console.log('Database setup completed!');

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();