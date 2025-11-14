# 🚀 QUICK REFERENCE - NEW HELPERS

## Response Helper Quick Lookup

```javascript
const response = require('../helpers/response');

// ✅ SUCCESS RESPONSES
response.success(res, 'Data retrieved', { data });      // 200
response.created(res, 'Item created', newItem);         // 201
response.updated(res, 'Item updated', updatedItem);     // 200
response.deleted(res, 'Item deleted');                  // 200

// ❌ ERROR RESPONSES
response.error(res, 'Bad request', errors);             // 400
response.validationError(res, errors);                  // 422
response.unauthorized(res, 'Login required');           // 401
response.forbidden(res, 'Admin only');                  // 403
response.notFound(res, 'User');                         // 404
response.error(res, 'Server error', null, 500);        // 500
```

---

## Validation Middleware Quick Lookup

```javascript
const { 
  validateProductData,
  validateRegistrationData,
  validateAddressData,
  validateCartItem,
  validateOrderData,
  validatePaymentData,
  validateSearchParams
} = require('../middleware/validation');

// Usage:
router.post('/products', 
  requireAdmin, 
  validateProductData,  // ← Add before handler
  handler
);
```

---

## Logger Quick Lookup

```javascript
const logger = require('../helpers/logger');

logger.success('Operation done', { detail });   // ✅ Green
logger.error('Operation failed', { detail });   // ❌ Red
logger.warn('Warning message', { detail });     // ⚠️ Yellow
logger.info('Info message', { detail });        // ℹ️ Blue
logger.debug('Debug info', { detail });         // 🐛 Cyan (dev only)
```

---

## Database Helper Quick Lookup

```javascript
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');

// Read
const users = readJSONFile('users.json');

// Write
const success = writeJSONFile('users.json', updatedUsers);

// Clear cache for specific file
clearCache('users.json');

// Clear all cache
clearCache();
```

---

## File Imports Cheat Sheet

```javascript
// Always needed
const express = require('express');
const router = express.Router();

// For responses
const response = require('../helpers/response');

// For logging
const logger = require('../helpers/logger');

// For data
const { readJSONFile, writeJSONFile } = require('../helpers/database');

// For auth
const { requireAuth, requireAdmin } = require('../middleware/auth');

// For validation
const { validateXXX } = require('../middleware/validation');

// For validators
const { validateEmail, validatePhone } = require('../helpers/validator');
```

---

## Endpoint Pattern Template

```javascript
// CREATE
router.post('/', requireAdmin, validateXXX, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const newItem = { id: Date.now(), ...req.body };
    items.push(newItem);
    if (writeJSONFile('items.json', items)) {
      logger.success('Created');
      response.created(res, 'Success', newItem);
    } else response.error(res, 'Failed', null, 500);
  } catch (e) {
    logger.error('Error', e);
    response.error(res, 'Server error', null, 500);
  }
});

// READ
router.get('/:id', (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return response.notFound(res, 'Item');
    logger.success('Retrieved');
    response.success(res, 'Success', item);
  } catch (e) {
    logger.error('Error', e);
    response.error(res, 'Server error', null, 500);
  }
});

// UPDATE
router.put('/:id', requireAdmin, validateXXX, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return response.notFound(res, 'Item');
    items[idx] = { ...items[idx], ...req.body, updatedAt: new Date() };
    if (writeJSONFile('items.json', items)) {
      logger.success('Updated');
      response.updated(res, 'Success', items[idx]);
    } else response.error(res, 'Failed', null, 500);
  } catch (e) {
    logger.error('Error', e);
    response.error(res, 'Server error', null, 500);
  }
});

// DELETE
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return response.notFound(res, 'Item');
    items.splice(idx, 1);
    if (writeJSONFile('items.json', items)) {
      logger.success('Deleted');
      response.deleted(res, 'Success');
    } else response.error(res, 'Failed', null, 500);
  } catch (e) {
    logger.error('Error', e);
    response.error(res, 'Server error', null, 500);
  }
});
```

---

## Validation Rules Reference

| Validator | Checks | Returns |
|-----------|--------|---------|
| `validateProductData` | name(3+), desc(10+), price(>0), category, stock(≥0) | 422 |
| `validateRegistrationData` | username(3-20), email, password(6+,A-Z/0-9), match | 422 |
| `validateAddressData` | label, fullName, phone, street, city, postal, country | 422 |
| `validateCartItem` | productId, quantity(1-999) | 422 |
| `validateOrderData` | shippingAddress, paymentMethod, products(array) | 422 |
| `validatePaymentData` | method(valid), amount(>0) | 422 |
| `validateSearchParams` | page(>0), limit(1-100) | 422 |

---

## Response Format Examples

### Success
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": { "id": 1, "name": "John" }
}
```

### Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": ["Email is required", "Password too weak"]
}
```

### Not Found
```json
{
  "status": "error",
  "message": "User not found",
  "errors": null
}
```

---

## HTTP Status Codes

| Status | Helper | Meaning |
|--------|--------|---------|
| 200 | `success()`, `updated()`, `deleted()` | OK |
| 201 | `created()` | Created |
| 400 | `error()` | Bad Request |
| 401 | `unauthorized()` | Not Authenticated |
| 403 | `forbidden()` | Not Authorized |
| 404 | `notFound()` | Not Found |
| 422 | `validationError()` | Validation Error |
| 500 | `error(..., 500)` | Server Error |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Check import paths - use `../helpers/` from routes |
| "Validation always passes" | Add middleware BEFORE handler: `router.post('/', validate, handler)` |
| "Response not consistent" | Use response helper instead of `res.json()` |
| "Duplicate code" | Use database helper instead of local readJSONFile |
| "Session not secure" | Set `NODE_ENV=production` |
| "Logging not showing" | Use correct logger method: `logger.success()` not `console.log()` |

---

## Environment Setup

```bash
# Development
npm run dev
# NODE_ENV will use development defaults

# Production
NODE_ENV=production npm start
# Secure cookies enabled, debug logging disabled

# Test
NODE_ENV=test npm test
```

---

**🎯 Keep this as reference while developing!**
