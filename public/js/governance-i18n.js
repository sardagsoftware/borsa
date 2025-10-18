/**
 * ACE Governance i18n System
 * BEYAZ ŞAPKALI (White-Hat) Implementation
 *
 * Provides internationalization support for governance dashboards
 * Default language: Turkish (tr)
 */

const GovernanceI18n = {
    // Current language
    currentLang: 'tr',

    // Translations
    translations: {
        tr: {
            // Navigation
            'nav.title': 'LyDian AI Yönetim Merkezi',
            'nav.back': 'Geri',
            'nav.logout': 'Çıkış',
            'nav.demo_user': 'Demo Kullanıcı',

            // Dashboard
            'dashboard.welcome': 'LyDian AI Yönetim Merkezi\'ne Hoş Geldiniz',
            'dashboard.subtitle': 'AI modellerini yönetin, uyumluluğu sağlayın ve güven skorlarını izleyin',
            'dashboard.total_models': 'Toplam Model',
            'dashboard.compliance_rate': 'Uyumluluk Oranı',
            'dashboard.avg_trust_score': 'Ort. Güven Skoru',
            'dashboard.total_checks': 'Toplam Kontrol',
            'dashboard.active': 'Aktif',
            'dashboard.testing': 'Test',
            'dashboard.passed': 'Geçti',
            'dashboard.total': 'Toplam',
            'dashboard.platinum': 'Platin',
            'dashboard.gold': 'Altın',

            // Stats Cards
            'stats.model_registry': 'Model Kayıt',
            'stats.model_desc': 'AI modellerini yaşam döngüsü takibi ile kaydedin ve yönetin',
            'stats.go_to_registry': 'Kayıta Git',
            'stats.compliance_checks': 'Uyumluluk Kontrolleri',
            'stats.compliance_desc': 'GDPR, HIPAA, CCPA ve SOC2 uyumluluk doğrulaması',
            'stats.go_to_compliance': 'Uyumluluğa Git',
            'stats.trust_index': 'Güven Endeksi',
            'stats.trust_desc': '5 boyutlu güven puanlama ve analiz',
            'stats.go_to_trust': 'Güven Endeksine Git',
            'stats.leaderboard': 'Liderlik Tablosu',
            'stats.leaderboard_desc': 'Güven skoruna göre sıralanan en iyi modeller',
            'stats.go_to_leaderboard': 'Liderlik Tablosuna Git',
            'stats.api_docs': 'API Dokümantasyonu',
            'stats.api_desc': 'Yönetim API\'leri için geliştirici referansı',
            'stats.view_docs': 'Dokümanları Görüntüle',
            'stats.audit_logs': 'Denetim Günlükleri',
            'stats.audit_desc': 'Tüm yönetim işlemlerini ve değişikliklerini takip edin',
            'stats.view_logs': 'Günlükleri Görüntüle',

            // Recent Activity
            'activity.title': 'Son Aktiviteler',
            'activity.registered': 'kaydedildi',
            'activity.checked': 'kontrol edildi',
            'activity.calculated': 'hesaplandı',
            'activity.updated': 'güncellendi',
            'activity.by': 'tarafından',
            'activity.model': 'model',
            'activity.compliance': 'uyumluluk',
            'activity.trust': 'güven',

            // Model Registry
            'models.title': 'Model Kayıt',
            'models.register': '+ Model Kaydet',
            'models.search': 'Ara',
            'models.search_placeholder': 'İsim veya sağlayıcıya göre ara...',
            'models.status': 'Durum',
            'models.all_statuses': 'Tüm Durumlar',
            'models.provider': 'Sağlayıcı',
            'models.all_providers': 'Tüm Sağlayıcılar',
            'models.name': 'Model',
            'models.version': 'Versiyon',
            'models.created': 'Oluşturuldu',
            'models.actions': 'İşlemler',
            'models.manage': 'Yönet',
            'models.view': 'Görüntüle',
            'models.no_models': 'Model bulunamadı. İlk modelinizi kaydedin!',

            // Model Status
            'status.DRAFT': 'Taslak',
            'status.TESTING': 'Test',
            'status.ACTIVE': 'Aktif',
            'status.DEPRECATED': 'Eski',
            'status.ARCHIVED': 'Arşivlenmiş',

            // Modal
            'modal.register_title': 'Yeni Model Kaydet',
            'modal.details_title': 'Model Detayları',
            'modal.close': 'Kapat',
            'modal.cancel': 'İptal',
            'modal.register_button': 'Modeli Kaydet',
            'modal.model_name': 'Model Adı',
            'modal.model_name_placeholder': 'örn., GPT-4 Tıbbi Asistan',
            'modal.version_label': 'Versiyon (Semantik)',
            'modal.version_placeholder': 'örn., 1.0.0 veya 2.1.3-beta',
            'modal.version_hint': 'Format: X.Y.Z (örn., 1.0.0)',
            'modal.provider_label': 'Sağlayıcı',
            'modal.select_provider': 'Sağlayıcı Seçin',
            'modal.description': 'Açıklama',
            'modal.description_placeholder': 'AI modelinin kısa açıklaması...',

            // Messages
            'msg.loading': 'Yükleniyor...',
            'msg.error': 'Hata',
            'msg.success': 'Başarılı',
            'msg.load_failed': 'Yükleme başarısız',
            'msg.register_success': 'Model başarıyla kaydedildi!',
            'msg.register_failed': 'Kayıt başarısız',
            'msg.status_updated': 'Durum başarıyla güncellendi!',
            'msg.status_failed': 'Durum güncellenemedi',

            // Security
            'security.secure_connection': '🔐 Güvenli Bağlantı - BEYAZ ŞAPKALI',

            // Pagination
            'pagination.showing': 'Gösterilen',
            'pagination.to': '-',
            'pagination.of': 'toplam',
            'pagination.models': 'model',
            'pagination.previous': 'Önceki',
            'pagination.next': 'Sonraki',

            // Compliance
            'compliance.title': 'Uyumluluk Kontrolleri',
            'compliance.run_validation': 'Doğrulama Çalıştır',
            'compliance.select_model': 'Model Seçin',
            'compliance.select_framework': 'Framework Seçin',
            'compliance.no_results': 'Henüz doğrulama sonucu yok',
            'compliance.run_first': 'İlk doğrulamanızı çalıştırın',
            'compliance.overall_score': 'Genel Skor',
            'compliance.critical_issues': 'Kritik Sorunlar',
            'compliance.warnings': 'Uyarılar',
            'compliance.recommendations': 'Öneriler',
            'compliance.tab_issues': 'Sorunlar & Uyarılar',
            'compliance.tab_criteria': 'Kriter Dökümü',
            'compliance.tab_recommendations': 'Öneriler',
            'compliance.history_title': 'Uyumluluk Geçmişi',

            // Trust Index
            'trust.title': 'Güven Endeksi Hesaplayıcı',
            'trust.calculate': 'Güven Endeksini Hesapla',
            'trust.select_model': 'Model Seçin',
            'trust.description': 'AI güvenilirliğini 5 boyutta değerlendirin',
            'trust.tiers_title': 'Güven Seviyeleri',
            'trust.no_calculation': 'Henüz güven endeksi hesaplanmadı',
            'trust.calculate_first': 'İlk hesaplamanızı yapın',
            'trust.global_score': 'Küresel Güven Skoru',
            'trust.analysis_title': '5 Boyutlu Analiz',
            'trust.dim_transparency': 'Şeffaflık',
            'trust.dim_transparency_desc': 'Model kararları ve işlemleri açık ve anlaşılır',
            'trust.dim_accountability': 'Hesap Verebilirlik',
            'trust.dim_accountability_desc': 'Eylemler için net sorumluluk ve izlenebilirlik',
            'trust.dim_fairness': 'Adalet',
            'trust.dim_fairness_desc': 'Tarafsız sonuçlar, önyargısız kararlar',
            'trust.dim_privacy': 'Gizlilik',
            'trust.dim_privacy_desc': 'Kullanıcı verilerini koruma ve güvenlik',
            'trust.dim_robustness': 'Dayanıklılık',
            'trust.dim_robustness_desc': 'Sağlam performans ve hata toleransı',
            'trust.strengths': 'Güçlü Yönler',
            'trust.weaknesses': 'Zayıf Yönler',
            'trust.recommendations': 'Öneriler',

            // Leaderboard
            'leaderboard.title': 'Güven Skoru Liderlik Tablosu',
            'leaderboard.total_models': 'Toplam Model',
            'leaderboard.avg_score': 'Ortalama Skor',
            'leaderboard.platinum_tier': 'Platin Seviye',
            'leaderboard.gold_tier': 'Altın Seviye',
            'leaderboard.filter_by_tier': 'Seviyeye Göre Filtrele',
            'leaderboard.all_tiers': 'Tüm Seviyeler',
            'leaderboard.rankings': 'Sıralamalar',
            'leaderboard.showing_models': 'model gösteriliyor',
            'leaderboard.no_models': 'Model bulunamadı',
            'leaderboard.adjust_filters': 'Filtrelerinizi ayarlayın',
            'leaderboard.tier_distribution': 'Seviye Dağılımı',
            'leaderboard.recent_calculations': 'Son Hesaplamalar',
            'leaderboard.tier_platinum': 'Platin',
            'leaderboard.tier_gold': 'Altın',
            'leaderboard.tier_silver': 'Gümüş',
            'leaderboard.tier_bronze': 'Bronz',
            'leaderboard.tier_unverified': 'Doğrulanmamış'
        },
        en: {
            // Navigation
            'nav.title': 'AI Governance Center',
            'nav.back': 'Back',
            'nav.logout': 'Logout',
            'nav.demo_user': 'Demo User',

            // Dashboard
            'dashboard.welcome': 'Welcome to AI Governance',
            'dashboard.subtitle': 'Manage AI models, ensure compliance, and monitor trust scores',
            'dashboard.total_models': 'Total Models',
            'dashboard.compliance_rate': 'Compliance Rate',
            'dashboard.avg_trust_score': 'Avg Trust Score',
            'dashboard.total_checks': 'Total Checks',
            'dashboard.active': 'Active',
            'dashboard.testing': 'Testing',
            'dashboard.passed': 'Passed',
            'dashboard.total': 'Total',
            'dashboard.platinum': 'Platinum',
            'dashboard.gold': 'Gold',

            // Stats Cards
            'stats.model_registry': 'Model Registry',
            'stats.model_desc': 'Register and manage AI models with lifecycle tracking',
            'stats.go_to_registry': 'Go to Registry',
            'stats.compliance_checks': 'Compliance Checks',
            'stats.compliance_desc': 'GDPR, HIPAA, CCPA & SOC2 compliance validation',
            'stats.go_to_compliance': 'Go to Compliance',
            'stats.trust_index': 'Trust Index',
            'stats.trust_desc': '5-dimensional trust scoring and analysis',
            'stats.go_to_trust': 'Go to Trust Index',
            'stats.leaderboard': 'Leaderboard',
            'stats.leaderboard_desc': 'Top models ranked by trust score',
            'stats.go_to_leaderboard': 'Go to Leaderboard',
            'stats.api_docs': 'API Documentation',
            'stats.api_desc': 'Developer reference for governance APIs',
            'stats.view_docs': 'View Docs',
            'stats.audit_logs': 'Audit Logs',
            'stats.audit_desc': 'Track all governance operations and changes',
            'stats.view_logs': 'View Logs',

            // Recent Activity
            'activity.title': 'Recent Activity',
            'activity.registered': 'registered',
            'activity.checked': 'checked',
            'activity.calculated': 'calculated',
            'activity.updated': 'updated',
            'activity.by': 'by',
            'activity.model': 'model',
            'activity.compliance': 'compliance',
            'activity.trust': 'trust',

            // Model Registry
            'models.title': 'Model Registry',
            'models.register': '+ Register Model',
            'models.search': 'Search',
            'models.search_placeholder': 'Search by name or provider...',
            'models.status': 'Status',
            'models.all_statuses': 'All Statuses',
            'models.provider': 'Provider',
            'models.all_providers': 'All Providers',
            'models.name': 'Model',
            'models.version': 'Version',
            'models.created': 'Created',
            'models.actions': 'Actions',
            'models.manage': 'Manage',
            'models.view': 'View',
            'models.no_models': 'No models found. Register your first model!',

            // Model Status
            'status.DRAFT': 'Draft',
            'status.TESTING': 'Testing',
            'status.ACTIVE': 'Active',
            'status.DEPRECATED': 'Deprecated',
            'status.ARCHIVED': 'Archived',

            // Modal
            'modal.register_title': 'Register New Model',
            'modal.details_title': 'Model Details',
            'modal.close': 'Close',
            'modal.cancel': 'Cancel',
            'modal.register_button': 'Register Model',
            'modal.model_name': 'Model Name',
            'modal.model_name_placeholder': 'e.g., GPT-4 Medical Assistant',
            'modal.version_label': 'Version (Semantic)',
            'modal.version_placeholder': 'e.g., 1.0.0 or 2.1.3-beta',
            'modal.version_hint': 'Format: X.Y.Z (e.g., 1.0.0)',
            'modal.provider_label': 'Provider',
            'modal.select_provider': 'Select Provider',
            'modal.description': 'Description',
            'modal.description_placeholder': 'Brief description of the AI model...',

            // Messages
            'msg.loading': 'Loading...',
            'msg.error': 'Error',
            'msg.success': 'Success',
            'msg.load_failed': 'Failed to load',
            'msg.register_success': 'Model registered successfully!',
            'msg.register_failed': 'Registration failed',
            'msg.status_updated': 'Status updated successfully!',
            'msg.status_failed': 'Failed to update status',

            // Security
            'security.secure_connection': '🔐 Secure Connection - WHITE HAT',

            // Pagination
            'pagination.showing': 'Showing',
            'pagination.to': 'to',
            'pagination.of': 'of',
            'pagination.models': 'models',
            'pagination.previous': 'Previous',
            'pagination.next': 'Next',

            // Compliance
            'compliance.title': 'Compliance Checks',
            'compliance.run_validation': 'Run Validation',
            'compliance.select_model': 'Select Model',
            'compliance.select_framework': 'Select Framework',
            'compliance.no_results': 'No validation results yet',
            'compliance.run_first': 'Run your first validation',
            'compliance.overall_score': 'Overall Score',
            'compliance.critical_issues': 'Critical Issues',
            'compliance.warnings': 'Warnings',
            'compliance.recommendations': 'Recommendations',
            'compliance.tab_issues': 'Issues & Warnings',
            'compliance.tab_criteria': 'Criteria Breakdown',
            'compliance.tab_recommendations': 'Recommendations',
            'compliance.history_title': 'Compliance History',

            // Trust Index
            'trust.title': 'Trust Index Calculator',
            'trust.calculate': 'Calculate Trust Index',
            'trust.select_model': 'Select Model',
            'trust.description': 'Evaluate AI trustworthiness across 5 dimensions',
            'trust.tiers_title': 'Trust Tiers',
            'trust.no_calculation': 'No trust index calculated yet',
            'trust.calculate_first': 'Run your first calculation',
            'trust.global_score': 'Global Trust Score',
            'trust.analysis_title': '5-Dimensional Analysis',
            'trust.dim_transparency': 'Transparency',
            'trust.dim_transparency_desc': 'Model decisions and operations are clear and understandable',
            'trust.dim_accountability': 'Accountability',
            'trust.dim_accountability_desc': 'Clear responsibility and traceability for actions',
            'trust.dim_fairness': 'Fairness',
            'trust.dim_fairness_desc': 'Unbiased outcomes and impartial decisions',
            'trust.dim_privacy': 'Privacy',
            'trust.dim_privacy_desc': 'User data protection and security',
            'trust.dim_robustness': 'Robustness',
            'trust.dim_robustness_desc': 'Reliable performance and error tolerance',
            'trust.strengths': 'Strengths',
            'trust.weaknesses': 'Weaknesses',
            'trust.recommendations': 'Recommendations',

            // Leaderboard
            'leaderboard.title': 'Trust Score Leaderboard',
            'leaderboard.total_models': 'Total Models',
            'leaderboard.avg_score': 'Average Score',
            'leaderboard.platinum_tier': 'Platinum Tier',
            'leaderboard.gold_tier': 'Gold Tier',
            'leaderboard.filter_by_tier': 'Filter by Tier',
            'leaderboard.all_tiers': 'All Tiers',
            'leaderboard.rankings': 'Rankings',
            'leaderboard.showing_models': 'models showing',
            'leaderboard.no_models': 'No models found',
            'leaderboard.adjust_filters': 'Adjust your filters',
            'leaderboard.tier_distribution': 'Tier Distribution',
            'leaderboard.recent_calculations': 'Recent Calculations',
            'leaderboard.tier_platinum': 'Platinum',
            'leaderboard.tier_gold': 'Gold',
            'leaderboard.tier_silver': 'Silver',
            'leaderboard.tier_bronze': 'Bronze',
            'leaderboard.tier_unverified': 'Unverified'
        }
    },

    /**
     * Initialize i18n system
     */
    init() {
        // Get saved language or default to Turkish
        const savedLang = localStorage.getItem('governance_lang') || 'tr';
        this.setLanguage(savedLang, true); // Silent mode - don't trigger reload
    },

    /**
     * Get translation for key
     */
    t(key) {
        const translation = this.translations[this.currentLang]?.[key];
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${this.currentLang}`);
            return key;
        }
        return translation;
    },

    /**
     * Set current language
     * @param {string} lang - Language code (tr, en)
     * @param {boolean} silent - If true, don't trigger languageChanged event (prevents reload loop)
     */
    setLanguage(lang, silent = false) {
        if (!this.translations[lang]) {
            console.error(`Language not supported: ${lang}`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('governance_lang', lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Trigger language change event only if not silent
        if (!silent) {
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        }
    },

    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLang;
    },

    /**
     * Get available languages
     */
    getLanguages() {
        return Object.keys(this.translations);
    },

    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            // Update text content or placeholder
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
    }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
    window.GovernanceI18n = GovernanceI18n;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GovernanceI18n.init());
    } else {
        GovernanceI18n.init();
    }
}
