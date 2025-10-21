// components/RouteLoader.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Loading from './Loading';

type RouteLoaderCtx = {
  start: (minMs?: number) => void;
  stop: () => void;
  isActive: boolean;
};

const Ctx = createContext<RouteLoaderCtx | null>(null);

export function useRouteLoader() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRouteLoader must be used within <RouteLoaderProvider>');
  return ctx;
}

export function RouteLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setActive] = useState(false);
  const pathname = usePathname();

  const minUntil = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  const start = (minMs = 450) => {
    const now = Date.now();
    minUntil.current = Math.max(minUntil.current, now + minMs);
    setActive(true);
  };

  const stop = () => {
    const now = Date.now();
    const left = Math.max(0, minUntil.current - now);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      setActive(false);
      minUntil.current = 0;
    }, left);
  };

  // Auto-start on pathname change
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      start(450);
      // Soft auto-stop: if Suspense fallback resolves quickly, let overlay linger a touch to avoid flash
      const auto = setTimeout(stop, 900);
      return () => clearTimeout(auto);
    }
  }, [pathname]);

  // Safety: never get stuck
  useEffect(() => {
    if (!isActive) return;
    const safety = setTimeout(() => setActive(false), 10000);
    return () => clearTimeout(safety);
  }, [isActive]);

  const value = useMemo(() => ({ start, stop, isActive }), [isActive]);

  return (
    <Ctx.Provider value={value}>
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="route-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200]"
            aria-hidden={!isActive}
          >
            <Loading />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </Ctx.Provider>
  );
}
