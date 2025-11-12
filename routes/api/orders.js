var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../../middleware/auth');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../../data', filename);
  
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
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

// GET all orders (API - JSON) - PROTECTED
router.get('/', requireAuth, function(req, res, next) {
  try {
    const orders = readJSONFile('orders.json');
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    
    // If not admin, only return user's own orders
    const userOrders = isAdmin 
      ? orders 
      : orders.filter(order => order.userId == req.session.user.id || order.userId?.toString() === req.session.user.id?.toString());
    
    res.json({
      status: 'success',
      message: 'Orders retrieved successfully',
      data: userOrders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// GET single order (API - JSON) - PROTECTED
router.get('/:id', requireAuth, function(req, res, next) {
  try {
    const { id } = req.params;
    const orders = readJSONFile('orders.json');
    const order = orders.find(o => o.id === parseInt(id));
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check authorization - only admin or order owner can view
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    const isOwner = order.userId == req.session.user.id || order.userId?.toString() === req.session.user.id?.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied - You can only view your own orders'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order'
    });
  }
});

module.exports = router;