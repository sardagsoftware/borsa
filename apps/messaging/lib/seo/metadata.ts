/**
 * SHARD_11.2 - SEO Metadata Helper
 * Generate meta tags for pages
 *
 * Security: No sensitive data in meta tags
 * White Hat: Privacy-preserving SEO
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Default metadata
 */
const DEFAULT_METADATA: PageMetadata = {
  title: 'Ailydian Messaging - E2EE Secure Chat',
  description: 'Uçtan uca şifrelenmiş güvenli mesajlaşma platformu. Signal protokolü ile korunan, özel ve güvenli iletişim.',
  keywords: [
    'e2ee',
    'güvenli mesajlaşma',
    'şifreli chat',
    'signal protokolü',
    'privacy',
    'secure messaging',
    'encrypted chat'
  ],
  ogImage: '/og-image.png',
  ogType: 'website'
};

/**
 * Page-specific metadata
 */
export const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    title: 'Ailydian Messaging - E2EE Secure Chat',
    description: 'Uçtan uca şifrelenmiş güvenli mesajlaşma platformu. Signal protokolü, WebRTC ile korunan özel iletişim.',
    keywords: ['e2ee', 'güvenli mesajlaşma', 'şifreli chat', 'webrtc', 'signal protokolü'],
    ogType: 'website'
  },
  privacy: {
    title: 'Gizlilik Politikası - Ailydian Messaging',
    description: 'Ailydian Messaging gizlilik politikası. Verileriniz nasıl korunur ve işlenir.',
    keywords: ['gizlilik', 'privacy policy', 'veri koruma', 'gdpr'],
    noindex: false
  },
  terms: {
    title: 'Kullanım Koşulları - Ailydian Messaging',
    description: 'Ailydian Messaging kullanım koşulları ve hizmet şartları.',
    keywords: ['terms', 'kullanım koşulları', 'hizmet şartları'],
    noindex: false
  },
  security: {
    title: 'Güvenlik - Ailydian Messaging',
    description: 'Ailydian Messaging güvenlik özellikleri. E2EE, Signal protokolü, Zero-knowledge mimarisi.',
    keywords: ['güvenlik', 'e2ee', 'signal', 'şifreleme', 'zero-knowledge'],
    noindex: false
  },
  chat: {
    title: 'Chat - Ailydian Messaging',
    description: 'Güvenli mesajlaşma',
    noindex: true, // Private
    nofollow: true
  },
  dashboard: {
    title: 'Dashboard - Ailydian Messaging',
    description: 'Kullanıcı dashboard',
    noindex: true, // Private
    nofollow: true
  }
};

/**
 * Get metadata for page
 */
export function getPageMetadata(pageName: string): PageMetadata {
  return {
    ...DEFAULT_METADATA,
    ...PAGE_METADATA[pageName]
  };
}

/**
 * Generate meta tags HTML
 */
export function generateMetaTags(metadata: PageMetadata, baseUrl: string = 'https://messaging.ailydian.com'): string {
  const tags: string[] = [];

  // Basic meta tags
  tags.push(`<title>${metadata.title}</title>`);
  tags.push(`<meta name="description" content="${metadata.description}" />`);

  if (metadata.keywords && metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}" />`);
  }

  // Robots
  if (metadata.noindex || metadata.nofollow) {
    const robots = [];
    if (metadata.noindex) robots.push('noindex');
    if (metadata.nofollow) robots.push('nofollow');
    tags.push(`<meta name="robots" content="${robots.join(', ')}" />`);
  }

  // Canonical
  if (metadata.canonical) {
    tags.push(`<link rel="canonical" href="${baseUrl}${metadata.canonical}" />`);
  }

  // Open Graph
  tags.push(`<meta property="og:title" content="${metadata.title}" />`);
  tags.push(`<meta property="og:description" content="${metadata.description}" />`);
  tags.push(`<meta property="og:type" content="${metadata.ogType || 'website'}" />`);

  if (metadata.ogImage) {
    tags.push(`<meta property="og:image" content="${baseUrl}${metadata.ogImage}" />`);
  }

  // Twitter Card
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${metadata.title}" />`);
  tags.push(`<meta name="twitter:description" content="${metadata.description}" />`);

  if (metadata.ogImage) {
    tags.push(`<meta name="twitter:image" content="${baseUrl}${metadata.ogImage}" />`);
  }

  return tags.join('\n');
}

/**
 * Generate structured data (JSON-LD)
 */
export function generateStructuredData(type: 'Organization' | 'WebApplication' | 'SoftwareApplication'): string {
  const data: any = {
    '@context': 'https://schema.org',
    '@type': type
  };

  if (type === 'Organization') {
    data.name = 'Ailydian';
    data.url = 'https://messaging.ailydian.com';
    data.logo = 'https://messaging.ailydian.com/logo.png';
    data.description = 'E2EE güvenli mesajlaşma platformu';
    data.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@ailydian.com'
    };
  } else if (type === 'WebApplication' || type === 'SoftwareApplication') {
    data.name = 'Ailydian Messaging';
    data.url = 'https://messaging.ailydian.com';
    data.applicationCategory = 'CommunicationApplication';
    data.operatingSystem = 'Web, iOS, Android';
    data.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    };
    data.description = 'Uçtan uca şifrelenmiş güvenli mesajlaşma platformu';
    data.featureList = [
      'E2EE şifreleme',
      'Signal protokolü',
      'WebRTC video/audio',
      'Dosya paylaşımı',
      'Konum paylaşımı'
    ];
  }

  return `<script type="application/ld+json">${JSON.stringify(data, null, 2)}</script>`;
}

/**
 * Generate security.txt (RFC 9116)
 */
export function generateSecurityTxt(): string {
  return `# Ailydian Messaging Security Contact
# RFC 9116 compliant

Contact: mailto:security@ailydian.com
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Preferred-Languages: en, tr
Canonical: https://messaging.ailydian.com/.well-known/security.txt
Policy: https://messaging.ailydian.com/security
Acknowledgments: https://messaging.ailydian.com/security/hall-of-fame

# Encryption
Encryption: https://messaging.ailydian.com/.well-known/pgp-key.txt

# Please report security vulnerabilities responsibly
# Do not disclose publicly until we have had time to address the issue
`;
}
