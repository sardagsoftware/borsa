/**
 * Email Service
 * Beyaz Şapkalı Security - Secure email delivery with SendGrid/Nodemailer
 */

const crypto = require('crypto');

/**
 * Initialize email client (SendGrid or Nodemailer)
 */
function getEmailClient() {
    // Priority 1: SendGrid (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        return {
            type: 'sendgrid',
            client: sgMail
        };
    }

    // Priority 2: Nodemailer SMTP
    if (process.env.SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        return {
            type: 'nodemailer',
            client: transporter
        };
    }

    // Fallback: Console logging (development only)
    console.warn('⚠️  No email service configured. Emails will be logged to console.');
    return {
        type: 'console',
        client: null
    };
}

/**
 * Send email (unified interface)
 */
async function sendEmail({ to, subject, html, text }) {
    const emailClient = getEmailClient();
    const fromEmail = process.env.FROM_EMAIL || 'noreply@ailydian.com';
    const fromName = process.env.FROM_NAME || 'Ailydian Platform';

    try {
        if (emailClient.type === 'sendgrid') {
            // SendGrid
            await emailClient.client.send({
                to,
                from: { email: fromEmail, name: fromName },
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
            });

            console.log(`✅ Email sent via SendGrid to ${to}`);
        } else if (emailClient.type === 'nodemailer') {
            // Nodemailer
            await emailClient.client.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            });

            console.log(`✅ Email sent via SMTP to ${to}`);
        } else {
            // Console fallback (development)
            console.log('📧 Email (Console Mode)');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html.substring(0, 200)}...`);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        throw error;
    }
}

/**
 * Generate email verification token
 */
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email
 */
async function sendVerificationEmail(user, token) {
    const appUrl = process.env.APP_URL || 'http://localhost:3100';
    const verifyUrl = `${appUrl}/auth.html?action=verify&token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Ailydian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Ailydian</h1>
                            <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">AI-Powered Platform</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Hi ${user.name || 'there'},
                            </p>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Thank you for registering with Ailydian! To complete your registration and activate your account, please verify your email address by clicking the button below.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:
                            </p>

                            <p style="margin: 0 0 20px; padding: 12px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; color: #667eea; font-size: 13px; word-break: break-all;">
                                ${verifyUrl}
                            </p>

                            <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                This verification link will expire in <strong>24 hours</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #fff5f5; border-top: 1px solid #fed7d7;">
                            <p style="margin: 0; color: #c53030; font-size: 13px; line-height: 1.5;">
                                🔒 <strong>Security Notice:</strong> If you didn't create an account with Ailydian, please ignore this email. Your security is our top priority.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                                © ${new Date().getFullYear()} Ailydian. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({
        to: user.email,
        subject: '🔒 Verify Your Email - Ailydian',
        html
    });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, token) {
    const appUrl = process.env.APP_URL || 'http://localhost:3100';
    const resetUrl = `${appUrl}/reset-password.html?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Ailydian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Ailydian</h1>
                            <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">Password Reset Request</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">Reset Your Password</h2>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Hi ${user.name || 'there'},
                            </p>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password for your Ailydian account. Click the button below to create a new password.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 87, 108, 0.25);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:
                            </p>

                            <p style="margin: 0 0 20px; padding: 12px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; color: #f5576c; font-size: 13px; word-break: break-all;">
                                ${resetUrl}
                            </p>

                            <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                This password reset link will expire in <strong>1 hour</strong> for security reasons.
                            </p>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #fff5f5; border-top: 1px solid #fed7d7;">
                            <p style="margin: 0; color: #c53030; font-size: 13px; line-height: 1.5;">
                                🔒 <strong>Security Alert:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged. Consider enabling 2FA for additional security.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                                © ${new Date().getFullYear()} Ailydian. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({
        to: user.email,
        subject: '🔐 Reset Your Password - Ailydian',
        html
    });
}

/**
 * Send 2FA backup codes email
 */
async function send2FABackupCodesEmail(user, backupCodes) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your 2FA Backup Codes - Ailydian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #1a202c; font-size: 28px; font-weight: 600;">Ailydian</h1>
                            <p style="margin: 10px 0 0; color: #1a202c; opacity: 0.8; font-size: 14px;">2FA Backup Codes</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">Your 2FA Backup Codes</h2>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Hi ${user.name},
                            </p>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                You've successfully enabled Two-Factor Authentication (2FA) for your Ailydian account. Here are your backup codes that can be used if you lose access to your authenticator app.
                            </p>

                            <!-- Backup Codes -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border: 2px solid #43e97b; border-radius: 6px;">
                                <p style="margin: 0 0 15px; color: #1a202c; font-size: 14px; font-weight: 600;">
                                    BACKUP CODES (Save these securely):
                                </p>
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    ${backupCodes.map((code, i) => `
                                        <tr>
                                            <td style="font-family: 'Courier New', monospace; font-size: 16px; color: #2d3748; padding: 8px; ${i % 2 === 0 ? 'background-color: #edf2f7;' : ''}">
                                                ${i + 1}. <strong>${code}</strong>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>

                            <p style="margin: 20px 0; color: #c53030; font-size: 14px; line-height: 1.6; padding: 15px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                                ⚠️ <strong>Important:</strong> Each backup code can only be used once. Store them in a secure place like a password manager.
                            </p>

                            <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                If you lose your authenticator app and run out of backup codes, please contact our support team.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                                © ${new Date().getFullYear()} Ailydian. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({
        to: user.email,
        subject: '🔐 Your 2FA Backup Codes - Ailydian',
        html
    });
}

/**
 * Send account lockout notification email
 */
async function sendAccountLockoutEmail(user, lockDuration) {
    const lockMinutes = Math.ceil(lockDuration / 60);
    const appUrl = process.env.APP_URL || 'http://localhost:3100';
    const supportUrl = `${appUrl}/help.html`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Security Alert - Ailydian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔒 Security Alert</h1>
                            <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">Account Temporarily Locked</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">Account Temporarily Locked</h2>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Hi ${user.name || 'there'},
                            </p>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Your Ailydian account has been temporarily locked due to multiple failed login attempts. This is a security measure to protect your account from unauthorized access.
                            </p>

                            <!-- Lock Info Box -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #1a202c; font-size: 16px; font-weight: 600;">
                                    ⏱️ Lockout Duration
                                </p>
                                <p style="margin: 0; color: #c53030; font-size: 20px; font-weight: 700;">
                                    ${lockMinutes} minute${lockMinutes > 1 ? 's' : ''}
                                </p>
                                <p style="margin: 10px 0 0; color: #718096; font-size: 14px;">
                                    After this time, you'll be able to log in again.
                                </p>
                            </div>

                            <h3 style="margin: 30px 0 15px; color: #1a202c; font-size: 18px; font-weight: 600;">What should I do?</h3>

                            <ul style="margin: 0 0 20px; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                                <li><strong>Wait ${lockMinutes} minutes</strong> and try logging in again</li>
                                <li>Make sure you're using the correct password</li>
                                <li>If you forgot your password, use the "Forgot Password" link on the login page</li>
                                <li>Consider enabling Two-Factor Authentication (2FA) for additional security</li>
                            </ul>

                            <!-- Security Notice -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #fffaf0; border-left: 4px solid #ed8936; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #1a202c; font-size: 14px; font-weight: 600;">
                                    ⚠️ Wasn't you trying to log in?
                                </p>
                                <p style="margin: 0 0 15px; color: #744210; font-size: 14px; line-height: 1.6;">
                                    If you didn't attempt to log in, someone may be trying to access your account. We recommend:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #744210; font-size: 14px; line-height: 1.6;">
                                    <li>Changing your password immediately after the lockout period</li>
                                    <li>Enabling Two-Factor Authentication (2FA)</li>
                                    <li>Contacting our support team if you need assistance</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${supportUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                                            Get Help & Support
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                                © ${new Date().getFullYear()} Ailydian. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                This is an automated security notification. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({
        to: user.email,
        subject: '🔒 Security Alert: Account Temporarily Locked - Ailydian',
        html
    });
}

/**
 * Send login notification email (new device/location)
 */
async function sendLoginNotificationEmail(user, loginInfo) {
    const {
        ipAddress,
        userAgent,
        timestamp,
        location = 'Unknown',
        device = 'Unknown Device',
        browser = 'Unknown Browser'
    } = loginInfo;

    const appUrl = process.env.APP_URL || 'http://localhost:3100';
    const securityUrl = `${appUrl}/settings.html?tab=security`;
    const supportUrl = `${appUrl}/help.html`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Login Alert - Ailydian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 New Login Detected</h1>
                            <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">Security Notification</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">New Login to Your Account</h2>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Hi ${user.name || 'there'},
                            </p>

                            <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                We detected a new login to your Ailydian account. If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
                            </p>

                            <!-- Login Details Box -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <h3 style="margin: 0 0 15px; color: #1a202c; font-size: 16px; font-weight: 600;">Login Details:</h3>

                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; width: 140px; vertical-align: top;">
                                            <strong>⏰ Time:</strong>
                                        </td>
                                        <td style="color: #2d3748; font-size: 14px;">
                                            ${new Date(timestamp).toLocaleString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZoneName: 'short'
                                            })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; vertical-align: top; padding-top: 10px;">
                                            <strong>📱 Device:</strong>
                                        </td>
                                        <td style="color: #2d3748; font-size: 14px; padding-top: 10px;">
                                            ${device}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; vertical-align: top; padding-top: 10px;">
                                            <strong>🌐 Browser:</strong>
                                        </td>
                                        <td style="color: #2d3748; font-size: 14px; padding-top: 10px;">
                                            ${browser}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; vertical-align: top; padding-top: 10px;">
                                            <strong>📍 Location:</strong>
                                        </td>
                                        <td style="color: #2d3748; font-size: 14px; padding-top: 10px;">
                                            ${location}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; vertical-align: top; padding-top: 10px;">
                                            <strong>🌍 IP Address:</strong>
                                        </td>
                                        <td style="color: #2d3748; font-size: 14px; font-family: 'Courier New', monospace; padding-top: 10px;">
                                            ${ipAddress}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Was This You? -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #ebf8ff; border-left: 4px solid #4299e1; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #1a202c; font-size: 16px; font-weight: 600;">
                                    ✅ Was this you?
                                </p>
                                <p style="margin: 0; color: #2c5282; font-size: 14px; line-height: 1.6;">
                                    If you recognize this login, no action is needed. We're just keeping you informed for your security.
                                </p>
                            </div>

                            <!-- Security Warning -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #1a202c; font-size: 16px; font-weight: 600;">
                                    ⚠️ Didn't recognize this login?
                                </p>
                                <p style="margin: 0 0 15px; color: #742a2a; font-size: 14px; line-height: 1.6;">
                                    If this wasn't you, your account may be compromised. Take action immediately:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #742a2a; font-size: 14px; line-height: 1.8;">
                                    <li>Change your password right away</li>
                                    <li>Enable Two-Factor Authentication (2FA)</li>
                                    <li>Review your account activity</li>
                                    <li>Contact our support team</li>
                                </ul>
                            </div>

                            <!-- CTA Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding-right: 10px;">
                                        <a href="${securityUrl}" style="display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                                            Security Settings
                                        </a>
                                    </td>
                                    <td align="center" style="padding-left: 10px;">
                                        <a href="${supportUrl}" style="display: inline-block; padding: 14px 24px; background-color: #e2e8f0; color: #2d3748; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                                            Get Support
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0; color: #718096; font-size: 13px; line-height: 1.6; text-align: center;">
                                💡 Tip: Enable 2FA for an extra layer of security on your account.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px; color: #718096; font-size: 13px;">
                                © ${new Date().getFullYear()} Ailydian. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                This is an automated security notification. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return await sendEmail({
        to: user.email,
        subject: '🔐 New Login to Your Ailydian Account',
        html
    });
}

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    send2FABackupCodesEmail,
    sendAccountLockoutEmail,
    sendLoginNotificationEmail,
    generateVerificationToken
};
