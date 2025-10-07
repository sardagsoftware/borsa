/**
 * LyDian Medical AI - Epic FHIR Integration Module
 * FHIR R4 integration for EHR interoperability
 */

const EpicFHIR = {
    connected: false,
    clientId: null,
    accessToken: null,
    tokenExpiry: null,
    baseURL: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',

    // ============================================
    // CONNECTION & AUTHENTICATION
    // ============================================
    async connect(credentials) {
        try {
            const { clientId, clientSecret, fhirBaseURL } = credentials;

            // Store credentials
            this.clientId = clientId;
            if (fhirBaseURL) {
                this.baseURL = fhirBaseURL;
            }

            // Call backend to handle OAuth flow
            const result = await MedicalAPI.connectEpicFHIR(credentials);

            if (result.success) {
                this.connected = true;
                this.accessToken = result.accessToken;
                this.tokenExpiry = result.expiresAt;

                // Save to state
                window.MedicalState.fhirConnected = true;
                window.MedicalState.save();

                MedicalUI.showToast('Successfully connected to Epic FHIR', 'success');
                return true;
            }

            return false;
        } catch (error) {
            console.error('FHIR connection error:', error);
            MedicalUI.showToast('Failed to connect to Epic FHIR', 'error');
            return false;
        }
    },

    disconnect() {
        this.connected = false;
        this.accessToken = null;
        this.tokenExpiry = null;
        window.MedicalState.fhirConnected = false;
        window.MedicalState.save();
        MedicalUI.showToast('Disconnected from Epic FHIR', 'info');
    },

    isConnected() {
        if (!this.connected || !this.accessToken) {
            return false;
        }

        // Check if token is expired
        if (this.tokenExpiry && new Date(this.tokenExpiry) < new Date()) {
            this.disconnect();
            return false;
        }

        return true;
    },

    // ============================================
    // PATIENT DATA RETRIEVAL
    // ============================================
    async fetchPatient(patientId) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const result = await MedicalAPI.fetchPatientData(patientId);

            if (result.success) {
                // Store patient data in state
                window.MedicalState.currentPatient = {
                    id: result.patient.id,
                    name: result.patient.name,
                    birthDate: result.patient.birthDate,
                    gender: result.patient.gender,
                    mrn: result.patient.identifier
                };
                window.MedicalState.save();

                return result.patient;
            }

            throw new Error(result.error || 'Failed to fetch patient data');
        } catch (error) {
            console.error('Error fetching patient:', error);
            throw error;
        }
    },

    async searchPatients(searchParams) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const result = await fetch(`${this.baseURL}/Patient?${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (!result.ok) {
                throw new Error(`FHIR API error: ${result.status}`);
            }

            const data = await result.json();
            return data.entry ? data.entry.map(e => e.resource) : [];
        } catch (error) {
            console.error('Error searching patients:', error);
            throw error;
        }
    },

    // ============================================
    // CONDITION & DIAGNOSIS RETRIEVAL
    // ============================================
    async fetchConditions(patientId) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const result = await MedicalAPI.searchConditions(patientId);

            if (result.success) {
                return result.conditions;
            }

            throw new Error(result.error || 'Failed to fetch conditions');
        } catch (error) {
            console.error('Error fetching conditions:', error);
            throw error;
        }
    },

    // ============================================
    // MEDICATION & ALLERGIES
    // ============================================
    async fetchMedications(patientId) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const result = await fetch(`${this.baseURL}/MedicationRequest?patient=${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (!result.ok) {
                throw new Error(`FHIR API error: ${result.status}`);
            }

            const data = await result.json();
            return data.entry ? data.entry.map(e => e.resource) : [];
        } catch (error) {
            console.error('Error fetching medications:', error);
            throw error;
        }
    },

    async fetchAllergies(patientId) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const result = await fetch(`${this.baseURL}/AllergyIntolerance?patient=${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (!result.ok) {
                throw new Error(`FHIR API error: ${result.status}`);
            }

            const data = await result.json();
            return data.entry ? data.entry.map(e => e.resource) : [];
        } catch (error) {
            console.error('Error fetching allergies:', error);
            throw error;
        }
    },

    // ============================================
    // OBSERVATIONS & LAB RESULTS
    // ============================================
    async fetchObservations(patientId, category = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            let url = `${this.baseURL}/Observation?patient=${patientId}`;
            if (category) {
                url += `&category=${category}`;
            }

            const result = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (!result.ok) {
                throw new Error(`FHIR API error: ${result.status}`);
            }

            const data = await result.json();
            return data.entry ? data.entry.map(e => e.resource) : [];
        } catch (error) {
            console.error('Error fetching observations:', error);
            throw error;
        }
    },

    // ============================================
    // DIAGNOSTIC REPORTS
    // ============================================
    async fetchDiagnosticReports(patientId) {
        if (!this.isConnected()) {
            throw new Error('Not connected to FHIR server');
        }

        try {
            const result = await fetch(`${this.baseURL}/DiagnosticReport?patient=${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (!result.ok) {
                throw new Error(`FHIR API error: ${result.status}`);
            }

            const data = await result.json();
            return data.entry ? data.entry.map(e => e.resource) : [];
        } catch (error) {
            console.error('Error fetching diagnostic reports:', error);
            throw error;
        }
    },

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    extractPatientName(nameArray) {
        if (!nameArray || nameArray.length === 0) return 'Unknown';

        const name = nameArray[0];
        const given = name.given ? name.given.join(' ') : '';
        const family = name.family || '';

        return `${given} ${family}`.trim();
    },

    formatFHIRDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    extractIdentifier(identifierArray, system = null) {
        if (!identifierArray || identifierArray.length === 0) return null;

        if (system) {
            const found = identifierArray.find(id => id.system === system);
            return found ? found.value : null;
        }

        return identifierArray[0].value;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.EpicFHIR = EpicFHIR;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpicFHIR;
}
