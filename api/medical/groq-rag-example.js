/**
 * GROQ MEDICAL DOCUMENT RAG - USAGE EXAMPLES
 *
 * This file demonstrates how to use the Groq RAG API for medical document analysis
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_ENDPOINT = 'http://localhost:3100/api/medical/groq-rag';

/**
 * Example 1: Analyze medical document from text
 */
async function example1_TextAnalysis() {
  console.log('\n=== Example 1: Text Analysis ===\n');

  const medicalDocument = `
PATIENT MEDICAL RECORD

Patient: John Doe
Date: 2024-12-15
Provider: Dr. Sarah Johnson, MD

CHIEF COMPLAINT:
Patient presents with persistent chest pain and shortness of breath for the past 3 days.

VITAL SIGNS:
- Blood Pressure: 145/92 mmHg (elevated)
- Heart Rate: 98 bpm
- Respiratory Rate: 22 breaths/min
- Temperature: 37.2°C
- SpO2: 94% on room air

HISTORY OF PRESENT ILLNESS:
65-year-old male with history of hypertension and type 2 diabetes mellitus presents with
retrosternal chest pain that radiates to left arm. Pain is described as pressure-like,
rated 7/10, associated with dyspnea on exertion. Symptoms worsen with activity and
improve with rest. Patient also reports episodes of diaphoresis and nausea.

PAST MEDICAL HISTORY:
- Hypertension (diagnosed 2018)
- Type 2 Diabetes Mellitus (diagnosed 2020)
- Hyperlipidemia
- Former smoker (quit 2019)

CURRENT MEDICATIONS:
1. Lisinopril 20mg PO daily - for hypertension
2. Metformin 1000mg PO twice daily - for diabetes
3. Atorvastatin 40mg PO at bedtime - for hyperlipidemia
4. Aspirin 81mg PO daily - cardioprotective

LABORATORY RESULTS:
- Troponin I: 0.8 ng/mL (elevated, normal <0.04)
- CK-MB: 25 U/L (elevated)
- Glucose: 165 mg/dL (elevated)
- HbA1c: 7.8% (suboptimal control)
- Total Cholesterol: 220 mg/dL
- LDL: 145 mg/dL (elevated)
- HDL: 38 mg/dL (low)
- Creatinine: 1.1 mg/dL (normal)

ECG FINDINGS:
ST-segment depression in leads II, III, and aVF. T-wave inversions in lateral leads.
Findings suggestive of myocardial ischemia.

ASSESSMENT:
1. Acute Coronary Syndrome (ACS) - NSTEMI suspected
2. Uncontrolled hypertension
3. Suboptimal glycemic control
4. Dyslipidemia

PLAN:
1. Admit to cardiac care unit for monitoring
2. Start dual antiplatelet therapy (Aspirin + Clopidogrel)
3. Initiate heparin drip
4. Schedule urgent cardiology consultation
5. Consider cardiac catheterization within 24 hours
6. Optimize blood pressure and glucose control
7. Patient education on cardiac risk factors
8. Strict bed rest with continuous cardiac monitoring

RISK STRATIFICATION:
High risk for major adverse cardiac events. Immediate intervention required.

Dr. Sarah Johnson, MD
Board Certified - Internal Medicine & Cardiology
License #: MD-123456
  `;

  const formData = new FormData();
  formData.append('documentText', medicalDocument);
  formData.append('model', 'llama-3.3-70b-versatile');
  formData.append('language', 'en');

  try {
    const response = await axios.post(API_ENDPOINT, formData, {
      headers: formData.getHeaders()
    });

    console.log('Analysis Results:');
    console.log('Summary:', response.data.summary);
    console.log('\nKey Findings:', JSON.stringify(response.data.keyFindings, null, 2));
    console.log('\nDiagnoses:', JSON.stringify(response.data.diagnoses, null, 2));
    console.log('\nMedications:', JSON.stringify(response.data.medications, null, 2));
    console.log('\nRisk Factors:', JSON.stringify(response.data.riskFactors, null, 2));
    console.log('\nRecommendations:', JSON.stringify(response.data.recommendations, null, 2));
    console.log('\nProcessing Time:', response.data.metadata.totalProcessingTimeMs, 'ms');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 2: Analyze PDF medical document
 */
async function example2_PDFAnalysis(pdfPath) {
  console.log('\n=== Example 2: PDF Analysis ===\n');

  if (!fs.existsSync(pdfPath)) {
    console.log('PDF file not found. Skipping PDF example.');
    return;
  }

  const formData = new FormData();
  formData.append('document', fs.createReadStream(pdfPath));
  formData.append('model', 'llama-3.3-70b-versatile');
  formData.append('patientContext', 'Patient has history of cardiac issues');

  try {
    const response = await axios.post(API_ENDPOINT, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    console.log('PDF Analysis Results:');
    console.log('Summary:', response.data.summary);
    console.log('\nTotal Findings:', response.data.qualityMetrics.totalFindings);
    console.log('Critical Findings:', response.data.qualityMetrics.criticalFindings);
    console.log('Diagnoses:', response.data.qualityMetrics.diagnosisCount);
    console.log('\nProcessing Time:', response.data.metadata.totalProcessingTimeMs, 'ms');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 3: Analyze lab report with different model
 */
async function example3_LabReportAnalysis() {
  console.log('\n=== Example 3: Lab Report Analysis (Mixtral Model) ===\n');

  const labReport = `
COMPREHENSIVE METABOLIC PANEL
Patient: Jane Smith
Date: 2024-12-18
Ordering Physician: Dr. Michael Chen

RESULTS:

Glucose: 210 mg/dL (H) [Reference: 70-100 mg/dL]
BUN: 28 mg/dL (H) [Reference: 7-20 mg/dL]
Creatinine: 1.8 mg/dL (H) [Reference: 0.6-1.2 mg/dL]
eGFR: 42 mL/min/1.73m2 (L) [Reference: >60]
Sodium: 138 mEq/L [Reference: 136-145]
Potassium: 5.2 mEq/L (H) [Reference: 3.5-5.0]
Chloride: 102 mEq/L [Reference: 98-107]
CO2: 22 mEq/L [Reference: 23-29]
Calcium: 9.8 mg/dL [Reference: 8.5-10.5]
Total Protein: 7.2 g/dL [Reference: 6.0-8.3]
Albumin: 3.8 g/dL [Reference: 3.5-5.5]
AST: 42 U/L (H) [Reference: 10-40]
ALT: 38 U/L [Reference: 10-40]
Alkaline Phosphatase: 95 U/L [Reference: 30-120]
Total Bilirubin: 0.9 mg/dL [Reference: 0.1-1.2]

LIPID PANEL:
Total Cholesterol: 245 mg/dL (H)
LDL Cholesterol: 165 mg/dL (H)
HDL Cholesterol: 35 mg/dL (L)
Triglycerides: 225 mg/dL (H)

HbA1c: 8.9% (H) [Reference: <5.7%]

CLINICAL INTERPRETATION:
Findings consistent with:
1. Poorly controlled diabetes mellitus
2. Chronic kidney disease (CKD) Stage 3
3. Dyslipidemia
4. Possible metabolic syndrome

RECOMMENDATIONS:
- Nephrology consultation recommended
- Diabetes management optimization required
- Lipid-lowering therapy consideration
- Repeat labs in 3 months
  `;

  const formData = new FormData();
  formData.append('documentText', labReport);
  formData.append('model', 'mixtral-8x7b'); // Using Mixtral for structured data
  formData.append('analysisType', 'focused');

  try {
    const response = await axios.post(API_ENDPOINT, formData, {
      headers: formData.getHeaders()
    });

    console.log('Lab Analysis Results:');
    console.log('\nLab Results Extracted:', JSON.stringify(response.data.labResults, null, 2));
    console.log('\nDiagnoses:', JSON.stringify(response.data.diagnoses, null, 2));
    console.log('\nEarly Diagnosis Indicators:', JSON.stringify(response.data.earlyDiagnosisIndicators, null, 2));
    console.log('\nInference Time:', response.data.metadata.inferenceTimeMs, 'ms');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 4: Get API information
 */
async function example4_APIInfo() {
  console.log('\n=== Example 4: API Information ===\n');

  try {
    const response = await axios.get(API_ENDPOINT);

    console.log('API Service:', response.data.service);
    console.log('Version:', response.data.version);
    console.log('\nAvailable Models:');
    response.data.availableModels.forEach(model => {
      console.log(`  - ${model.id}: ${model.description} (${model.speed})`);
    });
    console.log('\nSupported Formats:', response.data.supportedFormats.join(', '));
    console.log('\nConfiguration:');
    console.log('  Groq API:', response.data.configuration.groqApiConfigured ? '✓' : '✗');
    console.log('  Azure OCR:', response.data.configuration.azureOcrConfigured ? '✓' : '✗');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Example 5: Prescription analysis
 */
async function example5_PrescriptionAnalysis() {
  console.log('\n=== Example 5: Prescription Analysis ===\n');

  const prescription = `
PRESCRIPTION

Patient: Robert Martinez
DOB: 05/12/1958
Date: December 18, 2024
Provider: Dr. Emily Thompson, MD

Rx #1:
Medication: Warfarin Sodium 5mg
Directions: Take 1 tablet by mouth once daily
Quantity: 30 tablets
Refills: 5
Indication: Atrial fibrillation anticoagulation

Rx #2:
Medication: Metoprolol Succinate ER 100mg
Directions: Take 1 tablet by mouth once daily in the morning
Quantity: 30 tablets
Refills: 5
Indication: Atrial fibrillation rate control, hypertension

Rx #3:
Medication: Furosemide 40mg
Directions: Take 1 tablet by mouth twice daily
Quantity: 60 tablets
Refills: 3
Indication: Congestive heart failure, edema management

Rx #4:
Medication: Potassium Chloride ER 20mEq
Directions: Take 1 tablet by mouth once daily
Quantity: 30 tablets
Refills: 3
Indication: Prevent hypokalemia secondary to furosemide

MONITORING REQUIRED:
- INR monitoring every 2-4 weeks (target INR 2.0-3.0)
- Potassium and creatinine monitoring monthly
- Blood pressure monitoring weekly
- Daily weight monitoring

DRUG INTERACTIONS WARNING:
Patient on warfarin - avoid NSAIDs, monitor for bleeding signs

Dr. Emily Thompson, MD
Cardiology
DEA #: AT1234563
  `;

  const formData = new FormData();
  formData.append('documentText', prescription);
  formData.append('model', 'llama-3.3-70b-versatile');

  try {
    const response = await axios.post(API_ENDPOINT, formData, {
      headers: formData.getHeaders()
    });

    console.log('Prescription Analysis:');
    console.log('\nMedications Extracted:', JSON.stringify(response.data.medications, null, 2));
    console.log('\nDiagnoses Inferred:', JSON.stringify(response.data.diagnoses, null, 2));
    console.log('\nRisk Factors:', JSON.stringify(response.data.riskFactors, null, 2));
    console.log('\nClinical Recommendations:', JSON.stringify(response.data.recommendations, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  GROQ MEDICAL DOCUMENT RAG - USAGE EXAMPLES               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Run examples
  await example4_APIInfo();
  await example1_TextAnalysis();
  await example3_LabReportAnalysis();
  await example5_PrescriptionAnalysis();

  // PDF example (optional - provide path to a PDF file)
  // await example2_PDFAnalysis('./sample-medical-report.pdf');

  console.log('\n✅ All examples completed!\n');
}

// Run examples if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  example1_TextAnalysis,
  example2_PDFAnalysis,
  example3_LabReportAnalysis,
  example4_APIInfo,
  example5_PrescriptionAnalysis,
  runAllExamples
};
