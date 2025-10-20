/**
 * Demo: Realtime System Test
 * Simulates server-side fanout for testing client connections
 */

const http = require('http');
const { WebSocketServer } = require('ws');

// Simulate fanout data
const topics = {
  'kpis.s2': () => ({
    crash_free: 99.1 + Math.random() * 0.9,
    p95_gpu: 14 + Math.random() * 4,
    server_latency: 80 + Math.random() * 40,
    retention: { d1: 0.42, d7: 0.23, d30: 0.15 },
    inflation: 0.95 + Math.random() * 0.1,
    ts: Date.now(),
  }),
  'liveops.events': () => ({
    id: `event-${Math.floor(Math.random() * 1000)}`,
    type: ['storm', 'challenge', 'reward'][Math.floor(Math.random() * 3)],
    when: Date.now(),
  }),
  'economy.patch': () => ({
    earn_spend_ratio: 0.95 + Math.random() * 0.1,
    inflation_index: 0.98 + Math.random() * 0.04,
    drops: { common: 10, rare: 3, epic: 1 },
  }),
};

console.log('🚀 Realtime Demo Server Starting...');
console.log('📡 This is a DEMO server for testing the realtime client');
console.log('⚠️  In production, integrate with actual Next.js server\n');

// Create simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Realtime Demo Server - Use WebSocket on /rt\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/rt' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  console.log('✅ Client connected');

  // Send hello
  ws.send(JSON.stringify({ t: 'hello', id: 'demo-client', ts: Date.now() }));

  // Handle messages
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      console.log('📥 Received:', msg.cmd, msg.topic);

      if (msg.cmd === 'subscribe' && msg.topic) {
        ws.send(JSON.stringify({ t: 'sub.ok', topic: msg.topic, ts: Date.now() }));
        console.log(`✓ Subscribed to ${msg.topic}`);

        // Start sending updates for this topic
        const interval = setInterval(() => {
          if (ws.readyState === 1 && topics[msg.topic]) {
            const data = topics[msg.topic]();
            ws.send(JSON.stringify({ t: msg.topic, d: data, ts: Date.now() }));
            console.log(`📤 Sent ${msg.topic} update`);
          }
        }, msg.topic === 'kpis.s2' ? 10000 : 15000);

        ws.on('close', () => clearInterval(interval));
      }
    } catch (err) {
      console.error('❌ Message error:', err);
    }
  });

  ws.on('close', () => console.log('👋 Client disconnected'));
});

server.listen(3101, () => {
  console.log('🎯 Demo server running on http://localhost:3101');
  console.log('🔗 WebSocket endpoint: ws://localhost:3101/rt');
  console.log('\nTo test from browser console:');
  console.log('  const ws = new WebSocket("ws://localhost:3101/rt");');
  console.log('  ws.onopen = () => ws.send(JSON.stringify({cmd:"subscribe",topic:"kpis.s2"}));');
  console.log('  ws.onmessage = (e) => console.log(JSON.parse(e.data));');
  console.log('\nPress Ctrl+C to stop');
});
