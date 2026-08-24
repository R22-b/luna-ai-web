// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const fetch = require('node-fetch');
require('dotenv').config();
const settings = require('./settings-store');

const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    key: process.env.GROQ_API_KEY,
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    defaultModel: 'llama-3.1-70b-versatile',
    format: 'openai',
    priority: 1,
  },
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    key: process.env.GEMINI_API_KEY,
    models: ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'],
    defaultModel: 'gemini-1.5-flash',
    format: 'gemini',
    priority: 2,
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    key: process.env.OPENROUTER_API_KEY,
    models: [
      'meta-llama/llama-3.1-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'openchat/openchat-7b:free',
      'nousresearch/hermes-3-llama-3.1-405b:free',
    ],
    defaultModel: 'meta-llama/llama-3.1-70b-instruct:free',
    format: 'openai',
    priority: 3,
  },
  nvidia: {
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    key: process.env.NVIDIA_API_KEY,
    models: [
      'meta/llama-3.1-70b-instruct',
      'meta/llama-3.1-8b-instruct',
      'mistralai/mixtral-8x7b-instruct-v0.1',
      'nvidia/nemotron-4-340b-instruct',
      'google/gemma-2-9b-it',
    ],
    defaultModel: 'meta/llama-3.1-70b-instruct',
    format: 'openai',
    priority: 4,
  },
  cohere: {
    name: 'Cohere',
    baseUrl: 'https://api.cohere.com/v1',
    key: process.env.COHERE_API_KEY,
    models: ['command-r-plus', 'command-r', 'command'],
    defaultModel: 'command-r',
    format: 'cohere',
    priority: 5,
  },
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    key: process.env.MISTRAL_API_KEY,
    models: ['open-mistral-7b', 'open-mixtral-8x7b', 'mistral-small-latest'],
    defaultModel: 'open-mistral-7b',
    format: 'openai',
    priority: 6,
  },
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    key: process.env.TOGETHER_API_KEY,
    models: [
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2-72B-Instruct',
    ],
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    format: 'openai',
    priority: 7,
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    key: process.env.HF_API_KEY,
    models: ['mistralai/Mistral-7B-Instruct-v0.3', 'HuggingFaceH4/zephyr-7b-beta'],
    defaultModel: 'mistralai/Mistral-7B-Instruct-v0.3',
    format: 'huggingface',
    priority: 8,
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    key: process.env.DEEPSEEK_API_KEY,
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat',
    format: 'openai',
    priority: 9,
  },
  cerebras: {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    key: process.env.CEREBRAS_API_KEY,
    models: ['llama3.1-70b', 'llama3.1-8b'],
    defaultModel: 'llama3.1-8b',
    format: 'openai',
    priority: 10,
  },
  sambanova: {
    name: 'SambaNova',
    baseUrl: 'https://fast-api.snova.ai/v1',
    key: process.env.SAMBANOVA_API_KEY,
    models: ['Meta-Llama-3.1-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct'],
    defaultModel: 'Meta-Llama-3.1-8B-Instruct',
    format: 'openai',
    priority: 11,
  },
  pollinations: {
    name: 'Pollinations',
    baseUrl: 'https://text.pollinations.ai',
    key: null,
    models: ['openai', 'mistral', 'llama'],
    defaultModel: 'openai',
    format: 'pollinations',
    priority: 12,
  },
  aihorde: {
    name: 'AI Horde (anonymous)',
    baseUrl: 'https://aihorde.net/api/v2',
    key: null,
    models: ['community-text-workers'],
    defaultModel: 'community-text-workers',
    format: 'aihorde',
    priority: 13,
  },
};

const KEY_ENV_BY_PROVIDER = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  nvidia: 'NVIDIA_API_KEY',
  cohere: 'COHERE_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  together: 'TOGETHER_API_KEY',
  huggingface: 'HF_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  sambanova: 'SAMBANOVA_API_KEY',
};

function getProviderKey(providerId) {
  const envName = KEY_ENV_BY_PROVIDER[providerId];
  return envName ? settings.getKey(envName) : null;
}

// Health state per provider
const health = {};
for (const id of Object.keys(PROVIDERS)) {
  health[id] = { alive: true, errors: 0, lastCheck: Date.now(), latency: 0 };
}

// Task routing
const TASK_ROUTING = {
      chat:     ['groq', 'gemini', 'openrouter', 'nvidia', 'mistral', 'together', 'cerebras', 'pollinations', 'aihorde'],
      code:     ['deepseek', 'groq', 'openrouter', 'nvidia', 'together', 'pollinations', 'aihorde'],
      research: ['gemini', 'cohere', 'groq', 'openrouter', 'nvidia', 'pollinations', 'aihorde'],
      creative: ['openrouter', 'together', 'groq', 'mistral', 'pollinations', 'aihorde'],
      long:     ['gemini', 'nvidia', 'openrouter', 'groq', 'pollinations', 'aihorde'],
      fast:     ['groq', 'cerebras', 'pollinations', 'aihorde'],
      large:    ['sambanova', 'nvidia', 'together', 'openrouter', 'pollinations', 'aihorde'],
};

async function callOpenAI(provider, messages, model) {
  const p = PROVIDERS[provider];
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getProviderKey(provider)}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://luna-ai-web.vercel.app';
    headers['X-Title'] = 'Luna AI Web';
  }
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || p.defaultModel,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`${provider} error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(messages) {
  const p = PROVIDERS.gemini;
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `${p.baseUrl}/models/${p.defaultModel}:generateContent?key=${getProviderKey('gemini')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callCohere(messages) {
  const p = PROVIDERS.cohere;
  const chatHistory = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: m.content,
  }));
  const lastMsg = messages[messages.length - 1].content;
  const res = await fetch(`${p.baseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getProviderKey('cohere')}`,
    },
    body: JSON.stringify({
      model: p.defaultModel,
      message: lastMsg,
      chat_history: chatHistory,
    }),
  });
  if (!res.ok) throw new Error(`Cohere error: ${res.status}`);
  const data = await res.json();
  return data.text;
}

async function callHuggingFace(messages) {
  const p = PROVIDERS.huggingface;
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
  const res = await fetch(`${p.baseUrl}/${p.defaultModel}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getProviderKey('huggingface') ? { 'Authorization': `Bearer ${getProviderKey('huggingface')}` } : {}),
    },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512 } }),
  });
  if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0].generated_text.split('assistant:').pop().trim() : data.generated_text;
}

async function callAIHorde(messages) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
  const headers = {
    'Content-Type': 'application/json',
    apikey: '0000000000',
    'Client-Agent': 'LunaAI-Web:1.0:github.com/R22-b/luna-AI',
  };
  const submit = await fetch('https://aihorde.net/api/v2/generate/text/async', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      params: { max_length: 512, max_context_length: 4096, temperature: 0.7 },
    }),
  });
  if (!submit.ok) throw new Error(`AI Horde submit error: ${submit.status}`);
  const request = await submit.json();
  if (!request.id) throw new Error('AI Horde did not return a request id');

  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    const statusRes = await fetch(`https://aihorde.net/api/v2/generate/text/status/${request.id}`, { headers });
    if (!statusRes.ok) throw new Error(`AI Horde status error: ${statusRes.status}`);
    const status = await statusRes.json();
    if (status.done && status.generations?.length) return status.generations[0].text.trim();
    if (status.faulted) throw new Error('AI Horde request faulted');
  }
  throw new Error('AI Horde timed out while waiting for an anonymous worker');
}

async function callPollinations(messages) {
  const lastMsg = messages[messages.length - 1].content;
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: 'openai',
      seed: 42,
    }),
  });
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  return await res.text();
}

async function callProvider(providerId, messages, model) {
  const p = PROVIDERS[providerId];
  if (!p) throw new Error(`Unknown provider: ${providerId}`);
  // Load saved settings at request time; Pollinations is the only no-key provider.
  if (!getProviderKey(providerId) && providerId !== 'pollinations' && providerId !== 'aihorde') {
    throw new Error(`No API key for ${providerId}`);
  }

  const start = Date.now();
  let response;
  switch (p.format) {
    case 'openai':   response = await callOpenAI(providerId, messages, model); break;
    case 'gemini':   response = await callGemini(messages); break;
    case 'cohere':   response = await callCohere(messages); break;
    case 'huggingface': response = await callHuggingFace(messages); break;
    case 'pollinations': response = await callPollinations(messages); break;
    case 'aihorde': response = await callAIHorde(messages); break;
    default: throw new Error(`Unknown format: ${p.format}`);
  }
  health[providerId].latency = Date.now() - start;
  health[providerId].errors = 0;
  console.log(`✅ [${p.name}] responded in ${health[providerId].latency}ms`);
  return response;
}

async function chat(messages, taskType = 'chat', preferredModel = null) {
  const providers = TASK_ROUTING[taskType] || TASK_ROUTING.chat;
  for (const providerId of providers) {
    if (!health[providerId].alive) continue;
    try {
      const response = await callProvider(providerId, messages, preferredModel);
      return {
        response,
        provider: PROVIDERS[providerId].name,
        providerId,
        model: preferredModel || PROVIDERS[providerId].defaultModel,
        fromCache: false,
      };
    } catch (err) {
      console.warn(`⚠️ [${providerId}] failed: ${err.message}`);
      health[providerId].errors++;
      if (health[providerId].errors >= 3) {
        health[providerId].alive = false;
        console.warn(`❌ [${providerId}] marked dead — retrying in 60s`);
        setTimeout(() => {
          health[providerId].alive = true;
          health[providerId].errors = 0;
          console.log(`🔄 [${providerId}] revived`);
        }, 60000);
      }
    }
  }
  throw new Error('All AI providers failed. Please try again.');
}

function getHealthStatus() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    name: p.name,
    alive: health[id].alive,
    hasKey: !!getProviderKey(id) || id === 'pollinations' || id === 'aihorde',
    latency: health[id].latency,
    errors: health[id].errors,
    models: p.models,
    priority: p.priority,
  }));
}

function getAllModels() {
  const models = [];
  for (const [id, p] of Object.entries(PROVIDERS)) {
    if (!getProviderKey(id) && id !== 'pollinations' && id !== 'aihorde') continue;
    for (const m of p.models) {
      models.push({ provider: id, providerName: p.name, model: m });
    }
  }
  return models;
}

module.exports = { chat, getHealthStatus, getAllModels, PROVIDERS };
