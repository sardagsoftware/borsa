-- LCI Seed Brands
-- Popüler markalar database'e ekleniyor

-- Temizlik (opsiyonel - sadece test için)
-- DELETE FROM brands WHERE slug IN ('turkcell', 'vodafone', 'turk-telekom', 'apple', 'samsung', 'arcelik', 'beko', 'vestel', 'migros', 'carrefour', 'teknosa', 'mediamarkt', 'hepsiburada', 'trendyol', 'n11', 'gittigidiyor', 'yemeksepeti', 'getir', 'koton', 'lcwaikiki', 'defacto', 'mavi', 'zara', 'hm', 'mango', 'ikea', 'bauhaus', 'koçtaş', 'bosch', 'siemens');

-- Telekomünikasyon
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Turkcell', 'turkcell', 'turkcell.com.tr', ARRAY['Telekomünikasyon', 'İnternet', 'Mobil'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Vodafone Türkiye', 'vodafone', 'vodafone.com.tr', ARRAY['Telekomünikasyon', 'İnternet', 'Mobil'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Türk Telekom', 'turk-telekom', 'turktelekom.com.tr', ARRAY['Telekomünikasyon', 'İnternet', 'Fiber'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Teknoloji & Elektronik
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Apple', 'apple', 'apple.com', ARRAY['Teknoloji', 'Elektronik', 'Telefon', 'Bilgisayar'], 'ACTIVE', 'DOCUMENTED', 12, NOW(), NOW()),
  (gen_random_uuid(), 'Samsung', 'samsung', 'samsung.com', ARRAY['Teknoloji', 'Elektronik', 'Telefon', 'TV', 'Beyaz Eşya'], 'ACTIVE', 'DOCUMENTED', 12, NOW(), NOW()),
  (gen_random_uuid(), 'Arçelik', 'arcelik', 'arcelik.com.tr', ARRAY['Beyaz Eşya', 'Elektronik', 'Küçük Ev Aletleri'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Beko', 'beko', 'beko.com.tr', ARRAY['Beyaz Eşya', 'Elektronik', 'Buzdolabı', 'Çamaşır Makinesi'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Vestel', 'vestel', 'vestel.com.tr', ARRAY['Beyaz Eşya', 'TV', 'Elektronik'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- E-Ticaret & Perakende
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Migros', 'migros', 'migros.com.tr', ARRAY['Market', 'Gıda', 'E-Ticaret'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'CarrefourSA', 'carrefour', 'carrefoursa.com', ARRAY['Market', 'Gıda', 'E-Ticaret'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Teknosa', 'teknosa', 'teknosa.com', ARRAY['Elektronik', 'Teknoloji', 'E-Ticaret'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'MediaMarkt', 'mediamarkt', 'mediamarkt.com.tr', ARRAY['Elektronik', 'Teknoloji', 'E-Ticaret'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Hepsiburada', 'hepsiburada', 'hepsiburada.com', ARRAY['E-Ticaret', 'Pazaryeri', 'Teknoloji'], 'ACTIVE', 'DOCUMENTED', 12, NOW(), NOW()),
  (gen_random_uuid(), 'Trendyol', 'trendyol', 'trendyol.com', ARRAY['E-Ticaret', 'Moda', 'Pazaryeri'], 'ACTIVE', 'DOCUMENTED', 12, NOW(), NOW()),
  (gen_random_uuid(), 'N11', 'n11', 'n11.com', ARRAY['E-Ticaret', 'Pazaryeri'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'GittiGidiyor', 'gittigidiyor', 'gittigidiyor.com', ARRAY['E-Ticaret', 'Pazaryeri'], 'ACTIVE', 'DOMAIN_VERIFIED', 24, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Yemek & Hızlı Teslimat
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Yemeksepeti', 'yemeksepeti', 'yemeksepeti.com', ARRAY['Yemek', 'Hızlı Teslimat', 'Restoran'], 'ACTIVE', 'DOCUMENTED', 6, NOW(), NOW()),
  (gen_random_uuid(), 'Getir', 'getir', 'getir.com', ARRAY['Hızlı Teslimat', 'Market', 'Yemek'], 'ACTIVE', 'DOCUMENTED', 6, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Moda & Giyim
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Koton', 'koton', 'koton.com', ARRAY['Moda', 'Giyim', 'Tekstil'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'LC Waikiki', 'lcwaikiki', 'lcw.com', ARRAY['Moda', 'Giyim', 'Tekstil'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'DeFacto', 'defacto', 'defacto.com.tr', ARRAY['Moda', 'Giyim', 'Tekstil'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Mavi', 'mavi', 'mavi.com', ARRAY['Moda', 'Giyim', 'Kot'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'ZARA', 'zara', 'zara.com', ARRAY['Moda', 'Giyim', 'Lüks'], 'ACTIVE', 'DOCUMENTED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'H&M', 'hm', 'hm.com', ARRAY['Moda', 'Giyim'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Mango', 'mango', 'mango.com', ARRAY['Moda', 'Giyim'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Mobilya & Ev Dekorasyon
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'IKEA', 'ikea', 'ikea.com.tr', ARRAY['Mobilya', 'Ev Dekorasyon', 'Ev Tekstili'], 'ACTIVE', 'DOCUMENTED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Bauhaus', 'bauhaus', 'bauhaus.com.tr', ARRAY['Yapı Market', 'Hırdavat', 'Bahçe'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Koçtaş', 'koctas', 'koctas.com.tr', ARRAY['Yapı Market', 'Hırdavat', 'Bahçe'], 'ACTIVE', 'DOMAIN_VERIFIED', 48, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Global Elektronik Markaları
INSERT INTO brands (id, name, slug, domain, categories, status, "verificationLevel", "slaHours", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Bosch', 'bosch', 'bosch.com.tr', ARRAY['Beyaz Eşya', 'Elektronik', 'Ev Aletleri'], 'ACTIVE', 'DOCUMENTED', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Siemens', 'siemens', 'siemens.com.tr', ARRAY['Beyaz Eşya', 'Elektronik', 'Ev Aletleri'], 'ACTIVE', 'DOCUMENTED', 24, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Verification: Count brands
SELECT
  'Toplam Marka' as kategori,
  COUNT(*) as adet
FROM brands
WHERE status = 'ACTIVE';

-- Show all brands
SELECT
  name,
  slug,
  domain,
  status,
  "verificationLevel",
  "slaHours",
  categories
FROM brands
ORDER BY name;
