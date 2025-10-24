/**
 * LyDian Medical AI - API Client Module
 * Centralized API communication for all medical services
 */

const MedicalAPI = {
    baseURL: '/api',
    timeout: 30000,

    // Generic fetch wrapper with error handling
    async request(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    },

    // ============================================
    // CHAT & CONVERSATION APIs
    // ============================================
    async sendChatMessage(message, specialization = 'general-medicine') {
        return this.request('/medical/chat-azure-openai', {
            method: 'POST',
            body: JSON.stringify({
                message,
                specialization,
                temperature: window.MedicalState?.hospitalSettings?.aiTemperature || 0.3,
                maxTokens: window.MedicalState?.hospitalSettings?.maxTokens || 800
            })
        });
    },

    // ============================================
    // MEDICAL IMAGING APIs
    // ============================================
    async analyzeImage(imageFile, analysisType) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('analysisType', analysisType);

        return fetch(`${this.baseURL}/medical/image-analysis`, {
            method: 'POST',
            body: formData
        }).then(res => res.json());
    },

    async analyzeDICOM(dicomFile, modality) {
        const formData = new FormData();
        formData.append('dicom', dicomFile);
        formData.append('modality', modality);

        return fetch(`${this.baseURL}/medical/dicom-api`, {
            method: 'POST',
            body: formData
        }).then(res => res.json());
    },

    // ============================================
    // NEUROLOGY APIs
    // ============================================
    async analyzeNeuroImaging(imageFile, modality, analysisType) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('modality', modality);
        formData.append('analysisType', analysisType);

        return fetch(`${this.baseURL}/neuro/imaging-analysis`, {
            method: 'POST',
            body: formData
        }).then(res => res.json());
    },

    async calculateNeuroHealthIndex(data) {
        return this.request('/neuro/health-index', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async assessNeuroRisk(data) {
        return this.request('/neuro/risk-assessment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async generateDigitalNeuroTwin(data) {
        return this.request('/neuro/digital-twin', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // ============================================
    // CARDIOLOGY APIs
    // ============================================
    async calculateFraminghamRisk(data) {
        return this.request('/medical/cardiology-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'framinghamRisk',
                ...data
            })
        });
    },

    async calculateCHADS2Score(data) {
        return this.request('/medical/cardiology-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'chads2Score',
                ...data
            })
        });
    },

    // ============================================
    // ONCOLOGY APIs
    // ============================================
    async analyzeTumorBiomarkers(data) {
        return this.request('/medical/oncology-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'biomarkerAnalysis',
                ...data
            })
        });
    },

    async calculateTNMStaging(data) {
        return this.request('/medical/oncology-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'tnmStaging',
                ...data
            })
        });
    },

    // ============================================
    // GENOMICS & PRECISION MEDICINE APIs
    // ============================================
    async interpretVariant(data) {
        return this.request('/medical/genomics/variant-interpretation', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async analyzePharmacogenomics(data) {
        return this.request('/medical/genomics/pharmacogenomics', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async assessDiseaseRisk(data) {
        return this.request('/medical/genomics/disease-risk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // ============================================
    // CLINICAL DECISION SUPPORT APIs
    // ============================================
    async getDifferentialDiagnosis(data) {
        return this.request('/medical/clinical-decision/differential-diagnosis', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getTreatmentProtocol(data) {
        return this.request('/medical/clinical-decision/treatment-protocol', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async checkDrugInteractions(medications) {
        return this.request('/medical/clinical-decision/drug-interactions', {
            method: 'POST',
            body: JSON.stringify({ medications })
        });
    },

    // ============================================
    // PEDIATRICS APIs
    // ============================================
    async calculateGrowthPercentiles(data) {
        return this.request('/medical/pediatrics-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'growthPercentiles',
                ...data
            })
        });
    },

    async assessDevelopmentalMilestones(data) {
        return this.request('/medical/pediatrics-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'developmentalMilestones',
                ...data
            })
        });
    },

    // ============================================
    // EMERGENCY MEDICINE APIs
    // ============================================
    async getEmergencyNumbers(country = 'US') {
        return this.request(`/medical/emergency-numbers?country=${country}`, {
            method: 'GET'
        });
    },

    async triagePatient(data) {
        return this.request('/medical/emergency-tools', {
            method: 'POST',
            body: JSON.stringify({
                action: 'triage',
                ...data
            })
        });
    },

    // ============================================
    // FHIR INTEGRATION APIs
    // ============================================
    async connectEpicFHIR(credentials) {
        return this.request('/medical/fhir-api', {
            method: 'POST',
            body: JSON.stringify({
                action: 'connect',
                ...credentials
            })
        });
    },

    async fetchPatientData(patientId) {
        return this.request('/medical/fhir-api', {
            method: 'POST',
            body: JSON.stringify({
                action: 'fetchPatient',
                patientId
            })
        });
    },

    async searchConditions(query) {
        return this.request('/medical/fhir-api', {
            method: 'POST',
            body: JSON.stringify({
                action: 'searchConditions',
                query
            })
        });
    },

    // ============================================
    // SPEECH & TRANSCRIPTION APIs
    // ============================================
    async transcribeMedicalAudio(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob);

        return fetch(`${this.baseURL}/medical/speech-transcription`, {
            method: 'POST',
            body: formData
        }).then(res => res.json());
    },

    // ============================================
    // RAG DIAGNOSIS APIs
    // ============================================
    async searchMedicalKnowledge(query, filters = {}) {
        return this.request('/medical/rag-search-api', {
            method: 'POST',
            body: JSON.stringify({
                query,
                filters
            })
        });
    },

    async getDiagnosisSuggestions(symptoms, patientData) {
        return this.request('/medical/rag-diagnosis', {
            method: 'POST',
            body: JSON.stringify({
                symptoms,
                patientData
            })
        });
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MedicalAPI = MedicalAPI;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalAPI;
}
