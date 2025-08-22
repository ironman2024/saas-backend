import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getWalletBalance, getWalletBalanceCheck, getTransactionHistory } from "../controllers/walletController.js";

const router = express.Router();

router.get("/balance", verifyToken, getWalletBalance);
router.get("/balance-check", verifyToken, getWalletBalanceCheck);
router.get("/transactions", verifyToken, getTransactionHistory);

export default router;