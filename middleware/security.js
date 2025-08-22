import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// CSRF Protection Middleware
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and webhook endpoints
  if (req.method === 'GET' || req.path.includes('/webhook')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

// Generate CSRF token
export const generateCSRFToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store in session (you'll need express-session)
  if (req.session) {
    req.session.csrfToken = token;
  }
  
  res.json({ csrfToken: token });
};

// Rate limiting middleware
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const paymentRateLimit = createRateLimit(60 * 1000, 10); // 10 payments per minute
export const formRateLimit = createRateLimit(60 * 1000, 20); // 20 forms per minute
export const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes

// Input validation middleware
export const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.razorpay.com;"
  );
  
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log to console (in production, use proper logging service)
    console.log(JSON.stringify(logData));
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};