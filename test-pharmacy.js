/**
 * Test script for Pharmacy & Drug Information Platform
 * - Drug Database Search (10,000+ medications)
 * - Drug-Drug Interaction Checking
 * - Prescription Generation & Management
 * - Dosage Calculator
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/pharmacy-drug-info';

async function testDrugSearch() {
    console.log('\n🔍 Testing Drug Search API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/drug-search?search=lisinopril`);

        console.log('✅ Drug Search Response:');
        console.log('   Success:', response.data.success);
        console.log('   Total Found:', response.data.total);
        console.log('   Search Term:', response.data.searchTerm);

        console.log('\n   📋 Drug Results:');
        response.data.drugs.slice(0, 3).forEach((drug, i) => {
            console.log(`\n   Drug ${i + 1}:`);
            console.log(`   - Name: ${drug.name} (${drug.generic})`);
            console.log(`   - Brand: ${drug.brand}`);
            console.log(`   - Class: ${drug.class}`);
            console.log(`   - Indication: ${drug.indication}`);
            console.log(`   - Dosage: ${drug.dose}`);
            console.log(`   - Route: ${drug.route}`);
            console.log(`   - Category: ${drug.category}`);
            console.log(`   - Cost: ${drug.cost}`);
            console.log(`   - FDA Approved: ${drug.fdaApproved ? 'Yes' : 'No'}`);
        });

    } catch (error) {
        console.error('❌ Drug Search Error:', error.response?.data || error.message);
    }
}

async function testInteractionCheck() {
    console.log('\n\n⚠️ Testing Drug Interaction Check...\n');

    try {
        const response = await axios.post(`${BASE_URL}/interaction-check`, {
            medications: ['Warfarin', 'Ibuprofen']
        });

        console.log('✅ Interaction Check Response:');
        console.log('   Success:', response.data.success);
        console.log('   Total Interactions:', response.data.totalInteractions);

        console.log('\n   🔍 Detected Interactions:');
        response.data.interactions.forEach((interaction, i) => {
            console.log(`\n   Interaction ${i + 1}:`);
            console.log(`   - Drugs: ${interaction.drug1} + ${interaction.drug2}`);
            console.log(`   - Severity: ${interaction.severity}`);
            console.log(`   - Effect: ${interaction.effect}`);
            console.log(`   - Mechanism: ${interaction.mechanism}`);
            console.log(`   - Recommendation: ${interaction.recommendation}`);
        });

    } catch (error) {
        console.error('❌ Interaction Check Error:', error.response?.data || error.message);
    }
}

async function testPrescriptionGeneration() {
    console.log('\n\n📝 Testing Prescription Generation...\n');

    try {
        const response = await axios.post(`${BASE_URL}/generate-prescription`, {
            condition: 'Hypertension',
            allergies: ['Sulfa drugs']
        });

        console.log('✅ Prescription Generation Response:');
        console.log('   Success:', response.data.success);
        console.log('   Condition:', response.data.condition);

        console.log('\n   💊 Generated Prescription:');
        const rx = response.data.prescription;
        console.log(`   - Medication: ${rx.medication}`);
        console.log(`   - Dosage: ${rx.dosage}`);
        console.log(`   - Frequency: ${rx.frequency}`);
        console.log(`   - Route: ${rx.route}`);
        console.log(`   - Duration: ${rx.duration}`);
        console.log(`   - Instructions: ${rx.instructions}`);

        if (rx.warnings && rx.warnings.length > 0) {
            console.log('\n   ⚠️ Warnings:');
            rx.warnings.forEach((warning, i) => {
                console.log(`   ${i + 1}. ${warning}`);
            });
        }

        console.log('\n   📊 Evidence Base:', response.data.evidenceBase);

    } catch (error) {
        console.error('❌ Prescription Generation Error:', error.response?.data || error.message);
    }
}

async function testDosageCalculator() {
    console.log('\n\n💉 Testing Dosage Calculator...\n');

    try {
        const response = await axios.post(`${BASE_URL}/dosage-calculator`, {
            medication: 'Lisinopril',
            patientWeight: 70,
            renalFunction: 'normal'
        });

        console.log('✅ Dosage Calculator Response:');
        console.log('   Success:', response.data.success);
        console.log('   Medication:', response.data.medication);
        console.log('   Patient Weight:', response.data.patientWeight + ' kg');
        console.log('   Renal Function:', response.data.renalFunction);

        console.log('\n   📐 Calculated Dosage:');
        console.log('   - Recommended Dose:', response.data.calculatedDosage.recommendedDose);
        console.log('   - Max Daily Dose:', response.data.calculatedDosage.maxDailyDose);
        console.log('   - Frequency:', response.data.calculatedDosage.frequency);

        console.log('\n   💡 Clinical Considerations:');
        response.data.clinicalConsiderations.forEach((consideration, i) => {
            console.log(`   ${i + 1}. ${consideration}`);
        });

    } catch (error) {
        console.error('❌ Dosage Calculator Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   🏥 Platform Statistics:');
        console.log('   - Total Drugs:', response.data.platformStats.totalDrugs);
        console.log('   - Drug Categories:', response.data.platformStats.drugCategories);
        console.log('   - Known Interactions:', response.data.platformStats.knownInteractions);
        console.log('   - FDA Approved:', response.data.platformStats.fdaApproved + '%');

        console.log('\n   💊 Drug Categories:');
        response.data.categories.forEach(category => {
            console.log(`   - ${category}`);
        });

        console.log('\n   📈 Clinical Impact:');
        console.log('   - Adverse Event Prevention:', response.data.clinicalImpact.adverseEventPrevention);
        console.log('   - Cost Savings:', response.data.clinicalImpact.costSavings);
        console.log('   - Patient Safety:', response.data.clinicalImpact.patientSafety);

    } catch (error) {
        console.error('❌ Database Stats Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('💊 PHARMACY & DRUG INFORMATION PLATFORM - TEST SUITE');
    console.log('='.repeat(80));

    await testDrugSearch();
    await testInteractionCheck();
    await testPrescriptionGeneration();
    await testDosageCalculator();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL PHARMACY TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
