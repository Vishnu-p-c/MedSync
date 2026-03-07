// Brevo (formerly Sendinblue) — HTTP transactional email API
// No SMTP ports needed, works on Render free tier

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_USER || 'medsync.pentagon@gmail.com';

async function sendEmail({to, subject, html}) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: {name: 'MedSync', email: SENDER_EMAIL},
      to: [{email: to}],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Brevo API error: ${res.status}`);
  }

  return await res.json();
}

module.exports = {sendEmail};
