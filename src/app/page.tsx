'use client';

import { useState, useEffect } from 'react';
import WeatherCanvas from '@/components/WeatherCanvas';
import InputPill from '@/components/UI/InputPill';
import Overlay from '@/components/UI/Overlay';
import { fetchWeather } from '@/lib/github';
import { WeatherState } from '@/lib/engine/types';

export default function Home() {
  // Default weather so the world isn't blank on first load
  const defaultWeather: WeatherState = {
    mood: 'storm',
    commits: [],
    repoName: 'commitweather',
    seed: 1337
  };

  const [weather, setWeather] = useState<WeatherState | null>(defaultWeather);
  const [loading, setLoading] = useState(false);
  const [zoomedOut, setZoomedOut] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial intro zoom animation
  useEffect(() => {
    const timer = setTimeout(() => setZoomedOut(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalyze = async (repo: string) => {
    setLoading(true);
    setError(null);
    setZoomedOut(false);

    try {
      const data = await fetchWeather(repo);

      await new Promise(r => setTimeout(r, 500));

      setWeather(data);
      setZoomedOut(true);
      setShowStory(true);

      setTimeout(() => setShowStory(false), 4500);

    } catch (err: any) {
      console.error('Fetch failed:', err);
      setError(err?.message || 'Could not find repo or API limit reached');
      setZoomedOut(true); // Zoom back out even on error

      // Clear error after 4s
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">

      {/* Background World */}
      <div className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <WeatherCanvas
          weather={weather}
          isZoomedOut={zoomedOut}
          className="w-full h-full block"
        />
      </div>

      {/* UI Layers */}
      <Overlay weather={weather} showStory={showStory} />

      <InputPill
        onAnalyze={handleAnalyze}
        isLoading={loading}
        moodColor={weather?.mood === 'sunny' ? '#f59e0b' : weather?.mood === 'rain' ? '#60a5fa' : '#ffffff'}
      />

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 font-mono text-xs text-red-400 bg-red-950/50 border border-red-500/30 backdrop-blur-md px-4 py-2 rounded-full animate-pulse">
          ⚠ {error}
        </div>
      )}

      {/* Vignette & Grain */}
      <div className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      ></div>
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitches'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      ></div>

    </main>
  );
}
