/**
 * Test script for Radiology AI & Medical Imaging Platform
 * - Medical Image Analysis (X-ray, CT, MRI)
 * - Cancer Detection AI
 * - Fracture Detection AI
 * - Radiologist AI Assistant
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/radiology-ai';

async function testImageAnalysis() {
    console.log('\n🔬 Testing Medical Image Analysis API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/image-analysis`, {
            imageType: 'CT',
            bodyPart: 'chest',
            clinicalHistory: 'Patient with chest pain and shortness of breath for 3 days. History of smoking. Evaluate for pneumonia or malignancy.'
        });

        console.log('✅ Image Analysis Response:');
        console.log('   Success:', response.data.success);
        console.log('   Image Type:', response.data.imageType);
        console.log('   Body Part:', response.data.bodyPart);
        console.log('   AI Model:', response.data.aiModel);
        console.log('   Processing Time:', response.data.processingTime);

        console.log('\n   📋 Analysis:');
        console.log('   - Technique:', response.data.analysis.technique);
        console.log('   - Findings:', response.data.analysis.findings.slice(0, 2).join(', '));
        console.log('   - Impression:', response.data.analysis.impression);
        console.log('   - Urgency:', response.data.analysis.urgency);

        console.log('\n   💡 Recommendations:');
        response.data.analysis.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

    } catch (error) {
        console.error('❌ Image Analysis Error:', error.response?.data || error.message);
    }
}

async function testCancerDetection() {
    console.log('\n\n🎗️ Testing Cancer Detection AI...\n');

    try {
        const response = await axios.post(`${BASE_URL}/cancer-detection`, {
            imageType: 'CT',
            bodyPart: 'lung',
            patientAge: 67,
            riskFactors: ['smoking 40 pack-years', 'family history of lung cancer', 'COPD']
        });

        console.log('✅ Cancer Detection Response:');
        console.log('   Success:', response.data.success);
        console.log('   Screening Type:', response.data.screeningType);
        console.log('   Patient Risk Profile:', response.data.patientRiskProfile);
        console.log('   AI Model:', response.data.aiModel);
        console.log('   Accuracy:', response.data.accuracy);

        console.log('\n   🔍 Detected Lesions:');
        response.data.detectedLesions.forEach((lesion, i) => {
            console.log(`\n   Lesion ${i + 1}:`);
            console.log(`   - Type: ${lesion.type}`);
            console.log(`   - Size: ${lesion.size}`);
            console.log(`   - Location: ${lesion.location}`);
            console.log(`   - Malignancy Risk: ${lesion.malignancyRisk}`);
            console.log(`   - Follow-Up: ${lesion.followUp}`);
        });

        console.log('\n   📊 Lung-RADS:', response.data.lungRADS);
        console.log('   ⏰ Follow-Up Interval:', response.data.followUpInterval);

        console.log('\n   💊 Recommendations:');
        response.data.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

    } catch (error) {
        console.error('❌ Cancer Detection Error:', error.response?.data || error.message);
    }
}

async function testFractureDetection() {
    console.log('\n\n🦴 Testing Fracture Detection AI...\n');

    try {
        const response = await axios.post(`${BASE_URL}/fracture-detection`, {
            imageType: 'X-ray',
            bodyPart: 'distal radius',
            mechanism: 'Fall on outstretched hand (FOOSH)',
            clinicalPresentation: ['wrist pain', 'swelling', 'deformity', 'decreased range of motion']
        });

        console.log('✅ Fracture Detection Response:');
        console.log('   Success:', response.data.success);
        console.log('   Fracture Detected:', response.data.fractureDetected);
        console.log('   AI Model:', response.data.aiModel);
        console.log('   Sensitivity:', response.data.sensitivity);
        console.log('   Specificity:', response.data.specificity);

        console.log('\n   🔍 Fracture Details:');
        const fracture = response.data.fractureDetails;
        console.log(`   - Bone: ${fracture.bone || fracture.location}`);
        console.log(`   - Type: ${fracture.type}`);
        console.log(`   - Displacement: ${fracture.displacement}`);
        console.log(`   - Comminution: ${fracture.comminution}`);

        console.log('\n   📋 Classification:');
        console.log(`   - AO: ${response.data.aoClassification}`);
        console.log(`   - Stability: ${response.data.stability}`);

        console.log('\n   ⚠️ Complications:');
        response.data.complications.forEach((comp, i) => {
            console.log(`   ${i + 1}. ${comp}`);
        });

        console.log('\n   🏥 Management Recommendations:');
        response.data.managementRecommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

        console.log('\n   🚑 Surgical Consultation Required:', response.data.surgicalConsultation);

    } catch (error) {
        console.error('❌ Fracture Detection Error:', error.response?.data || error.message);
    }
}

async function testRadiologistAssistant() {
    console.log('\n\n🤖 Testing Radiologist AI Assistant...\n');

    try {
        const response = await axios.post(`${BASE_URL}/radiologist-assistant`, {
            imageDescription: 'Chest X-ray shows a 2.5 cm rounded opacity in the right upper lobe with spiculated borders. No associated pleural effusion. Heart size is normal.',
            clinicalQuestion: 'Is this finding concerning for malignancy? What are the next recommended steps?',
            patientHistory: {
                age: 72,
                sex: 'male',
                smokingHistory: '60 pack-years',
                symptoms: ['chronic cough', 'unintentional weight loss 10 lbs in 3 months']
            }
        });

        console.log('✅ Radiologist AI Assistant Response:');
        console.log('   Success:', response.data.success);
        console.log('   AI Enhanced:', response.data.aiEnhanced);
        console.log('   AI Provider:', response.data.aiProvider || response.data.dataSource);
        console.log('   Confidence:', (response.data.confidence * 100).toFixed(1) + '%');

        console.log('\n   🔍 Analysis:', response.data.analysis);

        console.log('\n   🩺 Differential Diagnosis:');
        if (Array.isArray(response.data.differentialDiagnosis)) {
            response.data.differentialDiagnosis.forEach((dx, i) => {
                console.log(`   ${i + 1}. ${dx}`);
            });
        }

        console.log('\n   💡 Recommendations:');
        response.data.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

        if (response.data.criticalFindings && response.data.criticalFindings.length > 0) {
            console.log('\n   🚨 Critical Findings:');
            response.data.criticalFindings.forEach((finding, i) => {
                console.log(`   ${i + 1}. ${finding}`);
            });
        }

    } catch (error) {
        console.error('❌ Radiologist AI Assistant Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   🔬 Radiology AI Capabilities:');
        console.log('   - Imaging Modalities:', response.data.radiologyAI.imagingModalities.join(', '));
        console.log('   - Body Parts:', response.data.radiologyAI.bodyParts.join(', '));
        console.log('   - Total Findings:', response.data.radiologyAI.totalFindings);
        console.log('   - Cancer Types:', response.data.radiologyAI.cancerTypes.join(', '));

        console.log('\n   🤖 AI Models:');
        Object.entries(response.data.aiModels).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   ⚡ Performance Metrics:');
        Object.entries(response.data.performance).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   🏥 Clinical Impact:');
        Object.entries(response.data.clinicalImpact).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   📈 Market Data:');
        Object.entries(response.data.marketData).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

    } catch (error) {
        console.error('❌ Database Stats Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('🔬 RADIOLOGY AI & MEDICAL IMAGING PLATFORM - TEST SUITE');
    console.log('='.repeat(80));

    await testImageAnalysis();
    await testCancerDetection();
    await testFractureDetection();
    await testRadiologistAssistant();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL RADIOLOGY AI TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
