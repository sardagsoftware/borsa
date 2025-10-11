/* ========================================
   AiLydian Knowledge Base - Interactive JavaScript
   Version: 2.1 Sardag Edition
   Features: Search, Voice Search, AI Integration, Analytics
   ======================================== */

// ========== Global Configuration ==========
const CONFIG = {
    apiBaseUrl: '/api',
    knowledgeBaseEndpoint: '/api/knowledge/search',
    aiChatEndpoint: '/api/knowledge/chat',
    defaultLanguage: 'tr',
    resultsPerPage: 20,
    searchDebounceMs: 500
};

// ========== State Management ==========
const state = {
    currentQuery: '',
    currentLanguage: 'tr',
    currentDomain: 'all',
    searchResults: [],
    totalResults: 0,
    currentPage: 1,
    isLoading: false,
    voiceRecording: false
};

// ========== DOM Elements ==========
let elements = {};

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AiLydian Knowledge Base Loading...');

    initializeElements();
    initializeEventListeners();
    animateOnScroll();
    updateTotalArticles();

    console.log('✅ Knowledge Base Ready!');
});

// ========== Initialize DOM Elements ==========
function initializeElements() {
    elements = {
        // Navigation
        navbarToggle: document.getElementById('navbarToggle'),
        navbarMenu: document.getElementById('navbarMenu'),

        // Search
        searchInput: document.getElementById('knowledgeSearch'),
        searchBtn: document.getElementById('searchBtn'),
        voiceSearchBtn: document.getElementById('voiceSearchBtn'),
        languageFilter: document.getElementById('languageFilter'),
        domainFilter: document.getElementById('domainFilter'),
        advancedFilterBtn: document.getElementById('advancedFilterBtn'),

        // Results
        searchResultsSection: document.getElementById('searchResultsSection'),
        resultsGrid: document.getElementById('resultsGrid'),
        resultsCount: document.getElementById('resultsCount'),
        resultsTime: document.getElementById('resultsTime'),

        // Loading
        loadingOverlay: document.getElementById('loadingOverlay'),

        // Categories
        categoriesGrid: document.getElementById('categoriesGrid'),
        viewAllCategoriesBtn: document.getElementById('viewAllCategoriesBtn'),

        // Stats
        totalArticles: document.getElementById('totalArticles')
    };
}

// ========== Event Listeners ==========
function initializeEventListeners() {
    // Mobile Navigation Toggle
    if (elements.navbarToggle) {
        elements.navbarToggle.addEventListener('click', toggleMobileMenu);
    }

    // Search Input
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Auto-search on typing (debounced)
        let debounceTimer;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (elements.searchInput.value.length > 2) {
                    showSearchSuggestions(elements.searchInput.value);
                }
            }, CONFIG.searchDebounceMs);
        });
    }

    // Search Button
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', performSearch);
    }

    // Voice Search
    if (elements.voiceSearchBtn) {
        elements.voiceSearchBtn.addEventListener('click', toggleVoiceSearch);
    }

    // Language Filter
    if (elements.languageFilter) {
        elements.languageFilter.addEventListener('change', (e) => {
            state.currentLanguage = e.target.value;
            console.log('🌐 Language changed to:', state.currentLanguage);
            if (state.currentQuery) {
                performSearch();
            }
        });
    }

    // Domain Filter
    if (elements.domainFilter) {
        elements.domainFilter.addEventListener('change', (e) => {
            state.currentDomain = e.target.value;
            console.log('📂 Domain changed to:', state.currentDomain);
            if (state.currentQuery) {
                performSearch();
            }
        });
    }

    // Advanced Filters
    if (elements.advancedFilterBtn) {
        elements.advancedFilterBtn.addEventListener('click', showAdvancedFilters);
    }

    // View All Categories
    if (elements.viewAllCategoriesBtn) {
        elements.viewAllCategoriesBtn.addEventListener('click', showAllCategories);
    }

    // Category Cards Click Animation
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            if (category) {
                exploreCategory(category);
            }
        });
    });
}

// ========== Mobile Menu Toggle ==========
function toggleMobileMenu() {
    if (elements.navbarMenu) {
        elements.navbarMenu.classList.toggle('active');
    }
}

// ========== Search Functions ==========
async function performSearch() {
    const query = elements.searchInput?.value?.trim();

    if (!query || query.length < 2) {
        showNotification('Lütfen en az 2 karakter girin', 'warning');
        return;
    }

    state.currentQuery = query;
    state.currentPage = 1;

    console.log('🔍 Searching for:', query);

    showLoading(true);

    try {
        const startTime = performance.now();

        const response = await fetch(CONFIG.knowledgeBaseEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                language: state.currentLanguage,
                domain: state.currentDomain,
                page: state.currentPage,
                perPage: CONFIG.resultsPerPage
            })
        });

        const endTime = performance.now();
        const searchTime = ((endTime - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            throw new Error('Arama başarısız oldu');
        }

        const data = await response.json();

        state.searchResults = data.results || [];
        state.totalResults = data.totalFound || 0;

        displaySearchResults(searchTime);

        // Analytics
        trackSearch(query, state.totalResults);

    } catch (error) {
        console.error('❌ Search error:', error);
        showNotification('Arama sırasında bir hata oluştu', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== Display Search Results ==========
function displaySearchResults(searchTime) {
    if (!elements.resultsGrid) return;

    // Hide categories section
    const categoriesSection = document.getElementById('knowledgeCategories');
    if (categoriesSection) {
        categoriesSection.style.display = 'none';
    }

    // Show results section
    if (elements.searchResultsSection) {
        elements.searchResultsSection.style.display = 'block';

        // Smooth scroll with delay for better UX
        setTimeout(() => {
            elements.searchResultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    // Update results info with better formatting
    if (elements.resultsCount) {
        const countText = state.totalResults === 1
            ? '1 sonuç bulundu'
            : `${state.totalResults.toLocaleString('tr-TR')} sonuç bulundu`;
        elements.resultsCount.textContent = countText;
    }

    if (elements.resultsTime) {
        elements.resultsTime.textContent = `${searchTime}s`;
    }

    // Clear previous results
    elements.resultsGrid.innerHTML = '';

    if (state.searchResults.length === 0) {
        elements.resultsGrid.innerHTML = `
            <div class="no-results-enhanced">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Sonuç Bulunamadı</h3>
                <p>Farklı anahtar kelimeler veya filtreler deneyebilirsiniz.</p>
                <div class="no-results-actions">
                    <button onclick="clearSearch()" class="no-results-btn">
                        <i class="fas fa-redo"></i> Yeni Arama
                    </button>
                    <button onclick="backToCategories()" class="no-results-btn secondary">
                        <i class="fas fa-th"></i> Kategorileri Görüntüle
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // Display results
    state.searchResults.forEach((result, index) => {
        const resultCard = createResultCard(result, index);
        elements.resultsGrid.appendChild(resultCard);
    });

    // Add animation
    animateResults();
}

// ========== Create Result Card ==========
function createResultCard(result, index) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const relevanceScore = result.relevance || 95;
    const domain = result.domain || 'general';
    const language = result.language || state.currentLanguage;

    card.innerHTML = `
        <div class="result-header">
            <div class="result-meta">
                <span class="result-domain">${getDomainIcon(domain)} ${getDomainName(domain)}</span>
                <span class="result-language">${getLanguageFlag(language)} ${language.toUpperCase()}</span>
                <span class="result-relevance">
                    <i class="fas fa-star"></i> ${relevanceScore}% eşleşme
                </span>
            </div>
            <button class="result-bookmark" onclick="bookmarkResult(${index})">
                <i class="far fa-bookmark"></i>
            </button>
        </div>

        <h3 class="result-title">
            <a href="${result.url || '#'}" target="_blank" rel="noopener">
                ${highlightQuery(result.title || 'Başlıksız')}
            </a>
        </h3>

        <p class="result-snippet">
            ${highlightQuery(result.snippet || result.description || 'Açıklama mevcut değil.')}
        </p>

        <div class="result-footer">
            <div class="result-source">
                <i class="fas fa-link"></i>
                <a href="${result.sourceUrl || result.url || '#'}" target="_blank">
                    ${result.source || 'Wikipedia'}
                </a>
            </div>
            <div class="result-actions">
                <button onclick="shareResult(${index})" title="Paylaş">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button onclick="openWithAI(${index})" title="AI ile Aç">
                    <i class="fas fa-robot"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

// ========== Voice Search ==========
function toggleVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Tarayıcınız sesli aramayı desteklemiyor', 'warning');
        return;
    }

    if (state.voiceRecording) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = state.currentLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        state.voiceRecording = true;
        elements.voiceSearchBtn?.classList.add('recording');
        showNotification('Dinleniyor... Konuşabilirsiniz', 'info');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (elements.searchInput) {
            elements.searchInput.value = transcript;
        }
        performSearch();
    };

    recognition.onerror = (event) => {
        console.error('❌ Voice recognition error:', event.error);
        showNotification('Ses tanıma hatası', 'error');
        stopVoiceRecognition();
    };

    recognition.onend = () => {
        stopVoiceRecognition();
    };

    recognition.start();
}

function stopVoiceRecognition() {
    state.voiceRecording = false;
    elements.voiceSearchBtn?.classList.remove('recording');
}

// ========== Category Exploration ==========
window.exploreCategory = function(category) {
    console.log('📂 Exploring category:', category);

    if (elements.searchInput) {
        elements.searchInput.value = '';
    }

    if (elements.domainFilter) {
        elements.domainFilter.value = category;
    }

    state.currentDomain = category;
    state.currentQuery = getCategoryKeyword(category);

    performSearch();
};

function getCategoryKeyword(category) {
    const keywords = {
        agriculture: 'Tarım ve hayvancılık',
        space: 'Uzay ve astronomi',
        medicine: 'Tıp ve sağlık',
        climate: 'İklim değişikliği',
        technology: 'Teknoloji',
        science: 'Bilim',
        education: 'Eğitim',
        business: 'İş ve ekonomi',
        law: 'Hukuk'
    };
    return keywords[category] || category;
}

// ========== AI Chat Integration ==========
window.openAIChat = function() {
    console.log('🤖 Opening AI Chat...');

    // Store current search context
    const context = {
        query: state.currentQuery,
        domain: state.currentDomain,
        language: state.currentLanguage
    };

    localStorage.setItem('knowledgeBaseContext', JSON.stringify(context));

    // Redirect to chat page with context
    window.location.href = `/chat.html?mode=knowledge&query=${encodeURIComponent(state.currentQuery || '')}`;
};

window.openWithAI = function(resultIndex) {
    const result = state.searchResults[resultIndex];
    if (!result) return;

    console.log('🤖 Opening result with AI:', result.title);

    const context = {
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        source: result.source
    };

    localStorage.setItem('aiChatContext', JSON.stringify(context));
    window.location.href = `/chat.html?mode=knowledge&context=result`;
};

// ========== Utility Functions ==========
function showLoading(show) {
    // Global loading overlay
    if (elements.loadingOverlay) {
        if (show) {
            elements.loadingOverlay.classList.add('active');
        } else {
            elements.loadingOverlay.classList.remove('active');
        }
    }

    // Results section loading
    const resultsLoading = document.getElementById('resultsLoading');
    if (resultsLoading) {
        resultsLoading.style.display = show ? 'block' : 'none';
    }

    state.isLoading = show;
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function highlightQuery(text) {
    if (!state.currentQuery || !text) return text;

    const regex = new RegExp(`(${state.currentQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function getDomainIcon(domain) {
    const icons = {
        agriculture: '🌾',
        space: '🚀',
        medicine: '⚕️',
        climate: '🌍',
        technology: '💻',
        science: '🔬',
        education: '🎓',
        business: '💼',
        law: '⚖️',
        general: '📚'
    };
    return icons[domain] || '📚';
}

function getDomainName(domain) {
    const names = {
        agriculture: 'Tarım',
        space: 'Uzay',
        medicine: 'Tıp',
        climate: 'İklim',
        technology: 'Teknoloji',
        science: 'Bilim',
        education: 'Eğitim',
        business: 'İş',
        law: 'Hukuk',
        general: 'Genel'
    };
    return names[domain] || 'Genel';
}

function getLanguageFlag(lang) {
    const flags = {
        tr: '🇹🇷',
        en: '🇬🇧',
        ar: '🇸🇦',
        de: '🇩🇪',
        fr: '🇫🇷',
        es: '🇪🇸',
        ru: '🇷🇺',
        zh: '🇨🇳'
    };
    return flags[lang] || '🌐';
}

// ========== Advanced Filters ==========
function showAdvancedFilters() {
    showNotification('Gelişmiş filtreler yakında eklenecek', 'info');
    console.log('🔧 Advanced filters requested');
}

// ========== Show All Categories ==========
function showAllCategories() {
    showNotification('67 kategori yükleniyor...', 'info');
    console.log('📂 Loading all 67 categories');

    if (!window.KNOWLEDGE_CATEGORIES) {
        showNotification('Kategori verileri yüklenemedi', 'error');
        return;
    }

    // Clear existing categories
    if (elements.categoriesGrid) {
        elements.categoriesGrid.innerHTML = '';

        // Load all 67 categories
        window.KNOWLEDGE_CATEGORIES.forEach((category, index) => {
            const categoryCard = createCategoryCard(category, index);
            elements.categoriesGrid.appendChild(categoryCard);
        });

        // Scroll to categories
        elements.categoriesGrid.scrollIntoView({ behavior: 'smooth' });

        // Update button text
        if (elements.viewAllCategoriesBtn) {
            elements.viewAllCategoriesBtn.innerHTML = `
                <i class="fas fa-check"></i>
                Tüm 67 Kategori Yüklendi
            `;
            elements.viewAllCategoriesBtn.disabled = true;
            elements.viewAllCategoriesBtn.style.opacity = '0.7';
        }

        showNotification('Tüm kategoriler yüklendi!', 'success');
    }
}

// ========== Create Category Card ==========
function createCategoryCard(category, index) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('data-category', category.id);
    card.setAttribute('data-count', category.dataCount);
    card.style.animationDelay = `${(index % 20) * 0.05}s`;

    card.innerHTML = `
        <div class="category-icon ${category.color}">
            <span style="font-size: 2rem;">${category.icon}</span>
        </div>
        <h3 class="category-title">${category.title}</h3>
        <p class="category-description">${category.description}</p>
        <div class="category-stats">
            <span class="category-count">${category.dataCount} veri</span>
            <span class="category-sources">${category.sources.join(', ')}</span>
        </div>
        <div class="category-professions">
            ${category.professions.slice(0, 3).map(prof => `
                <span class="profession-tag">${prof}</span>
            `).join('')}
        </div>
        <button class="category-btn" onclick="exploreCategory('${category.id}')">
            <i class="fas fa-arrow-right"></i>
            Keşfet
        </button>
    `;

    // Add click handler
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('category-btn')) {
            exploreCategory(category.id);
        }
    });

    return card;
}

// ========== Bookmark Result ==========
window.bookmarkResult = function(resultIndex) {
    const result = state.searchResults[resultIndex];
    if (!result) return;

    console.log('🔖 Bookmarking:', result.title);

    // Get existing bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('knowledgeBookmarks') || '[]');

    // Check if already bookmarked
    const exists = bookmarks.find(b => b.url === result.url);

    if (exists) {
        showNotification('Bu sonuç zaten kayıtlı', 'info');
        return;
    }

    // Add bookmark
    bookmarks.push({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        domain: result.domain,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem('knowledgeBookmarks', JSON.stringify(bookmarks));
    showNotification('Kayıtlara eklendi', 'success');
};

// ========== Share Result ==========
window.shareResult = function(resultIndex) {
    const result = state.searchResults[resultIndex];
    if (!result) return;

    console.log('📤 Sharing:', result.title);

    if (navigator.share) {
        navigator.share({
            title: result.title,
            text: result.snippet,
            url: result.url
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: Copy to clipboard
        const text = `${result.title}\n${result.url}`;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Bağlantı kopyalandı', 'success');
        });
    }
};

// ========== Animate Results ==========
function animateResults() {
    const resultCards = document.querySelectorAll('.result-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.5s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    resultCards.forEach(card => observer.observe(card));
}

// ========== Scroll Animations ==========
function animateOnScroll() {
    const elements = document.querySelectorAll('.category-card, .source-card, .ai-assistant-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// ========== Update Total Articles Counter ==========
function updateTotalArticles() {
    if (!elements.totalArticles) return;

    let count = 0;
    const target = 65000000;
    const duration = 2000;
    const increment = target / (duration / 16);

    const counter = setInterval(() => {
        count += increment;
        if (count >= target) {
            count = target;
            clearInterval(counter);
        }
        elements.totalArticles.textContent = formatNumber(Math.floor(count));
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M+';
    }
    return num.toLocaleString('tr-TR');
}

// ========== Analytics ==========
function trackSearch(query, resultsCount) {
    const event = {
        type: 'search',
        query: query,
        language: state.currentLanguage,
        domain: state.currentDomain,
        resultsCount: resultsCount,
        timestamp: new Date().toISOString()
    };

    console.log('📊 Analytics:', event);

    // Store locally
    const analytics = JSON.parse(localStorage.getItem('knowledgeAnalytics') || '[]');
    analytics.push(event);

    // Keep only last 100 events
    if (analytics.length > 100) {
        analytics.shift();
    }

    localStorage.setItem('knowledgeAnalytics', JSON.stringify(analytics));
}

// ========== Search Suggestions (Auto-complete) ==========
function showSearchSuggestions(query) {
    // TODO: Implement auto-complete suggestions
    console.log('💡 Suggestions for:', query);
}

// ========== UX Enhancement Functions ==========

// Refine Search
window.refineSearch = function() {
    console.log('🔍 Refining search...');
    // Scroll back to search box
    elements.searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements.searchInput?.focus();
    showNotification('Arama kriterlerini güncelleyebilirsiniz', 'info');
};

// Sort Results
window.sortResults = function(sortBy) {
    console.log('📊 Sorting by:', sortBy);

    if (!state.searchResults || state.searchResults.length === 0) {
        return;
    }

    // Sort results
    if (sortBy === 'relevance') {
        state.searchResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    } else if (sortBy === 'date') {
        state.searchResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'title') {
        state.searchResults.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Re-display
    elements.resultsGrid.innerHTML = '';
    state.searchResults.forEach((result, index) => {
        const resultCard = createResultCard(result, index);
        elements.resultsGrid.appendChild(resultCard);
    });

    showNotification('Sonuçlar sıralandı', 'success');
};

// Export Results
window.exportResults = function() {
    console.log('📥 Exporting results...');

    if (!state.searchResults || state.searchResults.length === 0) {
        showNotification('Dışa aktarılacak sonuç bulunamadı', 'warning');
        return;
    }

    // Create CSV content
    let csv = 'Başlık,URL,Kaynak,Alan,Relevans\n';
    state.searchResults.forEach(result => {
        csv += `"${result.title}","${result.url}","${result.source}","${result.domain}","${result.relevance}%"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-base-search-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Sonuçlar dışa aktarıldı', 'success');
};

// Clear Search
window.clearSearch = function() {
    console.log('🗑️ Clearing search...');

    // Clear state
    state.currentQuery = '';
    state.searchResults = [];
    state.totalResults = 0;
    state.currentPage = 1;

    // Clear UI
    if (elements.searchInput) {
        elements.searchInput.value = '';
        elements.searchInput.focus();
    }

    // Hide results, show categories
    if (elements.searchResultsSection) {
        elements.searchResultsSection.style.display = 'none';
    }

    const categoriesSection = document.getElementById('knowledgeCategories');
    if (categoriesSection) {
        categoriesSection.style.display = 'block';
        categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showNotification('Arama temizlendi', 'success');
};

// Back to Categories
window.backToCategories = function() {
    console.log('⬅️ Back to categories...');

    // Hide results, show categories
    if (elements.searchResultsSection) {
        elements.searchResultsSection.style.display = 'none';
    }

    const categoriesSection = document.getElementById('knowledgeCategories');
    if (categoriesSection) {
        categoriesSection.style.display = 'block';
        categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ========== Add CSS Animations ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    .result-card {
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
        transition: all 0.3s ease;
    }

    .result-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        border-color: #10A37F;
    }

    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .result-meta {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .result-meta span {
        font-size: 0.85rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        background: #f3f4f6;
        color: #6b7280;
    }

    .result-relevance {
        background: #10A37F !important;
        color: white !important;
    }

    .result-bookmark {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s;
    }

    .result-bookmark:hover {
        color: #10A37F;
        transform: scale(1.2);
    }

    .result-title {
        font-size: 1.3rem;
        margin-bottom: 0.75rem;
    }

    .result-title a {
        color: #111827;
        text-decoration: none;
        transition: color 0.2s;
    }

    .result-title a:hover {
        color: #10A37F;
    }

    .result-snippet {
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 1rem;
    }

    .result-snippet mark {
        background: #fef3c7;
        color: #92400e;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
    }

    .result-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }

    .result-source a {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .result-actions {
        display: flex;
        gap: 0.5rem;
    }

    .result-actions button {
        background: none;
        border: none;
        padding: 0.5rem;
        color: #9ca3af;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .result-actions button:hover {
        background: #f3f4f6;
        color: #10A37F;
    }

    .no-results {
        text-align: center;
        padding: 4rem 2rem;
        color: #6b7280;
    }

    .no-results h3 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: #374151;
    }

    /* ========== Enhanced Results Section ========== */
    .search-results-section {
        background: #f8f9fa;
        min-height: 100vh;
        padding: 2rem 0;
    }

    .results-header-sticky {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .results-info-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .results-title {
        font-size: 1.75rem;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
    }

    .results-title i {
        color: #10A37F;
    }

    .results-meta {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .results-count-badge {
        padding: 0.5rem 1rem;
        background: #10A37F;
        color: white;
        border-radius: 25px;
        font-weight: 600;
        font-size: 0.95rem;
    }

    .results-time-badge {
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        color: #6b7280;
        border-radius: 25px;
        font-size: 0.9rem;
    }

    .results-quick-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .quick-action-btn {
        padding: 0.65rem 1.25rem;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #374151;
    }

    .quick-action-btn:hover {
        border-color: #10A37F;
        background: #f0fdf4;
        color: #10A37F;
        transform: translateY(-1px);
    }

    .quick-action-btn.clear-btn {
        border-color: #f87171;
        color: #dc2626;
    }

    .quick-action-btn.clear-btn:hover {
        background: #fef2f2;
        border-color: #dc2626;
    }

    /* Loading Animation */
    .results-loading {
        text-align: center;
        padding: 4rem 2rem;
    }

    .loading-animation {
        display: inline-block;
    }

    .loading-dots {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1rem;
    }

    .loading-dots span {
        width: 12px;
        height: 12px;
        background: #10A37F;
        border-radius: 50%;
        animation: loadingBounce 1.4s infinite ease-in-out both;
    }

    .loading-dots span:nth-child(1) {
        animation-delay: -0.32s;
    }

    .loading-dots span:nth-child(2) {
        animation-delay: -0.16s;
    }

    @keyframes loadingBounce {
        0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .loading-animation p {
        color: #6b7280;
        font-size: 1rem;
    }

    /* Enhanced Results Grid */
    .results-grid-enhanced {
        display: grid;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* Enhanced No Results */
    .no-results-enhanced {
        text-align: center;
        padding: 5rem 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .no-results-icon {
        font-size: 5rem;
        color: #d1d5db;
        margin-bottom: 1.5rem;
    }

    .no-results-enhanced h3 {
        font-size: 1.75rem;
        color: #111827;
        margin-bottom: 0.75rem;
    }

    .no-results-enhanced p {
        color: #6b7280;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }

    .no-results-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .no-results-btn {
        padding: 0.85rem 1.75rem;
        border: none;
        background: #10A37F;
        color: white;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .no-results-btn:hover {
        background: #0d8f6f;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16,163,127,0.3);
    }

    .no-results-btn.secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .no-results-btn.secondary:hover {
        background: #e5e7eb;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* Back to Explore */
    .back-to-explore {
        text-align: center;
        padding: 2rem 0;
    }

    .back-btn {
        padding: 0.85rem 1.75rem;
        border: 2px solid #e5e7eb;
        background: white;
        color: #374151;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
    }

    .back-btn:hover {
        border-color: #10A37F;
        color: #10A37F;
        background: #f0fdf4;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .results-info-bar {
            flex-direction: column;
            align-items: flex-start;
        }

        .results-quick-actions {
            width: 100%;
        }

        .quick-action-btn {
            flex: 1;
            justify-content: center;
        }

        .results-title {
            font-size: 1.5rem;
        }

        .no-results-enhanced {
            padding: 3rem 1.5rem;
        }

        .no-results-actions {
            flex-direction: column;
            width: 100%;
        }

        .no-results-btn {
            width: 100%;
            justify-content: center;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Knowledge Base JavaScript Loaded (Enhanced UX v2.1)');
