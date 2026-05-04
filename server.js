require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const chatRouter = require('./routes/chat');
const analyticsRouter = require('./routes/analytics');
const widgetRouter = require('./routes/widget');

// Import analytics scheduler
const { scheduleWeeklyReport } = require('./agents/analyticsAgent');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Static files ──
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/widget.js', widgetRouter);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  Sequel RAG Chatbot Server');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  💬 Chat API:    POST http://localhost:${PORT}/api/chat`);
  console.log(`  📊 Analytics:   GET  http://localhost:${PORT}/api/analytics/stats`);
  console.log(`  🔧 Widget:      GET  http://localhost:${PORT}/widget.js`);
  console.log(`  🖥  Demo:        http://localhost:${PORT}/demo.html`);
  console.log(`  📋 Admin:       http://localhost:${PORT}/admin.html`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // Schedule weekly analytics report
  try {
    scheduleWeeklyReport();
  } catch (error) {
    console.error('[Server] Failed to schedule weekly report:', error.message);
  }
});

// ── Graceful shutdown ──
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  const { db } = require('./database/db');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  const { db } = require('./database/db');
  db.close();
  process.exit(0);
});
