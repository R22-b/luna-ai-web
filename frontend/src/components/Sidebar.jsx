import { NavLink } from 'react-router-dom';
import { MessageCircle, Image, FileText, Search, BookOpen, Home, Lock, Github, Settings } from 'lucide-react';

const NAV = [
  { to: '/',         icon: Home,          label: 'Home',         free: true },
  { to: '/chat',     icon: MessageCircle, label: 'AI Chat',      free: true },
  { to: '/image',    icon: Image,         label: 'Image Gen',    free: true },
  { to: '/documents',icon: FileText,      label: 'Documents',    free: true },
  { to: '/research', icon: Search,        label: 'Research',     free: true },
  { to: '/student',  icon: BookOpen,      label: 'Student Tools',free: true },
  { to: '/settings', icon: Settings,      label: 'Settings',      free: true },
];

const LOCKED = [
  { label: 'PC Control',    desc: 'Desktop only' },
  { label: 'Plugins',       desc: 'Desktop only' },
  { label: 'Self-Evolution',desc: 'Desktop only' },
  { label: 'Voice Mode',    desc: 'Desktop only' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌙</span>
          <div>
            <h1 className="text-lg font-bold text-white">Luna AI</h1>
            <span className="text-xs text-accent font-medium">Web Preview</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-surface2 hover:text-white'
                }`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Locked features */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-slate-500 px-3 mb-2 font-semibold uppercase tracking-wider">Desktop Only</p>
          {LOCKED.map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed">
              <Lock size={16} />
              <div>
                <p className="text-sm">{label}</p>
                <p className="text-xs text-slate-700">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <a href="https://github.com/R22-b/luna-AI" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface2 hover:bg-border transition-colors text-sm text-slate-300 hover:text-white">
          <Github size={16} />
          <span>Download Full Luna AI</span>
        </a>
        <p className="text-xs text-slate-600 text-center mt-3">Built by Ravikiran 🌙</p>
      </div>
    </aside>
  );
}
