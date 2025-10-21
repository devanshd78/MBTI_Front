"use client"

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Eye, Lock, Brain, Stars, Rocket, ArrowRight, ChevronDown, Zap, Heart, TrendingUp } from 'lucide-react';
import { getApi } from '../lib/api';

import dynamic from 'next/dynamic';
import welcomeAnim from './assets/Welcome.json';
import { useRouteLoader } from '@/components/RouterLoader';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface WelcomePageProps {
  onNameSubmit: (name: string) => void;
  scrollTargetId?: string;
}

type ThemeDTO = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradient: string;
  iconKey: string;
  features: string[];
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function WelcomePage({ onNameSubmit, scrollTargetId }: WelcomePageProps) {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [themes, setThemes] = useState<ThemeDTO[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [themesError, setThemesError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, mass: 0.3 });

  const { scrollY } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const routeLoader = useRouteLoader();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setThemesLoading(true);
        // Backend returns: { success: true, data: Theme[], meta: { pagination... } }
        const res = await getApi<{ success: boolean; data: ThemeDTO[]; meta?: any }>(
          '/themes',
          { isActive: true, sort: 'order:asc,createdAt:asc', limit: 12 }
        );
        if (!alive) return;
        setThemes(res?.data ?? []);
      } catch (e: any) {
        if (!alive) return;
        setThemesError(e?.message || 'Failed to load themes');
      } finally {
        if (alive) setThemesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onNameSubmit(trimmed);

    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={mainRef} className="relative min-h-screen overflow-x-hidden bg-slate-950">
      <motion.div
        style={{ scaleX }}
        className="fixed left-0 top-0 right-0 h-1 origin-left z-[100] bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
      />

      <AnimatedBackground />

      <motion.div
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20"
      >
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-8"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
                className="inline-block"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-xl opacity-60 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.95] tracking-tight"
                >
                  Discover Who
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="relative z-10 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                      You Truly Are
                    </span>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-cyan-500/30 to-violet-500/30 blur-sm"
                    />
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-xl lg:text-2xl text-slate-300 leading-relaxed max-w-xl"
                >
                  Step through the Anywhere Door—your choices reveal your story.
                  <span className="text-cyan-400 font-semibold"> A cinematic personality experience.</span>
                </motion.p>
              </div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                onSubmit={handleSubmit}
                className="space-y-6 max-w-xl"
              >
                <div className="relative group">
                  <motion.div
                    animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your name to begin..."
                      className="w-full px-8 py-5 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-2xl text-white text-lg placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all duration-300"
                      autoFocus
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl -z-10"
                      animate={{
                        opacity: isFocused ? 0.8 : 0.3,
                        scale: isFocused ? 1.1 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white text-lg font-bold rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Begin Your Journey
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600"
                      initial={{ x: '100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  {scrollTargetId && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(scrollTargetId);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="group flex items-center gap-2 px-6 py-4 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span className="text-lg">Explore themes</span>
                      <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex items-center gap-6 pt-4"
              >
                {[
                  { icon: Zap, text: '48 Questions' },
                  { icon: Brain, text: '16 Types' },
                  { icon: TrendingUp, text: '7 Minutes' }
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                    className="flex items-center gap-2 text-slate-400"
                  >
                    <item.icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <FloatingCard>
                <Lottie
                  animationData={welcomeAnim}
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </FloatingCard>
              <GlowOrbs />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <ThemeShowcaseSection themes={themes} loading={themesLoading} error={themesError} />
      <HowItWorksSection />
      <DimensionsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onStart={() => {
        if (name.trim()) {
          onNameSubmit(name.trim());
          routeLoader.start();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}

function AnimatedBackground() {
  const STAR_COUNT = 20;

  // Same on server & client → no hydration mismatch
  const stars = React.useMemo(() => {
    const rand = mulberry32(123456); // any constant seed
    return Array.from({ length: STAR_COUNT }, () => ({
      left: `${(rand() * 100).toFixed(3)}%`,
      top: `${(rand() * 100).toFixed(3)}%`,
      duration: 3 + rand() * 2,
      delay: rand() * 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />

      <div className="absolute inset-0 opacity-30">
        {stars.map((s, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-px h-px bg-cyan-400 rounded-full"
            style={{ left: s.left, top: s.top }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.15),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.15),_transparent_50%)]" />
    </div>
  );
}


function FloatingCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        {children}
      </div>
    </motion.div>
  );
}

function GlowOrbs() {
  return (
    <>
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </>
  );
}

function ThemeShowcaseSection({
  themes,
  loading,
  error
}: {
  themes: ThemeDTO[];
  loading: boolean;
  error: string | null;
}) {
  // case-insensitive icon map
  const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    sparkles: Sparkles,
    compass: Compass,
    eye: Eye,
    lock: Lock,
    brain: Brain,
    stars: Stars,
    rocket: Rocket,
    zap: Zap,
    heart: Heart,
    trendingup: TrendingUp,
    arrowright: ArrowRight,
    chevrondown: ChevronDown,
  };

  const norm = (s?: string) => (s || '').trim().replace(/[^a-z]/gi, '').toLowerCase();
  const getIcon = (key?: string) => ICONS_MAP[norm(key)] || Sparkles;

  const gradientStyle = (g?: string) =>
    (g && g.includes('gradient(')) ? { backgroundImage: g } : undefined;

  const splitFeatures = (arr: string[] = []) =>
    arr
      .flatMap((line) =>
        // split on comma, middot, pipes or newlines, but keep short tokens like "S/N" intact
        String(line).split(/[\n\r]+|(?:\s*[•|,]\s*)/g)
      )
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <section id="themes" className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"> Experience</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Three unique themes, one powerful assessment. Select the vibe that resonates with your soul.
          </p>
        </motion.div>

        {loading && (
          <div className="grid lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-slate-400">
            <p className="mb-4">Couldn’t load themes.</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && themes.length === 0 && (
          <div className="text-center text-slate-400">
            <p>No themes yet.</p>
          </div>
        )}

        {!loading && !error && themes.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {themes.map((theme, i) => {
              const Icon = getIcon(theme.iconKey);
              const features = splitFeatures(theme.features);

              return (
                <motion.div
                  key={theme._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group relative"
                >
                  {/* Glow using raw CSS gradient string */}
                  <div
                    className="absolute inset-0 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500"
                    style={gradientStyle(theme.gradient)}
                  />

                  <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500">
                    {/* Icon tile with gradient */}
                    <div
                      className="w-20 h-20 mb-6 rounded-2xl flex items-center justify-center shadow-2xl"
                      style={gradientStyle(theme.gradient)}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                      {theme.title}
                    </h3>

                    <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                      {theme.description}
                    </p>

                    {!!features.length && (
                      <ul className="space-y-3">
                        {features.map((feature, idx) => (
                          <li key={`${feature}-${idx}`} className="flex items-center gap-3 text-slate-400">
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                              style={gradientStyle(theme.gradient)}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <p className="text-sm text-slate-500">
                        Available after you begin your journey
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}



function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Enter Your Name',
      description: 'Start your personalized journey. Every experience is unique to you.',
      icon: Stars,
      color: 'cyan'
    },
    {
      number: '02',
      title: 'Choose & Respond',
      description: 'Navigate through 48 carefully crafted scenarios. Your instincts guide you.',
      icon: Brain,
      color: 'blue'
    },
    {
      number: '03',
      title: 'Discover Your Type',
      description: 'Receive your MBTI type with detailed insights, strengths, and growth paths.',
      icon: Rocket,
      color: 'red'
    },
  ];

  return (
    <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A seamless journey from curiosity to clarity in three simple steps
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hidden lg:block" />

          <div className="grid lg:grid-cols-3 gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.8 }}
                  className="relative"
                >
                  <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`text-6xl font-black bg-gradient-to-br from-${step.color}-500 to-${step.color}-700 bg-clip-text text-transparent`}>
                        {step.number}
                      </div>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 flex items-center justify-center shadow-lg shadow-${step.color}-500/50`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">
                      {step.title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DimensionsSection() {
  const dimensions = [
    {
      left: 'Extraversion',
      right: 'Introversion',
      code: 'E / I',
      description: 'Where you direct your energy: outward interaction or inward reflection',
      percentage: 65
    },
    {
      left: 'Sensing',
      right: 'Intuition',
      code: 'S / N',
      description: 'How you process information: concrete facts or abstract patterns',
      percentage: 45
    },
    {
      left: 'Thinking',
      right: 'Feeling',
      code: 'T / F',
      description: 'How you make decisions: logical analysis or values and empathy',
      percentage: 70
    },
    {
      left: 'Judging',
      right: 'Perceiving',
      code: 'J / P',
      description: 'How you approach life: structured planning or flexible spontaneity',
      percentage: 55
    },
  ];

  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            The Four
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"> Dimensions</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Your personality mapped across four fundamental spectrums. Each choice shifts your position.
          </p>
        </motion.div>

        <div className="space-y-8">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.code}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                      <span className="text-white font-bold">{dim.code}</span>
                    </div>
                    <div className="text-slate-400 text-sm hidden sm:block">{dim.description}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-lg font-semibold text-white mb-4">
                  <span className="text-cyan-400">{dim.left}</span>
                  <span className="text-violet-400">{dim.right}</span>
                </div>

                <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${dim.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                  <motion.div
                    initial={{ left: 0 }}
                    whileInView={{ left: `${dim.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg shadow-cyan-500/50 border-2 border-cyan-400"
                  />
                </div>

                <p className="text-slate-500 text-sm mt-4 sm:hidden">{dim.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      type: 'INFJ',
      text: 'The cinematic experience made self-discovery feel like an adventure. The insights were spot-on.',
      avatar: '🌟'
    },
    {
      name: 'Marcus Rodriguez',
      type: 'ENTP',
      text: 'Finally, a personality test that doesn\'t feel like homework. Loved the immersive scenarios.',
      avatar: '🚀'
    },
    {
      name: 'Emma Thompson',
      type: 'ISFP',
      text: 'Beautiful design and surprisingly accurate results. The theme options were a nice touch.',
      avatar: '✨'
    },
  ];

  return (
    <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            What People Discover
          </h2>
          <p className="text-xl text-slate-400">
            Real experiences from those who've taken the journey
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="group"
            >
              <div className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-3xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{testimonial.name}</div>
                    <div className="text-cyan-400 text-sm font-semibold">{testimonial.type}</div>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is this an official MBTI test?',
      a: 'This assessment follows the classic 4-dimension MBTI model and provides indicative results for self-discovery and reflection. It\'s designed as an engaging, educational experience.'
    },
    {
      q: 'How accurate are the results?',
      a: 'The assessment uses proven psychological frameworks and scenario-based questions. Results provide valuable insights into your preferences and tendencies, best used as a starting point for self-reflection.'
    },
    {
      q: 'How long does it take?',
      a: 'Most people complete the assessment in 5-7 minutes. Take your time with each question—there are no wrong answers, only honest ones.'
    },
    {
      q: 'Will my data be saved?',
      a: 'Your responses remain session-based by default. We respect your privacy and don\'t store personal data without explicit consent.'
    },
    {
      q: 'Can I retake the test?',
      a: 'Absolutely! You can explore different themes or retake the assessment anytime. Your personality may show different facets in different contexts.'
    }
  ];

  return (
    <section className="relative py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            Common Questions
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need to know before you begin
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <span className="text-white text-lg font-semibold pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-3xl blur-3xl opacity-30" />

          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-16">
            <div className="mb-8">
              <Heart className="w-20 h-20 mx-auto text-cyan-400 mb-6" />
            </div>

            <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
              Ready to step through
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                the door?
              </span>
            </h2>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Your journey of self-discovery awaits. Enter your name above and begin the experience.
            </p>

            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white text-xl font-bold rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/50"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Start Your Journey
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-20 text-center text-slate-500 text-sm"
      >
        <p>© 2025 Personality Journey. Designed for self-discovery.</p>
      </motion.div>
    </section>
  );
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
