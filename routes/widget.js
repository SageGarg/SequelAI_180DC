const express = require('express');
const router = express.Router();

/**
 * GET /widget.js — Serves the self-contained embeddable chat widget
 * The widget injects its own CSS and DOM. Zero external dependencies.
 */
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(getWidgetScript());
});

function getWidgetScript() {
  return `(function() {
  'use strict';

  // ── Config ──
  var scriptTag = document.currentScript || document.querySelector('script[data-api-url]');
  var API_URL = (scriptTag && scriptTag.getAttribute('data-api-url')) || '/api/chat';
  var SESSION_KEY = 'sequel_widget_session_id';

  // ── Session ──
  function getSessionId() {
    var id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  var sessionId = getSessionId();
  var conversationHistory = [];
  var isOpen = false;
  var isWaiting = false;

  // ── Inject CSS ──
  var style = document.createElement('style');
  style.textContent = \`
    .sequel-widget-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .sequel-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1a2744;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(26,39,68,0.35);
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      z-index: 999998;
      letter-spacing: 0.3px;
    }

    .sequel-widget-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 28px rgba(26,39,68,0.45);
      background: #243355;
    }

    .sequel-widget-btn svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .sequel-widget-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      height: 560px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      animation: sequel-widget-slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
    }

    @keyframes sequel-widget-slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sequel-widget-panel.sequel-widget-open {
      display: flex;
    }

    .sequel-widget-header {
      background: #1a2744;
      color: #fff;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .sequel-widget-header-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .sequel-widget-header-subtitle {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 2px;
      font-weight: 400;
    }

    .sequel-widget-close {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .sequel-widget-close:hover {
      background: rgba(255,255,255,0.25);
    }

    .sequel-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f7f8fa;
    }

    .sequel-widget-messages::-webkit-scrollbar {
      width: 5px;
    }

    .sequel-widget-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .sequel-widget-messages::-webkit-scrollbar-thumb {
      background: #d0d5dd;
      border-radius: 3px;
    }

    .sequel-widget-msg {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .sequel-widget-msg-bot {
      align-self: flex-start;
      background: #fff;
      color: #1a2744;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }

    .sequel-widget-msg-user {
      align-self: flex-end;
      background: #1a2744;
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .sequel-widget-msg-bot ul,
    .sequel-widget-msg-bot ol {
      padding-left: 18px;
      margin: 6px 0;
    }

    .sequel-widget-msg-bot li {
      margin-bottom: 4px;
    }

    .sequel-widget-msg-bot strong {
      font-weight: 700;
    }

    .sequel-widget-typing {
      align-self: flex-start;
      display: flex;
      gap: 5px;
      padding: 14px 18px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
    }

    .sequel-widget-typing-dot {
      width: 8px;
      height: 8px;
      background: #1a2744;
      border-radius: 50%;
      opacity: 0.4;
      animation: sequel-widget-bounce 1.4s infinite;
    }

    .sequel-widget-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .sequel-widget-typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes sequel-widget-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    .sequel-widget-input-area {
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .sequel-widget-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .sequel-widget-input {
      flex: 1;
      border: 1px solid #d0d5dd;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      color: #1a2744;
    }

    .sequel-widget-input:focus {
      border-color: #1a2744;
    }

    .sequel-widget-input::placeholder {
      color: #9ca3af;
    }

    .sequel-widget-send {
      background: #1a2744;
      color: #fff;
      border: none;
      border-radius: 10px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .sequel-widget-send:hover {
      background: #243355;
    }

    .sequel-widget-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sequel-widget-send svg {
      width: 18px;
      height: 18px;
    }

    .sequel-widget-disclaimer {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding: 6px 16px 10px;
      background: #fff;
    }

    .sequel-widget-disclaimer a {
      color: #1a2744;
      text-decoration: none;
      font-weight: 600;
    }

    @media (max-width: 420px) {
      .sequel-widget-panel {
        width: calc(100vw - 16px);
        height: calc(100vh - 80px);
        bottom: 8px;
        right: 8px;
        border-radius: 12px;
      }
    }
  \`;
  document.head.appendChild(style);

  // ── Create DOM ──
  var container = document.createElement('div');
  container.className = 'sequel-widget-container';

  // Toggle button
  var btn = document.createElement('button');
  btn.className = 'sequel-widget-btn';
  btn.id = 'sequel-widget-toggle';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Parts Assistant';

  // Chat panel
  var panel = document.createElement('div');
  panel.className = 'sequel-widget-panel';
  panel.id = 'sequel-widget-panel';

  panel.innerHTML =
    '<div class="sequel-widget-header">' +
      '<div><div class="sequel-widget-header-title">Sequel Parts Assistant</div>' +
      '<div class="sequel-widget-header-subtitle">Anodizing rack product specialist</div></div>' +
      '<button class="sequel-widget-close" id="sequel-widget-close">&times;</button>' +
    '</div>' +
    '<div class="sequel-widget-messages" id="sequel-widget-messages"></div>' +
    '<div class="sequel-widget-input-area">' +
      '<div class="sequel-widget-input-row">' +
        '<input type="text" class="sequel-widget-input" id="sequel-widget-input" placeholder="Ask about parts, assemblies, specs..." autocomplete="off" />' +
        '<button class="sequel-widget-send" id="sequel-widget-send">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="sequel-widget-disclaimer">For complex applications, call <a href="tel:8005538273">800-553-8273</a></div>';

  container.appendChild(btn);
  container.appendChild(panel);
  document.body.appendChild(container);

  // ── Element refs ──
  var messagesEl = document.getElementById('sequel-widget-messages');
  var inputEl = document.getElementById('sequel-widget-input');
  var sendBtn = document.getElementById('sequel-widget-send');
  var closeBtn = document.getElementById('sequel-widget-close');

  // ── Functions ──
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('sequel-widget-open');
      btn.style.display = 'none';
      if (messagesEl.children.length === 0) {
        addMessage("Hi! I'm the Sequel Parts Assistant. Tell me about the parts you need, your part shape, or the assembly you're building \\u2014 and I'll help you find the right products.", 'bot');
      }
      inputEl.focus();
    } else {
      panel.classList.remove('sequel-widget-open');
      btn.style.display = 'flex';
    }
  }

  function addMessage(text, sender) {
    var msg = document.createElement('div');
    msg.className = 'sequel-widget-msg sequel-widget-msg-' + sender;

    if (sender === 'bot') {
      msg.innerHTML = formatBotMessage(text);
    } else {
      msg.textContent = text;
    }

    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function formatBotMessage(text) {
    // Simple markdown-like formatting
    var html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold
    html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^[\\-\\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\\/li>\\n?)+/g, function(match) {
      return '<ul>' + match + '</ul>';
    });

    // Numbered lists
    html = html.replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>');

    // Line breaks
    html = html.replace(/\\n/g, '<br>');

    return html;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'sequel-widget-typing';
    typing.id = 'sequel-widget-typing';
    typing.innerHTML =
      '<div class="sequel-widget-typing-dot"></div>' +
      '<div class="sequel-widget-typing-dot"></div>' +
      '<div class="sequel-widget-typing-dot"></div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('sequel-widget-typing');
    if (typing) typing.remove();
  }

  async function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || isWaiting) return;

    addMessage(text, 'user');
    inputEl.value = '';
    isWaiting = true;
    sendBtn.disabled = true;
    showTyping();

    // Add to conversation history
    conversationHistory.push({ role: 'user', content: text });

    // Keep last 10 exchanges (20 messages)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    try {
      var resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          conversationHistory: conversationHistory.slice(0, -1) // exclude current message (server adds it)
        })
      });

      hideTyping();

      if (!resp.ok) {
        throw new Error('Server returned ' + resp.status);
      }

      var data = await resp.json();
      var botResponse = data.response || 'Sorry, I could not process your question.';

      addMessage(botResponse, 'bot');
      conversationHistory.push({ role: 'assistant', content: botResponse });

    } catch (error) {
      hideTyping();
      addMessage('Sorry, I\\'m having trouble connecting right now. Please try again or call Sequel at 800-553-8273.', 'bot');
      console.error('[SequelWidget] Error:', error);
    }

    isWaiting = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  // ── Event listeners ──
  btn.addEventListener('click', toggleWidget);
  closeBtn.addEventListener('click', toggleWidget);
  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

})();`;
}

module.exports = router;
