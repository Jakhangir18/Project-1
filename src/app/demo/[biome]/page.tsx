'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WeatherState, Biome } from '@/lib/engine/types';
import WeatherCanvas from '@/components/WeatherCanvas';

const BIOME_INFO: Record<Biome, { emoji: string; name: string; description: string; criteria: string[]; color: string }> = {
  DEAD_DESERT: {
    emoji: '🌵',
    name: 'Dead Desert',
    description: 'A barren wasteland. Start your journey by making your first commits.',
    criteria: [
      'Score: 0-9 points',
      'Minimal activity detected',
      'Few commits or repositories',
      'Inactive for extended periods',
    ],
    color: '#c8a96e',
  },
  ICE_TUNDRA: {
    emoji: '❄️',
    name: 'Ice Tundra',
    description: 'A cold, frozen landscape. You&apos;re making progress, but there&apos;s room to grow.',
    criteria: [
      'Score: 10-24 points',
      'Sporadic commit activity',
      'Short contribution streaks',
      'Limited repository portfolio',
    ],
    color: '#8ab8d0',
  },
  SUBTROPICS: {
    emoji: '🌿',
    name: 'Subtropics',
    description: 'Life is emerging! Regular activity is transforming your world.',
    criteria: [
      'Score: 25-44 points',
      'Consistent commit patterns',
      'Growing streak count',
      'Expanding repository collection',
    ],
    color: '#3a7a2a',
  },
  SPRING: {
    emoji: '🌸',
    name: 'Spring',
    description: 'Your world is blooming! Strong activity and dedication.',
    criteria: [
      'Score: 45-69 points',
      'High commit frequency',
      'Solid contribution streaks',
      'Diverse project portfolio',
    ],
    color: '#ec4899',
  },
  SUMMER: {
    emoji: '☀️',
    name: 'Summer',
    description: 'Paradise achieved! You&apos;re a highly active developer.',
    criteria: [
      'Score: 70+ points',
      'Exceptional commit volume',
      'Long contribution streaks',
      'Extensive repository collection',
    ],
    color: '#f59e0b',
  },
};

export default function DemoBiomePage() {
  const params = useParams();
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherState | null>(null);

  const biomeKey = (params.biome as string).toUpperCase() as Biome;
  const biomeInfo = BIOME_INFO[biomeKey];

  useEffect(() => {
    if (!biomeInfo) {
      router.push('/');
      return;
    }

    // Create demo weather state for this biome
    const demoWeather: WeatherState = {
      mood: biomeKey === 'DEAD_DESERT' ? 'sunny' // Use sunny for desert to avoid rain
        : biomeKey === 'ICE_TUNDRA' ? 'snow'
          : biomeKey === 'SUBTROPICS' ? 'rain'
            : biomeKey === 'SPRING' ? 'wind'
              : 'sunny',
      commits: [],
      repoName: 'demo/world',
      seed: biomeKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
      biome: biomeKey,
      score: biomeKey === 'DEAD_DESERT' ? 5
        : biomeKey === 'ICE_TUNDRA' ? 18
          : biomeKey === 'SUBTROPICS' ? 35
            : biomeKey === 'SPRING' ? 57
              : 85,
      totalCommits: biomeKey === 'DEAD_DESERT' ? 5
        : biomeKey === 'ICE_TUNDRA' ? 15
          : biomeKey === 'SUBTROPICS' ? 35
            : biomeKey === 'SPRING' ? 55
              : 90,
      uniqueActiveDays: biomeKey === 'DEAD_DESERT' ? 2
        : biomeKey === 'ICE_TUNDRA' ? 6
          : biomeKey === 'SUBTROPICS' ? 12
            : biomeKey === 'SPRING' ? 18
              : 30,
      longestStreak: biomeKey === 'DEAD_DESERT' ? 1
        : biomeKey === 'ICE_TUNDRA' ? 2
          : biomeKey === 'SUBTROPICS' ? 5
            : biomeKey === 'SPRING' ? 10
              : 15,
      publicRepos: biomeKey === 'DEAD_DESERT' ? 1
        : biomeKey === 'ICE_TUNDRA' ? 3
          : biomeKey === 'SUBTROPICS' ? 5
            : biomeKey === 'SPRING' ? 8
              : 12,
      commitsByType: { feat: 0, fix: 0, refactor: 0, docs: 0, test: 0, other: 0 },
    };

    setWeather(demoWeather);
  }, [biomeKey, biomeInfo, router]);

  if (!biomeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60 font-dm-sans">Invalid biome</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Canvas in top half */}
      <div className="flex-1 relative">
        {weather && (
          <WeatherCanvas
            weather={weather}
            onWeatherChange={setWeather}
            isDemo={true}
            isZoomedOut={true}
          />
        )}

        {/* Back button overlay */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => router.push('/')}
            className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-sm font-dm-sans text-white/80 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Biome name overlay */}
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-2">
            <span className="text-2xl mr-2">{biomeInfo.emoji}</span>
            <span className="font-syne font-bold text-white">{biomeInfo.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
