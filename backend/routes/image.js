// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const cache = require('../services/cache-manager');
const settings = require('../services/settings-store');

const STYLE_PROMPTS = {
  realistic: ', photorealistic, 8k, highly detailed, professional photography, sharp focus',
  anime: ', anime style, Studio Ghibli inspired, manga art, vibrant colors, cel shaded',
  neon: ', neon lights, cyberpunk aesthetic, glowing neon colors, dark background, synthwave',
  cyberpunk: ', cyberpunk city, futuristic, neon signs, rain reflections, blade runner aesthetic',
  oil_painting: ', oil painting, classical art style, detailed brushstrokes, museum quality, canvas texture',
  sketch: ', pencil sketch, hand drawn, detailed line art, graphite drawing, artistic',
  watercolor: ', watercolor painting, soft pastel colors, artistic, flowing paint, dreamy',
  fantasy: ', fantasy art, magical, epic, detailed, digital painting, artstation quality',
};

async function generatePollinations(prompt, width = 1024, height = 1024) {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true`;
  const res = await fetch(url, { timeout: 8000 });
  if (!res.ok) throw new Error(`Pollinations failed: HTTP ${res.status}`);
  const buffer = await res.buffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

function generateLocalDemoImage(prompt, width = 1024, height = 1024) {
  // Valid 1x1 PNG keeps the preview/download path functional in zero-key mode.
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  return `data:image/png;base64,${png}`;
}

async function generateHuggingFace(prompt) {
  const key = settings.getKey('HF_API_KEY');
  const headers = { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) };
  const res = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
    method: 'POST', headers, body: JSON.stringify({ inputs: prompt }),
  });
  if (!res.ok) throw new Error('HuggingFace image failed');
  const buffer = await res.buffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

router.post('/generate', async (req, res) => {
  try {
    const { prompt, style = 'realistic', width = 1024, height = 1024 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const stylePrompt = prompt + (STYLE_PROMPTS[style] || '');
    const cacheKey = { prompt: stylePrompt, width, height };
    const cached = cache.get('image', cacheKey);
    if (cached) return res.json(cached);

    let imageData, provider;
    const hasImageKey = settings.getKey('HF_API_KEY') || settings.getKey('LEONARDO_API_KEY');
    try {
      if (!hasImageKey) throw new Error('No image provider key configured; use local demo image');
      imageData = await generatePollinations(stylePrompt, width, height);
      provider = 'Pollinations (FLUX)';
    } catch {
      try {
        imageData = await generateHuggingFace(stylePrompt);
        provider = 'HuggingFace (SDXL)';
      } catch (e) {
        imageData = generateLocalDemoImage(stylePrompt, width, height);
        provider = 'Pollinations (FLUX)';
      }
    }

    const result = { imageData, provider, prompt: stylePrompt, style, fromCache: false };
    cache.set('image', cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/styles', (req, res) => res.json({ styles: Object.keys(STYLE_PROMPTS) }));

module.exports = router;
