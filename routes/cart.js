var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(__dirname, '../data', filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ ${filename} saved successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error.message);
    return false;
  }
}

// GET Cart Count (for navbar) - HARUS DI ATAS
router.get('/count', function(req, res, next) {
  const cartItems = readJSONFile('cart.json');
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  res.json({ count: totalItems });
});

// GET Cart Page
router.get('/', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    console.log(`🛒 Loading cart with ${cartItems.length} items`);

    // Enrich cart items with product details
    const enrichedCart = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        console.log(`❌ Product not found for cart item: ${item.productId}`);
      }
      return {
        ...item,
        product: product || { 
          id: item.productId,
          name: 'Product Not Found', 
          price: 0, 
          image: '/images/default.jpg',
          stock: 0
        }
      };
    }).filter(item => item.product); // Remove items with invalid products

    // Calculate total
    const total = enrichedCart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    console.log(`💰 Cart total: $${total}`);

    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: enrichedCart,
      total: total
    });
  } catch (error) {
    console.error('❌ Error loading cart page:', error);
    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: [],
      total: 0
    });
  }
});

// POST Add to Cart
router.post('/add', function(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    
    console.log(`🛒 Add to cart request:`, { productId, quantity });

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    // Check stock
    if (product.stock < parseInt(quantity)) {
      return res.json({ success: false, message: 'Not enough stock available' });
    }

    // Check if product already in cart
    const existingItem = cartItems.find(item => item.productId === parseInt(productId));
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + parseInt(quantity);
      if (newQuantity > product.stock) {
        return res.json({ success: false, message: 'Not enough stock available' });
      }
      existingItem.quantity = newQuantity;
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
      // Update cart count for response
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      res.json({ 
        success: true, 
        message: 'Product added to cart',
        cartCount: totalItems 
      });
    } else {
      res.json({ success: false, message: 'Failed to add to cart' });
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.json({ success: false, message: 'Error adding to cart' });
  }
});

// PUT Update Cart Item Quantity
router.put('/update/:id', function(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log(`✏️ Update cart item:`, { id, quantity });

    const cartItems = readJSONFile('cart.json');
    const item = cartItems.find(item => item.id === parseInt(id));
    
    if (!item) {
      return res.json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
      writeJSONFile('cart.json', updatedCart);
      return res.json({ 
        success: true, 
        message: 'Item removed from cart',
        cartCount: updatedCart.reduce((sum, item) => sum + item.quantity, 0)
      });
    }

    item.quantity = parseInt(quantity);
    
    if (writeJSONFile('cart.json', cartItems)) {
      res.json({ 
        success: true, 
        message: 'Cart updated',
        cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });
    } else {
      res.json({ success: false, message: 'Failed to update cart' });
    }
  } catch (error) {
    console.error('❌ Error updating cart:', error);
    res.json({ success: false, message: 'Error updating cart' });
  }
});

// DELETE Remove from Cart
router.delete('/remove/:id', function(req, res, next) {
  try {
    const { id } = req.params;

    console.log(`🗑️ Remove cart item:`, { id });

    const cartItems = readJSONFile('cart.json');
    const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
    
    if (writeJSONFile('cart.json', updatedCart)) {
      res.json({ 
        success: true, 
        message: 'Item removed from cart',
        cartCount: updatedCart.reduce((sum, item) => sum + item.quantity, 0)
      });
    } else {
      res.json({ success: false, message: 'Failed to remove item' });
    }
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    res.json({ success: false, message: 'Error removing item from cart' });
  }
});

// POST Checkout - CREATE REAL ORDER
router.post('/checkout', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    const orders = readJSONFile('orders.json');
    const users = readJSONFile('users.json');
    
    console.log(`💰 Checkout process started with ${cartItems.length} items`);

    if (cartItems.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderProducts = [];
    
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        return res.json({ success: false, message: `Product ${cartItem.productId} not found` });
      }
      
      if (product.stock < cartItem.quantity) {
        return res.json({ 
          success: false, 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}` 
        });
      }
      
      totalAmount += product.price * cartItem.quantity;
      orderProducts.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: product.price
      });
      
      // Update product stock
      product.stock -= cartItem.quantity;
    }

    // Create new order
    const newOrder = {
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      userId: "2", // Default user for demo (John Customer)
      products: orderProducts,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: "processing", // Default status
      shippingAddress: "123 Main St, Jakarta, Indonesia", // Default address
      createdAt: new Date().toISOString()
    };

    // Save order
    orders.push(newOrder);
    
    // Update products stock
    if (!writeJSONFile('products.json', products)) {
      return res.json({ success: false, message: 'Failed to update product stock' });
    }
    
    // Save orders
    if (!writeJSONFile('orders.json', orders)) {
      return res.json({ success: false, message: 'Failed to create order' });
    }
    
    // Clear cart
    writeJSONFile('cart.json', []);

    console.log(`✅ Checkout successful! Order #${newOrder.id} created`);

    res.json({ 
      success: true, 
      message: 'Checkout successful! Order has been placed.',
      orderId: newOrder.id,
      orderTotal: newOrder.totalAmount
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.json({ success: false, message: 'Error during checkout process' });
  }
});

// GET Checkout Success Page
router.get('/checkout/success', function(req, res, next) {
  const { order_id, total } = req.query;
  
  console.log(`🎉 Checkout success page for order:`, { order_id, total });

  res.render('checkout-success', { 
    title: 'Order Confirmed - Simple Store',
    orderId: order_id || 'N/A',
    orderTotal: total || '0.00'
  });
});

module.exports = router;