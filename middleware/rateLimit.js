/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../helpers/logger');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit static files and images
    if (req.path.startsWith('/public') || req.path.startsWith('/images')) {
      return true;
    }
    return false;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded`, { ip: req.ip, path: req.path });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please try again later.',
      errors: null
    });
  }
});

// Stricter limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skip: (req) => {
    return false;
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded`, { ip: req.ip, endpoint: req.path });
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Please try again in 15 minutes.',
      errors: null
    });
  }
});

// Moderate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: 'Too many requests to API',
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded`, { ip: req.ip, endpoint: req.path });
    res.status(429).json({
      status: 'error',
      message: 'Too many API requests. Please slow down.',
      errors: null
    });
  }
});

// Strict limiter for admin operations
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per minute
  message: 'Too many admin requests',
  handler: (req, res) => {
    logger.warn(`Admin rate limit exceeded`, { ip: req.ip, endpoint: req.path });
    res.status(429).json({
      status: 'error',
      message: 'Too many admin operations. Please wait before trying again.',
      errors: null
    });
  }
});

// Limiter for password reset and sensitive operations
const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: 'Too many sensitive operations',
  handler: (req, res) => {
    logger.warn(`Sensitive operation limit exceeded`, { ip: req.ip, endpoint: req.path });
    res.status(429).json({
      status: 'error',
      message: 'Too many attempts. Please try again later.',
      errors: null
    });
  }
});

// Contact form rate limiter
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 contact form submissions per hour
  message: 'Too many contact submissions',
  handler: (req, res) => {
    logger.warn(`Contact form limit exceeded`, { ip: req.ip });
    res.status(429).json({
      status: 'error',
      message: 'Too many contact form submissions. Please try again later.',
      errors: null
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  adminLimiter,
  sensitiveOpLimiter,
  contactLimiter
};
