var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

// Import database helper untuk clear cache
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');

// GET Cart Count (for navbar)
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
    }).filter(item => item.product);

    // Calculate total
    const total = enrichedCart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    console.log(`💰 Cart total: $${total}`);

    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: enrichedCart,
      total: total,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('❌ Error loading cart page:', error);
    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: [],
      total: 0,
      user: req.session.user || null
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

// POST Checkout - FIXED ORDER ID GENERATION & CACHE CLEAR
router.post('/checkout', function(req, res, next) {
  try {
    // ✅ CEK USER LOGIN
    if (!req.session.user) {
      return res.json({ success: false, message: 'Please login to checkout' });
    }

    const { shippingAddress, paymentMethod } = req.body;
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    const orders = readJSONFile('orders.json');
    
    console.log(`💰 Checkout process started with ${cartItems.length} items for user: ${req.session.user.username}`);

    if (cartItems.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress) {
      return res.json({ success: false, message: 'Shipping address is required' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
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
      orderItems.push({
        productId: cartItem.productId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image
      });
      
      // Update product stock
      product.stock -= cartItem.quantity;
    }

    // ✅ FIXED: SIMPLE ORDER ID GENERATION - Start from 1
    let newOrderId = 1;
    
    if (orders.length > 0) {
      // Find the highest existing order ID
      const existingIds = orders.map(order => {
        const id = parseInt(order.id);
        return isNaN(id) ? 0 : id;
      }).filter(id => id > 0);
      
      if (existingIds.length > 0) {
        newOrderId = Math.max(...existingIds) + 1;
      } else {
        newOrderId = orders.length + 1;
      }
    }

    console.log(`🆕 Generated Order ID: ${newOrderId}`);
    console.log(`📊 Current orders in system: ${orders.length}`);

    // Create new order
    const newOrder = {
      id: newOrderId,
      userId: req.session.user.id,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: "pending",
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod || 'cash',
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
    
    // ✅ PERBAIKAN PENTING: Clear cache untuk orders.json dan products.json
    clearCache('orders.json');
    clearCache('products.json');
    
    // Clear cart
    writeJSONFile('cart.json', []);

    console.log(`✅ Checkout successful! Order #${newOrder.id} created for user ${req.session.user.username}`);
    console.log(`🔄 Cache cleared for orders and products`);

    // ✅ PERBAIKAN: Redirect langsung ke success page dengan parameter
    res.json({ 
      success: true, 
      message: 'Checkout successful! Order has been placed.',
      redirectUrl: `/cart/checkout/success?order_id=${newOrder.id}&total=${newOrder.totalAmount}`,
      orderId: newOrder.id,
      orderTotal: newOrder.totalAmount
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.json({ success: false, message: 'Error during checkout process' });
  }
});

// GET Checkout Page
router.get('/checkout', function(req, res, next) {
  try {
    // ✅ CEK USER LOGIN
    if (!req.session.user) {
      return res.redirect('/users/login?message=Please login to checkout');
    }

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    if (cartItems.length === 0) {
      return res.redirect('/cart?message=Your cart is empty');
    }

    // Enrich cart items with product details
    const enrichedCart = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || { 
          name: 'Product Not Found', 
          price: 0
        }
      };
    });

    // Calculate total
    const totalAmount = enrichedCart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.render('checkout', {
      title: 'Checkout',
      cartItems: enrichedCart,
      totalAmount: totalAmount,
      user: req.session.user
    });
  } catch (error) {
    console.error('❌ Error loading checkout page:', error);
    res.redirect('/cart?message=Error loading checkout page');
  }
});

// GET Checkout Success Page - PERBAIKAN
router.get('/checkout/success', function(req, res, next) {
  const { order_id, total } = req.query;
  
  console.log(`🎉 Checkout success page for order:`, { order_id, total });

  // ✅ PERBAIKAN: Pastikan order_id dan total ada
  if (!order_id || !total) {
    console.log('❌ Missing order_id or total parameters');
    return res.redirect('/cart?message=Invalid order confirmation');
  }

  res.render('checkout-success', { 
    title: 'Order Confirmed - Simple Store',
    orderId: order_id,
    orderTotal: total,
    user: req.session.user || null
  });
});

// CLEAR entire cart
router.delete('/clear', function(req, res, next) {
  try {
    writeJSONFile('cart.json', []);
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.json({ success: false, message: 'Error clearing cart' });
  }
});

// RESET ORDERS (Admin only) - NEW
router.post('/reset-orders', function(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.json({ 
      success: false, 
      message: 'Admin access required to reset orders' 
    });
  }

  try {
    // Reset orders to empty array
    if (writeJSONFile('orders.json', [])) {
      // Clear cache setelah reset orders
      clearCache('orders.json');
      console.log('🔄 Orders reset successfully by admin');
      res.json({ 
        success: true, 
        message: 'Orders reset successfully. Next order will start from ID 1.' 
      });
    } else {
      res.json({ success: false, message: 'Failed to reset orders' });
    }
  } catch (error) {
    console.error('❌ Reset orders error:', error);
    res.json({ success: false, message: 'Error resetting orders' });
  }
});

module.exports = router;