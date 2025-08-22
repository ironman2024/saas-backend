import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  getUserSubscriptions,
  verifySubscriptionPayment,
  getSubscriptionPlans
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);
router.post("/verify-payment", verifyToken, verifySubscriptionPayment);
router.get("/list", verifyToken, getUserSubscriptions);
router.get("/plans", verifyToken, getSubscriptionPlans);

export default router;