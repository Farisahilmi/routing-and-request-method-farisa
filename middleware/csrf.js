/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks
 */

const csrf = require('csurf');
const logger = require('../helpers/logger');

// Configure CSRF protection
const csrfProtection = csrf({ 
  cookie: false, // Use session instead of cookie for token storage
  httpOnly: true,
  sameSite: 'strict'
});

/**
 * Middleware to generate and pass CSRF token to views
 */
const csrfTokenMiddleware = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

/**
 * CSRF error handler
 * Logs failed attempts and returns 403
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log the failed CSRF token
  logger.warn('CSRF token validation failed', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    reason: err.message
  });

  // Render error page or JSON response
  if (req.headers['content-type']?.includes('application/json')) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid CSRF token. Please try again.',
      errors: ['CSRF token mismatch']
    });
  }

  res.status(403).render('error', {
    title: 'Security Error',
    message: 'Invalid security token. Please go back and try again.',
    error: { status: 403 },
    user: req.session.user || null
  });
};

module.exports = {
  csrfProtection,
  csrfTokenMiddleware,
  csrfErrorHandler
};
