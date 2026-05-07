const express = require('express');
const { generateReport } = require('../agents/analyticsAgent');
const { getQueryStats, getFullStats, getLatestReport, getRecentQueries } = require('../database/db');

const router = express.Router();

/**
 * Middleware: verify internal API key
 */
function requireInternalKey(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.INTERNAL_KEY) {
    return res.status(401).json({ error: 'Unauthorized — valid x-internal-key header required' });
  }
  next();
}

/**
 * GET /api/analytics/stats — Quick stats without running full report
 */
router.get('/stats', requireInternalKey, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = getQueryStats(days);
    return res.json(stats);
  } catch (error) {
    console.error('[Analytics] Stats error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

/**
 * GET /api/analytics/report — Returns most recent report
 */
router.get('/report', requireInternalKey, (req, res) => {
  try {
    const report = getLatestReport();
    if (!report) {
      return res.json({
        message: 'No reports generated yet. Trigger a report run first.',
        report: null
      });
    }
    return res.json({
      id: report.id,
      generated_at: report.generated_at,
      period_start: report.period_start,
      period_end: report.period_end,
      total_queries: report.total_queries,
      answered_count: report.answered_count,
      unanswered_count: report.unanswered_count,
      report_markdown: report.report_markdown
    });
  } catch (error) {
    console.error('[Analytics] Report fetch error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

/**
 * POST /api/analytics/run — Trigger analytics report generation
 */
router.post('/run', requireInternalKey, async (req, res) => {
  try {
    const days = parseInt(req.body?.days) || 7;
    console.log(`[Analytics] Manual report triggered for ${days} days`);

    const result = await generateReport(days);

    return res.json({
      success: true,
      message: `Report generated for the last ${days} days`,
      stats: result.stats,
      period_start: result.periodStart,
      period_end: result.periodEnd,
      saved_to: result.savedTo,
      report_markdown: result.report
    });
  } catch (error) {
    console.error('[Analytics] Report generation error:', error.message);
    return res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/full-stats — All dashboard data in one call
 */
router.get('/full-stats', requireInternalKey, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    return res.json(getFullStats(days));
  } catch (error) {
    console.error('[Analytics] Full-stats error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

/**
 * GET /api/analytics/queries — Returns recent queries for admin table
 */
router.get('/queries', requireInternalKey, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const queries = getRecentQueries(limit);
    return res.json({ queries });
  } catch (error) {
    console.error('[Analytics] Queries fetch error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve queries' });
  }
});

/**
 * POST /api/analytics/verify-password — Verify admin password
 */
router.post('/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === process.env.INTERNAL_PASSWORD) {
    return res.json({ valid: true, internalKey: process.env.INTERNAL_KEY });
  }
  return res.status(401).json({ valid: false });
});

module.exports = router;
