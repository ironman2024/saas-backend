import db from "../config/db.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT user_id, name, email, role, status, balance, subscription_plan, subscription_expires FROM users WHERE user_id = ?",
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

// Update user profile
export const updateUserProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    await db.query(
      "UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE user_id = ?",
      [name, email, req.user.id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, role, status, balance, subscription_plan, subscription_expires, created_at FROM users ORDER BY created_at DESC"
    );

    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req, res) => {
  const { userId, status } = req.body;

  try {
    await db.query(
      "UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ?",
      [status, userId]
    );

    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};