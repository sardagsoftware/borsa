// Standalone Vercel Serverless: /api/menu
// Serves localized menu data for mega dropdown navigation

const { getCorsOrigin } = require('_middleware/cors');
const MENU_DATA = {
  tr: {
    products: {
      title: "Moduller",
      columns: [
        {
          kicker: "AI Platform",
          items: [
            { title: "AI Chat", desc: "Multimodal sohbet", href: "/chat.html" },
            { title: "AI Models", desc: "23+ model destegi", href: "/models.html" },
            { title: "AI Ops Center", desc: "MLOps & monitoring", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Uzman Sistemler",
          items: [
            { title: "Medical Expert", desc: "Tibbi tani & analiz", href: "/medical-expert.html" },
            { title: "Hukuk AI", desc: "Hukuki arama & analiz", href: "/lydian-legal-search.html" },
            { title: "LyDian IQ", desc: "Zeka testi & analiz", href: "/lydian-iq.html" }
          ]
        },
        {
          kicker: "Akilli Sehir",
          items: [
            { title: "Intelligence Grid", desc: "Sehir yonetim merkezi", href: "/civic-intelligence-grid.html" },
            { title: "Traffic Grid", desc: "Adaptif trafik sistemi", href: "/civic-atg.html" },
            { title: "Smart Map", desc: "Akilli harita", href: "/civic-map.html" },
            { title: "Health Network", desc: "Halk sagligi agi", href: "/civic-phn.html" }
          ]
        },
        {
          kicker: "Izleme & Yonetim",
          items: [
            { title: "Sistem Durumu", desc: "Canli health monitor", href: "/status.html" },
            { title: "Monitoring", desc: "Metrikler & SLA", href: "/monitoring.html" },
            { title: "Health Orchestrator", desc: "Auto-triage sistem", href: "/ai-health-orchestrator.html" }
          ]
        }
      ]
    },
    solutions: {
      title: "Cozumler",
      columns: [
        {
          kicker: "Sektorler",
          items: [
            { title: "Finans & Bankacilik", desc: "AI guvenlik & compliance", href: "/enterprise.html" },
            { title: "Saglik", desc: "Medical AI cozumleri", href: "/enterprise.html" },
            { title: "Hukuk", desc: "Legal AI araclari", href: "/enterprise.html" },
            { title: "Kamu", desc: "Smart city cozumleri", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Otomasyon",
          items: [
            { title: "AI Chat Bot", desc: "Akilli sohbet asistani", href: "/chat.html" },
            { title: "Dokuman AI", desc: "Otomatik analiz & ozetleme", href: "/ai-assistant.html" },
            { title: "Cagri Merkezi AI", desc: "Sesli yanit sistemleri", href: "/ai-assistant.html" }
          ]
        },
        {
          kicker: "Guvenlik & Uyum",
          items: [
            { title: "AI Guardrails", desc: "Guvenli AI kullanimi", href: "/enterprise.html" },
            { title: "Content Moderation", desc: "Icerik dogrulama", href: "/enterprise.html" },
            { title: "PII Protection", desc: "Veri gizliligi", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Hizli Baslangic",
          items: [
            { title: "Fiyatlandirma", desc: "Esnek paket secenekleri", href: "/billing.html" },
            { title: "Demo Talebi", desc: "Canli demo rezerve edin", href: "/contact.html" },
            { title: "Sistem Durumu", desc: "Anlik uptime & SLA", href: "/status.html" }
          ]
        }
      ]
    },
    quantum: {
      title: "Quantum",
      columns: [
        {
          kicker: "Quantum Platformu",
          items: [
            { title: "Quantum Computing", desc: "Kuantum hesaplama", href: "/quantum.html" }
          ]
        }
      ]
    },
    developers: {
      title: "Developers",
      columns: [
        {
          kicker: "Gelistirici Araclari",
          items: [
            { title: "API Reference", desc: "REST API dokumantasyonu", href: "/api-reference.html" },
            { title: "SDK", desc: "Gelistirici kiti", href: "/developers.html" },
            { title: "Changelog", desc: "Guncellemeler", href: "/changelog.html" }
          ]
        }
      ]
    },
    projects: {
      title: "Projeler",
      columns: [
        {
          kicker: "One Cikan Projeler",
          items: [
            { title: "Civic Intelligence", desc: "Akilli sehir platformu", href: "/civic-intelligence-grid.html" },
            { title: "Medical Expert", desc: "Tibbi AI sistemi", href: "/medical-expert.html" }
          ]
        }
      ]
    },
    company: {
      title: "Kurumsal",
      columns: [
        {
          kicker: "Sirket",
          items: [
            { title: "Hakkimizda", desc: "Bizi taniyin", href: "/about.html" },
            { title: "Kariyer", desc: "Bize katilin", href: "/careers.html" },
            { title: "Blog", desc: "Yazilar & haberler", href: "/blog.html" },
            { title: "Iletisim", desc: "Bize ulasin", href: "/contact.html" }
          ]
        }
      ]
    }
  },
  en: {
    products: {
      title: "Modules",
      columns: [
        {
          kicker: "AI Platform",
          items: [
            { title: "AI Chat", desc: "Multimodal chat", href: "/chat.html" },
            { title: "AI Models", desc: "23+ model support", href: "/models.html" },
            { title: "AI Ops Center", desc: "MLOps & monitoring", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Expert Systems",
          items: [
            { title: "Medical Expert", desc: "Medical diagnosis & analysis", href: "/medical-expert.html" },
            { title: "Legal AI", desc: "Legal search & analysis", href: "/lydian-legal-search.html" },
            { title: "LyDian IQ", desc: "IQ test & analysis", href: "/lydian-iq.html" }
          ]
        },
        {
          kicker: "Smart City",
          items: [
            { title: "Intelligence Grid", desc: "City management center", href: "/civic-intelligence-grid.html" },
            { title: "Traffic Grid", desc: "Adaptive traffic system", href: "/civic-atg.html" },
            { title: "Smart Map", desc: "Intelligent mapping", href: "/civic-map.html" },
            { title: "Health Network", desc: "Public health network", href: "/civic-phn.html" }
          ]
        },
        {
          kicker: "Monitoring & Management",
          items: [
            { title: "System Status", desc: "Live health monitor", href: "/status.html" },
            { title: "Monitoring", desc: "Metrics & SLA", href: "/monitoring.html" },
            { title: "Health Orchestrator", desc: "Auto-triage system", href: "/ai-health-orchestrator.html" }
          ]
        }
      ]
    },
    solutions: {
      title: "Solutions",
      columns: [
        {
          kicker: "Industries",
          items: [
            { title: "Finance & Banking", desc: "AI security & compliance", href: "/enterprise.html" },
            { title: "Healthcare", desc: "Medical AI solutions", href: "/enterprise.html" },
            { title: "Legal", desc: "Legal AI tools", href: "/enterprise.html" },
            { title: "Government", desc: "Smart city solutions", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Automation",
          items: [
            { title: "AI Chat Bot", desc: "Intelligent chat assistant", href: "/chat.html" },
            { title: "Document AI", desc: "Automatic analysis & summarization", href: "/ai-assistant.html" },
            { title: "Call Center AI", desc: "Voice response systems", href: "/ai-assistant.html" }
          ]
        },
        {
          kicker: "Security & Compliance",
          items: [
            { title: "AI Guardrails", desc: "Safe AI usage", href: "/enterprise.html" },
            { title: "Content Moderation", desc: "Content verification", href: "/enterprise.html" },
            { title: "PII Protection", desc: "Data privacy", href: "/enterprise.html" }
          ]
        },
        {
          kicker: "Quick Start",
          items: [
            { title: "Pricing", desc: "Flexible packages", href: "/billing.html" },
            { title: "Request Demo", desc: "Book a live demo", href: "/contact.html" },
            { title: "System Status", desc: "Real-time uptime & SLA", href: "/status.html" }
          ]
        }
      ]
    },
    quantum: {
      title: "Quantum",
      columns: [
        {
          kicker: "Quantum Platform",
          items: [
            { title: "Quantum Computing", desc: "Quantum computation", href: "/quantum.html" }
          ]
        }
      ]
    },
    developers: {
      title: "Developers",
      columns: [
        {
          kicker: "Developer Tools",
          items: [
            { title: "API Reference", desc: "REST API documentation", href: "/api-reference.html" },
            { title: "SDK", desc: "Developer kit", href: "/developers.html" },
            { title: "Changelog", desc: "Updates", href: "/changelog.html" }
          ]
        }
      ]
    },
    projects: {
      title: "Projects",
      columns: [
        {
          kicker: "Featured Projects",
          items: [
            { title: "Civic Intelligence", desc: "Smart city platform", href: "/civic-intelligence-grid.html" },
            { title: "Medical Expert", desc: "Medical AI system", href: "/medical-expert.html" }
          ]
        }
      ]
    },
    company: {
      title: "Company",
      columns: [
        {
          kicker: "Company",
          items: [
            { title: "About Us", desc: "Get to know us", href: "/about.html" },
            { title: "Careers", desc: "Join our team", href: "/careers.html" },
            { title: "Blog", desc: "Articles & news", href: "/blog.html" },
            { title: "Contact", desc: "Get in touch", href: "/contact.html" }
          ]
        }
      ]
    }
  }
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const lang = req.query.lang || 'en';

  if (!['tr', 'en'].includes(lang)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language code. Supported: tr, en'
    });
  }

  const data = MENU_DATA[lang];

  return res.status(200).json({
    success: true,
    data,
    lang
  });
};
