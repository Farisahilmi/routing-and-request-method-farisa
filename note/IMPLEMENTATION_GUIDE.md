# 📖 IMPLEMENTATION GUIDE - NEW HELPERS & MIDDLEWARE

## Overview
Panduan lengkap cara menggunakan helpers dan middleware baru yang telah dibuat.

---

## 1. Response Helper (`helpers/response.js`)

### Penggunaan Basic

```javascript
const response = require('../helpers/response');

// Success response
response.success(res, 'Data retrieved', { users: [...] });

// Error response
response.error(res, 'Invalid input', ['Field required']);

// Created resource (201)
response.created(res, 'User created', newUser);

// Updated resource
response.updated(res, 'User updated', updatedUser);

// Deleted resource
response.deleted(res, 'User removed');
```

### Semua Available Methods

| Method | Status | Use Case |
|--------|--------|----------|
| `success(res, message, data, statusCode)` | 200 | General success |
| `error(res, message, errors, statusCode)` | 400 | General error |
| `created(res, message, data)` | 201 | Create resource |
| `updated(res, message, data)` | 200 | Update resource |
| `deleted(res, message)` | 200 | Delete resource |
| `unauthorized(res, message)` | 401 | Auth required |
| `forbidden(res, message)` | 403 | Access denied |
| `notFound(res, resource)` | 404 | Resource not found |
| `validationError(res, errors)` | 422 | Validation failed |

### Contoh Real Usage

```javascript
const response = require('../helpers/response');
const logger = require('../helpers/logger');

// POST Create Product
router.post('/products', requireAdmin, validateProductData, (req, res) => {
  try {
    const { name, price } = req.body;
    
    // Validation sudah dilakukan di middleware
    const products = readJSONFile('products.json');
    
    const newProduct = { id: Date.now(), name, price };
    products.push(newProduct);
    
    if (writeJSONFile('products.json', products)) {
      logger.success('Product created', { productId: newProduct.id });
      response.created(res, 'Product created successfully', newProduct);
    } else {
      logger.error('Failed to create product');
      response.error(res, 'Failed to create product', null, 500);
    }
  } catch (error) {
    logger.error('Error creating product', error);
    response.error(res, 'Server error', null, 500);
  }
});

// DELETE Resource
router.delete('/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return response.validationError(res, ['Product ID required']);
  }
  
  const products = readJSONFile('products.json');
  const index = products.findIndex(p => p.id === parseInt(id));
  
  if (index === -1) {
    return response.notFound(res, 'Product');
  }
  
  products.splice(index, 1);
  
  if (writeJSONFile('products.json', products)) {
    logger.success('Product deleted', { productId: id });
    response.deleted(res, 'Product deleted successfully');
  } else {
    response.error(res, 'Failed to delete product', null, 500);
  }
});
```

### Response Format Output

```javascript
// Success dengan data
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": [{ id: 1, name: "John" }]
}

// Success tanpa data
{
  "status": "success",
  "message": "Product deleted successfully",
  "data": null
}

// Error dengan details
{
  "status": "error",
  "message": "Validation failed",
  "errors": ["Name is required", "Price must be > 0"]
}

// Error simple
{
  "status": "error",
  "message": "User not found",
  "errors": null
}
```

---

## 2. Validation Middleware (`middleware/validation.js`)

### Available Middleware

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
```

### Penggunaan dengan Routes

```javascript
const express = require('express');
const router = express.Router();
const { validateProductData, validateRegistrationData } = require('../middleware/validation');

// Contoh 1: Product Validation
router.post('/products', 
  requireAdmin,
  validateProductData,    // ← Middleware validation
  (req, res) => {
    // req.body sudah valid di sini
    const { name, description, price, category, stock } = req.body;
    // ... process
  }
);

// Contoh 2: Registration Validation
router.post('/register',
  validateRegistrationData,  // ← Validation middleware
  async (req, res) => {
    const { username, email, password } = req.body;
    // ... create user
  }
);

// Contoh 3: Cart Validation
router.post('/cart/add',
  validateCartItem,  // ← Checks productId & quantity
  (req, res) => {
    const { productId, quantity } = req.body;
    // ... add to cart
  }
);
```

### Validation Rules Explained

#### 1. `validateProductData`
**Checks:**
- Name minimum 3 characters
- Description minimum 10 characters
- Price is positive number
- Category provided
- Stock is non-negative integer

**Returns:** 422 error jika invalid

```javascript
// ❌ Invalid
{ name: "AB", price: -10 }

// ✅ Valid
{ name: "Phone", description: "Great phone", price: 99.99, category: "Electronics", stock: 50 }
```

#### 2. `validateRegistrationData`
**Checks:**
- Username: 3-20 chars, alphanumeric + underscore
- Email: valid format
- Password: min 6 chars + uppercase/number
- Passwords match

**Returns:** 422 error jika invalid

```javascript
// ❌ Invalid password
{ password: "abc", confirmPassword: "abc" }  // < 6 chars

// ✅ Valid
{ password: "SecurePass123", confirmPassword: "SecurePass123" }
```

#### 3. `validateCartItem`
**Checks:**
- ProductId required
- Quantity: 1-999

**Returns:** 422 error jika invalid

```javascript
// ❌ Invalid
{ productId: null, quantity: 0 }

// ✅ Valid
{ productId: 5, quantity: 2 }
```

#### 4. `validateAddressData`
**Checks:**
- All required fields present
- Phone format valid
- Label < 50 chars
- Full name < 100 chars

#### 5. `validateOrderData`
**Checks:**
- Shipping address provided
- Payment method provided
- Products array not empty

#### 6. `validatePaymentData`
**Checks:**
- Payment method valid (credit_card, bank_transfer, digital_wallet)
- Amount > 0

#### 7. `validateSearchParams`
**Checks:**
- Page is positive number
- Limit: 1-100
- Sort parameter valid

### Error Response Example

```javascript
// Invalid product submission
POST /admin/products
{
  "name": "AB",
  "description": "Short",
  "price": -10,
  "category": "",
  "stock": "invalid"
}

// Response (422)
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "Product name must be at least 3 characters",
    "Product description must be at least 10 characters",
    "Product price must be a positive number",
    "Product category is required",
    "Product stock must be a non-negative integer"
  ]
}
```

---

## 3. Updated Middleware - Auth (`middleware/auth.js`)

### Perubahan
- ✅ Removed duplicate file I/O functions
- ✅ Now uses `helpers/database.js` untuk file operations
- ✅ Cleaner, more maintainable code

### Usage Tetap Sama

```javascript
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Protect route - any authenticated user
router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Protect route - only admin
router.get('/admin/users', requireAdmin, (req, res) => {
  // ... admin only code
});
```

---

## 4. Session Security Updates (`app.js`)

### Perubahan
```javascript
// ❌ OLD (tidak aman)
cookie: { secure: false }

// ✅ NEW (production-ready)
const isProduction = process.env.NODE_ENV === 'production';
cookie: {
  secure: isProduction,    // HTTPS only in production
  httpOnly: true,          // XSS protection
  sameSite: 'strict'       // CSRF protection
}
```

### Testing
```bash
# Development
NODE_ENV=development npm start
# → secure: false, httpOnly: true, sameSite: strict

# Production
NODE_ENV=production npm start
# → secure: true, httpOnly: true, sameSite: strict
```

---

## 5. Quick Integration Checklist

### For New Routes/Endpoints:

1. **Import helpers & middleware**
   ```javascript
   const response = require('../helpers/response');
   const logger = require('../helpers/logger');
   const { readJSONFile, writeJSONFile } = require('../helpers/database');
   const { validateXXX } = require('../middleware/validation');
   ```

2. **Use validation middleware**
   ```javascript
   router.post('/endpoint', requireAuth, validateXXX, handler);
   ```

3. **Use response helper**
   ```javascript
   response.success(res, 'Message', data);
   response.error(res, 'Error message', errors);
   ```

4. **Add logging**
   ```javascript
   logger.success('Operation completed', { details });
   logger.error('Operation failed', error);
   ```

### Checklist Template
```javascript
// ✅ New endpoint template
const express = require('express');
const router = express.Router();
const response = require('../helpers/response');
const logger = require('../helpers/logger');
const { readJSONFile, writeJSONFile } = require('../helpers/database');
const { requireAdmin } = require('../middleware/auth');
const { validateProductData } = require('../middleware/validation');

router.post('/', requireAdmin, validateProductData, (req, res) => {
  try {
    const data = req.body;
    
    // Logic here
    
    logger.success('Success message');
    response.created(res, 'Resource created', result);
  } catch (error) {
    logger.error('Error message', error);
    response.error(res, 'Failed operation', null, 500);
  }
});

module.exports = router;
```

---

## 6. Common Patterns

### Pattern 1: Create Resource
```javascript
router.post('/', requireAdmin, validateData, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const newItem = { id: Date.now(), ...req.body };
    items.push(newItem);
    
    if (writeJSONFile('items.json', items)) {
      logger.success('Item created', { id: newItem.id });
      response.created(res, 'Item created successfully', newItem);
    } else {
      response.error(res, 'Failed to create item', null, 500);
    }
  } catch (error) {
    logger.error('Create error', error);
    response.error(res, 'Server error', null, 500);
  }
});
```

### Pattern 2: Read Resource
```javascript
router.get('/:id', (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const item = items.find(i => i.id === parseInt(req.params.id));
    
    if (!item) {
      return response.notFound(res, 'Item');
    }
    
    logger.success('Item retrieved');
    response.success(res, 'Item retrieved', item);
  } catch (error) {
    logger.error('Read error', error);
    response.error(res, 'Failed to retrieve item', null, 500);
  }
});
```

### Pattern 3: Update Resource
```javascript
router.put('/:id', requireAdmin, validateData, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const index = items.findIndex(i => i.id === parseInt(req.params.id));
    
    if (index === -1) {
      return response.notFound(res, 'Item');
    }
    
    items[index] = { ...items[index], ...req.body, updatedAt: new Date() };
    
    if (writeJSONFile('items.json', items)) {
      logger.success('Item updated', { id: items[index].id });
      response.updated(res, 'Item updated successfully', items[index]);
    } else {
      response.error(res, 'Failed to update item', null, 500);
    }
  } catch (error) {
    logger.error('Update error', error);
    response.error(res, 'Server error', null, 500);
  }
});
```

### Pattern 4: Delete Resource
```javascript
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const items = readJSONFile('items.json');
    const index = items.findIndex(i => i.id === parseInt(req.params.id));
    
    if (index === -1) {
      return response.notFound(res, 'Item');
    }
    
    items.splice(index, 1);
    
    if (writeJSONFile('items.json', items)) {
      logger.success('Item deleted', { id: req.params.id });
      response.deleted(res, 'Item deleted successfully');
    } else {
      response.error(res, 'Failed to delete item', null, 500);
    }
  } catch (error) {
    logger.error('Delete error', error);
    response.error(res, 'Server error', null, 500);
  }
});
```

---

## 7. Testing Your New Endpoints

### Using Postman/cURL

```bash
# Create with validation
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name",
    "description": "Product Description",
    "price": 99.99,
    "category": "Electronics",
    "stock": 10
  }'

# Invalid data - returns 422
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AB",
    "description": "Short"
  }'
```

---

**End of Implementation Guide**
