// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader, Shield, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatAPI, settingsAPI } from '../utils/api';
import { LUNA_PERSONALITY } from '../personality';

const TONES = ['friendly', 'professional', 'funny', 'formal', 'creative'];

const STATUS_COLORS = {
  healthy:  'text-success bg-success/10 border-success/20',
  limited:  'text-warning bg-warning/10 border-warning/20',
  failed:   'text-danger  bg-danger/10  border-danger/20',
  nokey:    'text-slate-400 bg-surface2  border-border',
  testing:  'text-accent  bg-accent/10  border-accent/20',
};

const STATUS_DOTS = {
  healthy: '🟢', limited: '🟡', failed: '🔴', nokey: '⚪', testing: '🔵',
};

function ProviderCard({ def, health, onSave }) {
  const [value, setValue] = useState('');
  const [show, setShow]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const statusKey = def.key === 'POLLINATIONS_API_KEY' ? 'nokey'
    : testing ? 'testing'
    : !def.configured ? 'nokey'
    : health?.alive === false ? 'failed'
    : health?.errors > 0 ? 'limited'
    : 'healthy';

  const save = async (rawValue = value, silent = false) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await settingsAPI.saveKeys({ [def.key]: trimmed });
      setValue('');
      if (!silent) toast.success(`${def.label} key saved to this browser session! 🔒`);
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to save key');
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      const { data } = await settingsAPI.testProvider(def.key);
      if (data.ok) toast.success(`${def.label} is working! 🟢`);
      else toast.error(`${def.label} failed: ${data.error}`);
      onSave();
    } catch (err) {
      toast.error(err.message || 'Test failed');
    } finally { setTesting(false); }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await settingsAPI.saveKeys({}, [def.key]);
      setValue('');
      toast.success(`${def.label} key removed from this browser session.`);
      onSave();
    } catch { toast.error('Failed to remove key'); }
    finally { setSaving(false); }
  };

  return (
    <div className="luna-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-white">{def.label}</p>
          <p className="text-xs text-slate-500">{def.description}</p>
          <a href={def.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-white transition-colors">
            Get an API key <ExternalLink size={11} />
          </a>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[statusKey]}`}>
          {STATUS_DOTS[statusKey]} {statusKey === 'nokey' ? 'Not configured' : statusKey === 'testing' ? 'Testing...' : statusKey}
        </span>
      </div>

      {def.key === 'POLLINATIONS_API_KEY' ? (
        <div className="px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-xs text-success">
          ✅ No key needed — always free!
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onPaste={e => {
                const pasted = e.clipboardData.getData('text');
                setTimeout(() => save(pasted, true), 0);
              }}
              onBlur={() => save(value, true)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder={def.configured ? `••••${def.lastFour || '••••'}` : 'Paste API key here...'}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
            <button onClick={() => setShow(!show)} className="text-slate-500 hover:text-slate-300">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {def.configured && def.category === 'AI' && (
            <button onClick={test} disabled={testing}
              className="px-3 py-2 bg-surface2 border border-border rounded-lg text-xs text-slate-300 hover:text-white hover:border-accent transition-colors disabled:opacity-40">
              {testing ? <Loader size={14} className="animate-spin" /> : 'Test'}
            </button>
          )}
          <button onClick={() => save()} disabled={saving || !value.trim()}
            className="px-3 py-2 bg-primary rounded-lg text-white text-xs hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {saving ? <Loader size={14} className="animate-spin" /> : 'Save'}
          </button>
          {def.configured && (
            <button onClick={clear} disabled={saving}
              className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs hover:bg-danger/20 disabled:opacity-40 transition-colors">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [keyDefs, setKeyDefs]     = useState([]);
  const [health, setHealth]       = useState({});
  const [cacheStats, setCacheStats] = useState(null);
  const [tone, setTone]           = useState(LUNA_PERSONALITY.tone);
  const [prompt, setPrompt]       = useState(LUNA_PERSONALITY.systemPrompt);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    try {
      const [keysRes, healthRes, personalityRes] = await Promise.all([
        settingsAPI.getKeys(),
        chatAPI.health(),
        settingsAPI.getPersonality(),
      ]);
      setKeyDefs(keysRes.data.keys || []);
      const hMap = {};
      (healthRes.data.providers || []).forEach(p => { hMap[p.id] = p; });
      setHealth(hMap);
      setCacheStats(healthRes.data.cache);
      if (personalityRes.data?.tone) setTone(personalityRes.data.tone);
      if (personalityRes.data?.systemPrompt) setPrompt(personalityRes.data.systemPrompt);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const savePersonality = async () => {
    try {
      await settingsAPI.savePersonality({ tone, systemPrompt: prompt });
      toast.success('Personality saved to this browser session! 🌙');
    } catch { toast.error('Failed to save personality'); }
  };

  const clearSession = async () => {
    try {
      await settingsAPI.clearSession();
      localStorage.clear();
      setTone(LUNA_PERSONALITY.tone);
      setPrompt(LUNA_PERSONALITY.systemPrompt);
      toast.success('All session data cleared!');
      load();
    } catch { toast.error('Failed to clear session data'); }
  };

  const categories = ['AI', 'Media', 'Search'];

  return (
    <div className="max-w-3xl mx-auto pt-16 md:pt-0">
      <div className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">⚙️ Settings</h1>
        <p className="text-xs text-slate-500 mb-2">Connect providers and teach Luna how to work with you</p>
        <p className="text-xs text-slate-500">Keys are encrypted on the backend and scoped to this browser session. Never share your session or paste keys into chat.</p>
      </div>

      {/* Provider Health Dashboard */}
      <div className="luna-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">🟢 Provider Health Dashboard</h2>
          <button onClick={load} className="p-1.5 hover:bg-surface2 rounded-lg text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(health).map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-surface2 rounded-lg px-3 py-2">
              <span className="text-xs">
                {p.id === 'pollinations' ? '🟢' : !p.hasKey ? '⚪' : !p.alive ? '🔴' : p.errors > 0 ? '🟡' : '🟢'}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.latency ? `${p.latency}ms` : p.hasKey || p.id === 'pollinations' ? 'ready' : 'no key'}</p>
              </div>
            </div>
          ))}
        </div>
        {cacheStats && (
          <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs text-slate-400">
            <span>⚡ Cache hit rate: <strong className="text-success">{cacheStats.hitRate}</strong></span>
            <span>🎯 Hits: <strong className="text-white">{cacheStats.hits}</strong></span>
            <span>💾 Tokens saved: <strong className="text-accent">{cacheStats.tokensSaved}</strong></span>
          </div>
        )}
      </div>

      {/* API Keys by category */}
      {loading ? (
        <div className="text-center py-12"><Loader size={24} className="animate-spin text-primary mx-auto" /></div>
      ) : (
        categories.map(cat => {
          const catKeys = keyDefs.filter(k => k.category === cat);
          if (!catKeys.length) return null;
          return (
            <div key={cat} className="mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={12} /> {cat} Providers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catKeys.map(def => (
                  <ProviderCard
                    key={def.key}
                    def={def}
                    health={health[({
                      HF_API_KEY: 'huggingface',
                    }[def.key] || def.key.replace('_API_KEY', '').toLowerCase())]}
                    onSave={load}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Luna Personality */}
      <div className="luna-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">🌙 Luna Personality</h2>
        <p className="text-xs text-slate-500 mb-4">Customize how Luna speaks and behaves</p>

        {/* Locked fields */}
        <div className="bg-surface border border-border rounded-xl p-3 mb-4 space-y-1">
          <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">🔒 Locked — Cannot change</p>
          {[['Name', LUNA_PERSONALITY.name], ['Emoji', LUNA_PERSONALITY.emoji], ['Creator', LUNA_PERSONALITY.creator], ['GitHub', LUNA_PERSONALITY.github]].map(([label, value]) => (
            <div key={label} className="flex gap-2 text-xs">
              <span className="text-slate-500 w-14">{label}:</span>
              <span className="text-danger font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Tone */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-300 block mb-2">✏️ Tone (changeable)</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tone === t ? 'bg-primary text-white' : 'bg-surface2 border border-border text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* System prompt */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-300 block mb-2">✏️ System Prompt (changeable)</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-primary outline-none resize-none font-mono" />
        </div>

        <button onClick={savePersonality}
          className="px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          Save Personality
        </button>
      </div>

      {/* Session */}
      <div className="luna-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-white mb-1">🗑️ Session Data</h2>
        <p className="text-xs text-slate-500 mb-4">Clear your local chat history and session data</p>
        <button onClick={clearSession}
          className="flex items-center gap-2 px-4 py-2 bg-danger/20 border border-danger/30 rounded-lg text-danger text-sm hover:bg-danger/30 transition-colors">
          <Trash2 size={14} /> Clear All Session Data
        </button>
      </div>
    </div>
  );
}
