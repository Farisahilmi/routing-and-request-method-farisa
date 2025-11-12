var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { readJSONFile, writeJSONFile } = require('../helpers/database');
const { validateEmail, validatePasswordStrength, sanitizeString } = require('../helpers/validator');
const logger = require('../helpers/logger');

// GET register page
router.get('/register', function(req, res, next) {
  res.render('register', { 
    title: 'Register',
    error: null,
    username: '',
    email: '',
    user: req.session.user || null
  });
});

// POST register
router.post('/register', async function(req, res, next) {
  const { username, email, password, confirmPassword } = req.body;

  // ✅ VALIDATION: Check required fields
  if (!username || !email || !password || !confirmPassword) {
    logger.warn('Registration: Missing required fields');
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  // ✅ VALIDATION: Email format
  if (!validateEmail(email)) {
    logger.warn(`Registration: Invalid email format - ${email}`);
    return res.render('register', {
      title: 'Register',
      error: 'Invalid email format!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  // ✅ VALIDATION: Password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    logger.warn(`Registration: Weak password - ${passwordValidation.errors.join(', ')}`);
    return res.render('register', {
      title: 'Register',
      error: passwordValidation.errors[0] || 'Invalid password format!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  // ✅ VALIDATION: Passwords match
  if (password !== confirmPassword) {
    logger.warn('Registration: Passwords do not match');
    return res.render('register', {
      title: 'Register',
      error: 'Passwords do not match!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  let usersArray = readJSONFile('users.json');

  const existingUser = usersArray.find(user => user.email === email);
  if (existingUser) {
    logger.warn(`Registration: Email already exists - ${email}`);
    return res.render('register', {
      title: 'Register',
      error: 'Email already exists!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const id = usersArray.length > 0 
      ? String(Math.max(...usersArray.map(u => parseInt(u.id || 0))) + 1)
      : '1';

    const newUser = {
      id,
      username: sanitizeString(username),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    usersArray.push(newUser);

    if (writeJSONFile('users.json', usersArray)) {
      logger.success(`User registered`, { userId: id, email });
      res.redirect('/users/login?message=Registration successful');
    } else {
      logger.error('Failed to write users.json during registration');
      res.render('register', {
        title: 'Register',
        error: 'Failed to create account. Please try again.',
        username: username || '',
        email: email || '',
        user: null
      });
    }
  } catch (error) {
    logger.error('Error creating user', error);
    res.render('register', {
      title: 'Register',
      error: 'Error creating account. Please try again.',
      username: username || '',
      email: email || '',
      user: null
    });
  }
});

// GET login page
router.get('/login', function(req, res, next) {
  res.render('login', { 
    title: 'Login',
    error: null,
    message: req.query.message || null,
    user: null
  });
});

// POST login
router.post('/login', async function(req, res, next) {
  const { email, password } = req.body;

  // ✅ VALIDATION: Check required fields
  if (!email || !password) {
    logger.warn('Login: Missing email or password');
    return res.render('login', {
      title: 'Login',
      error: 'Email and password are required!',
      user: null
    });
  }

  // ✅ VALIDATION: Email format
  if (!validateEmail(email)) {
    logger.warn(`Login: Invalid email format - ${email}`);
    return res.render('login', {
      title: 'Login',
      error: 'Invalid email format!',
      user: null
    });
  }

  const usersArray = readJSONFile('users.json');
  const user = usersArray.find(user => user.email === email.toLowerCase());

  if (!user) {
    logger.warn(`Login: User not found - ${email}`);
    return res.render('login', {
      title: 'Login',
      error: 'Invalid email or password!',
      user: null
    });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      logger.warn(`Login: Invalid password for user - ${email}`);
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password!',
        user: null
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    logger.success(`User logged in`, { userId: user.id, email });
    res.redirect('/?message=Login successful');

  } catch (error) {
    logger.error('Login error', error);
    res.render('login', {
      title: 'Login',
      error: 'Login failed. Please try again.',
      user: null
    });
  }
});

// GET logout
router.get('/logout', function(req, res, next) {
  const userId = req.session.user?.id;
  req.session.destroy(function(err) {
    if (err) {
      logger.error('Logout error', err);
    } else {
      logger.success(`User logged out`, { userId });
    }
    res.redirect('/');
  });
});

module.exports = router;