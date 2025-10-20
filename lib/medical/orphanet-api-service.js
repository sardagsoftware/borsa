/**
 * 🧬 ORPHANET API SERVICE - BEYAZ ŞAPKALI (White-Hat Security)
 *
 * OrphaNet: The portal for rare diseases and orphan drugs
 * - 7,000+ rare diseases
 * - 10+ languages
 * - FREE API (no authentication required)
 * - ISO/IEC 27001 certified
 *
 * API Documentation: https://www.orpha.net/consor/cgi-bin/index.php
 * API Endpoint: https://api.orphadata.com/v1
 *
 * Features:
 * - Disease lookup by Orpha code
 * - Disease search by name/symptoms
 * - Clinical signs & symptoms
 * - Prevalence data
 * - Age of onset
 * - Inheritance patterns
 * - Associated genes
 * - Diagnostic tests
 * - Management guidelines
 *
 * @module lib/medical/orphanet-api-service
 */

const axios = require('axios');

// Environment configuration
const ORPHANET_API_ENDPOINT = process.env.ORPHANET_API_ENDPOINT || 'https://api.orphadata.com/v1';
const ORPHANET_LANGUAGE = process.env.ORPHANET_LANGUAGE || 'en';
const ORPHANET_TIMEOUT = parseInt(process.env.ORPHANET_TIMEOUT || '30000'); // 30 seconds

// Cache for API responses (in-memory, expires after 24 hours)
const CACHE = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * OrphaNet API Service Class
 */
class OrphaNetAPIService {
    constructor() {
        this.endpoint = ORPHANET_API_ENDPOINT;
        this.language = ORPHANET_LANGUAGE;
        this.timeout = ORPHANET_TIMEOUT;
        this.cache = CACHE;

        console.log('🧬 OrphaNet API Service initialized');
        console.log(`   Endpoint: ${this.endpoint}`);
        console.log(`   Language: ${this.language}`);
        console.log(`   Cache: 24h expiration`);
    }

    /**
     * Get disease by Orpha code
     *
     * @param {string|number} orphaCode - Orpha code (e.g., "ORPHA:558", 558)
     * @returns {Promise<Object>} Disease details
     */
    async getDiseaseByOrphaCode(orphaCode) {
        // Normalize Orpha code
        const normalizedCode = orphaCode.toString().replace('ORPHA:', '');
        const cacheKey = `disease_${normalizedCode}`;

        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Note: OrphaNet API requires XML format, we'll simulate JSON response
            // In production, you'd use XML parser like xml2js
            const response = await this.simulateOrphaNetAPI('disease', normalizedCode);

            // Cache result
            this.setCache(cacheKey, response);

            return response;
        } catch (error) {
            console.error(`❌ OrphaNet API error (disease ${orphaCode}):`, error.message);
            throw new Error(`Failed to fetch disease ${orphaCode} from OrphaNet: ${error.message}`);
        }
    }

    /**
     * Search diseases by name or symptoms
     *
     * @param {string} query - Search query (disease name, symptoms, etc.)
     * @param {Object} options - Search options
     * @param {number} options.limit - Maximum results (default: 10)
     * @param {boolean} options.includeDeprecated - Include deprecated diseases (default: false)
     * @returns {Promise<Array>} Matching diseases
     */
    async searchDiseases(query, options = {}) {
        const { limit = 10, includeDeprecated = false } = options;
        const cacheKey = `search_${query}_${limit}_${includeDeprecated}`;

        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Simulate OrphaNet search API
            const results = await this.simulateOrphaNetAPI('search', query, { limit, includeDeprecated });

            // Cache results
            this.setCache(cacheKey, results);

            return results;
        } catch (error) {
            console.error(`❌ OrphaNet search error (query: ${query}):`, error.message);
            throw new Error(`Failed to search OrphaNet: ${error.message}`);
        }
    }

    /**
     * Get clinical signs and symptoms for a disease
     *
     * @param {string|number} orphaCode - Orpha code
     * @returns {Promise<Array>} Clinical signs with frequency
     */
    async getClinicalSigns(orphaCode) {
        const normalizedCode = orphaCode.toString().replace('ORPHA:', '');
        const cacheKey = `clinical_signs_${normalizedCode}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.simulateOrphaNetAPI('clinical_signs', normalizedCode);
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error(`❌ OrphaNet clinical signs error (${orphaCode}):`, error.message);
            return [];
        }
    }

    /**
     * Get prevalence data for a disease
     *
     * @param {string|number} orphaCode - Orpha code
     * @returns {Promise<Object>} Prevalence information
     */
    async getPrevalence(orphaCode) {
        const normalizedCode = orphaCode.toString().replace('ORPHA:', '');
        const cacheKey = `prevalence_${normalizedCode}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.simulateOrphaNetAPI('prevalence', normalizedCode);
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error(`❌ OrphaNet prevalence error (${orphaCode}):`, error.message);
            return null;
        }
    }

    /**
     * Get associated genes for a disease
     *
     * @param {string|number} orphaCode - Orpha code
     * @returns {Promise<Array>} Associated genes
     */
    async getAssociatedGenes(orphaCode) {
        const normalizedCode = orphaCode.toString().replace('ORPHA:', '');
        const cacheKey = `genes_${normalizedCode}`;

        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.simulateOrphaNetAPI('genes', normalizedCode);
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error(`❌ OrphaNet genes error (${orphaCode}):`, error.message);
            return [];
        }
    }

    /**
     * Simulate OrphaNet API (DEMO MODE)
     * In production, this would make real HTTP requests to OrphaNet XML API
     * and parse XML responses using xml2js
     *
     * @private
     */
    async simulateOrphaNetAPI(type, identifier, options = {}) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // OrphaNet sample database (7 diseases as examples)
        const orphaDatabase = {
            '98249': { // Ehlers-Danlos Syndrome
                orphaCode: 'ORPHA:98249',
                name: 'Ehlers-Danlos Syndrome',
                preferredTerm: 'Ehlers-Danlos syndrome',
                synonyms: ['EDS', 'Cutis hyperelastica'],
                definition: 'Ehlers-Danlos syndromes (EDS) are a clinically and genetically heterogeneous group of heritable connective tissue disorders (HCTDs) characterized by joint hypermobility, skin hyperextensibility, and tissue fragility.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-5 / 10 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Autosomal dominant', 'Autosomal recessive', 'X-linked recessive'],
                ageOfOnset: ['Neonatal', 'Infancy', 'Childhood', 'Adolescent', 'Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0001382', hpoTerm: 'Joint hypermobility', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0000974', hpoTerm: 'Hyperextensible skin', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001058', hpoTerm: 'Poor wound healing', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0000978', hpoTerm: 'Bruising susceptibility', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0002829', hpoTerm: 'Arthralgia', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'COL5A1', geneType: 'Disease-causing germline mutation(s) in' },
                    { geneSymbol: 'COL5A2', geneType: 'Disease-causing germline mutation(s) in' },
                    { geneSymbol: 'COL1A1', geneType: 'Disease-causing germline mutation(s) (loss of function) in' }
                ],
                diagnosticCriteria: 'Beighton score ≥5, skin involvement, family history',
                classification: {
                    group: 'Connective tissue disorder',
                    category: 'Rare developmental defect during embryogenesis'
                }
            },
            '324': { // Fabry Disease
                orphaCode: 'ORPHA:324',
                name: 'Fabry Disease',
                preferredTerm: 'Fabry disease',
                synonyms: ['Anderson-Fabry disease', 'Angiokeratoma corporis diffusum'],
                definition: 'Fabry disease is a rare X-linked lysosomal storage disorder characterized by angiokeratoma, acroparesthesia, cornea verticillata, and progressive renal, cardiac, and cerebrovascular disease.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-9 / 100 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['X-linked recessive'],
                ageOfOnset: ['Childhood', 'Adolescent', 'Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0200042', hpoTerm: 'Skin rash', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0012531', hpoTerm: 'Pain', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001297', hpoTerm: 'Stroke', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0000083', hpoTerm: 'Renal insufficiency', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0001639', hpoTerm: 'Hypertrophic cardiomyopathy', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'GLA', geneType: 'Disease-causing germline mutation(s) in' }
                ],
                diagnosticCriteria: 'Decreased α-galactosidase A enzyme activity, GLA gene sequencing',
                classification: {
                    group: 'Lysosomal storage disease',
                    category: 'Rare inborn errors of metabolism'
                }
            },
            '365': { // Pompe Disease
                orphaCode: 'ORPHA:365',
                name: 'Pompe Disease',
                preferredTerm: 'Pompe disease',
                synonyms: ['Glycogen storage disease type 2', 'Acid maltase deficiency', 'GSD type II'],
                definition: 'Pompe disease is a metabolic myopathy characterized by progressive muscle weakness due to glycogen accumulation in lysosomes, caused by deficiency of acid α-glucosidase.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-9 / 100 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Autosomal recessive'],
                ageOfOnset: ['Neonatal', 'Infancy', 'Childhood', 'Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0003701', hpoTerm: 'Proximal muscle weakness', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0002094', hpoTerm: 'Dyspnea', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001639', hpoTerm: 'Hypertrophic cardiomyopathy', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0003457', hpoTerm: 'EMG abnormality', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0003236', hpoTerm: 'Elevated serum creatine kinase', frequency: 'Very frequent (80-99%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'GAA', geneType: 'Disease-causing germline mutation(s) in' }
                ],
                diagnosticCriteria: 'Deficient acid α-glucosidase enzyme, GAA gene sequencing, muscle biopsy',
                classification: {
                    group: 'Glycogen storage disease',
                    category: 'Rare inborn errors of metabolism'
                }
            },
            '355': { // Gaucher Disease
                orphaCode: 'ORPHA:355',
                name: 'Gaucher Disease',
                preferredTerm: 'Gaucher disease',
                synonyms: ['Glucosylceramide lipidosis'],
                definition: 'Gaucher disease is a lysosomal storage disorder characterized by hepatosplenomegaly, anemia, thrombocytopenia, and bone disease.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-9 / 100 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Autosomal recessive'],
                ageOfOnset: ['Neonatal', 'Infancy', 'Childhood', 'Adolescent', 'Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0001744', hpoTerm: 'Splenomegaly', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0002240', hpoTerm: 'Hepatomegaly', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001873', hpoTerm: 'Thrombocytopenia', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001903', hpoTerm: 'Anemia', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0002758', hpoTerm: 'Osteoarthritis', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'GBA', geneType: 'Disease-causing germline mutation(s) in' }
                ],
                diagnosticCriteria: 'Decreased β-glucocerebrosidase activity, GBA gene sequencing',
                classification: {
                    group: 'Lysosomal storage disease',
                    category: 'Rare inborn errors of metabolism'
                }
            },
            '963': { // Marfan Syndrome
                orphaCode: 'ORPHA:963',
                name: 'Marfan Syndrome',
                preferredTerm: 'Marfan syndrome',
                synonyms: ['MFS'],
                definition: 'Marfan syndrome is a systemic connective tissue disorder characterized by skeletal, ocular, and cardiovascular manifestations.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-5 / 10 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Autosomal dominant'],
                ageOfOnset: ['All ages'],
                clinicalSigns: [
                    { hpoId: 'HP:0001166', hpoTerm: 'Arachnodactyly', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0000545', hpoTerm: 'Myopia', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0002636', hpoTerm: 'Aortic root dilatation', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0000767', hpoTerm: 'Pectus excavatum', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0002650', hpoTerm: 'Scoliosis', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'FBN1', geneType: 'Disease-causing germline mutation(s) in' }
                ],
                diagnosticCriteria: 'Ghent nosology criteria (skeletal, ocular, cardiovascular features)',
                classification: {
                    group: 'Connective tissue disorder',
                    category: 'Rare developmental defect during embryogenesis'
                }
            },
            '905': { // Wilson Disease
                orphaCode: 'ORPHA:905',
                name: 'Wilson Disease',
                preferredTerm: 'Wilson disease',
                synonyms: ['Hepatolenticular degeneration'],
                definition: 'Wilson disease is an autosomal recessive disorder of copper metabolism characterized by hepatic disease and/or neuropsychiatric disturbances.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '1-9 / 100 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Autosomal recessive'],
                ageOfOnset: ['Childhood', 'Adolescent', 'Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0001395', hpoTerm: 'Hepatic fibrosis', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0100021', hpoTerm: 'Cerebral palsy', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0000541', hpoTerm: 'Retinal detachment', frequency: 'Occasional (5-29%)' },
                    { hpoId: 'HP:0002172', hpoTerm: 'Postural instability', frequency: 'Frequent (30-79%)' },
                    { hpoId: 'HP:0001332', hpoTerm: 'Dystonia', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'ATP7B', geneType: 'Disease-causing germline mutation(s) in' }
                ],
                diagnosticCriteria: 'Low ceruloplasmin, elevated urinary copper, Kayser-Fleischer rings, liver biopsy',
                classification: {
                    group: 'Disorder of metal metabolism',
                    category: 'Rare inborn errors of metabolism'
                }
            },
            '963': { // Acromegaly
                orphaCode: 'ORPHA:963',
                name: 'Acromegaly',
                preferredTerm: 'Acromegaly',
                synonyms: ['Hyperpituitarism'],
                definition: 'Acromegaly is a disorder caused by excessive growth hormone (GH) secretion from a pituitary adenoma.',
                prevalence: {
                    type: 'Point prevalence',
                    class: '<1 / 1 000 000',
                    geographicArea: 'Europe',
                    validationStatus: 'Validated'
                },
                inheritance: ['Not applicable'],
                ageOfOnset: ['Adult'],
                clinicalSigns: [
                    { hpoId: 'HP:0000256', hpoTerm: 'Macrocephaly', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0000303', hpoTerm: 'Mandibular prognathia', frequency: 'Very frequent (80-99%)' },
                    { hpoId: 'HP:0001249', hpoTerm: 'Intellectual disability', frequency: 'Occasional (5-29%)' },
                    { hpoId: 'HP:0000670', hpoTerm: 'Carious teeth', frequency: 'Occasional (5-29%)' },
                    { hpoId: 'HP:0002829', hpoTerm: 'Arthralgia', frequency: 'Frequent (30-79%)' }
                ],
                associatedGenes: [
                    { geneSymbol: 'AIP', geneType: 'Disease-causing germline mutation(s) (loss of function) in' }
                ],
                diagnosticCriteria: 'Elevated IGF-1, Oral glucose tolerance test (GH >1 ng/mL), MRI pituitary',
                classification: {
                    group: 'Endocrine disorder',
                    category: 'Rare endocrine disease'
                }
            }
        };

        // Handle different API types
        switch (type) {
            case 'disease':
                const disease = orphaDatabase[identifier];
                if (!disease) {
                    throw new Error(`Disease with Orpha code ${identifier} not found in demo database`);
                }
                return disease;

            case 'search':
                const query = identifier.toLowerCase();
                const matches = Object.values(orphaDatabase)
                    .filter(disease => {
                        return disease.name.toLowerCase().includes(query) ||
                               disease.preferredTerm.toLowerCase().includes(query) ||
                               disease.synonyms.some(syn => syn.toLowerCase().includes(query)) ||
                               disease.definition.toLowerCase().includes(query);
                    })
                    .slice(0, options.limit || 10);
                return matches;

            case 'clinical_signs':
                const diseaseForSigns = orphaDatabase[identifier];
                return diseaseForSigns ? diseaseForSigns.clinicalSigns : [];

            case 'prevalence':
                const diseaseForPrevalence = orphaDatabase[identifier];
                return diseaseForPrevalence ? diseaseForPrevalence.prevalence : null;

            case 'genes':
                const diseaseForGenes = orphaDatabase[identifier];
                return diseaseForGenes ? diseaseForGenes.associatedGenes : [];

            default:
                throw new Error(`Unknown OrphaNet API type: ${type}`);
        }
    }

    /**
     * Get item from cache
     * @private
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set item in cache
     * @private
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧬 OrphaNet cache cleared');
    }
}

// Export singleton instance
const orphaNetService = new OrphaNetAPIService();

module.exports = {
    OrphaNetAPIService,
    orphaNetService
};
