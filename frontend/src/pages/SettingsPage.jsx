import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, UserRound, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../utils/api';
import { LoadingSpinner, PageHeader } from '../components/shared';

const CATEGORY_ORDER = ['AI', 'Media', 'Search'];

export default function SettingsPage() {
  const [providers, setProviders] = useState([]);
  const [keys, setKeys] = useState({});
  const [clearKeys, setClearKeys] = useState(new Set());
  const [profile, setProfile] = useState({
    name: '',
    nickname: '',
    role: '',
    location: '',
    interests: '',
    about: '',
    communicationStyle: '',
    shareWithAI: true,
  });
  const [visibleKeys, setVisibleKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const groupedProviders = useMemo(() => CATEGORY_ORDER.map(category => ({
    category,
    items: providers.filter(provider => provider.category === category),
  })).filter(group => group.items.length), [providers]);

  useEffect(() => {
    Promise.all([settingsAPI.getKeys(), settingsAPI.getProfile()])
      .then(([keyResponse, profileResponse]) => {
        setProviders(keyResponse.data.providers || []);
        setProfile(prev => ({ ...prev, ...(profileResponse.data.profile || {}) }));
      })
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const updateProfile = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const updateKey = (key, value) => {
    setKeys(prev => ({ ...prev, [key]: value }));
    setClearKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const clearKey = (key) => {
    setKeys(prev => ({ ...prev, [key]: '' }));
    setClearKeys(prev => new Set(prev).add(key));
  };

  const saveKeys = async () => {
    setSavingKeys(true);
    try {
      const response = await settingsAPI.saveKeys(keys, [...clearKeys]);
      setProviders(response.data.providers || []);
      setKeys({});
      setClearKeys(new Set());
      toast.success('Provider keys saved securely');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingKeys(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await settingsAPI.saveProfile(profile);
      setProfile(prev => ({ ...prev, ...(response.data.profile || {}) }));
      toast.success('Your Luna profile was saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your settings..." />;

  return (
    <div className="min-h-screen p-6 pb-16">
      <PageHeader icon="⚙️" title="Settings" subtitle="Connect providers and teach Luna how to work with you" />

      <div className="max-w-4xl space-y-6">
        <section className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound size={19} className="text-accent" />
                <h2 className="text-lg font-semibold text-white">Provider API keys</h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">Keys are encrypted and stored by this Luna backend. Values are never displayed after saving.</p>
            </div>
            <ShieldCheck size={22} className="text-success flex-shrink-0" />
          </div>

          <div className="space-y-6">
            {groupedProviders.map(({ category, items }) => (
              <div key={category}>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">{category} providers</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {items.map(provider => {
                    const pendingClear = clearKeys.has(provider.key);
                    return (
                      <div key={provider.key} className="rounded-xl bg-surface2 border border-border p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <label className="text-sm font-medium text-slate-200" htmlFor={provider.key}>{provider.label}</label>
                            <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full ${provider.configured && !pendingClear ? 'text-success bg-success/10' : 'text-slate-500 bg-black/20'}`}>
                            {provider.configured && !pendingClear ? `Saved ••••${provider.lastFour}` : 'Not configured'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id={provider.key}
                              type={visibleKeys[provider.key] ? 'text' : 'password'}
                              value={keys[provider.key] || ''}
                              onChange={event => updateKey(provider.key, event.target.value)}
                              placeholder={provider.configured && !pendingClear ? 'Enter a new key to replace it' : 'Paste API key'}
                              autoComplete="new-password"
                              className="w-full bg-bg border border-border rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-primary"
                            />
                            <button type="button" onClick={() => setVisibleKeys(prev => ({ ...prev, [provider.key]: !prev[provider.key] }))} className="absolute right-2 top-2 text-slate-500 hover:text-slate-200" aria-label="Show or hide API key">
                              {visibleKeys[provider.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {provider.configured && <button type="button" onClick={() => clearKey(provider.key)} className="px-2.5 rounded-lg border border-border text-slate-500 hover:text-danger hover:border-danger/50" aria-label={`Remove ${provider.label} key`}><Trash2 size={16} /></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-border">
            <p className="text-xs text-slate-500">At least one configured provider is needed for real AI responses. Pollinations may be available as a fallback when its service is accessible.</p>
            <button type="button" onClick={saveKeys} disabled={savingKeys} className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              <Save size={16} /> {savingKeys ? 'Saving...' : 'Save keys'}
            </button>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-5">
            <UserRound size={19} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-white">Your Luna profile</h2>
              <p className="text-sm text-slate-400 mt-1">Tell Luna what you want her to remember. This profile stays with this backend and is only added to AI requests when sharing is enabled.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ['name', 'Your name', 'How should Luna identify you?'],
                ['nickname', 'Nickname', 'What should Luna call you?'],
                ['role', 'Role or occupation', 'Student, developer, designer...'],
                ['location', 'Location', 'Optional city or timezone'],
              ].map(([field, label, placeholder]) => (
                <label key={field} className="block">
                  <span className="text-xs text-slate-400">{label}</span>
                  <input value={profile[field] || ''} onChange={event => updateProfile(field, event.target.value)} placeholder={placeholder} className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-primary" />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-xs text-slate-400">Interests and goals</span>
              <input value={profile.interests || ''} onChange={event => updateProfile('interests', event.target.value)} placeholder="AI, web development, exams, music..." className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">About you</span>
              <textarea value={profile.about || ''} onChange={event => updateProfile('about', event.target.value)} placeholder="Anything Luna should keep in mind when helping you" rows={3} className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-primary resize-y" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Preferred communication style</span>
              <input value={profile.communicationStyle || ''} onChange={event => updateProfile('communicationStyle', event.target.value)} placeholder="Concise, detailed, friendly, direct..." className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-primary" />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 cursor-pointer">
              <input type="checkbox" checked={profile.shareWithAI === true} onChange={event => updateProfile('shareWithAI', event.target.checked)} className="mt-1 accent-primary" />
              <span>
                <span className="block text-sm font-medium text-slate-200">Let AI providers use my profile in chat</span>
                <span className="block text-xs text-slate-500 mt-1">When enabled, the profile can be sent to the selected external provider with your message. Do not add passwords, API keys, or highly sensitive information.</span>
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                <Save size={16} /> {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
