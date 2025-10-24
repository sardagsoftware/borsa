#!/usr/bin/env node
/**
 * 🧪 NEO4J LEGAL AI TEST SCRIPT
 * =============================
 * LyDian Hukuk AI - Knowledge Graph Test
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function testNeo4j() {
  const session = driver.session();

  try {
    console.log('\n🔍 NEO4J BAĞLANTI TESTİ\n' + '='.repeat(50));

    // Test 1: Basit sorgu
    console.log('\n✅ Test 1: Bağlantı kontrolü...');
    const result1 = await session.run('RETURN "LyDian Hukuk AI Aktif!" AS status');
    console.log('   Sonuç:', result1.records[0].get('status'));

    // Test 2: Hukuk maddesi oluştur
    console.log('\n✅ Test 2: Hukuk maddesi oluşturuluyor...');
    const result2 = await session.run(`
      MERGE (m:HukukMaddesi {kod: 'TCK 142'})
      SET m.baslik = 'Hakaret',
          m.kategori = 'Kişilere Karşı Suçlar',
          m.ceza = '3 aydan 2 yıla kadar hapis',
          m.created_at = datetime()
      RETURN m
    `);
    console.log('   Oluşturuldu:', result2.records[0].get('m').properties);

    // Test 3: İkinci madde ve ilişki
    console.log('\n✅ Test 3: İlişkili maddeler oluşturuluyor...');
    const result3 = await session.run(`
      MERGE (m1:HukukMaddesi {kod: 'TCK 142'})
      MERGE (m2:HukukMaddesi {kod: 'TCK 125'})
      SET m2.baslik = 'Hakaretin Kamuya Açık Ortamda İşlenmesi',
          m2.kategori = 'Kişilere Karşı Suçlar'
      MERGE (m1)-[r:ILISKILI_MADDE]->(m2)
      RETURN m1, r, m2
    `);
    console.log('   İlişki kuruldu: TCK 142 → TCK 125');

    // Test 4: Emsal dava
    console.log('\n✅ Test 4: Emsal dava ekleniyor...');
    const result4 = await session.run(`
      MERGE (m:HukukMaddesi {kod: 'TCK 142'})
      CREATE (d:EmsalDava {
        karar_no: '2023/1234',
        mahkeme: 'Yargıtay 4. Ceza Dairesi',
        tarih: date('2023-05-15'),
        sonuc: 'Beraat',
        ozet: 'Sosyal medyada yapılan eleştirinin hakaret kapsamında değerlendirilmemesi'
      })
      CREATE (m)-[:EMSAL_KARAR]->(d)
      RETURN m, d
    `);
    console.log('   Emsal dava eklendi: 2023/1234');

    // Test 5: Knowledge Graph sorgulama
    console.log('\n✅ Test 5: Knowledge Graph sorgulanıyor...');
    const result5 = await session.run(`
      MATCH (m:HukukMaddesi {kod: 'TCK 142'})-[:EMSAL_KARAR]->(d:EmsalDava)
      RETURN m.baslik AS madde, d.karar_no AS karar, d.sonuc AS sonuc
    `);

    if (result5.records.length > 0) {
      const record = result5.records[0];
      console.log('   Madde:', record.get('madde'));
      console.log('   Karar No:', record.get('karar'));
      console.log('   Sonuç:', record.get('sonuc'));
    }

    // Test 6: İstatistikler
    console.log('\n✅ Test 6: Veritabanı istatistikleri...');
    const result6 = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS tip, count(*) AS adet
      ORDER BY adet DESC
    `);

    console.log('\n   📊 Veritabanı İçeriği:');
    result6.records.forEach(record => {
      console.log(`      ${record.get('tip')}: ${record.get('adet')} adet`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ TÜM TESTLER BAŞARILI!\n');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Çalıştır
testNeo4j();
