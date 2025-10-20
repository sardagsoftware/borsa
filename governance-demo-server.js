/**
 * Standalone Governance Demo Server
 * Lightweight server to demo ACE integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import governance modules from ailydian
const complianceAPI = require('../ailydian-ultra-pro/api/governance/compliance');
const trustIndexAPI = require('../ailydian-ultra-pro/api/governance/trust-index');
const emergencyAPI = require('../ailydian-ultra-pro/api/governance/emergency');

// Mount governance routes
app.use('/api/governance/compliance', complianceAPI);
app.use('/api/governance/trust-index', trustIndexAPI);
app.use('/api/governance/emergency', emergencyAPI);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'governance-demo',
    timestamp: new Date().toISOString()
  });
});

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   🛡️  AI Governance Demo Server - RUNNING       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log(`📍 Dashboard: http://localhost:${PORT}`);
  console.log(`🔍 Health:    http://localhost:${PORT}/health`);
  console.log('\n📊 API Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/governance/compliance/frameworks`);
  console.log(`   POST http://localhost:${PORT}/api/governance/compliance/validate`);
  console.log(`   GET  http://localhost:${PORT}/api/governance/trust-index/stats`);
  console.log(`   POST http://localhost:${PORT}/api/governance/trust-index/calculate`);
  console.log(`   GET  http://localhost:${PORT}/api/governance/emergency/status`);
  console.log(`   POST http://localhost:${PORT}/api/governance/emergency/kill-switch`);
  console.log('\n✅ Server ready!\n');
});
