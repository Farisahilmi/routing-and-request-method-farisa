var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

// Simple translations
const translations = {
  en: {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    low_stock: 'Low Stock',
    no_products: 'No Products Found',
    no_products_message: 'Get started by adding your first product!',
    add_first_product: 'Add Your First Product'
  },
  id: {
    in_stock: 'Tersedia',
    out_of_stock: 'Habis',
    low_stock: 'Stok Sedikit',
    no_products: 'Tidak Ada Produk',
    no_products_message: 'Mulai dengan menambahkan produk pertama Anda!',
    add_first_product: 'Tambah Produk Pertama'
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

// GET Admin Dashboard
router.get('/', function(req, res, next) {
  const products = readJSONFile('products.json');
  const users = readJSONFile('users.json');
  const orders = readJSONFile('orders.json');
  
  const stats = {
    totalProducts: products.length,
    totalUsers: users.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    lowStockProducts: products.filter(p => p.stock <= 5).length
  };
  
  // Get currency from query or use from res.locals
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-dashboard', { 
    title: 'Admin Dashboard - Simple Store',
    stats: stats,
    currency: currency,
    t: t,
    language: lang
  });
});

// GET Admin Products Page
router.get('/products', function(req, res, next) {
  const products = readJSONFile('products.json');
  
  // Get currency from query or use from res.locals
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-products', { 
    title: 'Admin Products - Simple Store',
    products: products,
    currency: currency,
    t: t,
    language: lang
  });
});

// POST Add New Product
router.post('/products', function(req, res, next) {
  const { name, description, price, category, stock, image } = req.body;
  
  const products = readJSONFile('products.json');
  
  // Generate new ID
  const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  
  const newProduct = {
    id: id,
    name: name,
    description: description,
    price: parseFloat(price),
    category: category,
    stock: parseInt(stock),
    image: image || '/images/default.jpg',
    createdAt: new Date().toISOString()
  };
  
  products.push(newProduct);
  
  if (writeJSONFile('products.json', products)) {
    res.json({ 
      success: true, 
      message: 'Product added successfully',
      product: newProduct
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Failed to add product' 
    });
  }
});

// GET Edit Product Page (Coming Soon)
router.get('/products/edit/:id', function(req, res, next) {
  const productId = parseInt(req.params.id);
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ 
      success: false, 
      message: 'Product not found' 
    });
  }
  
  // Get currency from query or use from res.locals
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-edit-product', { 
    title: 'Edit Product - Simple Store',
    product: product,
    currency: currency,
    t: t,
    language: lang
  });
});

// PUT Update Product (Coming Soon)
router.put('/products/:id', function(req, res, next) {
  const productId = parseInt(req.params.id);
  const { name, description, price, category, stock, image } = req.body;
  
  const products = readJSONFile('products.json');
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) {
    return res.json({ 
      success: false, 
      message: 'Product not found' 
    });
  }
  
  products[productIndex] = {
    ...products[productIndex],
    name: name,
    description: description,
    price: parseFloat(price),
    category: category,
    stock: parseInt(stock),
    image: image || products[productIndex].image,
    updatedAt: new Date().toISOString()
  };
  
  if (writeJSONFile('products.json', products)) {
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: products[productIndex]
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Failed to update product' 
    });
  }
});

// DELETE Product
router.delete('/products/:id', function(req, res, next) {
  const productId = parseInt(req.params.id);
  
  const products = readJSONFile('products.json');
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) {
    return res.json({ 
      success: false, 
      message: 'Product not found' 
    });
  }
  
  const deletedProduct = products.splice(productIndex, 1)[0];
  
  if (writeJSONFile('products.json', products)) {
    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      product: deletedProduct
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
});

// GET Admin Users Page (Coming Soon)
router.get('/users', function(req, res, next) {
  const users = readJSONFile('users.json');
  
  // Get currency from query or use from res.locals
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-users', { 
    title: 'Admin Users - Simple Store',
    users: users,
    currency: currency,
    t: t,
    language: lang
  });
});

// GET Admin Orders Page (Coming Soon)
router.get('/orders', function(req, res, next) {
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
  
  // Get currency from query or use from res.locals
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-orders', { 
    title: 'Admin Orders - Simple Store',
    orders: enrichedOrders,
    currency: currency,
    t: t,
    language: lang
  });
});

module.exports = router;