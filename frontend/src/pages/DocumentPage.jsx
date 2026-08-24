import { useState } from 'react';
import { Download, FileText, File, Table, Presentation } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentAPI } from '../utils/api';
import { LoadingSpinner, PageHeader } from '../components/shared';

const TYPES = [
  { id: 'word',  icon: '📝', label: 'Word',       ext: 'docx', color: 'text-blue-400',   desc: 'Professional Word document' },
  { id: 'pdf',   icon: '📋', label: 'PDF',        ext: 'pdf',  color: 'text-red-400',    desc: 'Formatted PDF file' },
  { id: 'ppt',   icon: '📊', label: 'PowerPoint', ext: 'pptx', color: 'text-orange-400', desc: 'Slide deck presentation' },
  { id: 'excel', icon: '📈', label: 'Excel',      ext: 'xlsx', color: 'text-green-400',  desc: 'Spreadsheet with data' },
];

export default function DocumentPage() {
  const [type, setType] = useState('word');
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pages, setPages] = useState(3);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic first!');
    setLoading(true);
    try {
      const res = await documentAPI.generate(type, topic, instructions, pages);
      const selected = TYPES.find(t => t.id === type);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Luna_${topic.replace(/\s+/g,'_').substring(0,30)}.${selected.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${selected.label} generated and downloading!`);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const selected = TYPES.find(t => t.id === type);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader icon="📄" title="Document Creation" subtitle="Generate Word, PDF, PowerPoint & Excel with AI" />

      {/* Type selector */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`p-4 rounded-xl border text-center transition-all ${type === t.id ? 'border-primary bg-primary/10' : 'border-border bg-surface2 hover:border-slate-500'}`}>
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className={`text-sm font-medium ${type === t.id ? 'text-primary' : 'text-white'}`}>{t.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">.{t.ext}</div>
          </button>
        ))}
      </div>

      <div className="luna-card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Topic *</label>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Machine Learning in Healthcare"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary outline-none text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Additional Instructions</label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
            placeholder="e.g. Focus on recent developments, include statistics, formal tone..."
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary outline-none text-sm resize-none" />
        </div>
        {type !== 'excel' && (
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Pages: {pages}</label>
            <input type="range" min={1} max={10} value={pages} onChange={e => setPages(+e.target.value)}
              className="w-full accent-primary" />
          </div>
        )}
        <button onClick={generate} disabled={loading}
          className="w-full py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
          <Download size={16} />
          {loading ? `Generating ${selected?.label}...` : `Generate & Download ${selected?.label}`}
        </button>
      </div>

      {loading && <LoadingSpinner text={`AI is writing your ${selected?.label}... ✍️`} />}
      <p className="text-center text-slate-600 text-xs mt-6">Luna AI Web Preview | github.com/R22-b</p>
    </div>
  );
}
