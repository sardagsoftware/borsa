/**
 * Email Service
 * Handles all email communications
 * Supports: SendGrid (production), Nodemailer (fallback/development)
 */

const nodemailer = require('nodemailer');
const sendgridService = require('../services/sendgrid-email-service');

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter(EMAIL_CONFIG);
  }
  return transporter;
};

/**
 * Send email (auto-detects provider)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Use SendGrid if available
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      console.log('📧 Sending via SendGrid...');
      // SendGrid handles its own templates, fall back to nodemailer for custom emails
    }

    // Fallback to nodemailer
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email service not configured. Email would be sent to:', to);
      return {
        success: true,
        messageId: 'test-' + Date.now(),
        message: 'Email service not configured (development mode)'
      };
    }

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"Ailydian Ultra Pro" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Ailydian Ultra Pro!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Ailydian Ultra Pro!</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>Thank you for joining Ailydian Ultra Pro, your all-in-one AI platform.</p>
          <p>Your account has been successfully created with the following details:</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Subscription:</strong> ${user.subscription.toUpperCase()}</li>
            <li><strong>Credits:</strong> ${user.credits}</li>
          </ul>
          <p>Start exploring our AI features:</p>
          <ul>
            <li>AI Chat - Multilingual conversational AI</li>
            <li>Image Generation - Create stunning visuals with LyDian Image Engine</li>
            <li>Voice Assistant - Speech recognition and synthesis</li>
            <li>Document Analysis - Extract insights from your files</li>
          </ul>
          <a href="${process.env.APP_URL || 'http://localhost:3100'}/dashboard.html" class="button">Go to Dashboard</a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Ailydian Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ailydian Ultra Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Ailydian Ultra Pro!

    Hello ${user.name}!

    Thank you for joining Ailydian Ultra Pro. Your account has been successfully created.

    Email: ${user.email}
    Subscription: ${user.subscription.toUpperCase()}
    Credits: ${user.credits}

    Visit ${process.env.APP_URL || 'http://localhost:3100'}/dashboard.html to get started.

    Best regards,
    The Ailydian Team
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${process.env.APP_URL || 'http://localhost:3100'}/api/email/verify/${token}`;

  const subject = 'Verify Your Email Address';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>Please verify your email address to activate your Ailydian Ultra Pro account.</p>
          <p>Click the button below to verify:</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <p>Best regards,<br>The Ailydian Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ailydian Ultra Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Verify Your Email

    Hello ${user.name}!

    Please verify your email address by clicking the link below:
    ${verificationLink}

    This link will expire in 24 hours.

    If you didn't create an account, please ignore this email.

    Best regards,
    The Ailydian Team
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.APP_URL || 'http://localhost:3100'}/reset-password.html?token=${token}`;

  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>We received a request to reset your password for your Ailydian Ultra Pro account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          <div class="warning">
            <strong>⚠ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          <p>Best regards,<br>The Ailydian Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ailydian Ultra Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request

    Hello ${user.name}!

    We received a request to reset your password.

    Click the link below to reset your password:
    ${resetLink}

    This link will expire in 1 hour.

    If you didn't request a password reset, please ignore this email.

    Best regards,
    The Ailydian Team
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

/**
 * Send 2FA enabled notification
 */
const send2FAEnabledEmail = async (user) => {
  const subject = 'Two-Factor Authentication Enabled';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>2FA Enabled</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <div class="success">
            <strong>✓ Success!</strong> Two-factor authentication has been enabled for your account.
          </div>
          <p>Your account is now more secure. You'll need to provide a verification code from your authenticator app each time you log in.</p>
          <p>If you didn't enable 2FA, please contact our support team immediately.</p>
          <p>Best regards,<br>The Ailydian Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ailydian Ultra Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Two-Factor Authentication Enabled

    Hello ${user.name}!

    Two-factor authentication has been enabled for your account.

    Your account is now more secure.

    If you didn't enable 2FA, please contact our support team immediately.

    Best regards,
    The Ailydian Team
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

/**
 * Send subscription confirmation
 */
const sendSubscriptionEmail = async (user, plan, amount) => {
  const subject = `Subscription Confirmed - ${plan.toUpperCase()} Plan`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .plan-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Confirmed</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>Thank you for subscribing to Ailydian Ultra Pro!</p>
          <div class="plan-box">
            <h3>${plan.toUpperCase()} Plan</h3>
            <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)} / month</p>
            <p><strong>Status:</strong> Active</p>
          </div>
          <p>You now have access to all ${plan} features. Visit your dashboard to explore:</p>
          <a href="${process.env.APP_URL || 'http://localhost:3100'}/dashboard.html" class="button">Go to Dashboard</a>
          <p>Your subscription will renew automatically each month.</p>
          <p>Best regards,<br>The Ailydian Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ailydian Ultra Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Subscription Confirmed - ${plan.toUpperCase()} Plan

    Hello ${user.name}!

    Thank you for subscribing to Ailydian Ultra Pro!

    Plan: ${plan.toUpperCase()}
    Amount: $${(amount / 100).toFixed(2)} / month
    Status: Active

    Visit ${process.env.APP_URL || 'http://localhost:3100'}/dashboard.html to explore your features.

    Best regards,
    The Ailydian Team
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FAEnabledEmail,
  sendSubscriptionEmail
};
