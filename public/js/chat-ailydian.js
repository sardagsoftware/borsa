/**
 * 💬 CHAT.AILYDIAN.COM JAVASCRIPT
 * Modern AI Chat Interface with Real-time Features
 * Enterprise-grade WebSocket Integration
 */

class AiLydianChat {
    constructor() {
        this.currentModel = 'ai-assistant';
        this.isConnected = false;
        this.websocket = null;
        this.chatHistory = [];
        this.currentConversation = null;
        this.isTyping = false;
        this.tokens = {
            balance: 1000,
            used: 0
        };

        // Voice Recognition Properties
        this.speechRecognition = null;
        this.isRecording = false;
        this.currentLanguage = 'tr-TR';
        this.supportedLanguages = {
            'tr-TR': { flag: '🇹🇷', name: 'Türkçe' },
            'en-US': { flag: '🇺🇸', name: 'English' },
            'ar-SA': { flag: '🇸🇦', name: 'العربية' },
            'de-DE': { flag: '🇩🇪', name: 'Deutsch' },
            'fr-FR': { flag: '🇫🇷', name: 'Français' },
            'es-ES': { flag: '🇪🇸', name: 'Español' },
            'ru-RU': { flag: '🇷🇺', name: 'Русский' },
            'zh-CN': { flag: '🇨🇳', name: '中文' },
            'ja-JP': { flag: '🇯🇵', name: '日本語' },
            'ko-KR': { flag: '🇰🇷', name: '한국어' }
        };

        this.init();
    }

    async init() {
        console.log('🚀 AiLydian Chat Başlatılıyor...');

        this.setupWebSocket();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadChatHistory();
        this.setupAutoResize();
        this.setupFileUpload();
        this.setupVoiceRecognition();
        this.setupSearchAnimation();
        this.initializeUI();

        console.log('✅ AiLydian Chat Hazır!');
    }

    // WebSocket Connection
    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('🔗 WebSocket bağlantısı kuruldu');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('WebSocket mesaj hatası:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('🔌 WebSocket bağlantısı kapandı');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                // Reconnect after 3 seconds
                setTimeout(() => this.setupWebSocket(), 3000);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket hatası:', error);
                this.isConnected = false;
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('WebSocket kurulum hatası:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'chat_response':
                this.handleChatResponse(data);
                break;
            case 'typing_indicator':
                this.handleTypingIndicator(data);
                break;
            case 'token_update':
                this.updateTokenBalance(data.tokens);
                break;
            case 'system_status':
                this.handleSystemStatus(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            default:
                console.log('Bilinmeyen WebSocket mesajı:', data);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                console.log('Sidebar toggle clicked, collapsed state:', sidebar.classList.contains('collapsed'));
            });
        }

        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }

        // New Chat Button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }

        // Message Input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.handleInputChange());
            messageInput.addEventListener('paste', (e) => this.handlePaste(e));
        }

        // Send Button
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // User Menu
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        if (userAvatar && userDropdown) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }

        // Model Selector
        const selectedModel = document.getElementById('selectedModel');
        const modelDropdown = document.getElementById('modelDropdown');
        if (selectedModel && modelDropdown) {
            selectedModel.addEventListener('click', (e) => {
                e.stopPropagation();
                modelDropdown.classList.toggle('active');
            });

            modelDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.closest('.model-option')) {
                    this.selectModel(e.target.closest('.model-option'));
                }
            });

            document.addEventListener('click', () => {
                modelDropdown.classList.remove('active');
            });
        }

        // AI Capabilities
        const capabilityCards = document.querySelectorAll('.capability-card');
        capabilityCards.forEach(card => {
            card.addEventListener('click', () => {
                const capability = card.dataset.capability;
                this.selectCapability(capability);
            });
        });

        // Projects Dropdown
        const projectsToggle = document.getElementById('projectsToggle');
        const projectLinks = document.getElementById('projectLinks');
        if (projectsToggle && projectLinks) {
            projectsToggle.addEventListener('click', () => {
                projectsToggle.classList.toggle('active');
                projectLinks.classList.toggle('open');
                console.log('🔄 Projects dropdown toggled');
            });
        }

        // Quick Suggestions
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                if (prompt) {
                    this.setMessageAndSend(prompt);
                }
            });
        });

        // Voice Input
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        // AI Features Dropdown
        const aiPlusBtn = document.getElementById('aiPlusBtn');
        const featuresDropdown = document.getElementById('featuresDropdown');
        if (aiPlusBtn && featuresDropdown) {
            aiPlusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                featuresDropdown.classList.toggle('active');
            });

            // Feature options
            const featureOptions = featuresDropdown.querySelectorAll('.feature-option');
            featureOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const feature = option.dataset.feature;
                    this.handleFeatureSelection(feature);
                    featuresDropdown.classList.remove('active');
                });
            });

            document.addEventListener('click', () => {
                featuresDropdown.classList.remove('active');
            });
        }

        // Voice Language Selector
        const voiceSelector = document.getElementById('voiceSelector');
        if (voiceSelector) {
            const languageOptions = voiceSelector.querySelectorAll('.language-option');
            languageOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const lang = option.dataset.lang;
                    this.setVoiceLanguage(lang);
                    voiceSelector.style.display = 'none';
                });
            });
        }

        // File Upload
        const attachmentBtn = document.getElementById('attachmentBtn');
        const fileInput = document.getElementById('fileInput');
        const imageInput = document.getElementById('imageInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        messageInput.addEventListener('keydown', (e) => {
            // Enter to send (without Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }

            // Ctrl/Cmd + / for model selector
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const modelDropdown = document.getElementById('modelDropdown');
                if (modelDropdown) {
                    modelDropdown.classList.toggle('active');
                }
            }

            // Escape to close dropdowns
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        // Global shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for new chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.startNewChat();
            }

            // Ctrl/Cmd + L to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                messageInput.focus();
            }
        });
    }

    // UI Handlers
    handleInputChange() {
        const messageInput = document.getElementById('messageInput');
        const charCounter = document.getElementById('charCounter');
        const sendBtn = document.getElementById('sendBtn');

        if (!messageInput || !charCounter || !sendBtn) return;

        const length = messageInput.value.length;
        charCounter.textContent = `${length}/5000`;

        // Update counter color
        charCounter.className = 'char-counter';
        if (length > 4500) {
            charCounter.classList.add('danger');
        } else if (length > 4000) {
            charCounter.classList.add('warning');
        }

        // Enable/disable send button
        sendBtn.disabled = length === 0 || length > 5000;

        // Auto-resize textarea
        this.autoResizeTextarea(messageInput);

        // Show typing indicator to other users
        if (this.isConnected && length > 0) {
            this.sendTypingIndicator();
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    setupAutoResize() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            // Initial setup
            this.autoResizeTextarea(messageInput);
        }
    }

    // Chat Functions
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Clear input
        messageInput.value = '';
        this.handleInputChange();

        // Add user message to chat
        this.addMessageToChat('user', message);

        // Hide welcome screen, show messages
        this.showMessagesContainer();

        // Show loading
        this.showLoading(true);

        try {
            // Send to API
            const response = await this.sendToAPI(message);
            this.handleAPIResponse(response);
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            this.addMessageToChat('assistant', 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async sendToAPI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                model: this.currentModel,
                conversation_id: this.currentConversation?.id,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`API hatası: ${response.status}`);
        }

        return await response.json();
    }

    handleAPIResponse(response) {
        if (response.success) {
            this.addMessageToChat('assistant', response.response);

            // Update tokens if provided
            if (response.tokens) {
                this.updateTokenBalance(response.tokens);
            }

            // Update conversation ID
            if (response.conversation_id) {
                if (!this.currentConversation) {
                    this.currentConversation = {
                        id: response.conversation_id,
                        title: this.generateConversationTitle(response.response),
                        timestamp: new Date().toISOString()
                    };
                    this.addToHistory(this.currentConversation);
                }
            }
        } else {
            this.addMessageToChat('assistant', response.error || 'Bir hata oluştu.', 'error');
        }
    }

    addMessageToChat(sender, content, type = 'normal') {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender} fade-in`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const content_div = document.createElement('div');
        content_div.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${type}`;

        // Process content for markdown, code blocks, etc.
        bubble.innerHTML = this.processMessageContent(content);

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        content_div.appendChild(bubble);
        content_div.appendChild(time);

        messageElement.appendChild(avatar);
        messageElement.appendChild(content_div);

        messagesContainer.appendChild(messageElement);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to chat history
        this.chatHistory.push({
            sender,
            content,
            timestamp: new Date().toISOString(),
            type
        });

        // Save to localStorage
        this.saveChatHistory();
    }

    processMessageContent(content) {
        // Basic markdown processing
        let processed = content;

        // Code blocks
        processed = processed.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
            return `<pre class="code-block"><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
        });

        // Inline code
        processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Bold
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Line breaks
        processed = processed.replace(/\n/g, '<br>');

        return processed;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    showMessagesContainer() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const messagesContainer = document.getElementById('messagesContainer');

        if (welcomeScreen && messagesContainer) {
            welcomeScreen.style.display = 'none';
            messagesContainer.style.display = 'block';
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('active', show);
        }
    }

    // Model Selection
    selectModel(modelOption) {
        const modelData = {
            model: modelOption.dataset.model,
            icon: modelOption.dataset.icon,
            name: modelOption.querySelector('span').textContent
        };

        this.currentModel = modelData.model;

        // Update UI
        const selectedModel = document.getElementById('selectedModel');
        if (selectedModel) {
            selectedModel.innerHTML = `
                <i class="${modelData.icon}"></i>
                <span>${modelData.name}</span>
                <i class="fas fa-chevron-down"></i>
            `;
        }

        // Close dropdown
        const modelDropdown = document.getElementById('modelDropdown');
        if (modelDropdown) {
            modelDropdown.classList.remove('active');
        }

        console.log(`Model değiştirildi: ${modelData.name}`);
    }

    handleFeatureSelection(feature) {
        console.log(`🎯 Feature seçildi: ${feature}`);

        switch (feature) {
            case 'file':
                this.triggerFileUpload();
                break;
            case 'voice':
                this.showVoiceAnalysisDialog();
                break;
            case 'image':
                this.showImageGenerationDialog();
                break;
            case 'code':
                this.setCodePrompt();
                break;
            case 'translate':
                this.setTranslationPrompt();
                break;
            case 'document':
                this.setDocumentAnalysisPrompt();
                break;
            case 'vision':
                this.setVisionAnalysisPrompt();
                break;
            case 'audio':
                this.setAudioProcessingPrompt();
                break;
            default:
                console.log('Bilinmeyen feature:', feature);
        }
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    triggerImageUpload() {
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.click();
        }
    }

    showVoiceLanguageSelector() {
        const voiceSelector = document.getElementById('voiceSelector');
        if (voiceSelector) {
            voiceSelector.style.display = 'block';
            setTimeout(() => {
                voiceSelector.classList.add('active');
            }, 10);
        }
    }

    setCodePrompt() {
        this.showCodeGenerationDialog();
    }

    setTranslationPrompt() {
        this.showTranslationDialog();
    }

    setDocumentAnalysisPrompt() {
        this.triggerFileUpload();
        this.setModelAndPrompt('ai-assistant', 'Analiz etmek istediğiniz dokümanı yükleyin (PDF, Word, Text dosyaları desteklenir).');
    }

    setVisionAnalysisPrompt() {
        this.showVisionAnalysisDialog();
    }

    setAudioProcessingPrompt() {
        this.showVoiceAnalysisDialog();
    }

    // 💻 CODE GENERATION DIALOG
    async showCodeGenerationDialog() {
        const dialog = this.createDialog('Code Generation', `
            <div class="code-generation-form">
                <div class="form-group">
                    <label for="codePrompt">What code would you like to generate?</label>
                    <textarea id="codePrompt" placeholder="e.g., Create a function to validate email addresses" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="codeLanguage">Language:</label>
                        <select id="codeLanguage">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                            <option value="cpp">C++</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="codeFramework">Framework:</label>
                        <select id="codeFramework">
                            <option value="vanilla">Vanilla</option>
                            <option value="react">React</option>
                            <option value="vue">Vue.js</option>
                            <option value="angular">Angular</option>
                            <option value="node">Node.js</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="codeComplexity">Complexity:</label>
                        <select id="codeComplexity">
                            <option value="simple">Simple</option>
                            <option value="medium">Medium</option>
                            <option value="high">Advanced</option>
                        </select>
                    </div>
                    <div class="form-group checkbox-group">
                        <label><input type="checkbox" id="includeComments" checked> Include Comments</label>
                        <label><input type="checkbox" id="includeTests"> Include Tests</label>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button onclick="window.aiLydianChat.generateCode()" class="btn-primary">Generate Code</button>
                    <button onclick="window.aiLydianChat.closeDialog()" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `);
    }

    async generateCode() {
        const prompt = document.getElementById('codePrompt').value;
        const language = document.getElementById('codeLanguage').value;
        const framework = document.getElementById('codeFramework').value;
        const complexity = document.getElementById('codeComplexity').value;
        const includeComments = document.getElementById('includeComments').checked;
        const includeTests = document.getElementById('includeTests').checked;

        if (!prompt.trim()) {
            alert('Please enter a code prompt');
            return;
        }

        this.closeDialog();
        this.showProcessingIndicator('Generating code...');

        try {
            const response = await fetch('/api/code/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    language,
                    framework,
                    complexity,
                    includeComments,
                    includeTests
                })
            });

            const result = await response.json();
            this.hideProcessingIndicator();

            if (result.success) {
                this.displayCodeResult(result.data);
            } else {
                this.addMessageToChat('assistant', 'Code generation failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Code generation failed: ' + error.message, 'error');
        }
    }

    displayCodeResult(data) {
        let message = `💻 **Generated ${data.language} Code:**\n\n`;
        message += `\`\`\`${data.language}\n${data.code}\n\`\`\`\n\n`;

        if (data.tests) {
            message += `🧪 **Test Cases:**\n\n`;
            message += `\`\`\`${data.language}\n${data.tests}\n\`\`\`\n\n`;
        }

        message += `📊 **Metadata:**\n`;
        message += `• Lines: ${data.metadata.lines}\n`;
        message += `• Characters: ${data.metadata.characters}\n`;
        message += `• Functions: ${data.metadata.functions}\n`;
        message += `• Classes: ${data.metadata.classes}\n\n`;

        message += `💡 **Suggestions:**\n`;
        data.suggestions.forEach(suggestion => {
            message += `• ${suggestion}\n`;
        });

        this.addMessageToChat('assistant', message);
    }

    // 🌍 TRANSLATION DIALOG
    async showTranslationDialog() {
        const dialog = this.createDialog('Translation', `
            <div class="translation-form">
                <div class="form-group">
                    <label for="translationText">Text to translate:</label>
                    <textarea id="translationText" placeholder="Enter text to translate..." rows="4"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="fromLanguage">From:</label>
                        <select id="fromLanguage">
                            <option value="auto">Auto-detect</option>
                            <option value="tr">Turkish</option>
                            <option value="en">English</option>
                            <option value="ar">Arabic</option>
                            <option value="de">German</option>
                            <option value="fr">French</option>
                            <option value="es">Spanish</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="toLanguage">To:</label>
                        <select id="toLanguage">
                            <option value="en">English</option>
                            <option value="tr">Turkish</option>
                            <option value="ar">Arabic</option>
                            <option value="de">German</option>
                            <option value="fr">French</option>
                            <option value="es">Spanish</option>
                        </select>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button onclick="window.aiLydianChat.translateText()" class="btn-primary">Translate</button>
                    <button onclick="window.aiLydianChat.closeDialog()" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `);
    }

    async translateText() {
        const text = document.getElementById('translationText').value;
        const from = document.getElementById('fromLanguage').value;
        const to = document.getElementById('toLanguage').value;

        if (!text.trim()) {
            alert('Please enter text to translate');
            return;
        }

        this.closeDialog();
        this.showProcessingIndicator('Translating...');

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, from, to })
            });

            const result = await response.json();
            this.hideProcessingIndicator();

            if (result.success) {
                this.displayTranslationResult(result.data);
            } else {
                this.addMessageToChat('assistant', 'Translation failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Translation failed: ' + error.message, 'error');
        }
    }

    displayTranslationResult(data) {
        let message = `🌍 **Translation Result:**\n\n`;
        message += `**Original (${data.from.name}):** ${data.original}\n\n`;
        message += `**Translated (${data.to.name}):** ${data.translated}\n\n`;
        message += `**Confidence:** ${Math.round(data.confidence * 100)}%\n`;
        message += `**Word Count:** ${data.wordCount} words, ${data.characterCount} characters`;

        this.addMessageToChat('assistant', message);
    }

    // 🎨 IMAGE GENERATION DIALOG
    async showImageGenerationDialog() {
        const dialog = this.createDialog('Image Generation', `
            <div class="image-generation-form">
                <div class="form-group">
                    <label for="imagePrompt">Describe the image you want to generate:</label>
                    <textarea id="imagePrompt" placeholder="e.g., A beautiful sunset over the mountains" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="imageStyle">Style:</label>
                        <select id="imageStyle">
                            <option value="realistic">Realistic</option>
                            <option value="artistic">Artistic</option>
                            <option value="cartoon">Cartoon</option>
                            <option value="abstract">Abstract</option>
                            <option value="digital-art">Digital Art</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="imageSize">Size:</label>
                        <select id="imageSize">
                            <option value="512x512">512x512 (Square)</option>
                            <option value="1024x1024">1024x1024 (Large Square)</option>
                            <option value="1920x1080">1920x1080 (HD)</option>
                            <option value="768x1024">768x1024 (Portrait)</option>
                            <option value="1024x768">1024x768 (Landscape)</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="imageQuality">Quality:</label>
                        <select id="imageQuality">
                            <option value="standard">Standard</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="numberOfImages">Number of Images:</label>
                        <select id="numberOfImages">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button onclick="window.aiLydianChat.generateImage()" class="btn-primary">Generate Image</button>
                    <button onclick="window.aiLydianChat.closeDialog()" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `);
    }

    async generateImage() {
        const prompt = document.getElementById('imagePrompt').value;
        const style = document.getElementById('imageStyle').value;
        const size = document.getElementById('imageSize').value;
        const quality = document.getElementById('imageQuality').value;
        const numberOfImages = parseInt(document.getElementById('numberOfImages').value);

        if (!prompt.trim()) {
            alert('Please enter an image description');
            return;
        }

        this.closeDialog();
        this.showProcessingIndicator('Generating image...');

        try {
            const response = await fetch('/api/image/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    style,
                    size,
                    quality,
                    numberOfImages
                })
            });

            const result = await response.json();
            this.hideProcessingIndicator();

            if (result.success) {
                this.displayImageGenerationResult(result.data);
            } else {
                this.addMessageToChat('assistant', 'Image generation failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Image generation failed: ' + error.message, 'error');
        }
    }

    displayImageGenerationResult(data) {
        let message = `🎨 **Generated Images:**\n\n`;
        message += `**Prompt:** ${data.prompt}\n`;
        message += `**Style:** ${data.style}\n`;
        message += `**Size:** ${data.size}\n`;
        message += `**Processing Time:** ${data.processing_time}\n\n`;

        this.addMessageToChat('assistant', message);

        // Display generated images
        const chatMessages = document.getElementById('chatMessages');
        const imageContainer = document.createElement('div');
        imageContainer.className = 'generated-images-container';

        data.images.forEach((image, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = image.url;
            imgElement.alt = `Generated image ${index + 1}`;
            imgElement.style.cssText = 'max-width: 300px; max-height: 300px; margin: 10px; border-radius: 8px; cursor: pointer;';
            imgElement.onclick = () => this.showImageFullscreen(image.url);
            imageContainer.appendChild(imgElement);
        });

        const lastMessage = chatMessages.lastElementChild;
        if (lastMessage) {
            lastMessage.appendChild(imageContainer);
        }
    }

    showImageFullscreen(imageUrl) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; align-items: center;
            justify-content: center; z-index: 10000; cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';

        modal.appendChild(img);
        modal.onclick = () => modal.remove();

        document.body.appendChild(modal);
    }

    // 🎤 VOICE ANALYSIS DIALOG
    async showVoiceAnalysisDialog() {
        const dialog = this.createDialog('Voice Analysis', `
            <div class="voice-analysis-form">
                <div class="form-group">
                    <label>Choose option:</label>
                    <div class="voice-options">
                        <button onclick="window.aiLydianChat.startVoiceRecording()" class="btn-voice">🎤 Record Voice</button>
                        <button onclick="window.aiLydianChat.triggerAudioUpload()" class="btn-voice">📁 Upload Audio File</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="voiceLanguage">Language:</label>
                    <select id="voiceLanguage">
                        <option value="tr-TR">Turkish</option>
                        <option value="en-US">English</option>
                        <option value="ar-SA">Arabic</option>
                        <option value="de-DE">German</option>
                        <option value="fr-FR">French</option>
                        <option value="es-ES">Spanish</option>
                    </select>
                </div>
                <div class="dialog-actions">
                    <button onclick="window.aiLydianChat.closeDialog()" class="btn-secondary">Close</button>
                </div>
            </div>
        `);
    }

    triggerAudioUpload() {
        this.closeDialog();
        const audioInput = document.createElement('input');
        audioInput.type = 'file';
        audioInput.accept = 'audio/*';
        audioInput.onchange = (e) => this.handleAudioUpload(e);
        audioInput.click();
    }

    async handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showProcessingIndicator('Processing audio...');

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('language', 'tr-TR');

            const response = await fetch('/api/voice/speech-to-text', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.hideProcessingIndicator();

            if (result.success) {
                this.displayVoiceAnalysisResult(result.data);
            } else {
                this.addMessageToChat('assistant', 'Voice analysis failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Voice analysis failed: ' + error.message, 'error');
        }
    }

    displayVoiceAnalysisResult(data) {
        let message = `🎤 **Voice Analysis Result:**\n\n`;
        message += `**Transcription:** ${data.transcription}\n\n`;
        message += `**Language:** ${data.language}\n`;
        message += `**Confidence:** ${Math.round(data.confidence * 100)}%\n`;
        message += `**Duration:** ${data.duration} seconds\n\n`;

        if (data.alternatives && data.alternatives.length > 1) {
            message += `**Alternative Transcriptions:**\n`;
            data.alternatives.slice(1).forEach((alt, index) => {
                message += `${index + 1}. ${alt.text} (${Math.round(alt.confidence * 100)}%)\n`;
            });
        }

        this.addMessageToChat('assistant', message);
    }

    // 🔧 VISION ANALYSIS DIALOG
    async showVisionAnalysisDialog() {
        this.triggerImageUpload();
        this.setModelAndPrompt('ai-assistant', 'Upload an image for comprehensive AI vision analysis including object detection, OCR, and scene understanding.');
    }

    // 🎙️ VOICE RECORDING FUNCTIONALITY
    async startVoiceRecording() {
        this.closeDialog();

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Voice recording is not supported in this browser');
            return;
        }

        try {
            // Show recording indicator
            this.showRecordingIndicator();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await this.processRecordedAudio(audioBlob);

                // Stop recording indicator
                this.hideRecordingIndicator();

                // Stop the stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();

            // Auto-stop after 30 seconds or on user click
            this.recordingTimeout = setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 30000);

            // Add click handler to stop recording
            this.recordingStopHandler = () => {
                if (mediaRecorder.state === 'recording') {
                    clearTimeout(this.recordingTimeout);
                    mediaRecorder.stop();
                }
            };

            document.addEventListener('click', this.recordingStopHandler, { once: true });

        } catch (error) {
            this.hideRecordingIndicator();
            console.error('Voice recording error:', error);
            alert('Voice recording failed: ' + error.message);
        }
    }

    async processRecordedAudio(audioBlob) {
        this.showProcessingIndicator('Processing voice recording...');

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            formData.append('language', 'tr-TR');

            const response = await fetch('/api/voice/speech-to-text', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.hideProcessingIndicator();

            if (result.success) {
                this.displayVoiceAnalysisResult(result.data);

                // Auto-fill the transcribed text in the message input
                const messageInput = document.getElementById('messageInput');
                if (messageInput && result.data.transcription) {
                    messageInput.value = result.data.transcription;
                    messageInput.focus();
                }
            } else {
                this.addMessageToChat('assistant', 'Voice processing failed: ' + result.error, 'error');
            }
        } catch (error) {
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Voice processing failed: ' + error.message, 'error');
        }
    }

    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recordingIndicator';
        indicator.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #e74c3c;
            color: white; padding: 15px 20px; border-radius: 25px;
            display: flex; align-items: center; gap: 10px; z-index: 10000;
            animation: pulse 1.5s infinite; box-shadow: 0 4px 20px rgba(231,76,60,0.3);
        `;

        indicator.innerHTML = `
            <div style="width: 12px; height: 12px; background: white; border-radius: 50%; animation: blink 1s infinite;"></div>
            <span>Recording... Click anywhere to stop</span>
        `;

        document.body.appendChild(indicator);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.remove();
        }

        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
        }

        if (this.recordingStopHandler) {
            document.removeEventListener('click', this.recordingStopHandler);
        }
    }

    setModelAndPrompt(model, prompt) {
        // Model değiştir
        const modelOption = document.querySelector(`[data-model="${model}"]`);
        if (modelOption) {
            this.selectModel(modelOption);
        }

        // Prompt suggestion göster
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.placeholder = prompt;
            messageInput.focus();
        }
    }

    selectCapability(capability) {
        // Set appropriate model based on capability
        const capabilityModelMap = {
            'azure': 'azure-gpt-4o',
            'google': 'google-gemini-pro',
            'zai': 'zai-developer',
            'deepseek': 'deepseek-r1',
            'translation': 'azure-translator',
            'rag': 'azure-cognitive-search',
            'vision': 'azure-computer-vision',
            'audio': 'azure-speech-services'
        };

        const targetModel = capabilityModelMap[capability];
        if (targetModel) {
            // Find and select the model
            const modelOption = document.querySelector(`[data-model="${targetModel}"]`);
            if (modelOption) {
                this.selectModel(modelOption);
            }
        }

        // Add capability-specific prompt suggestion
        const messageInput = document.getElementById('messageInput');
        if (messageInput && !messageInput.value.trim()) {
            const prompts = {
                'azure': 'Microsoft Azure hizmetleri hakkında bilgi ver',
                'google': 'Google AI teknolojileri nasıl çalışır?',
                'zai': 'React component kodu yazabilir misin?',
                'deepseek': 'Bu problemi analiz et ve çöz',
                'translation': 'Bu metni İngilizceye çevir',
                'rag': 'Bu dokümanı analiz et',
                'vision': 'Bu resmi açıkla',
                'audio': 'Sesli mesajımı metne çevir'
            };

            if (prompts[capability]) {
                messageInput.placeholder = prompts[capability];
            }
        }
    }

    // Voice Input
    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
            return;
        }

        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) return;

        if (this.isRecording) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'tr-TR';

        const voiceBtn = document.getElementById('voiceBtn');
        const messageInput = document.getElementById('messageInput');

        this.isRecording = true;
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        voiceBtn.style.background = '#ef4444';

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            messageInput.value = finalTranscript + interimTranscript;
            this.handleInputChange();
        };

        this.recognition.onerror = (event) => {
            console.error('Ses tanıma hatası:', event.error);
            this.stopVoiceInput();
        };

        this.recognition.onend = () => {
            this.stopVoiceInput();
        };

        this.recognition.start();
    }

    stopVoiceInput() {
        if (this.recognition) {
            this.recognition.stop();
        }

        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = '';
        }

        this.isRecording = false;
    }

    // File Upload
    setupFileUpload() {
        // Already handled in event listeners
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            await this.processFile(file);
        }

        // Clear file input
        event.target.value = '';
    }

    async processFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            alert('Dosya boyutu 50MB\'dan büyük olamaz.');
            return;
        }

        // Show file upload message with progress
        this.addMessageToChat('user', `📎 Dosya yükleniyor: ${file.name} (${this.formatFileSize(file.size)})`);
        this.showProcessingIndicator('Dosya işleniyor...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Dosya yükleme hatası');
            }

            const result = await response.json();
            this.hideProcessingIndicator();
            this.handleEnhancedFileUploadResponse(result, file);

        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            this.hideProcessingIndicator();
            this.addMessageToChat('assistant', 'Dosya yüklenirken bir hata oluştu.', 'error');
        }
    }

    handleEnhancedFileUploadResponse(result, file) {
        if (result.success) {
            const analysis = result.data;
            let message = `✅ ${file.name} başarıyla analiz edildi!\n\n`;

            // Add detailed analysis based on file type
            if (analysis.type === 'image') {
                message += `📸 **Görüntü Analizi:**\n`;
                message += `• Boyut: ${analysis.dimensions.width}x${analysis.dimensions.height}\n`;
                message += `• Format: ${analysis.format}\n`;
                if (analysis.analysis) {
                    message += `• Tespit edilen nesneler: ${analysis.analysis.objects_detected.join(', ')}\n`;
                    if (analysis.analysis.text_detected) {
                        message += `• Metinde tespit edildi: ${analysis.analysis.text_detected}\n`;
                    }
                }
                if (analysis.thumbnails && analysis.thumbnails.preview) {
                    this.displayImagePreview(analysis.thumbnails.preview);
                }
            } else if (analysis.type === 'pdf') {
                message += `📄 **PDF Analizi:**\n`;
                message += `• Sayfa sayısı: ${analysis.pageCount}\n`;
                message += `• Kelime sayısı: ${analysis.wordCount}\n`;
                if (analysis.analysis) {
                    message += `• Özet: ${analysis.analysis.summary}\n`;
                    message += `• Anahtar kelimeler: ${analysis.analysis.keywords.join(', ')}\n`;
                }
            } else if (analysis.type === 'docx') {
                message += `📝 **Word Belgesi Analizi:**\n`;
                message += `• Kelime sayısı: ${analysis.wordCount}\n`;
                if (analysis.analysis) {
                    message += `• Özet: ${analysis.analysis.summary}\n`;
                }
            } else if (analysis.type === 'audio') {
                message += `🎵 **Ses Dosyası Analizi:**\n`;
                if (analysis.analysis && analysis.analysis.transcription) {
                    message += `• Transkript: ${analysis.analysis.transcription}\n`;
                }
            }

            message += `\nBu dosya hakkında sorularınızı sorabilirsiniz!`;
            this.addMessageToChat('assistant', message);
        } else {
            this.addMessageToChat('assistant', result.error || 'Dosya işlenirken bir hata oluştu.', 'error');
        }
    }

    displayImagePreview(base64Image) {
        const chatMessages = document.getElementById('chatMessages');
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-preview-container';
        imageContainer.innerHTML = `
            <img src="${base64Image}" alt="Uploaded image preview" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin: 10px 0;">
        `;

        const lastMessage = chatMessages.lastElementChild;
        if (lastMessage) {
            lastMessage.appendChild(imageContainer);
        }
    }

    showProcessingIndicator(message = 'İşleniyor...') {
        // Add processing indicator to UI
        const chatMessages = document.getElementById('chatMessages');
        const processingDiv = document.createElement('div');
        processingDiv.id = 'processingIndicator';
        processingDiv.className = 'processing-indicator';
        processingDiv.innerHTML = `
            <div class="processing-content">
                <div class="spinner"></div>
                <span>${message}</span>
            </div>
        `;
        chatMessages.appendChild(processingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideProcessingIndicator() {
        const indicator = document.getElementById('processingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Paste Handler
    handlePaste(event) {
        const items = Array.from(event.clipboardData.items);

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    this.processFile(file);
                }
            }
        }
    }

    // Chat History
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('ailydian_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
            }

            const conversations = localStorage.getItem('ailydian_conversations');
            if (conversations) {
                this.conversations = JSON.parse(conversations);
                this.updateHistoryUI();
            }
        } catch (error) {
            console.error('Chat geçmişi yüklenirken hata:', error);
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('ailydian_chat_history', JSON.stringify(this.chatHistory));
            if (this.conversations) {
                localStorage.setItem('ailydian_conversations', JSON.stringify(this.conversations));
            }
        } catch (error) {
            console.error('Chat geçmişi kaydedilirken hata:', error);
        }
    }

    updateHistoryUI() {
        const historyList = document.getElementById('historyList');
        if (!historyList || !this.conversations) return;

        historyList.innerHTML = '';

        this.conversations.slice(-10).reverse().forEach(conversation => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = conversation.title || 'Yeni Konuşma';
            item.addEventListener('click', () => this.loadConversation(conversation.id));
            historyList.appendChild(item);
        });
    }

    startNewChat() {
        // Clear current conversation
        this.currentConversation = null;
        this.chatHistory = [];

        // Clear messages
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        // Show welcome screen
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
            messagesContainer.style.display = 'none';
        }

        // Focus input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }

        console.log('Yeni sohbet başlatıldı');
    }

    // Utility Functions
    setMessageAndSend(message) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = message;
            this.handleInputChange();
            this.sendMessage();
        }
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.user-dropdown, .model-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = statusIndicator?.nextElementSibling;

        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${connected ? 'active' : ''}`;
        }

        if (statusText) {
            statusText.textContent = connected ? 'Çevrimiçi' : 'Bağlantı Kuruluyor...';
        }
    }

    updateTokenBalance(tokens) {
        this.tokens = { ...this.tokens, ...tokens };

        // Update UI if token display exists
        const tokenDisplay = document.querySelector('.token-balance');
        if (tokenDisplay) {
            tokenDisplay.textContent = `${this.tokens.balance} Token`;
        }
    }

    generateConversationTitle(response) {
        // Generate a title from the first response
        const words = response.split(' ').slice(0, 5);
        return words.join(' ') + (response.length > 50 ? '...' : '');
    }

    sendTypingIndicator() {
        if (this.isConnected && this.websocket) {
            this.websocket.send(JSON.stringify({
                type: 'typing',
                timestamp: new Date().toISOString()
            }));
        }
    }

    handleChatResponse(data) {
        this.addMessageToChat('assistant', data.response);
        this.showLoading(false);
    }

    handleTypingIndicator(data) {
        // Show typing indicator from other users
        // Implementation depends on multi-user chat requirements
    }

    handleSystemStatus(data) {
        console.log('Sistem durumu:', data);
        // Update system status indicators
    }

    handleError(data) {
        console.error('WebSocket hatası:', data);
        this.addMessageToChat('assistant', data.message || 'Bir hata oluştu.', 'error');
        this.showLoading(false);
    }

    initializeUI() {
        // Set initial focus
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            setTimeout(() => messageInput.focus(), 100);
        }

        // Initialize character counter
        this.handleInputChange();

        // Load initial data
        this.loadTokenBalance();
    }

    async loadTokenBalance() {
        try {
            const response = await fetch('/api/user/tokens');
            if (response.ok) {
                const data = await response.json();
                this.updateTokenBalance(data);
            }
        } catch (error) {
            console.error('Token bakiyesi yüklenirken hata:', error);
        }
    }
    // ========================================
    // 🎤 VOICE RECOGNITION METHODS
    // ========================================

    setupVoiceRecognition() {
        console.log('🎤 Sesli tanıma sistemi kuruluyor...');

        // Web Speech API desteğini kontrol et
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();

            // Ayarlar
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = true;
            this.speechRecognition.maxAlternatives = 1;
            this.speechRecognition.lang = this.currentLanguage;

            // Event listeners
            this.speechRecognition.onstart = () => {
                console.log('🎤 Ses tanıma başladı');
                this.isRecording = true;
                this.updateVoiceUI();
            };

            this.speechRecognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    this.insertTextToInput(finalTranscript);
                    console.log('🎤 Final transcript:', finalTranscript);
                }
            };

            this.speechRecognition.onerror = (event) => {
                console.error('🎤 Ses tanıma hatası:', event.error);
                this.isRecording = false;
                this.updateVoiceUI();
                this.showNotification('Ses tanıma hatası: ' + event.error, 'error');
            };

            this.speechRecognition.onend = () => {
                console.log('🎤 Ses tanıma bitti');
                this.isRecording = false;
                this.updateVoiceUI();
            };

            // UI event listeners
            this.setupVoiceUIListeners();

            console.log('✅ Sesli tanıma sistemi hazır');
        } else {
            console.warn('⚠️ Web Speech API desteklenmiyor');
            this.showNotification('Ses tanıma özelliği bu tarayıcıda desteklenmiyor', 'warning');
        }
    }

    setupVoiceUIListeners() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceDropdownBtn = document.getElementById('voiceDropdownBtn');
        const voiceDropdown = document.getElementById('voiceLanguageDropdown');
        const languageOptions = document.querySelectorAll('.language-option');

        // Ses kayıt butonu
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceRecording();
            });
        }

        // Dil seçim dropdown
        if (voiceDropdownBtn) {
            voiceDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                voiceDropdown.classList.toggle('show');
            });
        }

        // Dil seçenekleri
        languageOptions.forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.dataset.lang;
                const flag = option.dataset.flag;
                this.setVoiceLanguage(lang, flag);
                voiceDropdown.classList.remove('show');
            });
        });

        // Dropdown dışına tıklama
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.voice-input-container')) {
                voiceDropdown.classList.remove('show');
            }
        });

        // Aktif dili işaretle
        this.updateActiveLanguage();
    }

    toggleVoiceRecording() {
        if (!this.speechRecognition) {
            this.showNotification('Ses tanıma özelliği mevcut değil', 'error');
            return;
        }

        if (this.isRecording) {
            this.speechRecognition.stop();
        } else {
            try {
                this.speechRecognition.lang = this.currentLanguage;
                this.speechRecognition.start();
            } catch (error) {
                console.error('Ses tanıma başlatma hatası:', error);
                this.showNotification('Ses tanıma başlatılamadı', 'error');
            }
        }
    }

    setVoiceLanguage(lang) {
        if (!this.supportedLanguages[lang]) {
            console.error('Desteklenmeyen dil:', lang);
            return;
        }

        this.currentLanguage = lang;
        const langData = this.supportedLanguages[lang];

        // UI güncelle
        const voiceLanguageElement = document.getElementById('voiceLanguage');
        if (voiceLanguageElement) {
            voiceLanguageElement.textContent = langData.flag;
        }

        // Speech recognition dili güncelle
        if (this.speechRecognition) {
            this.speechRecognition.lang = lang;
        }

        this.updateActiveLanguage();

        console.log(`🌍 Ses tanıma dili değiştirildi: ${lang} ${langData.flag}`);
        this.showNotification(`Ses tanıma dili: ${langData.name}`, 'success');

        // Sesli mesaj kayıt başlat
        this.toggleVoiceRecording();
    }

    updateActiveLanguage() {
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.lang === this.currentLanguage);
        });
    }

    updateVoiceUI() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.toggle('recording', this.isRecording);

            if (this.isRecording) {
                voiceBtn.title = 'Kaydı durdur';
            } else {
                voiceBtn.title = 'Sesli mesaj';
            }
        }
    }

    insertTextToInput(text) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            const currentText = messageInput.value;
            const newText = currentText ? `${currentText} ${text}` : text;
            messageInput.value = newText;

            // Cursor'u sonuna getir
            messageInput.focus();
            messageInput.setSelectionRange(newText.length, newText.length);

            // Auto-resize tetikle
            this.autoResizeTextarea(messageInput);
        }
    }

    showNotification(message, type = 'info') {
        // Basit notification göster
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.background = '#00d4aa';
                break;
            case 'error':
                notification.style.background = '#ff4444';
                break;
            case 'warning':
                notification.style.background = '#ffa500';
                break;
            default:
                notification.style.background = '#333';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 🔧 DIALOG UTILITY FUNCTIONS
    createDialog(title, content) {
        // Remove existing dialog if any
        this.closeDialog();

        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.id = 'dialogOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; animation: fadeIn 0.3s;
        `;

        // Create dialog container
        const dialog = document.createElement('div');
        dialog.id = 'aiDialog';
        dialog.style.cssText = `
            background: var(--bg-color, #1a1a1a); border-radius: 12px;
            padding: 20px; max-width: 500px; width: 90%; max-height: 80vh;
            overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideIn 0.3s; color: var(--text-color, #e1e1e1);
        `;

        dialog.innerHTML = `
            <div class="dialog-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--primary-color, #3498db);">${title}</h3>
                <button onclick="window.aiLydianChat.closeDialog()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-color, #e1e1e1);">&times;</button>
            </div>
            <div class="dialog-content">
                ${content}
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add CSS for form styling
        this.addDialogStyles();

        return dialog;
    }

    closeDialog() {
        const overlay = document.getElementById('dialogOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    addDialogStyles() {
        if (document.getElementById('dialogStyles')) return;

        const style = document.createElement('style');
        style.id = 'dialogStyles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }

            .form-group {
                margin-bottom: 15px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: var(--text-color, #e1e1e1);
            }

            .form-group input, .form-group textarea, .form-group select {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color, #333);
                border-radius: 6px;
                background: var(--input-bg, #2a2a2a);
                color: var(--text-color, #e1e1e1);
                font-size: 14px;
            }

            .form-group textarea {
                resize: vertical;
                min-height: 80px;
            }

            .form-row {
                display: flex;
                gap: 15px;
            }

            .form-row .form-group {
                flex: 1;
            }

            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .checkbox-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: normal;
            }

            .checkbox-group input[type="checkbox"] {
                width: auto;
                margin: 0;
            }

            .voice-options {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .btn-voice {
                padding: 12px 20px;
                border: 1px solid var(--primary-color, #3498db);
                background: transparent;
                color: var(--primary-color, #3498db);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .btn-voice:hover {
                background: var(--primary-color, #3498db);
                color: white;
            }

            .dialog-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .btn-primary {
                padding: 10px 20px;
                background: var(--primary-color, #3498db);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s;
            }

            .btn-primary:hover {
                background: var(--primary-hover, #2980b9);
                transform: translateY(-1px);
            }

            .btn-secondary {
                padding: 10px 20px;
                background: transparent;
                color: var(--text-color, #e1e1e1);
                border: 1px solid var(--border-color, #333);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .btn-secondary:hover {
                background: var(--border-color, #333);
            }

            .processing-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                margin: 10px 0;
            }

            .processing-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--primary-color, #3498db);
            }

            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--border-color, #333);
                border-top: 2px solid var(--primary-color, #3498db);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .image-preview-container img, .generated-images-container img {
                border: 2px solid var(--border-color, #333);
                transition: all 0.3s;
            }

            .image-preview-container img:hover, .generated-images-container img:hover {
                border-color: var(--primary-color, #3498db);
                transform: scale(1.02);
            }
        `;

        document.head.appendChild(style);
    }

}

// Animation keyframes ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the chat
document.addEventListener('DOMContentLoaded', () => {
    window.aiLydianChat = new AiLydianChat();
});

    // 🎨 Arama Animasyon Sistemi
    setupSearchAnimation() {
        console.log('🎨 Arama animasyon sistemi kuruluyor...');

        // Search animation instance
        this.searchAnimation = new AiLydianSearchAnimation();

        // Send button search animation
        const sendButton = document.getElementById('sendBtn');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.startSearchAnimation();
            });
        }

        // Message input Enter key
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.startSearchAnimation();
                    this.sendMessage();
                }
            });
        }

        console.log('✅ Arama animasyon sistemi hazır!');
    }

    // Arama animasyonu başlat
    startSearchAnimation() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingSpinner = loadingOverlay?.querySelector('.loading-spinner');

        if (loadingSpinner) {
            // Rastgele animasyon tipi seç
            const animationType = this.searchAnimation.getRandomAnimation();

            // Özel AiLydian animasyon container oluştur
            const animationContainer = document.createElement('div');
            animationContainer.className = 'ailydian-search-container';
            animationContainer.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                padding: 20px;
            `;

            // Animasyonu başlat
            this.searchAnimation.startSearch(animationContainer, animationType);

            // Loading spinner'a ekle
            loadingSpinner.insertBefore(animationContainer, loadingSpinner.firstChild);

            // Loading overlay'i göster
            loadingOverlay.style.display = 'flex';
        }
    }

    // Arama animasyonu durdur
    stopSearchAnimation() {
        if (this.searchAnimation && this.searchAnimation.isActive()) {
            this.searchAnimation.stopSearch();
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';

            // Animation container'ı temizle
            const animationContainer = loadingOverlay.querySelector('.ailydian-search-container');
            if (animationContainer) {
                animationContainer.remove();
            }
        }
    }
}

// Export for global access
window.AiLydianChat = AiLydianChat;