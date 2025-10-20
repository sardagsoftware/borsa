/**
 * Test script for Clinical Decision Support System APIs
 * - Differential Diagnosis Engine
 * - Treatment Protocol Recommendations
 * - Drug-Drug Interactions
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/clinical-decision';

async function testDifferentialDiagnosis() {
    console.log('\n🩺 Testing Differential Diagnosis API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/differential-diagnosis`, {
            chiefComplaint: 'chest pain',
            symptoms: ['chest pain', 'dyspnea', 'diaphoresis', 'nausea'],
            age: 62,
            sex: 'male',
            riskFactors: ['hypertension', 'diabetes', 'smoking']
        });

        console.log('✅ Differential Diagnosis Response:');
        console.log('   Success:', response.data.success);
        console.log('   Chief Complaint:', response.data.chiefComplaint);
        console.log('   Patient:', `${response.data.patientData.age} yo ${response.data.patientData.sex}`);
        console.log('   Risk Factors:', response.data.patientData.riskFactors.join(', '));

        console.log('\n   🎯 Top Diagnosis:');
        console.log('   - Condition:', response.data.topDiagnosis.condition);
        console.log('   - Probability:', response.data.topDiagnosis.probability);
        console.log('   - ICD-10:', response.data.topDiagnosis.icd10);
        console.log('   - Category:', response.data.topDiagnosis.category);
        console.log('   - Match Strength:', response.data.topDiagnosis.matchStrength);
        console.log('   - Urgency:', response.data.topDiagnosis.urgency);

        console.log('\n   🚩 Red Flags:');
        response.data.topDiagnosis.redFlags.forEach((flag, i) => {
            console.log(`   ${i + 1}. ${flag}`);
        });

        console.log('\n   📋 Next Steps:');
        response.data.topDiagnosis.nextSteps.forEach((step, i) => {
            console.log(`   ${i + 1}. ${step}`);
        });

        console.log('\n   🔬 Differential Diagnoses:');
        response.data.differentialDiagnosis.slice(0, 3).forEach((dx, i) => {
            console.log(`   ${i + 1}. ${dx.condition} (${dx.probabilityScore}% probability, ${dx.matchedSymptoms}/${dx.totalSymptoms} symptoms)`);
        });

        console.log('\n   💡 Clinical Pearl:', response.data.clinicalPearl);

    } catch (error) {
        console.error('❌ Differential Diagnosis Error:', error.response?.data || error.message);
    }
}

async function testTreatmentProtocol() {
    console.log('\n\n💊 Testing Treatment Protocol API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/treatment-protocol`, {
            condition: 'Acute Coronary Syndrome',
            severity: 'moderate',
            comorbidities: ['chronic kidney disease'],
            allergies: []
        });

        console.log('✅ Treatment Protocol Response:');
        console.log('   Success:', response.data.success);
        console.log('   Condition:', response.data.condition);
        console.log('   Guideline:', response.data.guideline);
        console.log('   Evidence Level:', response.data.evidenceLevel);

        console.log('\n   💉 First-Line Treatment:');
        response.data.treatmentPlan.firstLine.forEach((tx, i) => {
            console.log(`\n   ${i + 1}. ${tx.intervention}`);
            console.log(`      Evidence: ${tx.evidence}`);
            console.log(`      Benefit: ${tx.mortality_reduction}`);
        });

        console.log('\n   📊 Second-Line Treatment:');
        response.data.treatmentPlan.secondLine.forEach((tx, i) => {
            console.log(`\n   ${i + 1}. ${tx.intervention}`);
            console.log(`      Evidence: ${tx.evidence}`);
            console.log(`      Indication: ${tx.indication}`);
        });

        console.log('\n   ⚠️ Contraindications:');
        response.data.treatmentPlan.contraindications.forEach((ci, i) => {
            console.log(`   ${i + 1}. ${ci}`);
        });

        console.log('\n   📈 Quality Indicators:');
        response.data.qualityMetrics.forEach((metric, i) => {
            console.log(`   ${i + 1}. ${metric}`);
        });

        console.log('\n   🔄 Follow-Up:', response.data.followUp);

        console.log('\n   ⚡ Warnings:');
        response.data.warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });

    } catch (error) {
        console.error('❌ Treatment Protocol Error:', error.response?.data || error.message);
    }
}

async function testDrugInteractions() {
    console.log('\n\n⚠️  Testing Drug-Drug Interactions API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/drug-interactions`, {
            medications: ['Warfarin 5mg', 'Ibuprofen 600mg', 'Lisinopril 10mg', 'Spironolactone 25mg']
        });

        console.log('✅ Drug Interaction Response:');
        console.log('   Success:', response.data.success);
        console.log('   Medication List:', response.data.medicationList.join(', '));
        console.log('   Total Interactions:', response.data.totalInteractions);
        console.log('   Overall Risk Level:', response.data.riskLevel);

        console.log('\n   📊 Interaction Breakdown:');
        console.log('   - Major:', response.data.interactionBreakdown.major);
        console.log('   - Moderate:', response.data.interactionBreakdown.moderate);
        console.log('   - Minor:', response.data.interactionBreakdown.minor);

        console.log('\n   🚨 Detected Interactions:');
        response.data.detectedInteractions.forEach((int, i) => {
            console.log(`\n   ${i + 1}. ${int.drug1} + ${int.drug2}`);
            console.log(`      Severity: ${int.severity}`);
            console.log(`      Mechanism: ${int.mechanism}`);
            console.log(`      Clinical Effect: ${int.clinicalEffect}`);
            console.log(`      Recommendation: ${int.recommendation}`);
            console.log(`      Monitoring: ${int.monitoring}`);
            console.log(`      Incidence: ${int.incidence}`);
            console.log(`      Evidence: ${int.evidence}`);
        });

        console.log('\n   💡 Clinical Action:', response.data.clinicalAction);
        console.log('   👨‍⚕️ Pharmacist Consult:', response.data.pharmacistConsult);

    } catch (error) {
        console.error('❌ Drug Interaction Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   📚 External Databases:');
        console.log('   - UpToDate:', response.data.databases.upToDate.topics);
        console.log('   - NICE:', response.data.databases.nice.guidelines);
        console.log('   - WHO:', response.data.databases.who.essentialMedicines);
        console.log('   - AHA:', response.data.databases.aha.guidelines);
        console.log('   - CDC:', response.data.databases.cdc.guidelines);
        console.log('   - DrugBank:', response.data.databases.drugBank.interactions);

        console.log('\n   💾 Local Database:');
        console.log('   - Conditions:', response.data.localDatabase.conditions);
        console.log('   - Treatment Protocols:', response.data.localDatabase.treatmentProtocols);
        console.log('   - Drug Interactions:', response.data.localDatabase.drugInteractions);

        console.log('\n   💰 Market Impact:');
        console.log('   - CDSS Market:', response.data.marketImpact.cdssMarket);
        console.log('   - CAGR:', response.data.marketImpact.cagr);
        console.log('   - Error Reduction:', response.data.marketImpact.errorReduction);
        console.log('   - Guideline Adherence:', response.data.marketImpact.guidelineAdherence);
        console.log('   - Adverse Event Reduction:', response.data.marketImpact.adverseEventReduction);
        console.log('   - Cost Savings:', response.data.marketImpact.costSavings);

        console.log('\n   🏥 Clinical Impact:');
        console.log('   - NNT (Diagnostic Error):', response.data.clinicalImpact.nnt_diagnosticError);
        console.log('   - NNT (Adverse Drug Event):', response.data.clinicalImpact.nnt_adverseDrugEvent);
        console.log('   - Mortality Improvement:', response.data.clinicalImpact.mortalityImprovement);
        console.log('   - Time to Treatment:', response.data.clinicalImpact.timeToTreatment);

    } catch (error) {
        console.error('❌ Database Stats Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('🩺 CLINICAL DECISION SUPPORT SYSTEM - TEST SUITE');
    console.log('='.repeat(80));

    await testDifferentialDiagnosis();
    await testTreatmentProtocol();
    await testDrugInteractions();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
