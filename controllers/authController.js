import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import notificationService from "../services/notificationService.js";

// Register Controller
export const registerUser = async (req, res) => {
  const { name, email, mobile, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if email exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.query(
      "INSERT INTO users (name, email, mobile, role, status, password) VALUES (?, ?, ?, ?, 'active', ?)",
      [name, email, mobile, role, hashedPassword]
    );

    // Send welcome SMS
    if (mobile) {
      await notificationService.sendWelcomeMessage(mobile, name);
    }

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Register Error:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists and is active
    const [user] = await db.query("SELECT * FROM users WHERE email = ? AND status = 'active'", [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user[0].user_id, email: user[0].email, role: user[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Get wallet info
    const [wallet] = await db.query("SELECT balance, status FROM wallets WHERE user_id = ?", [user[0].user_id]);

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        walletBalance: wallet[0]?.balance || 0,
        walletStatus: wallet[0]?.status || 'active'
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT u.user_id, u.name, u.email, u.mobile, u.role, u.status, w.balance, w.valid_until FROM users u LEFT JOIN wallets w ON u.user_id = w.user_id WHERE u.user_id = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
