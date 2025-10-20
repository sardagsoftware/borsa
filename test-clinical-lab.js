/**
 * Test script for Clinical Laboratory AI & Lab Result Interpretation System
 * - Lab result interpretation with AI
 * - Critical value detection
 * - Clinical differential diagnosis
 * - Evidence-based workup recommendations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/clinical-laboratory-ai';

async function testLabInterpretation() {
    console.log('\n🔬 Testing Lab Result Interpretation API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/interpret-results`, {
            labResults: {
                wbc: 15.5,        // High (normal: 4.5-11.0)
                hemoglobin: 9.2,  // Low (normal: 13.5-17.5)
                platelets: 180,   // Normal
                glucose: 245,     // High (normal: 70-100)
                creatinine: 2.8,  // High (normal: 0.7-1.3)
                potassium: 5.8,   // High (normal: 3.5-5.0)
                alt: 180,         // High (normal: 7-56)
                ast: 220          // High (normal: 10-40)
            },
            patientAge: 58,
            patientSex: 'male'
        });

        console.log('✅ Lab Interpretation Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   📊 Summary:');
        console.log(`   - Total Tests: ${response.data.summary.totalTests}`);
        console.log(`   - Abnormal Results: ${response.data.summary.abnormalResults}`);
        console.log(`   - Critical Values: ${response.data.summary.criticalValues}`);
        console.log(`   - Clinical Interpretations: ${response.data.summary.clinicalInterpretations}`);

        if (response.data.abnormalResults.length > 0) {
            console.log('\n   ⚠️ Abnormal Results:');
            response.data.abnormalResults.forEach((result, i) => {
                console.log(`\n   ${i + 1}. ${result.test}: ${result.value} ${result.unit}`);
                console.log(`      Reference Range: ${result.referenceRange}`);
                console.log(`      Status: ${result.status.toUpperCase()}`);
            });
        }

        if (response.data.criticalValues.length > 0) {
            console.log('\n   🚨 CRITICAL VALUES:');
            response.data.criticalValues.forEach((cv, i) => {
                console.log(`\n   ${i + 1}. ${cv.test}: ${cv.value} ${cv.unit}`);
                console.log(`      Severity: ${cv.severity}`);
                console.log(`      Message: ${cv.message}`);
                console.log(`      Action: ${cv.action}`);
            });
        }

        if (response.data.clinicalInterpretations.length > 0) {
            console.log('\n   🩺 Clinical Interpretations:');
            response.data.clinicalInterpretations.forEach((interp, i) => {
                console.log(`\n   ${i + 1}. ${interp.condition} (${interp.urgency})`);
                console.log(`      Finding: ${interp.finding}`);
                console.log(`      Differential Diagnoses:`);
                interp.differentials.forEach(dx => console.log(`        - ${dx}`));
                console.log(`      Recommended Workup:`);
                interp.workup.slice(0, 3).forEach(w => console.log(`        - ${w}`));
            });
        }

        console.log('\n   💡 Recommendations:');
        response.data.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

        console.log('\n   🤖 AI Analysis:');
        console.log(`   - Provider: ${response.data.aiAnalysis.provider}`);
        console.log(`   - Confidence: ${(response.data.aiAnalysis.confidence * 100).toFixed(1)}%`);
        console.log(`   - Processing Time: ${response.data.aiAnalysis.processingTime}`);

    } catch (error) {
        console.error('❌ Lab Interpretation Error:', error.response?.data || error.message);
    }
}

async function testCriticalValueCheck() {
    console.log('\n\n🚨 Testing Critical Value Detection...\n');

    try {
        const response = await axios.post(`${BASE_URL}/critical-value-check`, {
            labResults: {
                potassium: 7.2,    // Critical high (>6.5)
                hemoglobin: 6.5,   // Critical low (<7.0)
                glucose: 520,      // Critical high (>500)
                troponin_i: 0.8    // Critical high (>0.5)
            }
        });

        console.log('✅ Critical Value Check Response:');
        console.log('   Success:', response.data.success);
        console.log('   Requires Immediate Action:', response.data.requiresImmediateAction);
        console.log('   Total Critical Values:', response.data.totalCriticalValues);

        if (response.data.criticalAlerts.length > 0) {
            console.log('\n   🚑 Critical Alerts:');
            response.data.criticalAlerts.forEach((alert, i) => {
                console.log(`\n   Alert ${i + 1}:`);
                console.log(`   - Test: ${alert.test}`);
                console.log(`   - Value: ${alert.value} ${alert.unit}`);
                console.log(`   - Critical Threshold: ${alert.criticalThreshold}`);
                console.log(`   - Severity: ${alert.severity}`);
                console.log(`   - Notification: ${alert.notificationRequired ? 'REQUIRED' : 'Not required'}`);
                console.log(`   - Time to Notify: ${alert.timeToNotify}`);
                console.log(`   - Suggested Actions:`);
                alert.suggestedActions.forEach(action => {
                    console.log(`     • ${action}`);
                });
            });
        }

    } catch (error) {
        console.error('❌ Critical Value Check Error:', error.response?.data || error.message);
    }
}

async function testReferenceRanges() {
    console.log('\n\n📚 Testing Reference Ranges API...\n');

    try {
        // Test with CBC category
        const response = await axios.get(`${BASE_URL}/reference-ranges?category=cbc`);

        console.log('✅ Reference Ranges Response (CBC):');
        console.log('   Success:', response.data.success);
        console.log('   Category:', response.data.category);
        console.log('   Total Tests:', response.data.totalTests);

        console.log('\n   📋 CBC Reference Ranges:');
        Object.entries(response.data.referenceRanges).forEach(([code, ref]) => {
            console.log(`\n   ${ref.name}:`);
            console.log(`   - Range: ${ref.min} - ${ref.max} ${ref.unit}`);
            if (ref.critical_low) console.log(`   - Critical Low: < ${ref.critical_low}`);
            if (ref.critical_high) console.log(`   - Critical High: > ${ref.critical_high}`);
        });

    } catch (error) {
        console.error('❌ Reference Ranges Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   🏥 Platform Statistics:');
        Object.entries(response.data.platformStats).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

        console.log('\n   🧪 Test Categories:');
        response.data.categories.forEach(cat => {
            console.log(`   - ${cat}`);
        });

        console.log('\n   ⚡ Capabilities:');
        response.data.capabilities.forEach(cap => {
            console.log(`   - ${cap}`);
        });

        console.log('\n   📈 Clinical Impact:');
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
    console.log('🔬 CLINICAL LABORATORY AI & LAB RESULT INTERPRETATION - TEST SUITE');
    console.log('='.repeat(80));

    await testLabInterpretation();
    await testCriticalValueCheck();
    await testReferenceRanges();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL CLINICAL LABORATORY AI TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
