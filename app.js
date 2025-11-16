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
var authRouter = require('./routes/auth');
var addressesRouter = require('./routes/addresses');
var reviewsRouter = require('./routes/reviews');

// Import translation helper and language middleware
const { getTranslation, getTranslations } = require('./helpers/translation');
const { languageMiddleware } = require('./middleware/language');

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

// Session middleware - MUST be before languageMiddleware
// For Vercel production, use secure cookies
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
app.use(session({
  secret: process.env.SESSION_SECRET || 'simple-store-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction ? true : false, // Use secure cookies in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Use language middleware after session is set up
app.use(languageMiddleware);

// Import currency helper
const { getCurrencyByLanguage, formatCurrency } = require('./helpers/currency');

// Global middleware - Use language from languageMiddleware
app.use(function(req, res, next) {
  const sessionUser = req.session.user || null;

  // Get language from res.locals (set by languageMiddleware) or fallback
  let language = res.locals.language || 'en';

  // Get currency from session or cookie, or auto-detect from language
  let currency = 'IDR';
  if (sessionUser && sessionUser.currency) {
    currency = sessionUser.currency;
  } else if (req.cookies && req.cookies.currency) {
    currency = req.cookies.currency;
  } else {
    // Auto-detect currency from language
    currency = getCurrencyByLanguage(language);
  }

  // Ensure language is set (should already be set by languageMiddleware)
  res.locals.language = language;
  res.locals.currency = currency;
  // Use full translations from JSON files instead of simple translations object
  const fullTranslations = getTranslations(language);
  
  // Flatten nested translation objects (common, nav, auth, etc.) to top level
  // so we can access t.admin_dashboard instead of t.nav.admin_dashboard
  const flattenedTranslations = {};
  for (const key in fullTranslations) {
    if (typeof fullTranslations[key] === 'object' && fullTranslations[key] !== null) {
      // Merge nested objects to top level
      Object.assign(flattenedTranslations, fullTranslations[key]);
    } else {
      // Direct key-value pairs
      flattenedTranslations[key] = fullTranslations[key];
    }
  }
  
  // Merge with simple translations for backward compatibility
  res.locals.t = { ...flattenedTranslations, ...(translations[language] || translations['en']) };
  res.locals.user = sessionUser;
  res.locals.formatCurrency = formatCurrency; // Make formatCurrency available in all views
  
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
app.use('/api/reviews', reviewsRouter);

// Public routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/cart', cartRouter);
app.use('/admin', adminRouter);
app.use('/', authRouter);
app.use('/addresses', addressesRouter);
app.use('/reviews', reviewsRouter);

// Redirect routes untuk URL pendek
app.get('/register', function(req, res) {
  res.redirect('/users/register');
});

app.get('/login', function(req, res) {
  res.redirect('/users/login');
});

app.get('/logout', function(req, res) {
  res.redirect('/users/logout');
});

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
