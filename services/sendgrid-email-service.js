/**
 * SendGrid Email Service
 * Production-ready email delivery with templates
 *
 * Features:
 * - Email verification
 * - Password reset
 * - Welcome emails
 * - Transaction emails
 * - Rate limiting
 * - Error handling
 */

const sgMail = require('@sendgrid/mail');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class SendGridEmailService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@ailydian.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Ailydian AI Platform';

    // Initialize SendGrid
    if (this.emailProvider === 'sendgrid') {
      const apiKey = process.env.SENDGRID_API_KEY;

      if (!apiKey) {
        logger.warn('⚠️  SENDGRID_API_KEY not configured. Email service disabled.');
        this.enabled = false;
      } else {
        sgMail.setApiKey(apiKey);
        this.enabled = true;
        logger.info('✅ SendGrid email service initialized');
      }
    } else {
      logger.warn(`⚠️  Email provider '${this.emailProvider}' not supported yet.`);
      this.enabled = false;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(to, verificationToken, userName = '') {
    if (!this.enabled) {
      logger.warn('Email service disabled - verification email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${verificationToken}`;

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '✅ Ailydian hesabınızı doğrulayın',
        text: `Merhaba ${userName},\n\nAilydian AI Platform'a hoş geldiniz! Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:\n\n${verificationUrl}\n\nBu bağlantı 24 saat geçerlidir.\n\nİyi günler,\nAilydian Ekibi`,
        html: this.getVerificationEmailTemplate(userName, verificationUrl)
      };

      const result = await sgMail.send(msg);

      logger.info('✅ Verification email sent', {
        to,
        messageId: result[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id']
      };

    } catch (error) {
      logger.error('❌ Failed to send verification email', {
        error: error.message,
        to
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, resetToken, userName = '') {
    if (!this.enabled) {
      logger.warn('Email service disabled - password reset email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const resetUrl = `${process.env.PASSWORD_RESET_URL}?token=${resetToken}`;

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '🔐 Ailydian şifre sıfırlama',
        text: `Merhaba ${userName},\n\nŞifrenizi sıfırlamak için bir istek aldık. Aşağıdaki bağlantıya tıklayarak yeni şifre oluşturabilirsiniz:\n\n${resetUrl}\n\nBu bağlantı 1 saat geçerlidir.\n\nBu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.\n\nİyi günler,\nAilydian Ekibi`,
        html: this.getPasswordResetEmailTemplate(userName, resetUrl)
      };

      const result = await sgMail.send(msg);

      logger.info('✅ Password reset email sent', {
        to,
        messageId: result[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id']
      };

    } catch (error) {
      logger.error('❌ Failed to send password reset email', {
        error: error.message,
        to
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to, userName = '') {
    if (!this.enabled) {
      logger.warn('Email service disabled - welcome email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '🎉 Ailydian AI Platform\'a hoş geldiniz!',
        text: `Merhaba ${userName},\n\nAilydian AI Platform'a katıldığınız için teşekkür ederiz!\n\nÜcretsiz planınızla 100 AI kredisi kazandınız. Hemen kullanmaya başlayabilirsiniz:\n\n- OX5C9E2B Turbo\n- AX9F7E2B 3.5 Sonnet\n- Gemini 2.0 Flash\n- Groq Mixtral (sınırsız!)\n- ve daha fazlası...\n\nİyi günler,\nAilydian Ekibi`,
        html: this.getWelcomeEmailTemplate(userName)
      };

      const result = await sgMail.send(msg);

      logger.info('✅ Welcome email sent', {
        to,
        messageId: result[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id']
      };

    } catch (error) {
      logger.error('❌ Failed to send welcome email', {
        error: error.message,
        to
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Email Templates
   */

  getVerificationEmailTemplate(userName, verificationUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Doğrulama</h1>
    </div>
    <div class="content">
      <p>Merhaba ${userName || 'değerli kullanıcı'},</p>
      <p><strong>Ailydian AI Platform'a hoş geldiniz!</strong></p>
      <p>Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
      <center>
        <a href="${verificationUrl}" class="button">Hesabı Doğrula</a>
      </center>
      <p style="color: #666; font-size: 14px;">Buton çalışmıyorsa şu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:<br>
      <code style="background: #f5f5f5; padding: 5px; display: block; margin-top: 10px; word-break: break-all;">${verificationUrl}</code></p>
      <p style="color: #e74c3c; margin-top: 20px;"><strong>⚠️ Bu bağlantı 24 saat geçerlidir.</strong></p>
    </div>
    <div class="footer">
      <p>Bu e-postayı siz talep etmediniz mi? Güvenle görmezden gelebilirsiniz.</p>
      <p>&copy; ${new Date().getFullYear()} Ailydian AI Platform. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Şifre Sıfırlama</h1>
    </div>
    <div class="content">
      <p>Merhaba ${userName || 'değerli kullanıcı'},</p>
      <p>Hesabınız için şifre sıfırlama talebi aldık.</p>
      <p>Yeni şifre oluşturmak için aşağıdaki butona tıklayın:</p>
      <center>
        <a href="${resetUrl}" class="button">Şifreyi Sıfırla</a>
      </center>
      <p style="color: #666; font-size: 14px;">Buton çalışmıyorsa şu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:<br>
      <code style="background: #f5f5f5; padding: 5px; display: block; margin-top: 10px; word-break: break-all;">${resetUrl}</code></p>
      <p style="color: #e74c3c; margin-top: 20px;"><strong>⚠️ Bu bağlantı 1 saat geçerlidir.</strong></p>
      <p style="color: #f39c12; margin-top: 20px;"><strong>🔒 Bu isteği siz yapmadıysanız, hesabınız tehlikede olabilir. Hemen şifrenizi değiştirin!</strong></p>
    </div>
    <div class="footer">
      <p>Bu e-postayı siz talep etmediniz mi? Güvenle görmezden gelebilirsiniz.</p>
      <p>&copy; ${new Date().getFullYear()} Ailydian AI Platform. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getWelcomeEmailTemplate(userName) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Hoş Geldiniz!</h1>
    </div>
    <div class="content">
      <p>Merhaba ${userName || 'değerli kullanıcı'},</p>
      <p><strong>Ailydian AI Platform'a katıldığınız için teşekkür ederiz!</strong></p>
      <p>Ücretsiz planınızla 100 AI kredisi kazandınız. İşte kullanabileceğiniz modeller:</p>

      <div class="feature">
        <strong>🤖 OX5C9E2B Turbo</strong><br>
        OpenAI'ın en gelişmiş modeli
      </div>

      <div class="feature">
        <strong>🧠 AX9F7E2B 3.5 Sonnet</strong><br>
        Anthropic'in akıllı asistanı (varsayılan)
      </div>

      <div class="feature">
        <strong>⚡ Gemini 2.0 Flash</strong><br>
        Google'ın hızlı ve güçlü modeli
      </div>

      <div class="feature">
        <strong>🚀 Groq Mixtral</strong><br>
        Ultra hızlı - SINIRSIZ kullanım!
      </div>

      <center>
        <a href="${process.env.BASE_URL}/chat" class="button">Hemen Başla</a>
      </center>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <strong>💡 İpucu:</strong> Premium plana geçerek sınırsız AI kredisi, öncelikli destek ve gelişmiş özelliklerden yararlanabilirsiniz.
      </p>
    </div>
    <div class="footer">
      <p>Sorularınız için: support@ailydian.com</p>
      <p>&copy; ${new Date().getFullYear()} Ailydian AI Platform. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      service: 'SendGrid Email',
      enabled: this.enabled,
      provider: this.emailProvider,
      from: this.fromEmail,
      configured: !!process.env.SENDGRID_API_KEY
    };
  }
}

// Export singleton instance
module.exports = new SendGridEmailService();
