#!/usr/bin/env node
/**
 * 🧪 MEDICAL TOOLS INTEGRATION TEST
 * Tests all 5 advanced medical features
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3100';

// Test configuration
const TESTS = {
  ragSearch: true,
  translation: true,
  medicalChat: true,
  fhirPatient: true,
  dicom: false, // Skip DICOM (requires real .dcm file)
  speech: false  // Skip Speech (requires real audio file)
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

console.log('🧪 MEDICAL TOOLS INTEGRATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * Test 1: RAG Literature Search
 */
async function testRAGSearch() {
  if (!TESTS.ragSearch) {
    results.skipped++;
    console.log('⊘ Test 1: RAG Search - SKIPPED\n');
    return;
  }

  console.log('🔍 Test 1: RAG Literature Search');
  console.log('   Testing PubMed + WHO Guidelines search...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/rag/search`, {
      query: 'diabetes treatment guidelines',
      max_results: 5,
      sources: ['pubmed', 'who'],
      language: 'en'
    });

    if (response.data.success) {
      console.log('   ✅ RAG Search API: SUCCESS');
      console.log(`   📊 Results Found: ${response.data.results?.length || 0}`);
      console.log(`   📚 PubMed: ${response.data.sources?.pubmed?.count || 0} results`);
      console.log(`   🏥 WHO: ${response.data.sources?.who?.count || 0} results`);
      console.log(`   ⏱️  Response Time: ${response.data.metadata?.response_time_ms || 0}ms`);

      if (response.data.results && response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        console.log(`   📄 First Result: ${firstResult.title?.substring(0, 60)}...`);
        console.log(`   🔗 Source: ${firstResult.source}`);
      }

      results.passed++;
      results.details.push({ test: 'RAG Search', status: 'PASSED', details: response.data });
    } else {
      throw new Error(response.data.error || 'Unknown error');
    }
  } catch (error) {
    console.log(`   ❌ RAG Search API: FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'RAG Search', status: 'FAILED', error: error.message });
  }

  console.log('\n');
}

/**
 * Test 2: Medical Translation
 */
async function testTranslation() {
  if (!TESTS.translation) {
    results.skipped++;
    console.log('⊘ Test 2: Translation - SKIPPED\n');
    return;
  }

  console.log('🌍 Test 2: Medical Translation');
  console.log('   Testing medical text translation...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/translate`, {
      text: 'The patient presents with hypertension and diabetes mellitus',
      target_language: 'tr',
      source_language: 'en'
    });

    if (response.data.success || response.data.translated_text) {
      console.log('   ✅ Translation API: SUCCESS');
      console.log(`   📝 Original: The patient presents with hypertension...`);
      console.log(`   📝 Translated: ${response.data.translated_text?.substring(0, 80)}...`);
      console.log(`   🌐 Target Language: Turkish (tr)`);

      results.passed++;
      results.details.push({ test: 'Translation', status: 'PASSED', details: response.data });
    } else {
      throw new Error(response.data.error || 'Translation failed');
    }
  } catch (error) {
    console.log(`   ❌ Translation API: FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'Translation', status: 'FAILED', error: error.message });
  }

  console.log('\n');
}

/**
 * Test 3: Medical Chat (Azure OpenAI OX5C9E2B)
 */
async function testMedicalChat() {
  if (!TESTS.medicalChat) {
    results.skipped++;
    console.log('⊘ Test 3: Medical Chat - SKIPPED\n');
    return;
  }

  console.log('💬 Test 3: Medical Chat (Azure OpenAI OX5C9E2B)');
  console.log('   Testing cardiology specialization...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/medical/chat`, {
      message: 'What are the symptoms of atrial fibrillation?',
      specialization: 'cardiology',
      language: 'en'
    });

    if (response.data.success) {
      console.log('   ✅ Medical Chat API: SUCCESS');
      console.log(`   🏥 Specialization: Cardiology`);
      console.log(`   💬 Question: What are the symptoms of atrial fibrillation?`);
      console.log(`   📝 Response: ${response.data.response?.substring(0, 100)}...`);
      console.log(`   🤖 Model: ${response.data.metadata?.model || 'Azure OX5C9E2B Turbo'}`);
      console.log(`   ⏱️  Response Time: ${response.data.metadata?.response_time_ms || 0}ms`);

      results.passed++;
      results.details.push({ test: 'Medical Chat', status: 'PASSED', details: response.data });
    } else {
      throw new Error(response.data.error || 'Chat failed');
    }
  } catch (error) {
    console.log(`   ❌ Medical Chat API: FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'Medical Chat', status: 'FAILED', error: error.message });
  }

  console.log('\n');
}

/**
 * Test 4: FHIR Patient Record Creation
 */
async function testFHIRPatient() {
  if (!TESTS.fhirPatient) {
    results.skipped++;
    console.log('⊘ Test 4: FHIR Patient - SKIPPED\n');
    return;
  }

  console.log('🏥 Test 4: FHIR Patient Record Creation');
  console.log('   Testing FHIR R4 patient creation...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/fhir/patient`, {
      given: 'John',
      family: 'Doe',
      gender: 'male',
      birthDate: '1980-01-01',
      hospital_id: 'test-hospital-001',
      user_id: 'test-user-' + Date.now()
    });

    if (response.data.success) {
      console.log('   ✅ FHIR Patient API: SUCCESS');
      console.log(`   👤 Patient Name: John Doe`);
      console.log(`   🆔 Patient ID: ${response.data.patient_id || 'N/A'}`);
      console.log(`   📅 Birth Date: 1980-01-01`);
      console.log(`   ⚕️  Gender: Male`);
      console.log(`   ⏱️  Response Time: ${response.data.metadata?.response_time_ms || 0}ms`);

      results.passed++;
      results.details.push({ test: 'FHIR Patient', status: 'PASSED', details: response.data });
    } else {
      throw new Error(response.data.error || 'Patient creation failed');
    }
  } catch (error) {
    console.log(`   ❌ FHIR Patient API: FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'FHIR Patient', status: 'FAILED', error: error.message });
  }

  console.log('\n');
}

/**
 * Test 5: DICOM Upload (requires real .dcm file)
 */
async function testDICOM() {
  if (!TESTS.dicom) {
    results.skipped++;
    console.log('⊘ Test 5: DICOM Upload - SKIPPED (requires .dcm file)\n');
    return;
  }

  console.log('🩻 Test 5: DICOM Upload');
  console.log('   Testing DICOM medical imaging upload...\n');

  // This test requires a real DICOM file
  console.log('   ℹ️  Skipped - requires real .dcm file for testing\n');
  results.skipped++;
}

/**
 * Test 6: Speech Transcription (requires audio file)
 */
async function testSpeech() {
  if (!TESTS.speech) {
    results.skipped++;
    console.log('⊘ Test 6: Speech Transcription - SKIPPED (requires audio)\n');
    return;
  }

  console.log('🎙️ Test 6: Speech Transcription');
  console.log('   Testing Azure Speech STT...\n');

  // This test requires a real audio file
  console.log('   ℹ️  Skipped - requires real audio file for testing\n');
  results.skipped++;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting medical tools integration tests...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await testRAGSearch();
  await testTranslation();
  await testMedicalChat();
  await testFHIRPatient();
  await testDICOM();
  await testSpeech();

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⊘  Skipped: ${results.skipped}`);
  console.log(`   📈 Total Tests: ${results.passed + results.failed + results.skipped}`);

  if (results.failed === 0 && results.passed > 0) {
    console.log('\n   🎉 ALL ACTIVE TESTS PASSED!\n');
  } else if (results.failed > 0) {
    console.log('\n   ⚠️  SOME TESTS FAILED - Check details above\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `./TEST-REPORT-MEDICAL-${timestamp}.json`;

  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      total: results.passed + results.failed + results.skipped
    },
    tests: results.details
  }, null, 2));

  console.log(`📄 Detailed report saved to: ${reportPath}\n`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
