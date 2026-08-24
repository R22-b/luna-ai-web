import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../utils/api';
import { CacheIndicator, ProviderBadge, PageHeader } from '../components/shared';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm Luna AI 🌙 How can I help you today?", provider: 'Luna AI', fromCache: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState('chat');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content }));
      const { data } = await chatAPI.send(userMsg.content, history, taskType);
      setMessages(prev => [...prev, {
        role: 'assistant', content: data.response,
        provider: data.provider, fromCache: data.fromCache, latency: data.latency,
      }]);
    } catch (err) {
      toast.error(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I had an error: ${err.message}`, provider: 'Error', fromCache: false }]);
    } finally { setLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  const clear = () => { setMessages([{ role: 'assistant', content: "Chat cleared! How can I help? 🌙", provider: 'Luna AI', fromCache: false }]); };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <PageHeader icon="💬" title="AI Chat" subtitle="Multi-provider AI with smart caching" />
        <div className="flex items-center gap-2">
          <select value={taskType} onChange={e => setTaskType(e.target.value)}
            className="text-sm bg-surface2 border border-border rounded-lg px-3 py-1.5 text-slate-300 focus:border-primary outline-none">
            <option value="chat">General Chat</option>
            <option value="code">Code Help</option>
            <option value="research">Research</option>
            <option value="creative">Creative</option>
            <option value="fast">Fast Mode</option>
          </select>
          <button onClick={clear} className="p-2 rounded-lg hover:bg-surface2 text-slate-400 hover:text-white transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-surface2 border border-border'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <span className="text-sm">🌙</span>}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-surface2 border border-border text-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant'
                  ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
                  : msg.content}
              </div>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 px-1">
                  {msg.provider && <ProviderBadge provider={msg.provider} />}
                  <CacheIndicator fromCache={msg.fromCache} />
                  {msg.latency && <span className="text-xs text-slate-600">{msg.latency}ms</span>}
                  <button onClick={() => copy(msg.content)} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
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

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 bg-surface2 border border-border rounded-xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message Luna AI... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none px-2 py-1 max-h-32"
          />
          <button onClick={send} disabled={loading || !input.trim()}
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
