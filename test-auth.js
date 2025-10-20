/**
 * Test Authentication System
 */

const User = require('./backend/models/User');

async function testAuthSystem() {
    console.log('===== TESTING AUTHENTICATION SYSTEM =====\n');

    try {
        // Test 1: Create User
        console.log('Test 1: Creating new user...');
        const newUser = await User.createUser({
            email: 'test@ailydian.com',
            password: 'TestPass123!',
            name: 'Test User',
            phone: '+1234567890'
        });
        console.log('✓ User created:', newUser);
        console.log('');

        // Test 2: Login
        console.log('Test 2: Logging in...');
        const loginResult = await User.login({
            email: 'test@ailydian.com',
            password: 'TestPass123!'
        });
        console.log('✓ Login successful');
        console.log('Token:', loginResult.token.substring(0, 50) + '...');
        console.log('User:', loginResult.user);
        console.log('');

        // Test 3: Find User
        console.log('Test 3: Finding user by email...');
        const foundUser = User.findByEmail('test@ailydian.com');
        console.log('✓ User found:', foundUser.name, '-', foundUser.email);
        console.log('');

        // Test 4: Get User with Stats
        console.log('Test 4: Getting user with stats...');
        const userWithStats = User.getUserWithStats(newUser.id);
        console.log('✓ User with stats:', {
            name: userWithStats.name,
            credits: userWithStats.credits,
            stats: userWithStats.stats
        });
        console.log('');

        // Test 5: Update Usage
        console.log('Test 5: Updating usage...');
        User.updateUsage(newUser.id, {
            chatMessages: 5,
            imagesGenerated: 2,
            voiceMinutes: 3,
            creditsUsed: 10
        });
        const updatedUser = User.getUserWithStats(newUser.id);
        console.log('✓ Usage updated:', updatedUser.stats);
        console.log('');

        // Test 6: Verify Token
        console.log('Test 6: Verifying token...');
        const decoded = User.verifyToken(loginResult.token);
        console.log('✓ Token verified:', {
            id: decoded.id,
            email: decoded.email,
            subscription: decoded.subscription
        });
        console.log('');

        // Test 7: Enable 2FA
        console.log('Test 7: Enabling two-factor authentication...');
        const twoFactorData = User.enableTwoFactor(newUser.id);
        console.log('✓ 2FA enabled');
        console.log('Secret:', twoFactorData.secret);
        console.log('QR Code URL:', twoFactorData.qrCode.substring(0, 80) + '...');
        console.log('');

        console.log('===== ALL TESTS PASSED =====');
        console.log('');
        console.log('Summary:');
        console.log('- User registration: ✓');
        console.log('- User login: ✓');
        console.log('- User lookup: ✓');
        console.log('- Stats tracking: ✓');
        console.log('- Usage updates: ✓');
        console.log('- Token verification: ✓');
        console.log('- Two-factor authentication: ✓');
        console.log('');
        console.log('Test user credentials:');
        console.log('Email: test@ailydian.com');
        console.log('Password: TestPass123!');
        console.log('');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }
}

// Run tests
testAuthSystem().catch(console.error);
