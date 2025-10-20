/**
 * 🌐 KNOWLEDGE GRAPH API
 * ======================
 * LyDian Hukuk AI - Neo4j Entegrasyon API
 */

const express = require('express');
const router = express.Router();
const knowledgeGraph = require('../services/neo4j-knowledge-graph');

/**
 * GET /api/knowledge-graph/precedents/:article
 * Emsal dava ara
 */
router.get('/precedents/:article', async (req, res) => {
  try {
    const { article } = req.params;
    const precedents = await knowledgeGraph.searchPrecedents(article);

    res.json({
      success: true,
      article,
      count: precedents.length,
      precedents
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/knowledge-graph/related/:article
 * İlişkili maddeler bul
 */
router.get('/related/:article', async (req, res) => {
  try {
    const { article } = req.params;
    const related = await knowledgeGraph.findRelatedArticles(article);

    res.json({
      success: true,
      article,
      count: related.length,
      related
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/article
 * Hukuk maddesi ekle/güncelle
 */
router.post('/article', async (req, res) => {
  try {
    const article = await knowledgeGraph.upsertLawArticle(req.body);

    res.json({
      success: true,
      article
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/precedent
 * Emsal dava ekle
 */
router.post('/precedent', async (req, res) => {
  try {
    const { lawArticle, ...precedentData } = req.body;
    const precedent = await knowledgeGraph.addPrecedent(lawArticle, precedentData);

    res.json({
      success: true,
      precedent
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/rag-context
 * RAG için context oluştur
 */
router.post('/rag-context', async (req, res) => {
  try {
    const { query } = req.body;
    const context = await knowledgeGraph.buildRAGContext(query);

    res.json({
      success: true,
      query,
      context
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/knowledge-graph/stats
 * Graph istatistikleri
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await knowledgeGraph.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
