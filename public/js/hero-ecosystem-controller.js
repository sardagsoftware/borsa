/**
 * 🎬 Hero AI Ecosystem Controller
 * AiLydian - Interactive AI Animation Manager
 * Version: 1.0.0
 * Date: 2025-10-07
 * Zero Dependencies - Vanilla JavaScript
 */

(function() {
    'use strict';

    /**
     * Typewriter Effect Manager
     */
    class TypewriterEffect {
        constructor(element, texts, speed = 150) {
            this.element = element;
            this.texts = texts;
            this.speed = speed;
            this.textIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
            this.isPaused = false;
        }

        type() {
            const currentText = this.texts[this.textIndex];

            if (this.isDeleting) {
                this.element.textContent = currentText.substring(0, this.charIndex - 1);
                this.charIndex--;
            } else {
                this.element.textContent = currentText.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            let typeSpeed = this.speed;

            if (this.isDeleting) {
                typeSpeed = 80; // Daha yavaş silme
            }

            if (!this.isDeleting && this.charIndex === currentText.length) {
                // Pause at end of text - daha uzun bekleme
                typeSpeed = 3000;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                typeSpeed = 1000; // Geçiş öncesi bekleme
            }

            setTimeout(() => this.type(), typeSpeed);
        }

        start() {
            if (this.element) {
                this.type();
            }
        }
    }

    /**
     * AI Node Interaction Manager
     */
    class AINodeManager {
        constructor() {
            this.nodes = document.querySelectorAll('.ai-node');
            this.activeNode = null;
            this.init();
        }

        init() {
            this.nodes.forEach((node, index) => {
                // Add aria labels for accessibility
                node.setAttribute('role', 'button');
                node.setAttribute('tabindex', '0');
                node.setAttribute('aria-label', node.getAttribute('data-label'));

                // Click handler
                node.addEventListener('click', () => this.handleNodeClick(node, index));

                // Keyboard handler
                node.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleNodeClick(node, index);
                    }
                });

                // Touch handler for mobile
                node.addEventListener('touchstart', (e) => {
                    this.handleTouchStart(node, e);
                }, { passive: true });
            });
        }

        handleNodeClick(node, index) {
            const label = node.getAttribute('data-label');
            console.log(`AI Node clicked: ${label} (${index + 1}/6)`);

            // Add click ripple effect
            this.addRippleEffect(node);

            // Dispatch custom event for analytics or other handlers
            const event = new CustomEvent('ai-node-click', {
                detail: {
                    label: label,
                    index: index
                }
            });
            document.dispatchEvent(event);
        }

        handleTouchStart(node, event) {
            // Provide immediate touch feedback
            node.style.transform = 'translate(-50%, -50%) scale(1.1)';

            setTimeout(() => {
                node.style.transform = '';
            }, 200);
        }

        addRippleEffect(node) {
            node.style.transform = 'translate(-50%, -50%) scale(1.2)';

            setTimeout(() => {
                node.style.transform = '';
            }, 300);
        }

        highlightNode(index) {
            if (index >= 0 && index < this.nodes.length) {
                this.nodes[index].classList.add('highlighted');

                setTimeout(() => {
                    this.nodes[index].classList.remove('highlighted');
                }, 2000);
            }
        }
    }

    /**
     * Performance Monitor
     */
    class PerformanceMonitor {
        constructor() {
            this.isLowPerformance = false;
            this.init();
        }

        init() {
            // Check device performance
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

                if (connection) {
                    const effectiveType = connection.effectiveType;

                    // Slow connection (2G, slow-2g)
                    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                        this.isLowPerformance = true;
                        this.enableLowPerformanceMode();
                    }

                    // Listen for connection changes
                    connection.addEventListener('change', () => {
                        this.checkPerformance();
                    });
                }
            }

            // Check device memory (if available)
            if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
                this.isLowPerformance = true;
                this.enableLowPerformanceMode();
            }

            // Monitor frame rate
            this.monitorFPS();
        }

        checkPerformance() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            if (connection) {
                const effectiveType = connection.effectiveType;

                if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                    if (!this.isLowPerformance) {
                        this.isLowPerformance = true;
                        this.enableLowPerformanceMode();
                    }
                } else {
                    if (this.isLowPerformance) {
                        this.isLowPerformance = false;
                        this.disableLowPerformanceMode();
                    }
                }
            }
        }

        enableLowPerformanceMode() {
            console.log('⚡ Low performance mode enabled');
            document.body.classList.add('low-performance');

            // Slow down animations
            const ecosystem = document.querySelector('.global-ai-ecosystem');
            if (ecosystem) {
                ecosystem.style.animationDuration = '40s';
            }
        }

        disableLowPerformanceMode() {
            console.log('⚡ Normal performance mode enabled');
            document.body.classList.remove('low-performance');

            const ecosystem = document.querySelector('.global-ai-ecosystem');
            if (ecosystem) {
                ecosystem.style.animationDuration = '';
            }
        }

        monitorFPS() {
            let lastTime = performance.now();
            let frames = 0;
            let lowFPSCount = 0;

            const checkFrame = () => {
                const currentTime = performance.now();
                frames++;

                if (currentTime >= lastTime + 1000) {
                    const fps = Math.round((frames * 1000) / (currentTime - lastTime));

                    // If FPS drops below 30, enable low performance mode
                    if (fps < 30) {
                        lowFPSCount++;

                        if (lowFPSCount >= 3 && !this.isLowPerformance) {
                            this.isLowPerformance = true;
                            this.enableLowPerformanceMode();
                        }
                    } else {
                        lowFPSCount = 0;
                    }

                    frames = 0;
                    lastTime = currentTime;
                }

                requestAnimationFrame(checkFrame);
            };

            requestAnimationFrame(checkFrame);
        }
    }

    /**
     * Intersection Observer for Lazy Activation
     */
    class LazyAnimationController {
        constructor() {
            this.isActive = false;
            this.init();
        }

        init() {
            const heroSection = document.querySelector('.hero');

            if (!heroSection) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.isActive) {
                        this.activate();
                        this.isActive = true;
                    } else if (!entry.isIntersecting && this.isActive) {
                        this.deactivate();
                        this.isActive = false;
                    }
                });
            }, {
                threshold: 0.3
            });

            observer.observe(heroSection);
        }

        activate() {
            console.log('🎬 Hero ecosystem animations activated');
            document.body.classList.add('hero-active');
        }

        deactivate() {
            console.log('⏸️  Hero ecosystem animations paused');
            document.body.classList.remove('hero-active');
        }
    }

    /**
     * Mobile Interaction Enhancements
     */
    class MobileInteractionManager {
        constructor() {
            this.isMobile = window.innerWidth < 768;
            this.currentHighlight = 0;
            this.highlightInterval = null;

            if (this.isMobile) {
                this.init();
            }
        }

        init() {
            // Auto-cycle through nodes on mobile
            this.startAutoCycle();

            // Stop auto-cycle on user interaction
            const nodes = document.querySelectorAll('.ai-node');
            nodes.forEach(node => {
                node.addEventListener('touchstart', () => {
                    this.stopAutoCycle();
                }, { passive: true });
            });
        }

        startAutoCycle() {
            const nodes = document.querySelectorAll('.ai-node');

            if (nodes.length === 0) return;

            this.highlightInterval = setInterval(() => {
                // Remove previous highlight
                nodes.forEach(n => n.classList.remove('mobile-highlight'));

                // Add new highlight
                if (nodes[this.currentHighlight]) {
                    nodes[this.currentHighlight].classList.add('mobile-highlight');
                }

                this.currentHighlight = (this.currentHighlight + 1) % nodes.length;
            }, 3000);
        }

        stopAutoCycle() {
            if (this.highlightInterval) {
                clearInterval(this.highlightInterval);
                this.highlightInterval = null;
            }
        }
    }

    /**
     * Initialize All Controllers
     */
    function initHeroEcosystem() {
        // Typewriter effect
        const typewriterElement = document.getElementById('typewriter-text');
        if (typewriterElement) {
            const texts = [
                'Yapay Zeka Gücünü Elinizin Altına Getirin',
                'AI Chat ile Anında Cevaplar Alın',
                'Görsel Oluşturma ile Yaratıcılığınızı Keşfedin',
                'Kod AI ile Geliştirme Sürecinizi Hızlandırın',
                'Analytics ile Verilerinizi Analiz Edin',
                'Voice AI ile Sesli Etkileşim Kurun',
                'Video AI ile İçeriklerinizi Canlandırın'
            ];
            const typewriter = new TypewriterEffect(typewriterElement, texts);
            typewriter.start();
        }

        // AI Node interactions
        const nodeManager = new AINodeManager();

        // Performance monitoring
        const performanceMonitor = new PerformanceMonitor();

        // Lazy animation activation
        const lazyController = new LazyAnimationController();

        // Mobile enhancements
        const mobileManager = new MobileInteractionManager();

        console.log('🚀 AiLydian Hero Ecosystem initialized');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroEcosystem);
    } else {
        initHeroEcosystem();
    }

    // Listen for custom events (e.g., from analytics)
    document.addEventListener('ai-node-click', (event) => {
        console.log('📊 Analytics: AI Node clicked', event.detail);
        // You can send this to analytics service here
    });

})();
