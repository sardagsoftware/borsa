/**
 * Test script for Telemedicine & Remote Patient Monitoring Platform
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/telemedicine-platform';

async function testScheduleAppointment() {
    console.log('\\n📅 Testing Schedule Appointment...\\n');

    try {
        const response = await axios.post(`${BASE_URL}/schedule-appointment`, {
            patientId: 'PT001',
            patientName: 'John Doe',
            providerId: 'DR001',
            consultationType: 'initial',
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Annual checkup',
            symptoms: ['fatigue', 'headache']
        });

        console.log('✅ Appointment Response:');
        console.log('   Success:', response.data.success);
        console.log('   Appointment ID:', response.data.appointment.id);
        console.log('   Provider:', response.data.appointment.provider.name);
        console.log('   Confirmation Code:', response.data.confirmationCode);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testProviderList() {
    console.log('\\n\\n👨‍⚕️ Testing Provider List...\\n');

    try {
        const response = await axios.get(`${BASE_URL}/providers`);

        console.log('✅ Providers Response:');
        console.log('   Total Providers:', response.data.total);
        response.data.providers.forEach((p, i) => {
            console.log(`\\n   ${i + 1}. ${p.name} - ${p.specialty}`);
            console.log(`      Rating: ${p.rating} ⭐`);
            console.log(`      Experience: ${p.yearsExperience} years`);
            console.log(`      Status: ${p.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testPlatformStats() {
    console.log('\\n\\n📊 Testing Platform Stats...\\n');

    try {
        const response = await axios.get(`${BASE_URL}/platform-stats`);

        console.log('✅ Platform Stats:');
        console.log('   Total Providers:', response.data.platformStats.totalProviders);
        console.log('   Active Providers:', response.data.platformStats.activeProviders);
        console.log('   Patient Satisfaction:', response.data.platformStats.patientSatisfaction);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('🏥 TELEMEDICINE & REMOTE PATIENT MONITORING - TEST SUITE');
    console.log('='.repeat(80));

    await testScheduleAppointment();
    await testProviderList();
    await testPlatformStats();

    console.log('\\n' + '='.repeat(80));
    console.log('✅ ALL TELEMEDICINE TESTS COMPLETED');
    console.log('='.repeat(80) + '\\n');
})();
