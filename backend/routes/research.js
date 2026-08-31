// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const express = require('express');
const router = express.Router();
const { search } = require('../services/search-engine');
const { chat } = require('../services/brain-manager');
const cache = require('../services/cache-manager');
const { getOrCreateSessionId } = require('../middleware/anonymousSession');

router.post('/', async (req, res) => {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    const { query, depth = 'standard', sources: numSources = 5 } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const cacheKey = { sessionId, query: query.trim(), depth };
    const cached = cache.get('search', cacheKey);
    if (cached) return res.json(cached);

    const results = await search(query, numSources, sessionId);
    if (!results.length) return res.status(404).json({ error: 'No results found' });

    // Summarize each source
    const summarized = await Promise.all(results.map(async r => {
      const text = r.content || r.snippet || '';
      if (!text) return { ...r, summary: r.snippet || 'No content available' };
      try {
        const s = await chat([{ role: 'user', content: `Summarize in 2-3 sentences:\n${text.substring(0, 2000)}` }], 'fast', null, sessionId);
        return { ...r, summary: s.response };
      } catch {
        return { ...r, summary: r.snippet || 'Summary unavailable' };
      }
    }));

    // Final synthesis
    const sourcesText = summarized.map((r, i) => `Source ${i+1}: ${r.title}\n${r.summary}`).join('\n\n');
    const synthesis = await chat([{
      role: 'user',
      content: `Based on these sources, write a comprehensive research report about "${query}":\n\n${sourcesText}\n\nWrite in clear paragraphs with a conclusion.`,
    }], 'research', null, sessionId);

    const result = {
      query,
      report: synthesis.response,
      sources: summarized.map(r => ({ title: r.title, url: r.url, summary: r.summary, snippet: r.snippet })),
      provider: synthesis.provider,
      fromCache: false,
      generatedAt: new Date().toISOString(),
    };

    cache.set('search', cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Research error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
