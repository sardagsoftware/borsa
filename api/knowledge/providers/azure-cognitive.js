// ========================================
// Azure Cognitive Search Integration
// Ultra-fast search with AI-powered ranking
// ========================================

const https = require('https');

class AzureCognitiveSearchProvider {
    constructor() {
        this.name = 'Azure Cognitive Search';
        this.searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || null;
        this.searchKey = process.env.AZURE_SEARCH_KEY || null;
        this.indexName = process.env.AZURE_SEARCH_INDEX || 'knowledge-base-index';

        // Azure AI Services
        this.aiEndpoint = process.env.AZURE_AI_ENDPOINT || null;
        this.aiKey = process.env.AZURE_AI_KEY || null;
    }

    /**
     * Check if Azure services are configured
     * @returns {boolean}
     */
    isConfigured() {
        return !!(this.searchEndpoint && this.searchKey);
    }

    /**
     * Search using Azure Cognitive Search
     * @param {string} query - Search query
     * @param {string} language - Language code
     * @param {string} domain - Domain filter
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Search results
     */
    async search(query, language = 'en', domain = 'all', limit = 20) {
        if (!this.isConfigured()) {
            console.log('⚠️ Azure Cognitive Search not configured');
            return [];
        }

        try {
            console.log(`☁️ Azure Cognitive Search: "${query}" [${language}] [${domain}]`);

            const searchParams = {
                search: query,
                searchMode: 'all',
                queryType: 'semantic', // AI-powered semantic search
                top: limit,
                select: 'id,title,content,url,domain,language,timestamp,metadata',
                orderby: '@search.score desc',
                scoringProfile: 'relevance-profile',
                highlight: 'content',
                highlightPreTag: '<mark>',
                highlightPostTag: '</mark>'
            };

            // Add filters
            const filters = [];
            if (language !== 'all') {
                filters.push(`language eq '${language}'`);
            }
            if (domain !== 'all') {
                filters.push(`domain eq '${domain}'`);
            }

            if (filters.length > 0) {
                searchParams.filter = filters.join(' and ');
            }

            const response = await this.makeAzureRequest(
                'POST',
                `https://${this.searchEndpoint}.search.windows.net/indexes/${this.indexName}/docs/search?api-version=2023-11-01`,
                searchParams
            );

            const data = JSON.parse(response);

            if (!data.value) {
                return [];
            }

            const results = data.value.map((doc, index) => ({
                id: doc.id,
                title: doc.title,
                snippet: this.extractSnippet(doc, data['@search.highlights']),
                description: doc.content?.substring(0, 500) || '',
                url: doc.url,
                sourceUrl: this.getSourceUrl(doc.domain),
                source: this.getSourceName(doc.domain),
                domain: doc.domain,
                language: doc.language,
                relevance: Math.round((doc['@search.score'] / data['@search.maxScore']) * 100),
                timestamp: doc.timestamp,
                metadata: doc.metadata || {}
            }));

            console.log(`✅ Azure Search: ${results.length} results found`);
            return results;

        } catch (error) {
            console.error('❌ Azure Cognitive Search Error:', error.message);
            return [];
        }
    }

    /**
     * Search with AI-powered suggestions
     * @param {string} query - Partial query
     * @returns {Promise<Array>} - Suggestions
     */
    async getSuggestions(query) {
        if (!this.isConfigured()) {
            return [];
        }

        try {
            const suggestionParams = {
                search: query,
                suggesterName: 'sg',
                top: 10,
                fuzzy: true
            };

            const response = await this.makeAzureRequest(
                'POST',
                `https://${this.searchEndpoint}.search.windows.net/indexes/${this.indexName}/docs/suggest?api-version=2023-11-01`,
                suggestionParams
            );

            const data = JSON.parse(response);

            return data.value.map(item => ({
                text: item['@search.text'],
                title: item.title
            }));

        } catch (error) {
            console.error('❌ Azure Suggestions Error:', error.message);
            return [];
        }
    }

    /**
     * Semantic search with Azure AI
     * @param {string} query - Natural language query
     * @param {string} language - Language code
     * @returns {Promise<Array>} - Semantic results
     */
    async semanticSearch(query, language = 'en') {
        if (!this.isConfigured()) {
            return [];
        }

        try {
            const searchParams = {
                search: query,
                queryType: 'semantic',
                semanticConfiguration: 'default',
                answers: 'extractive|count-3',
                captions: 'extractive|highlight-true',
                top: 20
            };

            if (language !== 'all') {
                searchParams.filter = `language eq '${language}'`;
            }

            const response = await this.makeAzureRequest(
                'POST',
                `https://${this.searchEndpoint}.search.windows.net/indexes/${this.indexName}/docs/search?api-version=2023-11-01`,
                searchParams
            );

            const data = JSON.parse(response);

            // Extract semantic answers
            const answers = data['@search.answers']?.map(answer => ({
                text: answer.text,
                highlights: answer.highlights,
                score: answer.score
            })) || [];

            return {
                results: data.value || [],
                answers: answers,
                totalResults: data['@odata.count'] || 0
            };

        } catch (error) {
            console.error('❌ Azure Semantic Search Error:', error.message);
            return { results: [], answers: [], totalResults: 0 };
        }
    }

    /**
     * Index new document to Azure Search
     * @param {Object} document - Document to index
     * @returns {Promise<boolean>} - Success status
     */
    async indexDocument(document) {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const indexData = {
                value: [{
                    '@search.action': 'upload',
                    id: document.id,
                    title: document.title,
                    content: document.content,
                    url: document.url,
                    domain: document.domain,
                    language: document.language,
                    timestamp: document.timestamp,
                    metadata: document.metadata
                }]
            };

            await this.makeAzureRequest(
                'POST',
                `https://${this.searchEndpoint}.search.windows.net/indexes/${this.indexName}/docs/index?api-version=2023-11-01`,
                indexData
            );

            console.log(`✅ Document indexed: ${document.id}`);
            return true;

        } catch (error) {
            console.error('❌ Azure Index Error:', error.message);
            return false;
        }
    }

    /**
     * Bulk index documents
     * @param {Array} documents - Array of documents
     * @returns {Promise<number>} - Number of successfully indexed documents
     */
    async bulkIndexDocuments(documents) {
        if (!this.isConfigured()) {
            return 0;
        }

        try {
            const indexData = {
                value: documents.map(doc => ({
                    '@search.action': 'upload',
                    ...doc
                }))
            };

            await this.makeAzureRequest(
                'POST',
                `https://${this.searchEndpoint}.search.windows.net/indexes/${this.indexName}/docs/index?api-version=2023-11-01`,
                indexData
            );

            console.log(`✅ Bulk indexed: ${documents.length} documents`);
            return documents.length;

        } catch (error) {
            console.error('❌ Azure Bulk Index Error:', error.message);
            return 0;
        }
    }

    /**
     * Azure Text Analytics - Key phrase extraction
     * @param {string} text - Text to analyze
     * @param {string} language - Language code
     * @returns {Promise<Array>} - Key phrases
     */
    async extractKeyPhrases(text, language = 'en') {
        if (!this.aiEndpoint || !this.aiKey) {
            return [];
        }

        try {
            const requestBody = {
                documents: [{
                    id: '1',
                    language: language,
                    text: text
                }]
            };

            const response = await this.makeAzureRequest(
                'POST',
                `${this.aiEndpoint}/text/analytics/v3.1/keyPhrases`,
                requestBody,
                { 'Ocp-Apim-Subscription-Key': this.aiKey }
            );

            const data = JSON.parse(response);
            return data.documents[0]?.keyPhrases || [];

        } catch (error) {
            console.error('❌ Azure Key Phrases Error:', error.message);
            return [];
        }
    }

    /**
     * Azure Text Analytics - Sentiment analysis
     * @param {string} text - Text to analyze
     * @param {string} language - Language code
     * @returns {Promise<Object>} - Sentiment result
     */
    async analyzeSentiment(text, language = 'en') {
        if (!this.aiEndpoint || !this.aiKey) {
            return null;
        }

        try {
            const requestBody = {
                documents: [{
                    id: '1',
                    language: language,
                    text: text
                }]
            };

            const response = await this.makeAzureRequest(
                'POST',
                `${this.aiEndpoint}/text/analytics/v3.1/sentiment`,
                requestBody,
                { 'Ocp-Apim-Subscription-Key': this.aiKey }
            );

            const data = JSON.parse(response);
            return data.documents[0]?.sentiment || null;

        } catch (error) {
            console.error('❌ Azure Sentiment Error:', error.message);
            return null;
        }
    }

    /**
     * Make Azure API request
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} body - Request body
     * @param {Object} customHeaders - Custom headers
     * @returns {Promise<string>} - Response body
     */
    makeAzureRequest(method, url, body = null, customHeaders = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);

            const headers = {
                'Content-Type': 'application/json',
                'api-key': this.searchKey,
                ...customHeaders
            };

            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: headers
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    /**
     * Extract snippet with highlights
     * @param {Object} doc - Document
     * @param {Object} highlights - Highlight data
     * @returns {string} - Snippet
     */
    extractSnippet(doc, highlights) {
        if (highlights && highlights[doc.id]) {
            return highlights[doc.id].content[0] || doc.content?.substring(0, 300) || '';
        }
        return doc.content?.substring(0, 300) || '';
    }

    /**
     * Get source URL by domain
     * @param {string} domain - Domain
     * @returns {string} - Source URL
     */
    getSourceUrl(domain) {
        const urls = {
            agriculture: 'https://www.fao.org',
            space: 'https://www.nasa.gov',
            medicine: 'https://pubmed.ncbi.nlm.nih.gov',
            climate: 'https://www.noaa.gov',
            technology: 'https://ieeexplore.ieee.org'
        };
        return urls[domain] || 'https://en.wikipedia.org';
    }

    /**
     * Get source name by domain
     * @param {string} domain - Domain
     * @returns {string} - Source name
     */
    getSourceName(domain) {
        const names = {
            agriculture: 'FAO',
            space: 'NASA',
            medicine: 'PubMed',
            climate: 'NOAA',
            technology: 'IEEE'
        };
        return names[domain] || 'Azure Knowledge Base';
    }
}

module.exports = AzureCognitiveSearchProvider;
