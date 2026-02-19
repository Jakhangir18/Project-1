'use client';

import { WeatherState } from '@/lib/engine/types';
import { useEffect, useState } from 'react';

interface OverlayProps {
    weather: WeatherState | null;
    showStory: boolean;
}

export default function Overlay({ weather, showStory }: OverlayProps) {
    const [showStoryText, setShowStoryText] = useState(false);

    useEffect(() => {
        if (showStory) {
            setShowStoryText(true);
            const timer = setTimeout(() => setShowStoryText(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showStory]);

    return (
        <div className="pointer-events-none text-white select-none">
            {/* Top Left Title */}
            <div className="absolute top-6 left-6 font-mono text-xs tracking-widest text-white/60">
                🌦 COMMITWEATHER
            </div>

            {/* Top Right Stats */}
            {weather && (
                <div className="absolute top-6 right-6 text-right fade-in">
                    <div className="font-mono text-xs text-white/60 mb-1">Current Mood</div>
                    <div className="flex items-center justify-end gap-2 text-sm font-medium">
                        <span className="uppercase tracking-wide">{weather.mood}</span>
                        <span>{getMoodEmoji(weather.mood)}</span>
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{weather.commits.length} commits analyzed</div>
                </div>
            )}

            {/* Story Text */}
            <div
                className={`absolute top-[20%] left-0 w-full text-center transition-opacity duration-1000 ${showStoryText ? 'opacity-100' : 'opacity-0'}`}
            >
                {weather && (
                    <h1 className="font-syne text-4xl md:text-6xl font-extrabold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] px-4">
                        {weather.repoName}
                    </h1>
                )}
                <p className="font-mono text-sm text-white/60 mt-4 tracking-widest uppercase">
                    {weather ? getPoeticLine(weather.mood) : ''}
                </p>
            </div>

            {/* Mood Legend - Bottom Right */}
            {weather && (
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 font-mono text-[10px] text-white/50 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_orange]"></div>feat</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_blue]"></div>fix</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_emerald]"></div>refactor</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div>docs</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-200"></div>test</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-400"></div>other</div>
                </div>
            )}
        </div>
    );
}

function getMoodEmoji(mood: string) {
    switch (mood) {
        case 'sunny': return '☀️';
        case 'rain': return '🌧';
        case 'storm': return '⛈';
        case 'snow': return '❄️';
        case 'fog': return '🌫';
        case 'wind': return '💨';
        default: return '☁️';
    }
}

function getPoeticLine(mood: string) {
    switch (mood) {
        case 'sunny': return 'A golden era of creation.';
        case 'rain': return 'Washing away the bugs.';
        case 'storm': return 'A turbulent world, always moving.';
        case 'snow': return 'Cold precision, frozen in time.';
        case 'fog': return 'Lost in the documentation.';
        case 'wind': return 'Changes blowing through the code.';
        default: return 'The silence of the code.';
    }
}
