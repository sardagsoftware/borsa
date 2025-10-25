#!/usr/bin/env node

/**
 * TIER 2B SEO CONTENT DATABASE
 *
 * Medium-priority pages SEO content (10 pages × 6 languages = 60 packages)
 * - developers.html, blog.html, careers.html, dashboard.html, settings.html
 * - education.html, files.html, monitoring.html, analytics.html, knowledge-base.html
 *
 * @version 1.0.0
 * @date 2025-10-25
 */

const TIER_2B_CONTENT = {
  // 1. DEVELOPERS PAGE
  'developers.html': {
    tr: {
      title: 'Geliştiriciler — LyDian AI | API, SDK ve Dokümantasyon',
      description: 'LyDian AI geliştirici kaynakları. RESTful API, SDK\'lar, kod örnekleri ve detaylı dokümantasyon. Hızlı entegrasyon için tüm araçlar tek platformda.',
      keywords: 'lydian geliştiriciler, ai api geliştirme, sdk lydian, yapay zeka entegrasyon, developer tools'
    },
    en: {
      title: 'Developers — LyDian AI | API, SDKs, and Documentation',
      description: 'LyDian AI developer resources. RESTful API, SDKs, code samples, and comprehensive documentation. All tools for rapid integration in one platform.',
      keywords: 'lydian developers, ai api development, lydian sdk, artificial intelligence integration, developer tools'
    },
    de: {
      title: 'Entwickler — LyDian AI | API, SDKs und Dokumentation',
      description: 'LyDian AI Entwicklerressourcen. RESTful API, SDKs, Codebeispiele und umfassende Dokumentation. Alle Tools für schnelle Integration auf einer Plattform.',
      keywords: 'lydian entwickler, ki api entwicklung, lydian sdk, künstliche intelligenz integration, entwicklertools'
    },
    ar: {
      title: 'المطورون — LyDian AI | واجهة برمجية و SDK وتوثيق شامل',
      description: 'موارد مطوري LyDian AI. واجهة RESTful API وSDK وأمثلة التعليمات البرمجية والتوثيق الشامل. جميع الأدوات للتكامل السريع على منصة واحدة.',
      keywords: 'مطورو lydian, تطوير واجهة ai, lydian sdk, تكامل الذكاء الاصطناعي, أدوات المطورين'
    },
    ru: {
      title: 'Разработчикам — LyDian AI | API, SDK и Документация',
      description: 'Ресурсы разработчиков LyDian AI. RESTful API, SDK, примеры кода и документация. Все инструменты для интеграции на одной платформе.',
      keywords: 'разработчики lydian, разработка ai api, lydian sdk, интеграция искусственного интеллекта, инструменты разработчика'
    },
    zh: {
      title: '开发者中心 — LyDian AI 平台 | API、SDK和完整文档',
      description: 'LyDian AI开发者资源。RESTful API、SDK、代码示例和全面文档。一个平台提供所有快速集成工具，助力开发者高效构建智能应用，加速产品创新。',
      keywords: 'lydian开发者, ai接口开发, lydian sdk, 人工智能集成, 开发者工具'
    }
  },

  // 2. BLOG PAGE
  'blog.html': {
    tr: {
      title: 'Blog — LyDian AI | Yapay Zeka Haberleri ve İçgörüler',
      description: 'LyDian AI blog. AI trendleri, teknik makaleler, başarı hikayeleri ve sektör analizleri. Yapay zeka dünyasından son gelişmeleri takip edin.',
      keywords: 'lydian blog, ai haberleri, yapay zeka trendleri, teknoloji blog, ai içgörüler'
    },
    en: {
      title: 'Blog — LyDian AI | Artificial Intelligence News and Insights',
      description: 'LyDian AI blog. AI trends, technical articles, success stories, and industry analysis. Stay updated with latest developments in artificial intelligence.',
      keywords: 'lydian blog, ai news, artificial intelligence trends, technology blog, ai insights'
    },
    de: {
      title: 'Blog — LyDian AI | KI-Nachrichten und Einblicke',
      description: 'LyDian AI Blog. KI-Trends, technische Artikel, Erfolgsgeschichten und Branchenanalysen. Bleiben Sie über neueste Entwicklungen der KI informiert.',
      keywords: 'lydian blog, ki nachrichten, künstliche intelligenz trends, technologie blog, ki einblicke'
    },
    ar: {
      title: 'المدونة — LyDian AI | أخبار ورؤى الذكاء الاصطناعي',
      description: 'مدونة LyDian AI. اتجاهات الذكاء الاصطناعي، مقالات تقنية، قصص النجاح، وتحليلات الصناعة. تابع آخر التطورات في عالم الذكاء الاصطناعي.',
      keywords: 'مدونة lydian, أخبار ai, اتجاهات الذكاء الاصطناعي, مدونة تقنية, رؤى ai'
    },
    ru: {
      title: 'Блог — LyDian AI | Новости и Аналитика ИИ',
      description: 'Блог LyDian AI. Тренды ИИ, технические статьи, истории успеха и анализ индустрии. Следите за последними событиями в мире ИИ.',
      keywords: 'блог lydian, новости ии, тренды искусственного интеллекта, технологический блог, аналитика ии'
    },
    zh: {
      title: '博客 — LyDian AI 平台 | 人工智能新闻与洞察',
      description: 'LyDian AI博客。AI趋势、技术文章、成功案例和行业分析。紧跟人工智能领域最新发展动态，获取专业见解和深度解读，引领智能化创新。',
      keywords: 'lydian博客, ai新闻, 人工智能趋势, 技术博客, ai洞察'
    }
  },

  // 3. CAREERS PAGE
  'careers.html': {
    tr: {
      title: 'Kariyer — LyDian AI | Yapay Zeka Alanında Kariyer Fırsatları',
      description: 'LyDian AI\'da kariyer fırsatları. Dünya çapında AI uzmanları, yazılım geliştiriciler ve araştırmacılar arıyoruz. Geleceği birlikte inşa edelim.',
      keywords: 'lydian kariyer, ai iş ilanları, yapay zeka işler, teknoloji kariyer, ai uzman iş'
    },
    en: {
      title: 'Careers — LyDian AI | Career Opportunities in Artificial Intelligence',
      description: 'Career opportunities at LyDian AI. We are hiring AI experts, software developers, and researchers worldwide. Build the future with us.',
      keywords: 'lydian careers, ai jobs, artificial intelligence careers, technology jobs, ai expert positions'
    },
    de: {
      title: 'Karriere — LyDian AI | Karrieremöglichkeiten im KI-Bereich',
      description: 'Karrierechancen bei LyDian AI. Wir suchen KI-Experten, Softwareentwickler und Forscher weltweit. Gestalten Sie die Zukunft mit uns.',
      keywords: 'lydian karriere, ki jobs, künstliche intelligenz karriere, technologie jobs, ki experten stellen'
    },
    ar: {
      title: 'الوظائف — LyDian AI | فرص العمل في مجال الذكاء الاصطناعي',
      description: 'فرص العمل في LyDian AI. نبحث عن خبراء الذكاء الاصطناعي ومطوري البرمجيات والباحثين عالمياً. ابنِ المستقبل معنا.',
      keywords: 'وظائف lydian, وظائف ai, مهن الذكاء الاصطناعي, وظائف تقنية, وظائف خبراء ai'
    },
    ru: {
      title: 'Карьера — LyDian AI | Карьерные возможности в области ИИ',
      description: 'Карьерные возможности в LyDian AI. Мы ищем экспертов по ИИ, разработчиков и исследователей по всему миру. Стройте будущее вместе с нами.',
      keywords: 'карьера lydian, вакансии ии, карьера искусственного интеллекта, технологические вакансии, вакансии эксперта ии'
    },
    zh: {
      title: '招聘 — LyDian AI 平台 | 人工智能领域职业机会',
      description: 'LyDian AI职业机会。我们在全球招聘AI专家、软件开发人员和研究人员。与我们一起构建未来，开创智能化新时代，实现职业理想和技术抱负。',
      keywords: 'lydian招聘, ai职位, 人工智能职业, 技术工作, ai专家岗位'
    }
  },

  // 4. DASHBOARD PAGE
  'dashboard.html': {
    tr: {
      title: 'Dashboard — LyDian AI | Yapay Zeka Kontrol Paneli',
      description: 'LyDian AI kullanım dashboard\'u. API kullanımı, token yönetimi, performans metrikleri ve maliyet analizi. Tüm AI aktivitelerinizi tek ekranda yönetin.',
      keywords: 'lydian dashboard, ai kontrol paneli, api kullanım, token yönetimi, ai metrikleri'
    },
    en: {
      title: 'Dashboard — LyDian AI | Artificial Intelligence Control Panel',
      description: 'LyDian AI usage dashboard. API usage, token management, performance metrics, and cost analysis. Manage all your AI activities from one screen.',
      keywords: 'lydian dashboard, ai control panel, api usage, token management, ai metrics'
    },
    de: {
      title: 'Dashboard — LyDian AI | KI-Kontrollzentrum',
      description: 'LyDian AI Nutzungs-Dashboard. API-Nutzung, Token-Verwaltung, Leistungsmetriken und Kostenanalyse. Verwalten Sie alle KI-Aktivitäten von einem Bildschirm.',
      keywords: 'lydian dashboard, ki kontrollzentrum, api nutzung, token verwaltung, ki metriken'
    },
    ar: {
      title: 'لوحة التحكم — LyDian AI | لوحة التحكم بالذكاء الاصطناعي',
      description: 'لوحة تحكم استخدام LyDian AI. استخدام API، إدارة الرموز، مقاييس الأداء، وتحليل التكاليف. أدر جميع أنشطة AI من شاشة واحدة.',
      keywords: 'لوحة تحكم lydian, لوحة تحكم ai, استخدام api, إدارة الرموز, مقاييس ai'
    },
    ru: {
      title: 'Панель управления — LyDian AI | Контрольная панель ИИ',
      description: 'Панель управления LyDian AI. Использование API, управление токенами, метрики производительности и анализ затрат. Управляйте всеми ИИ-активностями с одного экрана.',
      keywords: 'панель lydian, панель управления ии, использование api, управление токенами, метрики ии'
    },
    zh: {
      title: '仪表板 — LyDian AI 平台 | 人工智能控制面板',
      description: 'LyDian AI使用仪表板。API使用情况、令牌管理、性能指标和成本分析。在一个屏幕上管理所有AI活动，实时监控系统状态，优化资源使用效率。',
      keywords: 'lydian仪表板, ai控制面板, api使用, 令牌管理, ai指标'
    }
  },

  // 5. SETTINGS PAGE
  'settings.html': {
    tr: {
      title: 'Ayarlar — LyDian AI | Hesap ve Tercih Ayarları',
      description: 'LyDian AI ayarlar sayfası. Hesap yönetimi, güvenlik ayarları, API anahtarları, bildirimler ve dil tercihleri. Platformunuzu özelleştirin.',
      keywords: 'lydian ayarlar, hesap yönetimi, güvenlik ayarları, api anahtarları, platform tercihleri'
    },
    en: {
      title: 'Settings — LyDian AI | Account and Preference Settings',
      description: 'LyDian AI settings page. Account management, security settings, API keys, notifications, and language preferences. Customize your platform experience.',
      keywords: 'lydian settings, account management, security settings, api keys, platform preferences'
    },
    de: {
      title: 'Einstellungen — LyDian AI | Konto- und Präferenzeinstellungen',
      description: 'LyDian AI Einstellungsseite. Kontoverwaltung, Sicherheitseinstellungen, API-Schlüssel, Benachrichtigungen und Spracheinstellungen. Passen Sie Ihre Plattform an.',
      keywords: 'lydian einstellungen, kontoverwaltung, sicherheitseinstellungen, api schlüssel, plattform präferenzen'
    },
    ar: {
      title: 'الإعدادات — LyDian AI | إعدادات الحساب والتفضيلات',
      description: 'صفحة إعدادات LyDian AI. إدارة الحساب، إعدادات الأمان، مفاتيح API، الإشعارات، وتفضيلات اللغة. خصص تجربتك على المنصة.',
      keywords: 'إعدادات lydian, إدارة الحساب, إعدادات الأمان, مفاتيح api, تفضيلات المنصة'
    },
    ru: {
      title: 'Настройки — LyDian AI | Настройки аккаунта и предпочтений',
      description: 'Страница настроек LyDian AI. Управление аккаунтом, настройки безопасности, API-ключи, уведомления и языковые предпочтения. Настройте платформу под себя.',
      keywords: 'настройки lydian, управление аккаунтом, настройки безопасности, api ключи, предпочтения платформы'
    },
    zh: {
      title: '设置 — LyDian AI 平台 | 账户和偏好设置',
      description: 'LyDian AI设置页面。账户管理、安全设置、API密钥、通知和语言偏好。自定义您的平台体验，优化使用环境，打造个性化智能工作空间。',
      keywords: 'lydian设置, 账户管理, 安全设置, api密钥, 平台偏好'
    }
  },

  // 6. EDUCATION PAGE
  'education.html': {
    tr: {
      title: 'Eğitim — LyDian AI | Yapay Zeka Eğitim Kaynakları',
      description: 'LyDian AI eğitim platformu. Video dersler, interaktif kurslar, sertifika programları ve AI öğrenme yolları. Yapay zeka uzmanlığınızı geliştirin.',
      keywords: 'lydian eğitim, ai kursları, yapay zeka öğrenme, ai sertifika, makine öğrenmesi eğitim'
    },
    en: {
      title: 'Education — LyDian AI | Artificial Intelligence Learning Resources',
      description: 'LyDian AI education platform. Video tutorials, interactive courses, certification programs, and AI learning paths. Develop your AI expertise.',
      keywords: 'lydian education, ai courses, artificial intelligence learning, ai certification, machine learning training'
    },
    de: {
      title: 'Bildung — LyDian AI | KI-Lernressourcen',
      description: 'LyDian AI Bildungsplattform. Video-Tutorials, interaktive Kurse, Zertifizierungsprogramme und KI-Lernpfade. Entwickeln Sie Ihre KI-Expertise.',
      keywords: 'lydian bildung, ki kurse, künstliche intelligenz lernen, ki zertifizierung, maschinelles lernen schulung'
    },
    ar: {
      title: 'التعليم — LyDian AI | موارد تعلم الذكاء الاصطناعي',
      description: 'منصة تعليم LyDian AI. دروس فيديو، دورات تفاعلية، برامج شهادات، ومسارات تعلم AI. طور خبرتك في الذكاء الاصطناعي.',
      keywords: 'تعليم lydian, دورات ai, تعلم الذكاء الاصطناعي, شهادة ai, تدريب التعلم الآلي'
    },
    ru: {
      title: 'Обучение — LyDian AI | Образовательные ресурсы по ИИ',
      description: 'Образовательная платформа LyDian AI. Видеоуроки, интерактивные курсы, программы сертификации и пути обучения ИИ. Развивайте свою экспертизу в ИИ.',
      keywords: 'обучение lydian, курсы ии, обучение искусственному интеллекту, сертификация ии, обучение машинному обучению'
    },
    zh: {
      title: '教育 — LyDian AI 平台 | 人工智能学习资源',
      description: 'LyDian AI教育平台。视频教程、互动课程、认证项目和AI学习路径。提升您的AI专业技能，系统掌握人工智能技术，获得权威认证和职业发展。',
      keywords: 'lydian教育, ai课程, 人工智能学习, ai认证, 机器学习培训'
    }
  },

  // 7. FILES PAGE
  'files.html': {
    tr: {
      title: 'Dosyalar — LyDian AI | AI ile Dosya Yönetimi',
      description: 'LyDian AI dosya yönetim sistemi. Belgelerinizi yükleyin, AI ile analiz edin, otomatik etiketleme ve akıllı arama. Güvenli bulut depolama.',
      keywords: 'lydian dosyalar, ai dosya yönetimi, akıllı arama, belge analizi, bulut depolama'
    },
    en: {
      title: 'Files — LyDian AI | AI-Powered File Management',
      description: 'LyDian AI file management system. Upload documents, analyze with AI, automatic tagging, and smart search. Secure cloud storage included.',
      keywords: 'lydian files, ai file management, smart search, document analysis, cloud storage'
    },
    de: {
      title: 'Dateien — LyDian AI | KI-gestützte Dateiverwaltung',
      description: 'LyDian AI Dateiverwaltungssystem. Dokumente hochladen, mit KI analysieren, automatisches Tagging und intelligente Suche. Sicherer Cloud-Speicher.',
      keywords: 'lydian dateien, ki dateiverwaltung, intelligente suche, dokumentenanalyse, cloud speicher'
    },
    ar: {
      title: 'الملفات — LyDian AI | إدارة الملفات المدعومة بالذكاء الاصطناعي',
      description: 'نظام إدارة ملفات LyDian AI. تحميل المستندات، تحليلها بالذكاء الاصطناعي، وضع العلامات التلقائية، والبحث الذكي. تخزين سحابي آمن.',
      keywords: 'ملفات lydian, إدارة ملفات ai, بحث ذكي, تحليل المستندات, تخزين سحابي'
    },
    ru: {
      title: 'Файлы — LyDian AI | Управление файлами с ИИ',
      description: 'Система управления файлами LyDian AI. Загружайте документы, анализируйте с помощью ИИ, автоматическая маркировка и умный поиск. Безопасное облачное хранилище.',
      keywords: 'файлы lydian, управление файлами ии, умный поиск, анализ документов, облачное хранилище'
    },
    zh: {
      title: '文件 — LyDian AI 平台 | AI驱动的文件管理',
      description: 'LyDian AI文件管理系统。上传文档，使用AI分析，自动标记和智能搜索。安全云存储。高效管理您的所有文件，智能化处理和快速检索文档内容。',
      keywords: 'lydian文件, ai文件管理, 智能搜索, 文档分析, 云存储'
    }
  },

  // 8. MONITORING PAGE
  'monitoring.html': {
    tr: {
      title: 'İzleme — LyDian AI | Sistem İzleme ve Performans',
      description: 'LyDian AI sistem izleme dashboard\'u. Gerçek zamanlı performans metrikleri, uptime monitoring, hata takibi ve sistem sağlığı. 7/24 izleme.',
      keywords: 'lydian izleme, sistem monitoring, performans metrikleri, uptime takip, ai sistem sağlığı'
    },
    en: {
      title: 'Monitoring — LyDian AI | System Monitoring and Performance',
      description: 'LyDian AI system monitoring dashboard. Real-time performance metrics, uptime monitoring, error tracking, and system health. 24/7 monitoring.',
      keywords: 'lydian monitoring, system monitoring, performance metrics, uptime tracking, ai system health'
    },
    de: {
      title: 'Überwachung — LyDian AI | Systemüberwachung und Leistung',
      description: 'LyDian AI Systemüberwachungs-Dashboard. Echtzeit-Leistungsmetriken, Uptime-Überwachung, Fehlerverfolgung und Systemgesundheit. 24/7 Überwachung.',
      keywords: 'lydian überwachung, systemüberwachung, leistungsmetriken, uptime verfolgung, ki systemgesundheit'
    },
    ar: {
      title: 'المراقبة — LyDian AI | مراقبة النظام والأداء',
      description: 'لوحة مراقبة نظام LyDian AI. مقاييس الأداء في الوقت الفعلي، مراقبة وقت التشغيل، تتبع الأخطاء، وصحة النظام. مراقبة على مدار الساعة.',
      keywords: 'مراقبة lydian, مراقبة النظام, مقاييس الأداء, تتبع وقت التشغيل, صحة نظام ai'
    },
    ru: {
      title: 'Мониторинг — LyDian AI | Мониторинг системы и производительности',
      description: 'Панель мониторинга системы LyDian AI. Метрики производительности в реальном времени, мониторинг uptime, отслеживание ошибок и здоровье системы. Мониторинг 24/7.',
      keywords: 'мониторинг lydian, мониторинг системы, метрики производительности, отслеживание uptime, здоровье системы ии'
    },
    zh: {
      title: '监控 — LyDian AI 平台 | 系统监控和性能分析',
      description: 'LyDian AI系统监控仪表板。实时性能指标、正常运行时间监控、错误跟踪和系统健康状况。全天候监控，确保系统稳定运行和最佳性能表现。',
      keywords: 'lydian监控, 系统监控, 性能指标, 正常运行时间跟踪, ai系统健康'
    }
  },

  // 9. ANALYTICS PAGE
  'analytics.html': {
    tr: {
      title: 'Analitik — LyDian AI | AI Kullanım Analitikleri',
      description: 'LyDian AI analitik dashboard\'u. Detaylı kullanım raporları, trend analizleri, ROI hesaplamaları ve tahmine dayalı analizler. Data-driven kararlar alın.',
      keywords: 'lydian analitik, ai analiz, kullanım raporları, roi hesaplama, data analytics'
    },
    en: {
      title: 'Analytics — LyDian AI | AI Usage Analytics',
      description: 'LyDian AI analytics dashboard. Detailed usage reports, trend analysis, ROI calculations, and predictive analytics. Make data-driven decisions.',
      keywords: 'lydian analytics, ai analysis, usage reports, roi calculation, data analytics'
    },
    de: {
      title: 'Analytik — LyDian AI | KI-Nutzungsanalytik',
      description: 'LyDian AI Analyse-Dashboard. Detaillierte Nutzungsberichte, Trendanalysen, ROI-Berechnungen und prädiktive Analysen. Treffen Sie datengestützte Entscheidungen.',
      keywords: 'lydian analytik, ki analyse, nutzungsberichte, roi berechnung, datenanalytik'
    },
    ar: {
      title: 'التحليلات — LyDian AI | تحليلات استخدام الذكاء الاصطناعي',
      description: 'لوحة تحليلات LyDian AI. تقارير استخدام مفصلة، تحليل الاتجاهات، حسابات ROI، والتحليلات التنبؤية. اتخذ قرارات مبنية على البيانات.',
      keywords: 'تحليلات lydian, تحليل ai, تقارير الاستخدام, حساب roi, تحليلات البيانات'
    },
    ru: {
      title: 'Аналитика — LyDian AI | Аналитика использования ИИ',
      description: 'Панель аналитики LyDian AI. Детальные отчеты об использовании, анализ трендов, расчеты ROI и прогнозная аналитика. Принимайте решения на основе данных.',
      keywords: 'аналитика lydian, анализ ии, отчеты об использовании, расчет roi, аналитика данных'
    },
    zh: {
      title: '分析 — LyDian AI 平台 | AI使用情况分析',
      description: 'LyDian AI分析仪表板。详细使用报告、趋势分析、ROI计算和预测分析。做出数据驱动的决策，优化AI资源配置，提升业务价值和投资回报率。',
      keywords: 'lydian分析, ai分析, 使用报告, roi计算, 数据分析'
    }
  },

  // 10. KNOWLEDGE BASE PAGE
  'knowledge-base.html': {
    tr: {
      title: 'Bilgi Bankası — LyDian AI | AI Bilgi Merkezi',
      description: 'LyDian AI bilgi bankası. Kapsamlı rehberler, SSS, video eğitimleri, sorun giderme kılavuzları ve best practices. Tüm sorularınızın yanıtı burada.',
      keywords: 'lydian bilgi bankası, ai rehber, sss, sorun giderme, best practices'
    },
    en: {
      title: 'Knowledge Base — LyDian AI | AI Knowledge Center',
      description: 'LyDian AI knowledge base. Comprehensive guides, FAQ, video tutorials, troubleshooting guides, and best practices. All your questions answered here.',
      keywords: 'lydian knowledge base, ai guide, faq, troubleshooting, best practices'
    },
    de: {
      title: 'Wissensdatenbank — LyDian AI | KI-Wissenszentrum',
      description: 'LyDian AI Wissensdatenbank. Umfassende Anleitungen, FAQ, Video-Tutorials, Fehlerbehebungsanleitungen und Best Practices. Alle Ihre Fragen hier beantwortet.',
      keywords: 'lydian wissensdatenbank, ki anleitung, faq, fehlerbehebung, best practices'
    },
    ar: {
      title: 'قاعدة المعرفة — LyDian AI | مركز معرفة الذكاء الاصطناعي',
      description: 'قاعدة معرفة LyDian AI. أدلة شاملة، أسئلة متكررة، دروس فيديو، أدلة استكشاف الأخطاء، وأفضل الممارسات. جميع إجاباتك هنا.',
      keywords: 'قاعدة معرفة lydian, دليل ai, أسئلة متكررة, استكشاف الأخطاء, أفضل الممارسات'
    },
    ru: {
      title: 'База знаний — LyDian AI | Центр знаний по ИИ',
      description: 'База знаний LyDian AI. Подробные руководства, FAQ, видеоуроки, руководства по устранению неполадок и лучшие практики. Ответы на все ваши вопросы здесь.',
      keywords: 'база знаний lydian, руководство ии, faq, устранение неполадок, лучшие практики'
    },
    zh: {
      title: '知识库 — LyDian AI 平台 | AI知识中心',
      description: 'LyDian AI知识库。全面的指南、常见问题解答、视频教程、故障排除指南和最佳实践。所有问题的答案都在这里，快速解决您的疑惑和难题。',
      keywords: 'lydian知识库, ai指南, 常见问题, 故障排除, 最佳实践'
    }
  }
};

module.exports = {
  TIER_2B_CONTENT
};
#!/usr/bin/env node

/**
 * TIER 2C SEO CONTENT DATABASE
 *
 * Legal/Compliance pages SEO content (10 pages × 6 languages = 60 packages)
 * - terms.html, privacy.html, cookies.html, status.html, console.html
 * - tokens.html, lydian-legal-search.html, lydian-hukukai.html, medical-ai.html, governance-dashboard.html
 *
 * @version 1.0.0
 * @date 2025-10-25
 */

const TIER_2C_CONTENT = {
  // 1. TERMS PAGE
  'terms.html': {
    tr: {
      title: 'Kullanım Koşulları — LyDian AI | Hizmet Şartları',
      description: 'LyDian AI kullanım koşulları ve hizmet şartları. Platform kullanımı, haklar, sorumluluklar ve yasal bilgiler. Güncel şartlarımızı inceleyin.',
      keywords: 'lydian kullanım koşulları, hizmet şartları, yasal bilgiler, platform politikaları, kullanım politikası'
    },
    en: {
      title: 'Terms of Service — LyDian AI | Service Agreement',
      description: 'LyDian AI terms of service and service agreement. Platform usage, rights, responsibilities, and legal information. Review our current terms.',
      keywords: 'lydian terms of service, service agreement, legal information, platform policies, usage policy'
    },
    de: {
      title: 'Nutzungsbedingungen — LyDian AI | Servicevereinbarung',
      description: 'LyDian AI Nutzungsbedingungen und Servicevereinbarung. Plattformnutzung, Rechte, Verantwortlichkeiten und rechtliche Informationen. Prüfen Sie unsere aktuellen Bedingungen.',
      keywords: 'lydian nutzungsbedingungen, servicevereinbarung, rechtliche informationen, plattform richtlinien, nutzungsrichtlinie'
    },
    ar: {
      title: 'شروط الخدمة — LyDian AI | اتفاقية الخدمة',
      description: 'شروط خدمة LyDian AI واتفاقية الخدمة. استخدام المنصة، الحقوق، المسؤوليات، والمعلومات القانونية. راجع شروطنا الحالية.',
      keywords: 'شروط خدمة lydian, اتفاقية الخدمة, معلومات قانونية, سياسات المنصة, سياسة الاستخدام'
    },
    ru: {
      title: 'Условия использования — LyDian AI | Соглашение об обслуживании',
      description: 'Условия использования LyDian AI и соглашение об обслуживании. Использование платформы, права, обязанности и юридическая информация. Ознакомьтесь с нашими текущими условиями.',
      keywords: 'условия использования lydian, соглашение об обслуживании, юридическая информация, политики платформы, политика использования'
    },
    zh: {
      title: '服务条款 — LyDian AI 平台 | 服务协议',
      description: 'LyDian AI服务条款和服务协议。平台使用、权利、责任和法律信息。查看我们当前的条款，了解您的权益和义务，确保合规使用我们的AI服务。',
      keywords: 'lydian服务条款, 服务协议, 法律信息, 平台政策, 使用政策'
    }
  },

  // 2. PRIVACY PAGE
  'privacy.html': {
    tr: {
      title: 'Gizlilik Politikası — LyDian AI | Veri Koruma',
      description: 'LyDian AI gizlilik politikası. Veri toplama, kullanım, depolama ve koruma politikalarımız. GDPR ve KVKK uyumlu gizlilik taahhüdümüz.',
      keywords: 'lydian gizlilik, veri koruma, gdpr uyumlu, kvkk, kişisel veri politikası'
    },
    en: {
      title: 'Privacy Policy — LyDian AI | Data Protection',
      description: 'LyDian AI privacy policy. Our data collection, usage, storage, and protection policies. GDPR-compliant privacy commitment for your data.',
      keywords: 'lydian privacy, data protection, gdpr compliant, personal data policy, privacy commitment'
    },
    de: {
      title: 'Datenschutzrichtlinie — LyDian AI | Datenschutz',
      description: 'LyDian AI Datenschutzrichtlinie. Unsere Richtlinien zur Datenerfassung, -nutzung, -speicherung und -schutz. DSGVO-konforme Datenschutzverpflichtung.',
      keywords: 'lydian datenschutz, datenschutz, dsgvo konform, personenbezogene daten richtlinie, datenschutzverpflichtung'
    },
    ar: {
      title: 'سياسة الخصوصية — LyDian AI | حماية البيانات',
      description: 'سياسة خصوصية LyDian AI. سياساتنا لجمع البيانات واستخدامها وتخزينها وحمايتها. التزامنا بالخصوصية المتوافق مع GDPR.',
      keywords: 'خصوصية lydian, حماية البيانات, متوافق مع gdpr, سياسة البيانات الشخصية, التزام الخصوصية'
    },
    ru: {
      title: 'Политика конфиденциальности — LyDian AI | Защита данных',
      description: 'Политика конфиденциальности LyDian AI. Наши политики сбора, использования, хранения и защиты данных. Обязательство конфиденциальности, совместимое с GDPR.',
      keywords: 'конфиденциальность lydian, защита данных, соответствие gdpr, политика персональных данных, обязательство конфиденциальности'
    },
    zh: {
      title: '隐私政策 — LyDian AI 平台 | 数据保护',
      description: 'LyDian AI隐私政策。我们的数据收集、使用、存储和保护政策。符合GDPR的隐私承诺，全面保障您的数据安全和隐私权益，透明合规运营。',
      keywords: 'lydian隐私, 数据保护, gdpr合规, 个人数据政策, 隐私承诺'
    }
  },

  // 3. COOKIES PAGE
  'cookies.html': {
    tr: {
      title: 'Çerez Politikası — LyDian AI | Cookie Yönetimi',
      description: 'LyDian AI çerez politikası. Çerez kullanımı, türleri, amaçları ve yönetim seçenekleri. Çerez tercihlerinizi özelleştirin.',
      keywords: 'lydian çerez politikası, cookie yönetimi, çerez ayarları, gizlilik tercihleri, cookie kullanımı'
    },
    en: {
      title: 'Cookie Policy — LyDian AI | Cookie Management',
      description: 'LyDian AI cookie policy. Cookie usage, types, purposes, and management options. Customize your cookie preferences.',
      keywords: 'lydian cookie policy, cookie management, cookie settings, privacy preferences, cookie usage'
    },
    de: {
      title: 'Cookie-Richtlinie — LyDian AI | Cookie-Verwaltung',
      description: 'LyDian AI Cookie-Richtlinie. Cookie-Nutzung, Typen, Zwecke und Verwaltungsoptionen. Passen Sie Ihre Cookie-Einstellungen an.',
      keywords: 'lydian cookie richtlinie, cookie verwaltung, cookie einstellungen, datenschutzeinstellungen, cookie nutzung'
    },
    ar: {
      title: 'سياسة ملفات تعريف الارتباط — LyDian AI | إدارة ملفات تعريف الارتباط',
      description: 'سياسة ملفات تعريف الارتباط LyDian AI. استخدام ملفات تعريف الارتباط وأنواعها وأغراضها وخيارات الإدارة. خصص تفضيلات ملفات تعريف الارتباط.',
      keywords: 'سياسة ملفات تعريف الارتباط lydian, إدارة ملفات تعريف الارتباط, إعدادات ملفات تعريف الارتباط, تفضيلات الخصوصية'
    },
    ru: {
      title: 'Политика использования cookie — LyDian AI | Управление cookie',
      description: 'Политика использования cookie LyDian AI. Использование cookie, типы, цели и параметры управления. Настройте свои предпочтения cookie.',
      keywords: 'политика cookie lydian, управление cookie, настройки cookie, предпочтения конфиденциальности, использование cookie'
    },
    zh: {
      title: 'Cookie政策 — LyDian AI 平台 | Cookie管理',
      description: 'LyDian AI Cookie政策。Cookie使用、类型、用途和管理选项。自定义您的Cookie偏好设置，控制数据收集方式，保护您的在线隐私和浏览体验。',
      keywords: 'lydian cookie政策, cookie管理, cookie设置, 隐私偏好, cookie使用'
    }
  },

  // 4. STATUS PAGE
  'status.html': {
    tr: {
      title: 'Sistem Durumu — LyDian AI | Servis Sağlığı',
      description: 'LyDian AI sistem durumu sayfası. Gerçek zamanlı servis durumu, uptime istatistikleri, planlı bakımlar ve geçmiş olaylar. Sistem sağlığını takip edin.',
      keywords: 'lydian sistem durumu, servis sağlığı, uptime istatistikleri, sistem izleme, planlı bakım'
    },
    en: {
      title: 'System Status — LyDian AI | Service Health',
      description: 'LyDian AI system status page. Real-time service status, uptime statistics, scheduled maintenance, and historical incidents. Track system health.',
      keywords: 'lydian system status, service health, uptime statistics, system monitoring, scheduled maintenance'
    },
    de: {
      title: 'Systemstatus — LyDian AI | Service-Gesundheit',
      description: 'LyDian AI Systemstatusseite. Echtzeit-Servicestatus, Uptime-Statistiken, geplante Wartung und historische Vorfälle. Verfolgen Sie die Systemgesundheit.',
      keywords: 'lydian systemstatus, service gesundheit, uptime statistiken, systemüberwachung, geplante wartung'
    },
    ar: {
      title: 'حالة النظام — LyDian AI | صحة الخدمة',
      description: 'صفحة حالة نظام LyDian AI. حالة الخدمة في الوقت الفعلي، إحصائيات وقت التشغيل، الصيانة المجدولة، والحوادث التاريخية. تتبع صحة النظام.',
      keywords: 'حالة نظام lydian, صحة الخدمة, إحصائيات وقت التشغيل, مراقبة النظام, الصيانة المجدولة'
    },
    ru: {
      title: 'Статус системы — LyDian AI | Работоспособность сервиса',
      description: 'Страница статуса системы LyDian AI. Статус сервиса в реальном времени, статистика uptime, плановое обслуживание и история инцидентов. Отслеживайте работоспособность системы.',
      keywords: 'статус системы lydian, работоспособность сервиса, статистика uptime, мониторинг системы, плановое обслуживание'
    },
    zh: {
      title: '系统状态 — LyDian AI 平台 | 服务健康状况',
      description: 'LyDian AI系统状态页面。实时服务状态、正常运行时间统计、计划维护和历史事件。跟踪系统健康状况，确保服务稳定可靠和持续可用性。',
      keywords: 'lydian系统状态, 服务健康, 正常运行时间统计, 系统监控, 计划维护'
    }
  },

  // 5. CONSOLE PAGE
  'console.html': {
    tr: {
      title: 'Geliştirici Konsolu — LyDian AI | API Yönetim Konsolu',
      description: 'LyDian AI geliştirici konsolu. API key yönetimi, usage tracking, endpoint testing, webhook konfigürasyonu. Tam kontrol developer console.',
      keywords: 'lydian konsol, developer console, api yönetimi, api key, webhook yönetimi'
    },
    en: {
      title: 'Developer Console — LyDian AI | API Management Console',
      description: 'LyDian AI developer console. API key management, usage tracking, endpoint testing, webhook configuration. Full control developer console.',
      keywords: 'lydian console, developer console, api management, api key, webhook management'
    },
    de: {
      title: 'Entwicklerkonsole — LyDian AI | API-Verwaltungskonsole',
      description: 'LyDian AI Entwicklerkonsole. API-Schlüsselverwaltung, Nutzungsverfolgung, Endpoint-Tests, Webhook-Konfiguration. Vollständige Entwicklerkonsole.',
      keywords: 'lydian konsole, entwicklerkonsole, api verwaltung, api schlüssel, webhook verwaltung'
    },
    ar: {
      title: 'وحدة تحكم المطورين — LyDian AI | وحدة تحكم إدارة API',
      description: 'وحدة تحكم مطوري LyDian AI. إدارة مفاتيح API، تتبع الاستخدام، اختبار النقاط النهائية، تكوين webhook. وحدة تحكم كاملة للمطورين.',
      keywords: 'وحدة تحكم lydian, وحدة تحكم المطورين, إدارة api, مفتاح api, إدارة webhook'
    },
    ru: {
      title: 'Консоль разработчика — LyDian AI | Консоль управления API',
      description: 'Консоль разработчика LyDian AI. Управление API-ключами, отслеживание использования, тестирование endpoints, конфигурация webhook. Полная консоль разработчика.',
      keywords: 'консоль lydian, консоль разработчика, управление api, api ключ, управление webhook'
    },
    zh: {
      title: '开发者控制台 — LyDian AI 平台 | API管理控制台',
      description: 'LyDian AI开发者控制台。API密钥管理、使用跟踪、端点测试、webhook配置。完整的开发者控制台，全面管理您的API集成和应用开发。',
      keywords: 'lydian控制台, 开发者控制台, api管理, api密钥, webhook管理'
    }
  },

  // 6. TOKENS PAGE
  'tokens.html': {
    tr: {
      title: 'Token Yönetimi — LyDian AI | API Token ve Krediler',
      description: 'LyDian AI token yönetim sayfası. API token\'larınızı yönetin, kredi bakiyesi görüntüleyin, kullanım geçmişi ve token yenileme. Güvenli token yönetimi.',
      keywords: 'lydian token, api token yönetimi, kredi bakiyesi, token güvenliği, kullanım takibi'
    },
    en: {
      title: 'Token Management — LyDian AI | API Tokens and Credits',
      description: 'LyDian AI token management page. Manage your API tokens, view credit balance, usage history, and token renewal. Secure token management.',
      keywords: 'lydian tokens, api token management, credit balance, token security, usage tracking'
    },
    de: {
      title: 'Token-Verwaltung — LyDian AI | API-Tokens und Guthaben',
      description: 'LyDian AI Token-Verwaltungsseite. Verwalten Sie Ihre API-Tokens, sehen Sie Ihr Guthaben, Nutzungsverlauf und Token-Erneuerung. Sichere Token-Verwaltung.',
      keywords: 'lydian token, api token verwaltung, guthaben, token sicherheit, nutzungsverfolgung'
    },
    ar: {
      title: 'إدارة الرموز — LyDian AI | رموز API والرصيد',
      description: 'صفحة إدارة رموز LyDian AI. أدر رموز API الخاصة بك، عرض رصيد الرصيد، سجل الاستخدام، وتجديد الرموز. إدارة آمنة للرموز.',
      keywords: 'رموز lydian, إدارة رموز api, رصيد الرصيد, أمان الرموز, تتبع الاستخدام'
    },
    ru: {
      title: 'Управление токенами — LyDian AI | API-токены и кредиты',
      description: 'Страница управления токенами LyDian AI. Управляйте вашими API-токенами, просматривайте баланс кредитов, историю использования и обновление токенов. Безопасное управление токенами.',
      keywords: 'токены lydian, управление api токенами, баланс кредитов, безопасность токенов, отслеживание использования'
    },
    zh: {
      title: '令牌管理 — LyDian AI 平台 | API令牌和积分',
      description: 'LyDian AI令牌管理页面。管理您的API令牌，查看积分余额、使用历史和令牌续订。安全的令牌管理，保护您的API访问权限和账户安全。',
      keywords: 'lydian令牌, api令牌管理, 积分余额, 令牌安全, 使用跟踪'
    }
  },

  // 7. LYDIAN LEGAL SEARCH PAGE
  'lydian-legal-search.html': {
    tr: {
      title: 'Hukuki AI Arama — LyDian Legal | Türk Hukuku Arama Motoru',
      description: 'LyDian Legal AI arama motoru. Türk hukuku, içtihat, kanunlar ve yönetmelikler. AI destekli hukuki araştırma ve analiz platformu.',
      keywords: 'lydian hukuk arama, türk hukuku, içtihat arama, ai hukuk, yasal araştırma'
    },
    en: {
      title: 'Legal AI Search — LyDian Legal | Turkish Law Search Engine',
      description: 'LyDian Legal AI search engine. Turkish law, jurisprudence, legislation, and regulations. AI-powered legal research and analysis platform.',
      keywords: 'lydian legal search, turkish law, jurisprudence search, ai legal, legal research'
    },
    de: {
      title: 'Rechtliche KI-Suche — LyDian Legal | Türkisches Rechts-Suchmaschine',
      description: 'LyDian Legal KI-Suchmaschine. Türkisches Recht, Rechtsprechung, Gesetze und Verordnungen. KI-gestützte Rechtsrecherche- und Analyseplattform.',
      keywords: 'lydian rechtssuche, türkisches recht, rechtsprechungssuche, ki recht, rechtsrecherche'
    },
    ar: {
      title: 'البحث القانوني بالذكاء الاصطناعي — LyDian Legal | محرك بحث القانون التركي',
      description: 'محرك بحث LyDian Legal AI. القانون التركي، الفقه القانوني، التشريعات، واللوائح. منصة بحث وتحليل قانوني مدعومة بالذكاء الاصطناعي.',
      keywords: 'بحث lydian القانوني, القانون التركي, بحث الفقه القانوني, ai قانوني, البحث القانوني'
    },
    ru: {
      title: 'Юридический поиск ИИ — LyDian Legal | Поисковик турецкого права',
      description: 'Поисковая система LyDian Legal AI. Турецкое право, юриспруденция, законодательство и нормативные акты. Платформа юридических исследований и анализа на основе ИИ.',
      keywords: 'юридический поиск lydian, турецкое право, поиск юриспруденции, юридический ии, юридические исследования'
    },
    zh: {
      title: '法律AI搜索 — LyDian Legal 平台 | 土耳其法律搜索引擎',
      description: 'LyDian Legal AI搜索引擎。土耳其法律、判例、立法和法规。AI驱动的法律研究和分析平台，提供专业法律信息检索和智能分析服务。',
      keywords: 'lydian法律搜索, 土耳其法律, 判例搜索, ai法律, 法律研究'
    }
  },

  // 8. LYDIAN HUKUKAI PAGE
  'lydian-hukukai.html': {
    tr: {
      title: 'LyDian HukukAI — Yapay Zeka Hukuk Asistanı',
      description: 'LyDian HukukAI, Türkiye\'nin en gelişmiş AI hukuk asistanı. Sözleşme analizi, dava araştırması, yasal danışmanlık ve hukuki doküman oluşturma.',
      keywords: 'lydian hukukai, ai hukuk asistanı, sözleşme analizi, yasal danışmanlık, hukuki ai'
    },
    en: {
      title: 'LyDian HukukAI — Artificial Intelligence Legal Assistant',
      description: 'LyDian HukukAI, Turkey\'s most advanced AI legal assistant. Contract analysis, case research, legal consultation, and legal document creation.',
      keywords: 'lydian hukukai, ai legal assistant, contract analysis, legal consultation, legal ai'
    },
    de: {
      title: 'LyDian HukukAI — KI-Rechtsassistent',
      description: 'LyDian HukukAI, der fortschrittlichste KI-Rechtsassistent der Türkei. Vertragsanalyse, Fallrecherche, Rechtsberatung und Erstellung rechtlicher Dokumente.',
      keywords: 'lydian hukukai, ki rechtsassistent, vertragsanalyse, rechtsberatung, rechtliche ki'
    },
    ar: {
      title: 'LyDian HukukAI — مساعد قانوني بالذكاء الاصطناعي',
      description: 'LyDian HukukAI، المساعد القانوني الأكثر تقدمًا في تركيا. تحليل العقود، البحث في القضايا، الاستشارات القانونية، وإنشاء المستندات القانونية.',
      keywords: 'lydian hukukai, مساعد قانوني ai, تحليل العقود, استشارة قانونية, ai قانوني'
    },
    ru: {
      title: 'LyDian HukukAI — Юридический ассистент на базе ИИ',
      description: 'LyDian HukukAI, самый продвинутый юридический ИИ-ассистент Турции. Анализ контрактов, исследование дел, юридические консультации и создание правовых документов.',
      keywords: 'lydian hukukai, юридический ии ассистент, анализ контрактов, юридическая консультация, юридический ии'
    },
    zh: {
      title: 'LyDian HukukAI — 人工智能法律助手',
      description: 'LyDian HukukAI，土耳其最先进的AI法律助手。合同分析、案例研究、法律咨询和法律文件创建。专业智能法律服务，提升工作效率和准确性。',
      keywords: 'lydian hukukai, ai法律助手, 合同分析, 法律咨询, 法律ai'
    }
  },

  // 9. MEDICAL AI PAGE
  'medical-ai.html': {
    tr: {
      title: 'Medical AI — LyDian Health | Tıbbi Yapay Zeka Platformu',
      description: 'LyDian Medical AI sağlık platformu. Teşhis desteği, görüntü analizi, hasta takibi ve klinik karar destek sistemi. Tıp profesyonelleri için AI.',
      keywords: 'lydian medical ai, tıbbi yapay zeka, teşhis desteği, görüntü analizi, klinik ai'
    },
    en: {
      title: 'Medical AI — LyDian Health | Medical Artificial Intelligence Platform',
      description: 'LyDian Medical AI health platform. Diagnostic support, image analysis, patient monitoring, and clinical decision support system. AI for medical professionals.',
      keywords: 'lydian medical ai, medical artificial intelligence, diagnostic support, image analysis, clinical ai'
    },
    de: {
      title: 'Medical AI — LyDian Health | Medizinische KI-Plattform',
      description: 'LyDian Medical AI Gesundheitsplattform. Diagnosehilfe, Bildanalyse, Patientenüberwachung und klinisches Entscheidungsunterstützungssystem. KI für Mediziner.',
      keywords: 'lydian medical ai, medizinische künstliche intelligenz, diagnosehilfe, bildanalyse, klinische ki'
    },
    ar: {
      title: 'Medical AI — LyDian Health | منصة الذكاء الاصطناعي الطبية',
      description: 'منصة LyDian Medical AI الصحية. دعم التشخيص، تحليل الصور، مراقبة المرضى، ونظام دعم القرار السريري. الذكاء الاصطناعي للمهنيين الطبيين.',
      keywords: 'lydian medical ai, الذكاء الاصطناعي الطبي, دعم التشخيص, تحليل الصور, ai سريري'
    },
    ru: {
      title: 'Medical AI — LyDian Health | Медицинская платформа ИИ',
      description: 'Медицинская платформа LyDian Medical AI. Поддержка диагностики, анализ изображений, мониторинг пациентов и система поддержки клинических решений. ИИ для медицинских специалистов.',
      keywords: 'lydian medical ai, медицинский искусственный интеллект, поддержка диагностики, анализ изображений, клинический ии'
    },
    zh: {
      title: 'Medical AI — LyDian Health 平台 | 医疗人工智能平台',
      description: 'LyDian Medical AI健康平台。诊断支持、图像分析、患者监控和临床决策支持系统。面向医疗专业人员的AI解决方案，提升诊疗效率和准确性。',
      keywords: 'lydian medical ai, 医疗人工智能, 诊断支持, 图像分析, 临床ai'
    }
  },

  // 10. GOVERNANCE DASHBOARD PAGE
  'governance-dashboard.html': {
    tr: {
      title: 'Yönetişim Dashboard — LyDian AI | AI Governance & Compliance',
      description: 'LyDian AI yönetişim dashboard\'u. AI ethics, compliance tracking, audit logs, model governance ve risk yönetimi. Şeffaf ve sorumlu AI.',
      keywords: 'lydian yönetişim, ai ethics, compliance, model governance, ai risk yönetimi'
    },
    en: {
      title: 'Governance Dashboard — LyDian AI | AI Governance & Compliance',
      description: 'LyDian AI governance dashboard. AI ethics, compliance tracking, audit logs, model governance, and risk management. Transparent and responsible AI.',
      keywords: 'lydian governance, ai ethics, compliance, model governance, ai risk management'
    },
    de: {
      title: 'Governance-Dashboard — LyDian AI | KI-Governance & Compliance',
      description: 'LyDian AI Governance-Dashboard. KI-Ethik, Compliance-Tracking, Audit-Logs, Modell-Governance und Risikomanagement. Transparente und verantwortungsvolle KI.',
      keywords: 'lydian governance, ki ethik, compliance, modell governance, ki risikomanagement'
    },
    ar: {
      title: 'لوحة الحوكمة — LyDian AI | حوكمة AI والامتثال',
      description: 'لوحة حوكمة LyDian AI. أخلاقيات AI، تتبع الامتثال، سجلات التدقيق، حوكمة النماذج، وإدارة المخاطر. ذكاء اصطناعي شفاف ومسؤول.',
      keywords: 'حوكمة lydian, أخلاقيات ai, الامتثال, حوكمة النماذج, إدارة مخاطر ai'
    },
    ru: {
      title: 'Панель управления — LyDian AI | Управление ИИ и соответствие',
      description: 'Панель управления LyDian AI. Этика ИИ, отслеживание соответствия, журналы аудита, управление моделями и управление рисками. Прозрачный и ответственный ИИ.',
      keywords: 'управление lydian, этика ии, соответствие, управление моделями, управление рисками ии'
    },
    zh: {
      title: '治理仪表板 — LyDian AI 平台 | AI治理与合规',
      description: 'LyDian AI治理仪表板。AI伦理、合规跟踪、审计日志、模型治理和风险管理。透明和负责任的AI，确保合规运营和可持续发展。',
      keywords: 'lydian治理, ai伦理, 合规, 模型治理, ai风险管理'
    }
  }
};

module.exports = {
  TIER_2C_CONTENT
};
#!/usr/bin/env node

/**
 * TIER 2A SEO CONTENT DATABASE
 *
 * High-priority pages SEO content (10 pages × 6 languages = 60 packages)
 * - about.html, billing.html, contact.html, enterprise.html, api.html
 * - docs.html, auth.html, help.html, models.html, research.html
 *
 * @version 1.0.0
 * @date 2025-10-25
 */

const TIER_2A_CONTENT = {
  // 1. ABOUT PAGE
  'about.html': {
    tr: {
      title: 'Hakkımızda — LyDian AI Ekosistemi | Yapay Zeka Öncüleri',
      description: 'LyDian AI, kurumsal yapay zeka çözümlerinde dünya lideri. 40+ dilde hizmet, 8 uzman AI danışman ve yenilikçi teknoloji ile işletmelere güç katıyoruz.',
      keywords: 'lydian ai hakkında, yapay zeka şirketi, ai ekosistemi türkiye, kurumsal ai çözümleri, ai teknoloji lideri'
    },
    en: {
      title: 'About Us — LyDian AI Ecosystem | Leading AI Innovation',
      description: 'LyDian AI is a global leader in enterprise AI solutions. Serving 40+ languages with 8 expert AI advisors and cutting-edge technology empowering businesses worldwide.',
      keywords: 'about lydian ai, ai company, artificial intelligence ecosystem, enterprise ai solutions, ai technology leader'
    },
    de: {
      title: 'Über uns — LyDian AI Ökosystem | KI-Innovation führend',
      description: 'LyDian AI ist weltweit führend bei KI-Unternehmenslösungen. Mit 40+ Sprachen, 8 KI-Experten und innovativer Technologie stärken wir Unternehmen global.',
      keywords: 'über lydian ai, ki unternehmen, künstliche intelligenz ökosystem, unternehmens ki lösungen, ki technologie führer'
    },
    ar: {
      title: 'معلومات عنا — نظام LyDian AI | رواد الذكاء الاصطناعي للشركات',
      description: 'LyDian AI هي الرائدة عالمياً في حلول الذكاء الاصطناعي للشركات. نخدم أكثر من 40 لغة مع 8 مستشارين خبراء وتكنولوجيا متقدمة لتمكين الأعمال في جميع أنحاء العالم.',
      keywords: 'معلومات عن lydian ai, شركة ذكاء اصطناعي, نظام ai للشركات, حلول ai متقدمة, قائد تكنولوجيا الذكاء الاصطناعي'
    },
    ru: {
      title: 'О нас — Экосистема LyDian AI | Лидер корпоративного ИИ',
      description: 'LyDian AI — мировой лидер корпоративных ИИ-решений. Поддержка 40+ языков, 8 экспертных ИИ-консультантов и передовые технологии для бизнеса по всему миру.',
      keywords: 'о lydian ai, компания искусственного интеллекта, экосистема ии, корпоративные решения ии, лидер ии технологий'
    },
    zh: {
      title: '关于我们 — LyDian AI生态系统 | 企业人工智能领导者',
      description: 'LyDian AI是全球企业AI解决方案的领导者。支持40多种语言，拥有8位专家AI顾问和尖端技术，为全球企业赋能。立即了解我们的创新之旅、愿景使命和技术优势，开启智能化转型新篇章。',
      keywords: '关于lydian ai, 人工智能公司, ai生态系统, 企业ai解决方案, ai技术领导者'
    }
  },

  // 2. BILLING PAGE
  'billing.html': {
    tr: {
      title: 'Fiyatlandırma & Faturalama — LyDian AI | Esnek Paketler',
      description: 'LyDian AI esnek fiyatlandırma paketleri. Ücretsiz başlayın, kullandıkça ödeyin veya kurumsal planlarımızla tam kontrol. Şeffaf fiyatlandırma garantisi.',
      keywords: 'lydian ai fiyatları, ai fiyatlandırma, yapay zeka paketleri, ücretsiz ai denemesi, kurumsal ai fiyat'
    },
    en: {
      title: 'Pricing & Billing — LyDian AI | Flexible Plans for Every Need',
      description: 'LyDian AI flexible pricing packages. Start free, pay-as-you-go, or choose enterprise plans for full control. Transparent pricing guaranteed with no hidden fees.',
      keywords: 'lydian ai pricing, ai pricing plans, artificial intelligence packages, free ai trial, enterprise ai cost'
    },
    de: {
      title: 'Preise & Abrechnung — LyDian AI | Flexible Pakete für jeden',
      description: 'LyDian AI flexible Preispakete. Kostenlos starten, nutzungsbasiert zahlen oder Enterprise-Pläne mit voller Kontrolle. Transparente Preise garantiert.',
      keywords: 'lydian ai preise, ki preise, künstliche intelligenz pakete, kostenlose ki testversion, unternehmens ki kosten'
    },
    ar: {
      title: 'الأسعار والفواتير — LyDian AI | باقات مرنة لكل احتياج',
      description: 'باقات تسعير مرنة من LyDian AI. ابدأ مجاناً، الدفع حسب الاستخدام، أو اختر خطط المؤسسات للتحكم الكامل. تسعير شفاف مضمون بدون رسوم خفية.',
      keywords: 'أسعار lydian ai, تسعير الذكاء الاصطناعي, باقات ai, تجربة ai مجانية, تكلفة ai للشركات'
    },
    ru: {
      title: 'Цены и Оплата — LyDian AI | Гибкие тарифы для каждого',
      description: 'Гибкие тарифные планы LyDian AI. Начните бесплатно, платите по факту использования или выберите корпоративный план. Прозрачные цены гарантированы.',
      keywords: 'цены lydian ai, тарифы на ии, пакеты искусственного интеллекта, бесплатная пробная версия ии, стоимость корпоративного ии'
    },
    zh: {
      title: '定价与计费 — LyDian AI | 灵活套餐满足每一需求',
      description: 'LyDian AI灵活定价套餐。免费开始，按需付费，或选择企业计划获得全面控制。保证透明定价，无隐藏费用。立即查看适合您的AI解决方案价格，助力企业降本增效，实现智能化升级。',
      keywords: 'lydian ai价格, ai定价, 人工智能套餐, 免费ai试用, 企业ai成本'
    }
  },

  // 3. CONTACT PAGE
  'contact.html': {
    tr: {
      title: 'İletişim — LyDian AI | 7/24 Destek Ekibimizle Görüşün',
      description: 'LyDian AI ile iletişime geçin. 7/24 canlı destek, kurumsal satış danışmanlığı ve teknik yardım. 40+ dilde hizmet, anında yanıt garantisi.',
      keywords: 'lydian ai iletişim, ai destek, yapay zeka yardım, kurumsal satış ai, teknik destek lydian'
    },
    en: {
      title: 'Contact Us — LyDian AI | 24/7 Support Team Ready to Help',
      description: 'Contact LyDian AI today. 24/7 live support, enterprise sales consultation, and technical assistance. Service in 40+ languages with instant response guaranteed.',
      keywords: 'contact lydian ai, ai support, artificial intelligence help, enterprise ai sales, technical support lydian'
    },
    de: {
      title: 'Kontakt — LyDian AI | 24/7 Support-Team bereit zu helfen',
      description: 'Kontaktieren Sie LyDian AI. 24/7 Live-Support, Unternehmensverkaufsberatung und technische Hilfe. Service in 40+ Sprachen mit garantierter schneller Antwort.',
      keywords: 'lydian ai kontakt, ki support, künstliche intelligenz hilfe, unternehmens ki vertrieb, technischer support lydian'
    },
    ar: {
      title: 'اتصل بنا — LyDian AI | فريق الدعم على مدار الساعة جاهز للمساعدة',
      description: 'اتصل بـ LyDian AI اليوم. دعم مباشر على مدار الساعة، استشارات المبيعات للشركات، ومساعدة تقنية. خدمة بأكثر من 40 لغة مع ضمان الرد الفوري.',
      keywords: 'اتصل lydian ai, دعم ai, مساعدة الذكاء الاصطناعي, مبيعات ai للشركات, الدعم الفني lydian'
    },
    ru: {
      title: 'Контакты — LyDian AI | Команда поддержки 24/7 готова помочь',
      description: 'Свяжитесь с LyDian AI. Поддержка 24/7, консультации по продажам и техпомощь. Обслуживание на 40+ языках с быстрым ответом.',
      keywords: 'контакты lydian ai, поддержка ии, помощь искусственного интеллекта, продажи корпоративного ии, техническая поддержка lydian'
    },
    zh: {
      title: '联系我们 — LyDian AI 平台 | 全天候支持团队随时待命',
      description: '立即联系LyDian AI。全天候在线支持，企业销售咨询和技术援助。支持40多种语言，保证即时响应。我们的专家团队随时为您提供帮助，解答疑问，助力业务成功和发展。',
      keywords: '联系lydian ai, ai支持, 人工智能帮助, 企业ai销售, lydian技术支持'
    }
  },

  // 4. ENTERPRISE PAGE
  'enterprise.html': {
    tr: {
      title: 'Kurumsal Çözümler — LyDian AI | Ölçeklenebilir AI Platformu',
      description: 'Fortune 500 şirketlerinin tercihi LyDian AI kurumsal çözümleri. Özel entegrasyon, SLA garantisi, özel model eğitimi ve 7/24 premium destek.',
      keywords: 'kurumsal ai, lydian enterprise, şirket ai çözümleri, özel ai modeli, kurumsal yapay zeka platformu'
    },
    en: {
      title: 'Enterprise Solutions — LyDian AI | Scalable AI Platform',
      description: 'LyDian AI enterprise solutions trusted by Fortune 500 companies. Custom integration, SLA guarantee, dedicated model training, and 24/7 premium support.',
      keywords: 'enterprise ai, lydian enterprise solutions, corporate ai platform, custom ai model, enterprise artificial intelligence'
    },
    de: {
      title: 'Unternehmenslösungen — LyDian AI | Skalierbare KI-Plattform',
      description: 'LyDian AI Unternehmenslösungen, vertraut von Fortune 500 Unternehmen. Individuelle Integration, SLA-Garantie, dediziertes Modelltraining und 24/7 Premium-Support.',
      keywords: 'unternehmens ki, lydian enterprise lösungen, firmen ki plattform, benutzerdefiniertes ki modell, unternehmens künstliche intelligenz'
    },
    ar: {
      title: 'حلول المؤسسات — LyDian AI | منصة ذكاء اصطناعي قابلة للتوسع',
      description: 'حلول LyDian AI للمؤسسات موثوقة من قبل شركات Fortune 500. تكامل مخصص، ضمان SLA، تدريب نموذج مخصص، ودعم مميز على مدار الساعة.',
      keywords: 'ai للمؤسسات, حلول lydian للشركات, منصة ai للشركات, نموذج ai مخصص, ذكاء اصطناعي للمؤسسات'
    },
    ru: {
      title: 'Корпоративные решения — LyDian AI | Масштабируемая ИИ-платформа',
      description: 'Решения LyDian AI для Fortune 500. Интеграция, SLA, обучение моделей и поддержка 24/7. Цифровая трансформация бизнеса.',
      keywords: 'корпоративный ии, lydian корпоративные решения, корпоративная ии платформа, индивидуальная ии модель, корпоративный искусственный интеллект'
    },
    zh: {
      title: '企业解决方案 — LyDian AI 平台 | 可扩展的人工智能平台',
      description: 'LyDian AI企业解决方案受到Fortune 500公司的信赖。定制集成、SLA保证、专属模型训练和全天候高级支持。助力企业数字化转型升级，提升运营效率和竞争力，实现智能化发展。',
      keywords: '企业ai, lydian企业解决方案, 公司ai平台, 定制ai模型, 企业人工智能'
    }
  },

  // 5. API PAGE
  'api.html': {
    tr: {
      title: 'API Dokümantasyonu — LyDian AI | Geliştiriciler için Güçlü API',
      description: 'LyDian AI RESTful API ile uygulamalarınıza yapay zeka entegre edin. Kapsamlı dokümantasyon, SDK\'lar ve örnek kodlarla hızlı başlayın.',
      keywords: 'lydian api, ai api, yapay zeka entegrasyonu, restful api ai, geliştirici api lydian'
    },
    en: {
      title: 'API Documentation — LyDian AI | Powerful API for Developers',
      description: 'Integrate artificial intelligence into your applications with LyDian AI RESTful API. Comprehensive documentation, SDKs, and sample code to get started quickly.',
      keywords: 'lydian api, ai api, artificial intelligence integration, restful api ai, developer api lydian'
    },
    de: {
      title: 'API-Dokumentation — LyDian AI | Starke API für Entwickler',
      description: 'Integrieren Sie künstliche Intelligenz in Ihre Anwendungen mit LyDian AI RESTful API. Umfassende Dokumentation, SDKs und Beispielcode für schnellen Start.',
      keywords: 'lydian api, ki api, künstliche intelligenz integration, restful api ki, entwickler api lydian'
    },
    ar: {
      title: 'توثيق API — LyDian AI | واجهة برمجية قوية للمطورين',
      description: 'دمج الذكاء الاصطناعي في تطبيقاتك باستخدام LyDian AI RESTful API. توثيق شامل، SDK، وأمثلة التعليمات البرمجية للبدء بسرعة.',
      keywords: 'lydian api, واجهة ai, تكامل الذكاء الاصطناعي, restful api ai, api للمطورين lydian'
    },
    ru: {
      title: 'Документация API — LyDian AI | Мощный API для разработчиков',
      description: 'Интегрируйте ИИ в приложения с LyDian AI RESTful API. Документация, SDK и примеры кода для быстрого старта.',
      keywords: 'lydian api, ии api, интеграция искусственного интеллекта, restful api ии, разработчик api lydian'
    },
    zh: {
      title: 'API文档中心 — LyDian AI 平台 | 强大的开发者API接口',
      description: '使用LyDian AI RESTful API将人工智能集成到您的应用程序中。全面的文档、SDK和示例代码助您快速入门。企业级稳定性和性能保证，轻松实现AI功能集成，加速业务创新。',
      keywords: 'lydian api, ai接口, 人工智能集成, restful api ai, 开发者api lydian'
    }
  },

  // 6. DOCS PAGE
  'docs.html': {
    tr: {
      title: 'Dokümantasyon — LyDian AI | Kapsamlı Kullanım Rehberleri',
      description: 'LyDian AI platformu için eksiksiz dokümantasyon. Başlangıç rehberleri, API referansı, örnekler ve en iyi uygulamalar. 40+ dilde mevcut.',
      keywords: 'lydian dokümantasyon, ai kullanım kılavuzu, yapay zeka rehberi, api referans, lydian öğrenme kaynakları'
    },
    en: {
      title: 'Documentation — LyDian AI | Comprehensive Usage Guides',
      description: 'Complete documentation for LyDian AI platform. Getting started guides, API reference, examples, and best practices. Available in 40+ languages.',
      keywords: 'lydian documentation, ai user guide, artificial intelligence manual, api reference, lydian learning resources'
    },
    de: {
      title: 'Dokumentation — LyDian AI | Umfassende Nutzungsanleitungen',
      description: 'Vollständige Dokumentation für die LyDian AI-Plattform. Erste Schritte, API-Referenz, Beispiele und Best Practices. Verfügbar in 40+ Sprachen.',
      keywords: 'lydian dokumentation, ki benutzerhandbuch, künstliche intelligenz anleitung, api referenz, lydian lernressourcen'
    },
    ar: {
      title: 'التوثيق — LyDian AI | أدلة استخدام شاملة',
      description: 'توثيق كامل لمنصة LyDian AI. أدلة البدء، مرجع API، الأمثلة، وأفضل الممارسات. متاح بأكثر من 40 لغة.',
      keywords: 'توثيق lydian, دليل مستخدم ai, دليل الذكاء الاصطناعي, مرجع api, موارد تعلم lydian'
    },
    ru: {
      title: 'Документация — LyDian AI | Полные руководства по использованию',
      description: 'Документация платформы LyDian AI. Руководства, справочник API, примеры и практики. Доступно на 40+ языках.',
      keywords: 'документация lydian, руководство пользователя ии, руководство искусственного интеллекта, справочник api, обучающие ресурсы lydian'
    },
    zh: {
      title: '文档中心 — LyDian AI 智能平台 | 全面的使用指南',
      description: 'LyDian AI平台的完整文档。入门指南、API参考、示例和最佳实践。支持40多种语言。全方位帮助您快速掌握和高效使用我们的AI平台，轻松实现业务目标，提升工作效率。',
      keywords: 'lydian文档, ai用户指南, 人工智能手册, api参考, lydian学习资源'
    }
  },

  // 7. AUTH PAGE
  'auth.html': {
    tr: {
      title: 'Giriş & Kayıt — LyDian AI | Ücretsiz Hesap Oluşturun',
      description: 'LyDian AI hesabınızı oluşturun ve yapay zekanın gücünü keşfedin. Google, Microsoft ile hızlı giriş veya e-posta ile kayıt. Ücretsiz deneme dahil.',
      keywords: 'lydian giriş, ai kayıt, ücretsiz ai hesabı, yapay zeka platformu giriş, lydian üyelik'
    },
    en: {
      title: 'Login & Sign Up — LyDian AI | Create Your Free Account',
      description: 'Create your LyDian AI account and discover the power of artificial intelligence. Quick sign-in with Google, Microsoft, or email registration. Free trial included.',
      keywords: 'lydian login, ai sign up, free ai account, artificial intelligence platform login, lydian membership'
    },
    de: {
      title: 'Anmelden & Registrieren — LyDian AI | Kostenloses Konto erstellen',
      description: 'Erstellen Sie Ihr LyDian AI-Konto und entdecken Sie KI. Schnelle Anmeldung mit Google, Microsoft oder E-Mail. Kostenlose Testversion inklusive.',
      keywords: 'lydian anmeldung, ki registrierung, kostenloses ki konto, künstliche intelligenz plattform anmeldung, lydian mitgliedschaft'
    },
    ar: {
      title: 'تسجيل الدخول والاشتراك — LyDian AI | أنشئ حسابك المجاني',
      description: 'أنشئ حساب LyDian AI الخاص بك واكتشف قوة الذكاء الاصطناعي. تسجيل دخول سريع باستخدام Google أو Microsoft أو البريد الإلكتروني. تجربة مجانية متضمنة.',
      keywords: 'تسجيل دخول lydian, اشتراك ai, حساب ai مجاني, تسجيل دخول منصة الذكاء الاصطناعي, عضوية lydian'
    },
    ru: {
      title: 'Вход и Регистрация — LyDian AI | Создайте бесплатный аккаунт',
      description: 'Создайте аккаунт LyDian AI и откройте возможности ИИ. Вход через Google, Microsoft или email. Пробная версия включена.',
      keywords: 'вход lydian, регистрация ии, бесплатный аккаунт ии, вход на платформу искусственного интеллекта, членство lydian'
    },
    zh: {
      title: '登录与注册 — LyDian AI 平台 | 创建您的免费账户',
      description: '创建您的LyDian AI账户，探索人工智能的强大力量。使用Google、Microsoft快速登录或电子邮件注册。包含免费试用。立即开始您的AI之旅，体验智能化服务。',
      keywords: 'lydian登录, ai注册, 免费ai账户, 人工智能平台登录, lydian会员'
    }
  },

  // 8. HELP PAGE
  'help.html': {
    tr: {
      title: 'Yardım Merkezi — LyDian AI | SSS, Rehberler ve Destek',
      description: 'LyDian AI yardım merkezi. Sık sorulan sorular, video rehberler, kullanım kılavuzları ve canlı destek. 7/24 yardıma hazırız.',
      keywords: 'lydian yardım, ai destek merkezi, sss yapay zeka, kullanım rehberi ai, lydian müşteri hizmetleri'
    },
    en: {
      title: 'Help Center — LyDian AI | FAQ, Guides, and Support',
      description: 'LyDian AI help center. Frequently asked questions, video guides, user manuals, and live support. We are here to help 24/7.',
      keywords: 'lydian help, ai support center, faq artificial intelligence, ai usage guide, lydian customer service'
    },
    de: {
      title: 'Hilfecenter — LyDian AI | FAQ, Anleitungen und Support',
      description: 'LyDian AI Hilfecenter. Häufig gestellte Fragen, Videoanleitungen, Benutzerhandbücher und Live-Support. Wir helfen 24/7.',
      keywords: 'lydian hilfe, ki support center, faq künstliche intelligenz, ki nutzungsanleitung, lydian kundenservice'
    },
    ar: {
      title: 'مركز المساعدة — LyDian AI | الأسئلة الشائعة والأدلة والدعم',
      description: 'مركز مساعدة LyDian AI. الأسئلة المتكررة، أدلة الفيديو، كتيبات المستخدم، والدعم المباشر. نحن هنا للمساعدة على مدار الساعة.',
      keywords: 'مساعدة lydian, مركز دعم ai, أسئلة شائعة الذكاء الاصطناعي, دليل استخدام ai, خدمة عملاء lydian'
    },
    ru: {
      title: 'Центр помощи — LyDian AI | FAQ, Руководства и Поддержка',
      description: 'Центр помощи LyDian AI. Часто задаваемые вопросы, видеоруководства, инструкции пользователя и поддержка в реальном времени. Мы здесь, чтобы помочь 24/7.',
      keywords: 'помощь lydian, центр поддержки ии, часто задаваемые вопросы искусственный интеллект, руководство по использованию ии, служба поддержки lydian'
    },
    zh: {
      title: '帮助中心 — LyDian AI 平台 | 常见问题、指南和支持',
      description: 'LyDian AI帮助中心。常见问题解答、视频指南、用户手册和在线支持。我们随时为您提供全天候帮助。快速解决您的疑问，轻松上手使用我们的AI平台服务，获得专业技术支持。',
      keywords: 'lydian帮助, ai支持中心, 人工智能常见问题, ai使用指南, lydian客户服务'
    }
  },

  // 9. MODELS PAGE
  'models.html': {
    tr: {
      title: 'AI Modelleri — LyDian AI | 50+ Güçlü Yapay Zeka Modeli',
      description: 'LyDian AI platformunda 50+ son teknoloji yapay zeka modeli. GPT-4, Claude, Gemini ve daha fazlası. Metin, görüntü, video ve ses için AI modelleri.',
      keywords: 'ai modelleri, yapay zeka modelleri lydian, gpt-4 türkiye, claude ai, gemini ai, çok modelli ai'
    },
    en: {
      title: 'AI Models — LyDian AI | 50+ Powerful AI Models',
      description: 'Access 50+ state-of-the-art AI models on LyDian AI platform. GPT-4, Claude, Gemini, and more. AI models for text, image, video, and audio processing.',
      keywords: 'ai models, artificial intelligence models lydian, gpt-4, claude ai, gemini ai, multi-model ai'
    },
    de: {
      title: 'KI-Modelle — LyDian AI | 50+ Leistungsstarke KI-Modelle',
      description: 'Zugriff auf 50+ hochmoderne KI-Modelle auf der LyDian AI-Plattform. GPT-4, Claude, Gemini und mehr. KI-Modelle für Text, Bild, Video und Audio.',
      keywords: 'ki modelle, künstliche intelligenz modelle lydian, gpt-4 deutschland, claude ki, gemini ki, multi-modell ki'
    },
    ar: {
      title: 'نماذج الذكاء الاصطناعي — LyDian AI | أكثر من 50 نموذج AI قوي',
      description: 'الوصول إلى أكثر من 50 نموذج AI متطور على منصة LyDian AI. GPT-4، Claude، Gemini، والمزيد. نماذج AI للنص والصورة والفيديو والصوت.',
      keywords: 'نماذج ai, نماذج الذكاء الاصطناعي lydian, gpt-4, claude ai, gemini ai, ai متعدد النماذج'
    },
    ru: {
      title: 'ИИ-модели — LyDian AI | Более 50 мощных моделей ИИ',
      description: 'Доступ к более чем 50 передовым моделям ИИ на платформе LyDian AI. GPT-4, Claude, Gemini и другие. Модели ИИ для текста, изображений, видео и аудио.',
      keywords: 'модели ии, модели искусственного интеллекта lydian, gpt-4 россия, claude ии, gemini ии, мультимодельный ии'
    },
    zh: {
      title: 'AI模型库 — LyDian AI 平台 | 50多个强大AI模型',
      description: '在LyDian AI平台访问50多个最先进的AI模型。GPT-4、Claude、Gemini等。用于文本、图像、视频和音频处理的AI模型。企业级稳定性保证，满足各类智能化需求。',
      keywords: 'ai模型, lydian人工智能模型, gpt-4中国, claude ai, gemini ai, 多模型ai'
    }
  },

  // 10. RESEARCH PAGE
  'research.html': {
    tr: {
      title: 'Araştırma & Yenilikler — LyDian AI | Yapay Zeka Araştırmaları',
      description: 'LyDian AI araştırma laboratuvarları. Son AI trendleri, teknik makaleler, case study\'ler ve yenilikçi projeler. Yapay zeka geleceğini şekillendiriyoruz.',
      keywords: 'ai araştırma, yapay zeka yenilikler, ai laboratuvarı, makine öğrenmesi araştırma, lydian innovation'
    },
    en: {
      title: 'Research & Innovation — LyDian AI | AI Research Labs',
      description: 'LyDian AI research laboratories. Latest AI trends, technical papers, case studies, and innovative projects. Shaping the future of artificial intelligence.',
      keywords: 'ai research, artificial intelligence innovation, ai laboratory, machine learning research, lydian innovation'
    },
    de: {
      title: 'Forschung & Innovation — LyDian AI | KI-Forschung',
      description: 'LyDian AI Forschungslabore. Neueste KI-Trends, technische Publikationen, Fallstudien und innovative Projekte. Die Zukunft der KI gestalten.',
      keywords: 'ki forschung, künstliche intelligenz innovation, ki labor, maschinelles lernen forschung, lydian innovation'
    },
    ar: {
      title: 'البحث والابتكار — LyDian AI | أبحاث الذكاء الاصطناعي',
      description: 'مختبرات أبحاث LyDian AI. أحدث اتجاهات AI، الأوراق التقنية، دراسات الحالة، والمشاريع المبتكرة. نشكل مستقبل الذكاء الاصطناعي.',
      keywords: 'أبحاث ai, ابتكار الذكاء الاصطناعي, مختبر ai, أبحاث التعلم الآلي, lydian ابتكار'
    },
    ru: {
      title: 'Исследования и Инновации — LyDian AI | Исследования ИИ',
      description: 'Исследовательские лаборатории LyDian AI. Новейшие тенденции ИИ, технические статьи, кейсы и инновационные проекты. Формируем будущее искусственного интеллекта.',
      keywords: 'исследования ии, инновации искусственного интеллекта, лаборатория ии, исследования машинного обучения, lydian инновации'
    },
    zh: {
      title: '研究与创新 — LyDian AI 平台 | 人工智能研究实验室',
      description: 'LyDian AI研究实验室。最新AI趋势、技术论文、案例研究和创新项目。塑造人工智能的未来。引领行业技术发展方向和创新突破，推动AI技术不断进步和应用落地，助力企业实现智能化转型。',
      keywords: 'ai研究, 人工智能创新, ai实验室, 机器学习研究, lydian创新'
    }
  }
};

module.exports = {
  TIER_2A_CONTENT
};

const { TIER_2A_CONTENT } = require('./tier2a-seo-content');
const { TIER_2B_CONTENT } = require('./tier2b-seo-content');
const { TIER_2C_CONTENT } = require('./tier2c-seo-content');

const TIER_2_ALL = { ...TIER_2A_CONTENT, ...TIER_2B_CONTENT, ...TIER_2C_CONTENT };

module.exports = { TIER_2_ALL, TIER_2A_CONTENT, TIER_2B_CONTENT, TIER_2C_CONTENT };

