var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { readJSONFile, writeJSONFile } = require('../helpers/database');

/* GET users listing. */
router.get('/', function(req, res, next) {
  const usersArray = readJSONFile('users.json');
  
  if (usersArray.length === 0) {
    return res.json({
      "status": "error",
      "message": "No users found"
    });
  }
  
  const mappedUsersWithLink = usersArray.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    link: `/users/update/${user.id}`
  }));
  
  return res.json({
    "status": "success",
    "message": "Users found",
    "users": mappedUsersWithLink
  });
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.get('/html', function(req, res, next) {
  const usersArray = readJSONFile('users.json');
  
  // Remove passwords from response for security
  const usersWithoutPasswords = usersArray.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  }));
  
  res.render('users', { 
    title: 'Users in HTML', 
    users: usersWithoutPasswords 
  });
});

router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const usersArray = readJSONFile('users.json');
  const user = usersArray.find(user => user.id === id);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }
  
  // Don't return password in API response
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.get('/update/:id', function(req, res, next) {
  const { id } = req.params;
  const usersArray = readJSONFile('users.json');
  const user = usersArray.find(user => user.id === id);
  
  if (!user) {
    return res.status(404).render('error', {
      message: 'User not found'
    });
  }
  
  res.render('update', { 
    title: 'Update User', 
    user: user 
  });
});

// UPDATE user using PUT method
router.put('/:id', async function(req, res, next) {
  const { id } = req.params;
  const { username, email, password } = req.body;
  
  const usersArray = readJSONFile('users.json');
  const userIndex = usersArray.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ 
      status: "error", 
      message: "User not found" 
    });
  }

  try {
    // Hash new password if provided
    let hashedPassword = usersArray[userIndex].password;
    if (password && password !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    usersArray[userIndex] = {
      ...usersArray[userIndex],
      username: username,
      email: email,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };
    
    if (writeJSONFile('users.json', usersArray)) {
      res.json({ 
        status: "success", 
        message: "User updated successfully" 
      });
    } else {
      res.status(500).json({ 
        status: "error", 
        message: "Failed to update user" 
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Error updating user" 
    });
  }
});

// CREATE user using POST method
router.post('/', async function(req, res, next) {
  const { username, email, password, role = 'customer' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Username, email, and password are required"
    });
  }

  let usersArray = readJSONFile('users.json');

  // Check if email already exists
  const existingUser = usersArray.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({
      status: "error",
      message: "Email already exists"
    });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate new id as string for consistency
    const id = usersArray.length > 0 
      ? String(Math.max(...usersArray.map(u => parseInt(u.id || 0))) + 1)
      : '1';

    const newUser = {
      id,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    usersArray.push(newUser);

    if (writeJSONFile('users.json', usersArray)) {
      res.json({ 
        status: "success", 
        message: "User created successfully" 
      });
    } else {
      res.status(500).json({ 
        status: "error", 
        message: "Failed to create user" 
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Error creating user" 
    });
  }
});

// DELETE user using DELETE method
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  const usersArray = readJSONFile('users.json');
  const userIndex = usersArray.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ 
      status: "error", 
      message: "User not found" 
    });
  }
  
  // Prevent deleting the last admin
  const userToDelete = usersArray[userIndex];
  if (userToDelete.role === 'admin') {
    const adminCount = usersArray.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete the last admin user"
      });
    }
  }
  
  usersArray.splice(userIndex, 1);
  
  if (writeJSONFile('users.json', usersArray)) {
    res.json({ 
      status: "success", 
      message: "User deleted successfully" 
    });
  } else {
    res.status(500).json({ 
      status: "error", 
      message: "Failed to delete user" 
    });
  }
});

module.exports = router;