var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require('../middleware/auth');

// Simple translations
const translations = {
  en: {
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    low_stock: 'Low Stock',
    no_products: 'No Products Found',
    no_products_message: 'Get started by adding your first product!',
    add_first_product: 'Add Your First Product',
    users_management: 'Users Management',
    total_users: 'Total Users',
    admin_users: 'Admin Users',
    customer_users: 'Customer Users',
    user_id: 'User ID',
    username: 'Username',
    email: 'Email',
    role: 'Role',
    created_at: 'Created At',
    actions: 'Actions',
    no_users: 'No Users Found',
    no_users_message: 'There are no users in the system yet.',
    promote_to_admin: 'Promote to Admin',
    demote_to_customer: 'Demote to Customer',
    delete_user: 'Delete User',
    user_promoted: 'User promoted to admin',
    user_demoted: 'User demoted to customer',
    user_deleted: 'User deleted successfully',
    cannot_delete_last_admin: 'Cannot delete the last admin user',
    confirm_delete_user: 'Are you sure you want to delete this user?'
  },
  id: {
    in_stock: 'Tersedia',
    out_of_stock: 'Habis',
    low_stock: 'Stok Sedikit',
    no_products: 'Tidak Ada Produk',
    no_products_message: 'Mulai dengan menambahkan produk pertama Anda!',
    add_first_product: 'Tambah Produk Pertama',
    users_management: 'Manajemen Pengguna',
    total_users: 'Total Pengguna',
    admin_users: 'Pengguna Admin',
    customer_users: 'Pengguna Customer',
    user_id: 'ID Pengguna',
    username: 'Nama Pengguna',
    email: 'Email',
    role: 'Peran',
    created_at: 'Dibuat Pada',
    actions: 'Aksi',
    no_users: 'Tidak Ada Pengguna',
    no_users_message: 'Belum ada pengguna dalam sistem.',
    promote_to_admin: 'Jadikan Admin',
    demote_to_customer: 'Jadikan Customer',
    delete_user: 'Hapus Pengguna',
    user_promoted: 'Pengguna dijadikan admin',
    user_demoted: 'Pengguna dijadikan customer',
    user_deleted: 'Pengguna berhasil dihapus',
    cannot_delete_last_admin: 'Tidak dapat menghapus admin terakhir',
    confirm_delete_user: 'Apakah Anda yakin ingin menghapus pengguna ini?'
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
router.get('/', requireAdmin, function(req, res, next) {
  const products = readJSONFile('products.json');
  const users = readJSONFile('users.json');
  const orders = readJSONFile('orders.json');
  
  const stats = {
    totalProducts: products.length,
    totalUsers: users.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    lowStockProducts: products.filter(p => p.stock <= 5).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    customerUsers: users.filter(u => u.role === 'customer').length
  };
  
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-dashboard', { 
    title: 'Admin Dashboard - Simple Store',
    stats: stats,
    currency: currency,
    t: t,
    language: lang,
    user: req.session.user
  });
});

// GET Admin Products Page
router.get('/products', requireAdmin, function(req, res, next) {
  const products = readJSONFile('products.json');
  
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-products', { 
    title: 'Admin Products - Simple Store',
    products: products,
    currency: currency,
    t: t,
    language: lang,
    user: req.session.user
  });
});

// POST Add New Product
router.post('/products', requireAdmin, function(req, res, next) {
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

// DELETE Product
router.delete('/products/:id', requireAdmin, function(req, res, next) {
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

// GET Admin Users Page - UPDATED
router.get('/users', requireAdmin, function(req, res, next) {
  const users = readJSONFile('users.json');
  
  // User statistics
  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length
  };
  
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-users', { 
    title: 'Admin Users - Simple Store',
    users: users,
    userStats: userStats,
    currency: currency,
    t: t,
    language: lang,
    user: req.session.user
  });
});

// PUT Update User Role
router.put('/users/:id/role', requireAdmin, function(req, res, next) {
  const userId = req.params.id;
  const { role } = req.body;
  
  const users = readJSONFile('users.json');
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.json({ 
      success: false, 
      message: 'User not found' 
    });
  }
  
  // Validate role
  if (!['admin', 'customer'].includes(role)) {
    return res.json({ 
      success: false, 
      message: 'Invalid role' 
    });
  }
  
  // Prevent demoting the last admin
  if (role === 'customer') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1 && users[userIndex].role === 'admin') {
      return res.json({ 
        success: false, 
        message: 'Cannot demote the last admin user' 
      });
    }
  }
  
  users[userIndex].role = role;
  users[userIndex].updatedAt = new Date().toISOString();
  
  if (writeJSONFile('users.json', users)) {
    res.json({ 
      success: true, 
      message: `User role updated to ${role}`,
      user: users[userIndex]
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Failed to update user role' 
    });
  }
});

// DELETE User
router.delete('/users/:id', requireAdmin, function(req, res, next) {
  const userId = req.params.id;
  
  const users = readJSONFile('users.json');
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.json({ 
      success: false, 
      message: 'User not found' 
    });
  }
  
  const userToDelete = users[userIndex];
  
  // Prevent deleting the last admin
  if (userToDelete.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.json({ 
        success: false, 
        message: 'Cannot delete the last admin user' 
      });
    }
  }
  
  // Prevent deleting yourself
  if (userToDelete.id === req.session.user.id) {
    return res.json({ 
      success: false, 
      message: 'Cannot delete your own account' 
    });
  }
  
  users.splice(userIndex, 1);
  
  if (writeJSONFile('users.json', users)) {
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: userToDelete
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});

// GET Admin Orders Page
router.get('/orders', requireAdmin, function(req, res, next) {
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
      userEmail: user ? user.email : 'Unknown Email',
      products: orderProducts
    };
  });
  
  const currency = req.query.currency || res.locals.currency || 'IDR';
  const lang = req.query.lang || 'en';
  const t = translations[lang] || translations['en'];
  
  res.render('admin-orders', { 
    title: 'Admin Orders - Simple Store',
    orders: enrichedOrders,
    currency: currency,
    t: t,
    language: lang,
    user: req.session.user
  });
});

// PUT Update Order Status
router.put('/orders/:id/status', requireAdmin, function(req, res, next) {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    const orders = readJSONFile('orders.json');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        return res.json({ 
            success: false, 
            message: 'Order not found' 
        });
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.json({ 
            success: false, 
            message: 'Invalid status' 
        });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    if (writeJSONFile('orders.json', orders)) {
        res.json({ 
            success: true, 
            message: 'Order status updated successfully',
            order: orders[orderIndex]
        });
    } else {
        res.json({ 
            success: false, 
            message: 'Failed to update order status' 
        });
    }
});

module.exports = router;