const nodemailer = require('nodemailer');

// Guard rails to avoid silent failures when env is missing/misconfigured
const buildTransporter = (port, secure) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    const error = 'Email credentials are not configured (EMAIL_USER / EMAIL_PASSWORD).';
    console.error(error);
    throw new Error(error);
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure, // true = SMTPS (465), false = STARTTLS (587)
    auth: { user, pass },
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

const sendWithFallback = async (mailOptions) => {
  // Try SSL port 465 first, then STARTTLS 587 if connection times out/blocked
  try {
    const primary = buildTransporter(465, true);
    await primary.verify();
    return await primary.sendMail(mailOptions);
  } catch (err) {
    const transient = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
    if (!transient.includes(err?.code)) {
      throw err;
    }
    console.warn('Primary SMTP (465) failed, retrying on 587...', err?.message || err);
    const fallback = buildTransporter(587, false);
    await fallback.verify();
    return await fallback.sendMail(mailOptions);
  }
};

const sendWithResend = async (mailOptions) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_USER;
  if (!apiKey || !from) {
    throw new Error('Resend not configured (RESEND_API_KEY and RESEND_FROM or EMAIL_USER required).');
  }

  // Use built-in fetch (Node 18+) to avoid extra dependency
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed: ${response.status} ${body}`);
  }
};

// Send OTP email
exports.sendOTPEmail = async (email, otp, purpose) => {
  const subject = purpose === 'first_login'
    ? 'Welcome! Reset Your Password - Slidexpress Workflow'
    : 'Password Reset OTP - Slidexpress Workflow';

  const message = purpose === 'first_login'
    ? `<h2>Welcome to Slidexpress Workflow!</h2>
       <p>This is your first login. Please use the following OTP to reset your password:</p>
       <h1 style="color: #4CAF50;">${otp}</h1>
       <p>This OTP will expire in 10 minutes.</p>
       <p>After resetting your password, please login again with your new credentials.</p>`
    : `<h2>Password Reset Request</h2>
       <p>You have requested to reset your password. Please use the following OTP:</p>
       <h1 style="color: #4CAF50;">${otp}</h1>
       <p>This OTP will expire in 10 minutes.</p>
       <p>If you didn't request this, please ignore this email.</p>`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: message
  };

  try {
    if (process.env.RESEND_API_KEY) {
      await sendWithResend(mailOptions);
    } else {
      await sendWithFallback(mailOptions);
    }
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
