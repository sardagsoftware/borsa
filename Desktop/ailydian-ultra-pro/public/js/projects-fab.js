/**
 * ⚪ AILYDIAN — Subdomain Projects FAB (Premium)
 * 6 Proje: music • travel • newsai • borsa • video • blockchain
 * Floating Action Button ile Premium Grid Interface
 */

class LyDianProjectsFAB {
    constructor() {
        this.isOpen = false;
        this.projects = [
            { name: "Music", href: "https://music.ailydian.com", icon: "🎵" },
            { name: "Travel", href: "https://travel.ailydian.com", icon: "✈️" },
            { name: "NewsAI", href: "https://newsai.earth", icon: "📰" },
            { name: "Borsa", href: "https://borsa.ailydian.com", icon: "📈" },
            { name: "Video", href: "https://video.ailydian.com", icon: "🎬" },
            { name: "Blockchain", href: "https://blockchain.ailydian.com", icon: "⛓️" }
        ];
        this.init();
    }

    init() {
        this.createFAB();
        this.setupEventListeners();
        console.log('🔗 LyDian Projects FAB initialized with 6 subdomains');
    }

    createFAB() {
        // FAB Container
        const fabContainer = document.createElement('div');
        fabContainer.id = 'ailydian-projects-fab';
        fabContainer.className = 'ailydian-fab-container';
        fabContainer.innerHTML = `
            <style>
                .ailydian-fab-container {
                    position: fixed;
                    right: 20px;
                    bottom: calc(env(safe-area-inset-bottom) + 88px);
                    z-index: 1000;
                    font-family: var(--font-chatgpt), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                @media (min-width: 768px) {
                    .ailydian-fab-container {
                        bottom: 24px;
                    }
                }

                .ailydian-fab-trigger {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: radial-gradient(120px 120px at 70% 30%, rgba(108, 231, 218, 0.45), transparent);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .ailydian-fab-trigger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                    background: radial-gradient(120px 120px at 70% 30%, rgba(108, 231, 218, 0.6), transparent);
                }

                .ailydian-fab-trigger.active {
                    transform: rotate(45deg);
                }

                .ailydian-fab-icon {
                    font-size: 24px;
                    color: var(--asana-green-primary, #0d7377);
                    transition: all 0.3s ease;
                }

                .ailydian-fab-projects {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 320px;
                    max-width: 92vw;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 16px;
                    backdrop-filter: blur(20px);
                    padding: 16px;
                    transform: translateY(20px) scale(0.9);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                }

                .ailydian-fab-projects.show {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                    visibility: visible;
                }

                .ailydian-fab-header {
                    font-size: 12px;
                    color: var(--asana-green-primary, #0d7377);
                    margin-bottom: 12px;
                    font-weight: 500;
                    opacity: 0.8;
                }

                .ailydian-fab-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }

                @media (min-width: 480px) {
                    .ailydian-fab-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                .ailydian-fab-project {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(108, 231, 218, 0.08);
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.2s ease;
                    min-height: 60px;
                }

                .ailydian-fab-project:hover {
                    background: rgba(108, 231, 218, 0.15);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .ailydian-fab-project-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: rgba(108, 231, 218, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .ailydian-fab-project-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary, #333);
                    line-height: 1.2;
                }

                /* Mobile optimizations */
                @media (max-width: 480px) {
                    .ailydian-fab-projects {
                        width: calc(100vw - 40px);
                        right: -10px;
                    }

                    .ailydian-fab-project {
                        gap: 8px;
                        padding: 10px;
                    }

                    .ailydian-fab-project-icon {
                        width: 32px;
                        height: 32px;
                        font-size: 16px;
                    }

                    .ailydian-fab-project-name {
                        font-size: 12px;
                    }
                }

                /* Accessibility */
                .ailydian-fab-trigger:focus {
                    outline: 2px solid var(--asana-green-primary, #0d7377);
                    outline-offset: 2px;
                }

                .ailydian-fab-project:focus {
                    outline: 2px solid var(--asana-green-primary, #0d7377);
                    outline-offset: 2px;
                }
            </style>

            <button class="ailydian-fab-trigger" aria-label="LyDian Subprojects" tabindex="0">
                <div class="ailydian-fab-icon">+</div>
            </button>

            <div class="ailydian-fab-projects">
                <div class="ailydian-fab-header">LyDian Projeleri</div>
                <div class="ailydian-fab-grid">
                    ${this.projects.map(project => `
                        <a href="${project.href}"
                           target="_blank"
                           rel="noopener noreferrer"
                           class="ailydian-fab-project"
                           data-project="${project.name.toLowerCase()}">
                            <div class="ailydian-fab-project-icon">${project.icon}</div>
                            <div class="ailydian-fab-project-name">${project.name}</div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(fabContainer);
        this.fabContainer = fabContainer;
        this.fabTrigger = fabContainer.querySelector('.ailydian-fab-trigger');
        this.fabProjects = fabContainer.querySelector('.ailydian-fab-projects');
        this.fabIcon = fabContainer.querySelector('.ailydian-fab-icon');
    }

    setupEventListeners() {
        // FAB Trigger Click
        this.fabTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // Keyboard support
        this.fabTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.fabContainer.contains(e.target)) {
                this.close();
            }
        });

        // Project click tracking
        this.fabProjects.addEventListener('click', (e) => {
            const projectLink = e.target.closest('.ailydian-fab-project');
            if (projectLink) {
                const projectName = projectLink.dataset.project;
                console.log(`🔗 Navigating to LyDian ${projectName} subdomain`);

                // Analytics tracking (placeholder)
                if (window.gtag) {
                    window.gtag('event', 'subdomain_navigation', {
                        project_name: projectName,
                        destination_url: projectLink.href
                    });
                }

                // Close FAB after click
                setTimeout(() => this.close(), 150);
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.fabTrigger.classList.add('active');
        this.fabProjects.classList.add('show');
        this.fabIcon.textContent = '×';
        this.fabIcon.style.fontSize = '28px';

        // Focus management
        setTimeout(() => {
            const firstProject = this.fabProjects.querySelector('.ailydian-fab-project');
            if (firstProject) {
                firstProject.focus();
            }
        }, 300);

        console.log('🔗 LyDian Projects FAB opened');
    }

    close() {
        this.isOpen = false;
        this.fabTrigger.classList.remove('active');
        this.fabProjects.classList.remove('show');
        this.fabIcon.textContent = '+';
        this.fabIcon.style.fontSize = '24px';

        console.log('🔗 LyDian Projects FAB closed');
    }

    // Public methods for external control
    destroy() {
        if (this.fabContainer) {
            this.fabContainer.remove();
        }
        console.log('🔗 LyDian Projects FAB destroyed');
    }

    updateProjects(newProjects) {
        if (Array.isArray(newProjects)) {
            this.projects = newProjects;
            this.createFAB();
            console.log('🔗 LyDian Projects FAB updated with new projects');
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ailydianProjectsFAB = new LyDianProjectsFAB();
    });
} else {
    window.ailydianProjectsFAB = new LyDianProjectsFAB();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LyDianProjectsFAB;
}