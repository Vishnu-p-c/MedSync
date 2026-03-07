const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
  verifyToken,
} = require('../controllers/passwordController');

// POST /password/forgot — send reset email
router.post('/forgot', forgotPassword);

// POST /password/reset — reset the password
router.post('/reset', resetPassword);

// GET /password/verify-token?token=xxx — check if token is still valid
router.get('/verify-token', verifyToken);

module.exports = router;
