// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
const express = require('express');
const router = express.Router();
const store = require('../services/settings-store');
const { testProvider } = require('../services/brain-manager');
const { getOrCreateSessionId } = require('../middleware/anonymousSession');

// Get all key definitions + status
router.get('/keys', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  res.json({ keys: store.getPublicKeyState(sessionId) });
});

// Save keys
router.post('/keys', (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    const body = req.body || {};
    const updates = body.keys && typeof body.keys === 'object' && !Array.isArray(body.keys) ? body.keys : { ...body };
    delete updates.keys;
    delete updates.clear;
    const result = store.saveKeys(updates, body.clear, sessionId);
    res.json({ ok: true, keys: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Test a provider key
router.post('/test', async (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    const providerMap = {
      GROQ_API_KEY: 'groq', GEMINI_API_KEY: 'gemini', OPENROUTER_API_KEY: 'openrouter',
      NVIDIA_API_KEY: 'nvidia', COHERE_API_KEY: 'cohere', MISTRAL_API_KEY: 'mistral',
      TOGETHER_API_KEY: 'together', HF_API_KEY: 'huggingface', DEEPSEEK_API_KEY: 'deepseek',
      CEREBRAS_API_KEY: 'cerebras', SAMBANOVA_API_KEY: 'sambanova', XAI_API_KEY: 'xai',
      MOONSHOT_API_KEY: 'moonshot', FIREWORKS_API_KEY: 'fireworks', AI21_API_KEY: 'ai21',
      QWEN_API_KEY: 'qwen', PERPLEXITY_API_KEY: 'perplexity',
    };
    const providerId = providerMap[req.body?.provider];
    if (!providerId) return res.status(400).json({ ok: false, error: 'Unknown provider' });
    const result = await testProvider(providerId, sessionId);
    res.json({ ok: true, provider: result.provider });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Get profile
router.get('/profile', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  res.json(store.readProfile(sessionId));
});

// Save profile
router.post('/profile', (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    res.json(store.saveProfile(req.body, sessionId));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get and save the anonymous session's personality settings
router.get('/personality', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  res.json(store.readPersonality(sessionId));
});

router.post('/personality', (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    res.json({ ok: true, personality: store.savePersonality(req.body, sessionId) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Remove this browser's saved BYOK keys, profile, and personality.
router.delete('/session', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  store.clearSession(sessionId);
  res.json({ ok: true });
});

module.exports = router;
