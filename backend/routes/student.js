// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { summarizePDF, processYouTube, feynmanExplain, generateFlashcards, generateQuiz, summarizeLink } = require('../services/student-tools');
const cache = require('../services/cache-manager');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file required' });
    const result = await summarizePDF(req.file.buffer);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/youtube', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'YouTube URL required' });
    const cached = cache.get('student', { url });
    if (cached) return res.json(cached);
    const result = await processYouTube(url);
    cache.set('student', { url }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/feynman', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });
    const cached = cache.get('student', { feynman: topic });
    if (cached) return res.json(cached);
    const explanation = await feynmanExplain(topic);
    const result = { topic, explanation };
    cache.set('student', { feynman: topic }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/flashcards', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });
    const cached = cache.get('student', { flashcards: topic });
    if (cached) return res.json(cached);
    const cards = await generateFlashcards(topic);
    const result = { topic, cards };
    cache.set('student', { flashcards: topic }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/quiz', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });
    const cached = cache.get('student', { quiz: topic });
    if (cached) return res.json(cached);
    const questions = await generateQuiz(topic);
    const result = { topic, questions };
    cache.set('student', { quiz: topic }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/link', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    const cached = cache.get('student', { link: url });
    if (cached) return res.json(cached);
    const summary = await summarizeLink(url);
    const result = { url, summary };
    cache.set('student', { link: url }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
