// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '.luna-data');
const SECRET_FILE = path.join(DATA_DIR, 'secrets.json');
const MASTER_KEY_FILE = path.join(DATA_DIR, 'master.key');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

// ── ALL 18 PROVIDERS ─────────────────────────────────────────
const KEY_DEFINITIONS = {
  // AI Providers
  GROQ_API_KEY:       { label: 'Groq',             description: 'Fast Llama models and code assistance',          category: 'AI' },
  GEMINI_API_KEY:     { label: 'Google Gemini',     description: 'Reasoning, long context, and multimodal tasks', category: 'AI' },
  OPENROUTER_API_KEY: { label: 'OpenRouter',        description: 'Access to 200+ hosted models',                  category: 'AI' },
  NVIDIA_API_KEY:     { label: 'NVIDIA NIM',        description: 'NVIDIA-hosted enterprise models',               category: 'AI' },
  COHERE_API_KEY:     { label: 'Cohere',            description: 'Research and retrieval-oriented models',        category: 'AI' },
  MISTRAL_API_KEY:    { label: 'Mistral AI',        description: 'European open-source AI models',               category: 'AI' },
  TOGETHER_API_KEY:   { label: 'Together AI',       description: 'Open-source hosted models',                    category: 'AI' },
  HF_API_KEY:         { label: 'HuggingFace',       description: 'Inference API — 1000s of models',              category: 'AI' },
  DEEPSEEK_API_KEY:   { label: 'DeepSeek',          description: 'Best for code — DeepSeek Coder',               category: 'AI' },
  CEREBRAS_API_KEY:   { label: 'Cerebras',          description: 'Ultra-fast inference',                         category: 'AI' },
  SAMBANOVA_API_KEY:  { label: 'SambaNova',         description: 'Large model inference — Llama 405B',           category: 'AI' },
  XAI_API_KEY:        { label: 'xAI / Grok',        description: 'Grok models with web search',                  category: 'AI' },
  MOONSHOT_API_KEY:   { label: 'Moonshot / Kimi',   description: '200K context window AI',                       category: 'AI' },
  FIREWORKS_API_KEY:  { label: 'Fireworks AI',      description: 'Fast open-source model hosting',               category: 'AI' },
  AI21_API_KEY:       { label: 'AI21 Labs',         description: 'Writing-focused AI models',                    category: 'AI' },
  QWEN_API_KEY:       { label: 'Qwen (Alibaba)',    description: 'Multilingual AI from Alibaba',                 category: 'AI' },
  PERPLEXITY_API_KEY: { label: 'Perplexity AI',     description: 'Web-search powered AI responses',              category: 'AI' },
  // Media
  LEONARDO_API_KEY:   { label: 'Leonardo AI',       description: 'Premium image generation — 150 credits/day',   category: 'Media' },
  // Search
  SERPER_API_KEY:     { label: 'Serper',            description: 'Google-style web search for Research mode',    category: 'Search' },
  BRAVE_API_KEY:      { label: 'Brave Search',      description: 'Web search fallback for Research mode',        category: 'Search' },
};

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

function readEncryptedKeys() {
  ensureDataDir();
  if (!fs.existsSync(SECRET_FILE)) return {};
  try { return JSON.parse(decrypt(JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8')))) || {}; }
  catch { return {}; }
}

function writeEncryptedKeys(keys) {
  ensureDataDir();
  fs.writeFileSync(SECRET_FILE, `${JSON.stringify(encrypt(JSON.stringify(keys)), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function getKey(keyName) {
  if (!KEY_DEFINITIONS[keyName]) return null;
  return readEncryptedKeys()[keyName] || process.env[keyName] || null;
}

function saveKeys(updates = {}, clear = []) {
  const current = readEncryptedKeys();
  for (const [k, v] of Object.entries(updates)) {
    if (!KEY_DEFINITIONS[k]) continue;
    const t = String(v).trim();
    if (t) current[k] = t.slice(0, 1000);
  }
  for (const k of clear) { if (KEY_DEFINITIONS[k]) delete current[k]; }
  writeEncryptedKeys(current);
  return getPublicKeyState();
}

function getPublicKeyState() {
  return Object.entries(KEY_DEFINITIONS).map(([key, def]) => {
    const value = getKey(key);
    return {
      key, ...def,
      configured: Boolean(value),
      source: value ? (readEncryptedKeys()[key] ? 'saved' : 'environment') : null,
      lastFour: value ? value.slice(-4) : null,
    };
  });
}

function readProfile() {
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8')) || {}; } catch { return {}; }
}

function saveProfile(input = {}) {
  const allowed = ['name', 'nickname', 'role', 'location', 'interests', 'about', 'communicationStyle'];
  const profile = {};
  for (const f of allowed) { if (typeof input[f] === 'string') profile[f] = input[f].trim().slice(0, 500); }
  if (typeof input.shareWithAI === 'boolean') profile.shareWithAI = input.shareWithAI;
  ensureDataDir();
  fs.writeFileSync(PROFILE_FILE, `${JSON.stringify(profile, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return profile;
}

module.exports = { KEY_DEFINITIONS, getKey, saveKeys, getPublicKeyState, readProfile, saveProfile };
