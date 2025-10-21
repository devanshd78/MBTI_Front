// components/Loading.tsx
'use client';

import dynamic from 'next/dynamic';
import loadingAnim from './assets/Loading1.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Loading() {
  return (
    <div
      className="min-h-[100vh] grid place-items-center bg-slate-950 relative overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-slate-900/80" />

      <div className="relative z-10 flex flex-col items-center gap-4 p-6">
        <div className="w-48 h-48 md:w-64 md:h-64">
          <Lottie
            animationData={loadingAnim}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <p className="text-blue-200/80 text-sm md:text-base">
          Preparing your gates…
        </p>
      </div>

      {/* Optional subtle glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
    </div>
  );
}
