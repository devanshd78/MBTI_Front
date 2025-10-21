import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

/** Smooth scrolling everywhere */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1, // seconds to ease
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
