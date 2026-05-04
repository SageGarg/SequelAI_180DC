const { insertQueryLog } = require('../database/db');

/**
 * Logger Agent — writes every query + response to SQLite.
 * Runs after every chat response, invisibly.
 * Never throws errors that affect the customer response.
 */
async function logQuery({
  queryId,
  sessionId,
  rawQuery,
  intent,
  catalogPagesUsed,
  itemsSurfaced,
  answerGiven,
  wasAnswered,
  answerConfidence,
  fallbackTriggered,
  unansweredReason,
  responseTimeMs
}) {
  try {
    insertQueryLog({
      queryId,
      sessionId,
      timestamp: new Date().toISOString(),
      rawQuery,
      intent: intent || 'unknown',
      catalogPagesUsed: catalogPagesUsed || [],
      itemsSurfaced: itemsSurfaced || [],
      answerGiven,
      wasAnswered: wasAnswered !== undefined ? wasAnswered : true,
      answerConfidence: answerConfidence || 'medium',
      fallbackTriggered: fallbackTriggered || false,
      unansweredReason: unansweredReason || null,
      responseTimeMs: responseTimeMs || 0
    });
    console.log(`[LoggerAgent] Query ${queryId} logged successfully`);
  } catch (error) {
    // Never throw — log to console only
    console.error(`[LoggerAgent] Failed to log query ${queryId}:`, error.message);
  }
}

module.exports = { logQuery };
