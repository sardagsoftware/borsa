/**
 * ⚛️ QUANTUM DIAGNOSTIC ENGINE API
 *
 * Quantum-enhanced medical diagnostics with 50+ qubit capacity
 * Real clinical data integration and molecular simulations
 */

const { QuantumDiagnosticEngine } = require('../../services/quantum-diagnostic-engine');
const { SpecialtyCareEngine } = require('../../services/specialty-care-modules');
const { getCorsOrigin } = require('../_middleware/cors');

const quantumEngine = new QuantumDiagnosticEngine();
const specialtyEngine = new SpecialtyCareEngine();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST /api/quantum-diagnosis/analyze - Perform quantum diagnosis
    if (req.method === 'POST') {
      const { specialty, patientData, symptoms, medicalHistory, clinicalFindings, quantumDevice } =
        req.body;

      // Validate required fields
      if (!specialty || !patientData || !symptoms) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: specialty, patientData, symptoms',
        });
      }

      if (!patientData.age || !patientData.gender) {
        return res.status(400).json({
          success: false,
          error: 'Patient data must include age and gender',
        });
      }

      // Get specialty info
      const specialtyInfo = specialtyEngine.getSpecialtyById(specialty);

      if (!specialtyInfo) {
        return res.status(404).json({
          success: false,
          error: `Specialty not found: ${specialty}`,
        });
      }

      console.log(`⚛️ Quantum Diagnosis Starting for ${specialtyInfo.name.en}`);
      console.log(`   Device: ${quantumDevice || 'ibm_heron'}`);
      console.log(`   Patient: ${patientData.age}y ${patientData.gender}`);

      // Perform quantum diagnosis
      const diagnosis = await quantumEngine.performQuantumDiagnosis(
        patientData,
        {
          symptoms,
          medicalHistory: medicalHistory || '',
          clinicalFindings: clinicalFindings || '',
        },
        specialty,
        quantumDevice || 'ibm_heron'
      );

      console.log(`✅ Diagnosis completed with ${diagnosis.confidence}% confidence`);

      return res.status(200).json({
        success: true,
        specialty: {
          id: specialtyInfo.id,
          name: specialtyInfo.name,
          criticalityLevel: specialtyInfo.criticalityLevel,
        },
        diagnosis,
        timestamp: new Date().toISOString(),
      });
    }

    // GET /api/quantum-diagnosis/devices - List available quantum devices
    if (req.method === 'GET' && req.url.includes('/devices')) {
      return res.status(200).json({
        success: true,
        devices: [
          {
            id: 'cpu',
            name: 'CPU Simulation',
            qubits: 10,
            cost: 0,
            speed: 'Fast',
            accuracy: 'Good',
          },
          {
            id: 'gpu',
            name: 'GPU Accelerated',
            qubits: 20,
            cost: 0.05,
            speed: 'Very Fast',
            accuracy: 'Very Good',
          },
          {
            id: 'mps_gpu',
            name: 'MPS GPU',
            qubits: 30,
            cost: 0.1,
            speed: 'Ultra Fast',
            accuracy: 'Excellent',
          },
          {
            id: 'ibm_heron',
            name: 'IBM Heron',
            qubits: 50,
            cost: 5.0,
            speed: 'Fast',
            accuracy: 'Outstanding',
            recommended: true,
          },
          {
            id: 'quantinuum_h2',
            name: 'Quantinuum H2',
            qubits: 100,
            cost: 25.0,
            speed: 'Medium',
            accuracy: 'Perfect',
          },
        ],
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('❌ Quantum Diagnosis API Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Saglik servisi hatasi. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString(),
    });
  }
};
