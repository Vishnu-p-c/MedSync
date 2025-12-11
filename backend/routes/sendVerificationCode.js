const router = require('express').Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory storage for verification codes (use Redis in production)
const verificationCodes = new Map();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) {  // 10 minutes expiry
      verificationCodes.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Rate limiting storage
const rateLimits = new Map();

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Add to .env
    pass: process.env.EMAIL_PASS   // Add to .env (use App Password for Gmail)
  }
});

router.post('/', async (req, res) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.json({status: 'fail', message: 'Email is required'});
    }

    // Rate limiting check
    const now = Date.now();
    const rateLimit = rateLimits.get(email);
    if (rateLimit) {
      const attempts = rateLimit.attempts.filter(
          timestamp => now - timestamp < 60 * 60 * 1000  // Last hour
      );
      if (attempts.length >= 3) {
        return res.json({
          status: 'fail',
          message: 'Too many attempts. Please try again later.'
        });
      }
      rateLimit.attempts = [...attempts, now];
    } else {
      rateLimits.set(email, {attempts: [now]});
    }

    // Generate 6-digit random code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store code with timestamp
    verificationCodes.set(email, {code: code, timestamp: now});

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MedSync - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">MedSync - Healthcare Management System</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({status: 'success', message: 'Verification code sent'});
  } catch (error) {
    console.error('Email sending error:', error);
    res.json({status: 'fail', message: 'Email delivery failed'});
  }
});

module.exports = router;
module.exports.verificationCodes =
    verificationCodes;  // Export for verify-code route
