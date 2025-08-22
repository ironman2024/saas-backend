import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

try {
  const connection = await db.getConnection();
  console.log("✅ Database connected successfully");
  connection.release();
} catch (error) {
  console.error("❌ Database connection failed:", error);
  process.exit(1);
}

export default db;
