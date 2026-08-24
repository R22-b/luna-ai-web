const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '.luna-data');
const SECRET_FILE = path.join(DATA_DIR, 'secrets.json');
const MASTER_KEY_FILE = path.join(DATA_DIR, 'master.key');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

const KEY_DEFINITIONS = {
  GROQ_API_KEY: { label: 'Groq', description: 'Fast Llama models and code assistance', category: 'AI' },
  GEMINI_API_KEY: { label: 'Google Gemini', description: 'Reasoning, long context, and multimodal tasks', category: 'AI' },
  OPENROUTER_API_KEY: { label: 'OpenRouter', description: 'Access to multiple hosted models', category: 'AI' },
  NVIDIA_API_KEY: { label: 'NVIDIA NIM', description: 'NVIDIA-hosted open models', category: 'AI' },
  COHERE_API_KEY: { label: 'Cohere', description: 'Research and retrieval-oriented models', category: 'AI' },
  MISTRAL_API_KEY: { label: 'Mistral AI', description: 'Mistral language models', category: 'AI' },
  TOGETHER_API_KEY: { label: 'Together AI', description: 'Open-source hosted models', category: 'AI' },
  HF_API_KEY: { label: 'Hugging Face', description: 'Inference API models', category: 'AI' },
  DEEPSEEK_API_KEY: { label: 'DeepSeek', description: 'Chat and coding models', category: 'AI' },
  CEREBRAS_API_KEY: { label: 'Cerebras', description: 'Very fast inference', category: 'AI' },
  SAMBANOVA_API_KEY: { label: 'SambaNova', description: 'Hosted open models', category: 'AI' },
  LEONARDO_API_KEY: { label: 'Leonardo AI', description: 'Optional image generation provider', category: 'Media' },
  SERPER_API_KEY: { label: 'Serper', description: 'Google-style web search for Research mode', category: 'Search' },
  BRAVE_API_KEY: { label: 'Brave Search', description: 'Web search fallback for Research mode', category: 'Search' },
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

function getMasterKey() {
  const fromEnv = process.env.LUNA_MASTER_KEY;
  if (fromEnv) {
    const normalized = fromEnv.trim();
    if (/^[0-9a-fA-F]{64}$/.test(normalized)) return Buffer.from(normalized, 'hex');
    return crypto.createHash('sha256').update(normalized).digest();
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
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function readEncryptedKeys() {
  ensureDataDir();
  if (!fs.existsSync(SECRET_FILE)) return {};
  try {
    const payload = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));
    const parsed = JSON.parse(decrypt(payload));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Unable to read encrypted Luna settings:', error.message);
    return {};
  }
}

function writeEncryptedKeys(keys) {
  ensureDataDir();
  const payload = encrypt(JSON.stringify(keys));
  fs.writeFileSync(SECRET_FILE, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function getKey(keyName) {
  if (!KEY_DEFINITIONS[keyName]) return null;
  const stored = readEncryptedKeys()[keyName];
  return stored || process.env[keyName] || null;
}

function saveKeys(updates = {}, clear = []) {
  const current = readEncryptedKeys();
  for (const [keyName, value] of Object.entries(updates)) {
    if (!KEY_DEFINITIONS[keyName]) continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) current[keyName] = trimmed.slice(0, 1000);
  }
  for (const keyName of clear) {
    if (KEY_DEFINITIONS[keyName]) delete current[keyName];
  }
  writeEncryptedKeys(current);
  return getPublicKeyState();
}

function getPublicKeyState() {
  return Object.entries(KEY_DEFINITIONS).map(([key, definition]) => {
    const value = getKey(key);
    return {
      key,
      ...definition,
      configured: Boolean(value),
      source: value ? (readEncryptedKeys()[key] ? 'saved' : 'environment') : null,
      lastFour: value ? value.slice(-4) : null,
    };
  });
}

function readProfile() {
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) return {};
  try {
    const profile = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8'));
    return profile && typeof profile === 'object' ? profile : {};
  } catch {
    return {};
  }
}

function saveProfile(input = {}) {
  const allowed = ['name', 'nickname', 'role', 'location', 'interests', 'about', 'communicationStyle'];
  const profile = {};
  for (const field of allowed) {
    if (typeof input[field] === 'string') profile[field] = input[field].trim().slice(0, 500);
  }
  if (typeof input.shareWithAI === 'boolean') profile.shareWithAI = input.shareWithAI;
  ensureDataDir();
  fs.writeFileSync(PROFILE_FILE, `${JSON.stringify(profile, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return profile;
}

module.exports = {
  KEY_DEFINITIONS,
  getKey,
  saveKeys,
  getPublicKeyState,
  readProfile,
  saveProfile,
};
