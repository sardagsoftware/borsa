/**
 * 🏛️ LyDian Legal AI - Standalone API Server
 *
 * Quantum • Blockchain • Knowledge Graph • Translation • Legal Systems
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.LEGAL_AI_PORT || 3500;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Import Legal AI Routes
const legalAIRoutes = require('./routes/legal-ai-routes');

// Mount routes
app.use('/api/legal-ai', legalAIRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'LyDian Legal AI',
    status: 'active',
    timestamp: new Date().toISOString(),
    features: [
      'Quantum Optimization',
      'Blockchain Verification',
      'Knowledge Graph RAG',
      '150+ Language Translation',
      'Global Legal Systems',
      'GDPR Compliance'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Legal AI Error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚖️  LYDIAN LEGAL AI SERVER STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Server Status: ACTIVE');
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/legal-ai`);
  console.log('');
  console.log('🎯 Available Services:');
  console.log('   ⚛️  Quantum Optimization     - /api/legal-ai/quantum/*');
  console.log('   🔗 Blockchain Verification  - /api/legal-ai/blockchain/*');
  console.log('   🧠 Knowledge Graph RAG      - /api/legal-ai/knowledge-graph/*');
  console.log('   🌍 Translation (150+ langs) - /api/legal-ai/translate');
  console.log('   ⚖️  Legal Systems           - /api/legal-ai/legal-systems/*');
  console.log('   🛡️  GDPR Compliance         - /api/legal-ai/legal-systems/eu/gdpr/check');
  console.log('');
  console.log('📊 System Status:');
  console.log('   White-Hat Security: ACTIVE');
  console.log('   Priority: Judges → Prosecutors → Lawyers → Citizens');
  console.log('   Slogan: "Adalet için Teknoloji • Teknoloji için Etik"');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

module.exports = app;
