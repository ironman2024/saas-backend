import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route without auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date() });
});

// Test wallet routes with minimal auth
app.get('/api/wallet/balance', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    balance: 100.00, 
    status: 'active',
    message: 'Wallet balance retrieved successfully'
  });
});

app.get('/api/wallet/balance-check', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    balance: 100.00, 
    status: 'active',
    accessType: 'prepaid',
    canSubmitBasic: true,
    canSubmitRealtime: true,
    rates: { basic: 5, realtime: 50 }
  });
});

app.get('/api/wallet/transactions', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    transactions: []
  });
});

// Test subscription routes
app.get('/api/subscription/list', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    subscriptions: []
  });
});

app.get('/api/subscription/plans', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    plans: [
      { id: 1, name: 'Basic Plan', amount: 999, duration: 30 },
      { id: 2, name: 'Premium Plan', amount: 1999, duration: 30 }
    ]
  });
});

// Test support routes
app.get('/api/support/tickets', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    tickets: []
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/test`);
});