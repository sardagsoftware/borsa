/**
 * Test script for Medical NLP & Clinical Documentation Platform APIs
 * - SOAP Notes Generation
 * - ICD-10 Automated Medical Coding
 * - Clinical Named Entity Recognition (NER)
 * - Radiology Report Analysis
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/medical-nlp';

async function testSOAPNotesGeneration() {
    console.log('\n📝 Testing SOAP Notes Generation API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/soap-notes-generation`, {
            clinicalText: 'Patient is a 62-year-old male with chest pain for 2 hours. Pain is crushing, substernal, 8/10, radiating to left arm. Diaphoretic. History of diabetes and hypertension. Medications: metformin, lisinopril, atorvastatin. Vitals: BP 165/95, HR 102, RR 18. ECG shows ST elevation in inferior leads.',
            patientInfo: {
                name: 'John Doe',
                age: 62,
                sex: 'male',
                provider: 'Dr. Jane Smith, MD'
            },
            encounterType: 'Emergency Department Visit'
        });

        console.log('✅ SOAP Notes Generation Response:');
        console.log('   Success:', response.data.success);
        console.log('   Encounter Type:', response.data.encounterType);
        console.log('   Processing Time:', response.data.processingTime);
        console.log('   AI Confidence:', (response.data.confidence * 100).toFixed(1) + '%');

        console.log('\n   📋 Generated SOAP Note Structure:');
        console.log('   - Chief Complaint:', response.data.generatedSOAPNote.subjective.chiefComplaint);
        console.log('   - Vital Signs: BP', response.data.generatedSOAPNote.objective.vitalSigns.bloodPressure,
                    'HR', response.data.generatedSOAPNote.objective.vitalSigns.heartRate);
        
        console.log('\n   🩺 Assessment (Diagnoses):');
        response.data.generatedSOAPNote.assessment.diagnoses.forEach((dx, i) => {
            console.log(`   ${i + 1}. ${dx.diagnosis} (${dx.icd10}) - Severity: ${dx.severity}`);
        });

        console.log('\n   💊 Plan (Treatments):');
        response.data.generatedSOAPNote.plan.treatments.slice(0, 3).forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx}`);
        });

        console.log('\n   📊 E&M Level:', response.data.generatedSOAPNote.metadata.eMLevel);

    } catch (error) {
        console.error('❌ SOAP Notes Generation Error:', error.response?.data || error.message);
    }
}

async function testICD10Coding() {
    console.log('\n\n🏥 Testing ICD-10 Medical Coding API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/icd10-coding`, {
            clinicalText: 'Patient diagnosed with Type 2 Diabetes Mellitus with diabetic neuropathy. Also has hypertension and hyperlipidemia. Presents with chest pain, ruled out myocardial infarction.'
        });

        console.log('✅ ICD-10 Coding Response:');
        console.log('   Success:', response.data.success);
        console.log('   Total Codes Extracted:', response.data.totalCodes);
        console.log('   Coding Accuracy:', response.data.codingAccuracy);
        console.log('   Reimbursement Optimization:', response.data.complianceCheck.reimbursementOptimization);

        console.log('\n   📊 Extracted ICD-10 Codes:');
        response.data.extractedCodes.forEach((code, i) => {
            console.log(`   ${i + 1}. ${code.code} - ${code.description}`);
            console.log(`      Matched Text: "${code.matchedText}"`);
            console.log(`      Category: ${code.category}`);
            console.log(`      Confidence: ${(code.confidence * 100).toFixed(1)}%`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ ICD-10 Coding Error:', error.response?.data || error.message);
    }
}

async function testClinicalNER() {
    console.log('\n🧬 Testing Clinical Named Entity Recognition (NER) API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/clinical-ner`, {
            clinicalText: 'Patient with diabetes taking metformin. Chest X-ray shows pneumonia in right lung. Heart rate 102 bpm, blood pressure 165/95 mmHg. ECG performed. Prescribed aspirin and ibuprofen.'
        });

        console.log('✅ Clinical NER Response:');
        console.log('   Success:', response.data.success);
        console.log('   Total Entities Extracted:', response.data.totalEntities);
        console.log('   Entity Categories:', response.data.entityCategories);
        console.log('   NER Confidence:', (response.data.confidence * 100).toFixed(1) + '%');

        console.log('\n   🔍 Extracted Entities by Category:');
        
        if (response.data.extractedEntities.diseases.length > 0) {
            console.log('\n   Diseases:');
            response.data.extractedEntities.diseases.forEach((entity, i) => {
                console.log(`   ${i + 1}. "${entity.entity}" (confidence: ${(entity.confidence * 100).toFixed(1)}%)`);
            });
        }

        if (response.data.extractedEntities.medications.length > 0) {
            console.log('\n   Medications:');
            response.data.extractedEntities.medications.forEach((entity, i) => {
                console.log(`   ${i + 1}. "${entity.entity}" (confidence: ${(entity.confidence * 100).toFixed(1)}%)`);
            });
        }

        if (response.data.extractedEntities.procedures.length > 0) {
            console.log('\n   Procedures:');
            response.data.extractedEntities.procedures.forEach((entity, i) => {
                console.log(`   ${i + 1}. "${entity.entity}" (confidence: ${(entity.confidence * 100).toFixed(1)}%)`);
            });
        }

        if (response.data.extractedEntities.symptoms.length > 0) {
            console.log('\n   Symptoms:');
            response.data.extractedEntities.symptoms.forEach((entity, i) => {
                console.log(`   ${i + 1}. "${entity.entity}" (confidence: ${(entity.confidence * 100).toFixed(1)}%)`);
            });
        }

    } catch (error) {
        console.error('❌ Clinical NER Error:', error.response?.data || error.message);
    }
}

async function testRadiologyReportAnalysis() {
    console.log('\n\n📊 Testing Radiology Report Analysis API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/radiology-report-analysis`, {
            reportText: 'INDICATION: Chest pain, rule out acute cardiopulmonary process. TECHNIQUE: PA and lateral views of the chest. FINDINGS: Lungs are clear bilaterally. Heart size is normal. No pneumothorax or pleural effusion. Mediastinum is not widened. IMPRESSION: No acute cardiopulmonary abnormality.',
            modality: 'Chest X-ray'
        });

        console.log('✅ Radiology Report Analysis Response:');
        console.log('   Success:', response.data.success);
        console.log('   Modality:', response.data.modality);
        console.log('   Processing Time:', response.data.processingTime);
        console.log('   AI Confidence:', (response.data.aiConfidence * 100).toFixed(1) + '%');

        console.log('\n   📋 Structured Analysis:');
        console.log('   - Indication:', response.data.structuredAnalysis.indication);
        console.log('   - Technique:', response.data.structuredAnalysis.technique);

        console.log('\n   🔍 Findings:');
        Object.entries(response.data.structuredAnalysis.findings).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   💡 Impression:');
        response.data.structuredAnalysis.impression.forEach((imp, i) => {
            console.log(`   ${i + 1}. ${imp}`);
        });

        console.log('\n   🚨 Critical Findings:', response.data.criticalFindings.length > 0 ? response.data.criticalFindings.join(', ') : 'None');
        console.log('   📅 Follow-Up:', response.data.recommendedFollowUp);

    } catch (error) {
        console.error('❌ Radiology Report Analysis Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   🤖 NLP Models:');
        Object.entries(response.data.nlpModels).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   📚 Medical Databases:');
        Object.entries(response.data.databases).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   ⚡ Performance Metrics:');
        Object.entries(response.data.performance).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   💰 Market Impact:');
        console.log('   - Medical NLP Market:', response.data.marketImpact.medicalNLPMarket);
        console.log('   - Physician Time Savings:', response.data.marketImpact.physicianTimeSavings);
        console.log('   - Documentation Time Reduction:', response.data.marketImpact.documentationTimeReduction);
        console.log('   - Coding Accuracy Improvement:', response.data.marketImpact.codingAccuracyImprovement);
        console.log('   - Cost Savings:', response.data.marketImpact.costSavings);

        console.log('\n   🏥 Clinical Impact:');
        Object.entries(response.data.clinicalImpact).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

    } catch (error) {
        console.error('❌ Database Stats Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('📝 MEDICAL NLP & CLINICAL DOCUMENTATION PLATFORM - TEST SUITE');
    console.log('='.repeat(80));

    await testSOAPNotesGeneration();
    await testICD10Coding();
    await testClinicalNER();
    await testRadiologyReportAnalysis();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
