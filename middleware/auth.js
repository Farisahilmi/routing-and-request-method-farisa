const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Gunakan fungsi yang sama seperti di routes/admin.js
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

// Simple auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  const isJsonRequest = (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) ||
                        (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
                        req.xhr ||
                        req.path.startsWith('/api');

  if (isJsonRequest) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Redirect ke login untuk regular requests
  res.redirect('/login');
};

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  const isJsonRequest = (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) ||
                        (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
                        req.xhr ||
                        req.path.startsWith('/api');

  if (isJsonRequest) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  
  // Redirect ke login untuk regular requests
  res.redirect('/login');
};

// Hash password helper
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password helper
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Update users dengan password hashed (run sekali)
const initializeUsersWithHashedPasswords = async () => {
  try {
    const users = readJSONFile('users.json');
    let needsUpdate = false;
    
    for (let user of users) {
      // Check if password is already hashed (bcrypt hash starts with $2b$)
      if (user.password && !user.password.startsWith('$2b$')) {
        console.log(`🔐 Hashing password for user: ${user.username}`);
        user.password = await hashPassword(user.password);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      writeJSONFile('users.json', users);
      console.log('✅ All passwords hashed successfully');
      return true;
    }
    
    console.log('✅ Passwords already hashed');
    return false;
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
    return false;
  }
};

module.exports = { 
  requireAuth, 
  requireAdmin, 
  hashPassword, 
  verifyPassword,
  initializeUsersWithHashedPasswords
};