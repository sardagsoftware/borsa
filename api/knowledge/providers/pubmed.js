// ========================================
// PubMed/NCBI API Integration
// 35M+ medical/scientific articles
// ========================================

const https = require('https');

class PubMedProvider {
    constructor() {
        this.name = 'PubMed';
        this.baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.totalArticles = 35000000;
        this.apiKey = process.env.NCBI_API_KEY || null; // Optional, increases rate limit
    }

    /**
     * Search PubMed articles
     * @param {string} query - Search query
     * @param {string} language - Language code (limited effect, mostly English)
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Array of medical articles
     */
    async search(query, language = 'en', limit = 20) {
        try {
            console.log(`⚕️ PubMed Search: "${query}"`);

            // Step 1: Search for PMIDs
            const pmids = await this.searchPMIDs(query, limit);

            if (pmids.length === 0) {
                return [];
            }

            // Step 2: Fetch article details
            const articles = await this.fetchArticles(pmids);

            console.log(`✅ PubMed: ${articles.length} results found`);
            return articles;

        } catch (error) {
            console.error('❌ PubMed API Error:', error.message);
            return [];
        }
    }

    /**
     * Search for PubMed IDs (PMIDs)
     * @param {string} query - Search query
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Array of PMIDs
     */
    async searchPMIDs(query, limit = 20) {
        const params = new URLSearchParams({
            db: 'pubmed',
            term: query,
            retmax: limit,
            retmode: 'json',
            sort: 'relevance'
        });

        if (this.apiKey) {
            params.append('api_key', this.apiKey);
        }

        const url = `${this.baseUrl}/esearch.fcgi?${params}`;

        const response = await this.makeRequest(url);
        const data = JSON.parse(response);

        return data.esearchresult?.idlist || [];
    }

    /**
     * Fetch article details by PMIDs
     * @param {Array} pmids - Array of PubMed IDs
     * @returns {Promise<Array>} - Array of article objects
     */
    async fetchArticles(pmids) {
        const params = new URLSearchParams({
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'xml',
            rettype: 'abstract'
        });

        if (this.apiKey) {
            params.append('api_key', this.apiKey);
        }

        const url = `${this.baseUrl}/efetch.fcgi?${params}`;

        const response = await this.makeRequest(url);

        // Parse XML (basic parsing - in production use xml2js library)
        const articles = this.parseXML(response, pmids);

        return articles;
    }

    /**
     * Parse PubMed XML response
     * @param {string} xml - XML response
     * @param {Array} pmids - Array of PMIDs
     * @returns {Array} - Parsed articles
     */
    parseXML(xml, pmids) {
        const articles = [];

        // Basic regex-based XML parsing (for production, use xml2js)
        const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

        articleMatches.forEach((articleXml, index) => {
            try {
                const pmid = pmids[index];

                // Extract title
                const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
                const title = titleMatch ? this.cleanXml(titleMatch[1]) : 'No title';

                // Extract abstract
                const abstractMatch = articleXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/);
                const abstract = abstractMatch ? this.cleanXml(abstractMatch[1]) : '';

                // Extract authors
                const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
                const authors = authorMatches.slice(0, 3).map(author => {
                    const lastName = author.match(/<LastName>(.*?)<\/LastName>/)?.[1] || '';
                    const foreName = author.match(/<ForeName>(.*?)<\/ForeName>/)?.[1] || '';
                    return `${foreName} ${lastName}`.trim();
                }).filter(Boolean);

                // Extract journal
                const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
                const journal = journalMatch ? this.cleanXml(journalMatch[1]) : '';

                // Extract publication date
                const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/);
                const monthMatch = articleXml.match(/<PubDate>[\s\S]*?<Month>(.*?)<\/Month>/);
                const year = yearMatch ? yearMatch[1] : '';
                const month = monthMatch ? monthMatch[1] : '';

                // Extract DOI
                const doiMatch = articleXml.match(/<ELocationID EIdType="doi"[^>]*>(.*?)<\/ELocationID>/);
                const doi = doiMatch ? doiMatch[1] : null;

                // Extract MeSH terms (keywords)
                const meshMatches = articleXml.match(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/g) || [];
                const keywords = meshMatches.slice(0, 5).map(mesh => {
                    return mesh.match(/>(.*?)</)?.[1] || '';
                }).filter(Boolean);

                articles.push({
                    id: `pubmed_${pmid}`,
                    title: title,
                    snippet: abstract.substring(0, 300) + (abstract.length > 300 ? '...' : ''),
                    description: abstract,
                    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
                    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov',
                    source: 'PubMed',
                    domain: 'medicine',
                    language: 'en', // PubMed is primarily English
                    relevance: 95 - (index * 2), // Decreasing relevance
                    timestamp: `${year}-${month || '01'}-01T00:00:00Z`,
                    metadata: {
                        pmid: pmid,
                        authors: authors.join(', '),
                        journal: journal,
                        publicationDate: `${month} ${year}`,
                        doi: doi,
                        keywords: keywords,
                        citationType: 'Scientific Article'
                    }
                });

            } catch (error) {
                console.error('❌ Error parsing article:', error.message);
            }
        });

        return articles;
    }

    /**
     * Get article by PMID
     * @param {string} pmid - PubMed ID
     * @returns {Promise<Object>} - Full article details
     */
    async getArticle(pmid) {
        try {
            const articles = await this.fetchArticles([pmid]);
            return articles[0] || null;
        } catch (error) {
            console.error('❌ PubMed Article Error:', error.message);
            return null;
        }
    }

    /**
     * Get related articles by PMID
     * @param {string} pmid - PubMed ID
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Related articles
     */
    async getRelated(pmid, limit = 10) {
        const params = new URLSearchParams({
            dbfrom: 'pubmed',
            id: pmid,
            linkname: 'pubmed_pubmed',
            retmax: limit
        });

        if (this.apiKey) {
            params.append('api_key', this.apiKey);
        }

        try {
            const url = `${this.baseUrl}/elink.fcgi?${params}&retmode=json`;
            const response = await this.makeRequest(url);
            const data = JSON.parse(response);

            const relatedPMIDs = data.linksets?.[0]?.linksetdbs?.[0]?.links || [];

            if (relatedPMIDs.length === 0) {
                return [];
            }

            return await this.fetchArticles(relatedPMIDs.slice(0, limit));

        } catch (error) {
            console.error('❌ PubMed Related Error:', error.message);
            return [];
        }
    }

    /**
     * Search by MeSH (Medical Subject Headings)
     * @param {string} meshTerm - MeSH term
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Articles with MeSH term
     */
    async searchByMeSH(meshTerm, limit = 20) {
        const query = `${meshTerm}[MeSH Terms]`;
        return await this.search(query, 'en', limit);
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
     * Clean XML content
     * @param {string} xml - XML string
     * @returns {string} - Clean text
     */
    cleanXml(xml) {
        if (!xml) return '';
        return xml
            .replace(/<\/?[^>]+(>|$)/g, '') // Remove XML tags
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&apos;/g, "'")
            .trim();
    }
}

module.exports = PubMedProvider;
