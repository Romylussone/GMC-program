const nodemailer = require('nodemailer');

const requiredSettings = ['EMAIL_USER', 'EMAIL_APP_PASSWORD', 'EMAIL_TO'];
const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);

if (missingSettings.length > 0) {
  console.error(`Missing environment variables: ${missingSettings.join(', ')}`);
  console.error('Set them before running this script. See .env.example for the expected values.');
  process.exitCode = 1;
} else {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: 'Node.js Nodemailer test',
    text: 'Hello! This email was sent with Nodemailer.',
  };

  transporter.sendMail(mailOptions)
    .then((info) => console.log(`Email sent: ${info.response}`))
    .catch((error) => console.error('Error sending email:', error));
}
