/**
 * 🌐 KNOWLEDGE GRAPH API - Precedents Endpoint
 * GET /api/knowledge-graph/precedents?article=XXX
 * OR
 * GET /api/knowledge-graph/precedents/ARTICLE (via path parsing)
 * Vercel Serverless Function - Neo4j Integration
 */

// Mock precedents data for demo (until Neo4j is fully configured)
const mockPrecedents = {
  'TCK 141': [
    {
      id: '2021/12345',
      court: 'Yargıtay 5. Ceza Dairesi',
      date: '2021-03-15',
      summary: 'Hırsızlık suçunda fail tarafından yapılan savunmanın değerlendirilmesi',
      decision: 'Bozma',
      relevance: 0.95
    },
    {
      id: '2020/67890',
      court: 'Yargıtay 5. Ceza Dairesi',
      date: '2020-11-22',
      summary: 'Hırsızlık suçunda cezanın infaz aşaması',
      decision: 'Onama',
      relevance: 0.88
    }
  ],
  'TMK 185': [
    {
      id: '2022/33456',
      court: 'Yargıtay 14. Hukuk Dairesi',
      date: '2022-05-10',
      summary: 'Taşınmaz mülkiyetinin geçişinde tapu sicilinin önemi',
      decision: 'Bozma',
      relevance: 0.92
    }
  ],
  'BK 120': [
    {
      id: '2021/99887',
      court: 'Yargıtay 13. Hukuk Dairesi',
      date: '2021-09-30',
      summary: 'Borç ilişkisinde ifa gecikmeleri ve tazminat',
      decision: 'Onama',
      relevance: 0.90
    }
  ]
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Support both query parameter and path-based article
    // Path: /api/knowledge-graph/precedents/TCK%20141
    // Query: /api/knowledge-graph/precedents?article=TCK%20141
    let article = req.query.article;

    // If no query param, try to extract from URL path
    if (!article && req.url) {
      const pathMatch = req.url.match(/\/precedents\/([^?]+)/);
      if (pathMatch && pathMatch[1]) {
        article = decodeURIComponent(pathMatch[1]);
      }
    }

    if (!article) {
      return res.status(400).json({
        success: false,
        error: 'article parameter is required (query or path)'
      });
    }

    // Decode article if it comes URL encoded
    const decodedArticle = decodeURIComponent(article);

    // TODO: When Neo4j is configured, use real service
    // const knowledgeGraph = require('../../services/neo4j-knowledge-graph');
    // const precedents = await knowledgeGraph.searchPrecedents(decodedArticle);

    // For now, use mock data
    const precedents = mockPrecedents[decodedArticle] || [];

    // If no exact match, provide general fallback
    if (precedents.length === 0) {
      return res.status(200).json({
        success: true,
        article: decodedArticle,
        count: 0,
        precedents: [],
        message: 'No precedents found for this article. Neo4j integration pending.',
        mockMode: true
      });
    }

    return res.status(200).json({
      success: true,
      article: decodedArticle,
      count: precedents.length,
      precedents: precedents,
      mockMode: true,
      note: 'Using mock data. Full Neo4j integration coming soon.'
    });

  } catch (error) {
    console.error('❌ Knowledge Graph API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
