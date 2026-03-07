const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter error:', error.message);
  } else {
    console.log('Email transporter ready');
  }
});

module.exports = transporter;
