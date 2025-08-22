// MSG91 Message Templates for SaaS Base System

export const MSG91_TEMPLATES = {
  // Welcome Message
  WELCOME: {
    id: "WELCOME_001",
    message: "Welcome to SaaS Base! Your account is activated. Login at https://saasbase.com to start using our services. Support: +91-9876543210",
    variables: ["name"]
  },

  // Payment Success
  PAYMENT_SUCCESS: {
    id: "PAY_SUCCESS_001", 
    message: "Payment Successful! ₹{amount} added to your wallet. New Balance: ₹{balance}. Transaction ID: {txnId}. Thank you!",
    variables: ["amount", "balance", "txnId"]
  },

  // Low Balance Alert
  LOW_BALANCE: {
    id: "LOW_BAL_001",
    message: "Alert: Your wallet balance is ₹{balance}. Recharge now to continue using our services. Recharge at https://saasbase.com/wallet",
    variables: ["balance"]
  },

  // Form Submission Success
  FORM_SUBMITTED: {
    id: "FORM_SUB_001",
    message: "Loan application submitted successfully! Application ID: {appId}. Amount deducted: ₹{amount}. Remaining balance: ₹{balance}",
    variables: ["appId", "amount", "balance"]
  },

  // Insufficient Balance
  INSUFFICIENT_BALANCE: {
    id: "INSUF_BAL_001",
    message: "Transaction failed! Insufficient balance. Current: ₹{balance}, Required: ₹{required}. Please recharge your wallet.",
    variables: ["balance", "required"]
  },

  // Subscription Expiry Warning
  SUBSCRIPTION_EXPIRY: {
    id: "SUB_EXP_001",
    message: "Your subscription expires in {days} days. Renew now to avoid service interruption. Renew at https://saasbase.com/subscription",
    variables: ["days"]
  },

  // Account Blocked
  ACCOUNT_BLOCKED: {
    id: "ACC_BLOCK_001",
    message: "Your account has been temporarily blocked. Contact support at support@saasbase.com or +91-9876543210 for assistance.",
    variables: []
  },

  // Password Reset
  PASSWORD_RESET: {
    id: "PWD_RESET_001",
    message: "Password reset requested. Use OTP: {otp} to reset your password. Valid for 10 minutes. Don't share this OTP.",
    variables: ["otp"]
  }
};

// Template Usage Functions
export const getTemplate = (templateKey, variables = {}) => {
  const template = MSG91_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  let message = template.message;
  
  // Replace variables in message
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });

  return {
    templateId: template.id,
    message: message
  };
};

// WhatsApp Templates (Rich Format)
export const WHATSAPP_TEMPLATES = {
  PAYMENT_RECEIPT: {
    id: "WA_PAY_001",
    message: `🎉 *Payment Successful!*

💰 Amount: ₹{amount}
💳 Transaction ID: {txnId}
💼 New Balance: ₹{balance}
📅 Date: {date}

Thank you for using SaaS Base!
🌐 Visit: https://saasbase.com`,
    variables: ["amount", "txnId", "balance", "date"]
  },

  LOW_BALANCE_WARNING: {
    id: "WA_LOW_001",
    message: `⚠️ *Low Balance Alert*

💰 Current Balance: ₹{balance}
📊 Threshold: ₹100

🔄 Recharge now to continue services
🌐 https://saasbase.com/wallet

Need help? Reply to this message.`,
    variables: ["balance"]
  }
};

export default MSG91_TEMPLATES;