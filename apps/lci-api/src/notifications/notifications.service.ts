// LCI API - Email Notifications Service
// White-hat: Template-based email system with queue

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly env = process.env.NODE_ENV || 'development';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queues an email notification
   * White-hat: Template-based with variable substitution
   */
  async queueEmail(
    to: string,
    template: string,
    variables: Record<string, any>,
  ) {
    // Validate template exists
    const templates = this.getAvailableTemplates();
    if (!templates[template]) {
      throw new Error(`Email template not found: ${template}`);
    }

    // Generate email content from template
    const { subject, html, text } = this.renderTemplate(template, variables);

    // Save to queue
    const email = await this.prisma.emailNotification.create({
      data: {
        to,
        subject,
        template,
        variables,
        status: 'PENDING',
      },
    });

    this.logger.log(`Email queued: ${email.id} to ${to} (template: ${template})`);

    // In development, log to console instead of sending
    if (this.env === 'development') {
      this.logger.debug(`
=== EMAIL PREVIEW (Development Mode) ===
To: ${to}
Subject: ${subject}
Template: ${template}
---
${text}
======================================
`);
    }

    return email;
  }

  /**
   * Processes pending email queue
   * Called by cron job or background worker
   */
  async processPendingEmails(limit = 10) {
    const pending = await this.prisma.emailNotification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    this.logger.log(`Processing ${pending.length} pending emails`);

    for (const email of pending) {
      try {
        await this.sendEmail(email);
      } catch (error: any) {
        this.logger.error(
          `Failed to send email ${email.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Sends a single email
   * White-hat: Real email sending in production, console log in dev
   */
  private async sendEmail(email: any) {
    try {
      // Render template with variables
      const { subject, html, text } = this.renderTemplate(
        email.template,
        email.variables,
      );

      if (this.env === 'production') {
        // Production: Send real email via Nodemailer, SendGrid, AWS SES, etc.
        // await this.mailService.sendEmail({
        //   to: email.to,
        //   subject,
        //   html,
        //   text,
        // });

        this.logger.warn(
          'Production email sending not configured. Email would be sent to: ' +
            email.to,
        );
      } else {
        // Development: Console log only
        this.logger.log(`
📧 EMAIL SENT (Development Mode)
To: ${email.to}
Subject: ${subject}
---
${text}
`);
      }

      // Mark as sent
      await this.prisma.emailNotification.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email sent: ${email.id}`);
    } catch (error: any) {
      // Mark as failed
      await this.prisma.emailNotification.update({
        where: { id: email.id },
        data: {
          status: 'FAILED',
          failReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Renders email template with variables
   */
  private renderTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): EmailTemplate {
    const templates = this.getAvailableTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Simple variable substitution: {{variableName}}
    const replaceVars = (str: string) => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined
          ? String(variables[varName])
          : match;
      });
    };

    return {
      subject: replaceVars(template.subject),
      html: replaceVars(template.html),
      text: replaceVars(template.text),
    };
  }

  /**
   * Email templates registry
   * White-hat: All templates in one place for easy management
   */
  private getAvailableTemplates(): Record<string, EmailTemplate> {
    return {
      // SLA Warning - Deadline approaching
      sla_warning: {
        subject: '⚠️ SLA Uyarısı: Şikayet #{{complaintId}} süresi dolmak üzere',
        html: `
<h2>SLA Uyarısı</h2>
<p>Merhaba,</p>
<p>Aşağıdaki şikayet için SLA süresi dolmak üzere:</p>
<ul>
  <li><strong>Şikayet ID:</strong> {{complaintId}}</li>
  <li><strong>Marka:</strong> {{brandName}}</li>
  <li><strong>Başlık:</strong> {{title}}</li>
  <li><strong>Kalan Süre:</strong> {{remainingHours}} saat</li>
  <li><strong>Durum:</strong> {{status}}</li>
</ul>
<p><a href="{{dashboardUrl}}">Dashboard'a Git →</a></p>
<hr>
<p style="color: #666; font-size: 12px;">Bu bir otomatik bildirimdir - Lydian Complaint Intelligence</p>
`,
        text: `
SLA UYARISI

Şikayet #{{complaintId}} için SLA süresi dolmak üzere.

Marka: {{brandName}}
Başlık: {{title}}
Kalan Süre: {{remainingHours}} saat
Durum: {{status}}

Dashboard: {{dashboardUrl}}

---
Lydian Complaint Intelligence
`,
      },

      // SLA Breach - Deadline passed
      sla_breach: {
        subject: '🔴 SLA İhlali: Şikayet #{{complaintId}} süresi doldu',
        html: `
<h2 style="color: #dc2626;">SLA İhlali</h2>
<p>Merhaba,</p>
<p>Aşağıdaki şikayet için SLA süresi <strong>dolmuştur</strong>:</p>
<ul>
  <li><strong>Şikayet ID:</strong> {{complaintId}}</li>
  <li><strong>Marka:</strong> {{brandName}}</li>
  <li><strong>Başlık:</strong> {{title}}</li>
  <li><strong>Gecikme:</strong> {{overdueHours}} saat</li>
  <li><strong>Durum:</strong> {{status}}</li>
</ul>
<p><strong>Acil eylem gereklidir!</strong></p>
<p><a href="{{dashboardUrl}}">Dashboard'a Git →</a></p>
<hr>
<p style="color: #666; font-size: 12px;">Bu bir otomatik bildirimdir - Lydian Complaint Intelligence</p>
`,
        text: `
⚠️ SLA İHLALİ ⚠️

Şikayet #{{complaintId}} için SLA süresi DOLMUŞTUR.

Marka: {{brandName}}
Başlık: {{title}}
Gecikme: {{overdueHours}} saat
Durum: {{status}}

Acil eylem gereklidir!

Dashboard: {{dashboardUrl}}

---
Lydian Complaint Intelligence
`,
      },

      // New Complaint - Brand notification
      new_complaint: {
        subject: '📥 Yeni Şikayet: {{brandName}}',
        html: `
<h2>Yeni Şikayet Alındı</h2>
<p>Merhaba,</p>
<p>Markanız hakkında yeni bir şikayet alındı:</p>
<ul>
  <li><strong>Şikayet ID:</strong> {{complaintId}}</li>
  <li><strong>Başlık:</strong> {{title}}</li>
  <li><strong>Önem Derecesi:</strong> {{severity}}</li>
  <li><strong>Tarih:</strong> {{publishedAt}}</li>
</ul>
<p><strong>Özet:</strong> {{bodyPreview}}</p>
<p><a href="{{complaintUrl}}">Şikayeti Görüntüle →</a></p>
<hr>
<p style="color: #666; font-size: 12px;">Bu bir otomatik bildirimdir - Lydian Complaint Intelligence</p>
`,
        text: `
YENİ ŞİKAYET

Şikayet ID: {{complaintId}}
Başlık: {{title}}
Önem: {{severity}}
Tarih: {{publishedAt}}

Özet: {{bodyPreview}}

Şikayeti görüntüle: {{complaintUrl}}

---
Lydian Complaint Intelligence
`,
      },

      // Complaint Resolved
      complaint_resolved: {
        subject: '✅ Şikayet Çözüldü: #{{complaintId}}',
        html: `
<h2 style="color: #16a34a;">Şikayet Çözüldü</h2>
<p>Merhaba,</p>
<p>Şikayetiniz çözüme ulaştırıldı:</p>
<ul>
  <li><strong>Şikayet ID:</strong> {{complaintId}}</li>
  <li><strong>Başlık:</strong> {{title}}</li>
  <li><strong>Marka:</strong> {{brandName}}</li>
  <li><strong>Çözüm Tarihi:</strong> {{resolvedAt}}</li>
</ul>
<p>Lütfen çözümü değerlendirin ve geri bildiriminizi paylaşın.</p>
<p><a href="{{complaintUrl}}">Şikayeti Görüntüle →</a></p>
<hr>
<p style="color: #666; font-size: 12px;">Bu bir otomatik bildirimdir - Lydian Complaint Intelligence</p>
`,
        text: `
ŞİKAYET ÇÖZÜLDÜ ✅

Şikayet ID: {{complaintId}}
Başlık: {{title}}
Marka: {{brandName}}
Çözüm Tarihi: {{resolvedAt}}

Lütfen çözümü değerlendirin.

Şikayeti görüntüle: {{complaintUrl}}

---
Lydian Complaint Intelligence
`,
      },

      // Brand Response
      brand_response: {
        subject: '💬 Marka Yanıt Verdi: {{brandName}}',
        html: `
<h2>Marka Yanıtı</h2>
<p>Merhaba,</p>
<p>Şikayetinize marka tarafından yanıt verildi:</p>
<ul>
  <li><strong>Şikayet ID:</strong> {{complaintId}}</li>
  <li><strong>Başlık:</strong> {{title}}</li>
  <li><strong>Marka:</strong> {{brandName}}</li>
</ul>
<p><strong>Yanıt:</strong></p>
<blockquote style="border-left: 3px solid #3b82f6; padding-left: 12px; color: #374151;">
{{responseMessage}}
</blockquote>
<p><a href="{{complaintUrl}}">Şikayeti Görüntüle →</a></p>
<hr>
<p style="color: #666; font-size: 12px;">Bu bir otomatik bildirimdir - Lydian Complaint Intelligence</p>
`,
        text: `
MARKA YANITI 💬

Şikayet ID: {{complaintId}}
Başlık: {{title}}
Marka: {{brandName}}

Yanıt:
"{{responseMessage}}"

Şikayeti görüntüle: {{complaintUrl}}

---
Lydian Complaint Intelligence
`,
      },
    };
  }

  /**
   * Helper: Queue SLA warning email
   */
  async queueSlaWarning(complaintId: string, brandEmail: string, data: any) {
    return this.queueEmail(brandEmail, 'sla_warning', {
      complaintId,
      ...data,
    });
  }

  /**
   * Helper: Queue SLA breach email
   */
  async queueSlaBreach(complaintId: string, brandEmail: string, data: any) {
    return this.queueEmail(brandEmail, 'sla_breach', {
      complaintId,
      ...data,
    });
  }

  /**
   * Helper: Queue new complaint email
   */
  async queueNewComplaint(brandEmail: string, data: any) {
    return this.queueEmail(brandEmail, 'new_complaint', data);
  }

  /**
   * Helper: Queue complaint resolved email
   */
  async queueComplaintResolved(userEmail: string, data: any) {
    return this.queueEmail(userEmail, 'complaint_resolved', data);
  }

  /**
   * Helper: Queue brand response email
   */
  async queueBrandResponse(userEmail: string, data: any) {
    return this.queueEmail(userEmail, 'brand_response', data);
  }
}
