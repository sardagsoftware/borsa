/**
 * FIRILDAK - Advanced Internationalization System
 * Automatic Language Detection & Premium Multi-Language Support
 */

class FirildakI18N {
    constructor() {
        this.currentLang = 'tr'; // Default Turkish
        this.translations = new Map();
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        this.loadedLanguages = new Set();

        this.initializeTranslations();
        this.detectUserLanguage();
    }

    initializeTranslations() {
        // Turkish (Default)
        this.translations.set('tr', {
            // Header & Navigation
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Akıllı AI Asistanı',
            'app.description': 'Premium Yapay Zeka ile Her Sorunuzun Cevabı',

            // Search Interface
            'search.placeholder': 'FIRILDAK\'a ne sormak istiyorsun?',
            'search.submit': 'Gönder',
            'search.voice': 'Sesli Arama',
            'search.upload': 'Dosya Yükle',
            'search.clear': 'Temizle',
            'search.examples.title': 'Örnek Sorular',
            'search.examples.1': 'Bugün hava nasıl?',
            'search.examples.2': 'Python\'da makine öğrenmesi nasıl yapılır?',
            'search.examples.3': 'Türkiye\'nin en güzel yerleri nereler?',
            'search.examples.4': 'Bu resimde ne görüyorsun?',

            // AI Models
            'models.title': 'AI Modelleri',
            'models.current': 'Şu anki model',
            'models.switch': 'Model değiştir',
            'models.auto': 'Otomatik Seçim',

            // Features
            'features.chat': 'Sohbet',
            'features.code': 'Kod Geliştirme',
            'features.image': 'Görsel Analiz',
            'features.document': 'Doküman Analizi',
            'features.translate': 'Çeviri',
            'features.voice': 'Ses Tanıma',

            // User Interface
            'ui.sidebar.toggle': 'Kenar çubuğunu aç/kapat',
            'ui.theme.toggle': 'Tema değiştir',
            'ui.fullscreen': 'Tam ekran',
            'ui.settings': 'Ayarlar',
            'ui.help': 'Yardım',
            'ui.profile': 'Profil',
            'ui.logout': 'Çıkış',

            // Status Messages
            'status.thinking': 'FIRILDAK düşünüyor...',
            'status.typing': 'Yazıyor...',
            'status.processing': 'İşleniyor...',
            'status.error': 'Bir hata oluştu',
            'status.success': 'Başarılı',
            'status.loading': 'Yükleniyor...',

            // Time & Date
            'time.now': 'Şimdi',
            'time.today': 'Bugün',
            'time.yesterday': 'Dün',
            'time.minutes.ago': 'dakika önce',
            'time.hours.ago': 'saat önce',

            // Premium Features
            'premium.title': 'Premium Özellikler',
            'premium.upgrade': 'Premium\'a Geç',
            'premium.unlimited': 'Sınırsız Kullanım',
            'premium.priority': 'Öncelikli Destek',
            'premium.advanced': 'Gelişmiş AI Modelleri'
        });

        // English
        this.translations.set('en', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Smart AI Assistant',
            'app.description': 'Premium Artificial Intelligence for All Your Questions',

            'search.placeholder': 'What would you like to ask FIRILDAK?',
            'search.submit': 'Send',
            'search.voice': 'Voice Search',
            'search.upload': 'Upload File',
            'search.clear': 'Clear',
            'search.examples.title': 'Example Questions',
            'search.examples.1': 'What\'s the weather today?',
            'search.examples.2': 'How to do machine learning in Python?',
            'search.examples.3': 'What are the most beautiful places in Turkey?',
            'search.examples.4': 'What do you see in this image?',

            'models.title': 'AI Models',
            'models.current': 'Current model',
            'models.switch': 'Switch model',
            'models.auto': 'Auto Selection',

            'features.chat': 'Chat',
            'features.code': 'Code Development',
            'features.image': 'Image Analysis',
            'features.document': 'Document Analysis',
            'features.translate': 'Translation',
            'features.voice': 'Voice Recognition',

            'ui.sidebar.toggle': 'Toggle sidebar',
            'ui.theme.toggle': 'Toggle theme',
            'ui.fullscreen': 'Fullscreen',
            'ui.settings': 'Settings',
            'ui.help': 'Help',
            'ui.profile': 'Profile',
            'ui.logout': 'Logout',

            'status.thinking': 'FIRILDAK is thinking...',
            'status.typing': 'Typing...',
            'status.processing': 'Processing...',
            'status.error': 'An error occurred',
            'status.success': 'Success',
            'status.loading': 'Loading...',

            'time.now': 'Now',
            'time.today': 'Today',
            'time.yesterday': 'Yesterday',
            'time.minutes.ago': 'minutes ago',
            'time.hours.ago': 'hours ago',

            'premium.title': 'Premium Features',
            'premium.upgrade': 'Upgrade to Premium',
            'premium.unlimited': 'Unlimited Usage',
            'premium.priority': 'Priority Support',
            'premium.advanced': 'Advanced AI Models'
        });

        // German
        this.translations.set('de', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Intelligenter KI-Assistent',
            'app.description': 'Premium Künstliche Intelligenz für alle Ihre Fragen',

            'search.placeholder': 'Was möchten Sie FIRILDAK fragen?',
            'search.submit': 'Senden',
            'search.voice': 'Sprachsuche',
            'search.upload': 'Datei hochladen',
            'search.clear': 'Löschen',
            'search.examples.title': 'Beispielfragen',
            'search.examples.1': 'Wie ist das Wetter heute?',
            'search.examples.2': 'Wie macht man Machine Learning in Python?',
            'search.examples.3': 'Was sind die schönsten Orte in der Türkei?',
            'search.examples.4': 'Was siehst du in diesem Bild?',

            'status.thinking': 'FIRILDAK denkt nach...',
            'premium.title': 'Premium-Funktionen'
        });

        // French
        this.translations.set('fr', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Assistant IA Intelligent',
            'app.description': 'Intelligence Artificielle Premium pour toutes vos questions',

            'search.placeholder': 'Que voulez-vous demander à FIRILDAK?',
            'search.submit': 'Envoyer',
            'search.voice': 'Recherche vocale',
            'search.upload': 'Télécharger un fichier',
            'search.clear': 'Effacer',
            'search.examples.title': 'Questions d\'exemple',
            'search.examples.1': 'Quel temps fait-il aujourd\'hui?',
            'search.examples.2': 'Comment faire du machine learning en Python?',
            'search.examples.3': 'Quels sont les plus beaux endroits de Turquie?',
            'search.examples.4': 'Que vois-tu dans cette image?',

            'status.thinking': 'FIRILDAK réfléchit...',
            'premium.title': 'Fonctionnalités Premium'
        });

        // Spanish
        this.translations.set('es', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Asistente de IA Inteligente',
            'app.description': 'Inteligencia Artificial Premium para todas tus preguntas',

            'search.placeholder': '¿Qué te gustaría preguntarle a FIRILDAK?',
            'search.submit': 'Enviar',
            'search.voice': 'Búsqueda por voz',
            'search.upload': 'Subir archivo',
            'search.clear': 'Limpiar',
            'search.examples.title': 'Preguntas de ejemplo',
            'search.examples.1': '¿Cómo está el clima hoy?',
            'search.examples.2': '¿Cómo hacer machine learning en Python?',
            'search.examples.3': '¿Cuáles son los lugares más hermosos de Turquía?',
            'search.examples.4': '¿Qué ves en esta imagen?',

            'status.thinking': 'FIRILDAK está pensando...',
            'premium.title': 'Características Premium'
        });

        // Japanese
        this.translations.set('ja', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'スマートAIアシスタント',
            'app.description': 'あらゆる質問に答えるプレミアムAI',

            'search.placeholder': 'FIRILDAKに何を聞きたいですか？',
            'search.submit': '送信',
            'search.voice': '音声検索',
            'search.upload': 'ファイルアップロード',
            'search.clear': 'クリア',
            'search.examples.title': '例の質問',
            'search.examples.1': '今日の天気はどうですか？',
            'search.examples.2': 'Pythonで機械学習を行う方法は？',
            'search.examples.3': 'トルコで最も美しい場所はどこですか？',
            'search.examples.4': 'この画像で何が見えますか？',

            'status.thinking': 'FIRILDAKが考えています...',
            'premium.title': 'プレミアム機能'
        });

        // Arabic
        this.translations.set('ar', {
            'app.title': 'فيريلداك',
            'app.subtitle': 'مساعد ذكي بالذكاء الاصطناعي',
            'app.description': 'ذكاء اصطناعي مميز لجميع أسئلتك',

            'search.placeholder': 'ماذا تريد أن تسأل فيريلداك؟',
            'search.submit': 'إرسال',
            'search.voice': 'البحث الصوتي',
            'search.upload': 'رفع ملف',
            'search.clear': 'مسح',
            'search.examples.title': 'أسئلة مثال',
            'search.examples.1': 'كيف الطقس اليوم؟',
            'search.examples.2': 'كيفية عمل التعلم الآلي في Python؟',
            'search.examples.3': 'ما هي أجمل الأماكن في تركيا؟',
            'search.examples.4': 'ماذا ترى في هذه الصورة؟',

            'status.thinking': 'فيريلداك يفكر...',
            'premium.title': 'المميزات المتقدمة'
        });

        // Russian
        this.translations.set('ru', {
            'app.title': 'FIRILDAK',
            'app.subtitle': 'Умный ИИ-ассистент',
            'app.description': 'Премиум искусственный интеллект для всех ваших вопросов',

            'search.placeholder': 'Что вы хотите спросить у FIRILDAK?',
            'search.submit': 'Отправить',
            'search.voice': 'Голосовой поиск',
            'search.upload': 'Загрузить файл',
            'search.clear': 'Очистить',
            'search.examples.title': 'Примеры вопросов',
            'search.examples.1': 'Какая сегодня погода?',
            'search.examples.2': 'Как делать машинное обучение в Python?',
            'search.examples.3': 'Какие самые красивые места в Турции?',
            'search.examples.4': 'Что ты видишь на этом изображении?',

            'status.thinking': 'FIRILDAK думает...',
            'premium.title': 'Премиум функции'
        });
    }

    detectUserLanguage() {
        // Try multiple detection methods
        let detectedLang = this.currentLang;

        // 1. Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.translations.has(urlLang)) {
            detectedLang = urlLang;
        }
        // 2. Check localStorage
        else if (localStorage.getItem('firildak_language')) {
            const savedLang = localStorage.getItem('firildak_language');
            if (this.translations.has(savedLang)) {
                detectedLang = savedLang;
            }
        }
        // 3. Check browser language
        else {
            const browserLang = navigator.language || navigator.userLanguage;
            const langCode = browserLang.split('-')[0].toLowerCase();

            if (this.translations.has(langCode)) {
                detectedLang = langCode;
            }
            // Special cases for country-specific languages
            else if (browserLang.includes('en')) detectedLang = 'en';
            else if (browserLang.includes('tr')) detectedLang = 'tr';
        }

        // 4. Geolocation-based language detection
        this.detectLocationBasedLanguage().then(geoLang => {
            if (geoLang && this.translations.has(geoLang) && !urlLang && !localStorage.getItem('firildak_language')) {
                this.setLanguage(geoLang);
            }
        });

        this.setLanguage(detectedLang);
    }

    async detectLocationBasedLanguage() {
        try {
            // Get user's approximate location for language detection
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            const countryLangMap = {
                'TR': 'tr', 'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
                'DE': 'de', 'AT': 'de', 'CH': 'de',
                'FR': 'fr', 'BE': 'fr', 'LU': 'fr',
                'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
                'JP': 'ja',
                'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',
                'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'JO': 'ar'
            };

            return countryLangMap[data.country_code] || null;
        } catch (error) {
            console.log('Location-based language detection failed:', error);
            return null;
        }
    }

    setLanguage(langCode) {
        if (!this.translations.has(langCode)) {
            console.warn(`Language ${langCode} not supported, falling back to Turkish`);
            langCode = 'tr';
        }

        this.currentLang = langCode;
        localStorage.setItem('firildak_language', langCode);

        // Update document language and direction
        document.documentElement.lang = langCode;
        document.documentElement.dir = this.rtlLanguages.includes(langCode) ? 'rtl' : 'ltr';

        // Add language-specific body class
        document.body.className = document.body.className.replace(/lang-\w+/g, '');
        document.body.classList.add(`lang-${langCode}`);

        // Update page content
        this.updatePageContent();

        // Emit language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: langCode, isRTL: this.rtlLanguages.includes(langCode) }
        }));

        console.log(`🌍 FIRILDAK language set to: ${langCode}`);
    }

    updatePageContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);

            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update document title
        document.title = `${this.get('app.title')} - ${this.get('app.subtitle')}`;

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = this.get('app.description');
        }
    }

    get(key, params = {}) {
        const translation = this.translations.get(this.currentLang)?.get?.(key) ||
                           this.translations.get(this.currentLang)?.[key] ||
                           this.translations.get('tr')[key] ||
                           key;

        // Simple parameter replacement
        return Object.entries(params).reduce(
            (str, [param, value]) => str.replace(`{${param}}`, value),
            translation
        );
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getAvailableLanguages() {
        return Array.from(this.translations.keys()).map(code => ({
            code,
            name: this.getLanguageName(code),
            isRTL: this.rtlLanguages.includes(code)
        }));
    }

    getLanguageName(code) {
        const names = {
            'tr': 'Türkçe',
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Français',
            'es': 'Español',
            'ja': '日本語',
            'ar': 'العربية',
            'ru': 'Русский'
        };
        return names[code] || code.toUpperCase();
    }

    isRTL() {
        return this.rtlLanguages.includes(this.currentLang);
    }

    // Format numbers based on language
    formatNumber(number) {
        try {
            return new Intl.NumberFormat(this.currentLang).format(number);
        } catch {
            return number.toString();
        }
    }

    // Format dates based on language
    formatDate(date, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.currentLang, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...options
            }).format(date);
        } catch {
            return date.toLocaleDateString();
        }
    }

    // Format relative time (e.g., "2 minutes ago")
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return this.get('time.now');
        if (minutes < 60) return `${minutes} ${this.get('time.minutes.ago')}`;
        if (hours < 24) return `${hours} ${this.get('time.hours.ago')}`;
        if (days === 1) return this.get('time.yesterday');
        if (days < 7) return this.formatDate(date, { weekday: 'long' });
        return this.formatDate(date);
    }
}

// Initialize global i18n instance
window.firildakI18N = new FirildakI18N();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirildakI18N;
}