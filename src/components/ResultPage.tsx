import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Share2, RotateCcw, BookOpen, Sparkles, Send } from 'lucide-react';
import type { MBTIResultPro, MBTIType } from '../types/mbti';
import { postApi } from '@/lib/api'; // ← add this

interface ResultPageProps {
  result: MBTIResultPro;
  userName: string;
  onRetake: () => void;
  rid?: string;              // ← add this
}

export default function ResultPage({ result, userName, onRetake, rid }: ResultPageProps) {
  const [showResult, setShowResult] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);

  // NEW: email share state
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const revealLines = [
    'Analyzing your responses...',
    'Understanding your patterns...',
    'Discovering your essence...',
    `This is you, ${userName}...`,
    'This is your MBTI Personality...',
    `You are...`
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLine < revealLines.length) setCurrentLine(currentLine + 1);
      else setShowResult(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentLine]);

  const handleShare = async () => {
    const text = `I just discovered I'm an ${result.type} — ${result.title}! 🌟`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My MBTI Result', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Result copied to clipboard!');
      }
    } catch {}
  };

  // basic email check
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setSendErr('Please enter a valid email.');
      return;
    }
    setSending(true);
    setSendErr(null);
    setSent(false);
    try {
      if (rid) {
        await postApi(`/results/${rid}/share-email`, { to: email, name: userName });
      } else {
        await postApi(`/mbti/results/${result.type}/share-email`, { to: email, name: userName });
      }
      setSent(true);
    } catch (err: any) {
      setSendErr(err?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  // Tailwind-safe accent palette
  const TYPE_ACCENT: Record<MBTIType, AccentKey> = {
    INTJ: 'violet', INTP: 'violet', ENTJ: 'blue',  ENTP: 'cyan',
    INFJ: 'emerald', INFP: 'emerald', ENFJ: 'cyan', ENFP: 'cyan',
    ISTJ: 'blue',   ISFJ: 'emerald', ESTJ: 'blue', ESFJ: 'emerald',
    ISTP: 'violet', ISFP: 'emerald', ESTP: 'blue', ESFP: 'cyan'
  };

  const accent = useMemo(() => TYPE_ACCENT[result.type], [result.type]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />

      <div className="relative z-10 w-full max-w-5xl px-4 py-20">
        {!showResult ? (
          <div className="text-center space-y-8">
            {revealLines.slice(0, currentLine + 1).map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h2
                  className={`font-bold ${
                    index === revealLines.length - 1
                      ? 'text-5xl md:text-7xl bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'
                      : 'text-2xl md:text-3xl text-blue-200'
                  }`}
                >
                  {line}
                </h2>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            {/* Header / Identity */}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-12">
              <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 2, ease: 'easeInOut' }} className="inline-block mb-6">
                <Sparkles className="w-20 h-20 text-blue-400" />
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">{result.type}</h1>
              <h2 className="text-3xl md:text-4xl font-semibold text-blue-300 mb-6">{result.title}</h2>
              <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">{result.description}</p>
            </motion.div>

            {/* Core Traits / Strengths */}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AccentDot color={accent} /> Core Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.traits.map((trait, index) => (
                    <motion.span key={index} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + index * 0.08 }} className={chipClass(accent)}>
                      {trait}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AccentDot color={accent} /> Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + index * 0.08 }} className="text-blue-100/80 flex items-center gap-2">
                      <Bullet color={accent} />
                      {strength}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* PRO Sections */}
            {hasAnyProFields(result) && (
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {result.growth?.length ? <ProSection title="Growth Edges" bullets={result.growth} accent={accent} delay={0.1} /> : null}
                {result.idealEnvironments?.length ? <ProSection title="Ideal Environments" bullets={result.idealEnvironments} accent={accent} delay={0.15} /> : null}
                {result.communicationStyle?.length ? <ProSection title="Communication Style" bullets={result.communicationStyle} accent={accent} delay={0.2} /> : null}
                {result.collaborationTips?.length ? <ProSection title="Collaboration Tips" bullets={result.collaborationTips} accent={accent} delay={0.25} /> : null}
              </motion.div>
            )}

            {/* Actions */}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="flex flex-wrap justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleShare} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Result
              </motion.button>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onRetake} className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Retake Test
              </motion.button>

              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={`https://www.16personalities.com/${result.type.toLowerCase()}-personality`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Learn More
              </motion.a>
            </motion.div>

            {/* Email share form */}
            <motion.form
              onSubmit={handleEmailSend}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-8 mx-auto max-w-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSendErr(null); setSent(false); }}
                placeholder="Enter your email to receive this result"
                className="flex-1 rounded-lg bg-transparent border border-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send to Email'}
              </button>
              {sendErr && <div className="text-rose-300 text-sm">{sendErr}</div>}
              {sent && !sendErr && <div className="text-emerald-300 text-sm">Sent! Check your inbox.</div>}
            </motion.form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-12 text-center text-blue-300/60 text-sm">
              Remember: You are more than any personality type. This is just one lens to understand yourself.
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ----------------- helpers & small components ----------------- */
type AccentKey = 'blue' | 'cyan' | 'violet' | 'emerald';
const dotClass: Record<AccentKey, string> = {
  blue: 'bg-blue-400', cyan: 'bg-cyan-400', violet: 'bg-violet-400', emerald: 'bg-emerald-400'
};
const chipClassMap: Record<AccentKey, string> = {
  blue: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
  cyan: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-200',
  violet: 'bg-violet-500/20 border-violet-400/30 text-violet-200',
  emerald: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
};
function chipClass(accent: AccentKey) { return `px-4 py-2 border rounded-full text-sm ${chipClassMap[accent]}`; }
function hasAnyProFields(result: MBTIResultPro) {
  return !!result.growth?.length || !!result.idealEnvironments?.length || !!result.communicationStyle?.length || !!result.collaborationTips?.length;
}
function AccentDot({ color }: { color: AccentKey }) { return <div className={`w-2 h-2 rounded-full ${dotClass[color]}`} />; }
function Bullet({ color }: { color: AccentKey }) { return <span className={`mt-1 inline-block w-2 h-2 rounded-full ${dotClass[color]}`} />; }
function ProSection({ title, bullets, accent, delay = 0 }: { title: string; bullets: string[]; accent: AccentKey; delay?: number; }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><AccentDot color={accent} />{title}</h3>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + i * 0.06 }} className="text-blue-100/80 flex items-start gap-2">
            <Bullet color={accent} /><span>{b}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
