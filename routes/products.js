var express = require('express');
var router = express.Router();
const fs = require('fs');

// GET all products (HTML)
router.get('/', function(req, res, next) {
  const products = fs.readFileSync('data/products.json', 'utf8');
  const productsArray = JSON.parse(products);
  res.render('products', { 
    title: 'All Products', 
    products: productsArray 
  });
});

// GET single product (HTML)
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const products = fs.readFileSync('data/products.json', 'utf8');
  const productsArray = JSON.parse(products);
  const product = productsArray.find(p => p.id === parseInt(id));
  
  if (!product) {
    return res.status(404).render('error', { 
      message: 'Product not found' 
    });
  }
  
  res.render('product-detail', { 
    title: product.name, 
    product: product 
  });
});

module.exports = router;