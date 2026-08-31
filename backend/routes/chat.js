// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
const express = require('express');
const router = express.Router();
const { chat, chatStream, getHealthStatus, getAllModels, getLastRoutingLog } = require('../services/brain-manager');
const cache = require('../services/cache-manager');
const { getOrCreateSessionId } = require('../middleware/anonymousSession');
const settings = require('../services/settings-store');

// ── REGULAR CHAT ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [], taskType = 'chat', model = null } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const sessionId = getOrCreateSessionId(req, res);

    const cacheKey = { sessionId, message: message.trim().toLowerCase(), historyLen: history.length, taskType, model };
    const cached = cache.get('chat', cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const personality = settings.readPersonality(sessionId);
    const messages = [
      { role: 'system', content: req.body.systemPrompt || personality.systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const start = Date.now();
    const result = await chat(messages, taskType, model, sessionId);
    result.latency = Date.now() - start;
    result.fromCache = false;
    cache.set('chat', cacheKey, result, 500);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message, routingLog: getLastRoutingLog() });
  }
});

// ── STREAMING CHAT ───────────────────────────────────────────
router.get('/stream', async (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const { message, history, taskType = 'chat', systemPrompt } = req.query;
  if (!message) return res.status(400).json({ error: 'Message required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  const historyParsed = history ? JSON.parse(decodeURIComponent(history)) : [];
  const personality = settings.readPersonality(sessionId);
  const messages = [
    { role: 'system', content: systemPrompt || personality.systemPrompt },
    ...historyParsed.slice(-10),
    { role: 'user', content: decodeURIComponent(message) },
  ];

  await chatStream(messages, taskType, res, sessionId);
});

// ── INFO ENDPOINTS ────────────────────────────────────────────
router.get('/health', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  res.json({ providers: getHealthStatus(sessionId), cache: cache.getStats() });
});
router.get('/models', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  res.json({ models: getAllModels(sessionId) });
});
router.get('/routing-log', (req, res) => res.json({ log: getLastRoutingLog() }));

module.exports = router;
