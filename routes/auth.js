var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { readJSONFile, writeJSONFile } = require('../helpers/database');

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

  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required!',
      username: username || '',
      email: email || '',
      user: null
    });
  }

  if (password !== confirmPassword) {
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
      username,
      email,
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    usersArray.push(newUser);

    if (writeJSONFile('users.json', usersArray)) {
      res.redirect('/users/login?message=Registration successful');
    } else {
      res.render('register', {
        title: 'Register',
        error: 'Failed to create account. Please try again.',
        username: username || '',
        email: email || '',
        user: null
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
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

  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Email and password are required!',
      user: null
    });
  }

  const usersArray = readJSONFile('users.json');
  const user = usersArray.find(user => user.email === email);

  if (!user) {
    return res.render('login', {
      title: 'Login',
      error: 'Invalid email or password!',
      user: null
    });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
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

    res.redirect('/?message=Login successful');

  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login',
      error: 'Login failed. Please try again.',
      user: null
    });
  }
});

// GET logout
router.get('/logout', function(req, res, next) {
  req.session.destroy(function(err) {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;