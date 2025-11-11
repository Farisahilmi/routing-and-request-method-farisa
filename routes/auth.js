var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword, initializeUsersWithHashedPasswords } = require('../middleware/auth');

// Gunakan fungsi yang sama seperti di file lain
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

// Initialize hashed passwords on first run
initializeUsersWithHashedPasswords().then(updated => {
  if (updated) {
    console.log('🔐 Password initialization completed');
  }
});

// GET Login Page
router.get('/login', function(req, res, next) {
  // Jika sudah login, redirect ke home
  if (req.session.user) {
    return res.redirect('/');
  }
  
  res.render('login', { 
    title: 'Login - Simple Store',
    error: null
  });
});

// POST Login
router.post('/login', async function(req, res, next) {
  const { email, password } = req.body;
  
  try {
    const users = readJSONFile('users.json');
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.render('login', {
        title: 'Login - Simple Store',
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.render('login', {
        title: 'Login - Simple Store',
        error: 'Invalid email or password'
      });
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    console.log(`✅ User logged in: ${user.username} (${user.role})`);
    
    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Simple Store',
      error: 'Login failed. Please try again.'
    });
  }
});

// GET Register Page
router.get('/register', function(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  
  res.render('register', {
    title: 'Register - Simple Store',
    error: null,
    formData: {}
  });
});

// POST Register
router.post('/register', async function(req, res, next) {
  const { username, email, password, confirmPassword } = req.body;
  
  try {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('register', {
        title: 'Register - Simple Store',
        error: 'All fields are required',
        formData: { username, email }
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', {
        title: 'Register - Simple Store',
        error: 'Passwords do not match',
        formData: { username, email }
      });
    }
    
    if (password.length < 6) {
      return res.render('register', {
        title: 'Register - Simple Store',
        error: 'Password must be at least 6 characters',
        formData: { username, email }
      });
    }
    
    const users = readJSONFile('users.json');
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.render('register', {
        title: 'Register - Simple Store',
        error: 'Email already registered',
        formData: { username, email }
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const newUser = {
      id: String(users.length + 1),
      username,
      email,
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJSONFile('users.json', users);
    
    // Auto login after registration
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    };
    
    console.log(`✅ New user registered: ${username}`);
    
    res.redirect('/');
    
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      title: 'Register - Simple Store',
      error: 'Registration failed. Please try again.',
      formData: { username, email }
    });
  }
});

// GET Logout
router.get('/logout', function(req, res, next) {
  const username = req.session.user?.username || 'Unknown';
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    } else {
      console.log(`✅ User logged out: ${username}`);
    }
    res.redirect('/');
  });
});

module.exports = router;