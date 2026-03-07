const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'medsync.pentagon@gmail.com',
    pass: process.env.EMAIL_PASS || 'grdj laem aabh fmrp',
  },
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
