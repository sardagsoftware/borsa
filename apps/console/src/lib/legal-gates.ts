/**
 * ⚖️ Legal Gate Utilities
 * Partner status validation and legal gate CTAs
 * 
 * @module lib/legal-gates
 * @white-hat Compliant
 */

export type PartnerStatus = 'partner_ok' | 'partner_required' | 'sandbox' | 'disabled';

export interface LegalGate {
  connectorId: string;
  status: PartnerStatus;
  reason?: string;
  applyUrl?: string;
  docsUrl?: string;
}

export interface PartnerApplication {
  connectorId: string;
  companyName: string;
  email: string;
  useCase: string;
  website?: string;
}

/**
 * Check if connector requires partner approval
 */
export function requiresPartnerApproval(status: PartnerStatus): boolean {
  return status === 'partner_required';
}

/**
 * Check if connector is accessible
 */
export function isConnectorAccessible(status: PartnerStatus): boolean {
  return status === 'partner_ok' || status === 'sandbox';
}

/**
 * Get legal gate message (TR)
 */
export function getLegalGateMessage(status: PartnerStatus, connectorName?: string): string {
  const name = connectorName || 'Bu bağlayıcı';
  
  switch (status) {
    case 'partner_ok':
      return `${name} kullanıma hazır.`;
    
    case 'partner_required':
      return `${name} için partner onayı gerekiyor. Başvuru yapmak için aşağıdaki butona tıklayın.`;
    
    case 'sandbox':
      return `${name} test modunda çalışıyor. Gerçek veriler için partner başvurusu yapın.`;
    
    case 'disabled':
      return `${name} şu anda kullanılamıyor.`;
    
    default:
      return 'Durum bilinmiyor.';
  }
}

/**
 * Get CTA button text based on status
 */
export function getCTAText(status: PartnerStatus): string | null {
  switch (status) {
    case 'partner_required':
      return 'Partner Başvurusu Yap';
    
    case 'sandbox':
      return 'Gerçek Veri İçin Başvur';
    
    default:
      return null;
  }
}

/**
 * Get status badge style
 */
export function getStatusBadgeStyle(status: PartnerStatus): {
  backgroundColor: string;
  color: string;
  text: string;
} {
  switch (status) {
    case 'partner_ok':
      return {
        backgroundColor: 'rgba(46, 213, 115, 0.2)',
        color: '#2ed573',
        text: 'Aktif',
      };
    
    case 'partner_required':
      return {
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        color: '#ff9f40',
        text: 'Onay Gerekli',
      };
    
    case 'sandbox':
      return {
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        color: '#3498db',
        text: 'Test Modu',
      };
    
    case 'disabled':
      return {
        backgroundColor: 'rgba(255, 71, 87, 0.2)',
        color: '#ff4757',
        text: 'Devre Dışı',
      };
    
    default:
      return {
        backgroundColor: 'rgba(200, 200, 200, 0.2)',
        color: '#888',
        text: 'Bilinmiyor',
      };
  }
}

/**
 * Submit partner application
 */
export async function submitPartnerApplication(
  application: PartnerApplication
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/partners/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(application),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Başvuru gönderilemedi',
      };
    }

    return {
      success: true,
      message: 'Başvurunuz alındı! En kısa sürede size dönüş yapacağız.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ağ hatası. Lütfen tekrar deneyin.',
    };
  }
}

/**
 * Get partner application URL for connector
 */
export function getPartnerApplicationUrl(connectorId: string): string {
  return `/partner-apply?connector=${connectorId}`;
}

/**
 * Validate partner application data
 */
export function validatePartnerApplication(
  application: Partial<PartnerApplication>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!application.connectorId) {
    errors.push('Bağlayıcı seçilmemiş');
  }

  if (!application.companyName || application.companyName.trim().length < 2) {
    errors.push('Geçerli bir şirket adı giriniz');
  }

  if (!application.email || !isValidEmail(application.email)) {
    errors.push('Geçerli bir e-posta adresi giriniz');
  }

  if (!application.useCase || application.useCase.trim().length < 20) {
    errors.push('Kullanım amacını detaylı açıklayınız (min. 20 karakter)');
  }

  if (application.website && !isValidUrl(application.website)) {
    errors.push('Geçerli bir web sitesi adresi giriniz');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper: Email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Helper: URL validation
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get KVKK/GDPR compliant data retention notice
 */
export function getDataRetentionNotice(): string {
  return `
🔒 Veri Gizliliği: Başvuru bilgileriniz KVKK/GDPR uyumlu olarak işlenir.
Verileriniz sadece partner başvurunuzun değerlendirilmesi için kullanılır
ve en fazla 7 gün süreyle saklanır.
  `.trim();
}

console.log('✅ Legal gate utilities initialized');
