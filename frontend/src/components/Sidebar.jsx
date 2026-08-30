// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Image, FileText, Search, BookOpen, Home, Lock, Github, Settings, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/',          icon: Home,          label: 'Home' },
  { to: '/chat',      icon: MessageCircle, label: 'AI Chat' },
  { to: '/image',     icon: Image,         label: 'Image Gen' },
  { to: '/documents', icon: FileText,      label: 'Documents' },
  { to: '/research',  icon: Search,        label: 'Research' },
  { to: '/student',   icon: BookOpen,      label: 'Student Tools' },
  { to: '/settings',  icon: Settings,      label: 'Settings' },
];

const LOCKED = [
  { label: 'PC Control',     desc: 'Desktop only' },
  { label: 'Plugins',        desc: 'Desktop only' },
  { label: 'Self-Evolution', desc: 'Desktop only' },
  { label: 'Voice Mode',     desc: 'Desktop only' },
];

function SidebarContent({ onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌙</span>
          <div>
            <h1 className="text-lg font-bold text-white">Luna AI</h1>
            <span className="text-xs text-accent font-medium">Web Preview</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-slate-400 hover:text-white md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={onClose}
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

        {/* Locked */}
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
        <p className="text-xs text-slate-600 text-center mt-3">Built by Ravikiran A 🌙</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface border border-border rounded-xl text-slate-300 hover:text-white hover:bg-surface2 transition-colors shadow-lg">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed left-0 top-0 h-screen w-72 bg-surface border-r border-border z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-surface border-r border-border flex-col fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
