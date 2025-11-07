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

// GET all orders (HTML)
router.get('/', function(req, res, next) {
  const orders = readJSONFile('orders.json');
  const products = readJSONFile('products.json');
  const users = readJSONFile('users.json');
  
  // Enrich order data
  const enrichedOrders = orders.map(order => {
    const user = users.find(u => u.id === order.userId.toString());
    const orderProducts = order.products.map(op => {
      const product = products.find(p => p.id === op.productId);
      return { ...op, productName: product ? product.name : 'Unknown Product' };
    });
    
    return {
      ...order,
      userName: user ? user.username : 'Unknown User',
      products: orderProducts
    };
  });
  
  res.render('orders', { 
    title: 'All Orders', 
    orders: enrichedOrders 
  });
});

// GET single order (HTML)
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const orders = readJSONFile('orders.json');
  const products = readJSONFile('products.json');
  const users = readJSONFile('users.json');
  
  const order = orders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).render('error', { 
      message: 'Order not found' 
    });
  }
  
  const user = users.find(u => u.id === order.userId.toString());
  const orderProducts = order.products.map(op => {
    const product = products.find(p => p.id === op.productId);
    return { 
      ...op, 
      productName: product ? product.name : 'Unknown Product',
      productImage: product ? product.image : '/images/default.jpg'
    };
  });
  
  const enrichedOrder = {
    ...order,
    userName: user ? user.username : 'Unknown User',
    userEmail: user ? user.email : 'Unknown Email',
    products: orderProducts
  };
  
  res.render('order-detail', { 
    title: `Order #${order.id}`, 
    order: enrichedOrder 
  });
});

// ✅ NEW: DELETE Order
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  console.log('🗑️ Deleting order:', id);
  
  const orders = readJSONFile('orders.json');
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Order not found' 
    });
  }
  
  // Remove order from array
  const deletedOrder = orders.splice(orderIndex, 1)[0];
  
  if (writeJSONFile('orders.json', orders)) {
    console.log('✅ Order deleted successfully:', id);
    res.json({ 
      success: true, 
      message: 'Order deleted successfully',
      deletedOrder: deletedOrder
    });
  } else {
    console.log('❌ Failed to delete order:', id);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete order' 
    });
  }
});

// ✅ NEW: UPDATE Order Status
router.put('/:id/status', function(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status' 
    });
  }
  
  const orders = readJSONFile('orders.json');
  const order = orders.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).json({ 
      success: false, 
      message: 'Order not found' 
    });
  }
  
  // Update status
  order.status = status;
  order.updatedAt = new Date().toISOString();
  
  if (writeJSONFile('orders.json', orders)) {
    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order: order
    });
  } else {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order status' 
    });
  }
});

module.exports = router;