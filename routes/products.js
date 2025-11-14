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
  
  const lang = res.locals.language || 'en';
  const t = translations[lang] || translations['en'];
  
  const currency = res.locals.currency || 'IDR';
  
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
  
  const lang = res.locals.language || 'en';
  const t = translations[lang] || translations['en'];
  
  const currency = res.locals.currency || 'IDR';
  
  res.render('product-detail', { 
    title: product.name, 
    product: product,
    t: t,
    currency: currency,
    language: lang
  });
});

// GET buy-now page (Quick checkout for single product)
router.get('/:id/buy-now', function(req, res, next) {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/users/login?redirect=/products/' + req.params.id + '/buy-now');
  }

  const { id } = req.params;
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === parseInt(id));
  
  if (!product) {
    return res.status(404).render('error', { 
      message: 'Product not found' 
    });
  }

  if (product.stock === 0) {
    return res.status(400).render('error', { 
      message: 'Product out of stock' 
    });
  }

  const lang = res.locals.language || 'en';
  const t = translations[lang] || translations['en'];
  const currency = res.locals.currency || 'IDR';

  // Redirect to checkout with product info in session
  req.session.buyNowItem = {
    productId: product.id,
    quantity: 1,
    price: product.price,
    name: product.name,
    stock: product.stock
  };

  res.redirect('/cart/checkout');
});

// POST buy-now - Handle quantity from product detail page
router.post('/:id/buy-now', function(req, res, next) {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please login to checkout', 
        redirectUrl: '/users/login' 
      });
    }

    const { id } = req.params;
    const quantity = req.body.quantity || 1;
    
    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID' 
      });
    }

    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid quantity' 
      });
    }

    const products = readJSONFile('products.json');
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    if (product.stock === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product out of stock' 
      });
    }

    if (parseInt(quantity) > product.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough stock. Available: ${product.stock}` 
      });
    }

    // Store in session
    req.session.buyNowItem = {
      productId: product.id,
      quantity: parseInt(quantity),
      price: product.price,
      name: product.name,
      stock: product.stock
    };

    res.status(200).json({ 
      success: true, 
      message: 'Redirecting to checkout',
      redirectUrl: '/cart/checkout' 
    });
  } catch (error) {
    console.error('Error in POST /products/:id/buy-now:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;