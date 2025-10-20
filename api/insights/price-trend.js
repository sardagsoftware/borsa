/**
 * 📊 Price Trend Insights API
 * Analytics and trend analysis for pricing data
 */

/**
 * Generate synthetic trend data
 */
function generateTrendData(days = 30) {
  const dataPoints = [];
  let basePrice = 1000 + Math.random() * 500;

  for (let i = 0; i < days; i++) {
    // Add some realistic variance
    const variance = (Math.random() - 0.5) * 50;
    const seasonalFactor = Math.sin((i / days) * Math.PI) * 30;
    const trendFactor = i * 2; // Slight upward trend

    basePrice = basePrice + variance + seasonalFactor * 0.1 + trendFactor * 0.1;

    dataPoints.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.round(basePrice * 100) / 100,
      volume: Math.floor(100 + Math.random() * 200),
      competitors: Math.floor(3 + Math.random() * 5)
    });
  }

  return dataPoints;
}

/**
 * Analyze trend direction
 */
function analyzeTrend(dataPoints) {
  if (dataPoints.length < 2) return 'stable';

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

  const avgFirst = firstHalf.reduce((sum, p) => sum + p.price, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, p) => sum + p.price, 0) / secondHalf.length;

  const change = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Get price trend insights
 */
async function getPriceTrend(req, res) {
  const { sku, category, timeRange = '30d' } = req.query;

  // Parse time range
  const days = parseInt(timeRange.replace('d', '')) || 30;

  if (days < 7 || days > 365) {
    return res.status(400).json({
      success: false,
      error: 'Time range must be between 7d and 365d'
    });
  }

  // Generate trend data
  const dataPoints = generateTrendData(days);
  const trend = analyzeTrend(dataPoints);

  // Calculate statistics
  const prices = dataPoints.map(d => d.price);
  const currentPrice = prices[prices.length - 1];
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

  // Generate insights
  const insights = [];

  if (trend === 'up') {
    insights.push(`Fiyatlar son ${days} günde %${priceChange.toFixed(1)} arttı`);
    insights.push('Talep artışı veya rekabet azalması gözlemleniyor');
  } else if (trend === 'down') {
    insights.push(`Fiyatlar son ${days} günde %${Math.abs(priceChange).toFixed(1)} düştü`);
    insights.push('Artan rekabet veya talep azalması mevcut');
  } else {
    insights.push(`Fiyatlar stabil, %${Math.abs(priceChange).toFixed(1)} oranında değişim`);
  }

  if (currentPrice > avgPrice * 1.1) {
    insights.push('Mevcut fiyat ortalama fiyatın üzerinde');
    insights.push('Fiyat düşürme rekabet avantajı sağlayabilir');
  } else if (currentPrice < avgPrice * 0.9) {
    insights.push('Mevcut fiyat ortalama fiyatın altında');
    insights.push('Fiyat artırma marj iyileştirmesi sağlayabilir');
  }

  // Competitor analysis
  const avgCompetitors = dataPoints.reduce((sum, d) => sum + d.competitors, 0) / dataPoints.length;
  if (avgCompetitors > 5) {
    insights.push(`Yüksek rekabet seviyesi: ortalama ${Math.round(avgCompetitors)} rakip`);
  }

  res.json({
    success: true,
    sku,
    category,
    timeRange,
    title: sku ? `${sku} - Fiyat Trendi` : category ? `${category} - Kategori Trendi` : 'Fiyat Trend Analizi',
    trend,
    dataPoints: dataPoints.map(d => ({
      label: d.date.split('-').slice(1).join('/'), // MM/DD format
      value: d.price
    })),
    statistics: {
      current: Math.round(currentPrice * 100) / 100,
      average: Math.round(avgPrice * 100) / 100,
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100,
      change: Math.round(priceChange * 100) / 100,
      volatility: Math.round(((maxPrice - minPrice) / avgPrice) * 100 * 100) / 100
    },
    insights,
    recommendations: [
      trend === 'up' ? 'Fiyat artışını sürdürülebilir' : 'Fiyat artışı için uygun zaman',
      'Rakip fiyatlarını yakından takip edin',
      currentPrice > avgPrice ? 'Promosyon kampanyası düşünün' : 'Marj optimizasyonu yapılabilir'
    ],
    timestamp: new Date().toISOString()
  });
}

module.exports = { getPriceTrend };
