'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WeatherState, Biome } from '@/lib/engine/types';
import BentoItem from '@/components/ui/terminal-bento-grid';

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
        description: 'A cold, frozen landscape. You\'re making progress, but there\'s room to grow.',
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
        description: 'Paradise achieved! You\'re a highly active developer.',
        criteria: [
            'Score: 70+ points',
            'Exceptional commit volume',
            'Long contribution streaks',
            'Extensive repository collection',
        ],
        color: '#f59e0b',
    },
};

export default function DemoBiomeStatsPage() {
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

        const demoWeather: WeatherState = {
            mood: biomeKey === 'DEAD_DESERT' ? 'fog'
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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <p className="text-white/60 font-dm-sans">Invalid biome</p>
            </div>
        );
    }

    return (
        <div className="terminal-container terminal-theme-scope h-dvh overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <button
                    onClick={() => router.push(`/demo/${params.biome}`)}
                    className="mb-8 text-slate-400 hover:text-white font-dm-mono text-sm transition-colors flex items-center gap-2"
                >
                    {'<-'} Back to demo world
                </button>

                <h1 className="font-syne font-extrabold text-4xl mb-8 blinking-cursor">
                    {biomeInfo.emoji} {biomeInfo.name.toUpperCase()} CRITERIA
                </h1>

                <div className="bento-grid">
                    <BentoItem className="col-span-3">
                        <h2 className="text-3xl mb-4">
                            {'>'} WHAT IS {biomeInfo.name.toUpperCase()}?
                        </h2>
                        <p className="text-xl font-dm-mono mb-6">{biomeInfo.description}</p>

                        <div className="space-y-2">
                            <h3 className="text-2xl mb-3">{'>'} REQUIREMENTS</h3>
                            {biomeInfo.criteria.map((criterion, idx) => (
                                <p key={idx} className="text-lg font-dm-mono">
                                    • {criterion}
                                </p>
                            ))}
                        </div>
                    </BentoItem>

                    <BentoItem>
                        <h2 className="text-2xl mb-2">{'>'} EXAMPLE SCORE</h2>
                        <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
                            {weather?.score}/100
                        </p>
                    </BentoItem>

                    <BentoItem>
                        <h2 className="text-2xl mb-2">{'>'} COMMITS</h2>
                        <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
                            {weather?.totalCommits}
                        </p>
                    </BentoItem>

                    <BentoItem>
                        <h2 className="text-2xl mb-2">{'>'} ACTIVE DAYS</h2>
                        <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
                            {weather?.uniqueActiveDays}
                        </p>
                    </BentoItem>

                    <BentoItem>
                        <h2 className="text-2xl mb-2">{'>'} LONGEST STREAK</h2>
                        <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
                            {weather?.longestStreak}
                        </p>
                    </BentoItem>

                    <BentoItem>
                        <h2 className="text-2xl mb-2">{'>'} PUBLIC REPOS</h2>
                        <p className="font-syne font-extrabold text-5xl" style={{ color: biomeInfo.color }}>
                            {weather?.publicRepos}
                        </p>
                    </BentoItem>

                    {/* Activity Trends */}
                    <BentoItem className="col-span-2">
                        <h2 className="text-3xl mb-6">{'>'} ACTIVITY METRICS</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-lg font-dm-mono mb-2">
                                    <span>Daily Average</span>
                                    <span className="font-bold">{weather ? (weather.totalCommits / Math.max(weather.uniqueActiveDays, 1)).toFixed(1) : '0'} commits</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        style={{ width: `${weather ? Math.min((weather.totalCommits / Math.max(weather.uniqueActiveDays, 1)) * 10, 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-lg font-dm-mono mb-2">
                                    <span>Consistency</span>
                                    <span className="font-bold">{weather ? Math.round((weather.longestStreak / Math.max(weather.uniqueActiveDays, 1)) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                        style={{ width: `${weather ? Math.round((weather.longestStreak / Math.max(weather.uniqueActiveDays, 1)) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </BentoItem>

                    {/* Demo Contribution Heatmap */}
                    <BentoItem>
                        <h2 className="text-3xl mb-6">{'>'} ACTIVITY MAP</h2>
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

                    <BentoItem className="col-span-3">
                        <h2 className="text-3xl mb-4">{'>'} READY TO SEE YOUR WORLD?</h2>
                        <p className="text-xl font-dm-mono mb-4">
                            Enter your GitHub username on the home page to discover your real climate.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-dm-mono text-xl transition-colors border border-white/20"
                        >
                            → Go to Home
                        </button>
                    </BentoItem>
                </div>
            </div>
        </div>
    );
}
