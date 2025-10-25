'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApi, postApi, mediaUrl } from '@/lib/api';
import { Volume2, VolumeX } from 'lucide-react';

/** Types */
type Question = {
  themeId: string;
  code: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  title: string;
  scenario: string;
  options: { A: string; B: string };
  scores: { A: string; B: string };
};
type PairTitles = {
  EI?: { title: string };
  SN?: { title: string };
  TF?: { title: string };
  JP?: { title: string };
};
type QuestionsResponse = {
  success: true;
  data: {
    themeId: string;
    themeTitle?: string;
    pairTitles: PairTitles | null;
    questions: Question[];
  };
};
type CreateResultPayload = {
  name: string;
  answers: { code: string; option: number }[];
  isPublic?: boolean;
  sessionId?: string;
  meta?: Record<string, any>;
};
type CreateResultOk = {
  success: true;
  data: {
    _id: string;
    name: string;
    themeId: string;
    personalityType?: string;
    summary?: string;
  };
};
type ThemeDoc = {
  _id: string;
  title: string;
  background?: {
    fileId?: string;
    mobileFileId?: string;
    overlayOpacity?: number; // 0..1
  };
  music?: {
    fileId?: string;
    volume?: number; // 0..1
    loop?: boolean;
    autoplay?: boolean;
  };
};

/** Utilities */
const DIM_ORDER: Array<Question['dimension']> = ['EI', 'SN', 'TF', 'JP'];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

export default function ThemeAssessment({
  themeId,
  userName,
  onComplete,
}: {
  themeId: string;
  userName: string;
  onComplete?: (resultId: string, fallbackType?: string) => void;
}) {
  // UI state
  const [themeTitle, setThemeTitle] = useState<string>('Your Story');
  const [pairTitles, setPairTitles] = useState<PairTitles>({});
  const [groups, setGroups] = useState<Record<string, Question[]>>({});

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gIdx, setGIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [tally, setTally] = useState<Record<string, number>>({
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  });
  const [done, setDone] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // Theme assets
  const [themeDoc, setThemeDoc] = useState<ThemeDoc | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const bgId = isMobile
    ? (themeDoc?.background?.mobileFileId || themeDoc?.background?.fileId)
    : themeDoc?.background?.fileId;
  const bg = mediaUrl(bgId);
  const overlay = Math.min(1, Math.max(0, themeDoc?.background?.overlayOpacity ?? 0.35));

  // Audio refs & flags
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  /** Fetch questions */
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getApi<QuestionsResponse>(`/themes/${themeId}/questions`);
        if (!live) return;

        const qs = res.data.questions || [];
        const grouped: Record<string, Question[]> = { EI: [], SN: [], TF: [], JP: [] };
        qs.forEach((q) => grouped[q.dimension]?.push(q));
        DIM_ORDER.forEach((dim) => grouped[dim]?.sort((a, b) => a.code.localeCompare(b.code)));

        setGroups(grouped);
        setTotal(qs.length);

        setThemeTitle(res.data.themeTitle || 'Your Story');
        setPairTitles(res.data.pairTitles || {}); // no fallbacks
      } catch (e: any) {
        if (!live) return;
        setError(e?.message || 'Failed to load questions');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [themeId]);

  /** Fetch theme document (bg + music) */
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getApi<{ success: boolean; data: ThemeDoc }>(`/themes/${themeId}`);
        if (!live) return;
        setThemeDoc(res.data);
      } catch {
        // non-blocking
      }
    })();
    return () => {
      live = false;
    };
  }, [themeId]);

  /** Unified "try to start audio" helper (sets volume=max and plays) */
  const tryStartAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !themeDoc?.music?.fileId) return false;

    const vol =
      typeof themeDoc.music.volume === 'number'
        ? Math.min(1, Math.max(0, themeDoc.music.volume))
        : 1;
    audio.volume = vol;
    audio.loop = themeDoc.music.loop ?? true;
    audio.muted = false;

    try {
      await audio.play();
      setAudioBlocked(false);
      setAudioEnabled(true);
      return true;
    } catch {
      setAudioBlocked(true);
      setAudioEnabled(false);
      return false;
    }
  }, [themeDoc?.music?.fileId, themeDoc?.music?.loop, themeDoc?.music?.volume]);

  /** Autoplay attempts */
  useEffect(() => {
    if (!themeDoc?.music?.fileId) return;
    const wantAuto = themeDoc.music.autoplay ?? true;

    if (wantAuto) void tryStartAudio();

    const onVis = () => {
      if (document.visibilityState === 'visible' && !audioEnabled) void tryStartAudio();
    };

    let cleaned = false;
    const onGesture = () => {
      if (cleaned) return;
      cleaned = true;
      void tryStartAudio();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    window.addEventListener('touchstart', onGesture, { once: true });

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
  }, [themeDoc?.music?.fileId, themeDoc?.music?.autoplay, audioEnabled, tryStartAudio]);

  // Derived values
  const currentDim = DIM_ORDER[gIdx];
  const currentQuestion: Question | undefined = groups[currentDim]?.[qIdx];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const currentChapterTitle = pairTitles?.[DIM_ORDER[gIdx]]?.title || ''; // no fallback
  const stepLabel = total > 0 ? `${Math.min(answeredCount + (done ? 0 : 1), total)} / ${total}` : 'No questions';

  // Handlers
  const undo = () => {
    if (answeredCount === 0 || !currentQuestion) return;

    let ng = gIdx;
    let nq = qIdx - 1;
    if (nq < 0) {
      if (ng === 0) return;
      ng = ng - 1;
      nq = (groups[DIM_ORDER[ng]]?.length || 1) - 1;
    }
    const prevQ = groups[DIM_ORDER[ng]]?.[nq];
    if (prevQ) {
      const prevChoice = answers[prevQ.code];
      if (prevChoice) {
        const letter = prevQ.scores[prevChoice];
        setTally((t) => ({ ...t, [letter]: Math.max(0, (t[letter] || 1) - 1) }));
        setAnswers((a) => {
          const { [prevQ.code]: _, ...rest } = a;
          return rest;
        });
      }
    }
    setGIdx(ng);
    setQIdx(nq);
    setDone(false);
  };

  const submitToServer = useCallback(
    async (finalChoice: 'A' | 'B', finalQ: Question, nextTally: Record<string, number>) => {
      setSubmitting(true);
      setServerErr(null);
      try {
        const arr = Object.entries(answers).map(([code, ch]) => ({
          code,
          option: ch === 'A' ? 0 : 1,
        }));
        arr.push({ code: finalQ.code, option: finalChoice === 'A' ? 0 : 1 });

        const payload: CreateResultPayload = {
          name: userName || 'Anonymous',
          answers: arr,
          isPublic: false,
          meta: { localTally: nextTally },
        };

        const response = await postApi<CreateResultOk>(`/results/${themeId}/theme`, payload);
        const rid = response.data._id;
        const fallbackType = response.data.personalityType || response.data.summary || '';
        onComplete?.(rid, fallbackType);
      } catch (e: any) {
        setServerErr(e?.message || 'Failed to submit result');
        const pick = (x: string, y: string) => (nextTally[x] ?? 0) >= (nextTally[y] ?? 0) ? x : y;
        const fallbackType = `${pick('E', 'I')}${pick('S', 'N')}${pick('T', 'F')}${pick('J', 'P')}`;
        onComplete?.('', fallbackType);
      } finally {
        setSubmitting(false);
      }
    },
    [answers, onComplete, themeId, userName]
  );

  const recordAnswer = useCallback(
    (q: Question, choice: 'A' | 'B') => {
      setAnswers((prev) => ({ ...prev, [q.code]: choice }));
      const letter = q.scores[choice];
      setTally((prev) => ({ ...prev, [letter]: (prev[letter] || 0) + 1 }));

      const lastInGroup = qIdx >= (groups[currentDim]?.length ?? 0) - 1;
      if (!lastInGroup) {
        setQIdx(qIdx + 1);
        return;
      }
      const lastGroup = gIdx >= DIM_ORDER.length - 1;
      if (!lastGroup) {
        setGIdx(gIdx + 1);
        setQIdx(0);
        return;
      }

      const nextTally = { ...tally };
      nextTally[letter] = (nextTally[letter] || 0) + 1;

      setDone(true);
      void submitToServer(choice, q, nextTally);
    },
    [qIdx, gIdx, currentDim, groups, tally, submitToServer]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentQuestion || done) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a') recordAnswer(currentQuestion, 'A');
      if (k === 'b') recordAnswer(currentQuestion, 'B');
      if (e.key === 'Backspace') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentQuestion, done, recordAnswer]);

  /** Render */
  return (
    <div
      className="relative min-h-screen text-white bg-slate-950 bg-cover bg-center"
      style={bg ? { backgroundImage: `url("${bg}")` } : undefined}
    >
      {/* dark overlay to keep text readable */}
      {bg && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `rgba(2,6,23,${overlay})` }}
        />
      )}

      {/* Hidden audio element + enable prompt if autoplay blocked */}
      {themeDoc?.music?.fileId && (
        <>
          <audio
            key={themeDoc.music.fileId}
            ref={audioRef}
            src={mediaUrl(themeDoc.music.fileId)}
            loop={themeDoc.music.loop ?? true}
            autoPlay={themeDoc.music.autoplay ?? true}
            preload="auto"
            playsInline
            className="hidden"
          />
          {audioBlocked && !audioEnabled && (
            <button
              onClick={tryStartAudio}
              className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15 transition"
              title="Enable sound"
            >
              <VolumeX className="w-4 h-4" />
              Enable sound
            </button>
          )}

          {/* Optional mute toggle when enabled */}
          {audioEnabled && (
            <button
              onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.muted = !audioRef.current.muted;
              }}
              className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm backdrop-blur hover:bg-white/15 transition"
              title="Toggle mute"
            >
              {audioRef.current?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {audioRef.current?.muted ? 'Muted' : 'Sound on'}
            </button>
          )}
        </>
      )}

      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Progress */}
        <div className="sticky top-0 z-30">
          <div className="h-1 w-full bg-slate-800/70">
            <motion.div
              className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 25 }}
            />
          </div>
          {submitting && (
            <div className="text-center text-xs py-1 bg-slate-900/80 text-slate-300">
              Saving your result…
              {serverErr ? <span className="text-rose-300"> • {serverErr}</span> : null}
            </div>
          )}
        </div>

        <header className="px-4 py-6 md:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-300 mb-1">{themeTitle}</div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                {done ? 'Submitting…' : (currentChapterTitle || themeTitle)}
              </h2>
            </div>
            <div className="text-slate-300 text-sm">{stepLabel}</div>
          </div>
        </header>

        <main className="px-4 md:px-8 pb-24 flex-1">
          <div className="max-w-5xl mx-auto">
            {loading && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 animate-pulse h-72" />
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-200">
                {error}
              </div>
            )}

            {/* Empty state when there are no questions */}
            {!loading && !error && total === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                <h3 className="text-xl font-semibold mb-2">No questions</h3>
                <p className="text-slate-300">This theme doesn’t have any questions yet.</p>
              </div>
            )}

            {/* Questions */}
            {!loading && !error && total > 0 && !done && currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.section
                  key={currentQuestion.code}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5"
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-2xl" />
                  <div className="p-6 md:p-10">
                    <div className="flex items-center gap-3 text-slate-300 text-sm mb-2">
                      <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                        {currentQuestion.dimension}
                      </span>
                      <span>
                        Question {qIdx + 1} of {groups[currentDim]?.length ?? 1}
                      </span>
                      <span className="hidden md:inline text-slate-500">•</span>
                      <span className="hidden md:inline text-slate-300">{currentQuestion.code}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{currentQuestion.title}</h3>
                    <p className="text-slate-200 text-lg leading-relaxed mb-8">
                      {currentQuestion.scenario}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {(['A', 'B'] as const).map((opt) => (
                        <AnswerCard
                          key={opt}
                          label={opt}
                          text={currentQuestion.options[opt]}
                          onClick={() => recordAnswer(currentQuestion, opt)}
                        />
                      ))}
                    </div>

                    <div className="mt-6 text-slate-300 text-sm">
                      Tip:{' '}
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">A</kbd>{' '}
                      or{' '}
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">B</kbd>.
                      <button
                        onClick={undo}
                        className="ml-4 underline decoration-dotted underline-offset-4 hover:text-slate-100"
                      >
                        Undo last
                      </button>
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function AnswerCard({
  label,
  text,
  onClick,
}: {
  label: 'A' | 'B';
  text: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group text-left rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="w-7 h-7 grid place-items-center rounded-md bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10 text-sm font-semibold">
          {label}
        </span>
        <span className="text-slate-200 group-hover:text-white transition-colors">{text}</span>
      </div>
      <div className="h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded" />
    </motion.button>
  );
}
