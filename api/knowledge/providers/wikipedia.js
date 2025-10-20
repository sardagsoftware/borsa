// ========================================
// Wikipedia API Integration
// Real-time Wikipedia search with 309 languages
// ========================================

const https = require('https');

class WikipediaProvider {
    constructor() {
        this.name = 'Wikipedia';
        this.baseUrl = 'https://en.wikipedia.org/w/api.php';
        this.totalArticles = 61000000;
        this.supportedLanguages = 309;
    }

    /**
     * Search Wikipedia articles
     * @param {string} query - Search query
     * @param {string} language - Language code (en, tr, ar, etc.)
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Array of articles
     */
    async search(query, language = 'en', limit = 20) {
        const langCode = this.getLanguageCode(language);
        const apiUrl = `https://${langCode}.wikipedia.org/w/api.php`;

        const params = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: limit,
            srprop: 'snippet|titlesnippet|timestamp|wordcount|size',
            format: 'json',
            origin: '*'
        });

        try {
            console.log(`📚 Wikipedia Search: "${query}" [${langCode}]`);

            const response = await this.makeRequest(`${apiUrl}?${params}`);
            const data = JSON.parse(response);

            if (!data.query || !data.query.search) {
                return [];
            }

            const results = data.query.search.map(article => ({
                id: `wiki_${article.pageid}`,
                title: this.cleanHtml(article.title),
                snippet: this.cleanHtml(article.snippet),
                description: this.cleanHtml(article.snippet),
                url: `https://${langCode}.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`,
                sourceUrl: `https://${langCode}.wikipedia.org`,
                source: 'Wikipedia',
                domain: 'general',
                language: language,
                relevance: this.calculateRelevance(article, query),
                timestamp: article.timestamp,
                metadata: {
                    pageId: article.pageid,
                    wordCount: article.wordcount,
                    size: article.size,
                    lastUpdated: article.timestamp
                }
            }));

            console.log(`✅ Wikipedia: ${results.length} results found`);
            return results;

        } catch (error) {
            console.error('❌ Wikipedia API Error:', error.message);
            return [];
        }
    }

    /**
     * Get full article content
     * @param {string} title - Article title
     * @param {string} language - Language code
     * @returns {Promise<Object>} - Full article
     */
    async getArticle(title, language = 'en') {
        const langCode = this.getLanguageCode(language);
        const apiUrl = `https://${langCode}.wikipedia.org/w/api.php`;

        const params = new URLSearchParams({
            action: 'query',
            prop: 'extracts|info|pageimages',
            titles: title,
            exintro: false,
            explaintext: true,
            inprop: 'url',
            pithumbsize: 500,
            format: 'json',
            origin: '*'
        });

        try {
            const response = await this.makeRequest(`${apiUrl}?${params}`);
            const data = JSON.parse(response);

            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];

            if (pageId === '-1') {
                return null;
            }

            return {
                id: `wiki_${pageId}`,
                title: page.title,
                content: page.extract,
                url: page.fullurl,
                thumbnail: page.thumbnail?.source || null,
                source: 'Wikipedia',
                language: language
            };

        } catch (error) {
            console.error('❌ Wikipedia Article Error:', error.message);
            return null;
        }
    }

    /**
     * Get article summary (for quick previews)
     * @param {string} title - Article title
     * @param {string} language - Language code
     * @returns {Promise<Object>} - Article summary
     */
    async getSummary(title, language = 'en') {
        const langCode = this.getLanguageCode(language);
        const apiUrl = `https://${langCode}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

        try {
            const response = await this.makeRequest(apiUrl);
            const data = JSON.parse(response);

            return {
                id: `wiki_${data.pageid}`,
                title: data.title,
                snippet: data.extract,
                description: data.description,
                url: data.content_urls.desktop.page,
                thumbnail: data.thumbnail?.source || null,
                source: 'Wikipedia',
                language: language
            };

        } catch (error) {
            console.error('❌ Wikipedia Summary Error:', error.message);
            return null;
        }
    }

    /**
     * Get related articles
     * @param {string} title - Article title
     * @param {string} language - Language code
     * @returns {Promise<Array>} - Related articles
     */
    async getRelated(title, language = 'en') {
        const langCode = this.getLanguageCode(language);
        const apiUrl = `https://${langCode}.wikipedia.org/api/rest_v1/page/related/${encodeURIComponent(title)}`;

        try {
            const response = await this.makeRequest(apiUrl);
            const data = JSON.parse(response);

            return data.pages.slice(0, 10).map(page => ({
                id: `wiki_${page.pageid}`,
                title: page.title,
                snippet: page.extract,
                description: page.description,
                url: page.content_urls.desktop.page,
                thumbnail: page.thumbnail?.source || null,
                source: 'Wikipedia'
            }));

        } catch (error) {
            console.error('❌ Wikipedia Related Error:', error.message);
            return [];
        }
    }

    /**
     * Make HTTPS request
     * @param {string} url - Request URL
     * @returns {Promise<string>} - Response body
     */
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'User-Agent': 'AiLydian Knowledge Base/2.1 (https://ailydian.com; support@ailydian.com)'
                }
            }, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Clean HTML from Wikipedia responses
     * @param {string} html - HTML string
     * @returns {string} - Clean text
     */
    cleanHtml(html) {
        if (!html) return '';
        return html
            .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .trim();
    }

    /**
     * Calculate relevance score
     * @param {Object} article - Wikipedia article
     * @param {string} query - Search query
     * @returns {number} - Relevance score (0-100)
     */
    calculateRelevance(article, query) {
        let score = 50; // Base score

        // Title match
        const titleLower = article.title.toLowerCase();
        const queryLower = query.toLowerCase();

        if (titleLower === queryLower) {
            score += 50; // Perfect match
        } else if (titleLower.includes(queryLower)) {
            score += 30; // Partial match
        } else if (queryLower.split(' ').some(word => titleLower.includes(word))) {
            score += 15; // Word match
        }

        // Word count bonus (longer articles are often more comprehensive)
        if (article.wordcount > 5000) score += 10;
        else if (article.wordcount > 1000) score += 5;

        // Recency bonus (updated in last year)
        const lastUpdate = new Date(article.timestamp);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (lastUpdate > oneYearAgo) score += 5;

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Get language code
     * @param {string} language - Language code (tr, en, ar, etc.)
     * @returns {string} - Wikipedia language code
     */
    getLanguageCode(language) {
        const mapping = {
            'tr': 'tr', // Turkish
            'en': 'en', // English
            'ar': 'ar', // Arabic
            'de': 'de', // German
            'fr': 'fr', // French
            'es': 'es', // Spanish
            'ru': 'ru', // Russian
            'zh': 'zh', // Chinese
            'ja': 'ja', // Japanese
            'pt': 'pt', // Portuguese
            'it': 'it', // Italian
            'nl': 'nl', // Dutch
            'pl': 'pl', // Polish
            'sv': 'sv', // Swedish
            'vi': 'vi', // Vietnamese
            'ko': 'ko', // Korean
            'id': 'id', // Indonesian
            'fa': 'fa', // Persian
            'he': 'he', // Hebrew
            'uk': 'uk'  // Ukrainian
        };

        return mapping[language] || 'en';
    }
}

module.exports = WikipediaProvider;
