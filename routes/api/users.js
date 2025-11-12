var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { requireAuth } = require('../../middleware/auth');
const logger = require('../../helpers/logger');
const { sanitizeString, validateEmail } = require('../../helpers/validator');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../../data', filename);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading ${filename}`, error);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(__dirname, '../../data', filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error writing ${filename}`, error);
    return false;
  }
}

// GET all users (API - JSON) - PROTECTED & ADMIN ONLY
router.get('/', requireAuth, function(req, res, next) {
  try {
    // ✅ Check if user is admin
    if (req.session.user.role !== 'admin') {
      logger.warn(`Unauthorized API access attempt - non-admin trying to fetch users`, { userId: req.session.user.id });
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const users = readJSONFile('users.json');
    // Remove sensitive data (passwords) before sending
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    logger.success(`All users fetched via API`, { adminId: req.session.user.id, totalUsers: safeUsers.length });
    
    res.json({
      status: 'success',
      message: 'Users retrieved successfully',
      count: safeUsers.length,
      data: safeUsers
    });
  } catch (error) {
    logger.error('Error fetching users', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// GET single user (API - JSON) - PROTECTED & ADMIN ONLY
router.get('/:id', requireAuth, function(req, res, next) {
  try {
    // ✅ Check if user is admin
    if (req.session.user.role !== 'admin') {
      logger.warn(`Unauthorized API access attempt - non-admin trying to fetch user detail`, { userId: req.session.user.id });
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const users = readJSONFile('users.json');
    const user = users.find(u => u.id === id);
    
    if (!user) {
      logger.warn(`User not found in API`, { userId: id });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    logger.info(`User detail fetched via API`, { adminId: req.session.user.id, userId: id });
    
    res.json({
      status: 'success',
      message: 'User retrieved successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error('Error fetching user', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

// PUT Update user (API) - ADMIN ONLY
router.put('/:id', requireAuth, async function(req, res, next) {
  try {
    // ✅ Check if user is admin
    if (req.session.user.role !== 'admin') {
      logger.warn(`Unauthorized API access - non-admin trying to update user`, { userId: req.session.user.id });
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { username, email, role } = req.body;
    
    // ✅ Validation
    if (!username || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and email are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    if (!['admin', 'customer'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be admin or customer'
      });
    }

    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      logger.warn(`User not found for update`, { userId: id });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if email is already used by another user
    const emailExists = users.some(u => u.email === email && u.id !== id);
    if (emailExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      username: sanitizeString(username),
      email: email.toLowerCase(),
      role: role,
      updatedAt: new Date().toISOString()
    };

    if (writeJSONFile('users.json', users)) {
      const { password, ...userWithoutPassword } = users[userIndex];
      logger.success(`User updated via API`, { adminId: req.session.user.id, userId: id });
      
      res.json({
        status: 'success',
        message: 'User updated successfully',
        data: userWithoutPassword
      });
    } else {
      logger.error('Failed to write users.json');
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      });
    }
  } catch (error) {
    logger.error('Error updating user', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// DELETE user (API) - ADMIN ONLY
router.delete('/:id', requireAuth, function(req, res, next) {
  try {
    // ✅ Check if user is admin
    if (req.session.user.role !== 'admin') {
      logger.warn(`Unauthorized API access - non-admin trying to delete user`, { userId: req.session.user.id });
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;

    // ✅ Prevent deleting yourself
    if (req.session.user.id === id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      logger.warn(`User not found for deletion`, { userId: id });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    
    if (writeJSONFile('users.json', users)) {
      const { password, ...userWithoutPassword } = deletedUser;
      logger.success(`User deleted via API`, { adminId: req.session.user.id, userId: id });
      
      res.json({
        status: 'success',
        message: 'User deleted successfully',
        data: userWithoutPassword
      });
    } else {
      logger.error('Failed to write users.json');
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user'
      });
    }
  } catch (error) {
    logger.error('Error deleting user', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// POST Update user password (API) - ADMIN ONLY
router.post('/:id/change-password', requireAuth, async function(req, res, next) {
  try {
    // ✅ Check if user is admin
    if (req.session.user.role !== 'admin') {
      logger.warn(`Unauthorized API access - non-admin trying to change password`, { userId: req.session.user.id });
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }

    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      logger.warn(`User not found for password change`, { userId: id });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    users[userIndex] = {
      ...users[userIndex],
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };

    if (writeJSONFile('users.json', users)) {
      const { password, ...userWithoutPassword } = users[userIndex];
      logger.success(`User password changed via API`, { adminId: req.session.user.id, userId: id });
      
      res.json({
        status: 'success',
        message: 'Password changed successfully',
        data: userWithoutPassword
      });
    } else {
      logger.error('Failed to write users.json');
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password'
      });
    }
  } catch (error) {
    logger.error('Error changing password', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
});

module.exports = router;