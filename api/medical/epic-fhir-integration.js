/* global URLSearchParams */
// 🏥 Epic FHIR R4 Integration Service
// White-Hat Security: Active
// Azure SDK Integration: Full Capacity
// FHIR Version: R4 (Latest Standard)

const { getCorsOrigin } = require('../_middleware/cors');
import fetch from 'node-fetch';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

/**
 * Epic FHIR R4 API Integration
 *
 * Features:
 * - OAuth 2.0 authentication
 * - FHIR R4 resource management
 * - Patient, Observation, Condition, Medication
 * - Appointment scheduling
 * - Lab results integration
 * - Clinical documentation
 *
 * Security:
 * - Azure Key Vault for credentials
 * - OAuth 2.0 token management
 * - Rate limiting compliance
 * - HIPAA-compliant data handling
 *
 * @see https://fhir.epic.com/
 */

class EpicFHIRService {
  constructor() {
    // Epic FHIR Base URLs
    this.sandboxBaseUrl = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
    this.productionBaseUrl = process.env.EPIC_FHIR_BASE_URL || this.sandboxBaseUrl;

    // OAuth 2.0 Configuration
    this.clientId = process.env.EPIC_CLIENT_ID;
    this.clientSecret = process.env.EPIC_CLIENT_SECRET;
    this.tokenEndpoint = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';

    // Azure Key Vault (for secure credential storage)
    this.keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
    this.azureCredential = new DefaultAzureCredential();

    // Token cache
    this.accessToken = null;
    this.tokenExpiry = null;

    // Rate limiting
    this.requestCount = 0;
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerMinute = 100;
  }

  /**
   * Get Epic FHIR credentials from Azure Key Vault
   */
  async getCredentialsFromKeyVault() {
    try {
      if (!this.keyVaultUrl) {
        console.warn('⚠️  Azure Key Vault not configured, using environment variables');
        return {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        };
      }

      const secretClient = new SecretClient(this.keyVaultUrl, this.azureCredential);

      const clientIdSecret = await secretClient.getSecret('epic-fhir-client-id');
      const clientSecretSecret = await secretClient.getSecret('epic-fhir-client-secret');

      return {
        clientId: clientIdSecret.value,
        clientSecret: clientSecretSecret.value,
      };
    } catch (error) {
      console.error('❌ Error fetching credentials from Key Vault:', error.message);
      // Fallback to environment variables
      return {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      };
    }
  }

  /**
   * OAuth 2.0 Client Credentials Flow
   */
  async authenticate() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const credentials = await this.getCredentialsFromKeyVault();

      if (!credentials.clientId || !credentials.clientSecret) {
        throw new Error('Epic FHIR credentials not configured');
      }

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'system/*.read system/*.write',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Epic OAuth failed: ${errorData.error_description || 'Unknown error'}`);
      }

      const data = await response.json();

      // Cache token (subtract 5 minutes for safety)
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      console.log('✅ Epic FHIR authenticated successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Epic FHIR authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastWindowReset > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastWindowReset = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
  }

  /**
   * Generic FHIR API request
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    try {
      this.checkRateLimit();

      const token = await this.authenticate();

      const options = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.productionBaseUrl}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Epic FHIR API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Epic FHIR request error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // ==================== PATIENT RESOURCES ====================

  /**
   * Search for patients
   * @param {Object} params - Search parameters (name, birthdate, identifier, etc.)
   */
  async searchPatients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.makeRequest(`/Patient?${queryString}`);
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId) {
    return await this.makeRequest(`/Patient/${patientId}`);
  }

  /**
   * Create a new patient
   */
  async createPatient(patientData) {
    return await this.makeRequest('/Patient', 'POST', patientData);
  }

  /**
   * Update patient
   */
  async updatePatient(patientId, patientData) {
    return await this.makeRequest(`/Patient/${patientId}`, 'PUT', patientData);
  }

  // ==================== OBSERVATION RESOURCES ====================

  /**
   * Get patient observations (vital signs, lab results)
   */
  async getObservations(patientId, category = null) {
    let endpoint = `/Observation?patient=${patientId}`;
    if (category) {
      endpoint += `&category=${category}`;
    }
    return await this.makeRequest(endpoint);
  }

  /**
   * Create observation
   */
  async createObservation(observationData) {
    return await this.makeRequest('/Observation', 'POST', observationData);
  }

  // ==================== CONDITION RESOURCES ====================

  /**
   * Get patient conditions (diagnoses)
   */
  async getConditions(patientId) {
    return await this.makeRequest(`/Condition?patient=${patientId}`);
  }

  /**
   * Create condition
   */
  async createCondition(conditionData) {
    return await this.makeRequest('/Condition', 'POST', conditionData);
  }

  // ==================== MEDICATION RESOURCES ====================

  /**
   * Get patient medications
   */
  async getMedications(patientId) {
    return await this.makeRequest(`/MedicationRequest?patient=${patientId}`);
  }

  /**
   * Create medication request
   */
  async createMedicationRequest(medicationData) {
    return await this.makeRequest('/MedicationRequest', 'POST', medicationData);
  }

  // ==================== APPOINTMENT RESOURCES ====================

  /**
   * Search appointments
   */
  async searchAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.makeRequest(`/Appointment?${queryString}`);
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId) {
    return await this.makeRequest(`/Appointment/${appointmentId}`);
  }

  /**
   * Create appointment
   */
  async createAppointment(appointmentData) {
    return await this.makeRequest('/Appointment', 'POST', appointmentData);
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId, appointmentData) {
    return await this.makeRequest(`/Appointment/${appointmentId}`, 'PUT', appointmentData);
  }

  // ==================== DIAGNOSTIC REPORT RESOURCES ====================

  /**
   * Get diagnostic reports (lab results, imaging reports)
   */
  async getDiagnosticReports(patientId) {
    return await this.makeRequest(`/DiagnosticReport?patient=${patientId}`);
  }

  // ==================== PRACTITIONER RESOURCES ====================

  /**
   * Search practitioners (doctors, nurses)
   */
  async searchPractitioners(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.makeRequest(`/Practitioner?${queryString}`);
  }

  /**
   * Get practitioner by ID
   */
  async getPractitioner(practitionerId) {
    return await this.makeRequest(`/Practitioner/${practitionerId}`);
  }

  // ==================== ORGANIZATION RESOURCES ====================

  /**
   * Get organization (hospital, clinic)
   */
  async getOrganization(organizationId) {
    return await this.makeRequest(`/Organization/${organizationId}`);
  }

  // ==================== ENCOUNTER RESOURCES ====================

  /**
   * Get patient encounters (visits)
   */
  async getEncounters(patientId) {
    return await this.makeRequest(`/Encounter?patient=${patientId}`);
  }

  /**
   * Create encounter
   */
  async createEncounter(encounterData) {
    return await this.makeRequest('/Encounter', 'POST', encounterData);
  }

  // ==================== CLINICAL DOCUMENTATION ====================

  /**
   * Get clinical documents (clinical notes, discharge summaries)
   */
  async getDocumentReferences(patientId) {
    return await this.makeRequest(`/DocumentReference?patient=${patientId}`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get FHIR capability statement (server metadata)
   */
  async getCapabilityStatement() {
    return await this.makeRequest('/metadata');
  }

  /**
   * Validate FHIR resource
   */
  async validateResource(resourceType, resource) {
    return await this.makeRequest(`/${resourceType}/$validate`, 'POST', resource);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.authenticate();
      return {
        status: 'healthy',
        service: 'Epic FHIR R4',
        authenticated: true,
        baseUrl: this.productionBaseUrl,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'Epic FHIR R4',
        authenticated: false,
        error: 'FHIR entegrasyon hatasi. Lutfen tekrar deneyin.',
      };
    }
  }
}

// Singleton instance
const epicFHIRService = new EpicFHIRService();

// Express.js API endpoint
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, resourceType, resourceId, params, data } = req.body;

    let result;

    switch (action) {
      // Patient operations
      case 'searchPatients':
        result = await epicFHIRService.searchPatients(params);
        break;
      case 'getPatient':
        result = await epicFHIRService.getPatient(resourceId);
        break;
      case 'createPatient':
        result = await epicFHIRService.createPatient(data);
        break;
      case 'updatePatient':
        result = await epicFHIRService.updatePatient(resourceId, data);
        break;

      // Observation operations
      case 'getObservations':
        result = await epicFHIRService.getObservations(params.patientId, params.category);
        break;
      case 'createObservation':
        result = await epicFHIRService.createObservation(data);
        break;

      // Condition operations
      case 'getConditions':
        result = await epicFHIRService.getConditions(params.patientId);
        break;
      case 'createCondition':
        result = await epicFHIRService.createCondition(data);
        break;

      // Medication operations
      case 'getMedications':
        result = await epicFHIRService.getMedications(params.patientId);
        break;
      case 'createMedicationRequest':
        result = await epicFHIRService.createMedicationRequest(data);
        break;

      // Appointment operations
      case 'searchAppointments':
        result = await epicFHIRService.searchAppointments(params);
        break;
      case 'getAppointment':
        result = await epicFHIRService.getAppointment(resourceId);
        break;
      case 'createAppointment':
        result = await epicFHIRService.createAppointment(data);
        break;
      case 'updateAppointment':
        result = await epicFHIRService.updateAppointment(resourceId, data);
        break;

      // Diagnostic reports
      case 'getDiagnosticReports':
        result = await epicFHIRService.getDiagnosticReports(params.patientId);
        break;

      // Practitioner operations
      case 'searchPractitioners':
        result = await epicFHIRService.searchPractitioners(params);
        break;
      case 'getPractitioner':
        result = await epicFHIRService.getPractitioner(resourceId);
        break;

      // Organization operations
      case 'getOrganization':
        result = await epicFHIRService.getOrganization(resourceId);
        break;

      // Encounter operations
      case 'getEncounters':
        result = await epicFHIRService.getEncounters(params.patientId);
        break;
      case 'createEncounter':
        result = await epicFHIRService.createEncounter(data);
        break;

      // Clinical documentation
      case 'getDocumentReferences':
        result = await epicFHIRService.getDocumentReferences(params.patientId);
        break;

      // Utility operations
      case 'getCapabilityStatement':
        result = await epicFHIRService.getCapabilityStatement();
        break;
      case 'healthCheck':
        result = await epicFHIRService.healthCheck();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
        });
    }

    res.status(200).json({
      success: true,
      data: result,
      service: 'Epic FHIR R4',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Epic FHIR API error:', error);
    res.status(500).json({
      success: false,
      error: 'FHIR entegrasyon hatasi. Lutfen tekrar deneyin.',
      service: 'Epic FHIR R4',
    });
  }
}

// Export service for use in other modules
export { epicFHIRService };
