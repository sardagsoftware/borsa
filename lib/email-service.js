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
        console.log('[EMAIL_SERVICE] Attempting to load SendGrid...');
        try {
            const sgMail = require('@sendgrid/mail');
            console.log('[EMAIL_SERVICE] SendGrid module loaded successfully');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('[EMAIL_SERVICE] SendGrid API key set');
            return {
                type: 'sendgrid',
                client: sgMail
            };
        } catch (loadError) {
            console.error('[EMAIL_SERVICE] Failed to load SendGrid:', loadError.message);
            console.error('[EMAIL_SERVICE] Load error stack:', loadError.stack);
            throw loadError;
        }
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
    console.log('[EMAIL_SERVICE] ====== EMAIL SEND START ======');

    let emailClient;
    try {
        emailClient = getEmailClient();
        console.log('[EMAIL_SERVICE] Client initialized successfully');
    } catch (clientError) {
        console.error('[EMAIL_SERVICE] Failed to initialize email client:', clientError.message);
        console.error('[EMAIL_SERVICE] Client error stack:', clientError.stack);
        throw clientError;
    }

    const fromEmail = process.env.FROM_EMAIL || 'info@ailydian.com';
    const fromName = process.env.FROM_NAME || 'AILYDIAN';

    console.log('[EMAIL_SERVICE] Client type:', emailClient.type);
    console.log('[EMAIL_SERVICE] From:', fromEmail);
    console.log('[EMAIL_SERVICE] To:', to);
    console.log('[EMAIL_SERVICE] Subject:', subject);
    console.log('[EMAIL_SERVICE] SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('[EMAIL_SERVICE] SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length || 0);

    try {
        if (emailClient.type === 'sendgrid') {
            // SendGrid
            const msg = {
                to,
                from: { email: fromEmail, name: fromName },
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '').substring(0, 1000)
            };

            console.log('[EMAIL_SERVICE] Calling SendGrid API...');
            const response = await emailClient.client.send(msg);
            console.log('[EMAIL_SERVICE] SendGrid response status:', response[0]?.statusCode);
            console.log('[EMAIL_SERVICE] Email sent via SendGrid to', to);
        } else if (emailClient.type === 'nodemailer') {
            // Nodemailer
            await emailClient.client.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '').substring(0, 1000)
            });

            console.log('[EMAIL_SERVICE] Email sent via SMTP to', to);
        } else {
            // Console fallback (development)
            console.log('[EMAIL_SERVICE] WARNING: No email service configured!');
            console.log('[EMAIL_SERVICE] Email (Console Mode)');
            console.log('[EMAIL_SERVICE] To:', to);
            console.log('[EMAIL_SERVICE] Subject:', subject);
        }

        console.log('[EMAIL_SERVICE] ====== EMAIL SEND SUCCESS ======');
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_SERVICE] ====== EMAIL SEND ERROR ======');
        console.error('[EMAIL_SERVICE] Error name:', error.name);
        console.error('[EMAIL_SERVICE] Error message:', error.message);
        console.error('[EMAIL_SERVICE] Error code:', error.code);
        console.error('[EMAIL_SERVICE] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.response) {
            console.error('[EMAIL_SERVICE] Response status:', error.response?.statusCode);
            console.error('[EMAIL_SERVICE] Response body:', JSON.stringify(error.response?.body));
            console.error('[EMAIL_SERVICE] Response headers:', JSON.stringify(error.response?.headers));
        }
        // Log stack trace
        console.error('[EMAIL_SERVICE] Stack trace:', error.stack);
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
 * Send password reset email - AILYDIAN Ultra Premium Template
 * Military-grade security with elegant dark theme design
 * Turkish language - Modern UI/UX
 */
async function sendPasswordResetEmail(user, token) {
    const appUrl = process.env.APP_URL || 'https://www.ailydian.com';
    const resetUrl = `${appUrl}/reset-password.html?token=${token}`;
    const userName = user.name || user.display_name || 'Degerli Kullanici';
    const currentYear = new Date().getFullYear();
    const expiryTime = '60 dakika';

    console.log('[EMAIL_SERVICE] Preparing password reset email for:', user.email);
    console.log('[EMAIL_SERVICE] Reset URL:', resetUrl);

    const html = `
<!DOCTYPE html>
<html lang="tr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Sifre Sifirlama - AILYDIAN</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <style>
        table {border-collapse: collapse;}
        td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: 'Segoe UI', Arial, sans-serif;}
    </style>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table { border-spacing: 0; border-collapse: collapse; }
        td { padding: 0; }
        img { border: 0; display: block; }

        .button-td, .button-a {
            transition: all 100ms ease-in;
        }

        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: auto !important; }
            .stack-column { display: block !important; width: 100% !important; }
            .center-on-mobile { text-align: center !important; }
            .mobile-padding { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

    <!-- Preheader -->
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
        AILYDIAN hesabiniz icin guvenli sifre sifirlama baglantisi - ${expiryTime} gecerli &#8199;&#65279;&#847;
    </div>

    <!-- Email Body -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(180deg,#050505 0%,#0a0a0a 50%,#050505 100%);">
        <tr>
            <td align="center" style="padding:40px 10px;">

                <!-- Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;">

                    <!-- Logo Section -->
                    <tr>
                        <td align="center" style="padding:0 0 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:16px 32px;background:linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.02) 100%);border-radius:16px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(10px);">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding-right:12px;vertical-align:middle;">
                                                    <div style="width:40px;height:40px;background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                                                        <span style="font-size:20px;">&#127815;</span>
                                                    </div>
                                                </td>
                                                <td style="vertical-align:middle;">
                                                    <span style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;font-family:'Inter',sans-serif;">AILYDIAN</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(145deg,#111111 0%,#0d0d0d 100%);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.05);">

                                <!-- Top Gradient Bar -->
                                <tr>
                                    <td style="height:3px;background:linear-gradient(90deg,#8b5cf6 0%,#6366f1 25%,#ec4899 50%,#6366f1 75%,#8b5cf6 100%);"></td>
                                </tr>

                                <!-- Content Area -->
                                <tr>
                                    <td class="mobile-padding" style="padding:48px;">

                                        <!-- Security Badge -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                                            <tr>
                                                <td style="padding:10px 20px;background:linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(99,102,241,0.1) 100%);border-radius:100px;border:1px solid rgba(139,92,246,0.3);">
                                                    <span style="font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:2px;font-weight:600;">&#128274; Guvenli Baglanti</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Title -->
                                        <h1 style="margin:0 0 20px;font-size:32px;font-weight:700;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">
                                            Sifre Sifirlama Talebi
                                        </h1>

                                        <!-- Subtitle -->
                                        <p style="margin:0 0 32px;font-size:16px;color:#71717a;line-height:1.7;">
                                            Merhaba <span style="color:#ffffff;font-weight:600;">${userName}</span>,<br><br>
                                            AILYDIAN hesabiniz icin bir sifre sifirlama talebi aldik.
                                            Asagidaki butona tiklayarak guvenli bir sekilde yeni sifrenizi belirleyebilirsiniz.
                                        </p>

                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:40px 0;">
                                            <tr>
                                                <td align="center">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td class="button-td" style="border-radius:14px;background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);box-shadow:0 10px 40px -10px rgba(139,92,246,0.5),0 0 0 1px rgba(255,255,255,0.1) inset;">
                                                                <a class="button-a" href="${resetUrl}" target="_blank" style="display:inline-block;padding:20px 48px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;font-family:'Inter',sans-serif;">
                                                                    &#128275; Sifremi Sifirla
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Divider -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
                                            <tr>
                                                <td style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);"></td>
                                            </tr>
                                        </table>

                                        <!-- Link Fallback -->
                                        <p style="margin:0 0 12px;font-size:13px;color:#52525b;">
                                            Buton calismiyorsa asagidaki baglantiya tiklayabilirsiniz:
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding:16px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
                                                    <a href="${resetUrl}" target="_blank" style="font-size:12px;color:#8b5cf6;word-break:break-all;text-decoration:none;font-family:monospace;">${resetUrl}</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Timer Info -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:32px;">
                                            <tr>
                                                <td style="padding:20px;background:linear-gradient(135deg,rgba(251,191,36,0.1) 0%,rgba(245,158,11,0.05) 100%);border:1px solid rgba(251,191,36,0.2);border-radius:16px;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="padding-right:16px;vertical-align:top;">
                                                                <span style="font-size:24px;">&#9200;</span>
                                                            </td>
                                                            <td>
                                                                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#fbbf24;">
                                                                    Baglanti Suresi
                                                                </p>
                                                                <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.5;">
                                                                    Bu baglanti <strong>${expiryTime}</strong> icerisinde gecerliliyini yitirecektir.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Security Warning -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
                                            <tr>
                                                <td style="padding:20px;background:linear-gradient(135deg,rgba(239,68,68,0.1) 0%,rgba(220,38,38,0.05) 100%);border:1px solid rgba(239,68,68,0.2);border-radius:16px;border-left:4px solid #ef4444;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="padding-right:16px;vertical-align:top;">
                                                                <span style="font-size:24px;">&#9888;&#65039;</span>
                                                            </td>
                                                            <td>
                                                                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#f87171;">
                                                                    Guvenlik Uyarisi
                                                                </p>
                                                                <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
                                                                    Bu talebi siz yapmadiysaniz, bu e-postayi gormezden gelin.
                                                                    Hesabiniz guvende kalacaktir ve herhangi bir islem yapilmayacaktir.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Security Features -->
                    <tr>
                        <td align="center" style="padding:32px 0 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding:12px 24px;background:linear-gradient(135deg,rgba(34,197,94,0.1) 0%,rgba(22,163,74,0.05) 100%);border-radius:100px;border:1px solid rgba(34,197,94,0.2);">
                                        <span style="font-size:12px;color:#4ade80;letter-spacing:0.5px;">&#128737;&#65039; TLS 1.3 Sifreli &bull; DKIM Imzali &bull; SPF Dogrulanmis</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:32px 0 0;">
                            <p style="margin:0 0 8px;font-size:13px;color:#52525b;">
                                &copy; ${currentYear} AILYDIAN. Tum haklari saklidir.
                            </p>
                            <p style="margin:0;font-size:11px;color:#3f3f46;">
                                Bu e-posta guvenlik amaciyla otomatik olarak gonderilmistir.
                            </p>
                            <p style="margin:16px 0 0;font-size:11px;color:#3f3f46;">
                                <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">www.ailydian.com</a>
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

    console.log('[EMAIL_SERVICE] Sending password reset email...');

    const result = await sendEmail({
        to: user.email,
        subject: 'Sifre Sifirlama Talebi - AILYDIAN',
        html
    });

    console.log('[EMAIL_SERVICE] Password reset email sent successfully to:', user.email);

    return result;
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
    // Check if user has email notifications enabled
    if (user.id) {
        const enabled = await isEmailNotificationEnabled(user.id);
        if (!enabled) {
            console.log('[EMAIL_SERVICE] Email notifications disabled for user', user.id);
            return { success: true, skipped: true, reason: 'email_notifications_disabled' };
        }
    }

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

/**
 * Check if user has email notifications enabled
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function isEmailNotificationEnabled(userId) {
    try {
        const { chatSettings } = require('../api/chat-auth/_lib/db');
        const settings = await chatSettings.get(userId);
        if (!settings) return true; // Default to enabled
        return settings.email_notifications !== false && settings.email_notifications !== 'false';
    } catch (e) {
        return true; // Default to enabled on error
    }
}

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    send2FABackupCodesEmail,
    sendAccountLockoutEmail,
    sendLoginNotificationEmail,
    generateVerificationToken,
    isEmailNotificationEnabled
};
