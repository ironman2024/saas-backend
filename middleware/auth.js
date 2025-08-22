import jwt from "jsonwebtoken";
import db from "../config/db.js";

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ? AND status = 'active'", [decoded.id]);
    
    if (user.length === 0) {
      return res.status(401).json({ message: "Invalid token or user inactive" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Access control middleware - checks wallet balance or subscription for form submission
export const checkAccess = (formType) => {
  return async (req, res, next) => {
    try {
      const [wallet] = await db.query(
        "SELECT balance, status, valid_until FROM wallets WHERE user_id = ?",
        [req.user.id]
      );

      if (wallet.length === 0) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const rate = formType === 'realtime_validation' ? 
        parseFloat(process.env.REALTIME_VALIDATION_RATE) : 
        parseFloat(process.env.BASIC_FORM_RATE);

      // Check if user has active subscription
      const [subscription] = await db.query(
        "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1",
        [req.user.id]
      );

      if (subscription.length > 0) {
        // User has active subscription, allow access
        req.formRate = 0; // No charge for subscription users
        req.accessType = 'subscription';
        return next();
      }

      // Check prepaid wallet balance
      if (wallet[0].balance < rate) {
        return res.status(403).json({ 
          message: "Insufficient balance. Please recharge your wallet or subscribe to a plan.",
          required: rate,
          current: wallet[0].balance
        });
      }

      // Check if wallet is active
      if (wallet[0].status !== 'active') {
        return res.status(403).json({ message: "Wallet is inactive" });
      }

      req.formRate = rate;
      req.accessType = 'prepaid';
      next();
    } catch (error) {
      console.error("Access Check Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};

// Role-based access control
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for your role" });
    }
    next();
  };
};