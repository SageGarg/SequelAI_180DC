const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { handleChat } = require('../agents/ragAgent');
const { logQuery } = require('../agents/loggerAgent');

const router = express.Router();

/**
 * POST /api/chat — Customer chat endpoint
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const { message, sessionId, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    const queryId = uuidv4();
    const resolvedSessionId = sessionId || uuidv4();

    // Call RAG Agent
    const { response, logData } = await handleChat(
      message,
      conversationHistory || []
    );

    const responseTimeMs = Date.now() - startTime;

    // Fire Logger Agent asynchronously — do NOT await, don't block response
    logQuery({
      queryId,
      sessionId: resolvedSessionId,
      rawQuery: message,
      intent: logData.intent,
      catalogPagesUsed: logData.catalog_pages_used,
      itemsSurfaced: logData.items_surfaced,
      answerGiven: response,
      wasAnswered: logData.was_answered,
      answerConfidence: logData.answer_confidence,
      fallbackTriggered: logData.fallback_triggered,
      unansweredReason: logData.unanswered_reason,
      responseTimeMs
    }).catch(err => {
      console.error('[Chat] Logger error (non-blocking):', err.message);
    });

    // Return clean response to customer (no __log__ block)
    return res.json({
      response,
      queryId,
      sessionId: resolvedSessionId
    });

  } catch (error) {
    console.error('[Chat] Error:', error.message);

    const responseTimeMs = Date.now() - startTime;

    // Attempt to log the failed query
    logQuery({
      queryId: uuidv4(),
      sessionId: req.body?.sessionId || 'unknown',
      rawQuery: req.body?.message || 'unknown',
      intent: 'error',
      catalogPagesUsed: [],
      itemsSurfaced: [],
      answerGiven: null,
      wasAnswered: false,
      answerConfidence: 'none',
      fallbackTriggered: true,
      unansweredReason: `Server error: ${error.message}`,
      responseTimeMs
    }).catch(() => {});

    return res.status(500).json({
      error: 'Sorry, I encountered an error processing your question. Please try again or call Sequel at 800-553-8273.',
      queryId: null
    });
  }
});

module.exports = router;
