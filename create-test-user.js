/**
 * Create Test User Script
 * Creates a test user for authentication testing
 */

const User = require('./backend/models/User');

async function createTestUser() {
  try {
    console.log('Creating test user...\n');

    // Check if test user already exists
    const existingUser = await User.findByEmail('test@ailydian.com');

    if (existingUser) {
      console.log('✓ Test user already exists!');
      console.log('📧 Email: test@ailydian.com');
      console.log('🔑 Password: TestPass123!');
      console.log('\n✅ You can now login at http://localhost:3100/auth.html');
      return;
    }

    // Create test user
    const user = await User.createUser({
      email: 'test@ailydian.com',
      password: 'TestPass123!',
      name: 'Test User',
      phone: null
    });

    console.log('✅ Test user created successfully!\n');
    console.log('📧 Email: test@ailydian.com');
    console.log('🔑 Password: TestPass123!');
    console.log('👤 Name:', user.name);
    console.log('💳 Credits:', user.credits);
    console.log('📅 Created:', user.createdAt);
    console.log('\n✅ You can now login at http://localhost:3100/auth.html');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createTestUser().catch(console.error);
}

module.exports = { createTestUser };
