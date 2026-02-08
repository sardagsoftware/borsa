/**
 * 🏥 MAYO CLINIC LEVEL SPECIALTY CARE API
 *
 * Premium specialty care endpoint for 14 world-class medical specialties
 * Integrated with quantum diagnostics and AI-powered analysis
 */

const { SpecialtyCareEngine } = require('../../services/specialty-care-modules');
const { getCorsOrigin } = require('../_middleware/cors');

const specialtyCareEngine = new SpecialtyCareEngine();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/specialty-care/list - List all specialties
    if (req.method === 'GET') {
      const specialties = specialtyCareEngine.getAllSpecialties();

      return res.status(200).json({
        success: true,
        specialties: specialties.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          criticalityLevel: s.criticalityLevel,
          aiModels: s.aiModels,
          quantumFeatures: s.quantumFeatures,
          requiredExpertise: s.requiredExpertise
        })),
        total: specialties.length,
        timestamp: new Date().toISOString()
      });
    }

    // POST /api/specialty-care/analyze - Analyze patient case
    if (req.method === 'POST') {
      const { specialtyId, patientData, symptoms, medicalHistory } = req.body;

      if (!specialtyId || !patientData || !symptoms) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: specialtyId, patientData, symptoms'
        });
      }

      // Get specialty
      const specialty = specialtyCareEngine.getSpecialtyById(specialtyId);

      if (!specialty) {
        return res.status(404).json({
          success: false,
          error: `Specialty not found: ${specialtyId}`
        });
      }

      // Perform analysis
      const analysis = await specialtyCareEngine.analyzePatientCase(
        patientData,
        symptoms,
        medicalHistory || ''
      );

      return res.status(200).json({
        success: true,
        specialty: {
          id: specialty.id,
          name: specialty.name,
          criticalityLevel: specialty.criticalityLevel
        },
        analysis,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Specialty Care API Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
