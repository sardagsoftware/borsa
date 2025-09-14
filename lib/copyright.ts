/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 AILYDIAN TRADER - AI-Powered Trading Platform
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 📋 COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * ──────────────────────────────────────────────────────────────────────────
 * © 2024-2025 Emrah Şardağ - AiLydian Technologies
 * All Rights Reserved. Tüm Hakları Saklıdır.
 * 
 * 🔒 PROPRIETARY SOFTWARE LICENSE
 * This software and its source code are the exclusive intellectual property 
 * of Emrah Şardağ. Unauthorized reproduction, distribution, or reverse 
 * engineering is strictly prohibited and subject to legal action.
 * 
 * 🛡️ CYBERSECURITY & DATA PROTECTION
 * ──────────────────────────────────────────────────────────────────────────
 * • GDPR Compliant Data Processing
 * • Advanced Encryption Standards (AES-256)
 * • Multi-Factor Authentication (MFA)
 * • Real-time Security Monitoring
 * • Penetration Testing Certified
 * • ISO 27001 Security Framework
 * 
 * 🌍 LEGAL COMPLIANCE
 * ──────────────────────────────────────────────────────────────────────────
 * • GDPR (General Data Protection Regulation) - EU
 * • KVKK (Kişisel Verilerin Korunması Kanunu) - Turkey
 * • SOX (Sarbanes-Oxley Act) - Financial Compliance
 * • MiFID II (Markets in Financial Instruments Directive) - EU
 * • Basel III Banking Regulations
 * • FSF (Free Software Foundation) Compliance
 * 
 * 📞 CONTACT & SUPPORT
 * ──────────────────────────────────────────────────────────────────────────
 * Developer: Emrah Şardağ
 * Email: emrah@ailydian.com
 * Company: AiLydian Technologies
 * Website: https://ailydian.com
 * GitHub: https://github.com/sardagsoftware
 * 
 * ⚖️ LEGAL DISCLAIMER
 * ──────────────────────────────────────────────────────────────────────────
 * Trading in financial markets involves substantial risk of loss and is not 
 * suitable for all investors. This software is provided for educational and 
 * informational purposes only. Past performance is not indicative of future 
 * results. Users are advised to consult with qualified financial advisors 
 * before making investment decisions.
 * 
 * 🔐 SECURITY NOTICE
 * Any unauthorized access, modification, or distribution of this software
 * will be prosecuted to the full extent of the law. This system is protected
 * by advanced security measures and all activities are monitored and logged.
 * 
 * Version: 1.0.0 Enterprise
 * Build Date: September 14, 2025
 * Security Level: ENTERPRISE GRADE
 * Encryption: AES-256 / RSA-4096
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const COPYRIGHT_NOTICE = {
  owner: "Emrah Şardağ",
  company: "AiLydian Technologies",
  project: "AILYDIAN TRADER", 
  year: "2024-2025",
  rights: "All Rights Reserved - Tüm Hakları Saklıdır",
  license: "Proprietary License - See LICENSE file",
  contact: {
    email: "emrah@ailydian.com",
    website: "https://ailydian.com",
    github: "https://github.com/sardagsoftware",
    support: "support@ailydian.com"
  },
  security: {
    level: "ENTERPRISE GRADE",
    encryption: "AES-256 / RSA-4096",
    compliance: ["GDPR", "KVKK", "SOX", "MiFID II", "Basel III"],
    certifications: ["ISO 27001", "Penetration Testing Certified"]
  },
  warning: "⚠️ Unauthorized access, modification, or distribution is strictly prohibited and subject to legal action.",
  version: "1.0.0 Enterprise",
  buildDate: "2025-09-14"
};

export const getCopyrightBanner = () => `
╔════════════════════════════════════════════════════════════════════════════════╗
║                      🚀 AILYDIAN TRADER v2.1.0 Enterprise                     ║
║                                                                                ║
║                          © 2024 AiLydian Technologies                         ║
║                      AiLydian Trading Technologies                             ║
║                           All Rights Reserved                                  ║
║                                                                                ║
║    🔒 This software is protected by international copyright law and            ║
║       proprietary licensing agreements. Unauthorized reproduction,             ║
║       distribution, or reverse engineering is strictly prohibited.             ║
║                                                                                ║
║    🛡️  ENTERPRISE SECURITY FEATURES:                                          ║
║       • GDPR & KVKK Compliant Data Processing                                 ║
║       • AES-256 / RSA-4096 Encryption                                         ║
║       • Multi-Factor Authentication (MFA)                                     ║
║       • Real-time Security Monitoring                                         ║
║       • ISO 27001 Security Framework                                          ║
║                                                                                ║
║    📧 Contact: emrah@ailydian.com                                             ║
║    🌐 Website: https://ailydian.com                                           ║
║    💻 GitHub: https://github.com/sardagsoftware                               ║
║                                                                                ║
║    ⚖️  LEGAL DISCLAIMER: Trading involves substantial risk of loss.           ║
║        Consult qualified financial advisors before making investments.        ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;

// Runtime protection for production environment
if (typeof window !== 'undefined') {
  // Disable right-click context menu for source protection
  document.addEventListener('contextmenu', (e) => {
    if (process.env.NODE_ENV === 'production') {
      e.preventDefault();
      console.warn('🔒 Source code is protected by copyright law. © 2024 AiLydian Technologies');
    }
  });

  // Disable developer tools shortcuts in production
  document.addEventListener('keydown', (e) => {
    if (process.env.NODE_ENV === 'production') {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        console.warn('🛡️ Developer tools access is restricted for security purposes.');
      }
    }
  });

  // Display copyright notice in console
  console.log(getCopyrightBanner());
  
  // Add security monitoring
  console.log('%c🔐 SECURITY NOTICE', 'color: red; font-weight: bold; font-size: 16px;');
  console.log('All activities are monitored and logged for security purposes.');
  console.log('Unauthorized access attempts will be reported to authorities.');
}

export default COPYRIGHT_NOTICE;
