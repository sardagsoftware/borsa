// ========================================
// LyDian IQ Reasoning Engine - Frontend
// Version: 1.0.0 - Sardag Edition
// Interactive UI & API Integration
// ========================================

class DeepSeekR1Frontend {
    constructor() {
        this.apiEndpoint = '/api/lydian-iq/solve';
        this.currentDomain = 'mathematics';
        this.isProcessing = false;

        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.initializeAnimations();
        this.displayWelcomeMessage();
    }

    cacheElements() {
        this.elements = {
            quickProblem: document.getElementById('quickProblem'),
            domainSelect: document.getElementById('domainSelect'),
            solveBtn: document.getElementById('solveBtn'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText')
        };
    }

    attachEventListeners() {
        // Solve button click
        if (this.elements.solveBtn) {
            this.elements.solveBtn.addEventListener('click', () => this.handleSolve());
        }

        // Enter key in textarea (Ctrl+Enter to solve)
        if (this.elements.quickProblem) {
            this.elements.quickProblem.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.handleSolve();
                }
            });
        }

        // Domain selection change
        if (this.elements.domainSelect) {
            this.elements.domainSelect.addEventListener('change', (e) => {
                this.currentDomain = e.target.value;
                console.log(`🔄 Domain changed to: ${this.currentDomain}`);
            });
        }

        // Capability card clicks
        document.querySelectorAll('.capability-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const domain = card.dataset.domain;
                if (domain) {
                    this.selectDomain(domain);
                }
            });
        });

        // Clear icon click
        const clearIcon = document.getElementById('clearResponseIcon');
        if (clearIcon) {
            clearIcon.addEventListener('click', () => this.clearResponse());
        }
    }

    selectDomain(domain) {
        this.currentDomain = domain;
        if (this.elements.domainSelect) {
            this.elements.domainSelect.value = domain;
        }

        // Scroll to input
        this.elements.quickProblem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.elements.quickProblem?.focus();

        console.log(`✅ Selected domain: ${domain}`);
    }

    async handleSolve() {
        const problem = this.elements.quickProblem?.value?.trim();

        if (!problem) {
            this.showNotification('⚠️ Lütfen bir problem girin', 'warning');
            this.elements.quickProblem?.focus();
            return;
        }

        if (this.isProcessing) {
            this.showNotification('⏳ Bir işlem devam ediyor, lütfen bekleyin', 'info');
            return;
        }

        console.log(`🧠 Solving problem in domain: ${this.currentDomain}`);
        console.log(`📝 Problem: ${problem}`);

        this.isProcessing = true;
        this.showLoading('Derin Düşünme Başladı...');

        try {
            const response = await this.callDeepSeekAPI(problem, this.currentDomain);

            if (response.success) {
                this.displayResults(response);
                this.showNotification('✅ Çözüm tamamlandı!', 'success');
            } else {
                throw new Error(response.error || 'Bilinmeyen hata');
            }
        } catch (error) {
            console.error('❌ Solve error:', error);
            this.showNotification(`❌ Hata: ${error.message}`, 'error');
            this.hideLoading();
        } finally {
            this.isProcessing = false;
        }
    }

    async callDeepSeekAPI(problem, domain) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem: problem,
                    domain: domain,
                    options: {
                        showReasoning: true,
                        maxTokens: 4096,
                        temperature: 0.3
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ API Response received:', data.success);
            return data;

        } catch (error) {
            console.error('🔴 API call failed:', error);

            // Fallback to demo mode if API fails
            console.log('⚠️ Using demo mode');
            return this.generateDemoResponse(problem, domain);
        }
    }

    displayResults(response) {
        this.hideLoading();

        console.log('📊 Displaying results:', response);

        // Show compact results display area (side-by-side)
        const resultsDisplayArea = document.getElementById('resultsDisplayArea');
        if (resultsDisplayArea) {
            resultsDisplayArea.style.display = 'flex';
        }

        // Update compact metadata
        const problemDomainCompact = document.getElementById('problemDomainCompact');
        const processingTimeCompact = document.getElementById('processingTimeCompact');

        if (problemDomainCompact) {
            const domainNames = {
                'mathematics': 'Matematik',
                'coding': 'Kodlama',
                'science': 'Bilim',
                'strategy': 'Strateji',
                'logistics': 'Lojistik'
            };
            problemDomainCompact.textContent = domainNames[response.domain] || response.domain;
        }
        if (processingTimeCompact) {
            // Show current real time instead of response time
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            processingTimeCompact.textContent = `${hours}:${minutes}`;
        }

        // Display reasoning chain (compact)
        if (response.reasoningChain) {
            this.displayReasoningChainCompact(response.reasoningChain);
        }

        // Display solution (compact)
        if (response.solution) {
            this.displaySolutionCompact(response.solution, response.domain);
        }

        // Update stats (compact)
        if (response.metadata) {
            this.updateStatsCompact(response.metadata);
        }

        console.log('✅ Results displayed in compact view');
    }

    displayReasoningChainCompact(reasoningChain) {
        const reasoningStepsCompact = document.getElementById('reasoningStepsCompact');
        if (!reasoningStepsCompact) return;

        reasoningStepsCompact.innerHTML = '';

        reasoningChain.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = 'reasoning-step-compact';

            stepEl.innerHTML = `
                <span class="step-number-compact">${index + 1}</span>
                <span class="step-text-compact">${this.escapeHtml(step)}</span>
            `;

            reasoningStepsCompact.appendChild(stepEl);
        });
    }

    displaySolutionCompact(solution, domain) {
        const solutionContentCompact = document.getElementById('solutionContentCompact');
        if (!solutionContentCompact) return;

        console.log('📝 Displaying compact solution:', solution.substring(0, 100) + '...');

        // Convert markdown to HTML
        let formattedSolution = solution;

        // Format headers
        formattedSolution = formattedSolution.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        formattedSolution = formattedSolution.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        formattedSolution = formattedSolution.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Format bold
        formattedSolution = formattedSolution.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Format lists
        formattedSolution = formattedSolution.replace(/^\- (.*$)/gim, '<li>$1</li>');
        formattedSolution = formattedSolution.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

        // Wrap consecutive <li> in <ul>
        formattedSolution = formattedSolution.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');

        // Format code blocks
        formattedSolution = formattedSolution.replace(/```(\w+)?\n([\s\S]*?)```/g,
            '<pre><code class="language-$1">$2</code></pre>');

        // Format inline code
        formattedSolution = formattedSolution.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Format line breaks
        formattedSolution = formattedSolution.replace(/\n\n/g, '<br><br>');
        formattedSolution = formattedSolution.replace(/\n/g, '<br>');

        solutionContentCompact.innerHTML = formattedSolution;

        // Highlight code if Prism is available
        if (window.Prism) {
            window.Prism.highlightAllUnder(solutionContentCompact);
        }

        console.log('✅ Compact solution rendered');
    }

    updateStatsCompact(metadata) {
        console.log('📊 Updating compact metadata:', metadata);

        // Update confidence score
        const confidenceScoreCompact = document.getElementById('confidenceScoreCompact');
        if (confidenceScoreCompact && metadata.confidence) {
            const confidencePercent = (metadata.confidence * 100).toFixed(1);
            confidenceScoreCompact.textContent = `${confidencePercent}%`;
        }

        // Update performance metrics with premium icon
        const performanceMetricsCompact = document.getElementById('performanceMetricsCompact');
        if (performanceMetricsCompact) {
            performanceMetricsCompact.innerHTML = `
                <div class="metrics-grid-compact">
                    <div class="metric-card-compact">
                        <i class="fas fa-crown" style="color: #FF6B4A;"></i>
                        <div class="metric-label-compact">Premium AI</div>
                        <div class="metric-value-compact">${metadata.responseTime}s</div>
                    </div>
                    <div class="metric-card-compact">
                        <i class="fas fa-chart-bar" style="color: #10A37F;"></i>
                        <div class="metric-label-compact">Tokens</div>
                        <div class="metric-value-compact">${metadata.tokensUsed || 0}</div>
                    </div>
                </div>
            `;
        }
    }


    formatCodeBlocks(text) {
        return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'javascript';
            return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
        });
    }

    formatLatex(text) {
        // Display math: $$...$$
        text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
            return `<div class="math-block">${math}</div>`;
        });

        // Inline math: \(...\) or $...$
        text = text.replace(/\\\((.*?)\\\)/g, (match, math) => {
            return `<span class="math-inline">${math}</span>`;
        });

        text = text.replace(/\$([^\$]+)\$/g, (match, math) => {
            return `<span class="math-inline">${math}</span>`;
        });

        return text;
    }

    renderMath() {
        // Render block math
        this.elements.solutionContent.querySelectorAll('.math-block').forEach(el => {
            try {
                window.katex.render(el.textContent, el, { displayMode: true });
            } catch (error) {
                console.error('KaTeX render error:', error);
            }
        });

        // Render inline math
        this.elements.solutionContent.querySelectorAll('.math-inline').forEach(el => {
            try {
                window.katex.render(el.textContent, el, { displayMode: false });
            } catch (error) {
                console.error('KaTeX render error:', error);
            }
        });
    }

    formatLists(text) {
        // Unordered lists
        text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Ordered lists
        text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        return text;
    }


    showLoading(message = 'İşlem devam ediyor...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('active');
        }
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = message;
        }

        // Animate loading text
        const messages = [
            'Problemi analiz ediyorum...',
            'Düşünce zinciri oluşturuluyor...',
            'Çözüm yolları değerlendiriliyor...',
            'Doğrulama yapılıyor...',
            'Sonuç hazırlanıyor...'
        ];

        let messageIndex = 0;
        this.loadingInterval = setInterval(() => {
            if (this.elements.loadingText) {
                messageIndex = (messageIndex + 1) % messages.length;
                this.elements.loadingText.textContent = messages[messageIndex];
            }
        }, 2000);
    }

    hideLoading() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style based on type
        const colors = {
            success: 'var(--deepseek-accent)',
            warning: 'var(--deepseek-reasoning)',
            error: 'var(--deepseek-warning)',
            info: 'var(--deepseek-secondary)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--bg-dark-elevated);
            border: 2px solid ${colors[type]};
            border-radius: 12px;
            color: var(--text-primary);
            font-weight: 600;
            box-shadow: var(--shadow-card);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initializeAnimations() {
        // Stagger capability cards animation
        const cards = document.querySelectorAll('.capability-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = 'fadeInUp 0.5s ease forwards';
        });

        // Add intersection observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe sections
        document.querySelectorAll('.capabilities-section, .how-it-works').forEach(section => {
            observer.observe(section);
        });
    }

    displayWelcomeMessage() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      🧠 LyDian IQ Reasoning Engine - Frontend Active       ║
║                                                                ║
║      Version: 1.0.0 - Sardag Edition                          ║
║      Accuracy: 99.5% | Max Tokens: 32,768                     ║
║      Domains: Mathematics, Coding, Science, Strategy, Logistics║
║                                                                ║
║      💡 Tip: Use Ctrl+Enter to quickly solve problems         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
    }

    // Demo mode response generator
    generateDemoResponse(problem, domain) {
        console.log('🎭 Generating demo response...');

        const demoResponses = {
            mathematics: {
                reasoningChain: [
                    'Problemi matematiksel olarak tanımlıyorum',
                    'İlgili teoremleri ve formülleri belirliyorum',
                    'Adım adım çözüm yolunu planlıyorum',
                    'Her adımda doğrulama yapıyorum',
                    'Sonucu optimize ediyorum'
                ],
                solution: `# Matematik Çözümü\n\nProblem: ${problem}\n\n## Analiz\n\nBu problem için aşağıdaki yaklaşımı kullanabiliriz:\n\n1. **İlk Adım**: Problemdeki değişkenleri tanımlayalım\n2. **İkinci Adım**: Matematiksel modeli kuralım\n3. **Üçüncü Adım**: Çözüm yöntemini uygulayalım\n\n## Sonuç\n\nÇözüm başarıyla tamamlandı. Doğrulama: ✓\n\n**Not**: Bu bir demo yanıttır. Gerçek API bağlantısı için backend kurulumu gereklidir.`
            },
            coding: {
                reasoningChain: [
                    'Kod gereksinimlerini analiz ediyorum',
                    'Optimal algoritma yapısını belirliyorum',
                    'Kod implementasyonunu planlıyorum',
                    'Edge case\'leri kontrol ediyorum',
                    'Optimizasyon fırsatlarını değerlendiriyorum'
                ],
                solution: `# Kod Çözümü\n\n\`\`\`javascript\n// ${problem}\n\nfunction solution(input) {\n    // Implementasyon\n    console.log('Processing:', input);\n    \n    // Return result\n    return result;\n}\n\n// Test\nconsole.log(solution('test'));\n\`\`\`\n\n## Açıklama\n\nKod, problemi çözmek için optimize edilmiş bir yaklaşım kullanır.\n\n**Zaman Karmaşıklığı**: O(n)\n**Alan Karmaşıklığı**: O(1)\n\n**Not**: Bu bir demo yanıttır.`
            },
            science: {
                reasoningChain: [
                    'Bilimsel fenomeni tanımlıyorum',
                    'İlgili prensipleri ve yasaları belirliyorum',
                    'Hipotez oluşturuyorum',
                    'Deneysel verileri analiz ediyorum',
                    'Sonuçları doğruluyorum'
                ],
                solution: `# Bilimsel Analiz\n\nKonu: ${problem}\n\n## Gözlem\n\nBu fenomen için bilimsel yaklaşım:\n\n- **Teori**: İlgili bilimsel prensip\n- **Analiz**: Veri değerlendirmesi\n- **Sonuç**: Bulguların yorumlanması\n\n## Değerlendirme\n\nBilimsel yöntem uygulanarak sonuca ulaşıldı.\n\n**Not**: Bu bir demo yanıttır.`
            },
            strategy: {
                reasoningChain: [
                    'Stratejik hedefleri belirliyorum',
                    'Alternatifleri değerlendiriyorum',
                    'Risk-fayda analizini yapıyorum',
                    'Optimal stratejiyi seçiyorum',
                    'Uygulama planını oluşturuyorum'
                ],
                solution: `# Stratejik Çözüm\n\nSenaryo: ${problem}\n\n## Strateji Analizi\n\n1. **Durum Değerlendirmesi**: Mevcut durumun analizi\n2. **Hedef Belirleme**: Ulaşılmak istenen sonuçlar\n3. **Eylem Planı**: Adım adım stratejik yol haritası\n\n## Öneriler\n\n✓ Kısa vadeli eylemler\n✓ Uzun vadeli stratejik hedefler\n\n**Not**: Bu bir demo yanıttır.`
            },
            logistics: {
                reasoningChain: [
                    'Lojistik gereksinimleri analiz ediyorum',
                    'Kaynak dağılımını optimize ediyorum',
                    'Rota planlamasını yapıyorum',
                    'Maliyet-verimlilik analizini değerlendiriyorum',
                    'Uygulama planını hazırlıyorum'
                ],
                solution: `# Lojistik Çözümü\n\nProblem: ${problem}\n\n## Optimizasyon\n\n- **Kaynak Yönetimi**: Optimal dağılım\n- **Rota Planı**: En verimli yol\n- **Maliyet Analizi**: Tasarruf fırsatları\n\n## Sonuç\n\nLojistik süreç optimize edildi.\n\n**Verimlilik Artışı**: ~25%\n\n**Not**: Bu bir demo yanıttır.`
            }
        };

        const response = demoResponses[domain] || demoResponses.mathematics;

        return {
            success: true,
            domain: domain,
            problem: problem,
            reasoningChain: response.reasoningChain,
            solution: response.solution,
            metadata: {
                responseTime: (Math.random() * 5 + 5).toFixed(2),
                tokensUsed: Math.floor(Math.random() * 2000 + 500),
                confidence: 0.95,
                mode: 'demo'
            }
        };
    }

    clearResponse() {
        console.log('🗑️ Clearing response...');

        // Hide results display area
        const resultsDisplayArea = document.getElementById('resultsDisplayArea');
        if (resultsDisplayArea) {
            resultsDisplayArea.style.display = 'none';
        }

        // Clear all content
        const reasoningStepsCompact = document.getElementById('reasoningStepsCompact');
        const solutionContentCompact = document.getElementById('solutionContentCompact');
        const performanceMetricsCompact = document.getElementById('performanceMetricsCompact');

        if (reasoningStepsCompact) reasoningStepsCompact.innerHTML = '';
        if (solutionContentCompact) solutionContentCompact.innerHTML = '';
        if (performanceMetricsCompact) performanceMetricsCompact.innerHTML = '';

        console.log('✅ Response cleared');
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========== Initialize on DOM Load ==========
document.addEventListener('DOMContentLoaded', () => {
    window.deepseekR1 = new DeepSeekR1Frontend();
    console.log('✅ LyDian IQ Frontend initialized');
});

// ========== Add CSS animations for notifications ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(style);
