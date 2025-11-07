var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile } = require('../helpers/database');

// GET Checkout Success Page
router.get('/success', function(req, res, next) {
  const orderId = req.query.order_id;
  const orderTotal = req.query.total;
  
  if (!orderId) {
    return res.redirect('/orders');
  }

  res.render('checkout-success', {
    title: 'Order Success - Simple Store',
    orderId: orderId,
    orderTotal: parseFloat(orderTotal).toFixed(2)
  });
});

module.exports = router;