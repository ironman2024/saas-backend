// Application Constants
export const USER_ROLES = {
  DSA: 'DSA',
  NBFC: 'NBFC',
  COOP: 'Co-op',
  ADMIN: 'admin'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked'
};

export const WALLET_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired'
};

export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit'
};

export const FORM_TYPES = {
  BASIC: 'basic',
  REALTIME_VALIDATION: 'realtime_validation'
};

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const NOTIFICATION_CHANNELS = {
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email'
};

export const NOTIFICATION_TYPES = {
  EXPIRY_ALERT: 'expiry_alert',
  LOW_BALANCE: 'low_balance',
  PAYMENT_SUCCESS: 'payment_success',
  MANUAL: 'manual'
};

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const SUPPORT_TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Default values
export const DEFAULTS = {
  BCRYPT_SALT_ROUNDS: 10,
  LOW_BALANCE_THRESHOLD: 100,
  EXPIRY_ALERT_DAYS: 7,
  CONNECTION_LIMIT: 10,
  ACQUIRE_TIMEOUT: 60000,
  TIMEOUT: 60000
};