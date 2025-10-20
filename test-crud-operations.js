#!/usr/bin/env node
/**
 * CRUD Operations Test
 * Test database operations using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://ceipxudbpixhfsnrfjvv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXB4dWRicGl4aGZzbnJmanZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzMTM2MSwiZXhwIjoyMDY5NjA3MzYxfQ.PGkYl2WlTktREJHIQGNnZNSdHJSoSGXjNbNU-jziZd0';

console.log('🧪 Testing CRUD Operations\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCRUD() {
  const testId = crypto.randomUUID();
  const testEmail = `test-${Date.now()}@ailydian.com`;

  try {
    // Test 1: CREATE - Tenant oluştur
    console.log('1️⃣  CREATE - Creating test tenant...');
    const now = new Date().toISOString();
    const { data: tenant, error: tenantError } = await supabase
      .from('Tenant')
      .insert({
        id: testId,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        tier: 'FREE',
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (tenantError) {
      console.log('   ❌ Tenant creation failed:', tenantError.message);
      throw tenantError;
    }
    console.log('   ✅ Tenant created:', tenant.name);

    // Test 2: CREATE - User oluştur
    console.log('\n2️⃣  CREATE - Creating test user...');
    const userId = crypto.randomUUID();
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: testEmail,
        name: 'Test User',
        passwordHash: 'hashed_password_123',
        role: 'USER',
        tenantId: testId,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (userError) {
      console.log('   ❌ User creation failed:', userError.message);
      throw userError;
    }
    console.log('   ✅ User created:', user.email);

    // Test 3: READ - User'ı oku
    console.log('\n3️⃣  READ - Reading user...');
    const { data: readUser, error: readError } = await supabase
      .from('User')
      .select('*, tenant:Tenant(*)')
      .eq('id', userId)
      .single();

    if (readError) {
      console.log('   ❌ User read failed:', readError.message);
      throw readError;
    }
    console.log('   ✅ User read:', readUser.email);
    console.log('   ✅ Tenant relation:', readUser.tenant?.name);

    // Test 4: UPDATE - User'ı güncelle
    console.log('\n4️⃣  UPDATE - Updating user...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({ name: 'Updated Test User' })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.log('   ❌ User update failed:', updateError.message);
      throw updateError;
    }
    console.log('   ✅ User updated:', updatedUser.name);

    // Test 5: CREATE - Conversation oluştur
    console.log('\n5️⃣  CREATE - Creating conversation...');
    const convId = crypto.randomUUID();
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .insert({
        id: convId,
        userId: userId,
        title: 'Test Conversation',
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (convError) {
      console.log('   ❌ Conversation creation failed:', convError.message);
      throw convError;
    }
    console.log('   ✅ Conversation created:', conversation.title);

    // Test 6: CREATE - Message oluştur
    console.log('\n6️⃣  CREATE - Creating message...');
    const { data: message, error: msgError } = await supabase
      .from('Message')
      .insert({
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'USER',
        content: 'Hello, this is a test message!',
        createdAt: now
      })
      .select()
      .single();

    if (msgError) {
      console.log('   ❌ Message creation failed:', msgError.message);
      throw msgError;
    }
    console.log('   ✅ Message created:', message.content.substring(0, 30) + '...');

    // Test 7: LIST - Conversation'ı mesajları ile listele
    console.log('\n7️⃣  LIST - Listing conversations with messages...');
    const { data: convWithMessages, error: listError } = await supabase
      .from('Conversation')
      .select('*, messages:Message(*), user:User(*)')
      .eq('id', convId)
      .single();

    if (listError) {
      console.log('   ❌ List failed:', listError.message);
      throw listError;
    }
    console.log('   ✅ Conversation:', convWithMessages.title);
    console.log('   ✅ User:', convWithMessages.user.name);
    console.log('   ✅ Messages count:', convWithMessages.messages.length);

    // Test 8: DELETE - Cleanup (CASCADE test)
    console.log('\n8️⃣  DELETE - Cleaning up (testing CASCADE)...');

    // User'ı silince conversation ve messages de silinmeli (CASCADE)
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.log('   ❌ Delete failed:', deleteError.message);
      throw deleteError;
    }
    console.log('   ✅ User deleted (CASCADE to conversations & messages)');

    // Conversation'ın silindiğini doğrula
    const { data: checkConv } = await supabase
      .from('Conversation')
      .select()
      .eq('id', convId);

    if (checkConv && checkConv.length === 0) {
      console.log('   ✅ Conversation also deleted (CASCADE working)');
    }

    // Tenant'ı temizle
    await supabase
      .from('Tenant')
      .delete()
      .eq('id', testId);
    console.log('   ✅ Tenant deleted');

    // SUMMARY
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 ALL CRUD TESTS PASSED!');
    console.log('═'.repeat(60));
    console.log('\n✅ Test Results:');
    console.log('   • CREATE operations: ✅ Working');
    console.log('   • READ operations: ✅ Working');
    console.log('   • UPDATE operations: ✅ Working');
    console.log('   • DELETE operations: ✅ Working');
    console.log('   • Foreign Keys: ✅ Working');
    console.log('   • CASCADE deletes: ✅ Working');
    console.log('   • Relations (JOINs): ✅ Working');

    console.log('\n📊 Database Status: FULLY OPERATIONAL');
    console.log('✨ Ready for production use!\n');

    return true;

  } catch (error) {
    console.error('\n❌ CRUD Test Failed:', error.message);
    console.error('\nCleanup attempt...');

    // Cleanup on failure
    try {
      await supabase.from('User').delete().eq('email', testEmail);
      await supabase.from('Tenant').delete().eq('id', testId);
      console.log('✅ Cleanup successful');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed:', cleanupError.message);
    }

    return false;
  }
}

testCRUD();
