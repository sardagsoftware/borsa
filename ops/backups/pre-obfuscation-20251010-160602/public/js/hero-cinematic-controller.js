/**
 * 🎬 AiLydian Cinematic Hero Controller
 * "The AI Revolution" - Short Film Interactive Experience
 * Version: 2.0.0 CINEMATIC
 * Date: 2025-10-07
 *
 * Features:
 * - 6 cinematic scenes with auto-progression
 * - Character animations and interactions
 * - Scene timeline control
 * - Performance optimization
 * - Accessibility support
 */

(function() {
    'use strict';

    /**
     * Cinematic Scene Manager
     */
    class CinematicSceneManager {
        constructor() {
            this.scenes = [
                {
                    id: 'morning',
                    duration: 7000,
                    name: 'Morning Struggle'
                },
                {
                    id: 'ai-arrival',
                    duration: 8000,
                    name: 'AI Companions Arrive'
                },
                {
                    id: 'collaboration',
                    duration: 7000,
                    name: 'Collaboration'
                },
                {
                    id: 'transformation',
                    duration: 6000,
                    name: 'Transformation'
                },
                {
                    id: 'ecosystem',
                    duration: 7000,
                    name: 'Ecosystem View'
                },
                {
                    id: 'cta',
                    duration: 10000,
                    name: 'Call to Action'
                }
            ];

            this.currentSceneIndex = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.sceneTimer = null;
            this.totalDuration = this.scenes.reduce((sum, scene) => sum + scene.duration, 0);

            this.init();
        }

        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.createHeroStructure();
            this.createTimelineIndicator();
            this.attachEventListeners();

            // Auto-start after 1 second
            setTimeout(() => this.play(), 1000);
        }

        createHeroStructure() {
            const hero = document.querySelector('.hero');
            if (!hero) return;

            // Add cinematic class
            hero.classList.add('hero-cinematic');

            // Create letterbox bars
            const letterboxTop = document.createElement('div');
            letterboxTop.className = 'letterbox letterbox-top';

            const letterboxBottom = document.createElement('div');
            letterboxBottom.className = 'letterbox letterbox-bottom';

            document.body.appendChild(letterboxTop);
            document.body.appendChild(letterboxBottom);

            // Create scenes
            this.scenes.forEach((scene, index) => {
                const sceneElement = this.createScene(scene.id, index);
                hero.appendChild(sceneElement);
            });
        }

        createScene(sceneId, index) {
            const scene = document.createElement('div');
            scene.className = `film-scene scene-${sceneId}`;
            scene.setAttribute('data-scene-index', index);
            scene.setAttribute('data-scene-id', sceneId);

            // Add scene-specific content
            switch(sceneId) {
                case 'morning':
                    scene.innerHTML = this.getMorningSceneContent();
                    break;
                case 'ai-arrival':
                    scene.innerHTML = this.getAIArrivalSceneContent();
                    break;
                case 'collaboration':
                    scene.innerHTML = this.getCollaborationSceneContent();
                    break;
                case 'transformation':
                    scene.innerHTML = this.getTransformationSceneContent();
                    break;
                case 'ecosystem':
                    scene.innerHTML = this.getEcosystemSceneContent();
                    break;
                case 'cta':
                    scene.innerHTML = this.getCTASceneContent();
                    break;
            }

            return scene;
        }

        getMorningSceneContent() {
            return `
                <div class="human-character">
                    <div class="human-silhouette"></div>
                    <div class="desk-papers"></div>
                </div>
                <div class="stress-bubble" style="top: 20%; left: 10%;"></div>
                <div class="stress-bubble" style="top: 40%; right: 15%;"></div>
                <div class="stress-bubble" style="top: 60%; left: 20%;"></div>
            `;
        }

        getAIArrivalSceneContent() {
            return `
                <div class="ai-portal"></div>

                <div class="ai-companion ai-legal">
                    <div class="ai-body"></div>
                    <div class="ai-label">Legal AI</div>
                </div>

                <div class="ai-companion ai-medical">
                    <div class="ai-body"></div>
                    <div class="ai-label">Medical AI</div>
                </div>

                <div class="ai-companion ai-code">
                    <div class="ai-body"></div>
                    <div class="ai-label">Code AI</div>
                </div>

                <div class="ai-companion ai-analytics">
                    <div class="ai-body"></div>
                    <div class="ai-label">Analytics AI</div>
                </div>

                <div class="ai-companion ai-voice">
                    <div class="ai-body"></div>
                    <div class="ai-label">Voice AI</div>
                </div>

                <div class="ai-companion ai-video">
                    <div class="ai-body"></div>
                    <div class="ai-label">Video AI</div>
                </div>
            `;
        }

        getCollaborationSceneContent() {
            return `
                <div class="hologram-workspace">
                    <div class="floating-element"></div>
                    <div class="floating-element"></div>
                    <div class="floating-element"></div>
                </div>

                ${this.createDataConnections(6)}
            `;
        }

        createDataConnections(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                const angle = (360 / count) * i;
                const x = 50 + 40 * Math.cos(angle * Math.PI / 180);
                const y = 50 + 40 * Math.sin(angle * Math.PI / 180);

                html += `
                    <div class="data-connection"
                         style="
                            left: 50%;
                            top: 50%;
                            transform: rotate(${angle}deg);
                            animation-delay: ${i * 0.3}s;
                         "></div>
                `;
            }
            return html;
        }

        getTransformationSceneContent() {
            return `
                <div class="energy-burst"></div>
                ${this.createSuccessParticles(30)}
            `;
        }

        createSuccessParticles(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                const x = Math.random() * 100;
                const delay = Math.random() * 3;
                html += `
                    <div class="success-particle"
                         style="
                            left: ${x}%;
                            bottom: 0;
                            animation-delay: ${delay}s;
                         "></div>
                `;
            }
            return html;
        }

        getEcosystemSceneContent() {
            return `
                <div class="ecosystem-orbit"></div>
                <div class="ecosystem-orbit" style="
                    width: 400px;
                    height: 400px;
                    animation-duration: 15s;
                    animation-direction: reverse;
                "></div>
                <div class="ecosystem-orbit" style="
                    width: 800px;
                    height: 800px;
                    animation-duration: 25s;
                "></div>
            `;
        }

        getCTASceneContent() {
            return `
                <div class="cta-text">AiLydian ile Geleceği Şekillendir</div>
                <button class="cta-button" onclick="window.location.href='/dashboard.html'">
                    Hemen Başla
                </button>
            `;
        }

        createTimelineIndicator() {
            const timeline = document.createElement('div');
            timeline.className = 'timeline-indicator';

            this.scenes.forEach((scene, index) => {
                const dot = document.createElement('div');
                dot.className = 'timeline-dot';
                dot.setAttribute('data-scene-index', index);
                dot.setAttribute('title', scene.name);

                dot.addEventListener('click', () => this.goToScene(index));

                timeline.appendChild(dot);
            });

            const hero = document.querySelector('.hero-cinematic');
            if (hero) {
                hero.appendChild(timeline);
            }

            this.timelineDots = Array.from(timeline.children);
        }

        attachEventListeners() {
            // Play/Pause on spacebar
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && !this.isInputFocused()) {
                    e.preventDefault();
                    this.togglePlayPause();
                }
            });

            // Next scene on right arrow
            document.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowRight' && !this.isInputFocused()) {
                    e.preventDefault();
                    this.nextScene();
                }
            });

            // Previous scene on left arrow
            document.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowLeft' && !this.isInputFocused()) {
                    e.preventDefault();
                    this.previousScene();
                }
            });

            // Pause on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.isPlaying) {
                    this.pause();
                } else if (!document.hidden && this.isPaused) {
                    this.play();
                }
            });
        }

        isInputFocused() {
            const activeElement = document.activeElement;
            return activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );
        }

        play() {
            this.isPlaying = true;
            this.isPaused = false;
            this.showScene(this.currentSceneIndex);
        }

        pause() {
            this.isPlaying = false;
            this.isPaused = true;
            if (this.sceneTimer) {
                clearTimeout(this.sceneTimer);
                this.sceneTimer = null;
            }
        }

        togglePlayPause() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }

        showScene(index) {
            const scenes = document.querySelectorAll('.film-scene');

            // Remove active class from all scenes
            scenes.forEach(scene => {
                if (scene.classList.contains('active')) {
                    scene.classList.add('exiting');
                    scene.classList.remove('active');

                    setTimeout(() => {
                        scene.classList.remove('exiting');
                    }, 2000);
                }
            });

            // Activate current scene
            const currentScene = scenes[index];
            if (currentScene) {
                setTimeout(() => {
                    currentScene.classList.add('active');
                    this.onSceneActivate(index);
                }, 200);
            }

            // Update timeline
            this.updateTimeline(index);

            // Schedule next scene
            if (this.isPlaying) {
                const duration = this.scenes[index].duration;
                this.sceneTimer = setTimeout(() => {
                    this.nextScene();
                }, duration);
            }

            // Dispatch custom event
            const event = new CustomEvent('scene-change', {
                detail: {
                    sceneIndex: index,
                    sceneName: this.scenes[index].name
                }
            });
            document.dispatchEvent(event);
        }

        onSceneActivate(index) {
            const sceneId = this.scenes[index].id;

            // Trigger scene-specific animations
            switch(sceneId) {
                case 'ai-arrival':
                    setTimeout(() => {
                        const portal = document.querySelector('.ai-portal');
                        if (portal) portal.classList.add('active');
                    }, 500);
                    break;

                case 'transformation':
                    setTimeout(() => {
                        const burst = document.querySelector('.energy-burst');
                        if (burst) burst.style.opacity = '1';
                    }, 1000);
                    break;
            }
        }

        updateTimeline(index) {
            this.timelineDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        nextScene() {
            if (this.sceneTimer) {
                clearTimeout(this.sceneTimer);
            }

            this.currentSceneIndex = (this.currentSceneIndex + 1) % this.scenes.length;

            // Loop back to start
            if (this.currentSceneIndex === 0) {
                console.log('🔄 Film restarting...');
            }

            this.showScene(this.currentSceneIndex);
        }

        previousScene() {
            if (this.sceneTimer) {
                clearTimeout(this.sceneTimer);
            }

            this.currentSceneIndex = this.currentSceneIndex - 1;
            if (this.currentSceneIndex < 0) {
                this.currentSceneIndex = this.scenes.length - 1;
            }

            this.showScene(this.currentSceneIndex);
        }

        goToScene(index) {
            if (this.sceneTimer) {
                clearTimeout(this.sceneTimer);
            }

            this.currentSceneIndex = index;
            this.showScene(this.currentSceneIndex);
        }

        destroy() {
            if (this.sceneTimer) {
                clearTimeout(this.sceneTimer);
            }
            this.isPlaying = false;
        }
    }

    /**
     * Performance Monitor for Cinematic Experience
     */
    class CinematicPerformanceMonitor {
        constructor() {
            this.isLowPerformance = false;
            this.init();
        }

        init() {
            // Check device capabilities
            this.checkDeviceMemory();
            this.checkConnection();
            this.monitorFPS();
        }

        checkDeviceMemory() {
            if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
                this.enableLowPerformanceMode();
            }
        }

        checkConnection() {
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

                if (connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
                    this.enableLowPerformanceMode();
                }
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

                    if (fps < 24) {
                        lowFPSCount++;

                        if (lowFPSCount >= 3 && !this.isLowPerformance) {
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

        enableLowPerformanceMode() {
            this.isLowPerformance = true;
            console.log('⚡ Cinematic low performance mode enabled');

            document.body.classList.add('low-performance-cinematic');

            // Reduce particle count
            const particles = document.querySelectorAll('.success-particle');
            particles.forEach((particle, index) => {
                if (index > 15) {
                    particle.style.display = 'none';
                }
            });
        }
    }

    /**
     * Initialize Cinematic Experience
     */
    function initCinematicHero() {
        // Only initialize if hero-cinematic CSS is loaded
        const hasNewHero = document.querySelector('.hero');

        if (!hasNewHero) {
            console.log('ℹ️  Hero section not found, skipping cinematic initialization');
            return;
        }

        // Initialize managers
        const sceneManager = new CinematicSceneManager();
        const performanceMonitor = new CinematicPerformanceMonitor();

        // Listen for scene changes
        document.addEventListener('scene-change', (event) => {
            console.log(`🎬 Scene: ${event.detail.sceneName}`);
        });

        console.log('🎬 AiLydian Cinematic Hero initialized');
        console.log('   Controls: Space = Play/Pause, Arrow Keys = Navigate');

        // Store globally for debugging
        window.ailydianCinematic = {
            sceneManager,
            performanceMonitor
        };
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCinematicHero);
    } else {
        initCinematicHero();
    }

})();
