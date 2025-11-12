var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

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

// GET all products (API - JSON)
router.get('/', function(req, res, next) {
  try {
    const products = readJSONFile('products.json');
    
    if (!Array.isArray(products)) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid product data'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Products retrieved successfully',
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Products API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// GET single product (API - JSON)
router.get('/:id', function(req, res, next) {
  try {
    const { id } = req.params;
    const products = readJSONFile('products.json');
    
    if (!Array.isArray(products)) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid product data'
      });
    }
    
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Single Product API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

module.exports = router;