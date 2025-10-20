/**
 * 🎬 AiLydian Realistic Character Controller
 * Human + AI Character Interaction System
 * Version: 3.0.0 REALISTIC
 * Date: 2025-10-07
 */

(function() {
    'use strict';

    /**
     * Realistic Character Manager
     */
    class RealisticCharacterManager {
        constructor() {
            this.dialogues = {
                human: [
                    "Merhaba, ben AiLydian kullanıcısıyım",
                    "AI ile çalışmak harika!",
                    "Verimliliğim arttı",
                    "Zaman tasarrufu sağlıyorum"
                ],
                aiLegal: [
                    "Hukuki analizde yardımcıyım",
                    "Kanun araştırması yapıyorum",
                    "Dava dosyası hazırlıyorum"
                ],
                aiMedical: [
                    "Sağlık verilerini analiz ediyorum",
                    "Teşhis desteği sağlıyorum",
                    "Hasta kayıtlarını yönetiyorum"
                ],
                aiCode: [
                    "Kod yazıyorum",
                    "Bug tespiti yapıyorum",
                    "Optimizasyon öneriyorum"
                ],
                aiAnalytics: [
                    "Veri analizi yapıyorum",
                    "Rapor oluşturuyorum",
                    "Tahmin modeli geliştiriyorum"
                ],
                aiVoice: [
                    "Sesli komutları işliyorum",
                    "Metin okuyorum",
                    "Çeviri yapıyorum"
                ],
                aiVideo: [
                    "Video düzenliyorum",
                    "İçerik oluşturuyorum",
                    "Animasyon yapıyorum"
                ]
            };

            this.currentDialogueIndex = {
                human: 0,
                aiLegal: 0,
                aiMedical: 0,
                aiCode: 0,
                aiAnalytics: 0,
                aiVoice: 0,
                aiVideo: 0
            };

            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.createCharacters();
            this.startDialogueRotation();
            this.addInteractivity();

            console.log('🎬 Realistic characters initialized');
        }

        createCharacters() {
            const stage = document.querySelector('.characters-stage');
            if (!stage) {
                console.warn('Characters stage not found');
                return;
            }

            // Create human character
            const human = this.createHumanCharacter();
            stage.appendChild(human);

            // Create AI companions
            const aiCompanions = [
                { type: 'legal', color: '#10A37F', name: 'Legal AI' },
                { type: 'medical', color: '#ec4899', name: 'Medical AI' },
                { type: 'code', color: '#1a73e8', name: 'Code AI' },
                { type: 'analytics', color: '#9333ea', name: 'Analytics AI' },
                { type: 'voice', color: '#f59e0b', name: 'Voice AI' },
                { type: 'video', color: '#06b6d4', name: 'Video AI' }
            ];

            aiCompanions.forEach(ai => {
                const companion = this.createAICompanion(ai);
                stage.appendChild(companion);
            });
        }

        createHumanCharacter() {
            const human = document.createElement('div');
            human.className = 'human-realistic';
            human.setAttribute('data-character', 'human');

            human.innerHTML = `
                <!-- Hair -->
                <div class="human-hair"></div>

                <!-- Head -->
                <div class="human-head">
                    <!-- Eyes -->
                    <div class="human-eye left"></div>
                    <div class="human-eye right"></div>

                    <!-- Eyebrows -->
                    <div class="human-eyebrow left"></div>
                    <div class="human-eyebrow right"></div>

                    <!-- Mouth -->
                    <div class="human-mouth"></div>
                </div>

                <!-- Neck -->
                <div class="human-neck"></div>

                <!-- Torso -->
                <div class="human-torso"></div>

                <!-- Arms -->
                <div class="human-arm left">
                    <div class="human-hand"></div>
                </div>
                <div class="human-arm right">
                    <div class="human-hand"></div>
                </div>

                <!-- Legs -->
                <div class="human-leg left">
                    <div class="human-shoe"></div>
                </div>
                <div class="human-leg right">
                    <div class="human-shoe"></div>
                </div>

                <!-- Speech bubble -->
                <div class="speech-bubble"></div>
            `;

            return human;
        }

        createAICompanion(config) {
            const companion = document.createElement('div');
            companion.className = 'ai-companion-realistic';
            companion.setAttribute('data-character', `ai${config.type.charAt(0).toUpperCase() + config.type.slice(1)}`);
            companion.setAttribute('data-ai-name', config.name);

            companion.innerHTML = `
                <!-- Robot head -->
                <div class="ai-robot-head">
                    <!-- Antenna -->
                    <div class="ai-antenna"></div>

                    <!-- Eyes -->
                    <div class="ai-eye left"></div>
                    <div class="ai-eye right"></div>
                </div>

                <!-- Robot body -->
                <div class="ai-robot-body"></div>

                <!-- Speech bubble -->
                <div class="speech-bubble"></div>
            `;

            return companion;
        }

        startDialogueRotation() {
            // Rotate dialogues every 8 seconds
            setInterval(() => {
                this.updateDialogues();
            }, 8000);

            // Initial dialogue
            setTimeout(() => this.updateDialogues(), 2000);
        }

        updateDialogues() {
            const characters = document.querySelectorAll('[data-character]');

            characters.forEach(char => {
                const type = char.getAttribute('data-character');
                const bubble = char.querySelector('.speech-bubble');

                if (bubble && this.dialogues[type]) {
                    const index = this.currentDialogueIndex[type];
                    const dialogue = this.dialogues[type][index];

                    bubble.textContent = dialogue;

                    // Update index
                    this.currentDialogueIndex[type] =
                        (index + 1) % this.dialogues[type].length;
                }
            });
        }

        addInteractivity() {
            const characters = document.querySelectorAll('.ai-companion-realistic, .human-realistic');

            characters.forEach(char => {
                char.addEventListener('mouseenter', () => {
                    char.style.transform = 'scale(1.1)';
                    char.style.zIndex = '100';

                    const bubble = char.querySelector('.speech-bubble');
                    if (bubble) {
                        bubble.style.opacity = '1';
                        bubble.style.animation = 'none';
                    }
                });

                char.addEventListener('mouseleave', () => {
                    char.style.transform = '';
                    char.style.zIndex = '';

                    const bubble = char.querySelector('.speech-bubble');
                    if (bubble) {
                        bubble.style.opacity = '';
                        bubble.style.animation = '';
                    }
                });

                char.addEventListener('click', () => {
                    const name = char.getAttribute('data-ai-name') || 'Kullanıcı';
                    console.log(`👤 ${name} tıklandı`);

                    // Trigger special animation
                    this.triggerSpecialAnimation(char);
                });
            });
        }

        triggerSpecialAnimation(character) {
            character.classList.add('special-active');

            // Create energy ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(16, 163, 127, 0.6), transparent);
                pointer-events: none;
                animation: ripple-expand 1s ease-out forwards;
            `;

            character.appendChild(ripple);

            setTimeout(() => {
                character.classList.remove('special-active');
                ripple.remove();
            }, 1000);
        }
    }

    /**
     * Typewriter Integration for Realistic Hero
     */
    class TypewriterRealistic {
        constructor(element, texts, speed = 100) {
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

            let typeSpeed = this.isDeleting ? 50 : this.speed;

            if (!this.isDeleting && this.charIndex === currentText.length) {
                typeSpeed = 2000;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                typeSpeed = 500;
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
     * Initialize Realistic Hero
     */
    function initRealisticHero() {
        // Initialize character manager
        const characterManager = new RealisticCharacterManager();

        // Initialize typewriter if element exists
        const typewriterElement = document.getElementById('typewriter-realistic');
        if (typewriterElement) {
            const texts = [
                'Yapay Zeka ile Tanışın',
                'Gerçek İnsanlar, Gerçek Sonuçlar',
                'AI Yardımcılarınız Her Zaman Yanınızda',
                'Verimliliğinizi Artırın',
                'Geleceği Şekillendirin',
                'AiLydian ile Dönüşün'
            ];

            const typewriter = new TypewriterRealistic(typewriterElement, texts, 100);
            typewriter.start();
        }

        // Add ripple animation keyframe
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple-expand {
                from {
                    width: 20px;
                    height: 20px;
                    opacity: 1;
                }
                to {
                    width: 200px;
                    height: 200px;
                    opacity: 0;
                }
            }

            .special-active {
                animation: character-pulse 0.5s ease-out !important;
            }

            @keyframes character-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
        `;
        document.head.appendChild(style);

        console.log('🎬 Realistic Hero System initialized');

        // Store globally
        window.ailydianRealistic = {
            characterManager,
            typewriter: typewriterElement ? true : false
        };
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRealisticHero);
    } else {
        initRealisticHero();
    }

})();
