const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sendPasswordReset } = require('../helpers/email');
const { readJSONFile, writeJSONFile } = require('../helpers/database');
const logger = require('../helpers/logger');

// Store reset tokens (in production, use Redis or database)
const resetTokens = new Map();

// GET forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    title: 'Forgot Password',
    error: null,
    message: null,
    user: req.session.user || null
  });
});

// POST forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render('forgot-password', {
      title: 'Forgot Password',
      error: 'Email is required',
      message: null,
      user: req.session.user || null
    });
  }

  const users = readJSONFile('users.json');
  const user = users.find(u => u.email === email);

  if (!user) {
    // Don't reveal if email exists or not for security
    return res.render('forgot-password', {
      title: 'Forgot Password',
      error: null,
      message: 'If an account with that email exists, a password reset link has been sent.',
      user: req.session.user || null
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = Date.now() + 3600000; // 1 hour

  // Store token
  resetTokens.set(resetToken, {
    userId: user.id,
    expires: resetExpires
  });

  // Send reset email
  const resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

  try {
    await sendPasswordReset({
      email: user.email,
      resetLink: resetLink
    });

    res.render('forgot-password', {
      title: 'Forgot Password',
      error: null,
      message: 'Password reset link has been sent to your email.',
      user: req.session.user || null
    });
  } catch (error) {
    logger.error('Error sending reset email', error);
    res.render('forgot-password', {
      title: 'Forgot Password',
      error: 'Failed to send reset email. Please try again.',
      message: null,
      user: req.session.user || null
    });
  }
});

// GET reset password page
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;

  const tokenData = resetTokens.get(token);
  if (!tokenData || tokenData.expires < Date.now()) {
    return res.render('reset-password', {
      title: 'Reset Password',
      error: 'Invalid or expired reset token',
      message: null,
      token: null,
      user: req.session.user || null
    });
  }

  res.render('reset-password', {
    title: 'Reset Password',
    error: null,
    message: null,
    token: token,
    user: req.session.user || null
  });
});

// POST reset password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  const tokenData = resetTokens.get(token);
  if (!tokenData || tokenData.expires < Date.now()) {
    return res.render('reset-password', {
      title: 'Reset Password',
      error: 'Invalid or expired reset token',
      message: null,
      token: null,
      user: req.session.user || null
    });
  }

  if (!password || !confirmPassword) {
    return res.render('reset-password', {
      title: 'Reset Password',
      error: 'All fields are required',
      message: null,
      token: token,
      user: req.session.user || null
    });
  }

  if (password !== confirmPassword) {
    return res.render('reset-password', {
      title: 'Reset Password',
      error: 'Passwords do not match',
      message: null,
      token: token,
      user: req.session.user || null
    });
  }

  if (password.length < 6) {
    return res.render('reset-password', {
      title: 'Reset Password',
      error: 'Password must be at least 6 characters long',
      message: null,
      token: token,
      user: req.session.user || null
    });
  }

  try {
    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(u => u.id === tokenData.userId);

    if (userIndex === -1) {
      return res.render('reset-password', {
        title: 'Reset Password',
        error: 'User not found',
        message: null,
        token: null,
        user: req.session.user || null
      });
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date().toISOString();

    if (!writeJSONFile('users.json', users)) {
      return res.render('reset-password', {
        title: 'Reset Password',
        error: 'Failed to update password',
        message: null,
        token: token,
        user: req.session.user || null
      });
    }

    // Remove used token
    resetTokens.delete(token);

    res.render('login', {
      title: 'Login',
      error: null,
      message: 'Password has been reset successfully. Please login with your new password.',
      user: null
    });

  } catch (error) {
    logger.error('Error resetting password', error);
    res.render('reset-password', {
      title: 'Reset Password',
      error: 'Failed to reset password. Please try again.',
      message: null,
      token: token,
      user: req.session.user || null
    });
  }
});

module.exports = router;
