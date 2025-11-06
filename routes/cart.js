var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(__dirname, '../data', filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// GET Cart Page
router.get('/', function(req, res, next) {
  const cartItems = readJSONFile('cart.json');
  const products = readJSONFile('products.json');
  
  // Enrich cart items with product details
  const enrichedCart = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product: product || { name: 'Product Not Found', price: 0, image: '' }
    };
  });

  // GET Cart Count (for navbar)
router.get('/count', function(req, res, next) {
  const cartItems = readJSONFile('cart.json');
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  res.json({ count: totalItems });
});

  // Calculate total
  const total = enrichedCart.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  res.render('cart', { 
    title: 'Shopping Cart',
    cartItems: enrichedCart,
    total: total
  });
});

// POST Add to Cart
router.post('/add', function(req, res, next) {
  const { productId, quantity = 1 } = req.body;
  
  const cartItems = readJSONFile('cart.json');
  const products = readJSONFile('products.json');
  
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) {
    return res.json({ success: false, message: 'Product not found' });
  }

  // Check if product already in cart
  const existingItem = cartItems.find(item => item.productId === parseInt(productId));
  
  if (existingItem) {
    // Update quantity
    existingItem.quantity += parseInt(quantity);
  } else {
    // Add new item
    cartItems.push({
      id: cartItems.length > 0 ? Math.max(...cartItems.map(i => i.id)) + 1 : 1,
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      addedAt: new Date().toISOString()
    });
  }

  if (writeJSONFile('cart.json', cartItems)) {
    res.json({ success: true, message: 'Product added to cart' });
  } else {
    res.json({ success: false, message: 'Failed to add to cart' });
  }
});

// PUT Update Cart Item Quantity
router.put('/update/:id', function(req, res, next) {
  const { id } = req.params;
  const { quantity } = req.body;

  const cartItems = readJSONFile('cart.json');
  const item = cartItems.find(item => item.id === parseInt(id));
  
  if (!item) {
    return res.json({ success: false, message: 'Item not found in cart' });
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
    writeJSONFile('cart.json', updatedCart);
    return res.json({ success: true, message: 'Item removed from cart' });
  }

  item.quantity = parseInt(quantity);
  
  if (writeJSONFile('cart.json', cartItems)) {
    res.json({ success: true, message: 'Cart updated' });
  } else {
    res.json({ success: false, message: 'Failed to update cart' });
  }
});

// DELETE Remove from Cart
router.delete('/remove/:id', function(req, res, next) {
  const { id } = req.params;

  const cartItems = readJSONFile('cart.json');
  const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
  
  if (writeJSONFile('cart.json', updatedCart)) {
    res.json({ success: true, message: 'Item removed from cart' });
  } else {
    res.json({ success: false, message: 'Failed to remove item' });
  }
});

// POST Checkout
router.post('/checkout', function(req, res, next) {
  const cartItems = readJSONFile('cart.json');
  
  if (cartItems.length === 0) {
    return res.json({ success: false, message: 'Cart is empty' });
  }

  // For now, just clear the cart (simulate checkout)
  writeJSONFile('cart.json', []);
  
  res.json({ 
    success: true, 
    message: 'Checkout successful! Order has been placed.' 
  });
});

module.exports = router;