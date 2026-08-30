// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
const express = require('express');
const router = express.Router();
const store = require('../services/settings-store');
const { chat } = require('../services/brain-manager');

// Get all key definitions + status
router.get('/keys', (req, res) => {
  res.json({ keys: store.getPublicKeyState() });
});

// Save keys
router.post('/keys', (req, res) => {
  try {
    const result = store.saveKeys(req.body);
    res.json({ ok: true, keys: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test a provider key
router.post('/test', async (req, res) => {
  try {
    const result = await chat(
      [{ role: 'user', content: 'Say "OK" and nothing else.' }],
      'fast'
    );
    res.json({ ok: true, provider: result.provider });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Get profile
router.get('/profile', (req, res) => res.json(store.readProfile()));

// Save profile
router.post('/profile', (req, res) => {
  try { res.json(store.saveProfile(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
