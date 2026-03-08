// Gmail API over HTTPS — no SMTP ports needed, works on Render
const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground');

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

async function sendEmail({to, subject, html}) {
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});

  // MIME encode the subject to handle special characters
  const encodedSubject =
      `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const message = [
    `To: ${to}`,
    `From: "MedSync" <${process.env.EMAIL_USER}>`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  const encodedMessage = Buffer.from(message)
                             .toString('base64')
                             .replace(/\+/g, '-')
                             .replace(/\//g, '_')
                             .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

module.exports = {sendEmail};
