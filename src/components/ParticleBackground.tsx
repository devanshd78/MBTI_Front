import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio ?? 1, 2);
    function resize() {
      const { innerWidth: w, innerHeight: h } = window;
      canvas!.width = Math.floor(w * DPR);
      canvas!.height = Math.floor(h * DPR);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; o: number }> = [];
    const COUNT = 120;
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width / DPR,
        y: Math.random() * canvas.height / DPR,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2 + 0.8,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    let rafId = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width / DPR) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height / DPR) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.o})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
