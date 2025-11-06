var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

// Simple translations (sementara)
const translations = {
  en: {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    add_to_cart: 'Add to Cart',
    view_details: 'View Details',
    no_products: 'No products found',
    no_products_message: 'There are no products available at the moment.',
    image_coming_soon: 'Image Coming Soon'
  },
  id: {
    in_stock: 'Tersedia',
    out_of_stock: 'Habis',
    add_to_cart: 'Tambah ke Keranjang',
    view_details: 'Lihat Detail',
    no_products: 'Tidak ada produk',
    no_products_message: 'Tidak ada produk yang tersedia saat ini.',
    image_coming_soon: 'Gambar Segera Hadir'
  }
};

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

// GET all products (HTML)
router.get('/', function(req, res, next) {
  const products = readJSONFile('products.json');
  
  // Get language from query or default to 'en'
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  // Get currency from query or default to 'IDR'
  const currency = req.query.currency || 'IDR';
  
  res.render('products', { 
    title: 'All Products', 
    products: products,
    t: t,
    currency: currency,
    language: lang
  });
});

// GET single product (HTML)
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === parseInt(id));
  
  if (!product) {
    return res.status(404).render('error', { 
      message: 'Product not found' 
    });
  }
  
  // Get language from query or default to 'en'
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  // Get currency from query or default to 'IDR'
  const currency = req.query.currency || 'IDR';
  
  res.render('product-detail', { 
    title: product.name, 
    product: product,
    t: t,
    currency: currency,
    language: lang
  });
});

module.exports = router;