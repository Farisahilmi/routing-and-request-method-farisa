var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var methodOverride = require('method-override');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var ordersRouter = require('./routes/orders');
var cartRouter = require('./routes/cart');
var adminRouter = require('./routes/admin');

// Simple translations
const translations = {
  en: {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock', 
    add_to_cart: 'Add to Cart',
    view_details: 'View Details',
    no_products: 'No products found',
    no_products_message: 'There are no products available at the moment.',
    image_coming_soon: 'Image Coming Soon',
    success: 'Success',
    error: 'Error',
    product_added_to_cart: 'Product added to cart!',
    failed_to_add_cart: 'Failed to add product to cart',
    error_adding_cart: 'Error adding to cart'
  },
  id: {
    in_stock: 'Tersedia',
    out_of_stock: 'Habis',
    add_to_cart: 'Tambah ke Keranjang', 
    view_details: 'Lihat Detail',
    no_products: 'Tidak ada produk',
    no_products_message: 'Tidak ada produk yang tersedia saat ini.',
    image_coming_soon: 'Gambar Segera Hadir',
    success: 'Berhasil',
    error: 'Error',
    product_added_to_cart: 'Produk ditambahkan ke keranjang!',
    failed_to_add_cart: 'Gagal menambahkan produk ke keranjang',
    error_adding_cart: 'Error menambahkan ke keranjang'
  }
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 GLOBAL MIDDLEWARE - Currency & Language
app.use(function(req, res, next) {
  // Currency handling
  if (req.query.currency) {
    res.locals.currency = req.query.currency;
  } else {
    res.locals.currency = 'IDR'; // Default currency
  }
  
  // Language handling  
  const lang = req.query.lang || 'en';
  res.locals.language = lang;
  res.locals.t = translations[lang] || translations['en'];
  
  next();
});

// ⚡️ API routes HARUS DULUAN ⚡️
app.use('/api/users', require('./routes/api/users'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/orders', require('./routes/api/orders'));

// Public routes SETELAH API routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/cart', cartRouter);
app.use('/admin', adminRouter);

// ... rest of your routes (about, contact, etc)
app.get('/about', function(req, res) {
  res.render('about', { title: 'About Us - Simple Store' });
});

app.get('/contact', function(req, res) {
  res.render('contact', { title: 'Contact Us - Simple Store' });
});

app.get('/shipping', function(req, res) {
  res.render('shipping', { title: 'Shipping Info - Simple Store' });
});

app.get('/returns', function(req, res) {
  res.render('returns', { title: 'Returns & Refunds - Simple Store' });
});

app.get('/privacy', function(req, res) {
  res.render('privacy', { title: 'Privacy Policy - Simple Store' });
});

app.get('/terms', function(req, res) {
  res.render('terms', { title: 'Terms of Service - Simple Store' });
});

app.get('/sitemap', function(req, res) {
  res.render('sitemap', { title: 'Sitemap - Simple Store' });
});

app.post('/contact', function(req, res) {
  const { name, email, subject, message } = req.body;
  res.json({ 
    success: true, 
    message: 'Thank you for your message, ' + name + '! We will get back to you within 24 hours.' 
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// ... kode Anda yang lain ...

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ✅ TAMBAHKAN INI untuk menjalankan server
const PORT = process.env.PORT || 3000;

// Only start server if this file is run directly (not required by another module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  });
}

module.exports = app;