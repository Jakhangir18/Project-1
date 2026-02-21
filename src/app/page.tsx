'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [username, setUsername] = useState('');
  
  const demoCandidates = [
    { label: '🌵 Desert', biome: 'DEAD_DESERT' },
    { label: '🌨 Tundra', biome: 'ICE_TUNDRA' },
    { label: '🌿 Subtropics', biome: 'SUBTROPICS' },
    { label: '🌸 Spring', biome: 'SPRING' },
    { label: '☀️ Summer', biome: 'SUMMER' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Fireflies
    const fireflies: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }> = [];
    for (let i = 0; i < 40; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.5,
        alpha: 0.3 + Math.random() * 0.7,
        size: 2 + Math.random() * 3,
      });
    }

    const fogs: Array<{ x: number; y: number; size: number; alpha: number; vx: number }> = [];
    for (let i = 0; i < 6; i++) {
      fogs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 100 + Math.random() * 150,
        alpha: 0.03 + Math.random() * 0.05,
        vx: 0.1 + Math.random() * 0.2,
      });
    }

    const stars: Array<{ x: number; y: number; alpha: number; phase: number }> = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        alpha: Math.random(),
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    const animate = () => {
      time += 0.016;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#060a12');
      gradient.addColorStop(1, '#0a0f1e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      stars.forEach(star => {
        const twinkle = 0.3 + 0.7 * (Math.sin(time * 2 + star.phase) * 0.5 + 0.5);
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, 2, 2);
      });
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 0.5;
      const mh = canvas.height * 0.2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 20) {
        const nx = x / canvas.width;
        const y = canvas.height - mh * (0.5 + 0.5 * Math.sin(nx * 8) + 0.2 * Math.sin(nx * 20));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      fogs.forEach(fog => {
        fog.x += fog.vx;
        if (fog.x > canvas.width + fog.size) fog.x = -fog.size;

        const fogGrad = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.size);
        fogGrad.addColorStop(0, `rgba(200,200,220,${fog.alpha})`);
        fogGrad.addColorStop(1, 'rgba(200,200,220,0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(fog.x - fog.size, fog.y - fog.size, fog.size * 2, fog.size * 2);
      });

      fireflies.forEach(ff => {
        ff.x += ff.vx;
        ff.y += ff.vy;

        if (ff.y < -10) {
          ff.y = canvas.height + 10;
          ff.x = Math.random() * canvas.width;
        }
        if (ff.x < -10) ff.x = canvas.width + 10;
        if (ff.x > canvas.width + 10) ff.x = -10;

        ctx.save();
        ctx.globalAlpha = ff.alpha;
        const glow = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.size * 3);
        glow.addColorStop(0, '#f59e0b');
        glow.addColorStop(1, 'rgba(245,158,11,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(ff.x - ff.size * 3, ff.y - ff.size * 3, ff.size * 6, ff.size * 6);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ff.x - ff.size / 2, ff.y - ff.size / 2, ff.size, ff.size);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/${username.trim()}`);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
        <div className="text-6xl mb-6 animate-spin-slow">
          🌍
        </div>

        <h1 className="font-syne font-extrabold text-6xl md:text-7xl mb-4 text-center tracking-tight">
          CommitWeather
        </h1>

        <p className="font-dm-sans font-light text-xl text-slate-400 mb-12 text-center max-w-md">
          Every GitHub profile is a world.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md mb-8">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github username"
              className="flex-1 bg-transparent font-dm-mono text-white placeholder-slate-500 outline-none text-base"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 transition-colors px-6 py-2 rounded-full font-syne font-bold text-sm whitespace-nowrap"
            >
              Explore World →
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-3 justify-center max-w-md">
          {demoCandidates.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => router.push(`/demo/${demo.biome.toLowerCase()}`)}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-dm-sans transition-all hover:scale-105"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </main>
  );
}
