import Razorpay from "razorpay";
import crypto from "crypto";
import { addToWallet } from "./walletController.js";
import db from "../config/db.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
export const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        email: req.user.email
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Payment Order Error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// Verify payment and update wallet
export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    // Add to wallet
    await addToWallet(req.user.id, amount, razorpay_payment_id);

    // Send notification
    await sendPaymentNotification(req.user.id, amount, "payment_success");

    res.json({ message: "Payment verified and wallet updated", amount });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// Webhook handler for automatic payment updates
export const handleWebhook = async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const webhookBody = JSON.stringify(req.body);

  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const userId = payment.notes.user_id;
      const amount = payment.amount / 100;

      // Add to wallet
      await addToWallet(userId, amount, payment.id);
      
      // Send notification
      await sendPaymentNotification(userId, amount, "payment_success");
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Manual payment update (admin only)
export const updateManualPayment = async (req, res) => {
  const { userId, amount, txnRef } = req.body;

  if (!userId || !amount || !txnRef) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // Check if transaction already exists
    const [existing] = await db.query(
      "SELECT * FROM transactions WHERE txn_ref = ?",
      [txnRef]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Transaction already processed" });
    }

    await addToWallet(userId, amount, txnRef);
    await sendPaymentNotification(userId, amount, "payment_success");

    res.json({ message: "Manual payment updated successfully" });
  } catch (error) {
    console.error("Manual Payment Error:", error);
    res.status(500).json({ message: "Failed to update manual payment" });
  }
};

// Helper function to send payment notifications
const sendPaymentNotification = async (userId, amount, type) => {
  try {
    const message = `Payment of ₹${amount} has been successfully added to your wallet.`;
    
    await db.query(
      "INSERT INTO notifications (user_id, channel, message_type, message) VALUES (?, 'sms', ?, ?)",
      [userId, type, message]
    );
  } catch (error) {
    console.error("Notification Error:", error);
  }
};