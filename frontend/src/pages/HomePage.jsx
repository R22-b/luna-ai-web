// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
import { Link } from 'react-router-dom';
import { Github, Zap, Monitor, Cpu, Shield } from 'lucide-react';

const FEATURES = [
  { to: '/chat',      icon: '💬', label: 'AI Chat',       desc: '18 providers, 100+ models, streaming',    color: 'from-purple-600 to-purple-800' },
  { to: '/image',     icon: '🎨', label: 'Image Gen',     desc: 'FLUX, SDXL, Pollinations — free always',  color: 'from-pink-600 to-pink-800' },
  { to: '/documents', icon: '📄', label: 'Documents',     desc: 'Word, PDF, PowerPoint, Excel with AI',    color: 'from-blue-600 to-blue-800' },
  { to: '/research',  icon: '🔍', label: 'Research',      desc: 'Multi-source web research & synthesis',   color: 'from-cyan-600 to-cyan-800' },
  { to: '/student',   icon: '📚', label: 'Student Tools', desc: 'PDF study, YouTube, flashcards, quiz',    color: 'from-green-600 to-green-800' },
];

const PROVIDERS = [
  'Groq','Gemini','OpenRouter','NVIDIA','Cohere','Mistral',
  'Together AI','HuggingFace','DeepSeek','Cerebras','SambaNova',
  'xAI/Grok','Moonshot/Kimi','Fireworks','AI21','Qwen','Perplexity','Pollinations'
];

const DESKTOP_FEATURES = [
  { icon: '🖥️', label: 'PC Control',     desc: 'Control your computer with AI' },
  { icon: '🔌', label: 'Plugins',         desc: 'Extend Luna with custom plugins' },
  { icon: '🧬', label: 'Self-Evolution',  desc: 'Luna improves itself over time' },
  { icon: '🛡️', label: 'Project Guardian',desc: 'Auto-backup your projects' },
  { icon: '🎙️', label: 'Voice Mode',      desc: 'Wake word + full voice control' },
  { icon: '🤖', label: 'Autonomous Agent',desc: 'Multi-step task execution' },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto pt-16 md:pt-0">
      {/* Hero */}
      <div className="text-center mb-12 pt-8">
        <div className="text-6xl mb-4">🌙</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Luna AI <span className="text-primary">Web</span>
        </h1>
        <p className="text-slate-400 text-lg mb-1">Free AI Platform — Bring your own API keys</p>
        <p className="text-slate-500 text-sm mb-4">Web preview of Luna AI Desktop | Built by Ravikiran A</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-3 py-1 rounded-full">
            <Zap size={12} /> 8 Billion+ Free Tokens/Month
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent/10 px-3 py-1 rounded-full">
            18 AI Providers
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 px-3 py-1 rounded-full">
            100+ Models
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
            Streaming Responses
          </span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">18 AI Providers</h2>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map(p => (
            <span key={p} className="text-xs text-slate-300 bg-surface2 border border-border px-3 py-1 rounded-full">{p}</span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          🌙 Pollinations works with <strong className="text-slate-400">zero API keys</strong> — always free fallback!
        </p>
      </div>

      {/* About Luna AI Desktop — LOCKED SECTION */}
      <div className="luna-card p-6 border-primary/30 bg-primary/5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">🌙</div>
          <div>
            <h2 className="text-lg font-bold text-white">Want the FULL Luna AI experience?</h2>
            <p className="text-slate-400 text-sm">Download Luna AI Desktop — open source & free forever</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {DESKTOP_FEATURES.map(f => (
            <div key={f.label} className="bg-surface2 rounded-xl p-3 flex items-start gap-2">
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{f.label}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <a href="https://github.com/R22-b/luna-AI" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center">
            <Github size={16} /> Download Luna AI Desktop
          </a>
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-400">github.com/R22-b/luna-AI</p>
            <p className="text-xs text-slate-600">MIT License • Open Source • Built by Ravikiran A</p>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs pb-8">
        🌙 Luna AI Web Preview | MIT Licensed | Built by Ravikiran A | github.com/R22-b
      </p>
    </div>
  );
}
