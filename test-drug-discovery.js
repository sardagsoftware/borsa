/**
 * Test script for Drug Discovery Platform APIs
 * - Compound Search (PubChem)
 * - Clinical Trial Matching (ClinicalTrials.gov)
 * - Biomarker Analysis
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/drug-discovery';

async function testCompoundSearch() {
  console.log('\n💊 Testing Compound Search API...\n');

  try {
    const response = await axios.post(`${BASE_URL}/compound-search`, {
      compoundName: 'pembrolizumab',
      searchType: 'exact_match'
    });

    console.log('✅ Compound Search Response:');
    console.log('   Success:', response.data.success);
    console.log('   Compound:', response.data.compound.name);
    console.log('   PubChem CID:', response.data.compound.pubchemCID);
    console.log('   Formula:', response.data.compound.formula);
    console.log('   Molecular Weight:', response.data.compound.molecularWeight);
    console.log('   Targets:', response.data.compound.targets.join(', '));
    console.log('   Mechanism:', response.data.compound.mechanism);
    console.log('\n   Similar Compounds:');
    response.data.similarCompounds.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.similarity.toFixed(1)}% similarity)`);
    });
    console.log('\n   Drug-Drug Interactions:', response.data.drugDrugInteractions.length > 0 ? response.data.drugDrugInteractions.length : 'None');

  } catch (error) {
    console.error('❌ Compound Search Error:', error.response?.data || error.message);
  }
}

async function testClinicalTrialMatch() {
  console.log('\n\n🔬 Testing Clinical Trial Matching...\n');

  try {
    const response = await axios.post(`${BASE_URL}/clinical-trial-match`, {
      condition: 'Non-Small Cell Lung Cancer',
      age: 62,
      biomarkers: { 'PD-L1': '60%' },
      priorTherapies: []
    });

    console.log('✅ Clinical Trial Match Response:');
    console.log('   Success:', response.data.success);
    console.log('   Patient Condition:', response.data.patient.condition);
    console.log('   Eligible Trials:', response.data.patient.eligibleTrials);
    console.log('\n   Top Matching Trials:');
    response.data.trials.slice(0, 3).forEach((trial, i) => {
      console.log(`\n   ${i + 1}. ${trial.title}`);
      console.log(`      NCT ID: ${trial.nctId}`);
      console.log(`      Phase: ${trial.phase}`);
      console.log(`      Status: ${trial.status}`);
      console.log(`      Match Score: ${trial.matchScore}%`);
      console.log(`      Recommendation: ${trial.recommendationLevel}`);
      console.log(`      Reasons: ${trial.matchReasons.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Clinical Trial Match Error:', error.response?.data || error.message);
  }
}

async function testBiomarkerAnalysis() {
  console.log('\n\n🧬 Testing Biomarker Analysis...\n');

  try {
    const response = await axios.post(`${BASE_URL}/biomarker-analysis`, {
      biomarkerName: 'PD-L1',
      testResult: '65',
      cancerType: 'NSCLC'
    });

    console.log('✅ Biomarker Analysis Response:');
    console.log('   Success:', response.data.success);
    console.log('   Biomarker:', response.data.biomarker.biomarker);
    console.log('   Test Result:', response.data.biomarker.testResult);
    console.log('   Cancer Type:', response.data.biomarker.cancerType);
    console.log('   Interpretation:', response.data.biomarker.interpretation.interpretation);
    console.log('   Clinical Significance:', response.data.biomarker.interpretation.clinicalSignificance);
    console.log('\n   Recommended Targeted Therapies:');
    response.data.recommendedTherapies.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.drug}`);
      console.log(`      FDA Approved: ${t.fdaApproved ? 'Yes' : 'No'}`);
      console.log(`      Indication: ${t.indication}`);
    });
    console.log('\n   Companion Diagnostic:', response.data.companionDiagnostics);

  } catch (error) {
    console.error('❌ Biomarker Analysis Error:', error.response?.data || error.message);
  }
}

async function testDatabaseStats() {
  console.log('\n\n📊 Testing Database Stats API...\n');

  try {
    const response = await axios.get(`${BASE_URL}/database-stats`);

    console.log('✅ Database Stats Response:');
    console.log('   Success:', response.data.success);
    console.log('\n   External Databases:');
    console.log('   - PubChem:', response.data.databases.pubchem.compounds, 'compounds');
    console.log('   - ClinicalTrials.gov:', response.data.databases.clinicalTrials.trials, 'trials');
    console.log('   - DrugBank:', response.data.databases.drugBank.drugs, 'drugs');
    console.log('   - ChEMBL:', response.data.databases.chembl.bioactivities, 'bioactivities');
    console.log('\n   Local Database:');
    console.log('   - Compounds:', response.data.localDatabase.compounds);
    console.log('   - Clinical Trials:', response.data.localDatabase.clinicalTrials);
    console.log('   - Biomarkers:', response.data.localDatabase.biomarkers);
    console.log('\n   Market Impact:');
    console.log('   - Global Pharma Market:', response.data.marketImpact.globalPharmaMarket);
    console.log('   - Avg Drug Development Cost:', response.data.marketImpact.avgDrugDevelopmentCost);
    console.log('   - AI Reduction:', response.data.marketImpact.aiReduction);

  } catch (error) {
    console.error('❌ Database Stats Error:', error.response?.data || error.message);
  }
}

// Run all tests
(async () => {
  console.log('='.repeat(80));
  console.log('💊 DRUG DISCOVERY PLATFORM - TEST SUITE');
  console.log('='.repeat(80));

  await testCompoundSearch();
  await testClinicalTrialMatch();
  await testBiomarkerAnalysis();
  await testDatabaseStats();

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(80) + '\n');
})();
