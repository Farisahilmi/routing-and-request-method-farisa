/**
 * Centralized Logger
 * Provides consistent logging throughout the application
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

// Color codes for console output
const COLORS = {
  INFO: '\x1b[34m',      // Blue
  ERROR: '\x1b[31m',     // Red
  WARN: '\x1b[33m',      // Yellow
  DEBUG: '\x1b[36m',     // Cyan
  SUCCESS: '\x1b[32m',   // Green
  RESET: '\x1b[0m'
};

// Icons for better readability
const ICONS = {
  INFO: 'ℹ️',
  ERROR: '❌',
  WARN: '⚠️',
  DEBUG: '🐛',
  SUCCESS: '✅'
};

/**
 * Format timestamp
 * @returns {String}
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Log message to console with color and formatting
 * @param {String} level - Log level (INFO, ERROR, WARN, DEBUG, SUCCESS)
 * @param {String} message - Main message
 * @param {Object} data - Optional additional data
 */
const log = (level, message, data = null) => {
  const color = COLORS[level] || COLORS.INFO;
  const icon = ICONS[level] || '';
  const timestamp = getTimestamp();

  // Format console output
  const consoleOutput = `${color}[${level}]${COLORS.RESET} ${icon} ${timestamp} - ${message}`;

  if (data) {
    console.log(consoleOutput);
    console.log(color + JSON.stringify(data, null, 2) + COLORS.RESET);
  } else {
    console.log(consoleOutput);
  }
};

/**
 * Log info message
 * @param {String} message
 * @param {Object} data
 */
const info = (message, data = null) => {
  log(LOG_LEVELS.INFO, message, data);
};

/**
 * Log error message
 * @param {String} message
 * @param {Object} data
 */
const error = (message, data = null) => {
  log(LOG_LEVELS.ERROR, message, data);
};

/**
 * Log warning message
 * @param {String} message
 * @param {Object} data
 */
const warn = (message, data = null) => {
  log(LOG_LEVELS.WARN, message, data);
};

/**
 * Log debug message (only if DEBUG mode enabled)
 * @param {String} message
 * @param {Object} data
 */
const debug = (message, data = null) => {
  if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
    log(LOG_LEVELS.DEBUG, message, data);
  }
};

/**
 * Log success message
 * @param {String} message
 * @param {Object} data
 */
const success = (message, data = null) => {
  log(LOG_LEVELS.SUCCESS, message, data);
};

/**
 * Log HTTP request
 * @param {String} method
 * @param {String} path
 * @param {Number} statusCode
 */
const httpRequest = (method, path, statusCode) => {
  const statusColor = statusCode < 400 ? COLORS.SUCCESS : COLORS.ERROR;
  console.log(`${statusColor}${method} ${path} - ${statusCode}${COLORS.RESET}`);
};

/**
 * Log database operation
 * @param {String} operation - e.g., 'READ', 'WRITE', 'DELETE'
 * @param {String} collection - e.g., 'users.json'
 * @param {String} status - 'success' or 'error'
 */
const database = (operation, collection, status) => {
  const icon = status === 'success' ? '✅' : '❌';
  const level = status === 'success' ? LOG_LEVELS.SUCCESS : LOG_LEVELS.ERROR;
  log(level, `[DB] ${operation} ${collection} - ${status}`, null);
};

module.exports = {
  log,
  info,
  error,
  warn,
  debug,
  success,
  httpRequest,
  database,
  LOG_LEVELS,
  getTimestamp
};
