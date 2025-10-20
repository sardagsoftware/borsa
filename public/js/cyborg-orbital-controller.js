/**
 * 🤖 AiLydian Cyborg Orbital Controller
 * Dr. Lydia Sentinel + AI Ecosystem Integration
 * Version: 1.0.0 PRODUCTION
 * Date: 2025-10-07
 */

(function() {
    'use strict';

    /**
     * Typewriter Effect for Cyborg Hero
     */
    class CyborgTypewriter {
        constructor(element, texts, speed = 150) {
            this.element = element;
            this.texts = texts;
            this.speed = speed;
            this.textIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
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
                typeSpeed = 80; // Slower delete
            }

            if (!this.isDeleting && this.charIndex === currentText.length) {
                typeSpeed = 3000; // Pause at end
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                typeSpeed = 1000; // Pause before next
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
     * AI Orbital System Manager
     */
    class AIrbitalSystemManager {
        constructor() {
            this.nodes = [];
            this.isInitialized = false;
        }

        init() {
            this.createOrbitalNodes();
            this.addInteractivity();
            this.isInitialized = true;
            console.log('🎯 AI Orbital System initialized');
        }

        createOrbitalNodes() {
            const container = document.querySelector('.ai-orbital-system');
            if (!container) {
                console.warn('AI orbital system container not found');
                return;
            }

            const aiServices = [
                { emoji: '⚖️', name: 'Legal AI', color: '#10A37F' },
                { emoji: '🏥', name: 'Medical AI', color: '#ec4899' },
                { emoji: '💻', name: 'Code AI', color: '#1a73e8' },
                { emoji: '📊', name: 'Analytics AI', color: '#9333ea' }
            ];

            aiServices.forEach((service, index) => {
                const node = document.createElement('div');
                node.className = 'ai-node';
                node.setAttribute('data-service', service.name);
                node.setAttribute('data-index', index);

                const nodeInner = document.createElement('div');
                nodeInner.className = 'ai-node-inner';
                nodeInner.textContent = service.emoji;
                nodeInner.setAttribute('title', service.name);

                node.appendChild(nodeInner);
                container.appendChild(node);

                this.nodes.push({
                    element: node,
                    service: service.name,
                    emoji: service.emoji
                });
            });
        }

        addInteractivity() {
            this.nodes.forEach(nodeData => {
                const nodeInner = nodeData.element.querySelector('.ai-node-inner');

                nodeInner.addEventListener('click', () => {
                    console.log(`🎯 ${nodeData.service} clicked`);
                    this.triggerNodeActivation(nodeData);
                });

                nodeInner.addEventListener('mouseenter', () => {
                    nodeInner.style.transform = 'scale(1.2)';
                });

                nodeInner.addEventListener('mouseleave', () => {
                    nodeInner.style.transform = '';
                });
            });
        }

        triggerNodeActivation(nodeData) {
            const nodeInner = nodeData.element.querySelector('.ai-node-inner');

            // Create energy burst effect
            const burst = document.createElement('div');
            burst.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(100, 252, 255, 0.8), transparent);
                pointer-events: none;
                animation: energy-burst 0.8s ease-out forwards;
            `;

            nodeData.element.appendChild(burst);

            setTimeout(() => {
                burst.remove();
            }, 800);

            // Navigate to service
            const serviceRoutes = {
                'Legal AI': '/lydian-legal-search.html',
                'Medical AI': '/medical-expert.html',
                'Code AI': '/chat.html',
                'Analytics AI': '/analytics.html'
            };

            const route = serviceRoutes[nodeData.service];
            if (route) {
                setTimeout(() => {
                    window.location.href = route;
                }, 500);
            }
        }
    }

    /**
     * Cyborg Character Manager
     */
    class CyborgCharacterManager {
        constructor() {
            this.isActive = false;
        }

        init() {
            this.addCharacterInteractivity();
            console.log('🤖 Dr. Lydia Sentinel character initialized');
        }

        addCharacterInteractivity() {
            const character = document.querySelector('.cyborg-character-center');
            if (!character) return;

            character.addEventListener('mouseenter', () => {
                this.activateCharacter();
            });

            character.addEventListener('mouseleave', () => {
                this.deactivateCharacter();
            });

            character.addEventListener('click', () => {
                this.showCharacterInfo();
            });
        }

        activateCharacter() {
            this.isActive = true;
            const aura = document.querySelector('.cyborg-aura');
            if (aura) {
                aura.style.transform = 'translate(-50%, -50%) scale(1.2)';
                aura.style.opacity = '1';
            }
        }

        deactivateCharacter() {
            this.isActive = false;
            const aura = document.querySelector('.cyborg-aura');
            if (aura) {
                aura.style.transform = '';
                aura.style.opacity = '';
            }
        }

        showCharacterInfo() {
            console.log('🤖 Dr. Lydia Sentinel - AiLydian\'ın Yaratıcısı');

            // Create info tooltip
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 30px;
                border-radius: 20px;
                border: 2px solid rgba(64, 156, 255, 0.5);
                box-shadow: 0 0 50px rgba(64, 156, 255, 0.3);
                z-index: 10000;
                max-width: 500px;
                text-align: center;
                animation: tooltip-appear 0.3s ease-out;
            `;

            tooltip.innerHTML = `
                <h2 style="font-size: 2rem; margin-bottom: 15px; color: #64fcff;">
                    Dr. Lydia Sentinel
                </h2>
                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                    Yapay zekayı anlamak için kendini dönüştüren bilim insanı.
                    <br><br>
                    Artık hem insan sezgisine hem AI gücüne sahip.
                    AiLydian, onun vizyonunun ürünü.
                </p>
                <button onclick="this.parentElement.remove()" style="
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #10A37F, #0D8F6E);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 1rem;
                ">Anladım</button>
            `;

            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes tooltip-appear {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(tooltip);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (tooltip.parentElement) {
                    tooltip.remove();
                }
            }, 10000);
        }
    }

    /**
     * Performance Monitor
     */
    class PerformanceMonitor {
        constructor() {
            this.fps = 60;
            this.lastTime = performance.now();
            this.frameCount = 0;
        }

        start() {
            this.monitor();
        }

        monitor() {
            const currentTime = performance.now();
            this.frameCount++;

            if (currentTime >= this.lastTime + 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;

                // Auto-optimize if low FPS
                if (this.fps < 30) {
                    this.applyLowPerformanceMode();
                }
            }

            requestAnimationFrame(() => this.monitor());
        }

        applyLowPerformanceMode() {
            console.warn('⚠️ Low FPS detected, applying performance optimizations');

            // Reduce animation complexity
            const animations = document.querySelectorAll('.hair-strand, .tech-particle');
            animations.forEach(el => {
                el.style.animationDuration = '8s'; // Slower animations
            });
        }
    }

    /**
     * Main Initialization
     */
    function initCyborgOrbitalHero() {
        console.log('🚀 Initializing Cyborg Orbital Hero System...');

        // Initialize Typewriter
        const typewriterElement = document.getElementById('cyborg-typewriter');
        if (typewriterElement) {
            const texts = [
                'AiLydian\'ın Yaratıcısı',
                'İnsan-AI Hibriti',
                'Geleceğin Vizyoneri',
                'Yapay Zekanın Rehberi',
                'Yarı İnsan, Yarı AI',
                'Tam Güç, Tam Kontrol'
            ];

            const typewriter = new CyborgTypewriter(typewriterElement, texts, 150);
            typewriter.start();
        }

        // Initialize AI Orbital System
        const orbitalManager = new AIrbitalSystemManager();
        orbitalManager.init();

        // Initialize Cyborg Character
        const characterManager = new CyborgCharacterManager();
        characterManager.init();

        // Initialize Performance Monitor
        const performanceMonitor = new PerformanceMonitor();
        performanceMonitor.start();

        // Add energy burst animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes energy-burst {
                from {
                    width: 20px;
                    height: 20px;
                    opacity: 1;
                }
                to {
                    width: 150px;
                    height: 150px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        console.log('✅ Cyborg Orbital Hero System ready');

        // Store globally
        window.ailydianCyborgOrbital = {
            typewriter: typewriterElement ? true : false,
            orbitalManager,
            characterManager,
            performanceMonitor
        };
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCyborgOrbitalHero);
    } else {
        initCyborgOrbitalHero();
    }

})();
