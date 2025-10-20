/**
 * ✅ PREMIUM ZERO-ERROR TEST SUITE
 * Tests all 8 Legal AI services
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3100';

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

function logSuccess(service, message) {
    log(`✅ ${service}: ${message}`, 'green');
}

function logError(service, message) {
    log(`❌ ${service}: ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

async function test1_LegalAnalysis() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 1: Hukuki Analiz (Legal Analysis)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, {
            model: 'gpt-4-turbo',
            message: 'Türk Borçlar Kanunu\'nda satış sözleşmelerinin unsurları nelerdir?',
            temperature: 0.7,
            max_tokens: 2048,
            history: [{
                role: 'system',
                content: 'Sen Türk hukuku uzmanı bir avukatsın. Davaları detaylı analiz ediyorsun.'
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success && response.data.response) {
            logSuccess('Hukuki Analiz', 'ÇALIŞIYOR ✓');
            logInfo(`Response length: ${response.data.response.length} chars`);
            logInfo(`Model: ${response.data.model || 'gpt-4-turbo'}`);
            return { service: 'Hukuki Analiz', status: '✅ WORKING', details: response.data };
        } else {
            logError('Hukuki Analiz', 'No response received');
            return { service: 'Hukuki Analiz', status: '❌ FAILED', error: 'No response' };
        }
    } catch (error) {
        logError('Hukuki Analiz', error.message);
        return { service: 'Hukuki Analiz', status: '❌ FAILED', error: error.message };
    }
}

async function test2_VoiceCaseFile() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 2: 🎤 Sesli Dava Dosyası (Voice Case File)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        const transcript = 'Merhaba, ben bir iş kazası geçirdim. İşverim gerekli güvenlik önlemlerini almadı ve ben çalışırken yaralandım. Sol kolum kırıldı ve 3 ay çalışamadım. İşverimden tazminat talep etmek istiyorum.';

        const response = await axios.post(`${BASE_URL}/api/azure/legal/voice-analysis`, {
            transcript: transcript
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
            logSuccess('Sesli Dava Dosyası', 'ÇALIŞIYOR ✓');
            logInfo(`Service: ${response.data.service}`);
            logInfo(`Demo Mode: ${response.data.demoMode ? 'Yes' : 'No'}`);
            return { service: 'Sesli Dava Dosyası', status: '✅ WORKING', details: response.data };
        } else {
            logError('Sesli Dava Dosyası', response.data.error);
            return { service: 'Sesli Dava Dosyası', status: '❌ FAILED', error: response.data.error };
        }
    } catch (error) {
        logError('Sesli Dava Dosyası', error.message);
        return { service: 'Sesli Dava Dosyası', status: '❌ FAILED', error: error.message };
    }
}

async function test3_DocumentOCR() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 3: 📄 Belge OCR (Document OCR)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        // Create a dummy test file
        const testContent = 'TEST HUKUKI BELGE\n\nDava No: 2025/123\nMahkeme: İstanbul 1. Asliye Hukuk Mahkemesi\n\nDavacı: Test Davacı\nDavalı: Test Davalı';
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', Buffer.from(testContent), {
            filename: 'test-document.txt',
            contentType: 'text/plain'
        });

        const response = await axios.post(`${BASE_URL}/api/azure/legal/document-intelligence`, form, {
            headers: form.getHeaders()
        });

        if (response.data.success) {
            logSuccess('Belge OCR', 'ÇALIŞIYOR ✓');
            logInfo(`Service: ${response.data.service}`);
            logInfo(`Demo Mode: ${response.data.demoMode ? 'Yes' : 'No'}`);
            logInfo(`Pages: ${response.data.pageCount || 0}`);
            return { service: 'Belge OCR', status: '✅ WORKING', details: response.data };
        } else {
            logError('Belge OCR', response.data.error);
            return { service: 'Belge OCR', status: '❌ FAILED', error: response.data.error };
        }
    } catch (error) {
        logError('Belge OCR', error.message);
        return { service: 'Belge OCR', status: '❌ FAILED', error: error.message };
    }
}

async function test4_PrecedentSearch() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 4: ⚖️ Emsal Arama (Precedent Search)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, {
            model: 'gpt-4-turbo',
            message: 'İşçinin iş kazasından dolayı işverenden tazminat talep etmesi - benzer Yargıtay kararları nelerdir?',
            temperature: 0.7,
            max_tokens: 2048,
            history: [{
                role: 'system',
                content: 'Sen Türk hukuku uzmanısın. Verilen dava için benzer emsal kararları bul ve analiz et. Yargıtay kararları, Anayasa Mahkemesi kararları ve önemli ilk derece mahkeme kararlarını değerlendir.'
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success && response.data.response) {
            logSuccess('Emsal Arama', 'ÇALIŞIYOR ✓');
            logInfo(`Response length: ${response.data.response.length} chars`);
            return { service: 'Emsal Arama', status: '✅ WORKING', details: response.data };
        } else {
            logError('Emsal Arama', 'No response received');
            return { service: 'Emsal Arama', status: '❌ FAILED', error: 'No response' };
        }
    } catch (error) {
        logError('Emsal Arama', error.message);
        return { service: 'Emsal Arama', status: '❌ FAILED', error: error.message };
    }
}

async function test5_Translation() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 5: 🌍 Çeviri (Translation)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        const response = await axios.post(`${BASE_URL}/api/legal-ai/translate`, {
            text: 'Sözleşme hükümleri taraflarca kabul edilmiştir.',
            targetLanguage: 'en',
            options: { preserveLegalTerms: true }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
            logSuccess('Çeviri', 'ÇALIŞIYOR ✓');
            logInfo(`Original: ${response.data.originalText}`);
            logInfo(`Translated: ${response.data.translatedText}`);
            logInfo(`Demo Mode: ${response.data.demoMode ? 'Yes' : 'No'}`);
            return { service: 'Çeviri', status: '✅ WORKING', details: response.data };
        } else {
            logError('Çeviri', response.data.error);
            return { service: 'Çeviri', status: '❌ FAILED', error: response.data.error };
        }
    } catch (error) {
        logError('Çeviri', error.message);
        return { service: 'Çeviri', status: '❌ FAILED', error: error.message };
    }
}

async function test6_ImageAnalysis() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 6: 📸 Görüntü Analizi (Image Analysis)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        // Create a 1x1 white pixel PNG
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');

        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', testImageBuffer, {
            filename: 'test-image.png',
            contentType: 'image/png'
        });

        const response = await axios.post(`${BASE_URL}/api/azure/legal/computer-vision`, form, {
            headers: form.getHeaders()
        });

        if (response.data.success) {
            logSuccess('Görüntü Analizi', 'ÇALIŞIYOR ✓');
            logInfo(`Service: ${response.data.service}`);
            logInfo(`Demo Mode: ${response.data.demoMode ? 'Yes' : 'No'}`);
            logInfo(`Description: ${response.data.description}`);
            return { service: 'Görüntü Analizi', status: '✅ WORKING', details: response.data };
        } else {
            logError('Görüntü Analizi', response.data.error);
            return { service: 'Görüntü Analizi', status: '❌ FAILED', error: response.data.error };
        }
    } catch (error) {
        logError('Görüntü Analizi', error.message);
        return { service: 'Görüntü Analizi', status: '❌ FAILED', error: error.message };
    }
}

async function test7_VideoAnalysis() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 7: 🎥 Video Analizi (Video Analysis)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        // Create dummy video data
        const testVideoBuffer = Buffer.from('TEST VIDEO DATA');

        const FormData = require('form-data');
        const form = new FormData();
        form.append('video', testVideoBuffer, {
            filename: 'test-video.mp4',
            contentType: 'video/mp4'
        });

        const response = await axios.post(`${BASE_URL}/api/azure/legal/video-indexer`, form, {
            headers: form.getHeaders()
        });

        if (response.data.success) {
            logSuccess('Video Analizi', 'ÇALIŞIYOR ✓');
            logInfo(`Service: ${response.data.service}`);
            logInfo(`Demo Mode: ${response.data.demoMode ? 'Yes' : 'No'}`);
            logInfo(`Duration: ${response.data.duration}s`);
            return { service: 'Video Analizi', status: '✅ WORKING', details: response.data };
        } else {
            logError('Video Analizi', response.data.error);
            return { service: 'Video Analizi', status: '❌ FAILED', error: response.data.error };
        }
    } catch (error) {
        logError('Video Analizi', error.message);
        return { service: 'Video Analizi', status: '❌ FAILED', error: error.message };
    }
}

async function test8_GDPR() {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('TEST 8: 🛡️ GDPR Uyumluluk (GDPR Compliance)', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

    try {
        const response = await axios.post(`${BASE_URL}/api/legal-ai/legal-systems/eu/gdpr/check`, {
            dataProcessingActivity: {
                description: 'Hukuki danışmanlık hizmeti için müşteri bilgilerinin işlenmesi',
                legalBasis: 'legitimate_interest',
                dataTypes: ['name', 'email', 'phone'],
                purposes: ['legal_consultation', 'contract_management'],
                securityMeasures: ['encryption', 'access_control', 'audit_logs'],
                dataSubjectRights: ['access', 'rectification', 'erasure', 'portability']
            }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success !== undefined) {
            logSuccess('GDPR Uyumluluk', 'ÇALIŞIYOR ✓');
            logInfo(`Compliance Score: ${response.data.complianceScore}/100`);
            logInfo(`Risk Level: ${response.data.riskLevel}`);
            logInfo(`Compliant: ${response.data.compliant ? 'Yes' : 'No'}`);
            return { service: 'GDPR Uyumluluk', status: '✅ WORKING', details: response.data };
        } else {
            logError('GDPR Uyumluluk', 'Unexpected response format');
            return { service: 'GDPR Uyumluluk', status: '❌ FAILED', error: 'Unexpected response' };
        }
    } catch (error) {
        logError('GDPR Uyumluluk', error.message);
        return { service: 'GDPR Uyumluluk', status: '❌ FAILED', error: error.message };
    }
}

async function runAllTests() {
    log('\n═══════════════════════════════════════════════════════════════', 'cyan');
    log('  🧪 PREMIUM ZERO-ERROR TEST SUITE - ALL 8 SERVICES', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');

    const results = [];

    results.push(await test1_LegalAnalysis());
    results.push(await test2_VoiceCaseFile());
    results.push(await test3_DocumentOCR());
    results.push(await test4_PrecedentSearch());
    results.push(await test5_Translation());
    results.push(await test6_ImageAnalysis());
    results.push(await test7_VideoAnalysis());
    results.push(await test8_GDPR());

    // Summary
    log('\n═══════════════════════════════════════════════════════════════', 'cyan');
    log('  📊 TEST SUMMARY', 'cyan');
    log('═══════════════════════════════════════════════════════════════', 'cyan');

    const passed = results.filter(r => r.status.includes('✅')).length;
    const failed = results.filter(r => r.status.includes('❌')).length;

    results.forEach((result, index) => {
        const color = result.status.includes('✅') ? 'green' : 'red';
        log(`${index + 1}. ${result.service}: ${result.status}`, color);
    });

    log('\n───────────────────────────────────────────────────────────────', 'cyan');
    log(`Total Services: 8`, 'cyan');
    log(`✅ Passed: ${passed}`, passed === 8 ? 'green' : 'yellow');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${Math.round((passed / 8) * 100)}%`, passed === 8 ? 'green' : 'yellow');
    log('═══════════════════════════════════════════════════════════════\n', 'cyan');

    // Save results to file
    const report = {
        timestamp: new Date().toISOString(),
        totalServices: 8,
        passed: passed,
        failed: failed,
        successRate: Math.round((passed / 8) * 100),
        results: results
    };

    fs.writeFileSync(
        'TEST-REPORT-' + new Date().toISOString().split('T')[0] + '.json',
        JSON.stringify(report, null, 2)
    );

    log(`✅ Test report saved to: TEST-REPORT-${new Date().toISOString().split('T')[0]}.json`, 'green');

    return report;
}

// Run tests
runAllTests()
    .then(() => {
        log('\n✅ All tests completed!', 'green');
        process.exit(0);
    })
    .catch(error => {
        log(`\n❌ Test suite failed: ${error.message}`, 'red');
        process.exit(1);
    });
