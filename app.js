var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var ordersRouter = require('./routes/orders');
var cartRouter = require('./routes/cart');
var adminRouter = require('./routes/admin');
var checkoutRouter = require('./routes/checkout');
var authRouter = require('./routes/auth');

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
    error_adding_cart: 'Error adding to cart',
    checkout: 'Checkout',
    proceed_to_checkout: 'Proceed to Checkout',
    order_success: 'Order Success',
    order_id: 'Order ID',
    order_date: 'Order Date',
    customer_name: 'Customer Name',
    customer_email: 'Customer Email',
    shipping_address: 'Shipping Address',
    payment_method: 'Payment Method',
    order_total: 'Order Total',
    order_status: 'Order Status',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    order_items: 'Order Items',
    quantity: 'Quantity',
    price: 'Price',
    subtotal: 'Subtotal',
    no_orders: 'No orders found',
    no_orders_message: 'You have not placed any orders yet.',
    place_first_order: 'Place your first order!'
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
    error_adding_cart: 'Error menambahkan ke keranjang',
    checkout: 'Checkout',
    proceed_to_checkout: 'Lanjut ke Checkout',
    order_success: 'Pesanan Berhasil',
    order_id: 'ID Pesanan',
    order_date: 'Tanggal Pesanan',
    customer_name: 'Nama Pelanggan',
    customer_email: 'Email Pelanggan',
    shipping_address: 'Alamat Pengiriman',
    payment_method: 'Metode Pembayaran',
    order_total: 'Total Pesanan',
    order_status: 'Status Pesanan',
    processing: 'Sedang Diproses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    order_items: 'Item Pesanan',
    quantity: 'Jumlah',
    price: 'Harga',
    subtotal: 'Subtotal',
    no_orders: 'Tidak ada pesanan',
    no_orders_message: 'Anda belum melakukan pesanan apapun.',
    place_first_order: 'Buat pesanan pertama Anda!'
  }
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'simple-store-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Global middleware
app.use(function(req, res, next) {
  // Currency handling
  if (req.query.currency) {
    res.locals.currency = req.query.currency;
  } else {
    res.locals.currency = 'IDR';
  }
  
  // Language handling  
  const lang = req.query.lang || 'en';
  res.locals.language = lang;
  res.locals.t = translations[lang] || translations['en'];
  
  // User session handling
  res.locals.user = req.session.user || null;
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// API routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/orders', require('./routes/api/orders'));

// Public routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/cart', cartRouter);
app.use('/admin', adminRouter);
app.use('/checkout', checkoutRouter);
app.use('/', authRouter);

// Static pages routes
app.get('/about', function(req, res) {
  res.render('about', { 
    title: 'About Us - Simple Store',
    user: req.session.user
  });
});

app.get('/contact', function(req, res) {
  res.render('contact', { 
    title: 'Contact Us - Simple Store',
    user: req.session.user
  });
});

app.get('/shipping', function(req, res) {
  res.render('shipping', { 
    title: 'Shipping Info - Simple Store',
    user: req.session.user
  });
});

app.get('/returns', function(req, res) {
  res.render('returns', { 
    title: 'Returns & Refunds - Simple Store',
    user: req.session.user
  });
});

app.get('/privacy', function(req, res) {
  res.render('privacy', { 
    title: 'Privacy Policy - Simple Store',
    user: req.session.user
  });
});

app.get('/terms', function(req, res) {
  res.render('terms', { 
    title: 'Terms of Service - Simple Store',
    user: req.session.user
  });
});

app.get('/sitemap', function(req, res) {
  res.render('sitemap', { 
    title: 'Sitemap - Simple Store',
    user: req.session.user
  });
});

app.post('/contact', function(req, res) {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required'
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Thank you for your message, ' + name + '! We will get back to you within 24 hours.' 
  });
});

// 404 Handler
app.use(function(req, res, next) {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'Sorry, the page you are looking for does not exist.',
    error: { status: 404 },
    user: req.session.user
  });
});

// Global Error Handler
app.use(function(err, req, res, next) {
  console.error('Error Stack:', err.stack);
  
  const isDevelopment = req.app.get('env') === 'development';
  res.locals.message = err.message;
  res.locals.error = isDevelopment ? err : {};
  res.locals.isDevelopment = isDevelopment;
  
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error - Simple Store',
    message: isDevelopment ? err.message : 'Something went wrong! Please try again later.',
    error: isDevelopment ? err : {},
    isDevelopment: isDevelopment,
    user: req.session.user
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`🛒 Cart system: ENABLED (File-based)`);
    console.log(`📦 Order management: ENABLED`);
    console.log(`💳 Checkout system: ENABLED`);
    console.log(`🔐 Authentication: ENABLED`);
    console.log(`👤 Session management: ENABLED`);
  });
}

module.exports = app;