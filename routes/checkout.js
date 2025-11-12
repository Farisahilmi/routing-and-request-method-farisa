var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');

// GET checkout page - UPDATED dengan addresses
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to checkout');
  }

  const cartItems = req.session.cart || [];
  
  if (cartItems.length === 0) {
    return res.redirect('/cart?message=Your cart is empty');
  }

  // ✅ PERBAIKAN: Fetch addresses dari database
  const addresses = readJSONFile('addresses.json');
  const userAddresses = addresses.filter(addr => addr.userId === req.session.user.id);
  const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];

  // Calculate total
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  res.render('checkout', {
    title: 'Checkout',
    cartItems: cartItems,
    totalAmount: totalAmount,
    addresses: userAddresses,
    defaultAddress: defaultAddress,
    user: req.session.user
  });
});

// POST checkout process - UPDATED untuk handle address selection
router.post('/process', function(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to checkout'
    });
  }

  const { addressId, shippingAddress, paymentMethod } = req.body;
  const cartItems = req.session.cart || [];
  
  if (cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty'
    });
  }

  let finalShippingAddress = '';

  // ✅ PERBAIKAN: Handle address selection
  if (addressId && addressId !== 'new') {
    // Gunakan existing address
    const addresses = readJSONFile('addresses.json');
    const selectedAddress = addresses.find(addr => 
      addr.id === parseInt(addressId) && addr.userId === req.session.user.id
    );
    
    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: 'Selected address not found'
      });
    }

    // Format alamat untuk ditampilkan
    finalShippingAddress = `${selectedAddress.label}\n${selectedAddress.fullName}\n${selectedAddress.phone}\n${selectedAddress.street}\n${selectedAddress.city}${selectedAddress.state ? ', ' + selectedAddress.state : ''} ${selectedAddress.postalCode}\n${selectedAddress.country}`;
  } else if (shippingAddress) {
    // Gunakan alamat manual baru
    finalShippingAddress = shippingAddress;
  } else {
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
    userId: req.session.user.id,
    items: cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    })),
    totalAmount: totalAmount,
    shippingAddress: finalShippingAddress,
    paymentMethod: paymentMethod || 'cash',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Add to orders database
  ordersArray.push(newOrder);
  
  if (writeJSONFile('orders.json', ordersArray)) {
    // Clear cache dan cart
    clearCache('orders.json');
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