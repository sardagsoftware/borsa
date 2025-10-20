/**
 * AiLydian Search Animation SVG Icons
 * Benzersiz AiLydian temalı arama animasyonları
 * Çilek kırmızısı ve AiLydian mavi tonları
 */

class AiLydianSearchAnimation {
    constructor() {
        this.isSearching = false;
        this.currentAnimation = null;
        this.searchContainer = null;
    }

    // Temel AiLydian SVG çilek kırmızısı - mavi tonları
    createSearchIcon() {
        return `
            <svg class="ailydian-search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="ailydianGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF4757;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#3742FA;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#2F3542;stop-opacity:1" />
                    </linearGradient>
                    <filter id="ailydianGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <circle class="search-circle" cx="11" cy="11" r="8" stroke="url(#ailydianGradient)" stroke-width="2" fill="none"/>
                <path class="search-handle" d="m21 21-4.35-4.35" stroke="url(#ailydianGradient)" stroke-width="2" stroke-linecap="round"/>
                <circle class="search-pulse" cx="11" cy="11" r="4" fill="url(#ailydianGradient)" opacity="0.3"/>
            </svg>
        `;
    }

    // AiLydian "A" harfi dönen arama ikonu
    createAiLydianAIcon() {
        return `
            <svg class="ailydian-a-search" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF4757;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#3742FA;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <g class="rotating-a">
                    <path d="M16 4L24 28H20L18.5 24H13.5L12 28H8L16 4Z" fill="url(#aiGradient)"/>
                    <path d="M14.5 20H17.5L16 16L14.5 20Z" fill="white"/>
                </g>
                <circle class="search-ring" cx="16" cy="16" r="12" stroke="url(#aiGradient)" stroke-width="2" fill="none" opacity="0.5"/>
            </svg>
        `;
    }

    // Çoklu dalgalar - AiLydian beyin dalgası efekti
    createBrainWaveSearch() {
        return `
            <svg class="ailydian-brain-wave" width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#FF4757;stop-opacity:0.8" />
                        <stop offset="50%" style="stop-color:#3742FA;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#FF4757;stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                <path class="wave wave-1" d="M0 12 Q5 8 10 12 T20 12 T30 12 T40 12" stroke="url(#waveGradient)" stroke-width="2" fill="none"/>
                <path class="wave wave-2" d="M0 16 Q5 12 10 16 T20 16 T30 16 T40 16" stroke="url(#waveGradient)" stroke-width="2" fill="none" opacity="0.7"/>
                <path class="wave wave-3" d="M0 8 Q5 4 10 8 T20 8 T30 8 T40 8" stroke="url(#waveGradient)" stroke-width="2" fill="none" opacity="0.5"/>
            </svg>
        `;
    }

    // AiLydian DNA heliks arama animasyonu
    createDNAHelixSearch() {
        return `
            <svg class="ailydian-dna-search" width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF4757;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#3742FA;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#2F3542;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <g class="dna-helix">
                    <path class="helix-strand-1" d="M6 4 Q12 8 18 12 Q12 16 6 20 Q12 24 18 28" stroke="url(#dnaGradient)" stroke-width="2" fill="none"/>
                    <path class="helix-strand-2" d="M18 4 Q12 8 6 12 Q12 16 18 20 Q12 24 6 28" stroke="url(#dnaGradient)" stroke-width="2" fill="none"/>
                    <circle class="dna-node" cx="12" cy="8" r="2" fill="url(#dnaGradient)"/>
                    <circle class="dna-node" cx="12" cy="16" r="2" fill="url(#dnaGradient)"/>
                    <circle class="dna-node" cx="12" cy="24" r="2" fill="url(#dnaGradient)"/>
                </g>
            </svg>
        `;
    }

    // Dinamik CSS animasyonları
    createAnimationStyles() {
        return `
            <style>
                .ailydian-search-icon {
                    animation: ailydianSearchPulse 2s infinite ease-in-out;
                }

                .search-circle {
                    animation: ailydianRotate 3s linear infinite;
                    transform-origin: center;
                }

                .search-pulse {
                    animation: ailydianPulse 1.5s ease-in-out infinite;
                }

                .ailydian-a-search .rotating-a {
                    animation: ailydianRotate 2s linear infinite;
                    transform-origin: 16px 16px;
                }

                .search-ring {
                    animation: ailydianRingPulse 2s ease-in-out infinite;
                }

                .ailydian-brain-wave .wave {
                    animation: ailydianWaveFlow 2s ease-in-out infinite;
                }

                .wave-1 { animation-delay: 0s; }
                .wave-2 { animation-delay: 0.3s; }
                .wave-3 { animation-delay: 0.6s; }

                .ailydian-dna-search .dna-helix {
                    animation: ailydianDNARotate 3s linear infinite;
                    transform-origin: 12px 16px;
                }

                .dna-node {
                    animation: ailydianNodePulse 1s ease-in-out infinite;
                }

                /* Keyframe Animasyonları */
                @keyframes ailydianSearchPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }

                @keyframes ailydianRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes ailydianPulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.2); }
                }

                @keyframes ailydianRingPulse {
                    0%, 100% { stroke-width: 2; opacity: 0.5; }
                    50% { stroke-width: 4; opacity: 1; }
                }

                @keyframes ailydianWaveFlow {
                    0% { transform: translateX(-10px); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(10px); opacity: 0; }
                }

                @keyframes ailydianDNARotate {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }

                @keyframes ailydianNodePulse {
                    0%, 100% { r: 2; opacity: 1; }
                    50% { r: 3; opacity: 0.7; }
                }

                /* Hover Efektleri */
                .ailydian-search-icon:hover {
                    animation-duration: 1s;
                    filter: drop-shadow(0 0 10px #FF4757);
                }

                .ailydian-a-search:hover .rotating-a {
                    animation-duration: 1s;
                }

                .ailydian-brain-wave:hover .wave {
                    animation-duration: 1s;
                }

                .ailydian-dna-search:hover .dna-helix {
                    animation-duration: 1.5s;
                }

                /* Responsif tasarım */
                @media (max-width: 768px) {
                    .ailydian-search-icon,
                    .ailydian-a-search,
                    .ailydian-brain-wave,
                    .ailydian-dna-search {
                        width: 20px;
                        height: 20px;
                    }
                }
            </style>
        `;
    }

    // Arama başlatma
    startSearch(container, animationType = 'default') {
        this.isSearching = true;
        this.searchContainer = container;

        // Stilleri ekle
        if (!document.getElementById('ailydian-search-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'ailydian-search-styles';
            styleElement.innerHTML = this.createAnimationStyles();
            document.head.appendChild(styleElement);
        }

        // Animasyon tipine göre ikon seç
        let iconHTML;
        switch (animationType) {
            case 'a-icon':
                iconHTML = this.createAiLydianAIcon();
                break;
            case 'brain-wave':
                iconHTML = this.createBrainWaveSearch();
                break;
            case 'dna-helix':
                iconHTML = this.createDNAHelixSearch();
                break;
            default:
                iconHTML = this.createSearchIcon();
        }

        // Container'a ekle
        if (container) {
            container.innerHTML = iconHTML;
            container.classList.add('ailydian-searching');
        }

        return this;
    }

    // Arama durdurma
    stopSearch() {
        this.isSearching = false;

        if (this.searchContainer) {
            this.searchContainer.classList.remove('ailydian-searching');
            this.searchContainer.innerHTML = '';
        }

        return this;
    }

    // Arama durumu kontrolü
    isActive() {
        return this.isSearching;
    }

    // Rastgele animasyon seç
    getRandomAnimation() {
        const animations = ['default', 'a-icon', 'brain-wave', 'dna-helix'];
        return animations[Math.floor(Math.random() * animations.length)];
    }
}

// Global kullanım için
window.AiLydianSearchAnimation = AiLydianSearchAnimation;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AiLydianSearchAnimation;
}