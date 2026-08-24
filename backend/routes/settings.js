const express = require('express');
const router = express.Router();
const settings = require('../services/settings-store');

router.get('/keys', (req, res) => {
  res.json({ providers: settings.getPublicKeyState() });
});

router.post('/keys', (req, res) => {
  try {
    const { keys = {}, clear = [] } = req.body || {};
    if (!keys || typeof keys !== 'object' || !Array.isArray(clear)) {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }
    res.json({ message: 'API key settings saved', providers: settings.saveKeys(keys, clear) });
  } catch (error) {
    console.error('Settings key save error:', error.message);
    res.status(500).json({ error: 'Unable to save API key settings' });
  }
});

router.get('/profile', (req, res) => {
  res.json({ profile: settings.readProfile() });
});

router.post('/profile', (req, res) => {
  try {
    const profile = settings.saveProfile(req.body || {});
    res.json({ message: 'Profile saved', profile });
  } catch (error) {
    console.error('Profile save error:', error.message);
    res.status(500).json({ error: 'Unable to save profile' });
  }
});

module.exports = router;
