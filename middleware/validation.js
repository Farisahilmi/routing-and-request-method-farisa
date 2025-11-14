/**
 * Centralized Request Validation Middleware
 */

const { validateEmail, validatePhone, validatePasswordStrength, validateUsername, validateAddress, validateProduct, validateRequiredFields } = require('../helpers/validator');
const response = require('../helpers/response');

/**
 * Middleware to validate product data
 */
const validateProductData = (req, res, next) => {
  const { name, description, price, category, stock, image } = req.body;

  const validation = validateProduct({
    name,
    description,
    price: parseFloat(price),
    category,
    stock: parseInt(stock)
  });

  if (!validation.isValid) {
    return response.validationError(res, validation.errors);
  }

  next();
};

/**
 * Middleware to validate user registration data
 */
const validateRegistrationData = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  // Check required fields
  const required = validateRequiredFields(req.body, ['username', 'email', 'password', 'confirmPassword']);
  if (!required.isValid) {
    return response.validationError(res, [`Missing required fields: ${required.missingFields.join(', ')}`]);
  }

  // Validate username
  if (!validateUsername(username)) {
    return response.validationError(res, ['Username must be 3-20 characters, alphanumeric and underscore only']);
  }

  // Validate email
  if (!validateEmail(email)) {
    return response.validationError(res, ['Invalid email format']);
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return response.validationError(res, passwordValidation.errors);
  }

  // Check password match
  if (password !== confirmPassword) {
    return response.validationError(res, ['Passwords do not match']);
  }

  next();
};

/**
 * Middleware to validate address data
 */
const validateAddressData = (req, res, next) => {
  const addressData = req.body;

  const validation = validateAddress(addressData);

  if (!validation.isValid) {
    return response.validationError(res, validation.errors);
  }

  next();
};

/**
 * Middleware to validate cart item
 */
const validateCartItem = (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return response.validationError(res, ['Product ID is required']);
  }

  const qty = parseInt(quantity) || 1;
  if (qty < 1 || qty > 999) {
    return response.validationError(res, ['Quantity must be between 1 and 999']);
  }

  next();
};

/**
 * Middleware to validate order data
 */
const validateOrderData = (req, res, next) => {
  const { shippingAddress, paymentMethod, products } = req.body;

  // Check required fields
  const required = validateRequiredFields(req.body, ['shippingAddress', 'paymentMethod', 'products']);
  if (!required.isValid) {
    return response.validationError(res, [`Missing required fields: ${required.missingFields.join(', ')}`]);
  }

  // Validate products array
  if (!Array.isArray(products) || products.length === 0) {
    return response.validationError(res, ['Products must be a non-empty array']);
  }

  next();
};

/**
 * Middleware to validate payment data
 */
const validatePaymentData = (req, res, next) => {
  const { method, amount } = req.body;

  if (!method || !amount) {
    return response.validationError(res, ['Payment method and amount are required']);
  }

  const validMethods = ['credit_card', 'bank_transfer', 'digital_wallet'];
  if (!validMethods.includes(method)) {
    return response.validationError(res, [`Invalid payment method. Must be one of: ${validMethods.join(', ')}`]);
  }

  if (parseFloat(amount) <= 0) {
    return response.validationError(res, ['Amount must be greater than 0']);
  }

  next();
};

/**
 * Middleware to validate search/filter parameters
 */
const validateSearchParams = (req, res, next) => {
  const { page, limit, sort, filter } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return response.validationError(res, ['Page must be a positive number']);
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return response.validationError(res, ['Limit must be between 1 and 100']);
  }

  next();
};

module.exports = {
  validateProductData,
  validateRegistrationData,
  validateAddressData,
  validateCartItem,
  validateOrderData,
  validatePaymentData,
  validateSearchParams
};
