import express from "express";
import notificationService from "../services/notificationService.js";

const router = express.Router();

// Test SMS endpoint
router.post("/sms", async (req, res) => {
  const { mobile, message } = req.body;
  
  if (!mobile || !message) {
    return res.status(400).json({ message: "Mobile and message are required" });
  }

  try {
    const result = await notificationService.sendSMS(mobile, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "SMS test failed", error: error.message });
  }
});

export default router;