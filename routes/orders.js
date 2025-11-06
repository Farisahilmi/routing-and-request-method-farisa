var express = require('express');
var router = express.Router();
const fs = require('fs');

// GET all orders (HTML)
router.get('/', function(req, res, next) {
  const orders = fs.readFileSync('data/orders.json', 'utf8');
  const ordersArray = JSON.parse(orders);
  const products = fs.readFileSync('data/products.json', 'utf8');
  const productsArray = JSON.parse(products);
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  
  // Enrich order data
  const enrichedOrders = ordersArray.map(order => {
    const user = usersArray.find(u => u.id === order.userId.toString());
    const orderProducts = order.products.map(op => {
      const product = productsArray.find(p => p.id === op.productId);
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
  const orders = fs.readFileSync('data/orders.json', 'utf8');
  const ordersArray = JSON.parse(orders);
  const products = fs.readFileSync('data/products.json', 'utf8');
  const productsArray = JSON.parse(products);
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  
  const order = ordersArray.find(o => o.id === parseInt(id));
  
  if (!order) {
    return res.status(404).render('error', { 
      message: 'Order not found' 
    });
  }
  
  const user = usersArray.find(u => u.id === order.userId.toString());
  const orderProducts = order.products.map(op => {
    const product = productsArray.find(p => p.id === op.productId);
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

module.exports = router;