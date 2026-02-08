/**
 * ============================================
 * USA EARLY DIAGNOSIS API ENDPOINT
 * ============================================
 * Serverless function for US-specific medical analysis
 * ============================================
 */

const { getCorsOrigin } = require('../_middleware/cors');
const {
  EarlyDiagnosisOrchestrator,
  NIHClinicalTrialsMatcher,
  FDATreatmentDatabase,
  SDOHAnalyzer
} = require('./usa-early-diagnosis');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const { action, patientData } = req.body;

    let result;

    switch (action) {
      case 'COMPREHENSIVE_ANALYSIS':
        result = await EarlyDiagnosisOrchestrator.analyzePatientForEarlyDiagnosis(patientData);
        break;

      case 'CLINICAL_TRIALS':
        result = await NIHClinicalTrialsMatcher.findRelevantTrials(
          patientData.condition,
          patientData.state,
          patientData.diseaseStage
        );
        break;

      case 'FDA_TREATMENTS':
        result = await FDATreatmentDatabase.getFDAApprovedTreatments(
          patientData.condition,
          patientData.yearApproved
        );
        break;

      case 'SDOH_ANALYSIS':
        result = await SDOHAnalyzer.analyzeSDOH(patientData);
        break;

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: [
            'COMPREHENSIVE_ANALYSIS',
            'CLINICAL_TRIALS',
            'FDA_TREATMENTS',
            'SDOH_ANALYSIS'
          ]
        });
    }

    res.status(200).json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
      apiVersion: '1.0.0',
      compliance: ['HIPAA', 'CDC', 'FDA', 'NIH', 'USPSTF']
    });

  } catch (error) {
    console.error('USA Diagnosis API Error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
