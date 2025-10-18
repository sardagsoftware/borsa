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
            'nav.title': 'AI Yönetişim Merkezi',
            'nav.back': 'Geri',
            'nav.logout': 'Çıkış',
            'nav.demo_user': 'Demo Kullanıcı',

            // Dashboard
            'dashboard.welcome': 'AI Yönetişime Hoş Geldiniz',
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
            'stats.api_desc': 'Yönetişim API\'leri için geliştirici referansı',
            'stats.view_docs': 'Dokümanları Görüntüle',
            'stats.audit_logs': 'Denetim Günlükleri',
            'stats.audit_desc': 'Tüm yönetişim işlemlerini ve değişikliklerini takip edin',
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
            'pagination.next': 'Sonraki'
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
            'pagination.next': 'Next'
        }
    },

    /**
     * Initialize i18n system
     */
    init() {
        // Get saved language or default to Turkish
        const savedLang = localStorage.getItem('governance_lang') || 'tr';
        this.setLanguage(savedLang);
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
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language not supported: ${lang}`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('governance_lang', lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Trigger language change event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
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
