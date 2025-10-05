/**
 * Test script for new Medical AI APIs
 * - Explainable AI Dashboard
 * - Pediatric Safety System
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical';

async function testExplainableAI() {
  console.log('\n🧠 Testing Explainable AI API...\n');

  try {
    const response = await axios.post(`${BASE_URL}/explainable-ai`, {
      modelId: 'sepsis-prediction',
      input: {
        heart_rate: 125,
        temperature: 38.5,
        wbc_count: 15,
        lactate: 3.2,
        respiratory_rate: 24,
        blood_pressure: 90
      },
      prediction: 0.82,
      demographics: { age: 65, gender: 'male', race: 'caucasian' },
      explainationType: 'comprehensive'
    });

    console.log('✅ XAI API Response:');
    console.log('   Success:', response.data.success);
    console.log('   Model:', response.data.explanation.modelInfo.name);
    console.log('   Prediction:', response.data.explanation.prediction.value);
    console.log('   Risk Level:', response.data.explanation.prediction.riskLevel);
    console.log('\n   Top 3 Contributing Features (SHAP):');
    response.data.explanation.shap.topFeatures.slice(0, 3).forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.feature}: ${f.value} (${f.impact} risk by ${f.percentage}%)`);
    });
    console.log('\n   Fairness Analysis:');
    console.log('   Overall Fairness:', response.data.explanation.fairness.overallFairness);
    console.log('   Demographic Parity:', response.data.explanation.fairness.metrics.demographic_parity.status);
    console.log('\n   Counterfactual Scenarios:');
    response.data.explanation.counterfactuals.slice(0, 2).forEach((cf, i) => {
      console.log(`   ${i + 1}. ${cf.change}`);
      console.log(`      Risk Reduction: ${cf.riskReduction}`);
      console.log(`      Intervention: ${cf.intervention}`);
    });

  } catch (error) {
    console.error('❌ XAI API Error:', error.response?.data || error.message);
  }
}

async function testPediatricDoseCalculator() {
  console.log('\n\n👶 Testing Pediatric Dose Calculator...\n');

  try {
    const response = await axios.post(`${BASE_URL}/pediatric-safety/dose-calculator`, {
      medication: 'amoxicillin',
      age: 18,
      ageUnit: 'months',
      weight: 11.5,
      indication: 'standard'
    });

    console.log('✅ Dose Calculator Response:');
    console.log('   Success:', response.data.success);
    console.log('   Drug:', response.data.dosing.drug);
    console.log('   Patient: Age', response.data.dosing.patient.ageMonths, 'months,', response.data.dosing.patient.weightKg, 'kg');
    console.log('   Recommended Dose:', response.data.dosing.dosing.recommendedDose, 'mg');
    console.log('   Frequency:', response.data.dosing.dosing.frequency);
    console.log('   Daily Max:', response.data.dosing.dailyMax, 'mg');
    console.log('   Off-Label:', response.data.dosing.offLabel);
    console.log('   Safety Flag:', response.data.dosing.safetyFlag);
    if (response.data.dosing.warnings.length > 0) {
      console.log('\n   ⚠️ Warnings:');
      response.data.dosing.warnings.forEach(w => {
        console.log(`   [${w.severity}] ${w.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Dose Calculator Error:', error.response?.data || error.message);
  }
}

async function testPediatricInteractions() {
  console.log('\n\n💊 Testing Pediatric Drug Interaction Checker...\n');

  try {
    const response = await axios.post(`${BASE_URL}/pediatric-safety/interaction-check`, {
      medications: ['ibuprofen', 'aspirin', 'acetaminophen']
    });

    console.log('✅ Interaction Check Response:');
    console.log('   Success:', response.data.success);
    console.log('   Has Interactions:', response.data.interactions.hasInteractions);
    console.log('   Overall Risk:', response.data.interactions.overallRisk);
    if (response.data.interactions.interactions.length > 0) {
      console.log('\n   ⚠️ Interactions Found:');
      response.data.interactions.interactions.forEach((int, i) => {
        console.log(`\n   ${i + 1}. ${int.medications.join(' + ')}`);
        console.log(`      Severity: ${int.severity}`);
        console.log(`      Mechanism: ${int.mechanism}`);
        console.log(`      Recommendation: ${int.recommendation}`);
      });
    }

  } catch (error) {
    console.error('❌ Interaction Check Error:', error.response?.data || error.message);
  }
}

async function testDevelopmentalScreening() {
  console.log('\n\n🧸 Testing Developmental Screening...\n');

  try {
    const response = await axios.post(`${BASE_URL}/pediatric-safety/developmental-screening`, {
      age: 18,
      ageUnit: 'months',
      milestones: {
        'Social-Emotional': {
          'Points to show others something interesting': true,
          'Shows defiant behavior': false
        },
        'Language': {
          'Says several single words': true,
          'Says sentences with 2-4 words': false
        },
        'Cognitive': {
          'Knows what ordinary things are for': true,
          'Sorts shapes and colors': false
        },
        'Motor': {
          'Walks alone': true,
          'Kicks a ball': false
        }
      }
    });

    console.log('✅ Developmental Screening Response:');
    console.log('   Success:', response.data.success);
    console.log('   Age:', response.data.assessment.ageMonths, 'months');
    console.log('   Age Bracket:', response.data.assessment.ageBracket);
    console.log('   Met Milestones:', response.data.assessment.metMilestones, '/', response.data.assessment.expectedMilestones);
    console.log('   On Track:', response.data.assessment.onTrack);
    if (response.data.assessment.delayedDomains.length > 0) {
      console.log('   Delayed Domains:', response.data.assessment.delayedDomains.join(', '));
    }
    console.log('   Recommendation:', response.data.assessment.recommendation);
    console.log('   Urgency:', response.data.assessment.urgency);

  } catch (error) {
    console.error('❌ Developmental Screening Error:', error.response?.data || error.message);
  }
}

async function testModelComparison() {
  console.log('\n\n🔬 Testing Model Comparison (XAI)...\n');

  try {
    const response = await axios.post(`${BASE_URL}/explainable-ai/compare`, {
      modelIds: ['sepsis-prediction', 'emergency-triage', 'mental-health'],
      input: {
        heart_rate: 110,
        temperature: 37.8,
        vitals_score: 85,
        anxiety: 'moderate'
      }
    });

    console.log('✅ Model Comparison Response:');
    console.log('   Success:', response.data.success);
    console.log('   Models Compared:', response.data.comparisons.length);
    console.log('\n   Predictions:');
    response.data.comparisons.forEach(comp => {
      console.log(`   - ${comp.modelId}: ${(comp.prediction * 100).toFixed(1)}% risk (confidence: ${(comp.confidence * 100).toFixed(1)}%)`);
    });
    console.log('\n   Consensus:');
    console.log('   Agreement:', response.data.consensus.agreement);
    console.log('   Average Prediction:', (response.data.consensus.averagePrediction * 100).toFixed(1) + '%');
    console.log('   Recommendation:', response.data.consensus.recommendation);

  } catch (error) {
    console.error('❌ Model Comparison Error:', error.response?.data || error.message);
  }
}

// Run all tests
(async () => {
  console.log('='.repeat(80));
  console.log('🏥 MEDICAL AI - NEW MODULES TEST SUITE');
  console.log('='.repeat(80));

  await testExplainableAI();
  await testPediatricDoseCalculator();
  await testPediatricInteractions();
  await testDevelopmentalScreening();
  await testModelComparison();

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(80) + '\n');
})();
