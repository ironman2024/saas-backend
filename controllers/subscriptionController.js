import db from "../config/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { addToWallet } from "./walletController.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create subscription payment order
export const createSubscription = async (req, res) => {
  const { planName, amount, duration } = req.body;

  if (!planName || !amount || !duration) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Create Razorpay order for subscription
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        email: req.user.email,
        plan_name: planName,
        duration: duration,
        type: 'subscription'
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      planName,
      duration
    });
  } catch (error) {
    console.error("Create Subscription Order Error:", error);
    res.status(500).json({ message: "Failed to create subscription order" });
  }
};

// Verify subscription payment and activate subscription
export const verifySubscriptionPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, duration } = req.body;

  try {
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amount = payment.amount / 100; // Convert from paise

    // Create subscription record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(duration));

    const [result] = await db.query(
      "INSERT INTO subscriptions (user_id, plan_name, amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [req.user.id, planName, amount, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    // Add amount to wallet as well
    await addToWallet(req.user.id, amount, razorpay_payment_id);

    // Send notification
    await sendSubscriptionNotification(req.user.id, planName, amount);

    res.json({ 
      success: true,
      message: "Subscription activated successfully", 
      subscriptionId: result.insertId,
      amount: amount
    });
  } catch (error) {
    console.error("Subscription Payment Verification Error:", error);
    res.status(500).json({ message: "Subscription payment verification failed" });
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Get Subscriptions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 1,
        name: "Basic Plan",
        amount: 999,
        duration: 30,
        features: ["Unlimited Basic Forms", "Email Support", "Basic Analytics"]
      },
      {
        id: 2,
        name: "Premium Plan",
        amount: 1999,
        duration: 30,
        features: ["Unlimited All Forms", "Priority Support", "Advanced Analytics", "API Access"]
      },
      {
        id: 3,
        name: "Enterprise Plan",
        amount: 4999,
        duration: 30,
        features: ["Everything in Premium", "Custom Integration", "Dedicated Support", "White Label"]
      }
    ];

    res.json({ success: true, plans });
  } catch (error) {
    console.error("Get Plans Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to send subscription notifications
const sendSubscriptionNotification = async (userId, planName, amount) => {
  try {
    const message = `Subscription to ${planName} activated successfully! Amount: ₹${amount} added to your wallet.`;
    
    await db.query(
      "INSERT INTO notifications (user_id, channel, message_type, message) VALUES (?, 'sms', 'payment_success', ?)",
      [userId, message]
    );
  } catch (error) {
    console.error("Subscription Notification Error:", error);
  }
};