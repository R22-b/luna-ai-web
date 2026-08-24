import { Link } from 'react-router-dom';
import { MessageCircle, Image, FileText, Search, BookOpen, Github, Zap } from 'lucide-react';

const FEATURES = [
  { to: '/chat',      icon: '💬', label: 'AI Chat',       desc: '12 providers, 100+ models, smart caching',  color: 'from-purple-600 to-purple-800' },
  { to: '/image',     icon: '🎨', label: 'Image Gen',     desc: 'FLUX, SDXL, Pollinations — completely free', color: 'from-pink-600 to-pink-800' },
  { to: '/documents', icon: '📄', label: 'Documents',     desc: 'Word, PDF, PowerPoint, Excel generation',    color: 'from-blue-600 to-blue-800' },
  { to: '/research',  icon: '🔍', label: 'Research',      desc: 'Multi-source web research & synthesis',      color: 'from-cyan-600 to-cyan-800' },
  { to: '/student',   icon: '📚', label: 'Student Tools', desc: 'PDF study, YouTube notes, flashcards, quiz', color: 'from-green-600 to-green-800' },
];

const PROVIDERS = ['Groq', 'Gemini', 'OpenRouter', 'NVIDIA', 'Mistral', 'Together AI', 'DeepSeek', 'Cerebras', 'SambaNova', 'HuggingFace', 'Cohere', 'Pollinations'];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12 pt-8">
        <div className="text-6xl mb-4">🌙</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Luna AI <span className="text-primary">Web</span>
        </h1>
        <p className="text-slate-400 text-lg mb-2">Free AI Platform — No API keys required</p>
        <p className="text-slate-500 text-sm">Web preview of Luna AI Desktop | Built by Ravikiran</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-3 py-1 rounded-full">
            <Zap size={12} /> 8 Billion Free Tokens/Month
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent/10 px-3 py-1 rounded-full">
            12 AI Providers
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 px-3 py-1 rounded-full">
            100+ Models
          </span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {FEATURES.map(f => (
          <Link key={f.to} to={f.to}
            className="luna-card p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-white mb-1">{f.label}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </Link>
        ))}
      </div>

      {/* Providers */}
      <div className="luna-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Providers</h2>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map(p => (
            <span key={p} className="text-xs text-slate-300 bg-surface2 border border-border px-3 py-1 rounded-full">{p}</span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="luna-card p-6 text-center border-primary/30 bg-primary/5">
        <p className="text-white font-semibold mb-1">Want PC Control, Plugins, Voice & More?</p>
        <p className="text-slate-400 text-sm mb-4">Download the full Luna AI Desktop — open source & free forever</p>
        <a href="https://github.com/R22-b/luna-AI" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors">
          <Github size={16} /> github.com/R22-b
        </a>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6 pb-6">
        Luna AI Web Preview | MIT Licensed | Built by Ravikiran 🌙
      </p>
    </div>
  );
}
