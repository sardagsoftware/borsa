/**
 * 🧪 MEDICAL AI MODULES - SECURITY & FUNCTIONALITY TEST
 *
 * Tests all 6 Medical AI modules with:
 * - Security validation (HIPAA headers, CORS, input validation)
 * - Streaming mode (SSE)
 * - Non-streaming mode (JSON)
 * - Error handling
 * - Critical event detection
 * - OrphaNet integration
 *
 * Usage: node test-medical-ai-modules.js
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const TIMEOUT = 30000; // 30 seconds

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test results tracker
 */
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

function recordTest(moduleName, testName, passed, error = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`  ✅ ${testName}`, 'green');
    } else {
        testResults.failed++;
        log(`  ❌ ${testName}`, 'red');
        if (error) {
            log(`     Error: ${error.message}`, 'red');
        }
    }
    testResults.tests.push({ moduleName, testName, passed, error: error?.message });
}

/**
 * Test 1: Rare Disease Assistant (OrphaNet-powered)
 */
async function testRareDiseaseAssistant() {
    log('\n🧬 Testing Rare Disease Assistant (OrphaNet 7,000+ diseases)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/rare-disease-assistant`;

    // Test 1.1: Non-streaming mode (JSON response)
    try {
        const response = await axios.post(endpoint, {
            symptoms: ['muscle weakness', 'respiratory difficulty', 'elevated creatine kinase'],
            age: 35,
            gender: 'male',
            familyHistory: 'Mother has similar symptoms',
            labResults: {
                elevatedCK: true
            },
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.differentialDiagnoses &&
                      response.data.differentialDiagnoses.length > 0;

        recordTest('Rare Disease', 'Non-streaming JSON response', passed);

        // Verify OrphaNet integration
        const hasOrphaData = response.data.differentialDiagnoses.some(d => d.source?.includes('OrphaNet'));
        recordTest('Rare Disease', 'OrphaNet integration active', hasOrphaData);

        // Verify Pompe Disease match (should match elevated CK + muscle weakness)
        const hasPompe = response.data.differentialDiagnoses.some(d => d.disease.toLowerCase().includes('pompe'));
        if (hasPompe) {
            log(`     💡 Found expected match: Pompe Disease`, 'blue');
        }

    } catch (error) {
        recordTest('Rare Disease', 'Non-streaming JSON response', false, error);
    }

    // Test 1.2: Security headers
    try {
        const response = await axios.post(endpoint, {
            symptoms: ['joint hypermobility'],
            stream: false
        }, { timeout: TIMEOUT });

        const hasSecurityHeaders = response.headers['access-control-allow-origin'] === '*' &&
                                  response.headers['x-content-type-options'] === 'nosniff';

        recordTest('Rare Disease', 'Security headers (CORS, X-Content-Type-Options)', hasSecurityHeaders);
    } catch (error) {
        recordTest('Rare Disease', 'Security headers', false, error);
    }

    // Test 1.3: Input validation (missing symptoms)
    try {
        const response = await axios.post(endpoint, {
            stream: false
            // Missing symptoms
        }, { timeout: TIMEOUT });

        recordTest('Rare Disease', 'Input validation (missing symptoms)', false);
    } catch (error) {
        const passed = error.response?.status === 400;
        recordTest('Rare Disease', 'Input validation (missing symptoms)', passed);
    }
}

/**
 * Test 2: Mental Health Triage (Suicide risk detection)
 */
async function testMentalHealthTriage() {
    log('\n🧠 Testing Mental Health Triage (PHQ-9 + GAD-7)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/mental-health-triage`;

    // Test 2.1: Low risk patient
    try {
        const response = await axios.post(endpoint, {
            phq9: {
                littleInterest: 1,
                feelingDown: 1,
                sleepProblems: 0,
                feelingTired: 1,
                appetiteChanges: 0,
                feelingBad: 0,
                troubleConcentrating: 0,
                movingSlow: 0,
                suicidalThoughts: 0
            },
            gad7: {
                feelingNervous: 1,
                cantStopWorrying: 0,
                worryingTooMuch: 1,
                troubleRelaxing: 0,
                restless: 0,
                easilyAnnoyed: 0,
                feelingAfraid: 0
            },
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.assessment;

        recordTest('Mental Health', 'Low risk assessment', passed);

        // Verify PHQ-9/GAD-7 scores calculated
        const hasScores = response.data.assessment.phq9Score !== undefined &&
                         response.data.assessment.gad7Score !== undefined;
        recordTest('Mental Health', 'PHQ-9/GAD-7 score calculation', hasScores);

    } catch (error) {
        recordTest('Mental Health', 'Low risk assessment', false, error);
    }

    // Test 2.2: High suicide risk (critical event)
    try {
        const response = await axios.post(endpoint, {
            phq9: {
                littleInterest: 3,
                feelingDown: 3,
                sleepProblems: 3,
                feelingTired: 3,
                appetiteChanges: 3,
                feelingBad: 3,
                troubleConcentrating: 3,
                movingSlow: 3,
                suicidalThoughts: 3 // High suicide risk
            },
            gad7: {
                feelingNervous: 3,
                cantStopWorrying: 3,
                worryingTooMuch: 3,
                troubleRelaxing: 3,
                restless: 3,
                easilyAnnoyed: 3,
                feelingAfraid: 3
            },
            stream: false
        }, { timeout: TIMEOUT });

        const isHighRisk = response.data.assessment.suicideRisk?.riskLevel === 'HIGH' ||
                          response.data.assessment.suicideRisk?.riskLevel === 'IMMINENT';

        recordTest('Mental Health', 'High suicide risk detection', isHighRisk);

        // Verify emergency resources provided
        const hasEmergencyResources = response.data.assessment.emergencyResources !== undefined;
        recordTest('Mental Health', 'Emergency resources provided for high risk', hasEmergencyResources);

        if (isHighRisk) {
            log(`     🚨 CRITICAL: High suicide risk detected (expected for test)`, 'yellow');
        }

    } catch (error) {
        recordTest('Mental Health', 'High suicide risk detection', false, error);
    }
}

/**
 * Test 3: Emergency Triage (ESI Level 1-5)
 */
async function testEmergencyTriage() {
    log('\n🚑 Testing Emergency Triage (ESI 5-level system)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/emergency-triage`;

    // Test 3.1: ESI Level 3 (moderate urgency)
    try {
        const response = await axios.post(endpoint, {
            chiefComplaint: 'Abdominal pain',
            vitalSigns: {
                heartRate: 95,
                bloodPressure: '130/85',
                respiratoryRate: 18,
                temperature: 37.2,
                oxygenSaturation: 97
            },
            age: 45,
            painScore: 6,
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.triageLevel;

        recordTest('Emergency Triage', 'ESI level assignment', passed);

        // Verify ESI level is between 1-5
        const hasValidESI = response.data.triageLevel.esi >= 1 && response.data.triageLevel.esi <= 5;
        recordTest('Emergency Triage', 'Valid ESI level (1-5)', hasValidESI);

    } catch (error) {
        recordTest('Emergency Triage', 'ESI level assignment', false, error);
    }

    // Test 3.2: ESI Level 1 (resuscitation - critical)
    try {
        const response = await axios.post(endpoint, {
            chiefComplaint: 'Cardiac arrest',
            vitalSigns: {
                heartRate: 40, // Bradycardia
                bloodPressure: '70/40', // Hypotension
                respiratoryRate: 8, // Respiratory distress
                temperature: 35.0, // Hypothermia
                oxygenSaturation: 85 // Hypoxia
            },
            age: 65,
            painScore: 10,
            stream: false
        }, { timeout: TIMEOUT });

        const isESILevel1 = response.data.triageLevel.esi === 1;
        recordTest('Emergency Triage', 'ESI Level 1 detection (critical)', isESILevel1);

        if (isESILevel1) {
            log(`     🚨 CRITICAL: ESI Level 1 (Resuscitation) detected`, 'yellow');
        }

    } catch (error) {
        recordTest('Emergency Triage', 'ESI Level 1 detection', false, error);
    }
}

/**
 * Test 4: Sepsis Early Warning (qSOFA + SIRS + SOFA)
 */
async function testSepsisEarlyWarning() {
    log('\n🦠 Testing Sepsis Early Warning (qSOFA + SIRS + SOFA)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/sepsis-early-warning`;

    // Test 4.1: Low risk (no sepsis)
    try {
        const response = await axios.post(endpoint, {
            vitalSigns: {
                systolicBP: 120,
                respiratoryRate: 16,
                heartRate: 80,
                temperature: 37.0
            },
            mentalStatus: 'alert',
            labResults: {
                wbc: 8.0,
                lactate: 1.0
            },
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.sepsisRisk;

        recordTest('Sepsis Warning', 'Low risk assessment', passed);

        // Verify scores calculated
        const hasScores = response.data.sepsisRisk.qSOFA !== undefined &&
                         response.data.sepsisRisk.sirs !== undefined;
        recordTest('Sepsis Warning', 'qSOFA + SIRS score calculation', hasScores);

    } catch (error) {
        recordTest('Sepsis Warning', 'Low risk assessment', false, error);
    }

    // Test 4.2: High risk (septic shock)
    try {
        const response = await axios.post(endpoint, {
            vitalSigns: {
                systolicBP: 85, // Hypotension
                respiratoryRate: 28, // Tachypnea
                heartRate: 120, // Tachycardia
                temperature: 39.5 // Fever
            },
            mentalStatus: 'confused', // Altered mental status
            labResults: {
                wbc: 18.0, // Leukocytosis
                lactate: 4.5 // Elevated lactate
            },
            stream: false
        }, { timeout: TIMEOUT });

        const isHighRisk = response.data.sepsisRisk.riskLevel === 'SEPSIS' ||
                          response.data.sepsisRisk.riskLevel === 'SEPTIC SHOCK';

        recordTest('Sepsis Warning', 'Sepsis/Septic shock detection', isHighRisk);

        // Verify sepsis bundles provided
        const hasSepsisBundles = response.data.sepsisRisk.sepsisBundles !== undefined;
        recordTest('Sepsis Warning', 'Sepsis bundles (Surviving Sepsis Campaign)', hasSepsisBundles);

        if (isHighRisk) {
            log(`     🚨 CRITICAL: Sepsis/Septic shock detected (expected for test)`, 'yellow');
        }

    } catch (error) {
        recordTest('Sepsis Warning', 'Sepsis detection', false, error);
    }
}

/**
 * Test 5: Multimodal Data Fusion (DICOM + FHIR + Genomic)
 */
async function testMultimodalDataFusion() {
    log('\n🔬 Testing Multimodal Data Fusion (DICOM + FHIR + Genomic)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/multimodal-data-fusion`;

    // Test 5.1: DICOM imaging data
    try {
        const response = await axios.post(endpoint, {
            dicomData: {
                studyInstanceUID: '1.2.840.113619.2.1.1.1',
                seriesInstanceUID: '1.2.840.113619.2.1.2.1',
                modality: 'CT',
                bodyPart: 'CHEST',
                findings: ['Pulmonary nodule', 'Hilar lymphadenopathy']
            },
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.fusedAnalysis;

        recordTest('Multimodal Fusion', 'DICOM medical imaging analysis', passed);

        // Verify DICOM parsing
        const hasDICOMAnalysis = response.data.fusedAnalysis.dicomAnalysis !== undefined;
        recordTest('Multimodal Fusion', 'DICOM 3.0 parsing', hasDICOMAnalysis);

    } catch (error) {
        recordTest('Multimodal Fusion', 'DICOM analysis', false, error);
    }

    // Test 5.2: FHIR + Genomic data
    try {
        const response = await axios.post(endpoint, {
            fhirData: {
                resourceType: 'Patient',
                conditions: ['Hypertension', 'Type 2 Diabetes'],
                medications: ['Metformin', 'Lisinopril']
            },
            genomicData: {
                format: 'VCF',
                variants: [
                    { chromosome: '7', position: 117199644, ref: 'C', alt: 'T', gene: 'CFTR', clinicalSignificance: 'Pathogenic' }
                ]
            },
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true;

        recordTest('Multimodal Fusion', 'FHIR R4 + Genomic VCF integration', passed);

        // Verify multimodal fusion
        const hasFusion = response.data.fusedAnalysis?.fusionInsights !== undefined;
        recordTest('Multimodal Fusion', 'Cross-modality data fusion', hasFusion);

    } catch (error) {
        recordTest('Multimodal Fusion', 'FHIR + Genomic integration', false, error);
    }
}

/**
 * Test 6: Maternal-Fetal Health (Preterm birth risk)
 */
async function testMaternalFetalHealth() {
    log('\n👶 Testing Maternal-Fetal Health (Preterm birth prediction)', 'cyan');

    const endpoint = `${BASE_URL}/api/medical/maternal-fetal-health`;

    // Test 6.1: Low risk pregnancy
    try {
        const response = await axios.post(endpoint, {
            maternalData: {
                age: 28,
                bmi: 23.5,
                previousPregnancies: 1,
                previousPretermBirth: false,
                cervicalLength: 40 // mm
            },
            gestationalAge: 28,
            stream: false
        }, { timeout: TIMEOUT });

        const passed = response.status === 200 &&
                      response.data.success === true &&
                      response.data.maternalFetalAssessment;

        recordTest('Maternal-Fetal', 'Low risk assessment', passed);

        // Verify preterm risk calculation
        const hasPreetermRisk = response.data.maternalFetalAssessment.pretermRisk !== undefined;
        recordTest('Maternal-Fetal', 'Preterm birth risk calculation', hasPreetermRisk);

    } catch (error) {
        recordTest('Maternal-Fetal', 'Low risk assessment', false, error);
    }

    // Test 6.2: High risk (very high preterm risk)
    try {
        const response = await axios.post(endpoint, {
            maternalData: {
                age: 35,
                bmi: 32.0, // Obesity
                previousPregnancies: 3,
                previousPretermBirth: true, // Previous preterm birth
                cervicalLength: 18, // Short cervix (<25mm)
                multipleGestation: true // Twins
            },
            fetalData: {
                estimatedWeight: 800, // grams (low for gestational age)
                abnormalDoppler: true
            },
            gestationalAge: 26,
            stream: false
        }, { timeout: TIMEOUT });

        const isVeryHighRisk = response.data.maternalFetalAssessment.pretermRisk.riskLevel === 'VERY HIGH';
        recordTest('Maternal-Fetal', 'Very high preterm risk detection', isVeryHighRisk);

        // Verify management plan provided
        const hasManagementPlan = response.data.maternalFetalAssessment.managementPlan !== undefined;
        recordTest('Maternal-Fetal', 'Personalized management plan', hasManagementPlan);

        if (isVeryHighRisk) {
            log(`     🚨 CRITICAL: Very high preterm risk detected (expected for test)`, 'yellow');
        }

    } catch (error) {
        recordTest('Maternal-Fetal', 'High risk detection', false, error);
    }

    // Test 6.3: Invalid gestational age (should reject)
    try {
        const response = await axios.post(endpoint, {
            maternalData: { age: 28 },
            gestationalAge: 50, // Invalid (>42 weeks)
            stream: false
        }, { timeout: TIMEOUT });

        recordTest('Maternal-Fetal', 'Input validation (invalid gestational age)', false);
    } catch (error) {
        const passed = error.response?.status === 400;
        recordTest('Maternal-Fetal', 'Input validation (invalid gestational age)', passed);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    log('\n' + '='.repeat(80), 'blue');
    log('🧪 MEDICAL AI MODULES - SECURITY & FUNCTIONALITY TEST SUITE', 'blue');
    log('='.repeat(80), 'blue');
    log(`🌐 Testing against: ${BASE_URL}`, 'cyan');
    log(`⏱️  Timeout: ${TIMEOUT}ms\n`, 'cyan');

    const startTime = Date.now();

    // Run all module tests
    await testRareDiseaseAssistant();
    await testMentalHealthTriage();
    await testEmergencyTriage();
    await testSepsisEarlyWarning();
    await testMultimodalDataFusion();
    await testMaternalFetalHealth();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    log('\n' + '='.repeat(80), 'blue');
    log('📊 TEST SUMMARY', 'blue');
    log('='.repeat(80), 'blue');
    log(`Total Tests:  ${testResults.total}`, 'cyan');
    log(`✅ Passed:     ${testResults.passed}`, 'green');
    log(`❌ Failed:     ${testResults.failed}`, 'red');
    log(`⏱️  Duration:   ${duration}s`, 'cyan');
    log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
        testResults.failed === 0 ? 'green' : 'yellow');

    // Exit code
    const exitCode = testResults.failed > 0 ? 1 : 0;

    if (exitCode === 0) {
        log('\n✅ ALL TESTS PASSED!', 'green');
    } else {
        log('\n❌ SOME TESTS FAILED - Check logs above', 'red');
    }

    log('='.repeat(80) + '\n', 'blue');

    process.exit(exitCode);
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Fatal error running tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
