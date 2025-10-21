// components/GateSelection.tsx
'use client';

import { motion } from 'framer-motion';
import {
  Lock, Eye, Compass, Sparkles, Brain, Stars, Rocket,
  ArrowRight, ChevronDown, Zap, Heart, TrendingUp
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { getApi } from '../lib/api';
import ThemeGate from './ThemeGate';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useRouteLoader } from '@/components/RouterLoader';

type ThemeDTO = {
  _id: string; title: string; slug: string; description: string;
  gradient: string; iconKey: string; features: string[]; order: number; isActive: boolean;
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

function parseGradient(gradient: string): keyof typeof TW_HEX {
  const m = gradient.match(/(?:from|via|to)-([a-z]+)-\d{2,3}/i);
  const name = (m?.[1] || 'slate').toLowerCase();
  return (TW_HEX as any)[name] ? (name as keyof typeof TW_HEX) : 'slate';
}
function themeToGate(theme: ThemeDTO): GateUI {
  const icon = (ICONS as any)[theme.iconKey] ?? Compass;
  const colorKey = parseGradient(theme.gradient);
  const { primary, accent, glow } = TW_HEX[colorKey];
  return {
    id: theme._id,
    title: theme.title,
    icon,
    gradient: theme.gradient || 'from-blue-500 to-cyan-500',
    primaryColor: primary,
    accentColor: accent,
    glowColor: glow,
    slug: theme.slug
  };
}

export default function GateSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const routeLoader = useRouteLoader();

  const userName = sp.get('name') || '';
  const selectedGateId = sp.get('sel');                 // <-- URL param drives selection

  const [themes, setThemes] = useState<ThemeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const setSelected = (gateId: string) => {
    // write selection to search params (no state)
    const p = new URLSearchParams(sp.toString());
    p.set('sel', gateId);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const handleOpened = (gateId: string) => {
    routeLoader.start();
    const nameQ = userName ? `?name=${encodeURIComponent(userName)}` : '';
    router.push(`/assess/${gateId}${nameQ}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-slate-900/80" />

      <div className="relative z-10 w-full max-w-7xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-14"
        >
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
            {gates.map((gate, index) => {
              const Icon = gate.icon;
              const isSelected = selectedGateId === gate.id;

              return (
                <motion.button
                  key={gate.id}
                  type="button"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 + 0.25, duration: 0.7 }}
                  whileHover={!selectedGateId ? { scale: 1.03, y: -6 } : {}}
                  whileTap={!selectedGateId ? { scale: 0.98 } : {}}
                  onClick={() => !selectedGateId && setSelected(gate.id)}
                  disabled={!!selectedGateId}
                  className="group text-left"
                  aria-label={`Open gate: ${gate.title}`}
                >
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gate.gradient} rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300`} />
                    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-white/30 transition-all duration-300">
                      <div className="h-[500px] relative">
                        <ThemeGate
                          isOpen={isSelected}
                          onOpened={() => handleOpened(gate.id)}
                          primaryColor={gate.primaryColor}
                          accentColor={gate.accentColor}
                          glowColor={gate.glowColor}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/60" />
                      </div>

                      <div className="p-6 pt-4">
                        <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gate.gradient}`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                          {gate.title}
                        </h3>
                        <p className="text-blue-200/70 text-sm">
                          {isSelected ? 'Opening...' : 'Click to open the gate'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-center mt-14 text-blue-300/60 text-sm"
        >
          Each gate leads to the same destination — your true self
        </motion.div>
      </div>
    </div>
  );
}
