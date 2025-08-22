import db from "../config/db.js";

// Constants for form rates (parsed once at module load)
const REALTIME_RATE = parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50;
const BASIC_RATE = parseFloat(process.env.BASIC_FORM_RATE) || 5;

// Validate rates on module load
if (isNaN(REALTIME_RATE) || isNaN(BASIC_RATE)) {
  console.error('Invalid form rates in environment variables');
  process.exit(1);
}

// Helper function to get validated rates
const getRates = () => ({ basic: BASIC_RATE, realtime: REALTIME_RATE });

// Enhanced access control middleware with instant blocking
export const checkFormAccess = (formType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          message: "Authentication required",
          accessBlocked: true 
        });
      }
      
      const userId = req.user.id;
      
      // Get user wallet and subscription info in single query
      const [userAccess] = await db.query(`
        SELECT 
          w.balance, 
          w.status as wallet_status,
          s.sub_id,
          s.end_date as subscription_end,
          s.status as subscription_status,
          u.status as user_status
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id
        LEFT JOIN subscriptions s ON u.user_id = s.user_id 
          AND s.status = 'active' 
          AND s.end_date >= CURDATE()
        WHERE u.user_id = ?
        ORDER BY s.end_date DESC
        LIMIT 1
      `, [userId]);

      if (userAccess.length === 0) {
        return res.status(404).json({ 
          message: "User access information not found",
          accessBlocked: true 
        });
      }

      const access = userAccess[0];
      
      // Block if user is inactive
      if (access.user_status !== 'active') {
        return res.status(403).json({ 
          message: "Account is blocked. Contact support.",
          accessBlocked: true 
        });
      }

      // Check for active subscription first
      if (access.sub_id && access.subscription_status === 'active') {
        req.formRate = 0;
        req.accessType = 'subscription';
        req.accessGranted = true;
        return next();
      }

      // Check prepaid wallet access
      const rate = formType === 'realtime_validation' ? REALTIME_RATE : BASIC_RATE;

      if (access.wallet_status !== 'active') {
        return res.status(403).json({ 
          message: "Wallet is inactive. Please contact support.",
          accessBlocked: true 
        });
      }

      if (access.balance < rate) {
        return res.status(403).json({ 
          message: "Insufficient balance. Please recharge your wallet.",
          required: rate,
          current: access.balance,
          accessBlocked: true,
          rechargeRequired: true
        });
      }

      req.formRate = rate;
      req.accessType = 'prepaid';
      req.accessGranted = true;
      next();

    } catch (error) {
      console.error("Access Control Error:", error);
      res.status(500).json({ 
        message: "Access verification failed",
        accessBlocked: true 
      });
    }
  };
};

// Real-time balance check for UI
export const checkBalance = async (req, res) => {
  try {
    // Add authentication check
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const [result] = await db.query(`
      SELECT 
        w.balance,
        w.status as wallet_status,
        CASE 
          WHEN s.sub_id IS NOT NULL THEN 'subscription'
          ELSE 'prepaid'
        END as access_type,
        s.end_date as subscription_end
      FROM wallets w
      LEFT JOIN subscriptions s ON w.user_id = s.user_id 
        AND s.status = 'active' 
        AND s.end_date >= CURDATE()
      WHERE w.user_id = ?
    `, [req.user.id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const rates = getRates();

    res.json({
      balance: result[0].balance,
      walletStatus: result[0].wallet_status,
      accessType: result[0].access_type,
      subscriptionEnd: result[0].subscription_end,
      canSubmitBasic: result[0].access_type === 'subscription' || result[0].balance >= rates.basic,
      canSubmitRealtime: result[0].access_type === 'subscription' || result[0].balance >= rates.realtime,
      rates
    });
  } catch (error) {
    console.error("Balance Check Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};