var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile } = require('../helpers/database');

/* GET orders listing. */
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to view your orders');
  }

  const ordersArray = readJSONFile('orders.json');
  const usersArray = readJSONFile('users.json');
  
  const userOrders = ordersArray.filter(order => order.userId == req.session.user.id);
  
  const ordersWithUserData = userOrders.map(order => {
    const user = usersArray.find(u => u.id == order.userId);
    const orderItems = order.items || order.products || [];
    
    return {
      ...order,
      items: orderItems,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email
      } : {
        username: req.session.user.username,
        email: req.session.user.email
      }
    };
  });

  res.render('orders', {
    title: 'My Orders',
    orders: ordersWithUserData,
    user: req.session.user
  });
});

// GET order details
router.get('/:id', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to view order details');
  }

  const { id } = req.params;
  const ordersArray = readJSONFile('orders.json');
  const usersArray = readJSONFile('users.json');
  
  const order = ordersArray.find(order => order.id == id);
  
  if (!order) {
    return res.status(404).render('error', {
      message: 'Order not found',
      user: req.session.user
    });
  }

  if (order.userId != req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      message: 'Access denied. You can only view your own orders.',
      user: req.session.user
    });
  }

  const user = usersArray.find(u => u.id == order.userId);
  const orderItems = order.items || order.products || [];
  
  res.render('order-details', {
    title: 'Order Details',
    order: {
      ...order,
      items: orderItems,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email
      } : {
        username: req.session.user.username,
        email: req.session.user.email
      }
    },
    user: req.session.user
  });
});

// GET orders in JSON format
router.get('/api/json', function(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Please login to view orders"
    });
  }

  const ordersArray = readJSONFile('orders.json');
  const userOrders = ordersArray.filter(order => order.userId == req.session.user.id);
  
  res.json({
    status: "success",
    message: "Orders found",
    orders: userOrders
  });
});

// CREATE order using POST method
router.post('/', function(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      message: "Please login to create order"
    });
  }

  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
  const userId = req.session.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Order items are required"
    });
  }

  const ordersArray = readJSONFile('orders.json');
  
  const orderId = ordersArray.length > 0 
    ? Math.max(...ordersArray.map(o => parseInt(o.id))) + 1
    : 1;

  const newOrder = {
    id: orderId,
    userId: userId,
    items: items,
    totalAmount: totalAmount,
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod || 'cash',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  ordersArray.push(newOrder);

  if (writeJSONFile('orders.json', ordersArray)) {
    res.json({
      status: "success",
      message: "Order created successfully",
      orderId: orderId
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Failed to create order"
    });
  }
});

// UPDATE order status using PUT method
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please login to update order"
    });
  }

  const ordersArray = readJSONFile('orders.json');
  const orderIndex = ordersArray.findIndex(order => order.id == id);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  if (ordersArray[orderIndex].userId != req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only update your own orders."
    });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be one of: " + validStatuses.join(', ')
    });
  }

  ordersArray[orderIndex] = {
    ...ordersArray[orderIndex],
    status: status,
    updatedAt: new Date().toISOString()
  };

  if (writeJSONFile('orders.json', ordersArray)) {
    res.json({
      success: true,
      message: "Order status updated successfully"
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
});

// DELETE order using DELETE method
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please login to delete order"
    });
  }

  const ordersArray = readJSONFile('orders.json');
  const orderIndex = ordersArray.findIndex(order => order.id == id);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  if (ordersArray[orderIndex].userId != req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only delete your own orders."
    });
  }
  
  ordersArray.splice(orderIndex, 1);
  
  if (writeJSONFile('orders.json', ordersArray)) {
    res.json({
      success: true,
      message: "Order deleted successfully"
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to delete order"
    });
  }
});

module.exports = router;