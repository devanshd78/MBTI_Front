// components/ClientLayout.tsx
'use client';

import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import ParticleBackground from '@/components/ParticleBackground';
import MusicPlayer from '@/components/MusicPlayer';
import { useLenis } from '@/hooks/useLenis';

import Loading from '@/components/Loading';
import { RouteLoaderProvider } from './RouterLoader';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useLenis();
  const pathname = usePathname();

  return (
    <RouteLoaderProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <ParticleBackground />

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Suspense fallback={<Loading />}>
              {children}
            </Suspense>
          </motion.main>
        </AnimatePresence>
      </div>
    </RouteLoaderProvider>
  );
}
