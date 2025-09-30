const bcrypt = require('bcryptjs');

// Test credentials
const email = 'demo@ailydian.com';
const password = 'Demo2025!';
const hash = '$2b$12$PvxW9uiX4ImXi/vLDhHnXOgnF1cnTchlNAyi0/wN04qc6/GSjSTVS';

console.log('=== LOGIN TEST ===');
console.log('Email:', email);
console.log('Password:', password);
console.log('Hash:', hash);
console.log();

// Test bcrypt comparison
const isValid = bcrypt.compareSync(password, hash);
console.log('Password validation:', isValid ? '✅ SUCCESS' : '❌ FAILED');

if (isValid) {
  console.log();
  console.log('🎉 Login credentials are CORRECT!');
  console.log();
  console.log('You can now login with:');
  console.log('  Email: demo@ailydian.com');
  console.log('  Password: Demo2025!');
} else {
  console.log();
  console.log('❌ ERROR: Password does not match hash!');
}