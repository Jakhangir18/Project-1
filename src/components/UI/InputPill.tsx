'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface InputPillProps {
    onAnalyze: (repo: string) => void;
    isLoading: boolean;
    moodColor?: string;
}

export default function InputPill({ onAnalyze, isLoading, moodColor = '#ffffff' }: InputPillProps) {
    const [repo, setRepo] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (repo.trim()) {
            onAnalyze(repo.trim());
        }
    };

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-40 w-full px-4">
            {/* Demo Chips (only if not focused or specialized logic?) Request says "Below input pill" */}

            <form
                onSubmit={handleSubmit}
                className={`
            relative flex items-center transition-all duration-500 ease-out
            backdrop-blur-2xl bg-black/40 border border-white/10
            rounded-full px-2 py-2
            ${isFocused ? 'w-full max-w-md shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'w-[280px]'}
        `}
                style={{
                    boxShadow: isFocused ? `0 0 30px ${moodColor}40` : undefined,
                    borderColor: isFocused ? `${moodColor}60` : 'rgba(255,255,255,0.1)'
                }}
            >
                <div className="pl-4 pr-2 text-white/50">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>

                <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="username/repo"
                    className="bg-transparent border-none outline-none text-white font-mono text-sm w-full placeholder:text-white/30"
                    disabled={isLoading}
                />

                <button
                    type="submit"
                    disabled={isLoading || !repo}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                >
                    Analyze
                </button>
            </form>

            {/* Demo Chips */}
            <div className={`flex gap-2 transition-opacity duration-500 ${isFocused || isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {['vercel/next.js', 'facebook/react', 'torvalds/linux', 'microsoft/vscode'].map(demo => (
                    <button
                        key={demo}
                        onClick={() => { setRepo(demo); onAnalyze(demo); }}
                        className="text-[10px] text-white/40 hover:text-white hover:bg-white/10 px-2 py-1 rounded-full transition-all border border-transparent hover:border-white/10"
                    >
                        {demo}
                    </button>
                ))}
            </div>
        </div>
    );
}
