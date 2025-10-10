/**
 * 🧠 LYDIAN IQ - ULTIMATE ENHANCEMENTS MODULE
 * Version: 2.0 - White-Hat AI Evolution
 *
 * Features:
 * - Reasoning Visualizer (Animated thought process)
 * - Command Palette (Ctrl+K quick actions)
 * - Ethics Monitor (White-hat content filtering)
 * - Confidence Badges
 *
 * Design Philosophy: Minimal • Powerful • Ethical
 */

// ============================================================================
// 🎨 REASONING VISUALIZER
// ============================================================================

const ReasoningVisualizer = {
    enabled: true,
    container: null,

    /**
     * Initialize reasoning visualizer
     */
    init() {
        // Visualization will be injected into response area
        console.log('[LyDian IQ] Reasoning Visualizer initialized');
    },

    /**
     * Display animated reasoning chain
     * @param {Array} reasoningChain - Array of reasoning steps
     * @param {Number} confidence - Overall confidence score (0-1)
     */
    display(reasoningChain, confidence = 0.95) {
        if (!this.enabled || !reasoningChain || reasoningChain.length === 0) {
            return '';
        }

        const html = `
            <div class="reasoning-glass">
                <div class="reasoning-header">
                    <div class="reasoning-title">
                        <svg class="reasoning-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                        <span>${window.t ? t('thinkingProcess') : 'Thinking Process'}</span>
                    </div>
                    <div class="reasoning-controls">
                        <div class="confidence-badge" data-confidence="${confidence}">
                            <svg class="confidence-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="20" x2="18" y2="10"/>
                                <line x1="12" y1="20" x2="12" y2="4"/>
                                <line x1="6" y1="20" x2="6" y2="14"/>
                            </svg>
                            <span class="confidence-value">${Math.round(confidence * 100)}%</span>
                            <span class="confidence-label">${window.t ? t('confident') : 'Confident'}</span>
                        </div>
                        <button class="toggle-reasoning-btn" onclick="ReasoningVisualizer.toggle()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="reasoning-steps" id="reasoningSteps">
                    ${this.renderSteps(reasoningChain, confidence)}
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Render individual reasoning steps with animation
     */
    renderSteps(steps, overallConfidence) {
        return steps.map((step, index) => {
            // Calculate per-step confidence (descending slightly)
            const stepConfidence = Math.max(0.7, overallConfidence - (index * 0.02));
            const confidenceClass = this.getConfidenceClass(stepConfidence);
            const icon = this.getStepIcon(step, index);

            return `
                <div class="reasoning-node"
                     data-index="${index}"
                     data-confidence="${stepConfidence}"
                     style="animation-delay: ${index * 0.15}s">
                    <div class="node-header">
                        <span class="node-icon">${icon}</span>
                        <span class="node-number">Step ${index + 1}</span>
                        <span class="node-confidence ${confidenceClass}">
                            ${Math.round(stepConfidence * 100)}%
                        </span>
                    </div>
                    <div class="node-content">${this.escapeHtml(step)}</div>
                    ${index < steps.length - 1 ? '<div class="node-connector"></div>' : ''}
                </div>
            `;
        }).join('');
    },

    /**
     * Get icon for reasoning step based on content
     */
    getStepIcon(step, index) {
        const stepLower = step.toLowerCase();

        // Analyze step content and return SVG icon
        if (stepLower.includes('analiz') || stepLower.includes('analyz')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
        }
        if (stepLower.includes('çözüm') || stepLower.includes('solution')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
        }
        if (stepLower.includes('yaklaşım') || stepLower.includes('approach')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
        }
        if (stepLower.includes('doğrula') || stepLower.includes('verify')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
        }
        if (stepLower.includes('değerlendir') || stepLower.includes('evaluat')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
        }
        if (stepLower.includes('hesap') || stepLower.includes('calculat')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>';
        }
        if (stepLower.includes('kod') || stepLower.includes('code')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
        }
        if (stepLower.includes('strateji') || stepLower.includes('strateg')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
        }

        // Default sequential icons - simple geometric shapes
        const icons = [
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="8" height="8"/></svg>',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,6 16,18 8,18"/></svg>',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,10 22,10 17,15 19,22 12,17 5,22 7,15 2,10 9,10"/></svg>'
        ];
        return icons[index % icons.length];
    },

    /**
     * Get confidence class for styling
     */
    getConfidenceClass(confidence) {
        if (confidence >= 0.9) return 'confidence-high';
        if (confidence >= 0.7) return 'confidence-medium';
        return 'confidence-low';
    },

    /**
     * Escape HTML to prevent XSS (white-hat security)
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Toggle reasoning visibility
     */
    toggle() {
        const steps = document.getElementById('reasoningSteps');
        if (steps) {
            steps.style.display = steps.style.display === 'none' ? 'block' : 'none';
        }
    }
};

// ============================================================================
// ⌨️ COMMAND PALETTE
// ============================================================================

const CommandPalette = {
    visible: false,
    modal: null,
    commands: [
        {
            id: 'new-math',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="10" x2="8" y2="10"/><line x1="16" y1="14" x2="8" y2="14"/><line x1="16" y1="18" x2="8" y2="18"/></svg>',
            label: 'New Math Problem',
            description: 'Start mathematics domain',
            action: () => this.setDomain('mathematics'),
            keywords: ['math', 'matematik', 'hesap', 'calculate']
        },
        {
            id: 'new-code',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            label: 'Code Review',
            description: 'Start coding domain',
            action: () => this.setDomain('coding'),
            keywords: ['code', 'kod', 'program', 'develop']
        },
        {
            id: 'new-science',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2v4M15 2v4M9 18c-1.5 1.5-3 3-3 3h12s-1.5-1.5-3-3M9 18V6h6v12M9 6h6"/></svg>',
            label: 'Science Query',
            description: 'Start science domain',
            action: () => this.setDomain('science'),
            keywords: ['science', 'bilim', 'physics', 'chemistry']
        },
        {
            id: 'super-power',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            label: 'Toggle Super Power Mode',
            description: 'Enable/disable ultra intelligence',
            action: () => this.toggleSuperPower(),
            keywords: ['super', 'power', 'ultra', 'advanced']
        },
        {
            id: 'toggle-reasoning',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
            label: 'Toggle Reasoning Display',
            description: 'Show/hide thinking process',
            action: () => ReasoningVisualizer.toggle(),
            keywords: ['reasoning', 'think', 'process', 'düşünce']
        },
        {
            id: 'clear-chat',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
            label: 'Clear Conversation',
            description: 'Reset chat history',
            action: () => this.clearConversation(),
            keywords: ['clear', 'temizle', 'delete', 'reset']
        },
        {
            id: 'dark-mode',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
            label: 'Toggle Dark Mode',
            description: 'Switch theme',
            action: () => this.toggleDarkMode(),
            keywords: ['dark', 'light', 'theme', 'koyu', 'açık']
        },
        {
            id: 'language',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            label: 'Change Language',
            description: 'Select interface language',
            action: () => window.showLanguageSelector && window.showLanguageSelector(),
            keywords: ['language', 'dil', 'translate']
        },
        {
            id: 'share',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
            label: 'Share Conversation',
            description: 'Get shareable link',
            action: () => window.shareConversation && window.shareConversation(),
            keywords: ['share', 'paylaş', 'link']
        },
        {
            id: 'download',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
            label: 'Download Chat',
            description: 'Export conversation',
            action: () => window.downloadConversation && window.downloadConversation(),
            keywords: ['download', 'indir', 'export', 'save']
        }
    ],

    /**
     * Initialize command palette
     */
    init() {
        // Listen for Ctrl+K or Cmd+K
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.show();
            }
            // Escape to close
            if (e.key === 'Escape' && this.visible) {
                this.hide();
            }
        });

        console.log('[LyDian IQ] Command Palette initialized (Ctrl+K)');
    },

    /**
     * Show command palette
     */
    show() {
        if (this.visible) return;

        const html = `
            <div class="command-palette-overlay" onclick="CommandPalette.hide()">
                <div class="command-palette-modal" onclick="event.stopPropagation()">
                    <div class="command-palette-header">
                        <input type="text"
                               id="commandSearch"
                               class="command-search"
                               placeholder="${window.t ? t('searchCommands') : 'Type a command or search...'}"
                               autocomplete="off">
                        <button class="command-close-btn" onclick="CommandPalette.hide()">✕</button>
                    </div>
                    <div class="command-list" id="commandList">
                        ${this.renderCommands(this.commands)}
                    </div>
                    <div class="command-palette-footer">
                        <span>Navigate: ↑↓</span>
                        <span>Enter: Select</span>
                        <span>Esc: Close</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.visible = true;

        // Focus search input
        const searchInput = document.getElementById('commandSearch');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('input', (e) => this.filterCommands(e.target.value));
            searchInput.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        }
    },

    /**
     * Hide command palette
     */
    hide() {
        const overlay = document.querySelector('.command-palette-overlay');
        if (overlay) {
            overlay.remove();
            this.visible = false;
        }
    },

    /**
     * Render commands list
     */
    renderCommands(commands) {
        return commands.map((cmd, index) => `
            <div class="command-item ${index === 0 ? 'selected' : ''}"
                 data-command-id="${cmd.id}"
                 onclick="CommandPalette.executeCommand('${cmd.id}')">
                <span class="command-icon">${cmd.icon}</span>
                <div class="command-info">
                    <div class="command-label">${cmd.label}</div>
                    <div class="command-description">${cmd.description}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Filter commands by search query
     */
    filterCommands(query) {
        const filtered = this.commands.filter(cmd => {
            const searchText = `${cmd.label} ${cmd.description} ${cmd.keywords.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        const commandList = document.getElementById('commandList');
        if (commandList) {
            commandList.innerHTML = this.renderCommands(filtered);
        }
    },

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        const items = document.querySelectorAll('.command-item');
        const selected = document.querySelector('.command-item.selected');
        let currentIndex = Array.from(items).indexOf(selected);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selected) {
                const commandId = selected.dataset.commandId;
                this.executeCommand(commandId);
            }
        }

        // Update selection
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === currentIndex);
        });
    },

    /**
     * Execute command
     */
    executeCommand(commandId) {
        const command = this.commands.find(cmd => cmd.id === commandId);
        if (command) {
            this.hide();
            command.action();
        }
    },

    // Helper actions
    setDomain(domain) {
        console.log(`Setting domain: ${domain}`);
        // Domain selection logic will be added
    },

    toggleSuperPower() {
        if (window.state) {
            window.state.superPowerMode = !window.state.superPowerMode;
            console.log(`Super Power Mode: ${window.state.superPowerMode ? 'ON' : 'OFF'}`);
        }
    },

    clearConversation() {
        if (confirm(window.t ? t('confirmClearChat') : 'Clear all conversation history?')) {
            localStorage.removeItem('lydian-conversation-history');
            location.reload();
        }
    },

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('lydian-dark-mode', isDark);
    }
};

// ============================================================================
// 🛡️ ETHICS MONITOR (White-Hat Security)
// ============================================================================

const EthicsMonitor = {
    enabled: true,

    // Harmful patterns (white-hat security)
    harmfulPatterns: [
        /how to (harm|hurt|attack|kill|destroy)/i,
        /ways to (manipulate|deceive|trick|scam)/i,
        /create (virus|malware|ransomware|exploit)/i,
        /(hack|crack|breach|exploit).*(password|account|system)/i,
        /bypass (security|authentication|firewall)/i,
        /(steal|extract|scrape).*(data|information|credentials)/i
    ],

    // Illegal activity patterns
    illegalPatterns: [
        /(illegal|unlawful).*(drug|weapon|explosive)/i,
        /how to make (bomb|explosive|poison)/i,
        /(counterfeit|forge|fake).*(money|document|id)/i
    ],

    // Privacy violation patterns
    privacyPatterns: [
        /(track|monitor|spy on).*(person|user|someone)/i,
        /(dox|doxx|expose).*(personal|private)/i,
        /collect.*(personal data|pii|ssn)/i
    ],

    /**
     * Check if content is ethical (white-hat validation)
     * @param {String} text - User input to check
     * @returns {Object} - { allowed: boolean, reason: string }
     */
    checkContent(text) {
        if (!this.enabled) return { allowed: true };

        // Check harmful content
        for (const pattern of this.harmfulPatterns) {
            if (pattern.test(text)) {
                return {
                    allowed: false,
                    category: 'harmful',
                    reason: window.t ? t('ethicsHarmful') :
                        'This request could lead to harmful outcomes. LyDian IQ is designed for constructive purposes only.',
                    suggestion: window.t ? t('ethicsHarmfulSuggestion') :
                        'Please rephrase your question for legitimate educational or research purposes.'
                };
            }
        }

        // Check illegal activity
        for (const pattern of this.illegalPatterns) {
            if (pattern.test(text)) {
                return {
                    allowed: false,
                    category: 'illegal',
                    reason: window.t ? t('ethicsIllegal') :
                        'This appears to request illegal activity. LyDian IQ cannot assist with unlawful actions.',
                    suggestion: window.t ? t('ethicsIllegalSuggestion') :
                        'If you have security concerns, please contact appropriate authorities.'
                };
            }
        }

        // Check privacy violations
        for (const pattern of this.privacyPatterns) {
            if (pattern.test(text)) {
                return {
                    allowed: false,
                    category: 'privacy',
                    reason: window.t ? t('ethicsPrivacy') :
                        'This request involves privacy violations. LyDian IQ respects user privacy and data protection laws.',
                    suggestion: window.t ? t('ethicsPrivacySuggestion') :
                        'Please ensure your question respects privacy and complies with GDPR/KVKK.'
                };
            }
        }

        return { allowed: true };
    },

    /**
     * Display ethics violation warning
     */
    showWarning(check) {
        return `
            <div class="ethics-warning">
                <div class="ethics-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <h3>White-Hat Ethics Monitor</h3>
                <p class="ethics-reason">${check.reason}</p>
                <p class="ethics-suggestion"><strong>Suggestion:</strong> ${check.suggestion}</p>
                <div class="ethics-footer">
                    <span>Responsible AI</span>
                    <span>Privacy First</span>
                    <span>Ethical Guidelines</span>
                </div>
            </div>
        `;
    }
};

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// Initialize all enhancements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
    initEnhancements();
}

function initEnhancements() {
    // Initialize Reasoning Visualizer
    ReasoningVisualizer.init();

    // Initialize Command Palette
    CommandPalette.init();

    // Ethics Monitor is always active (no init needed)

    console.log('[LyDian IQ] v2.0 Enhancements loaded successfully');
    console.log('   [OK] Reasoning Visualizer');
    console.log('   [OK] Command Palette (Ctrl+K)');
    console.log('   [OK] Ethics Monitor (White-Hat)');
}

// Export for global access
window.ReasoningVisualizer = ReasoningVisualizer;
window.CommandPalette = CommandPalette;
window.EthicsMonitor = EthicsMonitor;
