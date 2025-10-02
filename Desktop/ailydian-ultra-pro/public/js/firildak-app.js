/**
 * FIRILDAK - Premium AI Assistant Application
 * Ultra Modern JavaScript Engine with Full AI Integration
 */

class FirildakApp {
    constructor() {
        this.apiEndpoints = {
            chat: '/api/chat',
            multimodal: '/api/multimodal',
            translate: '/api/translate',
            azure: '/api/azure',
            search: '/api/azure/search',
            models: '/api/models',
            health: '/api/health'
        };

        this.currentModel = 'auto';
        this.isRecording = false;
        this.recognition = null;
        this.currentConversation = [];
        this.websocket = null;
        this.lastActivity = Date.now();

        // App state
        this.state = {
            sidebar: {
                visible: window.innerWidth > 768,
                activeFeature: 'chat',
                activeModel: 'auto'
            },
            chat: {
                messages: [],
                isTyping: false,
                currentSession: null
            },
            ui: {
                theme: localStorage.getItem('firildak_theme') || 'dark',
                fullscreen: false,
                searchMode: true
            },
            performance: {
                responseTime: 0,
                tokenCount: 0,
                apiCalls: 0
            }
        };

        this.initialize();
    }

    async initialize() {
        console.log('🚀 FIRILDAK App Initializing...');

        // Initialize components
        this.setupEventListeners();
        this.initializeWebSocket();
        this.initializeSpeechRecognition();
        this.setupTheme();
        this.updateClock();
        this.loadUserPreferences();

        // Initialize language system
        this.setupLanguageSystem();

        // Initialize AI models
        await this.loadAIModels();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Auto-save conversation
        this.startAutoSave();

        console.log('✅ FIRILDAK App Ready!');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Search form
        document.getElementById('searchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSearch();
                }
            });

            searchInput.addEventListener('input', () => {
                this.lastActivity = Date.now();
            });
        }

        // Search tools
        document.getElementById('voiceButton')?.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });

        document.getElementById('uploadButton')?.addEventListener('click', () => {
            this.openFileUpload();
        });

        document.getElementById('cameraButton')?.addEventListener('click', () => {
            this.openCamera();
        });

        document.getElementById('clearButton')?.addEventListener('click', () => {
            this.clearSearch();
        });

        // Example items
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const example = item.getAttribute('data-example');
                this.insertExample(example);
            });
        });

        // Navigation items
        document.querySelectorAll('.nav-item[data-feature]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const feature = item.getAttribute('data-feature');
                this.switchFeature(feature);
            });
        });

        // Model selection
        document.querySelectorAll('.nav-item[data-model]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const model = item.getAttribute('data-model');
                this.switchModel(model);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Fullscreen toggle
        document.getElementById('fullscreenToggle')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Language toggle
        document.getElementById('languageToggle')?.addEventListener('click', () => {
            this.toggleLanguageDropdown();
        });

        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Window events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('beforeunload', () => {
            this.saveConversation();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
    }

    setupLanguageSystem() {
        if (window.firildakI18N) {
            // Populate language dropdown
            this.populateLanguageDropdown();

            // Listen for language changes
            window.addEventListener('languageChanged', (e) => {
                this.handleLanguageChange(e.detail);
            });
        }
    }

    populateLanguageDropdown() {
        const dropdown = document.getElementById('languageDropdown');
        if (!dropdown || !window.firildakI18N) return;

        const languages = window.firildakI18N.getAvailableLanguages();
        const currentLang = window.firildakI18N.getCurrentLanguage();

        dropdown.innerHTML = languages.map(lang => `
            <div class="language-option ${lang.code === currentLang ? 'active' : ''}"
                 data-lang="${lang.code}">
                <span>${lang.name}</span>
                ${lang.isRTL ? '<span style="font-size: 10px; opacity: 0.6;">RTL</span>' : ''}
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', () => {
                const langCode = option.getAttribute('data-lang');
                window.firildakI18N.setLanguage(langCode);
                this.toggleLanguageDropdown();
            });
        });
    }

    toggleLanguageDropdown() {
        const dropdown = document.getElementById('languageDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    handleLanguageChange(detail) {
        console.log(`🌍 Language changed to: ${detail.language}`);
        this.populateLanguageDropdown();

        // Update UI direction for RTL languages
        if (detail.isRTL) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }

        // Re-initialize examples
        this.updateExamples();
    }

    updateExamples() {
        // Update example texts based on current language
        const examples = document.querySelectorAll('.example-item');
        examples.forEach((item, index) => {
            const textElement = item.querySelector('.example-text');
            if (textElement && window.firildakI18N) {
                const key = `search.examples.${index + 1}`;
                textElement.textContent = window.firildakI18N.get(key);
            }
        });
    }

    initializeWebSocket() {
        try {
            this.websocket = new WebSocket(`ws://${window.location.host}`);

            this.websocket.onopen = () => {
                console.log('🔗 WebSocket connected');
                this.websocket.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'firildak'
                }));
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };

            this.websocket.onclose = () => {
                console.log('📡 WebSocket disconnected, attempting to reconnect...');
                setTimeout(() => this.initializeWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
        } catch (error) {
            console.error('❌ WebSocket initialization failed:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'typing':
                this.showTypingIndicator();
                break;
            case 'response':
                this.addMessage(data.message, 'ai');
                this.hideTypingIndicator();
                break;
            case 'error':
                this.showError(data.message);
                break;
            case 'status':
                this.updateStatus(data.status);
                break;
        }
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = window.firildakI18N?.getCurrentLanguage() || 'tr-TR';

            this.recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                this.updateVoiceButton(true);
            };

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    document.getElementById('searchInput').value = finalTranscript;
                }
            };

            this.recognition.onend = () => {
                console.log('🎤 Voice recognition ended');
                this.updateVoiceButton(false);
                this.isRecording = false;
            };

            this.recognition.onerror = (event) => {
                console.error('❌ Voice recognition error:', event.error);
                this.updateVoiceButton(false);
                this.isRecording = false;
            };
        }
    }

    async loadAIModels() {
        try {
            const response = await fetch(this.apiEndpoints.models);
            const data = await response.json();

            if (data.success) {
                console.log(`🤖 Loaded ${data.models.length} AI models`);
                this.updateModelStatus();
            }
        } catch (error) {
            console.error('❌ Failed to load AI models:', error);
        }
    }

    setupTheme() {
        const theme = this.state.ui.theme;
        document.body.setAttribute('data-theme', theme);

        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
        }
    }

    toggleSidebar() {
        this.state.sidebar.visible = !this.state.sidebar.visible;
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebar && mainContent) {
            if (this.state.sidebar.visible) {
                sidebar.classList.remove('hidden');
                mainContent.classList.remove('expanded');
            } else {
                sidebar.classList.add('hidden');
                mainContent.classList.add('expanded');
            }
        }
    }

    switchFeature(feature) {
        this.state.sidebar.activeFeature = feature;

        // Update active nav item
        document.querySelectorAll('.nav-item[data-feature]').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-feature="${feature}"]`)?.classList.add('active');

        console.log(`🎯 Switched to feature: ${feature}`);
    }

    switchModel(model) {
        this.currentModel = model;
        this.state.sidebar.activeModel = model;

        // Update active model item
        document.querySelectorAll('.nav-item[data-model]').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-model="${model}"]`)?.classList.add('active');

        this.updateModelStatus();
        console.log(`🤖 Switched to model: ${model}`);
    }

    async handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput?.value.trim();

        if (!query) return;

        console.log(`🔍 Processing search: ${query}`);

        // Switch to chat mode
        this.switchToChatMode();

        // Add user message
        this.addMessage(query, 'user');

        // Clear input
        searchInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const startTime = Date.now();

            // Determine best API endpoint based on content
            const endpoint = this.selectOptimalEndpoint(query);

            const response = await this.sendToAI(query, endpoint);

            const responseTime = Date.now() - startTime;
            this.state.performance.responseTime = responseTime;
            this.state.performance.apiCalls++;

            this.hideTypingIndicator();

            if (response.success) {
                this.addMessage(response.message, 'ai');

                // Update token count if available
                if (response.tokens) {
                    this.state.performance.tokenCount += response.tokens;
                    this.updateTokenCount();
                }
            } else {
                this.showError(response.error || 'Bir hata oluştu');
            }

            this.updateResponseTime(responseTime);

        } catch (error) {
            console.error('❌ Search error:', error);
            this.hideTypingIndicator();
            this.showError('Bağlantı hatası oluştu');
        }
    }

    selectOptimalEndpoint(query) {
        // Smart endpoint selection based on query content
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('çevir') || lowerQuery.includes('translate')) {
            return this.apiEndpoints.translate;
        } else if (lowerQuery.includes('resim') || lowerQuery.includes('image') || lowerQuery.includes('görsel')) {
            return this.apiEndpoints.multimodal;
        } else if (lowerQuery.includes('ara') || lowerQuery.includes('search') || lowerQuery.includes('bul')) {
            return this.apiEndpoints.search;
        } else {
            return this.apiEndpoints.chat;
        }
    }

    async sendToAI(message, endpoint = this.apiEndpoints.chat) {
        const requestData = {
            message,
            model: this.currentModel,
            conversation: this.currentConversation,
            feature: this.state.sidebar.activeFeature,
            language: window.firildakI18N?.getCurrentLanguage() || 'tr'
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        return await response.json();
    }

    switchToChatMode() {
        this.state.ui.searchMode = false;

        const searchContainer = document.getElementById('searchContainer');
        const chatContainer = document.getElementById('chatContainer');

        if (searchContainer && chatContainer) {
            searchContainer.style.display = 'none';
            chatContainer.classList.add('active');
        }
    }

    addMessage(text, type) {
        const message = {
            id: Date.now(),
            text,
            type,
            timestamp: new Date(),
            model: type === 'ai' ? this.currentModel : null
        };

        this.state.chat.messages.push(message);
        this.currentConversation.push({ role: type === 'user' ? 'user' : 'assistant', content: text });

        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message.text)}</div>
                ${message.type === 'ai' && message.model ? `<div class="message-meta">Model: ${message.model}</div>` : ''}
            </div>
        `;

        chatMessages.appendChild(messageElement);
    }

    formatMessage(text) {
        // Format message with markdown-like syntax
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.state.chat.isTyping = true;
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message ai typing-message';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span>${window.firildakI18N?.get('status.thinking') || 'FIRILDAK düşünüyor...'}</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.state.chat.isTyping = false;
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    toggleVoiceRecording() {
        if (!this.recognition) {
            this.showError('Tarayıcınız ses tanımayı desteklemiyor');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isRecording = true;
        }
    }

    updateVoiceButton(recording) {
        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            const icon = voiceButton.querySelector('i');
            if (recording) {
                icon.className = 'ph ph-stop';
                voiceButton.style.background = '#ef4444';
            } else {
                icon.className = 'ph ph-microphone';
                voiceButton.style.background = '';
            }
        }
    }

    openFileUpload() {
        document.getElementById('fileInput')?.click();
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const file = files[0];
        console.log(`📎 File uploaded: ${file.name} (${file.size} bytes)`);

        // Handle different file types
        if (file.type.startsWith('image/')) {
            await this.processImageFile(file);
        } else if (file.type === 'application/pdf') {
            await this.processPDFFile(file);
        } else {
            await this.processTextFile(file);
        }
    }

    async processImageFile(file) {
        try {
            const base64 = await this.fileToBase64(file);
            const prompt = window.firildakI18N?.get('search.examples.4') || 'Bu resimde ne görüyorsun?';

            this.switchToChatMode();
            this.addMessage(`${prompt} [Resim: ${file.name}]`, 'user');
            this.showTypingIndicator();

            const response = await fetch(this.apiEndpoints.multimodal, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    image: base64,
                    model: this.currentModel
                })
            });

            const result = await response.json();
            this.hideTypingIndicator();

            if (result.success) {
                this.addMessage(result.message, 'ai');
            } else {
                this.showError('Resim analizi başarısız oldu');
            }
        } catch (error) {
            console.error('❌ Image processing error:', error);
            this.hideTypingIndicator();
            this.showError('Resim işleme hatası');
        }
    }

    async processPDFFile(file) {
        // PDF processing logic would go here
        this.showError('PDF işleme yakında eklenecek');
    }

    async processTextFile(file) {
        try {
            const text = await file.text();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = `Bu dökümanı analiz et: ${text.substring(0, 500)}...`;
            }
        } catch (error) {
            console.error('❌ Text file processing error:', error);
            this.showError('Dosya okuma hatası');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    openCamera() {
        // Camera functionality would be implemented here
        this.showError('Kamera özelliği yakında eklenecek');
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    }

    insertExample(example) {
        const searchInput = document.getElementById('searchInput');
        const examples = {
            weather: window.firildakI18N?.get('search.examples.1') || 'Bugün hava nasıl?',
            code: window.firildakI18N?.get('search.examples.2') || 'Python\'da makine öğrenmesi nasıl yapılır?',
            travel: window.firildakI18N?.get('search.examples.3') || 'Türkiye\'nin en güzel yerleri nereler?',
            image: window.firildakI18N?.get('search.examples.4') || 'Bu resimde ne görüyorsun?'
        };

        if (searchInput && examples[example]) {
            searchInput.value = examples[example];
            searchInput.focus();
        }
    }

    toggleTheme() {
        this.state.ui.theme = this.state.ui.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('firildak_theme', this.state.ui.theme);
        this.setupTheme();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.state.ui.fullscreen = true;
        } else {
            document.exitFullscreen();
            this.state.ui.fullscreen = false;
        }

        const icon = document.querySelector('#fullscreenToggle i');
        if (icon) {
            icon.className = this.state.ui.fullscreen ? 'ph ph-arrows-in' : 'ph ph-arrows-out';
        }
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile && this.state.sidebar.visible) {
            this.state.sidebar.visible = false;
            this.toggleSidebar();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }

        // Ctrl/Cmd + /: Toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.toggleSidebar();
        }

        // Escape: Clear search or close dropdowns
        if (e.key === 'Escape') {
            this.handleEscape();
        }
    }

    handleEscape() {
        // Close language dropdown
        const languageDropdown = document.getElementById('languageDropdown');
        if (languageDropdown?.classList.contains('show')) {
            languageDropdown.classList.remove('show');
            return;
        }

        // Clear search if in search mode
        if (this.state.ui.searchMode) {
            this.clearSearch();
        }
    }

    handleOutsideClick(e) {
        const languageDropdown = document.getElementById('languageDropdown');
        const languageToggle = document.getElementById('languageToggle');

        if (languageDropdown && !languageDropdown.contains(e.target) && !languageToggle.contains(e.target)) {
            languageDropdown.classList.remove('show');
        }
    }

    showError(message) {
        console.error('❌ Error:', message);

        // Create error notification
        const errorElement = document.createElement('div');
        errorElement.className = 'error-notification';
        errorElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        errorElement.textContent = message;

        document.body.appendChild(errorElement);

        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    updateClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString(
                window.firildakI18N?.getCurrentLanguage() || 'tr-TR',
                { hour: '2-digit', minute: '2-digit' }
            );

            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    updateModelStatus() {
        const modelStatus = document.getElementById('modelStatus');
        if (modelStatus) {
            const modelName = this.currentModel === 'auto' ?
                (window.firildakI18N?.get('models.auto') || 'Otomatik Seçim') :
                this.currentModel;
            modelStatus.textContent = `Model: ${modelName}`;
        }
    }

    updateResponseTime(time) {
        const responseTimeElement = document.getElementById('responseTime');
        if (responseTimeElement) {
            responseTimeElement.textContent = `Yanıt süresi: ~${(time / 1000).toFixed(1)}s`;
        }
    }

    updateTokenCount() {
        const tokenElement = document.getElementById('tokenCount');
        if (tokenElement && window.firildakI18N) {
            const formattedCount = window.firildakI18N.formatNumber(this.state.performance.tokenCount);
            tokenElement.textContent = `Token: ${formattedCount}`;
        }
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
    }

    updatePerformanceMetrics() {
        // Update various performance indicators
        console.log('📊 Performance:', {
            responseTime: this.state.performance.responseTime,
            tokenCount: this.state.performance.tokenCount,
            apiCalls: this.state.performance.apiCalls,
            memoryUsage: performance.memory?.usedJSHeapSize || 'N/A'
        });
    }

    startAutoSave() {
        // Auto-save conversation every 30 seconds
        setInterval(() => {
            this.saveConversation();
        }, 30000);
    }

    saveConversation() {
        try {
            localStorage.setItem('firildak_conversation', JSON.stringify({
                messages: this.state.chat.messages,
                timestamp: new Date(),
                model: this.currentModel
            }));
        } catch (error) {
            console.error('❌ Failed to save conversation:', error);
        }
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('firildak_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                if (preferences.model) {
                    this.switchModel(preferences.model);
                }
                if (preferences.feature) {
                    this.switchFeature(preferences.feature);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load user preferences:', error);
        }
    }

    saveUserPreferences() {
        try {
            const preferences = {
                model: this.currentModel,
                feature: this.state.sidebar.activeFeature,
                theme: this.state.ui.theme,
                language: window.firildakI18N?.getCurrentLanguage()
            };
            localStorage.setItem('firildak_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('❌ Failed to save user preferences:', error);
        }
    }

    // Public API for external integrations
    getState() {
        return { ...this.state };
    }

    sendMessage(message) {
        document.getElementById('searchInput').value = message;
        this.handleSearch();
    }

    clearChat() {
        this.state.chat.messages = [];
        this.currentConversation = [];
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }
}

// Initialize FIRILDAK App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.firildakApp = new FirildakApp();
});

// Add necessary CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .error-notification {
        animation: slideIn 0.3s ease-out;
    }

    .message-meta {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 4px;
        font-style: italic;
    }
`;
document.head.appendChild(style);