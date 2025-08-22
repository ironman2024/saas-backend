import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple auth middleware
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date() });
});

// Wallet routes
app.get('/api/wallet/balance', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    balance: 100.00, 
    status: 'active',
    validUntil: null
  });
});

app.get('/api/wallet/balance-check', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    balance: 100.00, 
    status: 'active',
    validUntil: null,
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

// Subscription routes
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

// Support routes
app.get('/api/support/tickets', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    tickets: []
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple test login
  if (email === 'test@example.com' && password === 'password') {
    const token = jwt.sign(
      { id: 1, email: email, role: 'DSA' }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token: token,
      user: { id: 1, name: 'Test User', email: email, role: 'DSA' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  const token = jwt.sign(
    { id: 1, email: email, role: role || 'DSA' }, 
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    token: token,
    user: { id: 1, name: name, email: email, role: role || 'DSA' }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/test`);
  console.log(`Login with: test@example.com / password`);
});