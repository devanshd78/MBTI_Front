// components/GateSelection.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Eye, Compass, Sparkles, Brain, Stars, Rocket,
  ArrowRight, ChevronDown, Zap, Heart, TrendingUp, VolumeX, Volume2
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getApi, mediaUrl } from '@/lib/api';
import ThemeGate from './ThemeGate';
import { useRouteLoader } from '@/components/RouterLoader';

type ThemeDTO = {
  _id: string; title: string; slug: string; description: string;
  gradient: string; iconKey: string; features: string[]; order: number; isActive: boolean;
};
type ThemeDetail = {
  _id: string;
  title: string;
  background?: { fileId?: string; mobileFileId?: string; overlayOpacity?: number };
  music?: { fileId?: string; volume?: number; loop?: boolean; autoplay?: boolean };
};
type GateUI = {
  id: string; title: string; icon: React.ComponentType<{ className?: string }>;
  gradient: string; primaryColor: string; accentColor: string; glowColor: string; slug: string;
};

const ICONS = { Compass, Eye, Lock, Sparkles, Brain, Stars, Rocket, ArrowRight, ChevronDown, Zap, Heart, TrendingUp };
const TW_HEX: Record<string, { primary: string; accent: string; glow: string }> = {
  blue: { primary: '#3b82f6', accent: '#1d4ed8', glow: '#60a5fa' },
  cyan: { primary: '#06b6d4', accent: '#0891b2', glow: '#22d3ee' },
  teal: { primary: '#14b8a6', accent: '#0d9488', glow: '#2dd4bf' },
  emerald: { primary: '#10b981', accent: '#059669', glow: '#34d399' },
  indigo: { primary: '#6366f1', accent: '#4f46e5', glow: '#818cf8' },
  violet: { primary: '#8b5cf6', accent: '#7c3aed', glow: '#a78bfa' },
  fuchsia: { primary: '#d946ef', accent: '#c026d3', glow: '#e879f9' },
  pink: { primary: '#ec4899', accent: '#db2777', glow: '#f472b6' },
  slate: { primary: '#64748b', accent: '#475569', glow: '#94a3b8' },
};
const parseGradient = (g: string): keyof typeof TW_HEX => {
  const m = g.match(/(?:from|via|to)-([a-z]+)-\d{2,3}/i);
  const name = (m?.[1] || 'slate').toLowerCase();
  return (TW_HEX as any)[name] ? (name as keyof typeof TW_HEX) : 'slate';
};
const themeToGate = (t: ThemeDTO): GateUI => {
  const Icon = (ICONS as any)[t.iconKey] ?? Compass;
  const key = parseGradient(t.gradient);
  const { primary, accent, glow } = TW_HEX[key];
  return {
    id: t._id,
    title: t.title,
    icon: Icon,
    gradient: t.gradient || 'from-blue-500 to-cyan-500',
    primaryColor: primary,
    accentColor: accent,
    glowColor: glow,
    slug: t.slug,
  };
};

/** 🔊 Global audio unlocker (runs once per page load) */
function useAudioUnlocker() {
  const [unlocked, setUnlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(async () => {
    if (unlocked) return true;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        if (!ctxRef.current) ctxRef.current = new Ctx();
        const ctx = ctxRef.current!;
        if (ctx.state === 'suspended') await ctx.resume();

        // 1-frame silent buffer to unlock iOS/Safari/Chrome
        const buffer = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);

        setUnlocked(true);
        return true;
      } else {
        const a = document.createElement('audio');
        a.muted = true;
        try { await a.play(); } catch {}
        setUnlocked(true);
        return true;
      }
    } catch {
      return false;
    }
  }, [unlocked]);

  useEffect(() => {
    if (unlocked) return;
    const handler = async () => {
      const ok = await unlock();
      if (ok) {
        document.removeEventListener('pointerdown', handler, true);
        document.removeEventListener('keydown', handler, true);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', handler, true);
    };
  }, [unlock, unlocked]);

  return unlocked;
}

export default function GateSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const routeLoader = useRouteLoader();

  const userName = sp.get('name') || '';

  const [themes, setThemes] = useState<ThemeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioUnlocked = useAudioUnlocker();
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  /** ✅ Direct navigation helper (no gate “opened” dependency) */
  const openAssess = useCallback((gateId: string) => {
    routeLoader.start();
    const nameQ = userName ? `?name=${encodeURIComponent(userName)}` : '';
    router.push(`/assess/${gateId}${nameQ}`);
  }, [router, routeLoader, userName]);

  const becomeActiveAudio = useCallback((el: HTMLAudioElement | null) => {
    if (activeAudioRef.current && activeAudioRef.current !== el) {
      try { activeAudioRef.current.pause(); activeAudioRef.current.currentTime = 0; } catch {}
    }
    activeAudioRef.current = el;
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getApi<{ success: true; data: ThemeDTO[]; meta?: any }>(
          '/themes',
          { isActive: true, sort: 'order:asc,createdAt:asc', limit: 12 }
        );
        if (!live) return;
        setThemes(res.data || []);
      } catch (e: any) {
        if (!live) return;
        setError(e?.message || 'Failed to load themes');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const gates = useMemo<GateUI[]>(() => themes.map(themeToGate), [themes]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-slate-900/80" />

      {!audioUnlocked && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-50 text-xs text-white/80 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur">
          Click anywhere once to enable sound
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome, <span className="text-blue-400">{userName || 'Explorer'}</span>
          </h2>
          <p className="text-blue-200/80 text-lg">Choose your path into the depths of self-discovery</p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[560px] rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-blue-200/80">
            <p className="mb-2">Couldn’t load themes.</p>
            <p className="text-sm text-blue-300/60">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {gates.map((gate, index) => (
              <GateCard
                key={gate.id}
                gate={gate}
                index={index}
                onOpen={() => openAssess(gate.id)}
                becomeActiveAudio={becomeActiveAudio}
                audioUnlocked={audioUnlocked}
              />
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="text-center mt-14 text-blue-300/60 text-sm">
          Each gate leads to the same destination — your true self
        </motion.div>
      </div>
    </div>
  );
}

function GateCard({
  gate, index, onOpen, becomeActiveAudio, audioUnlocked,
}: {
  gate: GateUI; index: number; onOpen: () => void;
  becomeActiveAudio: (el: HTMLAudioElement | null) => void;
  audioUnlocked: boolean;
}) {
  const Icon = gate.icon;

  const [hovered, setHovered] = useState(false);
  const [detail, setDetail] = useState<ThemeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const ensureDetail = useCallback(async () => {
    if (detail || loadingDetail) return;
    try {
      setLoadingDetail(true);
      const res = await getApi<{ success: boolean; data: ThemeDetail }>(`/themes/${gate.id}`);
      setDetail(res.data);
    } finally {
      setLoadingDetail(false);
    }
  }, [detail, loadingDetail, gate.id]);

  const bgId = detail?.background?.fileId;
  const bgUrl = bgId ? mediaUrl(bgId) : undefined;
  const overlay = Math.min(1, Math.max(0, detail?.background?.overlayOpacity ?? 0.35));

  const tryPlay = useCallback(async () => {
    const a = audioRef.current;
    const fileId = detail?.music?.fileId;
    if (!a || !fileId || !audioUnlocked) {
      if (!audioUnlocked) setPlayBlocked(true);
      return;
    }
    a.src = mediaUrl(fileId) || '';
    a.loop = detail?.music?.loop ?? true;
    a.volume =
      typeof detail?.music?.volume === 'number'
        ? Math.min(1, Math.max(0, detail!.music!.volume!))
        : 1;

    try {
      await a.play();
      becomeActiveAudio(a);
      setPlayBlocked(false);
      setPlaying(true);
    } catch {
      setPlayBlocked(true);
      setPlaying(false);
    }
  }, [detail?.music?.fileId, detail?.music?.loop, detail?.music?.volume, audioUnlocked, becomeActiveAudio]);

  const stopPlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch {}
    if (playing) setPlaying(false);
    if (playBlocked) setPlayBlocked(false);
    becomeActiveAudio(null);
  }, [playing, playBlocked, becomeActiveAudio]);

  const onEnter = async () => {
    setHovered(true);
    await ensureDetail();
    setTimeout(() => { void tryPlay(); }, 0);
  };
  const onLeave = () => {
    setHovered(false);
    stopPlay();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 + 0.25, duration: 0.7 }}
      className="group text-left"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => {              /* ✅ clicking anywhere on card routes */
        onLeave();                  // stop preview audio immediately
        onOpen();                   // push to /assess/:id
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLeave();
          onOpen();
        }
      }}
    >
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gate.gradient} rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300`} />
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-white/30 transition-all duration-300">
          <div className="h-[500px] relative">
            {/* Default: 3D gate (kept for idle view) */}
            {!hovered && (
              <ThemeGate
                isOpen={false}
                primaryColor={gate.primaryColor}
                accentColor={gate.accentColor}
                glowColor={gate.glowColor}
              />
            )}

            {/* Hover: background image + overlay + audio */}
            {hovered && (
              <div className="absolute inset-0">
                {bgUrl ? (
                  <>
                    <img
                      src={bgUrl}
                      alt={`${gate.title} background`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0" style={{ background: `rgba(2,6,23,${overlay})` }} />
                  </>
                ) : (
                  <div className="w-full h-full bg-white/5 animate-pulse" />
                )}

                <audio ref={audioRef} preload="auto" playsInline className="hidden" />

                {/* Blocked → small enable button (doesn't bubble to card click) */}
                {(!audioUnlocked || playBlocked) && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setTimeout(() => { void tryPlay(); }, 0);
                    }}
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
                    title="Enable sound"
                  >
                    <VolumeX className="w-4 h-4" /> Enable sound
                  </button>
                )}

                {/* Playing → mute toggle (doesn't bubble) */}
                {playing && audioUnlocked && !playBlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = audioRef.current;
                      if (!a) return;
                      a.muted = !a.muted;
                      setPlaying((p) => p);
                    }}
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
                    title="Toggle mute"
                  >
                    {audioRef.current?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {audioRef.current?.muted ? 'Muted' : 'Sound on'}
                  </button>
                )}
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/60" />
          </div>

          <div className="p-6 pt-4">
            <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gate.gradient}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {gate.title}
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-blue-200/70 text-sm">
                {hovered ? 'Previewing theme…' : 'Hover to preview • Click to open'}
              </p>
              <button
                type="button"
                className="ml-auto text-blue-300/80 hover:text-blue-200 transition text-sm"
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
              >
                Start →
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
