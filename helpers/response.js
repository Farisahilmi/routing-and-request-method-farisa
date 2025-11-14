/**
 * Centralized Response Handler
 * Ensures all API responses follow consistent format
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {String} message - Response message
 * @param {Object} data - Response data (optional)
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const success = (res, message, data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message: message,
    data: data || null
  };
  
  res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} errors - Detailed errors (optional)
 * @param {Number} statusCode - HTTP status code (default: 400)
 */
const error = (res, message, errors = null, statusCode = 400) => {
  const response = {
    status: 'error',
    message: message,
    errors: errors || null
  };
  
  res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {String} message - Response message
 * @param {Object} data - Created resource data
 */
const created = (res, message, data) => {
  success(res, message, data, 201);
};

/**
 * Send updated response (200)
 * @param {Object} res - Express response object
 * @param {String} message - Response message
 * @param {Object} data - Updated resource data
 */
const updated = (res, message, data) => {
  success(res, message, data, 200);
};

/**
 * Send deleted response (200)
 * @param {Object} res - Express response object
 * @param {String} message - Response message
 */
const deleted = (res, message) => {
  success(res, message, null, 200);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const unauthorized = (res, message = 'Authentication required') => {
  error(res, message, null, 401);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const forbidden = (res, message = 'Access forbidden') => {
  error(res, message, null, 403);
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {String} resource - Resource name
 */
const notFound = (res, resource = 'Resource') => {
  error(res, `${resource} not found`, null, 404);
};

/**
 * Send validation error response (422)
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 */
const validationError = (res, errors) => {
  error(res, 'Validation failed', errors, 422);
};

module.exports = {
  success,
  error,
  created,
  updated,
  deleted,
  unauthorized,
  forbidden,
  notFound,
  validationError
};
