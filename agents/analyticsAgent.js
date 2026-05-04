const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const cron = require('node-cron');
const { getAllQueriesForAnalytics, insertReport, getQueryStats } = require('../database/db');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ── Report generation prompt ──
const ANALYTICS_SYSTEM_PROMPT = `You are an internal business analytics agent for Sequel Anodizing Racks. You analyze customer chatbot query logs to generate actionable intelligence reports for the Sequel team.

Given the raw query log data, produce a comprehensive markdown report with EXACTLY these sections:

# WEEKLY ANALYTICS REPORT

## 1. WEEKLY SUMMARY
- Total queries, answer rate, trend vs previous period if data available

## 2. TOP 10 MOST COMMON QUESTIONS
- Clustered by topic, not exact text
- Show frequency count per cluster

## 3. QUESTIONS THE BOT COULD NOT ANSWER
- Grouped by topic
- Frequency per group
- Why it likely couldn't answer (missing data, out of scope, etc.)

## 4. MOST REQUESTED PRODUCTS
- Top 10 item numbers surfaced
- Which product each one is

## 5. CATALOG GAPS IDENTIFIED
- Specific gaps revealed by unanswered queries
- Actionable: what data would need to be added to fix each gap

## 6. ASSEMBLY QUESTIONS BREAKDOWN
- Which assemblies customers ask about most
- Which assembly steps cause the most follow-up questions

## 7. RECOMMENDED ACTIONS FOR SEQUEL TEAM
- Ranked by impact
- Specific and actionable

Use markdown formatting. Be specific and data-driven. If the data set is small, note that and provide what insights you can. Always provide actionable recommendations.`;

/**
 * Generate an analytics report for the given number of days
 */
async function generateReport(days = 7) {
  console.log(`[AnalyticsAgent] Generating report for the last ${days} days...`);

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  const queries = getAllQueriesForAnalytics(days);
  const stats = getQueryStats(days);

  console.log(`[AnalyticsAgent] Found ${queries.length} queries in period`);

  const querySummary = queries.map(q => ({
    timestamp: q.timestamp,
    query: q.raw_query,
    intent: q.intent,
    was_answered: q.was_answered,
    confidence: q.answer_confidence,
    items_surfaced: q.items_surfaced,
    catalog_pages: q.catalog_pages_used,
    fallback: q.fallback_triggered,
    unanswered_reason: q.unanswered_reason
  }));

  let reportMarkdown;

  if (queries.length === 0) {
    reportMarkdown = `# WEEKLY ANALYTICS REPORT\n\n**Period:** ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}\n\n## 1. WEEKLY SUMMARY\n\nNo queries were received during this period. The chatbot had zero interactions.\n\n## 2–7. No Data Available\n\nInsufficient data to generate analysis. This report will be more detailed once customer interactions begin.\n\n---\n*Report generated: ${periodEnd.toISOString()}*`;
  } else {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: ANALYTICS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate the analytics report for the following period.

PERIOD: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}

SUMMARY STATS:
- Total queries: ${stats.total_queries}
- Answered: ${stats.answered}
- Unanswered: ${stats.unanswered}
- Answer rate: ${(stats.answer_rate * 100).toFixed(1)}%
- Top items: ${stats.top_items.join(', ') || 'none'}

RAW QUERY LOG DATA (${queries.length} queries):
${JSON.stringify(querySummary, null, 2)}`
        }
      ],
      max_tokens: 4096,
      temperature: 0.3
    });

    reportMarkdown = response.choices[0].message.content;
  }

  // Save report to file
  const dateStr = periodEnd.toISOString().split('T')[0];
  const reportPath = path.join(reportsDir, `report_${dateStr}.md`);
  fs.writeFileSync(reportPath, reportMarkdown, 'utf-8');
  console.log(`[AnalyticsAgent] Report saved to ${reportPath}`);

  // Save to database
  try {
    insertReport({
      generatedAt: periodEnd.toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalQueries: stats.total_queries,
      answeredCount: stats.answered,
      unansweredCount: stats.unanswered,
      reportMarkdown
    });
    console.log('[AnalyticsAgent] Report saved to database');
  } catch (error) {
    console.error('[AnalyticsAgent] Failed to save report to database:', error.message);
  }

  return {
    report: reportMarkdown,
    stats,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    savedTo: reportPath
  };
}

/**
 * Schedule weekly report generation — every Monday at 8:00 AM
 */
function scheduleWeeklyReport() {
  const task = cron.schedule('0 8 * * 1', async () => {
    console.log('[AnalyticsAgent] Running scheduled weekly report...');
    try {
      const result = await generateReport(7);
      console.log(`[AnalyticsAgent] Scheduled report complete. ${result.stats.total_queries} queries analyzed.`);
    } catch (error) {
      console.error('[AnalyticsAgent] Scheduled report failed:', error.message);
    }
  }, {
    timezone: 'America/Chicago'
  });

  console.log('[AnalyticsAgent] Weekly report scheduled for Mondays at 8:00 AM CT');
  return task;
}

module.exports = { generateReport, scheduleWeeklyReport };
