var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile } = require('../helpers/database');

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
const STATUS_LABELS = {
  pending: 'Pending Confirmation',
  processing: 'Processing Order',
  shipped: 'Shipped to Carrier',
  delivered: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const ensureArray = (value) => Array.isArray(value) ? value : [];

const normalizeTracking = (order) => {
  const tracking = ensureArray(order.tracking);
  if (tracking.length > 0) {
    return tracking.map((event, index) => ({
      id: event.id || index + 1,
      status: event.status || order.status || 'pending',
      label: event.label || STATUS_LABELS[event.status] || 'Status Update',
      note: event.note || '',
      timestamp: event.timestamp || order.updatedAt || order.createdAt || new Date().toISOString(),
      actor: event.actor || 'system'
    }));
  }

  const baseTimestamp = order.createdAt || new Date().toISOString();

  return [{
    id: 1,
    status: order.status || 'pending',
    label: STATUS_LABELS.pending,
    note: 'Order created and awaiting confirmation.',
    timestamp: baseTimestamp,
    actor: 'system'
  }];
};

const getNextTrackingId = (tracking) => {
  const ids = tracking
    .map(event => parseInt(event.id, 10))
    .filter(id => !Number.isNaN(id));
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
};

const appendTrackingEvent = (tracking, { status, note, actor, label }) => {
  const normalizedTracking = ensureArray(tracking).map((event, index) => ({
    id: event.id || index + 1,
    status: event.status,
    label: event.label || STATUS_LABELS[event.status] || 'Status Update',
    note: event.note || '',
    timestamp: event.timestamp || new Date().toISOString(),
    actor: event.actor || 'system'
  }));

  const eventStatus = status && STATUS_OPTIONS.includes(status) ? status : 'pending';
  const eventLabel = label || STATUS_LABELS[eventStatus] || 'Status Update';

  normalizedTracking.push({
    id: getNextTrackingId(normalizedTracking),
    status: eventStatus,
    label: eventLabel,
    note: note || '',
    timestamp: new Date().toISOString(),
    actor: actor || 'system'
  });

  return normalizedTracking;
};

/* GET orders listing. */
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to view your orders');
  }

  const ordersArray = readJSONFile('orders.json');
  const usersArray = readJSONFile('users.json');
  const isAdmin = req.session.user.role === 'admin';
  
  const relevantOrders = isAdmin
    ? ordersArray
    : ordersArray.filter(order => order.userId == req.session.user.id);
  
  const ordersWithUserData = relevantOrders.map(order => {
    const user = usersArray.find(u => u.id == order.userId || u.id?.toString() === order.userId?.toString());
    const orderItems = order.items || order.products || [];
    const tracking = normalizeTracking(order);
    
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
      },
      userSummary: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      } : null,
      tracking
    };
  });

  const pageTitle = isAdmin ? 'All Orders' : 'My Orders';

  res.render('orders', {
    title: pageTitle,
    orders: ordersWithUserData,
    user: req.session.user,
    isAdmin,
    statusOptions: STATUS_OPTIONS,
    statusLabels: STATUS_LABELS
  });
});

// GET order details - FIX ERROR RENDERING
router.get('/:id', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/users/login?message=Please login to view order details');
  }

  const { id } = req.params;
  const ordersArray = readJSONFile('orders.json');
  const usersArray = readJSONFile('users.json');
  
  // Convert id to number for comparison
  const orderId = parseInt(id);
  const order = ordersArray.find(order => parseInt(order.id) === orderId);
  
  if (!order) {
    return res.status(404).render('error', {
      title: 'Order Not Found',
      message: 'Order not found',
      error: { status: 404 }, // ✅ TAMBAH INI
      user: req.session.user
    });
  }

  // Check authorization
  const currentUserId = req.session.user.id.toString();
  const orderUserId = order.userId.toString();
  
  if (orderUserId !== currentUserId && req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'Access denied. You can only view your own orders.',
      error: { status: 403 }, // ✅ TAMBAH INI
      user: req.session.user
    });
  }

  const user = usersArray.find(u => u.id.toString() === orderUserId);
  
  // Handle both items and products structure
  const orderItems = order.items || order.products || [];
  
  res.render('order-details', {
    title: `Order #${order.id} Details`,
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

  const createdAt = new Date().toISOString();

  const newOrder = {
    id: orderId,
    userId: userId,
    items: items,
    totalAmount: totalAmount,
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod || 'cash',
    status: 'pending',
    createdAt,
    tracking: [{
      id: 1,
      status: 'pending',
      label: STATUS_LABELS.pending,
      note: 'Order created and awaiting confirmation.',
      timestamp: createdAt,
      actor: 'system'
    }]
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

  const order = ordersArray[orderIndex];
  const isAdmin = req.session.user.role === 'admin';
  const isOrderOwner = order.userId == req.session.user.id || order.userId?.toString() === req.session.user.id?.toString();

  if (!isOrderOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only update your own orders."
    });
  }

  if (!STATUS_OPTIONS.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be one of: " + STATUS_OPTIONS.join(', ')
    });
  }

  if (!isAdmin) {
    const customerAllowedStatuses = ['cancelled', 'completed'];
    if (!customerAllowedStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: "Customers can only mark orders as completed or cancelled."
      });
    }

    // Additional guards for customer actions
    if (status === 'cancelled' && !['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "You can only cancel orders that are pending or processing."
      });
    }

    if (status === 'completed' && order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be marked as completed."
      });
    }
  }

  if (order.status === status) {
    return res.json({
      success: true,
      message: `Order status already set to ${status}`
    });
  }

  const trackingBeforeUpdate = normalizeTracking(order);
  const actorLabel = isAdmin ? 'admin' : 'customer';
  const defaultNote = isAdmin
    ? `Admin updated the order status to ${STATUS_LABELS[status] || status}.`
    : `Customer confirmed the order as ${STATUS_LABELS[status] || status}.`;
  const note = req.body && typeof req.body.note === 'string' && req.body.note.trim().length > 0
    ? req.body.note.trim()
    : defaultNote;

  const tracking = appendTrackingEvent(trackingBeforeUpdate, {
    status,
    note,
    actor: actorLabel
  });

  const updatedOrder = {
    ...order,
    status: status,
    updatedAt: new Date().toISOString(),
    tracking
  };

  if (status === 'completed') {
    updatedOrder.completedAt = new Date().toISOString();
  }

  ordersArray[orderIndex] = updatedOrder;

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

// Append tracking update (admin only)
router.post('/:id/tracking', function(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please login to add tracking updates"
    });
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Only admins can add tracking updates"
    });
  }

  const { id } = req.params;
  const { status, note } = req.body || {};

  const ordersArray = readJSONFile('orders.json');
  const orderIndex = ordersArray.findIndex(order => order.id == id);

  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  const order = ordersArray[orderIndex];
  const tracking = normalizeTracking(order);

  const updateStatus = status && STATUS_OPTIONS.includes(status) ? status : order.status;
  const eventNote = typeof note === 'string' && note.trim().length > 0
    ? note.trim()
    : STATUS_LABELS[updateStatus] || 'Status Update';

  const updatedTracking = appendTrackingEvent(tracking, {
    status: updateStatus,
    note: eventNote,
    actor: 'admin'
  });

  const updatedOrder = {
    ...order,
    tracking: updatedTracking,
    updatedAt: new Date().toISOString()
  };

  if (status && STATUS_OPTIONS.includes(status)) {
    updatedOrder.status = updateStatus;
    if (updateStatus === 'completed') {
      updatedOrder.completedAt = new Date().toISOString();
    }
  }

  ordersArray[orderIndex] = updatedOrder;

  if (writeJSONFile('orders.json', ordersArray)) {
    res.json({
      success: true,
      message: "Tracking update added successfully",
      tracking: updatedTracking
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to add tracking update"
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