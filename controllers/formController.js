import db from "../config/db.js";
import { deductFromWallet } from "./walletController.js";
import notificationService from "../services/notificationService.js";

// Submit basic form
export const submitBasicForm = async (req, res) => {
  const { applicantName, loanAmount, purpose } = req.body;
  const userId = req.user.id;
  const rate = parseFloat(process.env.BASIC_FORM_RATE) || 5;

  try {
    // Deduct amount from wallet
    await deductFromWallet(userId, rate, 'Basic Form');

    // Save form submission
    await db.query(
      "INSERT INTO form_submissions (user_id, form_type, applicant_name, loan_amount, purpose, amount_charged) VALUES (?, 'basic', ?, ?, ?, ?)",
      [userId, applicantName, loanAmount, purpose, rate]
    );

    // Get user mobile for SMS
    const [user] = await db.query("SELECT mobile FROM users WHERE user_id = ?", [userId]);
    const [wallet] = await db.query("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

    if (user[0]?.mobile) {
      await notificationService.sendFormSubmitted(user[0].mobile, 'Basic Form', rate, wallet[0].balance);
    }

    res.json({
      success: true,
      message: "Basic form submitted successfully",
      amountDeducted: rate,
      remainingBalance: wallet[0].balance
    });

  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Form submission failed" });
  }
};

// Submit realtime validation form
export const submitRealtimeForm = async (req, res) => {
  const { applicantName, loanAmount, purpose, aadhaar, pan, bankAccount } = req.body;
  const userId = req.user.id;
  const rate = parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50;

  try {
    // Deduct amount from wallet
    await deductFromWallet(userId, rate, 'Realtime Validation');

    // Save form submission
    await db.query(
      "INSERT INTO form_submissions (user_id, form_type, applicant_name, loan_amount, purpose, aadhaar, pan, bank_account, amount_charged) VALUES (?, 'realtime', ?, ?, ?, ?, ?, ?, ?)",
      [userId, applicantName, loanAmount, purpose, aadhaar, pan, bankAccount, rate]
    );

    // Get user mobile for SMS
    const [user] = await db.query("SELECT mobile FROM users WHERE user_id = ?", [userId]);
    const [wallet] = await db.query("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

    if (user[0]?.mobile) {
      await notificationService.sendFormSubmitted(user[0].mobile, 'Realtime Validation', rate, wallet[0].balance);
    }

    res.json({
      success: true,
      message: "Realtime validation form submitted successfully",
      amountDeducted: rate,
      remainingBalance: wallet[0].balance
    });

  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Form submission failed" });
  }
};