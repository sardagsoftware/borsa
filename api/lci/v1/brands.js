/**
 * LCI - Brands API
 * www.ailydian.com/api/lci/v1/brands
 *
 * Vercel Serverless Function for Brand Management
 */

// Mock brand database (in production, use real database)
const { getCorsOrigin } = require('../../_middleware/cors');
const BRANDS = [
  {
    id: 'brand-001',
    name: 'Turkcell',
    status: 'ACTIVE',
    sector: 'Telekomünikasyon',
    logo: '/brands/turkcell.png',
  },
  {
    id: 'brand-002',
    name: 'Vodafone',
    status: 'ACTIVE',
    sector: 'Telekomünikasyon',
    logo: '/brands/vodafone.png',
  },
  {
    id: 'brand-003',
    name: 'Türk Telekom',
    status: 'ACTIVE',
    sector: 'Telekomünikasyon',
    logo: '/brands/turktelekom.png',
  },
  {
    id: 'brand-004',
    name: 'Apple',
    status: 'ACTIVE',
    sector: 'Teknoloji',
    logo: '/brands/apple.png',
  },
  {
    id: 'brand-005',
    name: 'Samsung',
    status: 'ACTIVE',
    sector: 'Teknoloji',
    logo: '/brands/samsung.png',
  },
  {
    id: 'brand-006',
    name: 'Xiaomi',
    status: 'ACTIVE',
    sector: 'Teknoloji',
    logo: '/brands/xiaomi.png',
  },
  {
    id: 'brand-007',
    name: 'Trendyol',
    status: 'ACTIVE',
    sector: 'E-Ticaret',
    logo: '/brands/trendyol.png',
  },
  {
    id: 'brand-008',
    name: 'Hepsiburada',
    status: 'ACTIVE',
    sector: 'E-Ticaret',
    logo: '/brands/hepsiburada.png',
  },
  {
    id: 'brand-009',
    name: 'GittiGidiyor',
    status: 'ACTIVE',
    sector: 'E-Ticaret',
    logo: '/brands/gittigidiyor.png',
  },
  {
    id: 'brand-010',
    name: 'Migros',
    status: 'ACTIVE',
    sector: 'Perakende',
    logo: '/brands/migros.png',
  },
  {
    id: 'brand-011',
    name: 'Carrefour',
    status: 'ACTIVE',
    sector: 'Perakende',
    logo: '/brands/carrefour.png',
  },
  { id: 'brand-012', name: 'BİM', status: 'ACTIVE', sector: 'Perakende', logo: '/brands/bim.png' },
  {
    id: 'brand-013',
    name: 'A101',
    status: 'ACTIVE',
    sector: 'Perakende',
    logo: '/brands/a101.png',
  },
  { id: 'brand-014', name: 'Şok', status: 'ACTIVE', sector: 'Perakende', logo: '/brands/sok.png' },
  { id: 'brand-015', name: 'Zara', status: 'ACTIVE', sector: 'Moda', logo: '/brands/zara.png' },
  { id: 'brand-016', name: 'H&M', status: 'ACTIVE', sector: 'Moda', logo: '/brands/hm.png' },
  {
    id: 'brand-017',
    name: 'LC Waikiki',
    status: 'ACTIVE',
    sector: 'Moda',
    logo: '/brands/lcwaikiki.png',
  },
  {
    id: 'brand-018',
    name: 'Defacto',
    status: 'ACTIVE',
    sector: 'Moda',
    logo: '/brands/defacto.png',
  },
  { id: 'brand-019', name: 'Koton', status: 'ACTIVE', sector: 'Moda', logo: '/brands/koton.png' },
  { id: 'brand-020', name: 'Mango', status: 'ACTIVE', sector: 'Moda', logo: '/brands/mango.png' },
  {
    id: 'brand-021',
    name: 'Arçelik',
    status: 'ACTIVE',
    sector: 'Elektronik',
    logo: '/brands/arcelik.png',
  },
  {
    id: 'brand-022',
    name: 'Vestel',
    status: 'ACTIVE',
    sector: 'Elektronik',
    logo: '/brands/vestel.png',
  },
  {
    id: 'brand-023',
    name: 'Bosch',
    status: 'ACTIVE',
    sector: 'Elektronik',
    logo: '/brands/bosch.png',
  },
  {
    id: 'brand-024',
    name: 'Siemens',
    status: 'ACTIVE',
    sector: 'Elektronik',
    logo: '/brands/siemens.png',
  },
  { id: 'brand-025', name: 'LG', status: 'ACTIVE', sector: 'Elektronik', logo: '/brands/lg.png' },
  {
    id: 'brand-026',
    name: 'Turkish Airlines',
    status: 'ACTIVE',
    sector: 'Havayolu',
    logo: '/brands/thy.png',
  },
  {
    id: 'brand-027',
    name: 'Pegasus',
    status: 'ACTIVE',
    sector: 'Havayolu',
    logo: '/brands/pegasus.png',
  },
  {
    id: 'brand-028',
    name: 'AnadoluJet',
    status: 'ACTIVE',
    sector: 'Havayolu',
    logo: '/brands/anadolujet.png',
  },
  {
    id: 'brand-029',
    name: 'Yemeksepeti',
    status: 'ACTIVE',
    sector: 'Yemek Sipariş',
    logo: '/brands/yemeksepeti.png',
  },
  {
    id: 'brand-030',
    name: 'Getir',
    status: 'ACTIVE',
    sector: 'Hızlı Teslimat',
    logo: '/brands/getir.png',
  },
  {
    id: 'brand-031',
    name: 'Garanti BBVA',
    status: 'ACTIVE',
    sector: 'Bankacılık',
    logo: '/brands/garanti.png',
  },
  {
    id: 'brand-032',
    name: 'İş Bankası',
    status: 'ACTIVE',
    sector: 'Bankacılık',
    logo: '/brands/isbank.png',
  },
  {
    id: 'brand-033',
    name: 'Akbank',
    status: 'ACTIVE',
    sector: 'Bankacılık',
    logo: '/brands/akbank.png',
  },
  {
    id: 'brand-034',
    name: 'Yapı Kredi',
    status: 'ACTIVE',
    sector: 'Bankacılık',
    logo: '/brands/yapikredi.png',
  },
  {
    id: 'brand-035',
    name: 'Ziraat Bankası',
    status: 'ACTIVE',
    sector: 'Bankacılık',
    logo: '/brands/ziraat.png',
  },
  {
    id: 'brand-036',
    name: 'Anadolu Sigorta',
    status: 'ACTIVE',
    sector: 'Sigorta',
    logo: '/brands/anadolusigorta.png',
  },
  {
    id: 'brand-037',
    name: 'Allianz',
    status: 'ACTIVE',
    sector: 'Sigorta',
    logo: '/brands/allianz.png',
  },
  {
    id: 'brand-038',
    name: 'Axa Sigorta',
    status: 'ACTIVE',
    sector: 'Sigorta',
    logo: '/brands/axa.png',
  },
  {
    id: 'brand-039',
    name: 'Mercedes-Benz',
    status: 'ACTIVE',
    sector: 'Otomotiv',
    logo: '/brands/mercedes.png',
  },
  { id: 'brand-040', name: 'BMW', status: 'ACTIVE', sector: 'Otomotiv', logo: '/brands/bmw.png' },
  {
    id: 'brand-041',
    name: 'Volkswagen',
    status: 'ACTIVE',
    sector: 'Otomotiv',
    logo: '/brands/volkswagen.png',
  },
  {
    id: 'brand-042',
    name: 'Renault',
    status: 'ACTIVE',
    sector: 'Otomotiv',
    logo: '/brands/renault.png',
  },
  { id: 'brand-043', name: 'Ford', status: 'ACTIVE', sector: 'Otomotiv', logo: '/brands/ford.png' },
  { id: 'brand-044', name: 'Fiat', status: 'ACTIVE', sector: 'Otomotiv', logo: '/brands/fiat.png' },
  {
    id: 'brand-045',
    name: 'Hyundai',
    status: 'ACTIVE',
    sector: 'Otomotiv',
    logo: '/brands/hyundai.png',
  },
  { id: 'brand-046', name: 'Kia', status: 'ACTIVE', sector: 'Otomotiv', logo: '/brands/kia.png' },
  {
    id: 'brand-047',
    name: 'Tesla',
    status: 'ACTIVE',
    sector: 'Otomotiv',
    logo: '/brands/tesla.png',
  },
  { id: 'brand-048', name: 'Togg', status: 'ACTIVE', sector: 'Otomotiv', logo: '/brands/togg.png' },
  {
    id: 'brand-049',
    name: 'Starbucks',
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/starbucks.png',
  },
  {
    id: 'brand-050',
    name: "McDonald's",
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/mcdonalds.png',
  },
  {
    id: 'brand-051',
    name: 'Burger King',
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/burgerking.png',
  },
  {
    id: 'brand-052',
    name: 'KFC',
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/kfc.png',
  },
  {
    id: 'brand-053',
    name: "Domino's",
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/dominos.png',
  },
  {
    id: 'brand-054',
    name: 'Pizza Hut',
    status: 'ACTIVE',
    sector: 'Kafe & Restoran',
    logo: '/brands/pizzahut.png',
  },
  {
    id: 'brand-055',
    name: 'Netflix',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/netflix.png',
  },
  {
    id: 'brand-056',
    name: 'Spotify',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/spotify.png',
  },
  {
    id: 'brand-057',
    name: 'Amazon Prime',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/amazon.png',
  },
  {
    id: 'brand-058',
    name: 'Disney+',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/disney.png',
  },
  {
    id: 'brand-059',
    name: 'BluTV',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/blutv.png',
  },
  {
    id: 'brand-060',
    name: 'Gain',
    status: 'ACTIVE',
    sector: 'Dijital Platform',
    logo: '/brands/gain.png',
  },
];

// CORS headers
function getCorsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  const { method, query } = req;

  try {
    // Set CORS headers
    Object.entries(getCorsHeaders(req)).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    switch (method) {
      case 'GET':
        return await handleGet(req, res, query);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({
          error: 'Method Not Allowed',
          message: `Method ${method} not supported`,
        });
    }
  } catch (error) {
    console.error('Brands API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

/**
 * GET /api/lci/v1/brands
 * Query params:
 * - status: ACTIVE|INACTIVE (filter by status)
 * - sector: string (filter by sector)
 * - search: string (search by name)
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 */
async function handleGet(req, res, query) {
  const { status = 'ACTIVE', sector, search, limit = '100', offset = '0' } = query;

  let filteredBrands = [...BRANDS];

  // Filter by status
  if (status) {
    filteredBrands = filteredBrands.filter(b => b.status === status);
  }

  // Filter by sector
  if (sector) {
    filteredBrands = filteredBrands.filter(b => b.sector.toLowerCase() === sector.toLowerCase());
  }

  // Search by name
  if (search) {
    filteredBrands = filteredBrands.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort alphabetically
  filteredBrands.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  // Pagination
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);
  const total = filteredBrands.length;
  const paginatedBrands = filteredBrands.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json(paginatedBrands);
}

/**
 * POST /api/lci/v1/brands
 * Create new brand
 */
async function handlePost(req, res) {
  const { name, sector, logo, status = 'ACTIVE' } = req.body;

  if (!name || !sector) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name and sector are required',
    });
  }

  // Check if brand already exists
  const exists = BRANDS.some(b => b.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Brand already exists',
    });
  }

  const newBrand = {
    id: `brand-${String(BRANDS.length + 1).padStart(3, '0')}`,
    name,
    sector,
    logo: logo || '/brands/default.png',
    status,
    createdAt: new Date().toISOString(),
  };

  BRANDS.push(newBrand);

  return res.status(201).json(newBrand);
}

/**
 * PUT /api/lci/v1/brands/:id
 * Update brand
 */
async function handlePut(req, res) {
  const { id } = req.query;
  const { name, sector, logo, status } = req.body;

  const brandIndex = BRANDS.findIndex(b => b.id === id);
  if (brandIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Brand not found',
    });
  }

  const updatedBrand = {
    ...BRANDS[brandIndex],
    ...(name && { name }),
    ...(sector && { sector }),
    ...(logo && { logo }),
    ...(status && { status }),
    updatedAt: new Date().toISOString(),
  };

  BRANDS[brandIndex] = updatedBrand;

  return res.status(200).json(updatedBrand);
}

/**
 * DELETE /api/lci/v1/brands/:id
 * Delete brand (soft delete - mark as INACTIVE)
 */
async function handleDelete(req, res) {
  const { id } = req.query;

  const brandIndex = BRANDS.findIndex(b => b.id === id);
  if (brandIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Brand not found',
    });
  }

  // Soft delete
  BRANDS[brandIndex].status = 'INACTIVE';
  BRANDS[brandIndex].deletedAt = new Date().toISOString();

  return res.status(200).json({
    message: 'Brand deleted successfully',
    brand: BRANDS[brandIndex],
  });
}
