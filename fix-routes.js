import express from "express";
import { verifyToken } from "./middleware/auth.js";

const app = express();

// Wallet routes
app.get("/api/wallet/balance", verifyToken, (req, res) => {
  res.json({ balance: 0, status: 'active', validUntil: null });
});

app.get("/api/wallet/balance-check", verifyToken, (req, res) => {
  res.json({ 
    balance: 0, 
    status: 'active', 
    validUntil: null,
    accessType: 'prepaid',
    canSubmitBasic: false,
    canSubmitRealtime: false,
    rates: { basic: 5, realtime: 50 }
  });
});

app.get("/api/wallet/transactions", verifyToken, (req, res) => {
  res.json([]);
});

app.listen(5001, () => {
  console.log("Fix server running on port 5001");
});