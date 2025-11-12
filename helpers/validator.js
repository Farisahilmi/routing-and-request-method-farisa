/**
 * Input Validation Helper
 * Provides centralized validation for user input
 */

/**
 * Validate email format
 * @param {String} email
 * @returns {Boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * Validate phone number
 * @param {String} phone
 * @returns {Boolean}
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9\-\+\s\(\)]{10,}$/;
  return phoneRegex.test(String(phone));
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 6 characters
 * - At least one uppercase letter OR one number
 * @param {String} password
 * @returns {Object} { isValid: Boolean, errors: Array }
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter or number');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate username
 * @param {String} username
 * @returns {Boolean}
 */
const validateUsername = (username) => {
  // Username: 3-20 chars, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(String(username));
};

/**
 * Sanitize string input (prevent XSS)
 * @param {String} str
 * @returns {String}
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate all required fields present
 * @param {Object} data
 * @param {Array} requiredFields - Array of field names that must be present
 * @returns {Object} { isValid: Boolean, missingFields: Array }
 */
const validateRequiredFields = (data, requiredFields = []) => {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missingFields.push(field);
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields
  };
};

/**
 * Validate address object
 * @param {Object} address
 * @returns {Object} { isValid: Boolean, errors: Array }
 */
const validateAddress = (address) => {
  const errors = [];
  const requiredFields = ['label', 'fullName', 'phone', 'street', 'city', 'postalCode', 'country'];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!address[field] || (typeof address[field] === 'string' && !address[field].trim())) {
      errors.push(`${field} is required`);
    }
  });

  // Validate phone
  if (address.phone && !validatePhone(address.phone)) {
    errors.push('Invalid phone number format');
  }

  // Validate length
  if (address.label && address.label.length > 50) {
    errors.push('Label must be less than 50 characters');
  }

  if (address.fullName && address.fullName.length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate product object
 * @param {Object} product
 * @returns {Object} { isValid: Boolean, errors: Array }
 */
const validateProduct = (product) => {
  const errors = [];

  if (!product.name || product.name.length < 3) {
    errors.push('Product name must be at least 3 characters');
  }

  if (!product.description || product.description.length < 10) {
    errors.push('Product description must be at least 10 characters');
  }

  if (product.price === undefined || product.price < 0) {
    errors.push('Product price must be a positive number');
  }

  if (!product.category || product.category.length < 2) {
    errors.push('Product category is required');
  }

  if (product.stock === undefined || product.stock < 0 || !Number.isInteger(Number(product.stock))) {
    errors.push('Product stock must be a non-negative integer');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateUsername,
  sanitizeString,
  validateRequiredFields,
  validateAddress,
  validateProduct
};
