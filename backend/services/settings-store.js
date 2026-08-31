const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Set LUNA_DATA_DIR to a persistent Render disk path in production.
const DATA_DIR = process.env.LUNA_DATA_DIR
  ? path.resolve(process.env.LUNA_DATA_DIR)
  : path.join(__dirname, '..', '.luna-data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const MASTER_KEY_FILE = path.join(DATA_DIR, 'master.key');

const DEFAULT_PERSONALITY = {
  tone: 'friendly',
  systemPrompt: `You are Luna AI 🌙 — a smart, friendly, and powerful AI assistant built by Ravikiran A.
You are helpful, honest, and always try your best to assist users.
When you don't know something, you say so clearly.
You have a warm personality and genuinely care about the user.
You are capable of chat, research, coding, creative writing, document generation, and more.
Always be concise but thorough. Format responses with markdown when helpful.`,
};

// ── PROVIDERS ──────────────────────────────────────────────────
const KEY_DEFINITIONS = {
  GROQ_API_KEY:       { label: 'Groq',             description: 'Fast Llama models and code assistance',          category: 'AI',    keyUrl: 'https://console.groq.com/keys' },
  GEMINI_API_KEY:     { label: 'Google Gemini',    description: 'Reasoning, long context, and multimodal tasks', category: 'AI',    keyUrl: 'https://aistudio.google.com/app/apikey' },
  OPENROUTER_API_KEY: { label: 'OpenRouter',       description: 'Access to 200+ hosted models',                  category: 'AI',    keyUrl: 'https://openrouter.ai/keys' },
  NVIDIA_API_KEY:     { label: 'NVIDIA NIM',       description: 'NVIDIA-hosted enterprise models',               category: 'AI',    keyUrl: 'https://build.nvidia.com/settings/api-keys' },
  COHERE_API_KEY:     { label: 'Cohere',            description: 'Research and retrieval-oriented models',        category: 'AI',    keyUrl: 'https://dashboard.cohere.com/api-keys' },
  MISTRAL_API_KEY:    { label: 'Mistral AI',        description: 'European open-source AI models',               category: 'AI',    keyUrl: 'https://console.mistral.ai/api-keys' },
  TOGETHER_API_KEY:   { label: 'Together AI',       description: 'Open-source hosted models',                    category: 'AI',    keyUrl: 'https://api.together.xyz/settings/api-keys' },
  HF_API_KEY:         { label: 'Hugging Face',      description: 'Inference API — thousands of models',          category: 'AI',    keyUrl: 'https://huggingface.co/settings/tokens' },
  DEEPSEEK_API_KEY:   { label: 'DeepSeek',          description: 'Best for code — DeepSeek Coder',               category: 'AI',    keyUrl: 'https://platform.deepseek.com/api_keys' },
  CEREBRAS_API_KEY:   { label: 'Cerebras',          description: 'Ultra-fast inference',                         category: 'AI',    keyUrl: 'https://cloud.cerebras.ai/' },
  SAMBANOVA_API_KEY:  { label: 'SambaNova',         description: 'Large model inference — Llama 405B',           category: 'AI',    keyUrl: 'https://cloud.sambanova.ai/apis' },
  XAI_API_KEY:        { label: 'xAI / Grok',        description: 'Grok models with web search',                  category: 'AI',    keyUrl: 'https://console.x.ai/team/default/api-keys' },
  MOONSHOT_API_KEY:   { label: 'Moonshot / Kimi',   description: '200K context window AI',                       category: 'AI',    keyUrl: 'https://platform.moonshot.cn/console/api-keys' },
  FIREWORKS_API_KEY:  { label: 'Fireworks AI',      description: 'Fast open-source model hosting',               category: 'AI',    keyUrl: 'https://app.fireworks.ai/account/api-keys' },
  AI21_API_KEY:       { label: 'AI21 Labs',         description: 'Writing-focused AI models',                    category: 'AI',    keyUrl: 'https://studio.ai21.com/account/api-key' },
  QWEN_API_KEY:       { label: 'Qwen / DashScope',  description: 'Multilingual AI from Alibaba',                 category: 'AI',    keyUrl: 'https://dashscope.console.aliyun.com/apiKey' },
  PERPLEXITY_API_KEY: { label: 'Perplexity AI',     description: 'Web-search powered AI responses',              category: 'AI',    keyUrl: 'https://www.perplexity.ai/settings/api' },
  LEONARDO_API_KEY:   { label: 'Leonardo AI',       description: 'Premium image generation',                     category: 'Media', keyUrl: 'https://app.leonardo.ai/api-access' },
  SERPER_API_KEY:     { label: 'Serper',            description: 'Google-style web search for Research mode',    category: 'Search',keyUrl: 'https://serper.dev/api-key' },
  BRAVE_API_KEY:      { label: 'Brave Search',      description: 'Web search fallback for Research mode',        category: 'Search',keyUrl: 'https://brave.com/search/api/' },
};

const VALID_SESSION_ID = /^[A-Za-z0-9_-]{32,128}$/;
const VALID_TONES = new Set(['friendly', 'professional', 'funny', 'formal', 'creative']);

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

function getMasterKey() {
  const fromEnv = process.env.LUNA_MASTER_KEY;
  if (fromEnv) {
    const n = fromEnv.trim();
    if (/^[0-9a-fA-F]{64}$/.test(n)) return Buffer.from(n, 'hex');
    return crypto.createHash('sha256').update(n).digest();
  }
  ensureDataDir();
  if (fs.existsSync(MASTER_KEY_FILE)) {
    const stored = fs.readFileSync(MASTER_KEY_FILE, 'utf8').trim();
    if (/^[0-9a-fA-F]{64}$/.test(stored)) return Buffer.from(stored, 'hex');
  }
  const generated = crypto.randomBytes(32);
  fs.writeFileSync(MASTER_KEY_FILE, generated.toString('hex'), { encoding: 'utf8', mode: 0o600 });
  return generated;
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const ct = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: ct.toString('base64') };
}

function decrypt(payload) {
  const d = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(payload.iv, 'base64'));
  d.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(payload.data, 'base64')), d.final()]).toString('utf8');
}

function isValidSessionId(sessionId) {
  return typeof sessionId === 'string' && VALID_SESSION_ID.test(sessionId);
}

function readSessions() {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) return {};
  try {
    const payload = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    return JSON.parse(decrypt(payload)) || {};
  } catch {
    return {};
  }
}

function writeSessions(sessions) {
  ensureDataDir();
  const tempFile = `${SESSIONS_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(encrypt(JSON.stringify(sessions)), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tempFile, SESSIONS_FILE);
}

function emptyRecord() {
  return { keys: {}, profile: {}, personality: { ...DEFAULT_PERSONALITY }, updatedAt: new Date().toISOString() };
}

function saveRecord(sessionId, record) {
  if (!isValidSessionId(sessionId)) throw new Error('Invalid anonymous session');
  const sessions = readSessions();
  sessions[sessionId] = { ...emptyRecord(), ...record, updatedAt: new Date().toISOString() };
  writeSessions(sessions);
}

function getRecord(sessionId) {
  if (!isValidSessionId(sessionId)) return emptyRecord();
  const sessions = readSessions();
  return { ...emptyRecord(), ...(sessions[sessionId] || {}), keys: sessions[sessionId]?.keys || {}, profile: sessions[sessionId]?.profile || {}, personality: { ...DEFAULT_PERSONALITY, ...(sessions[sessionId]?.personality || {}) } };
}

function getKey(keyName, sessionId = null) {
  if (!KEY_DEFINITIONS[keyName]) return null;
  const record = getRecord(sessionId);
  return record.keys[keyName] || process.env[keyName] || null;
}

function saveKeys(updates = {}, clear = [], sessionId) {
  if (!isValidSessionId(sessionId)) throw new Error('Anonymous session is required');
  const record = getRecord(sessionId);
  for (const [keyName, value] of Object.entries(updates || {})) {
    if (!KEY_DEFINITIONS[keyName]) continue;
    const trimmed = String(value).trim();
    if (trimmed) record.keys[keyName] = trimmed.slice(0, 1000);
  }
  for (const keyName of Array.isArray(clear) ? clear : []) {
    if (KEY_DEFINITIONS[keyName]) delete record.keys[keyName];
  }
  saveRecord(sessionId, record);
  return getPublicKeyState(sessionId);
}

function getPublicKeyState(sessionId) {
  const record = getRecord(sessionId);
  return Object.entries(KEY_DEFINITIONS).map(([key, def]) => {
    const savedValue = record.keys[key];
    const environmentValue = process.env[key];
    const value = savedValue || environmentValue || null;
    return {
      key,
      ...def,
      configured: Boolean(value),
      source: savedValue ? 'saved' : environmentValue ? 'environment' : null,
      lastFour: value ? value.slice(-4) : null,
    };
  });
}

function readProfile(sessionId) {
  return getRecord(sessionId).profile;
}

function saveProfile(input = {}, sessionId) {
  if (!isValidSessionId(sessionId)) throw new Error('Anonymous session is required');
  const allowed = ['name', 'nickname', 'role', 'location', 'interests', 'about', 'communicationStyle'];
  const profile = {};
  for (const field of allowed) {
    if (typeof input[field] === 'string') profile[field] = input[field].trim().slice(0, 500);
  }
  if (typeof input.shareWithAI === 'boolean') profile.shareWithAI = input.shareWithAI;
  const record = getRecord(sessionId);
  record.profile = profile;
  saveRecord(sessionId, record);
  return profile;
}

function readPersonality(sessionId) {
  return getRecord(sessionId).personality;
}

function savePersonality(input = {}, sessionId) {
  if (!isValidSessionId(sessionId)) throw new Error('Anonymous session is required');
  const record = getRecord(sessionId);
  const personality = {
    tone: VALID_TONES.has(input.tone) ? input.tone : record.personality.tone,
    systemPrompt: typeof input.systemPrompt === 'string' && input.systemPrompt.trim()
      ? input.systemPrompt.trim().slice(0, 4000)
      : record.personality.systemPrompt,
  };
  record.personality = personality;
  saveRecord(sessionId, record);
  return personality;
}

function clearSession(sessionId) {
  if (!isValidSessionId(sessionId)) return;
  const sessions = readSessions();
  delete sessions[sessionId];
  writeSessions(sessions);
}

module.exports = {
  DATA_DIR,
  DEFAULT_PERSONALITY,
  KEY_DEFINITIONS,
  getMasterKey,
  getKey,
  saveKeys,
  getPublicKeyState,
  readProfile,
  saveProfile,
  readPersonality,
  savePersonality,
  clearSession,
  isValidSessionId,
};
