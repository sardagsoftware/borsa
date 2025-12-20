/**
 * Azure Health Data Services & AI Configuration
 * Neuro Health Intelligence Backend
 */

const { DefaultAzureCredential } = require('@azure/identity');

// Azure OpenAI Configuration
const AZURE_OPENAI_CONFIG = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://ailydian-openai.openai.azure.com/',
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: '2024-08-01-preview',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT || 'OX7A3F8D',
    visionDeployment: process.env.AZURE_OPENAI_VISION_DEPLOYMENT || 'OX7A3F8D-vision'
};

// Azure Health Data Services Configuration
const AZURE_HEALTH_CONFIG = {
    fhirEndpoint: process.env.AZURE_FHIR_ENDPOINT || 'https://ailydian-health.fhir.azurehealthcareapis.com',
    dicomEndpoint: process.env.AZURE_DICOM_ENDPOINT || 'https://ailydian-health.dicom.azurehealthcareapis.com',
    workspaceId: process.env.AZURE_HEALTH_WORKSPACE_ID,
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
};

// Azure Machine Learning Configuration
const AZURE_ML_CONFIG = {
    endpoint: process.env.AZURE_ML_ENDPOINT || 'https://ailydian-ml.westeurope.inference.ml.azure.com',
    apiKey: process.env.AZURE_ML_API_KEY,
    workspaceName: process.env.AZURE_ML_WORKSPACE || 'ailydian-ml-workspace',
    neuroTwinModel: process.env.AZURE_ML_NEUROTWIN_MODEL || 'neuro-twin-v1'
};

// Azure Cognitive Search Configuration (for RAG)
const AZURE_SEARCH_CONFIG = {
    endpoint: process.env.AZURE_SEARCH_ENDPOINT || 'https://ailydian-search.search.windows.net',
    apiKey: process.env.AZURE_SEARCH_API_KEY,
    indexName: process.env.AZURE_SEARCH_INDEX || 'medical-literature',
    pubmedIndex: 'pubmed-citations',
    whoIndex: 'who-guidelines'
};

// Authentication Helper
async function getAzureCredential() {
    if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
        // Service Principal authentication (production)
        return new DefaultAzureCredential();
    } else {
        // Development mode - return null, will use API keys
        return null;
    }
}

// FHIR Resource Templates
const FHIR_TEMPLATES = {
    Patient: {
        resourceType: 'Patient',
        meta: {
            profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
        }
    },
    Observation: {
        resourceType: 'Observation',
        meta: {
            profile: ['http://hl7.org/fhir/StructureDefinition/vitalsigns']
        },
        status: 'final'
    },
    ImagingStudy: {
        resourceType: 'ImagingStudy',
        status: 'available'
    },
    DiagnosticReport: {
        resourceType: 'DiagnosticReport',
        status: 'final',
        category: [{
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'RAD',
                display: 'Radiology'
            }]
        }]
    }
};

// De-identification Helper (SHA-256)
const crypto = require('crypto');

function deIdentifyPatientData(patientData) {
    const hash = crypto.createHash('sha256');
    const identifier = `${patientData.name || ''}${patientData.birthDate || ''}${patientData.mrn || ''}${Date.now()}`;
    hash.update(identifier);
    return `SHA256-${hash.digest('hex').substring(0, 16)}`;
}

// Differential Privacy Noise (ε=0.5)
function addDifferentialPrivacyNoise(value, epsilon = 0.5, sensitivity = 1) {
    const scale = sensitivity / epsilon;
    // Laplace noise
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
}

// HIPAA Compliance Check
function validateHIPAACompliance(data) {
    const phi_fields = ['name', 'ssn', 'email', 'phone', 'address', 'mrn', 'accountNumber'];
    const violations = [];

    for (const field of phi_fields) {
        if (data[field] && typeof data[field] === 'string' && data[field].length > 0) {
            violations.push(`PHI field '${field}' must be de-identified`);
        }
    }

    return {
        compliant: violations.length === 0,
        violations
    };
}

// Error Obfuscation
function createSecureError(internalError) {
    const errorCode = `NEURO_${Date.now().toString(36).toUpperCase()}`;
    console.error(`[${errorCode}] Internal error:`, internalError);

    return {
        error: 'Service temporarily unavailable',
        code: errorCode,
        message: 'Please try again later or contact support',
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    AZURE_OPENAI_CONFIG,
    AZURE_HEALTH_CONFIG,
    AZURE_ML_CONFIG,
    AZURE_SEARCH_CONFIG,
    FHIR_TEMPLATES,
    getAzureCredential,
    deIdentifyPatientData,
    addDifferentialPrivacyNoise,
    validateHIPAACompliance,
    createSecureError
};
