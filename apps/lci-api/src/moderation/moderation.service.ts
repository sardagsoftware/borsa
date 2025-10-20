// LCI API - Moderation Service
// White-hat: PII detection and masking for KVKK/GDPR compliance

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  // PII patterns for Turkish context
  private readonly patterns = {
    // Turkish ID number (TC Kimlik No): 11 digits
    turkishId: /\b[1-9]\d{10}\b/g,

    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // Phone numbers (Turkish formats)
    // Formats: 0(5XX) XXX XX XX, 05XXXXXXXXX, +90 5XX XXX XX XX
    phoneNumber: /(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,

    // IBAN (Turkish)
    iban: /\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/gi,

    // Credit card numbers (any format with spaces/dashes)
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

    // IP addresses
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

    // Social security-like numbers
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

    // Address patterns (basic detection)
    // Looks for: "Mahallesi", "Sokak", "Caddesi", etc.
    address: /\b\d+\.?\s+(Sokak|Sokağı|Cadde|Caddesi|Mahallesi|Mahalle|Apartmanı|Blok|No|Kat|Daire)[^.]{0,50}/gi,

    // Names with titles (Bey, Hanım, Bay, Bayan)
    honorificName: /\b[A-ZİĞÜŞÖÇ][a-züığşöç]+\s+(Bey|Hanım|Bay|Bayan|Efendi)\b/g,
  };

  /**
   * Detects PII in text
   * Returns array of detected PII types
   */
  detectPII(text: string): string[] {
    const detected: string[] = [];

    if (this.patterns.turkishId.test(text)) {
      detected.push('turkish_id');
    }
    if (this.patterns.email.test(text)) {
      detected.push('email');
    }
    if (this.patterns.phoneNumber.test(text)) {
      detected.push('phone');
    }
    if (this.patterns.iban.test(text)) {
      detected.push('iban');
    }
    if (this.patterns.creditCard.test(text)) {
      detected.push('credit_card');
    }
    if (this.patterns.ipAddress.test(text)) {
      detected.push('ip_address');
    }
    if (this.patterns.ssn.test(text)) {
      detected.push('ssn');
    }
    if (this.patterns.address.test(text)) {
      detected.push('address');
    }
    if (this.patterns.honorificName.test(text)) {
      detected.push('honorific_name');
    }

    return detected;
  }

  /**
   * Masks PII in text
   * Returns masked text and metadata about what was masked
   */
  maskPII(text: string): { maskedText: string; maskCount: number; types: string[] } {
    let maskedText = text;
    let maskCount = 0;
    const types: Set<string> = new Set();

    // Mask Turkish ID numbers
    maskedText = maskedText.replace(this.patterns.turkishId, (match) => {
      maskCount++;
      types.add('turkish_id');
      return `TC****${match.slice(-2)}`; // Show last 2 digits
    });

    // Mask emails
    maskedText = maskedText.replace(this.patterns.email, (match) => {
      maskCount++;
      types.add('email');
      const [local, domain] = match.split('@');
      return `${local.charAt(0)}***@${domain}`;
    });

    // Mask phone numbers
    maskedText = maskedText.replace(this.patterns.phoneNumber, (match) => {
      maskCount++;
      types.add('phone');
      // Keep country code and last 2 digits
      const cleaned = match.replace(/[\s()-]/g, '');
      return `${cleaned.slice(0, 3)} *** ** ${cleaned.slice(-2)}`;
    });

    // Mask IBAN
    maskedText = maskedText.replace(this.patterns.iban, (match) => {
      maskCount++;
      types.add('iban');
      const cleaned = match.replace(/\s/g, '');
      return `${cleaned.slice(0, 4)} **** **** **** **** **** ${cleaned.slice(-2)}`;
    });

    // Mask credit cards
    maskedText = maskedText.replace(this.patterns.creditCard, (match) => {
      maskCount++;
      types.add('credit_card');
      return '**** **** **** ****';
    });

    // Mask IP addresses
    maskedText = maskedText.replace(this.patterns.ipAddress, (match) => {
      maskCount++;
      types.add('ip_address');
      const parts = match.split('.');
      return `${parts[0]}.${parts[1]}.***.**`;
    });

    // Mask SSN
    maskedText = maskedText.replace(this.patterns.ssn, (match) => {
      maskCount++;
      types.add('ssn');
      return '***-**-****';
    });

    // Mask addresses (full redaction)
    maskedText = maskedText.replace(this.patterns.address, (match) => {
      maskCount++;
      types.add('address');
      return '[ADRES GİZLENDİ]';
    });

    // Mask names with honorifics
    maskedText = maskedText.replace(this.patterns.honorificName, (match) => {
      maskCount++;
      types.add('honorific_name');
      const parts = match.split(' ');
      const honorific = parts[parts.length - 1];
      return `[İSİM] ${honorific}`;
    });

    if (maskCount > 0) {
      this.logger.warn(`Masked ${maskCount} PII instances: ${Array.from(types).join(', ')}`);
    }

    return {
      maskedText,
      maskCount,
      types: Array.from(types),
    };
  }

  /**
   * Checks if text contains profanity or inappropriate content
   * Returns true if profanity detected
   */
  containsProfanity(text: string): boolean {
    // Basic Turkish profanity list (starter set - expand in production)
    const profanityList = [
      // Explicit profanity should be added here
      // Using ** to avoid including actual profane words in code
      'küfür', // placeholder
    ];

    const lowerText = text.toLowerCase();
    return profanityList.some((word) => lowerText.includes(word));
  }

  /**
   * Moderates complaint text
   * Returns moderated text and flags
   */
  async moderateComplaint(
    title: string,
    body: string,
  ): Promise<{
    title: string;
    body: string;
    flags: {
      hasPII: boolean;
      hasProfanity: boolean;
      piiTypes: string[];
      piiMaskCount: number;
    };
  }> {
    // Detect PII
    const titlePII = this.detectPII(title);
    const bodyPII = this.detectPII(body);
    const allPII = [...new Set([...titlePII, ...bodyPII])];

    // Mask PII
    const maskedTitle = this.maskPII(title);
    const maskedBody = this.maskPII(body);

    // Check profanity
    const titleProfanity = this.containsProfanity(title);
    const bodyProfanity = this.containsProfanity(body);

    return {
      title: maskedTitle.maskedText,
      body: maskedBody.maskedText,
      flags: {
        hasPII: allPII.length > 0,
        hasProfanity: titleProfanity || bodyProfanity,
        piiTypes: allPII,
        piiMaskCount: maskedTitle.maskCount + maskedBody.maskCount,
      },
    };
  }

  /**
   * Validates if text is safe to publish
   * Returns validation result with reasons
   */
  validateForPublication(text: string): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check for PII
    const piiTypes = this.detectPII(text);
    if (piiTypes.length > 0) {
      reasons.push(`Kişisel veri içeriyor: ${piiTypes.join(', ')}`);
    }

    // Check for profanity
    if (this.containsProfanity(text)) {
      reasons.push('Uygunsuz içerik tespit edildi');
    }

    // Check minimum length (after trimming)
    if (text.trim().length < 10) {
      reasons.push('Metin çok kısa');
    }

    return {
      isValid: reasons.length === 0,
      reasons,
    };
  }
}
