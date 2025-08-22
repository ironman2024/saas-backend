import db from "../config/db.js";

// Add balance to user account
export const rechargeBalance = async (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // Update user balance
    await db.query(
      "UPDATE users SET balance = balance + ?, updated_at = NOW() WHERE user_id = ?",
      [amount, req.user.id]
    );

    // Record transaction
    await db.query(
      "INSERT INTO transactions (user_id, type, amount, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [req.user.id, "recharge", amount, paymentMethod || "manual", "completed"]
    );

    // Commit transaction
    await db.query("COMMIT");

    // Get updated balance
    const [user] = await db.query("SELECT balance FROM users WHERE user_id = ?", [req.user.id]);

    res.json({ 
      message: "Balance recharged successfully", 
      newBalance: user[0].balance 
    });

  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Recharge Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user balance
export const getBalance = async (req, res) => {
  try {
    const [user] = await db.query("SELECT balance FROM users WHERE user_id = ?", [req.user.id]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ balance: user[0].balance });
  } catch (error) {
    console.error("Get Balance Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );

    res.json(transactions);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deduct balance for service usage
export const deductBalance = async (req, res) => {
  const { amount, service, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    // Check current balance
    const [user] = await db.query("SELECT balance FROM users WHERE user_id = ?", [req.user.id]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user[0].balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    // Deduct balance
    await db.query(
      "UPDATE users SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?",
      [amount, req.user.id]
    );

    // Record transaction
    await db.query(
      "INSERT INTO transactions (user_id, type, amount, service, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [req.user.id, "deduction", amount, service, description, "completed"]
    );

    // Commit transaction
    await db.query("COMMIT");

    // Get updated balance
    const [updatedUser] = await db.query("SELECT balance FROM users WHERE user_id = ?", [req.user.id]);

    res.json({ 
      message: "Balance deducted successfully", 
      newBalance: updatedUser[0].balance 
    });

  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Deduct Balance Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};