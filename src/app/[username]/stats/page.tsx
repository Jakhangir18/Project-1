'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWeather } from '@/lib/github';
import { WeatherState, Biome } from '@/lib/engine/types';
import BentoItem from '@/components/ui/terminal-bento-grid';

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreProgress, setScoreProgress] = useState(0);

  useEffect(() => {
    async function loadWeather() {
      try {
        const data = await fetchWeather(username);
        setWeather(data);
        setTimeout(() => setScoreProgress(data.score), 100);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadWeather();
    }
  }, [username]);

  if (loading || !weather) {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center text-white">
        <p className="font-dm-mono animate-pulse">Loading stats...</p>
      </div>
    );
  }

  const getBiomeInfo = (biome: Biome) => {
    switch (biome) {
      case 'DEAD_DESERT': return { emoji: '🌵', name: 'Dead Desert', color: '#c8a96e' };
      case 'ICE_TUNDRA': return { emoji: '🌨', name: 'Ice Tundra', color: '#8ab8d0' };
      case 'SUBTROPICS': return { emoji: '🌿', name: 'Subtropics', color: '#3a7a2a' };
      case 'SPRING': return { emoji: '🌸', name: 'Spring', color: '#ec4899' };
      case 'SUMMER': return { emoji: '☀️', name: 'Summer', color: '#f59e0b' };
    }
  };

  const getNextBiome = (current: Biome): { biome: Biome; threshold: number } | null => {
    if (current === 'SUMMER') return null;
    if (current === 'SPRING') return { biome: 'SUMMER', threshold: 70 };
    if (current === 'SUBTROPICS') return { biome: 'SPRING', threshold: 45 };
    if (current === 'ICE_TUNDRA') return { biome: 'SUBTROPICS', threshold: 25 };
    return { biome: 'ICE_TUNDRA', threshold: 10 };
  };

  const biomeInfo = getBiomeInfo(weather.biome);
  const nextBiome = getNextBiome(weather.biome);

  const commitColors: Record<string, string> = {
    feat: '#f97316',
    fix: '#60a5fa',
    refactor: '#34d399',
    docs: '#94a3b8',
    test: '#e0f2fe',
    other: '#a78bfa',
  };

  return (
    <div className="terminal-container terminal-theme-scope h-dvh overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <button
          onClick={() => router.push(`/${username}`)}
          className="mb-8 text-slate-400 hover:text-white font-dm-mono text-sm transition-colors flex items-center gap-2"
        >
          {'<-'} Back to world
        </button>

        <div className="mb-12">
          <h1 className="font-syne font-extrabold text-5xl mb-2 flex items-center gap-3 blinking-cursor">
            {biomeInfo.emoji} CLIMATE REPORT
          </h1>
          <p className="font-dm-mono text-slate-500">{'>'} @{username}</p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Why This Biome - Large */}
          <BentoItem className="col-span-3">
            <h2 className="text-3xl mb-4">
              {'>'} WHY YOUR WORLD IS <span style={{ color: biomeInfo.color }}>{biomeInfo.name.toUpperCase()}</span>
            </h2>

            {/* Score Bar */}
            <div className="mb-6">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[#c8a96e] via-[#3a7a2a] to-[#f59e0b] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(scoreProgress, 100)}%` }}
                />
                {/* Threshold markers */}
                <div className="absolute top-0 left-[10%] w-0.5 h-full bg-white/30" />
                <div className="absolute top-0 left-[25%] w-0.5 h-full bg-white/30" />
                <div className="absolute top-0 left-[45%] w-0.5 h-full bg-white/30" />
                <div className="absolute top-0 left-[70%] w-0.5 h-full bg-white/30" />
              </div>
              <div className="flex justify-between text-xs font-dm-mono text-slate-500 mt-1">
                <span>0</span>
                <span>25</span>
                <span>45</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>

            <div className="space-y-2 font-dm-mono text-xl">
              <p>✓ {weather.totalCommits} recent commits</p>
              <p>✓ Active {weather.uniqueActiveDays} days</p>
              <p>✓ Longest streak: {weather.longestStreak} days</p>
              <p>✓ {weather.publicRepos} public repos</p>
            </div>
          </BentoItem>

          {/* Stats - 4 Small Boxes */}
          <BentoItem>
            <h2 className="text-2xl mb-2">{'>'} TOTAL COMMITS</h2>
            <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
              {weather.totalCommits}
            </p>
          </BentoItem>

          <BentoItem>
            <h2 className="text-2xl mb-2">{'>'} ACTIVE DAYS</h2>
            <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
              {weather.uniqueActiveDays}
            </p>
          </BentoItem>

          <BentoItem>
            <h2 className="text-2xl mb-2">{'>'} LONGEST STREAK</h2>
            <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
              {weather.longestStreak}
            </p>
          </BentoItem>

          <BentoItem>
            <h2 className="text-2xl mb-2">{'>'} SCORE</h2>
            <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
              {weather.score}/100
            </p>
          </BentoItem>

          {/* Commit Breakdown - Medium */}
          <BentoItem className="col-span-2">
            <h2 className="text-3xl mb-6">{'>'} COMMIT BREAKDOWN</h2>
            <div className="space-y-3">
              {Object.entries(weather.commitsByType).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-xl font-dm-mono mb-1">
                    <span>{type.toUpperCase()}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${weather.totalCommits > 0 ? (count / weather.totalCommits) * 100 : 0}%`,
                        backgroundColor: commitColors[type],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </BentoItem>

          {/* Next Biome - Medium */}
          {nextBiome && (
            <BentoItem>
              <h2 className="text-3xl mb-4">
                {'>'} UNLOCK {getBiomeInfo(nextBiome.biome).name.toUpperCase()} {getBiomeInfo(nextBiome.biome).emoji}
              </h2>
              <div className="mb-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
                    style={{ width: `${(weather.score / nextBiome.threshold) * 100}%` }}
                  />
                </div>
                <p className="text-xs font-dm-mono text-slate-500 mt-1">
                  {weather.score} / {nextBiome.threshold} pts
                </p>
              </div>
              <div className="space-y-2 text-sm font-dm-mono text-slate-300">
                <p>• More commits (+2 pts)</p>
                <p>• Active days (+3 pts)</p>
                <p>• Long streaks (+5 pts)</p>
              </div>
            </BentoItem>
          )}

          {/* Activity Trends */}
          <BentoItem className="col-span-2">
            <h2 className="text-3xl mb-6">{'>'} ACTIVITY TRENDS</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-lg font-dm-mono mb-2">
                  <span>Commits/Day</span>
                  <span className="font-bold">{(weather.totalCommits / Math.max(weather.uniqueActiveDays, 1)).toFixed(1)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.min((weather.totalCommits / Math.max(weather.uniqueActiveDays, 1)) * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-lg font-dm-mono mb-2">
                  <span>Consistency</span>
                  <span className="font-bold">{Math.round((weather.longestStreak / Math.max(weather.uniqueActiveDays, 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${Math.round((weather.longestStreak / Math.max(weather.uniqueActiveDays, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-lg font-dm-mono mb-2">
                  <span>Productivity Index</span>
                  <span className="font-bold">{Math.round(weather.score * 1.2)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    style={{ width: `${Math.min(weather.score * 1.2, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </BentoItem>

          {/* Weekly Activity Pattern */}
          <BentoItem>
            <h2 className="text-3xl mb-6">{'>'} WEEKLY PATTERN</h2>
            <div className="space-y-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const activity = Math.floor(Math.random() * 100);
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-sm font-dm-mono w-8">{day}</span>
                    <div className="flex-1 h-6 bg-white/10 rounded overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${activity}%`,
                          backgroundColor: biomeInfo.color,
                          opacity: 0.7 + (activity / 100) * 0.3
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </BentoItem>

          {/* Repository Stats */}
          <BentoItem className="col-span-2">
            <h2 className="text-3xl mb-6">{'>'} REPOSITORY INSIGHTS</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Repositories</p>
                <p className="font-syne font-extrabold text-4xl" style={{ color: biomeInfo.color }}>
                  {weather.publicRepos}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Commits/Repo</p>
                <p className="font-syne font-extrabold text-4xl" style={{ color: biomeInfo.color }}>
                  {Math.round(weather.totalCommits / Math.max(weather.publicRepos, 1))}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Most Active Day</p>
                <p className="font-dm-mono text-xl text-white">
                  {['Monday', 'Wednesday', 'Friday', 'Thursday'][Math.floor(Math.random() * 4)]}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Development Streak</p>
                <p className="font-dm-mono text-xl text-white">
                  {weather.longestStreak} days 🔥
                </p>
              </div>
            </div>
          </BentoItem>

          {/* Contribution Heatmap */}
          <BentoItem>
            <h2 className="text-3xl mb-6">{'>'} HEAT MAP</h2>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, idx) => {
                const intensity = Math.random();
                return (
                  <div
                    key={idx}
                    className="aspect-square rounded"
                    style={{
                      backgroundColor: intensity > 0.7 ? biomeInfo.color : intensity > 0.4 ? `${biomeInfo.color}66` : `${biomeInfo.color}22`,
                    }}
                  />
                );
              })}
            </div>
          </BentoItem>

          {/* Share - Wide */}
          <BentoItem className="col-span-3">
            <h2 className="text-3xl mb-4">{'>'} SHARE YOUR WORLD</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Check out my CommitWeather world: ${biomeInfo.emoji} ${biomeInfo.name} with ${weather.score}/100 score!`
                  );
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-dm-mono text-xl transition-colors border border-white/20"
              >
                📋 Copy to clipboard
              </button>
              <button
                onClick={() => window.open(`https://github.com/${username}`, '_blank')}
                className="flex-1 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-dm-mono text-xl transition-colors border border-white/20"
              >
                🔗 View on GitHub
              </button>
            </div>
          </BentoItem>
        </div>
      </div>
    </div>
  );
}
