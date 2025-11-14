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

// GET all products (API - JSON) WITH SEARCH & FILTER
router.get('/', function(req, res, next) {
  try {
    let products = readJSONFile('products.json');
    
    if (!Array.isArray(products)) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid product data'
      });
    }
    
    // Get query parameters
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const inStock = req.query.inStock === 'true';
    const sort = req.query.sort || 'newest';
    
    // Apply search filter
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply category filter
    if (category) {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    
    // Apply price filter
    if (minPrice !== null) {
      products = products.filter(p => p.price >= minPrice);
    }
    if (maxPrice !== null) {
      products = products.filter(p => p.price <= maxPrice);
    }
    
    // Apply stock filter
    if (inStock) {
      products = products.filter(p => p.stock > 0);
    }
    
    // Apply sorting
    switch(sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        products.sort((a, b) => b.id - a.id);
        break;
    }
    
    res.json({
      status: 'success',
      message: 'Products retrieved successfully',
      count: products.length,
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        inStock,
        sort
      },
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