/**
 * 🔍 AZURE COGNITIVE SEARCH SERVICE
 * Enterprise full-text search with semantic search, multi-language support, and AI-powered features
 *
 * Features:
 * - Semantic search (AI-powered relevance)
 * - Multi-language support (10 languages)
 * - Faceted search with filters
 * - Auto-complete and suggestions
 * - Fuzzy matching and spell check
 * - Highlighting and snippets
 * - Azure Application Insights integration
 */

const { SearchClient, SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');

// Azure Application Insights integration
let appInsights;
try {
    appInsights = require('applicationinsights');
} catch (error) {
    console.warn('⚠️ Application Insights not installed - search metrics will not be tracked');
}

/**
 * Azure Cognitive Search configuration
 */
const SEARCH_CONFIG = {
    endpoint: process.env.AZURE_SEARCH_ENDPOINT || 'https://ailydian-search.search.windows.net',
    adminKey: process.env.AZURE_SEARCH_ADMIN_KEY,
    queryKey: process.env.AZURE_SEARCH_QUERY_KEY,
    indexName: process.env.AZURE_SEARCH_INDEX_NAME || 'conversations-index',
    apiVersion: process.env.AZURE_SEARCH_API_VERSION || '2023-11-01'
};

/**
 * Create Search Client
 */
const searchClient = new SearchClient(
    SEARCH_CONFIG.endpoint,
    SEARCH_CONFIG.indexName,
    new AzureKeyCredential(SEARCH_CONFIG.queryKey || SEARCH_CONFIG.adminKey)
);

/**
 * Create Index Client (for admin operations)
 */
const indexClient = new SearchIndexClient(
    SEARCH_CONFIG.endpoint,
    new AzureKeyCredential(SEARCH_CONFIG.adminKey)
);

/**
 * Track search events
 */
function trackSearchEvent(eventName, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackEvent({
            name: eventName,
            properties
        });
    }
}

/**
 * Track search metrics
 */
function trackSearchMetric(metricName, value, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackMetric({
            name: metricName,
            value,
            properties
        });
    }
}

/**
 * SIMPLE SEARCH
 * Basic keyword search with scoring
 */
async function simpleSearch(query, options = {}) {
    const {
        top = 20,
        skip = 0,
        orderBy = ['@search.score desc', 'updatedAt desc'],
        select = ['id', 'title', 'userId', 'createdAt', 'updatedAt', 'messageCount', 'tags'],
        searchMode = 'all',
        scoringProfile = 'recent-boost',
        includeTotalCount = true
    } = options;

    const startTime = Date.now();

    try {
        const searchResults = await searchClient.search(query, {
            top,
            skip,
            orderBy,
            select,
            searchMode,
            scoringProfile,
            includeTotalCount,
            highlightFields: 'title,messages/content,tags',
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>'
        });

        const results = [];
        let totalCount = 0;

        for await (const result of searchResults.results) {
            results.push({
                ...result.document,
                score: result.score,
                highlights: result.highlights
            });
        }

        totalCount = searchResults.count || results.length;

        const searchTime = Date.now() - startTime;

        trackSearchEvent('SimpleSearch', {
            query,
            resultCount: results.length,
            totalCount,
            searchTime
        });

        trackSearchMetric('SearchLatency', searchTime, { type: 'simple' });
        trackSearchMetric('ResultCount', results.length, { type: 'simple' });

        return {
            results,
            totalCount,
            searchTime,
            query,
            page: Math.floor(skip / top) + 1,
            pageSize: top,
            totalPages: Math.ceil(totalCount / top)
        };

    } catch (error) {
        console.error('❌ Simple search error:', error.message);
        trackSearchEvent('SearchError', { query, error: error.message, type: 'simple' });
        throw error;
    }
}

/**
 * SEMANTIC SEARCH
 * AI-powered semantic understanding with re-ranking
 */
async function semanticSearch(query, options = {}) {
    const {
        top = 20,
        skip = 0,
        select = ['id', 'title', 'userId', 'createdAt', 'updatedAt', 'messageCount', 'tags'],
        includeTotalCount = true
    } = options;

    const startTime = Date.now();

    try {
        const searchResults = await searchClient.search(query, {
            top,
            skip,
            select,
            includeTotalCount,
            queryType: 'semantic',
            semanticConfiguration: 'conversation-semantic',
            captions: 'extractive',
            answers: 'extractive|count-3',
            highlightFields: 'title,messages/content',
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>'
        });

        const results = [];
        const answers = [];
        let totalCount = 0;

        for await (const result of searchResults.results) {
            results.push({
                ...result.document,
                score: result.score,
                rerankerScore: result.rerankerScore,
                captions: result.captions,
                highlights: result.highlights
            });
        }

        // Extract answers
        if (searchResults.answers) {
            for await (const answer of searchResults.answers) {
                answers.push({
                    key: answer.key,
                    text: answer.text,
                    highlights: answer.highlights,
                    score: answer.score
                });
            }
        }

        totalCount = searchResults.count || results.length;
        const searchTime = Date.now() - startTime;

        trackSearchEvent('SemanticSearch', {
            query,
            resultCount: results.length,
            totalCount,
            answerCount: answers.length,
            searchTime
        });

        trackSearchMetric('SearchLatency', searchTime, { type: 'semantic' });
        trackSearchMetric('ResultCount', results.length, { type: 'semantic' });

        return {
            results,
            answers,
            totalCount,
            searchTime,
            query,
            page: Math.floor(skip / top) + 1,
            pageSize: top,
            totalPages: Math.ceil(totalCount / top)
        };

    } catch (error) {
        console.error('❌ Semantic search error:', error.message);
        trackSearchEvent('SearchError', { query, error: error.message, type: 'semantic' });
        throw error;
    }
}

/**
 * FACETED SEARCH
 * Search with facets (filters) for drill-down
 */
async function facetedSearch(query, options = {}) {
    const {
        top = 20,
        skip = 0,
        facets = ['language,count:10', 'aiModel,count:20', 'tags,count:50', 'sentiment,count:3'],
        filter = null,
        select = ['id', 'title', 'userId', 'language', 'aiModel', 'tags', 'sentiment', 'createdAt', 'messageCount'],
        orderBy = ['@search.score desc']
    } = options;

    const startTime = Date.now();

    try {
        const searchOptions = {
            top,
            skip,
            facets,
            select,
            orderBy,
            includeTotalCount: true,
            highlightFields: 'title,tags',
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>'
        };

        if (filter) {
            searchOptions.filter = filter;
        }

        const searchResults = await searchClient.search(query, searchOptions);

        const results = [];
        const facetResults = {};
        let totalCount = 0;

        for await (const result of searchResults.results) {
            results.push({
                ...result.document,
                score: result.score,
                highlights: result.highlights
            });
        }

        // Extract facets
        if (searchResults.facets) {
            for (const [facetName, facetValues] of Object.entries(searchResults.facets)) {
                facetResults[facetName] = facetValues.map(fv => ({
                    value: fv.value,
                    count: fv.count
                }));
            }
        }

        totalCount = searchResults.count || results.length;
        const searchTime = Date.now() - startTime;

        trackSearchEvent('FacetedSearch', {
            query,
            filter,
            resultCount: results.length,
            totalCount,
            facetCount: Object.keys(facetResults).length,
            searchTime
        });

        trackSearchMetric('SearchLatency', searchTime, { type: 'faceted' });

        return {
            results,
            facets: facetResults,
            totalCount,
            searchTime,
            query,
            filter,
            page: Math.floor(skip / top) + 1,
            pageSize: top,
            totalPages: Math.ceil(totalCount / top)
        };

    } catch (error) {
        console.error('❌ Faceted search error:', error.message);
        trackSearchEvent('SearchError', { query, error: error.message, type: 'faceted' });
        throw error;
    }
}

/**
 * AUTO-COMPLETE
 * Real-time query completion as user types
 */
async function autoComplete(searchText, options = {}) {
    const {
        suggesterName = 'conversation-suggester',
        mode = 'twoTerms',
        fuzzy = true,
        top = 5,
        highlightPreTag = '<strong>',
        highlightPostTag = '</strong>'
    } = options;

    const startTime = Date.now();

    try {
        const result = await searchClient.autocomplete(searchText, suggesterName, {
            autocompleteMode: mode,
            fuzzyMatching: fuzzy,
            top,
            highlightPreTag,
            highlightPostTag
        });

        const completions = result.results.map(r => ({
            text: r.text,
            queryPlusText: r.queryPlusText
        }));

        const completionTime = Date.now() - startTime;

        trackSearchEvent('AutoComplete', {
            searchText,
            completionCount: completions.length,
            completionTime
        });

        return {
            completions,
            searchText,
            completionTime
        };

    } catch (error) {
        console.error('❌ Auto-complete error:', error.message);
        trackSearchEvent('SearchError', { searchText, error: error.message, type: 'autocomplete' });
        throw error;
    }
}

/**
 * SUGGESTIONS
 * Suggested documents as user types
 */
async function suggestions(searchText, options = {}) {
    const {
        suggesterName = 'conversation-suggester',
        top = 5,
        fuzzy = true,
        select = ['id', 'title', 'tags'],
        highlightPreTag = '<strong>',
        highlightPostTag = '</strong>',
        orderBy = ['@search.score desc']
    } = options;

    const startTime = Date.now();

    try {
        const result = await searchClient.suggest(searchText, suggesterName, {
            top,
            fuzzyMatching: fuzzy,
            select,
            highlightPreTag,
            highlightPostTag,
            orderBy
        });

        const suggestions = result.results.map(r => ({
            ...r.document,
            text: r.text,
            highlights: r.highlights
        }));

        const suggestionTime = Date.now() - startTime;

        trackSearchEvent('Suggestions', {
            searchText,
            suggestionCount: suggestions.length,
            suggestionTime
        });

        return {
            suggestions,
            searchText,
            suggestionTime
        };

    } catch (error) {
        console.error('❌ Suggestions error:', error.message);
        trackSearchEvent('SearchError', { searchText, error: error.message, type: 'suggestions' });
        throw error;
    }
}

/**
 * ADVANCED SEARCH
 * Combine multiple search features
 */
async function advancedSearch(query, options = {}) {
    const {
        type = 'semantic', // simple, semantic, faceted
        top = 20,
        skip = 0,
        filter = null,
        facets = null,
        orderBy = null
    } = options;

    switch (type) {
        case 'semantic':
            return await semanticSearch(query, { top, skip });

        case 'faceted':
            return await facetedSearch(query, { top, skip, filter, facets, orderBy });

        case 'simple':
        default:
            return await simpleSearch(query, { top, skip, orderBy });
    }
}

/**
 * INDEX DOCUMENT
 * Add or update document in search index
 */
async function indexDocument(document) {
    try {
        const result = await searchClient.uploadDocuments([document]);

        trackSearchEvent('DocumentIndexed', {
            documentId: document.id,
            success: result.results[0].succeeded
        });

        return result.results[0];

    } catch (error) {
        console.error('❌ Index document error:', error.message);
        trackSearchEvent('IndexError', { documentId: document.id, error: error.message });
        throw error;
    }
}

/**
 * BATCH INDEX DOCUMENTS
 * Index multiple documents at once
 */
async function batchIndexDocuments(documents) {
    try {
        const result = await searchClient.uploadDocuments(documents);

        const successCount = result.results.filter(r => r.succeeded).length;
        const failureCount = result.results.length - successCount;

        trackSearchEvent('BatchIndexed', {
            totalCount: documents.length,
            successCount,
            failureCount
        });

        return {
            successCount,
            failureCount,
            results: result.results
        };

    } catch (error) {
        console.error('❌ Batch index error:', error.message);
        trackSearchEvent('IndexError', { batchSize: documents.length, error: error.message });
        throw error;
    }
}

/**
 * DELETE DOCUMENT
 * Remove document from search index
 */
async function deleteDocument(documentId) {
    try {
        const result = await searchClient.deleteDocuments([{ id: documentId }]);

        trackSearchEvent('DocumentDeleted', {
            documentId,
            success: result.results[0].succeeded
        });

        return result.results[0];

    } catch (error) {
        console.error('❌ Delete document error:', error.message);
        trackSearchEvent('DeleteError', { documentId, error: error.message });
        throw error;
    }
}

/**
 * GET DOCUMENT
 * Retrieve document by ID
 */
async function getDocument(documentId, select = null) {
    try {
        const document = await searchClient.getDocument(documentId, { select });

        trackSearchEvent('DocumentRetrieved', { documentId });

        return document;

    } catch (error) {
        console.error('❌ Get document error:', error.message);
        trackSearchEvent('RetrieveError', { documentId, error: error.message });
        throw error;
    }
}

/**
 * SEARCH STATISTICS
 * Get index statistics
 */
async function getSearchStatistics() {
    try {
        const index = await indexClient.getIndex(SEARCH_CONFIG.indexName);
        const stats = await indexClient.getIndexStatistics(SEARCH_CONFIG.indexName);

        return {
            indexName: index.name,
            documentCount: stats.documentCount,
            storageSize: stats.storageSize,
            fields: index.fields.length,
            suggesters: index.suggesters?.length || 0,
            scoringProfiles: index.scoringProfiles?.length || 0
        };

    } catch (error) {
        console.error('❌ Get statistics error:', error.message);
        return null;
    }
}

/**
 * Express API endpoints
 */
function createSearchRoutes(app) {
    // Simple search
    app.get('/api/search', async (req, res) => {
        try {
            const { q, page = 1, pageSize = 20, type = 'simple' } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }

            const skip = (page - 1) * pageSize;
            const results = await advancedSearch(q, {
                type,
                top: parseInt(pageSize),
                skip
            });

            res.json(results);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Faceted search
    app.get('/api/search/faceted', async (req, res) => {
        try {
            const { q, filter, page = 1, pageSize = 20 } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }

            const skip = (page - 1) * pageSize;
            const results = await facetedSearch(q, {
                top: parseInt(pageSize),
                skip,
                filter
            });

            res.json(results);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Auto-complete
    app.get('/api/search/autocomplete', async (req, res) => {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }

            const results = await autoComplete(q);
            res.json(results);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Suggestions
    app.get('/api/search/suggestions', async (req, res) => {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }

            const results = await suggestions(q);
            res.json(results);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get document
    app.get('/api/search/document/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const document = await getDocument(id);
            res.json(document);

        } catch (error) {
            res.status(404).json({ error: 'Document not found' });
        }
    });

    // Search statistics
    app.get('/api/search/stats', async (req, res) => {
        try {
            const stats = await getSearchStatistics();
            res.json(stats);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = {
    searchClient,
    indexClient,
    simpleSearch,
    semanticSearch,
    facetedSearch,
    autoComplete,
    suggestions,
    advancedSearch,
    indexDocument,
    batchIndexDocuments,
    deleteDocument,
    getDocument,
    getSearchStatistics,
    createSearchRoutes
};
