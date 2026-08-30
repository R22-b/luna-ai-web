import { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { researchAPI } from '../utils/api';
import { LoadingSpinner, CacheIndicator, ProviderBadge, PageHeader } from '../components/shared';

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState('standard');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const doResearch = async () => {
    if (!query.trim()) return toast.error('Enter a research topic!');
    setLoading(true); setResult(null);
    try {
      const { data } = await researchAPI.search(query, depth, 5);
      setResult(data);
      toast.success(`Research complete! ${data.sources.length} sources analyzed.`);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader icon="🔍" title="Research Tools" subtitle="Multi-source web research with AI synthesis" />

      <div className="flex gap-2 mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doResearch()}
          placeholder="Research topic... (e.g. quantum computing breakthroughs 2024)"
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary outline-none text-sm" />
        <select value={depth} onChange={e => setDepth(e.target.value)}
          className="bg-surface2 border border-border rounded-xl px-3 text-slate-300 focus:border-primary outline-none text-sm">
          <option value="quick">Quick</option>
          <option value="standard">Standard</option>
          <option value="deep">Deep</option>
        </select>
        <button onClick={doResearch} disabled={loading}
          className="px-5 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-2">
          <Search size={16} />
          {loading ? 'Researching...' : 'Research'}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {['Searching the web...', 'Fetching sources...', 'Analyzing content...', 'Synthesizing report...'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-400 animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full" />
              {s}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="luna-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Research Report</h3>
              <div className="flex items-center gap-2">
                <ProviderBadge provider={result.provider} />
                <CacheIndicator fromCache={result.fromCache} />
              </div>
            </div>
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">
              {result.report}
            </ReactMarkdown>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Sources ({result.sources.length})</h3>
            <div className="space-y-2">
              {result.sources.map((s, i) => (
                <div key={i} className="luna-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.summary}</p>
                    </div>
                    <a href={s.url} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 p-1.5 hover:bg-surface2 rounded-lg text-slate-500 hover:text-accent transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-center text-slate-600 text-xs mt-6">Luna AI Web Preview | github.com/R22-b</p>
    </div>
  );
}
