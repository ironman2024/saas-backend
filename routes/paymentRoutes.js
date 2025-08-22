import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleWebhook 
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", verifyToken, createPaymentOrder);
router.post("/verify", verifyToken, verifyPayment);
router.post("/webhook", handleWebhook); // No auth needed for webhook

export default router;