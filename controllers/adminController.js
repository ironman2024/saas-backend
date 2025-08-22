import db from "../config/db.js";

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    
    // Total revenue
    const [totalRevenue] = await db.query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit'");
    
    // Total applications
    const [totalApplications] = await db.query("SELECT COUNT(*) as count FROM applications");
    
    // Low balance users
    const lowBalanceThreshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    const [lowBalanceUsers] = await db.query("SELECT COUNT(*) as count FROM wallets WHERE balance < ?", [lowBalanceThreshold]);

    res.json({
      totalUsers: totalUsers[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      totalApplications: totalApplications[0].count,
      lowBalanceUsers: lowBalanceUsers[0].count
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users with wallet info
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.status, u.created_at, w.balance
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query("UPDATE users SET status = ? WHERE user_id = ?", [status, userId]);
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};