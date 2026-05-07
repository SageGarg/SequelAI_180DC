const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sequel_rag.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    raw_query TEXT NOT NULL,
    intent TEXT,
    catalog_pages_used TEXT,
    items_surfaced TEXT,
    answer_given TEXT,
    was_answered INTEGER NOT NULL,
    answer_confidence TEXT,
    fallback_triggered INTEGER,
    unanswered_reason TEXT,
    response_time_ms INTEGER
  );

  CREATE TABLE IF NOT EXISTS analytics_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_at TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_queries INTEGER,
    answered_count INTEGER,
    unanswered_count INTEGER,
    report_markdown TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_query_logs_timestamp ON query_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_query_logs_session ON query_logs(session_id);
  CREATE INDEX IF NOT EXISTS idx_query_logs_intent ON query_logs(intent);
`);

// ── Prepared statements ──

const insertQueryLogStmt = db.prepare(`
  INSERT INTO query_logs (
    query_id, session_id, timestamp, raw_query, intent,
    catalog_pages_used, items_surfaced, answer_given,
    was_answered, answer_confidence, fallback_triggered,
    unanswered_reason, response_time_ms
  ) VALUES (
    @queryId, @sessionId, @timestamp, @rawQuery, @intent,
    @catalogPagesUsed, @itemsSurfaced, @answerGiven,
    @wasAnswered, @answerConfidence, @fallbackTriggered,
    @unansweredReason, @responseTimeMs
  )
`);

const insertReportStmt = db.prepare(`
  INSERT INTO analytics_reports (
    generated_at, period_start, period_end,
    total_queries, answered_count, unanswered_count,
    report_markdown
  ) VALUES (
    @generatedAt, @periodStart, @periodEnd,
    @totalQueries, @answeredCount, @unansweredCount,
    @reportMarkdown
  )
`);

// ── Helper functions ──

function insertQueryLog({
  queryId, sessionId, timestamp, rawQuery, intent,
  catalogPagesUsed, itemsSurfaced, answerGiven,
  wasAnswered, answerConfidence, fallbackTriggered,
  unansweredReason, responseTimeMs
}) {
  return insertQueryLogStmt.run({
    queryId,
    sessionId,
    timestamp: timestamp || new Date().toISOString(),
    rawQuery,
    intent: intent || null,
    catalogPagesUsed: catalogPagesUsed ? JSON.stringify(catalogPagesUsed) : null,
    itemsSurfaced: itemsSurfaced ? JSON.stringify(itemsSurfaced) : null,
    answerGiven: answerGiven || null,
    wasAnswered: wasAnswered ? 1 : 0,
    answerConfidence: answerConfidence || null,
    fallbackTriggered: fallbackTriggered ? 1 : 0,
    unansweredReason: unansweredReason || null,
    responseTimeMs: responseTimeMs || null
  });
}

function getRecentQueries(limit = 50) {
  return db.prepare(`
    SELECT * FROM query_logs ORDER BY id DESC LIMIT ?
  `).all(limit);
}

function getQueryStats(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_queries,
      SUM(CASE WHEN was_answered = 1 THEN 1 ELSE 0 END) as answered,
      SUM(CASE WHEN was_answered = 0 THEN 1 ELSE 0 END) as unanswered
    FROM query_logs
    WHERE timestamp >= ?
  `).get(cutoffStr);

  // Get top items surfaced
  const rows = db.prepare(`
    SELECT items_surfaced FROM query_logs
    WHERE timestamp >= ? AND items_surfaced IS NOT NULL
  `).all(cutoffStr);

  const itemCounts = {};
  for (const row of rows) {
    try {
      const items = JSON.parse(row.items_surfaced);
      for (const item of items) {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      }
    } catch (e) { /* skip malformed */ }
  }

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([item]) => item);

  return {
    total_queries: stats.total_queries || 0,
    answered: stats.answered || 0,
    unanswered: stats.unanswered || 0,
    answer_rate: stats.total_queries > 0
      ? Math.round((stats.answered / stats.total_queries) * 100) / 100
      : 0,
    top_items: topItems,
    period: `last_${days}_days`
  };
}

function getQueriesInRange(startDate, endDate) {
  return db.prepare(`
    SELECT * FROM query_logs
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `).all(startDate, endDate);
}

function insertReport({
  generatedAt, periodStart, periodEnd,
  totalQueries, answeredCount, unansweredCount,
  reportMarkdown
}) {
  return insertReportStmt.run({
    generatedAt: generatedAt || new Date().toISOString(),
    periodStart,
    periodEnd,
    totalQueries,
    answeredCount,
    unansweredCount,
    reportMarkdown
  });
}

function getLatestReport() {
  return db.prepare(`
    SELECT * FROM analytics_reports ORDER BY id DESC LIMIT 1
  `).get();
}

function getAllQueriesForAnalytics(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  return db.prepare(`
    SELECT * FROM query_logs
    WHERE timestamp >= ?
    ORDER BY timestamp ASC
  `).all(cutoffStr);
}

/**
 * getFullStats — returns everything the dashboard needs in one call
 */
function getFullStats(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_queries,
      SUM(CASE WHEN was_answered = 1 THEN 1 ELSE 0 END) as answered,
      SUM(CASE WHEN was_answered = 0 THEN 1 ELSE 0 END) as unanswered,
      SUM(CASE WHEN fallback_triggered = 1 THEN 1 ELSE 0 END) as fallback_count,
      COUNT(DISTINCT session_id) as unique_sessions,
      AVG(response_time_ms) as avg_response_ms
    FROM query_logs WHERE timestamp >= ?
  `).get(cutoffStr);

  const intents = db.prepare(`
    SELECT intent, COUNT(*) as count
    FROM query_logs WHERE timestamp >= ? AND intent IS NOT NULL
    GROUP BY intent ORDER BY count DESC
  `).all(cutoffStr);

  const daily = db.prepare(`
    SELECT
      date(timestamp) as date,
      COUNT(*) as total,
      SUM(CASE WHEN was_answered = 1 THEN 1 ELSE 0 END) as answered
    FROM query_logs WHERE timestamp >= ?
    GROUP BY date(timestamp) ORDER BY date ASC
  `).all(cutoffStr);

  const itemRows = db.prepare(`
    SELECT items_surfaced FROM query_logs
    WHERE timestamp >= ? AND items_surfaced IS NOT NULL
  `).all(cutoffStr);

  const itemCounts = {};
  for (const row of itemRows) {
    try {
      for (const item of JSON.parse(row.items_surfaced)) {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      }
    } catch (e) {}
  }
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([item, count]) => ({ item, count }));

  const confRows = db.prepare(`
    SELECT answer_confidence as level, COUNT(*) as count
    FROM query_logs WHERE timestamp >= ?
    GROUP BY answer_confidence
  `).all(cutoffStr);
  const confMap = { high: 0, medium: 0, low: 0, none: 0 };
  for (const c of confRows) { if (c.level in confMap) confMap[c.level] = c.count; }

  const unanswered = db.prepare(`
    SELECT raw_query, unanswered_reason, timestamp, intent
    FROM query_logs WHERE timestamp >= ? AND was_answered = 0
    ORDER BY timestamp DESC LIMIT 25
  `).all(cutoffStr);

  const total = totals.total_queries || 0;
  return {
    period: `last_${days}_days`,
    days,
    totals: {
      total_queries: total,
      answered: totals.answered || 0,
      unanswered: totals.unanswered || 0,
      answer_rate: total > 0 ? Math.round((totals.answered / total) * 1000) / 10 : 0,
      fallback_count: totals.fallback_count || 0,
      fallback_rate: total > 0 ? Math.round((totals.fallback_count / total) * 1000) / 10 : 0,
      unique_sessions: totals.unique_sessions || 0,
      avg_response_ms: totals.avg_response_ms ? Math.round(totals.avg_response_ms) : null
    },
    intent_breakdown: intents.map(r => ({
      intent: r.intent,
      count: r.count,
      pct: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0
    })),
    daily_volume: daily,
    top_items: topItems,
    confidence_breakdown: confMap,
    unanswered_queries: unanswered
  };
}

module.exports = {
  db,
  insertQueryLog,
  getRecentQueries,
  getQueryStats,
  getFullStats,
  getQueriesInRange,
  insertReport,
  getLatestReport,
  getAllQueriesForAnalytics
};
