import { Zap, RefreshCw, Lock } from 'lucide-react';

export function LoadingSpinner({ text = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}

export function CacheIndicator({ fromCache }) {
  if (fromCache === undefined) return null;
  return fromCache ? (
    <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
      <Zap size={10} /> Cached
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">
      <RefreshCw size={10} /> Fresh
    </span>
  );
}

export function ProviderBadge({ provider }) {
  const colors = {
    Groq: 'text-orange-400 bg-orange-400/10',
    Gemini: 'text-blue-400 bg-blue-400/10',
    OpenRouter: 'text-purple-400 bg-purple-400/10',
    'NVIDIA NIM': 'text-green-400 bg-green-400/10',
    Cohere: 'text-red-400 bg-red-400/10',
    'Mistral AI': 'text-teal-400 bg-teal-400/10',
    'Together AI': 'text-yellow-400 bg-yellow-400/10',
    Pollinations: 'text-pink-400 bg-pink-400/10',
    DeepSeek: 'text-cyan-400 bg-cyan-400/10',
    Cerebras: 'text-indigo-400 bg-indigo-400/10',
    SambaNova: 'text-lime-400 bg-lime-400/10',
    HuggingFace: 'text-amber-400 bg-amber-400/10',
  };
  const cls = colors[provider] || 'text-slate-400 bg-slate-400/10';
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {provider}
    </span>
  );
}

export function FeatureLocked({ feature }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center">
        <Lock size={24} className="text-slate-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-300">{feature}</h3>
        <p className="text-slate-500 text-sm mt-1">Available in Luna AI Desktop</p>
      </div>
      <a href="https://github.com/R22-b/luna-AI" target="_blank" rel="noreferrer"
        className="px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/90 transition-colors">
        Download Luna AI Desktop
      </a>
    </div>
  );
}

export function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      {subtitle && <p className="text-slate-400 text-sm ml-9">{subtitle}</p>}
    </div>
  );
}
