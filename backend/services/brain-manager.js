// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
// Brain Manager v2 — 18 Providers + Capability-Based Routing
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const settings = require('./settings-store');

// Load model registry from JSON — never hardcode model IDs!
const REGISTRY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'model-registry.json'), 'utf8'));

// Provider API configs
const PROVIDERS = {
  groq:        { baseUrl: 'https://api.groq.com/openai/v1',                              format: 'openai' },
  gemini:      { baseUrl: 'https://generativelanguage.googleapis.com/v1beta',             format: 'gemini' },
  openrouter:  { baseUrl: 'https://openrouter.ai/api/v1',                                format: 'openai' },
  nvidia:      { baseUrl: 'https://integrate.api.nvidia.com/v1',                         format: 'openai' },
  cohere:      { baseUrl: 'https://api.cohere.com/v1',                                   format: 'cohere' },
  mistral:     { baseUrl: 'https://api.mistral.ai/v1',                                   format: 'openai' },
  together:    { baseUrl: 'https://api.together.xyz/v1',                                 format: 'openai' },
  // Hugging Face retired the legacy api-inference hostname for this flow.
  // The router endpoint is OpenAI-compatible and supports provider selection policies.
  huggingface: { baseUrl: 'https://router.huggingface.co/v1',                        format: 'openai' },
  deepseek:    { baseUrl: 'https://api.deepseek.com/v1',                                 format: 'openai' },
  cerebras:    { baseUrl: 'https://api.cerebras.ai/v1',                                  format: 'openai' },
  sambanova:   { baseUrl: 'https://fast-api.snova.ai/v1',                                format: 'openai' },
  xai:         { baseUrl: 'https://api.x.ai/v1',                                         format: 'openai' },
  moonshot:    { baseUrl: 'https://api.moonshot.cn/v1',                                  format: 'openai' },
  fireworks:   { baseUrl: 'https://api.fireworks.ai/inference/v1',                       format: 'openai' },
  ai21:        { baseUrl: 'https://api.ai21.com/studio/v1',                              format: 'openai' },
  qwen:        { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',           format: 'openai' },
  perplexity:  { baseUrl: 'https://api.perplexity.ai',                                   format: 'openai' },
  pollinations:{ baseUrl: 'https://text.pollinations.ai',                                format: 'pollinations' },
};

const KEY_MAP = {
  groq: 'GROQ_API_KEY', gemini: 'GEMINI_API_KEY', openrouter: 'OPENROUTER_API_KEY',
  nvidia: 'NVIDIA_API_KEY', cohere: 'COHERE_API_KEY', mistral: 'MISTRAL_API_KEY',
  together: 'TOGETHER_API_KEY', huggingface: 'HF_API_KEY', deepseek: 'DEEPSEEK_API_KEY',
  cerebras: 'CEREBRAS_API_KEY', sambanova: 'SAMBANOVA_API_KEY',
  xai: 'XAI_API_KEY', moonshot: 'MOONSHOT_API_KEY', fireworks: 'FIREWORKS_API_KEY',
  ai21: 'AI21_API_KEY', qwen: 'QWEN_API_KEY', perplexity: 'PERPLEXITY_API_KEY',
};

// Health state
const health = {};
for (const id of Object.keys(PROVIDERS)) {
  health[id] = { alive: true, errors: 0, lastCheck: Date.now(), latency: 0, lastError: null };
}
const modelDiscovery = { groq: { at: 0, ids: [] } };
const MODEL_DISCOVERY_TTL = 5 * 60 * 1000;

function recordProviderFailure(id, err) {
  const message = err?.message || String(err);
  health[id].errors++;
  health[id].lastCheck = Date.now();
  health[id].lastError = message;
  // Authentication/permission failures are limited; invalid models and other
  // request failures are unhealthy. Both states are skipped by the router.
  health[id].status = /HTTP 401|HTTP 403|permission|forbidden|unauthorized/i.test(message) ? 'limited' : 'failed';
  health[id].alive = false;
  setTimeout(() => {
    health[id].alive = true;
    health[id].status = 'unknown';
    health[id].errors = 0;
    health[id].lastError = null;
  }, 60000);
}

async function resolveModel(id, requestedModel, sessionId) {
  const configured = requestedModel || REGISTRY[id]?.models?.[0];
  if (id !== 'groq') return configured;
  const key = getKey(id, sessionId);
  if (!key) return configured;
  const cached = modelDiscovery.groq;
  if (Date.now() - cached.at >= MODEL_DISCOVERY_TTL) {
    try {
      const response = await fetch(`${PROVIDERS.groq.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (response.ok) {
        const payload = await response.json();
        cached.ids = (payload.data || []).map(model => model.id).filter(Boolean);
        cached.at = Date.now();
      }
    } catch (err) {
      console.warn(`⚠️ [groq] model discovery unavailable: ${err.message}`);
    }
  }
  if (!cached.ids.length) return configured;
  const selected = [requestedModel, ...REGISTRY.groq.models].find(model => cached.ids.includes(model));
  if (!selected) throw new Error(`groq has no compatible configured model. Available models: ${cached.ids.slice(0, 8).join(', ')}`);
  REGISTRY.groq.models = [selected, ...REGISTRY.groq.models.filter(model => model !== selected)];
  return selected;
}

// Routing log per request (for Provider Info button)
let lastRoutingLog = [];

function getKey(id, sessionId = null) {
  if (id === 'pollinations') return null;
  const envName = KEY_MAP[id];
  return envName ? settings.getKey(envName, sessionId) : null;
}

// ── CAPABILITY-BASED ROUTING ─────────────────────────────────
function getProvidersForTask(taskType) {
  const capMap = {
    chat:     ['chat'],
    code:     ['code'],
    research: ['research', 'web-search'],
    creative: ['creative'],
    fast:     ['fast'],
    long:     ['long-context'],
    large:    ['large'],
    vision:   ['vision'],
  };
  const needed = capMap[taskType] || ['chat'];
  const providers = Object.entries(REGISTRY)
    .filter(([id, r]) => needed.some(cap => r.capabilities.includes(cap)))
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([id]) => id);
  // Pollinations is the documented no-key fallback; include it for every task
  // so code, research, creative, and fast demos remain usable without secrets.
  if (!providers.includes('pollinations')) providers.push('pollinations');
  return providers;
}

// ── CALLER FUNCTIONS ─────────────────────────────────────────
async function callOpenAI(id, messages, model, sessionId) {
  const p = PROVIDERS[id];
  const r = REGISTRY[id];
  const activeModel = await resolveModel(id, model, sessionId);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getKey(id, sessionId)}`,
  };
  if (id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://luna-ai-web.vercel.app';
    headers['X-Title'] = 'Luna AI Web';
  }
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: activeModel, messages, max_tokens: 2048, temperature: 0.7 }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`${id} HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(messages, sessionId) {
  const r = REGISTRY.gemini;
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const systemInstruction = messages.find(m => m.role === 'system');
  const body = { contents };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  const res = await fetch(
    `${PROVIDERS.gemini.baseUrl}/models/${r.models[0]}:generateContent?key=${getKey('gemini', sessionId)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`gemini HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callCohere(messages, sessionId) {
  const chatHistory = messages.slice(0, -1)
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'CHATBOT' : 'USER', message: m.content }));
  const lastMsg = messages[messages.length - 1].content;
  const res = await fetch(`${PROVIDERS.cohere.baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getKey('cohere', sessionId)}` },
    body: JSON.stringify({ model: REGISTRY.cohere.models[0], message: lastMsg, chat_history: chatHistory }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`cohere HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  return data.text;
}

async function callHuggingFace(messages, sessionId) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
  const key = getKey('huggingface', sessionId);
  const res = await fetch(`${PROVIDERS.huggingface.baseUrl}/${REGISTRY.huggingface.models[0]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { 'Authorization': `Bearer ${key}` } : {}) },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`huggingface HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0].generated_text.split('assistant:').pop().trim() : data.generated_text;
}

async function callPollinations(messages) {
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: 'openai', seed: 42 }),
    timeout: 8000,
  });
  if (!res.ok) throw new Error(`pollinations HTTP ${res.status}`);
  return await res.text();
}

// Keyless local fallback for development and the documented zero-key setup.
// It keeps the app usable when public provider endpoints are unavailable or require auth.
function localDemoResponse(messages) {
  const prompt = messages.filter(m => m.role === 'user').pop()?.content || '';
  if (/flashcards/i.test(prompt)) {
    return JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
      q: `${prompt.match(/about "([^"]+)/i)?.[1] || 'This topic'} — key idea ${i + 1}?`,
      a: `A concise study answer for key idea ${i + 1}.`,
    })));
  }
  if (/multiple choice|mcq|valid json array/i.test(prompt) && /options/i.test(prompt)) {
    return JSON.stringify(Array.from({ length: 10 }, (_, i) => ({
      question: `Practice question ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A is the correct answer for this local demo question.',
    })));
  }
  if (/feynman|explain/i.test(prompt)) {
    return `Luna AI 🌙 explains it simply: ${prompt.replace(/\\s+/g, ' ').slice(0, 220)}\n\nThink of it like learning a new recipe: start with the basic ingredients, practice each step, and then combine them into a useful result. The key idea is to understand the reason behind each step, not just memorize the words.`;
  }
  return `Hey! I'm Luna AI 🌙. I’m running in keyless local demo mode, so I can still respond while external providers are unavailable. Here’s a helpful starting point for your request: ${prompt.slice(0, 300)}`;
}

async function callProvider(id, messages, model, sessionId) {
  if (!PROVIDERS[id]) throw new Error(`Unknown provider: ${id}`);
  if (!getKey(id, sessionId) && id !== 'pollinations') throw new Error(`No API key for ${id}`);
  const start = Date.now();
  let response;
  switch (PROVIDERS[id].format) {
    case 'openai':       response = await callOpenAI(id, messages, model, sessionId); break;
    case 'gemini':       response = await callGemini(messages, sessionId); break;
    case 'cohere':       response = await callCohere(messages, sessionId); break;
    case 'pollinations': {
          const hasAnyConfiguredKey = Object.values(KEY_MAP).some(envName => settings.getKey(envName, sessionId));
      if (!hasAnyConfiguredKey) {
        response = localDemoResponse(messages);
      } else {
        try {
          response = await callPollinations(messages);
        } catch (err) {
          console.warn(`⚠️ [pollinations] remote unavailable: ${err.message}; using local demo fallback`);
          response = localDemoResponse(messages);
        }
      }
      break;
    }
    default: throw new Error(`Unknown format for ${id}`);
  }
  health[id].latency = Date.now() - start;
  health[id].lastCheck = Date.now();
  health[id].alive = true;
  health[id].status = 'healthy';
  health[id].errors = 0;
  health[id].lastError = null;
  console.log(`✅ [${REGISTRY[id]?.name || id}] ${health[id].latency}ms`);
  return response;
}

// ── MAIN CHAT FUNCTION ───────────────────────────────────────
async function chat(messages, taskType = 'chat', preferredModel = null, sessionId = null) {
  const providers = getProvidersForTask(taskType);
  lastRoutingLog = [];

  for (const id of providers) {
    if (!health[id].alive && id !== 'pollinations') {
      lastRoutingLog.push({ provider: REGISTRY[id]?.name || id, status: 'skipped', reason: 'marked dead' });
      continue;
    }
    try {
      lastRoutingLog.push({ provider: REGISTRY[id]?.name || id, status: 'trying', reason: null });
      const response = await callProvider(id, messages, preferredModel, sessionId);
      lastRoutingLog[lastRoutingLog.length - 1].status = 'success';
      return {
        response,
        provider: REGISTRY[id]?.name || id,
        providerId: id,
        model: preferredModel || REGISTRY[id]?.models[0],
        fromCache: false,
        routingLog: lastRoutingLog,
      };
    } catch (err) {
      const errMsg = err.message;
      console.warn(`⚠️ [${id}] failed: ${errMsg}`);
      lastRoutingLog[lastRoutingLog.length - 1].status = 'failed';
      lastRoutingLog[lastRoutingLog.length - 1].reason = errMsg;
      recordProviderFailure(id, err);
    }
  }
  throw new Error('All AI providers failed. Please add API keys in Settings or try again later.');
}

// ── STREAMING CHAT ───────────────────────────────────────────
async function chatStream(messages, taskType = 'chat', res, sessionId = null) {
  const providers = getProvidersForTask(taskType);
  const log = [];

  for (const id of providers) {
    if (!health[id].alive && id !== 'pollinations') continue;
    const key = getKey(id, sessionId);
    if (!key && id !== 'pollinations') continue;

    try {
      const p = PROVIDERS[id];
      const r = REGISTRY[id];

      // SSE helper
      const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
      send({ type: 'provider', provider: r?.name || id });

      if (p.format === 'openai') {
        const activeModel = await resolveModel(id, null, sessionId);
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          ...(id === 'openrouter' ? { 'HTTP-Referer': 'https://luna-ai-web.vercel.app', 'X-Title': 'Luna AI Web' } : {}),
        };
        const streamRes = await fetch(`${p.baseUrl}/chat/completions`, {
          method: 'POST', headers,
          body: JSON.stringify({ model: activeModel, messages, max_tokens: 2048, temperature: 0.7, stream: true }),
        });
        if (!streamRes.ok) throw new Error(`${id} HTTP ${streamRes.status}`);

        let full = '';
        const reader = streamRes.body;
        for await (const chunk of reader) {
          const lines = chunk.toString().split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
          for (const line of lines) {
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              const token = json.choices?.[0]?.delta?.content || '';
              if (token) { full += token; send({ type: 'token', token }); }
            } catch {}
          }
        }
        send({ type: 'done', provider: r?.name || id, model: r.models[0], routingLog: log });
        res.end();
        return;
      }

      // Non-streaming fallback — full response then stream it word by word
      const response = await callProvider(id, messages, null, sessionId);
      const words = response.split(' ');
      for (const word of words) {
        send({ type: 'token', token: word + ' ' });
        await new Promise(r => setTimeout(r, 15));
      }
      send({ type: 'done', provider: r?.name || id, model: r.models[0], routingLog: log });
      res.end();
      return;

    } catch (err) {
      log.push({ provider: REGISTRY[id]?.name || id, status: 'failed', reason: err.message });
      recordProviderFailure(id, err);
    }
  }
  res.write(`data: ${JSON.stringify({ type: 'error', message: 'All providers failed' })}\n\n`);
  res.end();
}

function getHealthStatus(sessionId = null) {
  return Object.entries(REGISTRY).map(([id, r]) => ({
    id,
    name: r.name,
    alive: health[id]?.alive ?? true,
    status: health[id]?.status || (getKey(id, sessionId) ? 'unknown' : 'nokey'),
    hasKey: !!getKey(id, sessionId) || id === 'pollinations',
    latency: health[id]?.latency || 0,
    errors: health[id]?.errors || 0,
    lastError: health[id]?.lastError || null,
    capabilities: r.capabilities,
    vision: r.vision,
    maxTokens: r.maxTokens,
    priority: r.priority,
    models: r.models,
    noKeyNeeded: r.noKeyNeeded || false,
  }));
}

function getAllModels(sessionId = null) {
  return Object.entries(REGISTRY).flatMap(([id, r]) => {
    if (!getKey(id, sessionId) && id !== 'pollinations') return [];
    return r.models.map(m => ({ provider: id, providerName: r.name, model: m }));
  });
}

async function testProvider(id, sessionId = null) {
  if (!PROVIDERS[id]) throw new Error(`Unknown provider: ${id}`);
  try {
    const response = await callProvider(id, [{ role: 'user', content: 'Say "OK" and nothing else.' }], null, sessionId);
    return { provider: REGISTRY[id]?.name || id, response };
  } catch (err) {
    recordProviderFailure(id, err);
    throw err;
  }
}

function getLastRoutingLog() { return lastRoutingLog; }

module.exports = { chat, chatStream, testProvider, getHealthStatus, getAllModels, getLastRoutingLog, REGISTRY };
