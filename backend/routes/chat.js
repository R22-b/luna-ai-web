// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const express = require('express');
const router = express.Router();
const { chat, getHealthStatus, getAllModels } = require('../services/brain-manager');
const cache = require('../services/cache-manager');
const settings = require('../services/settings-store');

router.post('/', async (req, res) => {
  try {
    const { message, history = [], taskType = 'chat', model = null } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const profile = settings.readProfile();
    const profileContext = profile.shareWithAI !== false
      ? Object.entries(profile)
          .filter(([key, value]) => key !== 'shareWithAI' && typeof value === 'string' && value.trim())
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : '';
    const cacheKey = { message: message.trim(), historyLength: history.length, profileContext };
    const cached = cache.get('chat', cacheKey);
    if (cached) return res.json(cached);

    const messages = [
      { role: 'system', content: [
        'You are Luna AI, a helpful, smart and friendly AI assistant. Be concise and helpful.',
        profileContext ? `The user chose to share this profile. Use it only to personalize helpful responses and do not reveal it unnecessarily:\n${profileContext}` : '',
      ].filter(Boolean).join('\n\n') },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const start = Date.now();
    const result = await chat(messages, taskType, model);
    result.latency = Date.now() - start;
    result.fromCache = false;

    cache.set('chat', cacheKey, result, 500);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', (req, res) => res.json({ providers: getHealthStatus(), cache: cache.getStats() }));
router.get('/models', (req, res) => res.json({ models: getAllModels() }));

module.exports = router;
