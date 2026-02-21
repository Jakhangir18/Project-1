'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWeather } from '@/lib/github';
import { WeatherState } from '@/lib/engine/types';
import WeatherCanvas from '@/components/WeatherCanvas';

export default function WorldPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeather() {
      try {
        setLoading(true);
        const data = await fetchWeather(username);
        setWeather(data);
        setError(null);
      } catch (err: unknown) {
        console.error('Failed to fetch weather:', err);
        setError(err instanceof Error ? err.message : 'Failed to load world');
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadWeather();
    }
  }, [username]);

  const getBiomeLabel = (biome: string) => {
    switch (biome) {
      case 'DEAD_DESERT': return '🌵 Dead Desert';
      case 'ICE_TUNDRA': return '🌨 Ice Tundra';
      case 'SUBTROPICS': return '🌿 Subtropics';
      case 'SPRING': return '🌸 Spring';
      case 'SUMMER': return '☀️ Summer';
      default: return biome;
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌍</div>
          <p className="font-dm-mono text-sm text-slate-400">Loading {username}&apos;s world...</p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">❌</div>
          <p className="font-dm-mono text-sm text-red-400 mb-6">{error || 'World not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-syne font-bold transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* Canvas World */}
      <div className="w-full h-full">
        <WeatherCanvas
          weather={weather}
          isZoomedOut={true}
          className="w-full h-full block"
          username={username}
          isDemo={false}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => router.push('/')}
          className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-sm font-dm-sans text-white/80 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="absolute top-6 right-6 z-50 font-dm-mono text-xs">
        <span className="text-orange-400">{getBiomeLabel(weather.biome)}</span>
      </div>

      {/* Input pill */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3">
          <input
            type="text"
            defaultValue={username}
            placeholder="github username"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim() && target.value !== username) {
                  router.push(`/${target.value.trim()}`);
                }
              }
            }}
            className="w-48 bg-transparent font-dm-mono text-white placeholder-slate-500 outline-none text-sm"
          />
        </div>
      </div>
    </main>
  );
}
