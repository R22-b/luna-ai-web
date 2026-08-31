// MIT License — Luna AI Web | Built by Ravikiran A (github.com/R22-b)
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Copy, User, Share2, Download, Volume2, VolumeX, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../utils/api';
import { CacheIndicator, ProviderBadge } from '../components/shared';
import LUNA_PERSONALITY from '../personality';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const COMPRESS_EVERY = 20;
const SESSION_KEY = 'luna_chat_session';

// ── CONTEXT MEMORY ────────────────────────────────────────────
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || { messages: [], summary: '', count: 0 }; }
  catch { return { messages: [], summary: '', count: 0 }; }
}
function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── TASK MONITOR ──────────────────────────────────────────────
function TaskMonitor({ steps }) {
  if (!steps.length) return null;
  return (
    <div className="mx-4 mb-2 bg-surface2 border border-border rounded-xl p-3">
      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Luna is working...</p>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {step.status === 'done'    && <CheckCircle size={12} className="text-success flex-shrink-0" />}
            {step.status === 'active'  && <Loader size={12} className="text-primary flex-shrink-0 animate-spin" />}
            {step.status === 'failed'  && <XCircle size={12} className="text-danger flex-shrink-0" />}
            {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0" />}
            <span className={
              step.status === 'done'   ? 'text-slate-400 line-through' :
              step.status === 'active' ? 'text-white font-medium' :
              step.status === 'failed' ? 'text-danger' : 'text-slate-600'
            }>{step.label}</span>
            {step.detail && <span className="text-slate-500 ml-1">— {step.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PROVIDER INFO MODAL ───────────────────────────────────────
function ProviderInfoModal({ log, onClose }) {
  if (!log) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-white mb-3">⚠️ Provider Routing Info</h3>
        <div className="space-y-2">
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {entry.status === 'success' && <CheckCircle size={14} className="text-success mt-0.5 flex-shrink-0" />}
              {entry.status === 'failed'  && <XCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />}
              {entry.status === 'skipped' && <div className="w-3.5 h-3.5 rounded-full bg-slate-600 mt-0.5 flex-shrink-0" />}
              <div>
                <span className="text-white font-medium">{entry.provider}</span>
                {entry.reason && <p className="text-slate-400 text-xs mt-0.5">{entry.reason}</p>}
                {entry.status === 'failed' && entry.reason?.includes('key') && (
                  <p className="text-warning text-xs mt-1">→ Update API key in Settings</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-surface2 rounded-lg text-slate-300 text-sm hover:bg-border transition-colors">Close</button>
      </div>
    </div>
  );
}

// ── MESSAGE ACTIONS ───────────────────────────────────────────
function MessageActions({ msg }) {
  const [speaking, setSpeaking] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const copy = () => { navigator.clipboard.writeText(msg.content); toast.success('Copied! 📋'); };
  
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Luna AI Response', text: msg.content }); }
      catch {}
    } else { navigator.clipboard.writeText(msg.content); toast.success('Copied to clipboard! 📤'); }
  };

  const download = () => {
    const blob = new Blob([msg.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `luna_response_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded! ⬇️');
  };

  const toggleVoice = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(msg.content);
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (best) utterance.voice = best;
    utterance.rate = 0.95; utterance.pitch = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 px-1 mt-1 flex-wrap">
        {msg.provider && <ProviderBadge provider={msg.provider} />}
        <CacheIndicator fromCache={msg.fromCache} />
        {msg.latency && <span className="text-xs text-slate-600">{msg.latency}ms</span>}
        <div className="flex items-center gap-1 ml-1">
          <button onClick={copy}        title="Copy"          className="p-1 rounded hover:bg-surface2 text-slate-500 hover:text-slate-300 transition-colors"><Copy size={12} /></button>
          <button onClick={share}       title="Share"         className="p-1 rounded hover:bg-surface2 text-slate-500 hover:text-slate-300 transition-colors"><Share2 size={12} /></button>
          <button onClick={download}    title="Download"      className="p-1 rounded hover:bg-surface2 text-slate-500 hover:text-slate-300 transition-colors"><Download size={12} /></button>
          <button onClick={toggleVoice} title="Read aloud"    className={`p-1 rounded hover:bg-surface2 transition-colors ${speaking ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}>
            {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          {msg.routingLog && (
            <button onClick={() => setShowLog(true)} title="Provider info" className="p-1 rounded hover:bg-surface2 text-slate-500 hover:text-warning transition-colors"><AlertTriangle size={12} /></button>
          )}
        </div>
      </div>
      {showLog && <ProviderInfoModal log={msg.routingLog} onClose={() => setShowLog(false)} />}
    </>
  );
}

// ── MAIN CHAT PAGE ────────────────────────────────────────────
export default function ChatPage() {
  const session = loadSession();
  const [messages, setMessages] = useState(
    session.messages.length > 0 ? session.messages :
    [{ role: 'assistant', content: `Hey! I'm ${LUNA_PERSONALITY.name} ${LUNA_PERSONALITY.emoji} How can I help you today?`, provider: 'Luna AI', fromCache: false }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [taskType, setTaskType] = useState('chat');
  const [taskSteps, setTaskSteps] = useState([]);
  const [msgCount, setMsgCount] = useState(session.count || 0);
  const [summary, setSummary] = useState(session.summary || '');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamContent]);

  // Save session whenever messages change
  useEffect(() => {
    saveSession({ messages: messages.slice(-50), summary, count: msgCount });
  }, [messages, summary, msgCount]);

  const buildHistory = () => {
    const recent = messages.slice(-10).filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content }));
    if (summary) return [{ role: 'system', content: `Previous conversation summary: ${summary}` }, ...recent];
    return recent;
  };

  const compressContext = async (msgs) => {
    try {
      const text = msgs.map(m => `${m.role}: ${m.content}`).join('\n');
      const { data } = await chatAPI.send(`Summarize this conversation in 2-3 sentences:\n${text}`, [], 'fast');
      setSummary(data.response);
    } catch {}
  };

  const send = useCallback(async () => {
    if (!input.trim() || loading || streaming) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamContent('');

    // Task monitor steps
    setTaskSteps([
      { label: 'Understanding your request', status: 'active' },
      { label: 'Selecting best provider', status: 'pending' },
      { label: 'Generating response', status: 'pending' },
      { label: 'Formatting result', status: 'pending' },
    ]);

    const newCount = msgCount + 1;
    setMsgCount(newCount);

    // Auto compress every 20 messages
    if (newCount % COMPRESS_EVERY === 0) {
      await compressContext(newMessages.slice(-COMPRESS_EVERY));
    }

    try {
      setTaskSteps(s => s.map((st, i) => i === 0 ? { ...st, status: 'done' } : i === 1 ? { ...st, status: 'active' } : st));

      // Try streaming first
      const history = buildHistory();
      const params = new URLSearchParams({
        message: userMsg.content,
        history: encodeURIComponent(JSON.stringify(history)),
        taskType,
      });

      const evtSource = new EventSource(`${API_BASE}/chat/stream?${params}`, { withCredentials: true });
      setStreaming(true);
      setLoading(false);
      let fullText = '';
      let providerName = '';
      let routingLog = null;

      setTaskSteps(s => s.map((st, i) => i === 1 ? { ...st, status: 'done' } : i === 2 ? { ...st, status: 'active' } : st));

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'provider') {
            providerName = data.provider;
            setTaskSteps(s => s.map((st, i) => i === 2 ? { ...st, status: 'active', detail: providerName } : st));
          }
          if (data.type === 'token') { fullText += data.token; setStreamContent(fullText); }
          if (data.type === 'done') {
            routingLog = data.routingLog;
            evtSource.close();
            setStreaming(false);
            setStreamContent('');
            setTaskSteps(s => s.map((st, i) => i === 2 ? { ...st, status: 'done' } : i === 3 ? { ...st, status: 'active' } : st));
            setMessages(prev => [...prev, {
              role: 'assistant', content: fullText,
              provider: data.provider || providerName,
              fromCache: false, latency: null,
              routingLog: data.routingLog,
            }]);
            setTimeout(() => { setTaskSteps([]); }, 800);
          }
          if (data.type === 'error') {
            evtSource.close(); setStreaming(false); setStreamContent('');
            toast.error(data.message);
            setTaskSteps([]);
          }
        } catch {}
      };
      evtSource.onerror = () => {
        evtSource.close(); setStreaming(false); setStreamContent('');
        setTaskSteps([]);
      };

    } catch (err) {
      setLoading(false); setStreaming(false); setStreamContent('');
      setTaskSteps([]);
      toast.error(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I had an error: ${err.message}`, provider: 'Error', fromCache: false }]);
    }
  }, [input, loading, streaming, messages, taskType, msgCount, summary]);

  const clear = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! How can I help? ${LUNA_PERSONALITY.emoji}`, provider: 'Luna AI', fromCache: false }]);
    setMsgCount(0); setSummary('');
    localStorage.removeItem(SESSION_KEY);
  };

  const exportChat = () => {
    downloadJSON({ messages, summary, exportedAt: new Date().toISOString() }, `luna_chat_${Date.now()}.json`);
    toast.success('Chat exported! 📥');
  };

  return (
    <div className="flex flex-col h-screen md:ml-0">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between pt-16 md:pt-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">💬 AI Chat</h1>
          <p className="text-xs text-slate-400">18 providers • streaming • smart memory</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={taskType} onChange={e => setTaskType(e.target.value)}
            className="text-xs bg-surface2 border border-border rounded-lg px-2 py-1.5 text-slate-300 focus:border-primary outline-none">
            <option value="chat">💬 General</option>
            <option value="code">💻 Code</option>
            <option value="research">🔍 Research</option>
            <option value="creative">✨ Creative</option>
            <option value="fast">⚡ Fast</option>
          </select>
          <button onClick={exportChat} title="Export chat" className="p-2 rounded-lg hover:bg-surface2 text-slate-400 hover:text-white transition-colors text-xs">📥</button>
          <button onClick={clear} title="Clear chat" className="p-2 rounded-lg hover:bg-surface2 text-slate-400 hover:text-white transition-colors"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Summary badge */}
      {summary && (
        <div className="mx-4 mt-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-slate-400">
          📝 Context compressed — {msgCount} messages so far
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-surface2 border border-border'}`}>
              {msg.role === 'user' ? <User size={15} className="text-white" /> : <span className="text-sm">🌙</span>}
            </div>
            <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-surface2 border border-border text-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant'
                  ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
                  : msg.content}
              </div>
              {msg.role === 'assistant' && <MessageActions msg={msg} />}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {streaming && streamContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🌙</span>
            </div>
            <div className="max-w-[80%] bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
              <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{streamContent}</ReactMarkdown>
              <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
            </div>
          </div>
        )}

        {/* Loading dots */}
        {loading && !streaming && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center">
              <span className="text-sm">🌙</span>
            </div>
            <div className="bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Task Monitor */}
      <TaskMonitor steps={taskSteps} />

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 bg-surface2 border border-border rounded-xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Message ${LUNA_PERSONALITY.name}... (Enter to send)`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none px-2 py-1 max-h-32"
          />
          <button onClick={send} disabled={loading || streaming || !input.trim()}
            className="p-2.5 bg-primary rounded-lg text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">
          Luna AI Web Preview | Full version: github.com/R22-b
        </p>
      </div>
    </div>
  );
}
