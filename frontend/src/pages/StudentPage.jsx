import { useState, useRef } from 'react';
import { Upload, Youtube, Brain, CreditCard, HelpCircle, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { studentAPI } from '../utils/api';
import { LoadingSpinner, PageHeader } from '../components/shared';

const TABS = [
  { id: 'pdf',        icon: '📄', label: 'PDF Study' },
  { id: 'youtube',    icon: '▶️',  label: 'YouTube' },
  { id: 'feynman',    icon: '🧠',  label: 'Feynman' },
  { id: 'flashcards', icon: '🃏',  label: 'Flashcards' },
  { id: 'quiz',       icon: '❓',  label: 'Quiz' },
  { id: 'link',       icon: '🔗',  label: 'Link Summary' },
];

function FlashCard({ card, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={`flip-card h-32 ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="flip-card-inner relative h-full">
        <div className="flip-card-front absolute inset-0 luna-card flex items-center justify-center p-4 text-center">
          <p className="text-sm text-white font-medium">{card.q}</p>
        </div>
        <div className="flip-card-back absolute inset-0 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center p-4 text-center">
          <p className="text-sm text-accent">{card.a}</p>
        </div>
      </div>
    </div>
  );
}

function QuizComponent({ questions }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const answer = (opt) => {
    setSelected(opt);
    if (opt === questions[current].answer) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1200);
  };

  if (done) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">{score >= questions.length * 0.7 ? '🎉' : '📚'}</div>
      <p className="text-2xl font-bold text-white">{score}/{questions.length}</p>
      <p className="text-slate-400 mt-1">{score >= questions.length * 0.7 ? 'Great job!' : 'Keep studying!'}</p>
      <button onClick={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false); }}
        className="mt-4 px-4 py-2 bg-primary rounded-lg text-white text-sm">Retry</button>
    </div>
  );

  const q = questions[current];
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-3">
        <span>Question {current + 1}/{questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <p className="text-white font-medium mb-4">{q.question}</p>
      <div className="space-y-2">
        {q.options.map(opt => (
          <button key={opt} onClick={() => !selected && answer(opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              !selected ? 'border-border bg-surface2 hover:border-primary text-slate-300'
              : opt === q.answer ? 'border-success bg-success/10 text-success'
              : opt === selected ? 'border-danger bg-danger/10 text-danger'
              : 'border-border bg-surface2 text-slate-500'
            }`}>{opt}</button>
        ))}
      </div>
      {selected && q.explanation && (
        <p className="text-xs text-slate-400 mt-3 p-3 bg-surface2 rounded-lg">{q.explanation}</p>
      )}
    </div>
  );
}

export default function StudentPage() {
  const [tab, setTab] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [input, setInput] = useState('');
  const fileRef = useRef();

  const handle = async () => {
    setLoading(true); setResult(null);
    try {
      let data;
      if (tab === 'pdf') {
        if (!fileRef.current?.files[0]) return toast.error('Select a PDF!');
        ({ data } = await studentAPI.pdf(fileRef.current.files[0]));
      } else if (tab === 'youtube') {
        if (!input) return toast.error('Enter YouTube URL!');
        ({ data } = await studentAPI.youtube(input));
      } else if (tab === 'feynman') {
        if (!input) return toast.error('Enter a topic!');
        ({ data } = await studentAPI.feynman(input));
      } else if (tab === 'flashcards') {
        if (!input) return toast.error('Enter a topic!');
        ({ data } = await studentAPI.flashcards(input));
      } else if (tab === 'quiz') {
        if (!input) return toast.error('Enter a topic!');
        ({ data } = await studentAPI.quiz(input));
      } else if (tab === 'link') {
        if (!input) return toast.error('Enter a URL!');
        ({ data } = await studentAPI.link(input));
      }
      setResult(data);
      toast.success('Done! 🎓');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const placeholders = {
    youtube: 'https://youtube.com/watch?v=...',
    feynman: 'e.g. Quantum Entanglement',
    flashcards: 'e.g. Python Programming',
    quiz: 'e.g. World War II',
    link: 'https://article-url.com',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader icon="📚" title="Student Tools" subtitle="PDF study, YouTube notes, flashcards, quiz & more" />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface2 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setInput(''); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.id ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="luna-card p-5 mb-4">
        {tab === 'pdf' ? (
          <div onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 text-center cursor-pointer transition-colors">
            <Upload size={32} className="mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400 text-sm">Click to upload PDF (max 10MB)</p>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={() => toast.success('PDF ready!')} />
          </div>
        ) : (
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            placeholder={placeholders[tab] || 'Enter topic...'}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary outline-none text-sm" />
        )}
        <button onClick={handle} disabled={loading}
          className="w-full mt-3 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 disabled:opacity-40 transition-all">
          {loading ? 'Processing...' : `Process with AI 🤖`}
        </button>
      </div>

      {loading && <LoadingSpinner text="Luna AI is studying for you... 📖" />}

      {/* Results */}
      {result && !loading && (
        <div className="luna-card p-5">
          {tab === 'pdf' && (
            <div className="space-y-4">
              <div><h3 className="text-sm font-semibold text-accent mb-2">📋 Summary</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.summary}</ReactMarkdown></div>
              <div><h3 className="text-sm font-semibold text-accent mb-2">🔑 Key Points</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.keyPoints}</ReactMarkdown></div>
              <div><h3 className="text-sm font-semibold text-accent mb-2">❓ Study Questions</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.questions}</ReactMarkdown></div>
              {result.flashcards?.length > 0 && (
                <div><h3 className="text-sm font-semibold text-accent mb-2">🃏 Flashcards (click to flip)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {result.flashcards.map((c, i) => <FlashCard key={i} card={c} index={i} />)}
                  </div></div>
              )}
            </div>
          )}
          {tab === 'youtube' && (
            <div className="space-y-4">
              <div><h3 className="text-sm font-semibold text-accent mb-2">📺 Video Summary</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.summary}</ReactMarkdown></div>
              <div><h3 className="text-sm font-semibold text-accent mb-2">📝 Study Notes</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.notes}</ReactMarkdown></div>
              <div><h3 className="text-sm font-semibold text-accent mb-2">❓ Questions</h3>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.questions}</ReactMarkdown></div>
            </div>
          )}
          {tab === 'feynman' && (
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.explanation}</ReactMarkdown>
          )}
          {tab === 'flashcards' && result.cards?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-3">Click cards to reveal answers 👆</p>
              <div className="grid grid-cols-2 gap-3">
                {result.cards.map((c, i) => <FlashCard key={i} card={c} index={i} />)}
              </div>
            </div>
          )}
          {tab === 'quiz' && result.questions?.length > 0 && (
            <QuizComponent questions={result.questions} />
          )}
          {tab === 'link' && (
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-slate-300">{result.summary}</ReactMarkdown>
          )}
        </div>
      )}
      <p className="text-center text-slate-600 text-xs mt-6 pb-6">Luna AI Web Preview | github.com/R22-b</p>
    </div>
  );
}
