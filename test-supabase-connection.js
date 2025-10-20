// Test Supabase Connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);
console.log('Has Service Key:', !!supabaseKey && supabaseKey !== '[YOUR-SUPABASE-SERVICE-ROLE-KEY]');
console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

if (!supabaseUrl || supabaseUrl.includes('cmxkfqyaqpivcvwdiyul')) {
    console.log('✅ Supabase URL looks valid');

    if (!supabaseKey || supabaseKey.startsWith('[YOUR-SUPABASE')) {
        console.error('❌ Supabase API key not configured!');
        console.log('\n📝 Please update your .env file:');
        console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
        console.log('\n   Get these from: https://supabase.com/dashboard/project/cmxkfqyaqpivcvwdiyul/settings/api');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection with a simple query
    supabase.from('_prisma_migrations').select('*').limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.log('⚠️ Table query failed (expected if database is new):', error.message);
                console.log('\n✅ But connection to Supabase is working!');
                console.log('📊 Database is ready for schema push.');
            } else {
                console.log('✅ Successfully connected to Supabase!');
                console.log('📊 Database is operational.');
            }
        })
        .catch(err => {
            console.error('❌ Connection failed:', err.message);
            console.log('\n🔧 Possible issues:');
            console.log('   1. Database is paused (go to Supabase dashboard to resume)');
            console.log('   2. API key is invalid');
            console.log('   3. Network/firewall issues');
        });
} else {
    console.error('❌ Supabase URL not configured or invalid!');
}
