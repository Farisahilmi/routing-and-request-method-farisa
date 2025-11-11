var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile } = require('../helpers/database');

// GET checkout page
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to checkout');
  }

  const cartItems = req.session.cart || [];
  
  if (cartItems.length === 0) {
    return res.redirect('/cart?message=Your cart is empty');
  }

  // Calculate total
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  res.render('checkout', {
    title: 'Checkout',
    cartItems: cartItems,
    totalAmount: totalAmount,
    user: req.session.user
  });
});

// POST checkout process
router.post('/process', function(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to checkout'
    });
  }

  const { shippingAddress, paymentMethod } = req.body;
  const cartItems = req.session.cart || [];
  
  if (cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty'
    });
  }

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }

  // Calculate total
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Create order
  const ordersArray = readJSONFile('orders.json');
  
  // Generate order ID
  const orderId = ordersArray.length > 0 
    ? String(Math.max(...ordersArray.map(o => parseInt(o.id || 0))) + 1)
    : '1';

  const newOrder = {
    id: orderId,
    userId: req.session.user.id, // PASTIKAN ini user yang login
    items: cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    })),
    totalAmount: totalAmount,
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod || 'cash',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Add to orders database
  ordersArray.push(newOrder);
  
  if (writeJSONFile('orders.json', ordersArray)) {
    // Clear cart after successful order
    req.session.cart = [];
    
    res.json({
      success: true,
      message: 'Order placed successfully!',
      orderId: orderId
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again.'
    });
  }
});

// GET order confirmation
router.get('/confirmation/:orderId', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login');
  }

  const { orderId } = req.params;
  const ordersArray = readJSONFile('orders.json');
  
  const order = ordersArray.find(order => order.id === orderId);
  
  if (!order) {
    return res.status(404).render('error', {
      message: 'Order not found',
      user: req.session.user
    });
  }

  // Ensure user can only view their own orders
  if (order.userId !== req.session.user.id) {
    return res.status(403).render('error', {
      message: 'Access denied',
      user: req.session.user
    });
  }

  res.render('order-confirmation', {
    title: 'Order Confirmation',
    order: order,
    user: req.session.user
  });
});

module.exports = router;