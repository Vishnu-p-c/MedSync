const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 1,
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail({to, subject, html}) {
  return transporter.sendMail({
    from: `"MedSync" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = {sendEmail};
