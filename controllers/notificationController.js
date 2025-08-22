import axios from "axios";
import db from "../config/db.js";

// MSG91 Configuration
const MSG91_CONFIG = {
  SMS_URL: "https://api.msg91.com/api/v5/flow/",
  WHATSAPP_URL: "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/",
  EMAIL_URL: "https://api.msg91.com/api/v5/email/send",
  HEADERS: {
    "authkey": process.env.MSG91_AUTH_KEY,
    "Content-Type": "application/json"
  }
};

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[\r\n\t]/g, ' ').trim();
};

// MSG91 SMS API
const sendSMS = async (mobile, message, templateId = null) => {
  try {
    const data = {
      template_id: templateId || process.env.MSG91_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: mobile,
          message: sanitizeInput(message)
        }
      ]
    };

    const response = await axios.post(MSG91_CONFIG.SMS_URL, data, {
      headers: MSG91_CONFIG.HEADERS
    });

    return response.data;
  } catch (error) {
    console.error("SMS Error:", sanitizeInput(error.response?.data || error.message));
    throw error;
  }
};

// Send WhatsApp message via MSG91
const sendWhatsApp = async (mobile, message) => {
  try {
    const data = {
      integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
      content_type: "text",
      payload: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: mobile,
        type: "text",
        text: {
          body: sanitizeInput(message)
        }
      }
    };

    const response = await axios.post(MSG91_CONFIG.WHATSAPP_URL, data, {
      headers: MSG91_CONFIG.HEADERS
    });

    return response.data;
  } catch (error) {
    console.error("WhatsApp Error:", sanitizeInput(error.response?.data || error.message));
    throw error;
  }
};

// Send email notification
const sendEmail = async (email, subject, message) => {
  try {
    const sanitizedMessage = sanitizeInput(message);
    const data = {
      to: [{ email: email }],
      from: { email: process.env.FROM_EMAIL || "noreply@saasbase.com" },
      subject: sanitizeInput(subject),
      textBody: sanitizedMessage,
      htmlBody: `<p>${sanitizedMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    };

    const response = await axios.post(MSG91_CONFIG.EMAIL_URL, data, {
      headers: MSG91_CONFIG.HEADERS
    });

    return response.data;
  } catch (error) {
    console.error("Email Error:", sanitizeInput(error.response?.data || error.message));
    throw error;
  }
};

// Send notification based on channel
export const sendNotification = async (userId, channel, messageType, customMessage = null) => {
  try {
    // Get user details
    const [user] = await db.query(
      "SELECT name, email, mobile FROM users WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      throw new Error("User not found");
    }

    const { name, email, mobile } = user[0];
    let message = customMessage;

    // Generate message based on type
    if (!message) {
      switch (messageType) {
        case 'low_balance':
          message = `Hi ${name}, your wallet balance is running low. Please recharge to continue using our services.`;
          break;
        case 'expiry_alert':
          message = `Hi ${name}, your subscription is expiring soon. Please renew to avoid service interruption.`;
          break;
        case 'payment_success':
          message = `Hi ${name}, your payment has been successfully processed and added to your wallet.`;
          break;
        default:
          message = `Hi ${name}, this is a notification from SaaS Base.`;
      }
    }

    let result;
    let status = 'sent';

    try {
      switch (channel) {
        case 'sms':
          if (mobile) {
            result = await sendSMS(mobile, message);
          } else {
            throw new Error("Mobile number not found");
          }
          break;
        case 'whatsapp':
          if (mobile) {
            result = await sendWhatsApp(mobile, message);
          } else {
            throw new Error("Mobile number not found");
          }
          break;
        case 'email':
          const subject = messageType === 'payment_success' ? 'Payment Confirmation' : 
                         messageType === 'low_balance' ? 'Low Balance Alert' : 
                         'SaaS Base Notification';
          result = await sendEmail(email, subject, message);
          break;
        default:
          throw new Error("Invalid notification channel");
      }
    } catch (error) {
      status = 'failed';
      console.error(`Notification failed for user ${userId}:`, error.message);
    }

    // Log notification with error handling
    try {
      await db.query(
        "INSERT INTO notifications (user_id, channel, message_type, message, status) VALUES (?, ?, ?, ?, ?)",
        [userId, channel, messageType, sanitizeInput(message), status]
      );
    } catch (logError) {
      console.error("Failed to log notification:", sanitizeInput(logError.message));
    }

    return { success: status === 'sent', result };
  } catch (error) {
    console.error("Send Notification Error:", error);
    throw error;
  }
};

// Check for low balance and expiry alerts (cron job function)
export const checkLowBalanceAndExpiry = async () => {
  try {
    const lowBalanceThreshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    const expiryAlertDays = parseInt(process.env.EXPIRY_ALERT_DAYS) || 7;

    // Check low balance users
    const [lowBalanceUsers] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.mobile, w.balance 
      FROM users u 
      JOIN wallets w ON u.user_id = w.user_id 
      WHERE w.balance < ? AND u.status = 'active'
      AND u.user_id NOT IN (
        SELECT user_id FROM notifications 
        WHERE message_type = 'low_balance' 
        AND DATE(created_at) = CURDATE()
      )
    `, [lowBalanceThreshold]);

    // Send low balance alerts concurrently
    const lowBalancePromises = lowBalanceUsers.flatMap(user => [
      sendNotification(user.user_id, 'sms', 'low_balance'),
      sendNotification(user.user_id, 'email', 'low_balance')
    ]);
    await Promise.allSettled(lowBalancePromises);

    // Check expiring subscriptions
    const [expiringUsers] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.mobile, w.valid_until 
      FROM users u 
      JOIN wallets w ON u.user_id = w.user_id 
      WHERE w.valid_until IS NOT NULL 
      AND w.valid_until <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND w.valid_until > CURDATE()
      AND u.status = 'active'
      AND u.user_id NOT IN (
        SELECT user_id FROM notifications 
        WHERE message_type = 'expiry_alert' 
        AND DATE(created_at) = CURDATE()
      )
    `, [expiryAlertDays]);

    // Send expiry alerts concurrently
    const expiryPromises = expiringUsers.flatMap(user => [
      sendNotification(user.user_id, 'sms', 'expiry_alert'),
      sendNotification(user.user_id, 'email', 'expiry_alert')
    ]);
    await Promise.allSettled(expiryPromises);

    console.log(`Processed ${lowBalanceUsers.length} low balance alerts and ${expiringUsers.length} expiry alerts`);
  } catch (error) {
    console.error("Alert Check Error:", error);
  }
};

// Get notification history
export const getNotificationHistory = async (req, res) => {
  try {
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );

    res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Manual notification send (admin only)
export const sendManualNotification = async (req, res) => {
  const { userId, channel, message } = req.body;

  if (!userId || !channel || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate channel
  const validChannels = ['sms', 'whatsapp', 'email'];
  if (!validChannels.includes(channel)) {
    return res.status(400).json({ message: "Invalid notification channel" });
  }

  try {
    const sanitizedMessage = sanitizeInput(message);
    const result = await sendNotification(userId, channel, 'manual', sanitizedMessage);
    res.json({ message: "Notification sent successfully", result });
  } catch (error) {
    console.error("Manual Notification Error:", sanitizeInput(error.message));
    res.status(500).json({ message: "Failed to send notification" });
  }
};