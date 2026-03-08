const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  mobileForgotPassword,
  resetPassword,
  verifyToken,
} = require('../controllers/passwordController');

// POST /password/forgot — send reset email (web app, admins only)
router.post('/forgot', forgotPassword);

// POST /password/mobile/forgot — send reset code (mobile app,
// patient/doctor/driver)
router.post('/mobile/forgot', mobileForgotPassword);

// POST /password/reset — reset password (accepts full token from web OR 6-char
// code from mobile)
router.post('/reset', resetPassword);

// GET /password/verify-token?token=xxx — check if token is still valid
router.get('/verify-token', verifyToken);

module.exports = router;
