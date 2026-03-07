const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const {sendEmail} = require('../config/mailer');

// In-memory token store (for production, use Redis or a DB collection)
const resetTokens = new Map();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// POST /password/forgot
// Accepts { identifier } which can be username or email
exports.forgotPassword = async (req, res) => {
  try {
    const {identifier} = req.body;

    if (!identifier) {
      return res.json(
          {status: 'fail', message: 'Please provide a username or email.'});
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        {username: identifier},
        {email: identifier},
      ],
    });

    if (!user) {
      return res.json({
        status: 'fail',
        message: 'No account found with that username or email.'
      });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token with 15-minute expiry
    resetTokens.set(token, {
      userId: user.user_id,
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000,  // 15 minutes
    });

    // Build reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    // Send email via Brevo (HTTP API — no SMTP ports needed)
    await sendEmail({
      to: user.email,
      subject: 'MedSync — Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #0a0a0a; border-radius: 12px;">
          <h2 style="color: #2196f3; margin-bottom: 8px;">MedSync</h2>
          <p style="color: #ccc; font-size: 14px;">Password Reset Request</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #eee; font-size: 15px;">
            Hi <strong>${user.first_name}</strong>,
          </p>
          <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
            We received a request to reset the password for your account
            (<strong>${
          user.username}</strong>). Click the button below to set a new password.
            This link expires in <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${
          resetLink}" style="background: #2196f3; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    // Mask the email for the response
    const masked = user.email.replace(
        /(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

    return res.json({
      status: 'success',
      message: `Password reset link sent to ${masked}`,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json(
        {status: 'fail', message: 'Something went wrong. Please try again.'});
  }
};

// POST /password/reset
// Accepts { token, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const {token, newPassword} = req.body;

    if (!token || !newPassword) {
      return res.json(
          {status: 'fail', message: 'Token and new password are required.'});
    }

    if (newPassword.length < 6) {
      return res.json(
          {status: 'fail', message: 'Password must be at least 6 characters.'});
    }

    // Look up token
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.json(
          {status: 'fail', message: 'Invalid or expired reset link.'});
    }

    // Check expiry
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.json({
        status: 'fail',
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    // Find user and update password
    const user = await User.findOne({user_id: tokenData.userId});

    if (!user) {
      resetTokens.delete(token);
      return res.json({status: 'fail', message: 'User not found.'});
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Invalidate the token
    resetTokens.delete(token);

    return res.json(
        {status: 'success', message: 'Password has been reset successfully.'});
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json(
        {status: 'fail', message: 'Something went wrong. Please try again.'});
  }
};

// GET /password/verify-token?token=xxx
// Verify token is still valid (frontend uses this on page load)
exports.verifyToken = async (req, res) => {
  try {
    const {token} = req.query;

    if (!token) {
      return res.json({status: 'fail', message: 'No token provided.'});
    }

    const tokenData = resetTokens.get(token);

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      if (tokenData) resetTokens.delete(token);
      return res.json(
          {status: 'fail', message: 'Invalid or expired reset link.'});
    }

    return res.json({status: 'success', message: 'Token is valid.'});
  } catch (err) {
    return res.status(500).json(
        {status: 'fail', message: 'Something went wrong.'});
  }
};
