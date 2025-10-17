// LCI API - Global Brands Seeder
// Seeds 150+ global brands into database via Prisma

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const globalBrands = [
  // Tech Giants
  { name: 'Apple Inc.', slug: 'apple-inc', domain: 'apple.com', categories: ['Technology', 'Consumer Electronics'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Microsoft', slug: 'microsoft', domain: 'microsoft.com', categories: ['Technology', 'Software'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Google', slug: 'google', domain: 'google.com', categories: ['Technology', 'Internet'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Amazon', slug: 'amazon-global', domain: 'amazon.com', categories: ['E-Commerce', 'Cloud Computing'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Meta (Facebook)', slug: 'meta-facebook', domain: 'meta.com', categories: ['Social Media', 'Technology'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Tesla', slug: 'tesla', domain: 'tesla.com', categories: ['Automotive', 'Electric Vehicles'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'NVIDIA', slug: 'nvidia', domain: 'nvidia.com', categories: ['Technology', 'AI Hardware'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Intel', slug: 'intel', domain: 'intel.com', categories: ['Technology', 'Semiconductors'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'AMD', slug: 'amd', domain: 'amd.com', categories: ['Technology', 'Processors'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'IBM', slug: 'ibm', domain: 'ibm.com', categories: ['Technology', 'Enterprise Software'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Asian Tech
  { name: 'Samsung Electronics', slug: 'samsung-global', domain: 'samsung.com', categories: ['Technology', 'Consumer Electronics'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'LG Electronics', slug: 'lg-electronics', domain: 'lg.com', categories: ['Consumer Electronics', 'Home Appliances'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Sony', slug: 'sony', domain: 'sony.com', categories: ['Electronics', 'Gaming'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Huawei', slug: 'huawei', domain: 'huawei.com', categories: ['Telecommunications', 'Smartphones'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Xiaomi', slug: 'xiaomi', domain: 'mi.com', categories: ['Smartphones', 'IoT'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'OPPO', slug: 'oppo', domain: 'oppo.com', categories: ['Smartphones'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },
  { name: 'Vivo', slug: 'vivo', domain: 'vivo.com', categories: ['Smartphones'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },
  { name: 'Lenovo', slug: 'lenovo', domain: 'lenovo.com', categories: ['Computers', 'Laptops'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'ASUS', slug: 'asus', domain: 'asus.com', categories: ['Computers', 'Gaming'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Acer', slug: 'acer', domain: 'acer.com', categories: ['Computers', 'Laptops'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },

  // Automotive - German
  { name: 'Volkswagen', slug: 'volkswagen', domain: 'vw.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'BMW', slug: 'bmw', domain: 'bmw.com', categories: ['Automotive', 'Luxury'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz', domain: 'mercedes-benz.com', categories: ['Automotive', 'Luxury'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Audi', slug: 'audi', domain: 'audi.com', categories: ['Automotive', 'Luxury'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Porsche', slug: 'porsche', domain: 'porsche.com', categories: ['Automotive', 'Sports Cars'], slaHours: 48, verificationLevel: 'DOCUMENTED' },

  // Automotive - Japanese
  { name: 'Toyota', slug: 'toyota', domain: 'toyota.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Honda', slug: 'honda', domain: 'honda.com', categories: ['Automotive', 'Motorcycles'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Nissan', slug: 'nissan', domain: 'nissan.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Mazda', slug: 'mazda', domain: 'mazda.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },
  { name: 'Subaru', slug: 'subaru', domain: 'subaru.com', categories: ['Automotive', 'AWD'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },

  // Automotive - American & Korean
  { name: 'Ford', slug: 'ford', domain: 'ford.com', categories: ['Automotive', 'Trucks'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'General Motors', slug: 'general-motors', domain: 'gm.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Chevrolet', slug: 'chevrolet', domain: 'chevrolet.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Hyundai', slug: 'hyundai', domain: 'hyundai.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Kia', slug: 'kia', domain: 'kia.com', categories: ['Automotive'], slaHours: 48, verificationLevel: 'DOCUMENTED' },

  // Fashion - Fast Fashion
  { name: 'ZARA Global', slug: 'zara-global', domain: 'zara.com', categories: ['Fashion', 'Apparel'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'H&M Global', slug: 'hm-global', domain: 'hm.com', categories: ['Fashion', 'Apparel'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Uniqlo', slug: 'uniqlo', domain: 'uniqlo.com', categories: ['Fashion', 'Basic Wear'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Gap', slug: 'gap', domain: 'gap.com', categories: ['Fashion', 'Casual Wear'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },

  // Fashion - Luxury
  { name: 'Louis Vuitton', slug: 'louis-vuitton', domain: 'louisvuitton.com', categories: ['Luxury', 'Fashion'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Gucci', slug: 'gucci', domain: 'gucci.com', categories: ['Luxury', 'Fashion'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Chanel', slug: 'chanel', domain: 'chanel.com', categories: ['Luxury', 'Fashion'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Prada', slug: 'prada', domain: 'prada.com', categories: ['Luxury', 'Fashion'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Hermès', slug: 'hermes', domain: 'hermes.com', categories: ['Luxury', 'Leather Goods'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Sports Brands
  { name: 'Nike', slug: 'nike', domain: 'nike.com', categories: ['Sports', 'Apparel'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Adidas', slug: 'adidas', domain: 'adidas.com', categories: ['Sports', 'Apparel'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Puma', slug: 'puma', domain: 'puma.com', categories: ['Sports', 'Apparel'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Under Armour', slug: 'under-armour', domain: 'underarmour.com', categories: ['Sports', 'Performance'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },
  { name: 'New Balance', slug: 'new-balance', domain: 'newbalance.com', categories: ['Sports', 'Footwear'], slaHours: 48, verificationLevel: 'DOMAIN_VERIFIED' },

  // Fast Food
  { name: 'McDonald\'s', slug: 'mcdonalds', domain: 'mcdonalds.com', categories: ['Fast Food', 'Restaurant'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'KFC', slug: 'kfc', domain: 'kfc.com', categories: ['Fast Food', 'Restaurant'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Burger King', slug: 'burger-king', domain: 'burgerking.com', categories: ['Fast Food', 'Burgers'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Subway', slug: 'subway', domain: 'subway.com', categories: ['Fast Food', 'Sandwiches'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Starbucks', slug: 'starbucks', domain: 'starbucks.com', categories: ['Coffee', 'Cafe'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Domino\'s Pizza', slug: 'dominos', domain: 'dominos.com', categories: ['Pizza', 'Delivery'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Pizza Hut', slug: 'pizza-hut', domain: 'pizzahut.com', categories: ['Pizza', 'Restaurant'], slaHours: 12, verificationLevel: 'DOCUMENTED' },

  // Beverages
  { name: 'Coca-Cola', slug: 'coca-cola', domain: 'coca-cola.com', categories: ['Beverages', 'Soft Drinks'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'PepsiCo', slug: 'pepsico', domain: 'pepsico.com', categories: ['Beverages', 'Snacks'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Nestlé', slug: 'nestle', domain: 'nestle.com', categories: ['Food', 'Beverages'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Red Bull', slug: 'red-bull', domain: 'redbull.com', categories: ['Energy Drinks'], slaHours: 48, verificationLevel: 'DOCUMENTED' },

  // Airlines
  { name: 'Emirates', slug: 'emirates', domain: 'emirates.com', categories: ['Aviation', 'Airlines'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Qatar Airways', slug: 'qatar-airways', domain: 'qatarairways.com', categories: ['Aviation', 'Airlines'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Singapore Airlines', slug: 'singapore-airlines', domain: 'singaporeair.com', categories: ['Aviation', 'Airlines'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Lufthansa', slug: 'lufthansa', domain: 'lufthansa.com', categories: ['Aviation', 'Airlines'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'British Airways', slug: 'british-airways', domain: 'britishairways.com', categories: ['Aviation', 'Airlines'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Turkish Airlines Global', slug: 'turkish-airlines-global', domain: 'turkishairlines.com', categories: ['Aviation', 'Airlines'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Delta Air Lines', slug: 'delta', domain: 'delta.com', categories: ['Aviation', 'Airlines'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Telecommunications
  { name: 'AT&T', slug: 'att', domain: 'att.com', categories: ['Telecommunications', 'Mobile'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Verizon', slug: 'verizon', domain: 'verizon.com', categories: ['Telecommunications', '5G'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'T-Mobile', slug: 't-mobile', domain: 't-mobile.com', categories: ['Telecommunications', '5G'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Vodafone Global', slug: 'vodafone-global', domain: 'vodafone.com', categories: ['Telecommunications', 'IoT'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Orange', slug: 'orange', domain: 'orange.com', categories: ['Telecommunications', 'Internet'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Banking
  { name: 'JPMorgan Chase', slug: 'jpmorgan-chase', domain: 'jpmorganchase.com', categories: ['Banking', 'Finance'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Bank of America', slug: 'bank-of-america', domain: 'bankofamerica.com', categories: ['Banking', 'Finance'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Citibank', slug: 'citibank', domain: 'citibank.com', categories: ['Banking', 'Global Banking'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'HSBC', slug: 'hsbc', domain: 'hsbc.com', categories: ['Banking', 'International'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Payment
  { name: 'Visa', slug: 'visa', domain: 'visa.com', categories: ['Payment Processing', 'Credit Cards'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Mastercard', slug: 'mastercard', domain: 'mastercard.com', categories: ['Payment Processing', 'Credit Cards'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'PayPal', slug: 'paypal', domain: 'paypal.com', categories: ['Payment Processing', 'Digital Payments'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'American Express', slug: 'american-express', domain: 'americanexpress.com', categories: ['Payment Processing', 'Credit Cards'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // E-Commerce
  { name: 'eBay', slug: 'ebay', domain: 'ebay.com', categories: ['E-Commerce', 'Marketplace'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Alibaba', slug: 'alibaba', domain: 'alibaba.com', categories: ['E-Commerce', 'B2B'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'AliExpress', slug: 'aliexpress', domain: 'aliexpress.com', categories: ['E-Commerce', 'International'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Walmart', slug: 'walmart', domain: 'walmart.com', categories: ['Retail', 'E-Commerce'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Target', slug: 'target', domain: 'target.com', categories: ['Retail', 'E-Commerce'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Best Buy', slug: 'best-buy', domain: 'bestbuy.com', categories: ['Electronics', 'E-Commerce'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Hotels
  { name: 'Marriott', slug: 'marriott', domain: 'marriott.com', categories: ['Hospitality', 'Hotels'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Hilton', slug: 'hilton', domain: 'hilton.com', categories: ['Hospitality', 'Hotels'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Hyatt', slug: 'hyatt', domain: 'hyatt.com', categories: ['Hospitality', 'Hotels'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Airbnb', slug: 'airbnb', domain: 'airbnb.com', categories: ['Hospitality', 'Vacation Rentals'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Booking.com', slug: 'booking-com', domain: 'booking.com', categories: ['Travel', 'Hotel Booking'], slaHours: 12, verificationLevel: 'DOCUMENTED' },

  // Streaming
  { name: 'Netflix', slug: 'netflix', domain: 'netflix.com', categories: ['Streaming', 'Entertainment'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Disney+', slug: 'disney-plus', domain: 'disneyplus.com', categories: ['Streaming', 'Family'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Spotify', slug: 'spotify', domain: 'spotify.com', categories: ['Streaming', 'Music'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Apple Music', slug: 'apple-music', domain: 'music.apple.com', categories: ['Streaming', 'Music'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Pharma
  { name: 'Pfizer', slug: 'pfizer', domain: 'pfizer.com', categories: ['Pharmaceuticals', 'Healthcare'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Johnson & Johnson', slug: 'johnson-johnson', domain: 'jnj.com', categories: ['Pharmaceuticals', 'Healthcare'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Regional - Asia Pacific
  { name: 'Grab', slug: 'grab', domain: 'grab.com', categories: ['Ride Hailing', 'Delivery'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Gojek', slug: 'gojek', domain: 'gojek.com', categories: ['Ride Hailing', 'Super App'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Flipkart', slug: 'flipkart', domain: 'flipkart.com', categories: ['E-Commerce', 'India'], slaHours: 24, verificationLevel: 'DOCUMENTED' },

  // Regional - Middle East
  { name: 'Noon.com', slug: 'noon', domain: 'noon.com', categories: ['E-Commerce', 'Middle East'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Careem', slug: 'careem', domain: 'careem.com', categories: ['Ride Hailing', 'Super App'], slaHours: 12, verificationLevel: 'DOCUMENTED' },
  { name: 'Talabat', slug: 'talabat', domain: 'talabat.com', categories: ['Food Delivery'], slaHours: 12, verificationLevel: 'DOCUMENTED' },

  // Regional - Latin America
  { name: 'MercadoLibre', slug: 'mercadolibre', domain: 'mercadolibre.com', categories: ['E-Commerce', 'Latin America'], slaHours: 24, verificationLevel: 'DOCUMENTED' },
  { name: 'Rappi', slug: 'rappi', domain: 'rappi.com', categories: ['Delivery', 'Latin America'], slaHours: 12, verificationLevel: 'DOCUMENTED' },

  // Regional - Europe
  { name: 'Carrefour', slug: 'carrefour-global', domain: 'carrefour.com', categories: ['Retail', 'Supermarket'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Tesco', slug: 'tesco', domain: 'tesco.com', categories: ['Retail', 'Grocery'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Lidl', slug: 'lidl', domain: 'lidl.com', categories: ['Retail', 'Discount Store'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
  { name: 'Aldi', slug: 'aldi', domain: 'aldi.com', categories: ['Retail', 'Discount Store'], slaHours: 48, verificationLevel: 'DOCUMENTED' },
];

async function main() {
  console.log('🌍 Starting Global Brands Seeding...');

  let created = 0;
  let skipped = 0;

  for (const brand of globalBrands) {
    try {
      await prisma.brand.create({
        data: {
          name: brand.name,
          slug: brand.slug,
          domain: brand.domain,
          categories: brand.categories,
          status: 'ACTIVE',
          verificationLevel: brand.verificationLevel as any,
          slaHours: brand.slaHours,
        },
      });
      created++;
      console.log(`✅ Created: ${brand.name}`);
    } catch (error: any) {
      // Duplicate slug, skip
      if (error.code === 'P2002') {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${brand.name}`);
      } else {
        console.error(`❌ Error creating ${brand.name}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Global Brands Seeding Complete!`);
  console.log(`   - Created: ${created} brands`);
  console.log(`   - Skipped: ${skipped} brands`);
  console.log(`   - Total: ${created + skipped} brands`);

  // Get total brand count
  const totalBrands = await prisma.brand.count({ where: { status: 'ACTIVE' } });
  console.log(`\n🎯 Total Active Brands in Database: ${totalBrands}`);

  // Get brands by verification level
  const byVerification = await prisma.brand.groupBy({
    by: ['verificationLevel'],
    where: { status: 'ACTIVE' },
    _count: true,
  });

  console.log(`\n📊 Brands by Verification Level:`);
  byVerification.forEach((group) => {
    console.log(`   - ${group.verificationLevel}: ${group._count} brands`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
