// LCI Database Seed Script
// White-hat: Realistic Turkish brands and complaints for demo

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LCI database seed...');

  // 1. Create demo users
  console.log('👤 Creating users...');

  const demoPassword = await hash('Demo1234!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lci.lydian.ai' },
    update: {},
    create: {
      email: 'admin@lci.lydian.ai',
      emailHash: await hash('admin@lci.lydian.ai', 12),
      passwordHash: demoPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      kycLevel: 'LEVEL_3',
      locale: 'tr',
    },
  });

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@lci.lydian.ai' },
    update: {},
    create: {
      email: 'moderator@lci.lydian.ai',
      emailHash: await hash('moderator@lci.lydian.ai', 12),
      passwordHash: demoPassword,
      role: 'MODERATOR',
      status: 'ACTIVE',
      kycLevel: 'LEVEL_2',
      locale: 'tr',
    },
  });

  const brandAgentUser = await prisma.user.upsert({
    where: { email: 'agent@turkcell.com.tr' },
    update: {},
    create: {
      email: 'agent@turkcell.com.tr',
      emailHash: await hash('agent@turkcell.com.tr', 12),
      passwordHash: demoPassword,
      role: 'BRAND_AGENT',
      status: 'ACTIVE',
      kycLevel: 'LEVEL_2',
      locale: 'tr',
    },
  });

  // Create 10 demo consumers
  const consumers: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const consumer = await prisma.user.upsert({
      where: { email: `kullanici${i}@example.com` },
      update: {},
      create: {
        email: `kullanici${i}@example.com`,
        emailHash: await hash(`kullanici${i}@example.com`, 12),
        passwordHash: demoPassword,
        role: 'USER',
        status: 'ACTIVE',
        kycLevel: 'LEVEL_1',
        locale: 'tr',
      },
    });
    consumers.push(consumer);
  }

  console.log(`✅ Created ${consumers.length + 3} users`);

  // 2. Create 20 Turkish brands
  console.log('🏢 Creating brands...');

  const brandsData = [
    {
      name: 'Turkcell',
      slug: 'turkcell',
      description: 'Türkiye\'nin lider iletişim ve teknoloji şirketi',
      logoUrl: 'https://lci.lydian.ai/brands/turkcell.png',
      websiteUrl: 'https://www.turkcell.com.tr',
    },
    {
      name: 'Vodafone Türkiye',
      slug: 'vodafone',
      description: 'Global telekom operatörü',
      logoUrl: 'https://lci.lydian.ai/brands/vodafone.png',
      websiteUrl: 'https://www.vodafone.com.tr',
    },
    {
      name: 'Türk Telekom',
      slug: 'turk-telekom',
      description: 'Türkiye\'nin yerleşik iletişim şirketi',
      logoUrl: 'https://lci.lydian.ai/brands/turk-telekom.png',
      websiteUrl: 'https://www.turktelekom.com.tr',
    },
    {
      name: 'Migros',
      slug: 'migros',
      description: 'Türkiye\'nin önde gelen perakende zinciri',
      logoUrl: 'https://lci.lydian.ai/brands/migros.png',
      websiteUrl: 'https://www.migros.com.tr',
    },
    {
      name: 'Şok Marketler',
      slug: 'sok-marketler',
      description: 'Discount market zinciri',
      logoUrl: 'https://lci.lydian.ai/brands/sok.png',
      websiteUrl: 'https://www.sokmarket.com.tr',
    },
    {
      name: 'Trendyol',
      slug: 'trendyol',
      description: 'Türkiye\'nin önde gelen e-ticaret platformu',
      logoUrl: 'https://lci.lydian.ai/brands/trendyol.png',
      websiteUrl: 'https://www.trendyol.com',
    },
    {
      name: 'Hepsiburada',
      slug: 'hepsiburada',
      description: 'E-ticaret ve teknoloji platformu',
      logoUrl: 'https://lci.lydian.ai/brands/hepsiburada.png',
      websiteUrl: 'https://www.hepsiburada.com',
    },
    {
      name: 'THY (Turkish Airlines)',
      slug: 'turkish-airlines',
      description: 'Türkiye\'nin bayrak taşıyıcı havayolu şirketi',
      logoUrl: 'https://lci.lydian.ai/brands/thy.png',
      websiteUrl: 'https://www.turkishairlines.com',
    },
    {
      name: 'Pegasus',
      slug: 'pegasus',
      description: 'Düşük maliyetli havayolu şirketi',
      logoUrl: 'https://lci.lydian.ai/brands/pegasus.png',
      websiteUrl: 'https://www.flypgs.com',
    },
    {
      name: 'Yemeksepeti',
      slug: 'yemeksepeti',
      description: 'Çevrimiçi yemek sipariş platformu',
      logoUrl: 'https://lci.lydian.ai/brands/yemeksepeti.png',
      websiteUrl: 'https://www.yemeksepeti.com',
    },
    {
      name: 'Getir',
      slug: 'getir',
      description: 'Hızlı teslimat ve market uygulaması',
      logoUrl: 'https://lci.lydian.ai/brands/getir.png',
      websiteUrl: 'https://www.getir.com',
    },
    {
      name: 'Akbank',
      slug: 'akbank',
      description: 'Özel sermayeli banka',
      logoUrl: 'https://lci.lydian.ai/brands/akbank.png',
      websiteUrl: 'https://www.akbank.com',
    },
    {
      name: 'İş Bankası',
      slug: 'is-bankasi',
      description: 'Türkiye\'nin ilk ulusal bankası',
      logoUrl: 'https://lci.lydian.ai/brands/isbank.png',
      websiteUrl: 'https://www.isbank.com.tr',
    },
    {
      name: 'Garanti BBVA',
      slug: 'garanti-bbva',
      description: 'Türkiye\'nin önde gelen özel bankaları',
      logoUrl: 'https://lci.lydian.ai/brands/garanti.png',
      websiteUrl: 'https://www.garantibbva.com.tr',
    },
    {
      name: 'Beko',
      slug: 'beko',
      description: 'Beyaz eşya ve elektronik üreticisi',
      logoUrl: 'https://lci.lydian.ai/brands/beko.png',
      websiteUrl: 'https://www.beko.com.tr',
    },
    {
      name: 'Vestel',
      slug: 'vestel',
      description: 'Elektronik ve beyaz eşya üreticisi',
      logoUrl: 'https://lci.lydian.ai/brands/vestel.png',
      websiteUrl: 'https://www.vestel.com.tr',
    },
    {
      name: 'Arçelik',
      slug: 'arcelik',
      description: 'Dayanıklı tüketim malları üreticisi',
      logoUrl: 'https://lci.lydian.ai/brands/arcelik.png',
      websiteUrl: 'https://www.arcelik.com.tr',
    },
    {
      name: 'Koton',
      slug: 'koton',
      description: 'Hazır giyim ve tekstil markası',
      logoUrl: 'https://lci.lydian.ai/brands/koton.png',
      websiteUrl: 'https://www.koton.com',
    },
    {
      name: 'LC Waikiki',
      slug: 'lc-waikiki',
      description: 'Hazır giyim zinciri',
      logoUrl: 'https://lci.lydian.ai/brands/lcw.png',
      websiteUrl: 'https://www.lcwaikiki.com',
    },
    {
      name: 'Defacto',
      slug: 'defacto',
      description: 'Moda ve giyim markası',
      logoUrl: 'https://lci.lydian.ai/brands/defacto.png',
      websiteUrl: 'https://www.defacto.com.tr',
    },
  ];

  const brands: any[] = [];
  for (const brandData of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData.slug },
      update: {},
      create: brandData,
    });
    brands.push(brand);
  }

  console.log(`✅ Created ${brands.length} brands`);

  // 3. Create 50 realistic Turkish complaints
  console.log('📝 Creating complaints...');

  const complaintsData = [
    // Telekom complaints
    {
      brandSlug: 'turkcell',
      userId: consumers[0].id,
      title: 'İnternet hızı sürekli düşüyor',
      body: 'Turkcell Superonline fiber internet kullanıyorum. Son 2 haftadır internet hızı sürekli düşüyor. 100 Mbps alması gerekirken 10-15 Mbps alıyorum. Teknik destek ile 3 kez görüştüm ancak sorun çözülmedi.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'vodafone',
      userId: consumers[1].id,
      title: 'Fatura tutarı yanlış hesaplanmış',
      body: 'Aylık 150 TL olan tarifem bu ay 320 TL geldi. Arayıp sordum, "sistem hatası" dediler ama düzeltilmedi. 3. aydır aynı sorun yaşanıyor.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'turk-telekom',
      userId: consumers[2].id,
      title: 'Modem değişikliği için 2 hafta bekletildim',
      body: 'Modemim bozuldu, yenisi için başvurdum. 2 hafta geçti hala modem gelmedi. Müşteri hizmetleri her seferinde "1-2 gün içinde gelecek" diyor.',
      severity: 'HIGH',
      state: 'ESCALATED',
    },
    // E-commerce complaints
    {
      brandSlug: 'trendyol',
      userId: consumers[0].id,
      title: 'Ürün resimdekiyle aynı değil',
      body: 'Sipariş ettiğim ayakkabı resimdeki gibi çıkmadı. Renk ve model farklı. İade talebim 1 haftadır onaylanmadı.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'hepsiburada',
      userId: consumers[1].id,
      title: 'Kargo hasarlı ürün teslim etti',
      body: 'Aldığım laptop\'un ekranı kırık geldi. Kargo görevlisi imza attırmadan bırakıp gitti. Şimdi iade için sorumluluk kabul etmiyorlar.',
      severity: 'CRITICAL',
      state: 'OPEN',
    },
    {
      brandSlug: 'trendyol',
      userId: consumers[2].id,
      title: 'İndirimli ürün tam fiyattan yansıdı',
      body: '%50 indirimli ürün aldım, kartımdan tam fiyat çekildi. Müşteri hizmetlerine ulaşamıyorum, chatbot otomatik yanıt veriyor.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    // Havayolu complaints
    {
      brandSlug: 'turkish-airlines',
      userId: consumers[3].id,
      title: 'Uçuş iptal edildi, bilgilendirme yapılmadı',
      body: 'İstanbul-Antalya uçuşum iptal edildi. Havalimanında öğrendim. SMS veya email bilgilendirmesi yapılmadı. Alternatif uçuş 8 saat sonra.',
      severity: 'CRITICAL',
      state: 'OPEN',
    },
    {
      brandSlug: 'pegasus',
      userId: consumers[4].id,
      title: 'Bagaj kayboldu, tazminat ödenmiyor',
      body: 'İzmir-İstanbul uçuşunda bagajım kayboldu. 10 gün geçti hala bulunamadı. Tazminat için başvurdum, sürekli erteleniyor.',
      severity: 'HIGH',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'turkish-airlines',
      userId: consumers[0].id,
      title: 'Online check-in çalışmıyor',
      body: 'Son 3 uçuşumda online check-in yapamadım. Uygulama ve web sitesi sürekli hata veriyor. Havalimanında uzun kuyrukta bekliyorum.',
      severity: 'MEDIUM',
      state: 'RESOLVED',
    },
    // Yemek siparişi complaints
    {
      brandSlug: 'yemeksepeti',
      userId: consumers[1].id,
      title: 'Sipariş 2 saat gecikmeli geldi, soğuk',
      body: 'Yemek siparişim 2 saat gecikmeli geldi. Yemekler buz gibiydi. Restoran "Yemeksepeti kuryesi geç geldi" dedi. Para iadesi istiyorum.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'getir',
      userId: consumers[2].id,
      title: 'Eksik ürün geldi, iade edilmiyor',
      body: '10 ürün sipariş ettim, 7 tanesi geldi. Kalan 3 ürün için iade alamadım. Müşteri hizmetleri "kurye teslim etti" diyor.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'yemeksepeti',
      userId: consumers[3].id,
      title: 'Restoran yanlış yemek gönderdi',
      body: 'Tavuk döner sipariş ettim, et döner geldi. Vejetaryenim, yiyemedim. İade talebi reddedildi.',
      severity: 'MEDIUM',
      state: 'RESOLVED',
    },
    // Market complaints
    {
      brandSlug: 'migros',
      userId: consumers[4].id,
      title: 'Son kullanma tarihi geçmiş ürün sattı',
      body: 'Migros\'tan aldığım yoğurdun son kullanma tarihi geçmişti. Fark etmeden yedim, zehirlendim. Hastane raporum var.',
      severity: 'CRITICAL',
      state: 'ESCALATED',
    },
    {
      brandSlug: 'sok-marketler',
      userId: consumers[0].id,
      title: 'Kasada fazla para tahsil edildi',
      body: 'Alışveriş yaptım, kasada 150 TL yerine 250 TL tahsil edildi. Fişi sonradan kontrol ettim. Markete geri döndüm, "sistem hatası" dediler ama iade yapılmadı.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'migros',
      userId: consumers[1].id,
      title: 'Kampanyalı ürün kampanya fiyatından satılmadı',
      body: 'Rafta %40 indirimli yazıyordu, kasada indirim uygulanmadı. Görevli "sistem güncellemesi yapılmamış" dedi.',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    // Banka complaints
    {
      brandSlug: 'akbank',
      userId: consumers[2].id,
      title: 'Hesabımdan yetkisiz para çekildi',
      body: 'Kartımı kullanmadığım halde 5000 TL çekilmiş. Dolandırıcılık ihbarı yaptım, banka "sorumluluk sizde" diyor. Güvenlik açığı var.',
      severity: 'CRITICAL',
      state: 'OPEN',
    },
    {
      brandSlug: 'is-bankasi',
      userId: consumers[3].id,
      title: 'Kredi kartı başvurusu sebepsiz reddedildi',
      body: 'Kredi kartı başvurusu yaptım, red cevabı aldım. Kredi notum yüksek, neden reddedildiği açıklanmadı.',
      severity: 'LOW',
      state: 'OPEN',
    },
    {
      brandSlug: 'garanti-bbva',
      userId: consumers[4].id,
      title: 'ATM kartımı yuttu, iade edilmiyor',
      body: 'ATM kartımı yuttu, şubeye gittim "10 gün içinde gelir" dediler. 15 gün geçti hala gelmedi. Yeni kart için 50 TL istiyorlar.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    // Beyaz eşya complaints
    {
      brandSlug: 'beko',
      userId: consumers[0].id,
      title: 'Buzdolabı 6 ayda 3 kez arızalandı',
      body: 'Beko buzdolabı aldım, 6 ay içinde 3 kez arızalandı. Her seferinde "onarıldı" dediler ama sorun devam ediyor. Değişim istiyorum.',
      severity: 'HIGH',
      state: 'ESCALATED',
    },
    {
      brandSlug: 'vestel',
      userId: consumers[1].id,
      title: 'Televizyon garantide, servis ücret talep etti',
      body: 'Garanti süresi içinde televizyon bozuldu. Servisi aradım, "muayene ücreti 200 TL" dediler. Garanti kapsamında olması gerekmiyor mu?',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'arcelik',
      userId: consumers[2].id,
      title: 'Çamaşır makinesi gürültülü çalışıyor',
      body: 'Yeni aldığım Arçelik çamaşır makinesi çok gürültülü. Servisi aradım, "normal" dediler. Komşular şikayet ediyor.',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    // Giyim complaints
    {
      brandSlug: 'koton',
      userId: consumers[3].id,
      title: 'İlk yıkamada renk attı',
      body: 'Koton\'dan aldığım siyah gömlek ilk yıkamada renk attı, diğer çamaşırları boyadı. İade etmek istedim, "yıkandı" diye kabul edilmedi.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'lc-waikiki',
      userId: consumers[4].id,
      title: 'Beden uyumsuzluğu, iade edilmiyor',
      body: 'L beden aldım, çok küçük geldi. Etiketli iade götürdüm, "deneme izleri var" diye iade almadılar.',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'defacto',
      userId: consumers[0].id,
      title: 'Dikiş hatalı, ürün dağıldı',
      body: 'Defacto\'dan aldığım pantolonun dikiş dağıldı. 2 kez giydim. Mağazaya götürdüm, "normal kullanımdan kaynaklı" dediler.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    // Additional varied complaints (25-50)
    {
      brandSlug: 'turkcell',
      userId: consumers[1].id,
      title: 'Paket iptali yapılmadı, kesinti devam ediyor',
      body: 'İnternet paketimi iptal ettim, hala her ay 50 TL kesiliyor. 3 kez müşteri hizmetlerini aradım, "sistem güncellenecek" deniliyor.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'vodafone',
      userId: consumers[2].id,
      title: 'Yurt dışı aramalarda aşırı ücret',
      body: 'Almanya\'ya 10 dakika konuştum, 400 TL fatura geldi. Tarife bilgisinde bu yazmıyordu. Açıklama istiyorum.',
      severity: 'HIGH',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'hepsiburada',
      userId: consumers[3].id,
      title: 'Ürün açıklaması yanıltıcı',
      body: 'Ürün açıklamasında "orijinal" yazıyordu, gelen ürün kopya çıktı. Satıcı ile iletişime geçemedim.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'pegasus',
      userId: consumers[4].id,
      title: 'Uçuş değişikliği için fahiş ücret',
      body: 'Uçuş tarihimi değiştirmek için 800 TL ek ücret istediler. Bilet 600 TL\'ydi. Bu adil değil.',
      severity: 'MEDIUM',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'getir',
      userId: consumers[0].id,
      title: 'Sipariş yanlış adrese teslim edildi',
      body: 'Siparişim başka adrese teslim edilmiş. Kurye "GPS yanlış gösterdi" dedi. İade alamadım.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'migros',
      userId: consumers[1].id,
      title: 'Online sipariş eksik geldi',
      body: 'Migros Hemen\'den 20 ürün sipariş ettim, 14 tanesi geldi. Eksik ürünler için para iadesi yapılmadı.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'akbank',
      userId: consumers[2].id,
      title: 'İnternet bankacılığı çöküyor',
      body: 'Akbank mobil uygulama sürekli çöküyor. Kritik anlarda para transferi yapamıyorum.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'beko',
      userId: consumers[3].id,
      title: 'Servis randevusu 3 hafta sonraya verildi',
      body: 'Buzdolabım bozuldu, servis randevusu ancak 3 hafta sonraya verildi. Bu süre çok uzun.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'koton',
      userId: consumers[4].id,
      title: 'Online ve mağaza fiyatları farklı',
      body: 'Online sitede 200 TL olan ürün mağazada 300 TL. Neden fiyat farkı var?',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'trendyol',
      userId: consumers[0].id,
      title: 'İndirim kuponu kullanılamadı',
      body: 'Trendyol\'dan aldığım %20 indirim kuponu "geçersiz" hatası veriyor. Süre bitmemiş, kullanım şartlarına uygun.',
      severity: 'LOW',
      state: 'OPEN',
    },
    {
      brandSlug: 'turk-telekom',
      userId: consumers[1].id,
      title: 'Abonelik sonlanmadı, kesinti devam ediyor',
      body: 'TTNET aboneliğimi 2 ay önce iptal ettim, hala fatura geliyor. Tahsilat devam ediyor.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'yemeksepeti',
      userId: consumers[2].id,
      title: 'Puan sistemi çalışmıyor',
      body: 'Yemeksepeti puanlarım kayboldu. 500 TL değerinde puanım vardı, artık görünmüyor.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'vestel',
      userId: consumers[3].id,
      title: 'Cihaz güncellemesi sonrası çalışmıyor',
      body: 'Vestel akıllı TV güncelleme sonrası açılmıyor. Servis "güncelleme geri alınamaz" diyor.',
      severity: 'HIGH',
      state: 'ESCALATED',
    },
    {
      brandSlug: 'is-bankasi',
      userId: consumers[4].id,
      title: 'Hesap özeti gelmedi',
      body: 'Kredi kartı hesap özetim gelmedi, gecikme faizi uygulandı. Sorumlu değilim.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'lc-waikiki',
      userId: consumers[0].id,
      title: 'Online sipariş mağazadan teslim alamadım',
      body: 'Online sipariş verdim, "mağazadan teslim al" seçtim. Mağazaya gittim, sipariş yokmuş.',
      severity: 'MEDIUM',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'turkish-airlines',
      userId: consumers[1].id,
      title: 'Miles hesabım bloke edildi',
      body: 'THY Miles&Smiles hesabım sebepsiz bloke edildi. 50bin mil vardı, ulaşılamıyor.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'sok-marketler',
      userId: consumers[2].id,
      title: 'Çalışan kaba davrandı',
      body: 'Şok Market çalışanı çok kaba davrandı, hakaret etti. Şikayet etmek istiyorum.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'arcelik',
      userId: consumers[3].id,
      title: 'Ürün kurulumu yapılmadı',
      body: 'Ankastre fırın aldım, "kurulum dahil" dediler. 2 hafta geçti, kimse gelmedi.',
      severity: 'HIGH',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'garanti-bbva',
      userId: consumers[4].id,
      title: 'Kredi başvurusu kayboldu',
      body: 'Konut kredisi başvurusu yaptım, "evraklar kayboldu, yeniden başvurun" dediler. Zaman kaybı.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'defacto',
      userId: consumers[0].id,
      title: 'Mağazada indirim uygulanmadı',
      body: '%50 indirim vardı, kasada indirim uygulanmadı. Görevli "kampanya bitti" dedi ama vitrin doluydu.',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'hepsiburada',
      userId: consumers[1].id,
      title: 'Satıcı mesajlara yanıt vermiyor',
      body: 'Aldığım ürün hakkında soru sordum, satıcı 5 gündür yanıt vermiyor. İade süresi dolmak üzere.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'pegasus',
      userId: consumers[2].id,
      title: 'Uçakta koltuk değiştirildi',
      body: 'Pencere kenarı aldım, koridor koltuğu verildi. "Uçak değişti" dediler. Fark iadesi yok.',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'trendyol',
      userId: consumers[3].id,
      title: 'Hızlı kargo seçeneği işlemedi',
      body: 'Hızlı kargo için 30 TL extra ödedim, 5 günde geldi. Normal kargoyla aynı.',
      severity: 'MEDIUM',
      state: 'OPEN',
    },
    {
      brandSlug: 'turkcell',
      userId: consumers[4].id,
      title: 'Sim kart değişimi için şubeye gitmem istendi',
      body: 'eSIM\'e geçmek istiyorum, "şubeye gelin" diyorlar. Neden online yapılamıyor?',
      severity: 'LOW',
      state: 'RESOLVED',
    },
    {
      brandSlug: 'vodafone',
      userId: consumers[0].id,
      title: 'Taahüt bittiği halde faturaya yansımadı',
      body: 'Taahütüm bitti, aylık ücret düşmedi. Müşteri hizmetleri "sistem güncellemesi" diyor.',
      severity: 'MEDIUM',
      state: 'IN_PROGRESS',
    },
    {
      brandSlug: 'getir',
      userId: consumers[1].id,
      title: 'Kurye siparişi yere düşürdü',
      body: 'Kurye kapıda siparişi düşürdü, ürünler kırıldı. "Kaza oldu" diyerek gitti. İade talebi reddedildi.',
      severity: 'HIGH',
      state: 'OPEN',
    },
    {
      brandSlug: 'migros',
      userId: consumers[2].id,
      title: 'Money kart puanları yüklenmedi',
      body: 'Alışveriş yaptım, Money kartıma puan yüklenmedi. Fiş var ama puan görünmüyor.',
      severity: 'LOW',
      state: 'OPEN',
    },
  ];

  // Create complaints with proper associations
  const complaints: any[] = [];
  for (const complaintData of complaintsData) {
    const brand = brands.find((b) => b.slug === complaintData.brandSlug);
    if (!brand) {
      console.error(`Brand not found: ${complaintData.brandSlug}`);
      continue;
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId: complaintData.userId,
        brandId: brand.id,
        title: complaintData.title,
        body: complaintData.body,
        searchText: `${complaintData.title} ${complaintData.body}`.toLowerCase(),
        severity: complaintData.severity as any,
        state: complaintData.state as any,
        publishedAt:
          complaintData.state !== 'DRAFT'
            ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
            : null,
      },
    });

    // Create state change event
    await prisma.complaintEvent.create({
      data: {
        complaintId: complaint.id,
        actor: 'USER',
        type: 'STATE_CHANGE',
        payload: {
          from: null,
          to: complaintData.state,
        },
      },
    });

    complaints.push(complaint);
  }

  console.log(`✅ Created ${complaints.length} complaints`);

  // 4. Add some brand responses to IN_PROGRESS and RESOLVED complaints
  console.log('💬 Creating brand responses...');

  const responsableComplaints = complaints.filter((c) =>
    ['IN_PROGRESS', 'RESOLVED', 'ESCALATED'].includes(c.state),
  );

  for (const complaint of responsableComplaints.slice(0, 15)) {
    await prisma.brandResponse.create({
      data: {
        complaintId: complaint.id,
        brandId: complaint.brandId,
        respondedBy: brandAgentUser.id,
        message:
          'Sayın müşterimiz, şikayetiniz için teşekkür ederiz. Konuyu inceliyoruz ve en kısa sürede size geri dönüş yapacağız. Anlayışınız için teşekkürler.',
        createdAt: new Date(
          complaint.publishedAt!.getTime() + Math.random() * 24 * 60 * 60 * 1000,
        ),
      },
    });

    // Create response event
    await prisma.complaintEvent.create({
      data: {
        complaintId: complaint.id,
        actor: 'BRAND_AGENT',
        type: 'RESPONSE',
        payload: {
          preview: 'Sayın müşterimiz, şikayetiniz için teşekkür ederiz...',
        },
      },
    });
  }

  console.log('✅ Created brand responses');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${consumers.length + 3}`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Complaints: ${complaints.length}`);
  console.log(`   - Brand Responses: 15`);
  console.log('\n👤 Demo Accounts:');
  console.log('   - Admin: admin@lci.lydian.ai / Demo1234!');
  console.log('   - Moderator: moderator@lci.lydian.ai / Demo1234!');
  console.log('   - Brand Agent: agent@turkcell.com.tr / Demo1234!');
  console.log('   - Consumer 1: kullanici1@example.com / Demo1234!');
  console.log('   - Consumer 2: kullanici2@example.com / Demo1234!');
  console.log('   - ...up to kullanici10@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
