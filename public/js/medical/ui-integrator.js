/**
 * UI INTEGRATOR - Medical LyDian 2025
 * Integrates advanced image manager with medical-expert.html
 */

class MedicalUIIntegrator {
    constructor() {
        this.manager = window.medicalImageManager;
        this.init();
    }

    init() {
        console.log('🎨 Medical UI Integrator initializing...');

        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.injectReturnButton();
        this.injectSearchInterface();
        this.injectStatsDashboard();
        this.setupEventHandlers();

        console.log('✅ Medical UI Integrator ready');
    }

    /**
     * Inject prominent "Return to Upload" button
     */
    injectReturnButton() {
        // Check if already exists
        if (document.getElementById('return-to-upload-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'return-to-upload-btn';
        button.className = 'return-to-upload-btn';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload New Image</span>
        `;

        button.addEventListener('click', () => {
            this.returnToUpload();
        });

        // Insert button into input actions area (next to Submit button)
        const inputActions = document.querySelector('.input-actions');
        if (inputActions) {
            inputActions.appendChild(button);
            console.log('✅ Return button injected next to Submit button');
        } else {
            // Fallback: append to body if input-actions not found
            document.body.appendChild(button);
            console.log('⚠️ Return button injected to body (fallback)');
        }
    }

    /**
     * Return to upload screen
     */
    returnToUpload() {
        this.manager.logAudit('UI_NAVIGATION', 'Return to upload clicked');

        // Scroll to upload area
        const uploadZone = document.querySelector('.medical-upload-zone');
        if (uploadZone) {
            uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add highlight effect
            uploadZone.style.animation = 'highlightPulse 2s ease-in-out';
            setTimeout(() => {
                uploadZone.style.animation = '';
            }, 2000);
        }

        // Clear results if requested
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer && confirm('Sonuçları temizleyip yeni yükleme yapmak ister misiniz?')) {
            resultsContainer.innerHTML = '';
            this.manager.logAudit('UI_ACTION', 'Results cleared for new upload');
        }
    }

    /**
     * Inject medical image search interface
     */
    injectSearchInterface() {
        // Check if results container exists
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            return;
        }

        // Check if already exists
        if (document.getElementById('medical-search-ui')) {
            return;
        }

        const searchUI = document.createElement('div');
        searchUI.id = 'medical-search-ui';
        searchUI.className = 'medical-search-container';
        searchUI.style.display = 'none'; // Hidden by default

        searchUI.innerHTML = `
            <div class="search-header">
                <div class="search-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div>
                    <h2 class="search-title">Medikal Görüntü Arama</h2>
                    <p class="search-subtitle">Doğal dil ile görüntülerinizi arayın</p>
                </div>
            </div>

            <div class="doctor-query-section">
                <div class="query-input-wrapper">
                    <input
                        type="text"
                        id="doctor-query-input"
                        class="doctor-query-input"
                        placeholder="Örn: 'Göğüs röntgeni, pnömoni bulguları' veya 'Beyin MRI, tümör analizi'"
                    />
                    <button class="query-submit-btn" id="query-submit-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                <div class="nlp-suggestions">
                    <div class="suggestion-chip" data-query="chest x-ray">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Göğüs Röntgeni</span>
                    </div>
                    <div class="suggestion-chip" data-query="brain mri">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Beyin MRI</span>
                    </div>
                    <div class="suggestion-chip" data-query="ct scan abdomen">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Karın BT</span>
                    </div>
                </div>
            </div>

            <div class="search-results-container" id="search-results" style="display: none;">
                <div class="results-header">
                    <div class="results-count">
                        <span class="results-count-number">0</span> sonuç bulundu
                    </div>
                    <select class="sort-dropdown" id="sort-dropdown">
                        <option value="score">Eşleşme Skoru</option>
                        <option value="date">Yüklenme Tarihi</option>
                        <option value="name">Dosya Adı</option>
                    </select>
                </div>
                <div class="medical-image-gallery" id="image-gallery"></div>
            </div>
        `;

        resultsContainer.parentNode.insertBefore(searchUI, resultsContainer);

        // Setup search event handlers
        this.setupSearchHandlers();

        console.log('✅ Search interface injected');
    }

    /**
     * Setup search event handlers
     */
    setupSearchHandlers() {
        const queryInput = document.getElementById('doctor-query-input');
        const submitBtn = document.getElementById('query-submit-btn');
        const suggestionChips = document.querySelectorAll('.suggestion-chip');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const query = queryInput.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            });
        }

        if (queryInput) {
            queryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = queryInput.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
        }

        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                queryInput.value = query;
                this.performSearch(query);
            });
        });
    }

    /**
     * Perform medical image search
     */
    async performSearch(query) {
        console.log('🔍 Performing search:', query);

        const searchUI = document.getElementById('medical-search-ui');
        if (searchUI) {
            searchUI.style.display = 'block';
        }

        // Show loading
        this.showLoading('Görüntüler aranıyor...');

        try {
            const results = await this.manager.processQuery(query);

            this.hideLoading();

            // Display results
            this.displaySearchResults(results);

        } catch (error) {
            this.hideLoading();
            console.error('Search error:', error);
            this.showError('Arama sırasında bir hata oluştu');
        }
    }

    /**
     * Display search results
     */
    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        const gallery = document.getElementById('image-gallery');
        const countNumber = document.querySelector('.results-count-number');

        if (!resultsContainer || !gallery || !countNumber) {
            return;
        }

        resultsContainer.style.display = 'block';
        countNumber.textContent = results.matchingImages.length;

        // Clear previous results
        gallery.innerHTML = '';

        if (results.matchingImages.length === 0) {
            gallery.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                    <p style="font-size: 1.125rem; font-weight: 600;">Eşleşen görüntü bulunamadı</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Farklı arama terimleri deneyin</p>
                </div>
            `;
            return;
        }

        // Render image cards
        results.matchingImages.forEach((match, index) => {
            const card = this.createImageCard(match, index);
            gallery.appendChild(card);
        });
    }

    /**
     * Create image card element
     */
    createImageCard(match, index) {
        const { imageData, score, matchReason } = match;

        const card = document.createElement('div');
        card.className = 'image-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const scorePercent = Math.min(100, score);

        card.innerHTML = `
            <div class="image-card-header">
                <img src="${imageData.url}" alt="${imageData.fileName}" class="image-card-img" />
                <div class="image-card-badge">${scorePercent}% eşleşme</div>
            </div>
            <div class="image-card-body">
                <h3 class="image-card-title">${imageData.fileName}</h3>
                <div class="image-card-meta">
                    <div class="meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>${new Date(imageData.uploadDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div class="meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>${imageData.analysisCount || 0} analiz</span>
                    </div>
                </div>
                <div class="match-score">
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${scorePercent}%"></div>
                    </div>
                    <div class="score-label">
                        <span>Eşleşme</span>
                        <span class="score-percent">${scorePercent}%</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.showImageDetails(imageData);
        });

        return card;
    }

    /**
     * Show image details modal
     */
    showImageDetails(imageData) {
        this.manager.logAudit('UI_INTERACTION', 'Image details viewed', {
            imageId: imageData.id
        });

        alert(`Görüntü Detayları:\n\nDosya: ${imageData.fileName}\nBoyut: ${(imageData.fileSize / 1024).toFixed(2)} KB\nYüklenme: ${new Date(imageData.uploadDate).toLocaleString('tr-TR')}\nAnaliz Sayısı: ${imageData.analysisCount || 0}`);
    }

    /**
     * Inject statistics dashboard
     */
    injectStatsDashboard() {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer || document.getElementById('stats-dashboard')) {
            return;
        }

        const stats = this.manager.getStatistics();

        const dashboard = document.createElement('div');
        dashboard.id = 'stats-dashboard';
        dashboard.className = 'statistics-dashboard';
        dashboard.style.display = 'none'; // Hidden by default

        dashboard.innerHTML = `
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin-bottom: 1.5rem;">
                İstatistikler
            </h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="stat-label">Toplam Görüntü</div>
                    <div class="stat-value">${stats.totalImages}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div class="stat-label">Toplam Analiz</div>
                    <div class="stat-value">${stats.totalAnalyses}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-label">Aktif Oturum</div>
                    <div class="stat-value" style="font-size: 1rem;">${stats.currentSession.substring(0, 12)}...</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div class="stat-label">Audit Kayıtları</div>
                    <div class="stat-value">${stats.auditLogEntries}</div>
                </div>
            </div>
        `;

        resultsContainer.parentNode.insertBefore(dashboard, resultsContainer);

        console.log('✅ Stats dashboard injected');
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Show search and stats after first upload
        document.addEventListener('medicalImageUploaded', (e) => {
            const searchUI = document.getElementById('medical-search-ui');
            const statsUI = document.getElementById('stats-dashboard');

            if (searchUI) searchUI.style.display = 'block';
            if (statsUI) statsUI.style.display = 'block';
        });

        // Update stats after analysis
        document.addEventListener('medicalAnalysisComplete', () => {
            this.updateStatsDashboard();
        });
    }

    /**
     * Update statistics dashboard
     */
    updateStatsDashboard() {
        const dashboard = document.getElementById('stats-dashboard');
        if (!dashboard) return;

        const stats = this.manager.getStatistics();

        const statValues = dashboard.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            statValues[0].textContent = stats.totalImages;
            statValues[1].textContent = stats.totalAnalyses;
            statValues[3].textContent = stats.auditLogEntries;
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Yükleniyor...') {
        let overlay = document.getElementById('loading-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;

        overlay.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert('Hata: ' + message);
    }
}

// Initialize when DOM is ready
if (typeof window.medicalImageManager !== 'undefined') {
    window.medicalUIIntegrator = new MedicalUIIntegrator();
} else {
    console.warn('⚠️  medicalImageManager not found, waiting...');
    window.addEventListener('load', () => {
        if (typeof window.medicalImageManager !== 'undefined') {
            window.medicalUIIntegrator = new MedicalUIIntegrator();
        }
    });
}
