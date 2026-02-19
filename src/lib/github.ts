import { CommitData, CommitType, WeatherMood, WeatherState } from './engine/types';

// Simple cache to avoid hitting rate limits too hard during dev
const cache: Record<string, WeatherState> = {};

export async function fetchWeather(repo: string): Promise<WeatherState> {
    if (cache[repo]) return cache[repo];

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=100`);
        if (!response.ok) throw new Error('Repo not found');

        const data = await response.json();

        const commits: CommitData[] = data.map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            date: c.commit.author.date,
            type: classifyCommit(c.commit.message),
            author: c.commit.author.name
        }));

        const mood = analyzeMood(commits);

        const state = {
            repoName: repo,
            commits,
            mood
        };

        cache[repo] = state;
        return state;

    } catch (error) {
        console.error(error);
        // Fallback or rethrow
        throw error;
    }
}

function classifyCommit(message: string): CommitType {
    const msg = message.toLowerCase();
    if (msg.includes('feat') || msg.includes('feature')) return 'feat';
    if (msg.includes('fix') || msg.includes('bug')) return 'fix';
    if (msg.includes('refactor') || msg.includes('cleanup')) return 'refactor';
    if (msg.includes('docs') || msg.includes('readme')) return 'docs';
    if (msg.includes('test') || msg.includes('spec')) return 'test';
    return 'other';
}

function analyzeMood(commits: CommitData[]): WeatherMood {
    if (commits.length === 0) return 'fog'; // Empty/Unknown

    // Frequency analysis
    const recent = commits.slice(0, 30); // Analyze recent 30
    const counts: Record<CommitType, number> = {
        feat: 0, fix: 0, refactor: 0, docs: 0, test: 0, other: 0
    };

    recent.forEach(c => counts[c.type]++);

    // Simple heuristics for mood
    // Storm: Many 'other' or mixed chaotic types? Or maybe just HIGH activity?
    // Request says: "storm: purple-black", "other = storm" color.
    // "rain: fix"
    // "sunny: feat"
    // "wind: refactor"

    // Let's use dominant type
    const maxType = (Object.keys(counts) as CommitType[]).reduce((a, b) => counts[a] > counts[b] ? a : b);

    // Mapping type to mood
    if (maxType === 'feat') return 'sunny';
    if (maxType === 'fix') return 'rain';
    if (maxType === 'refactor') return 'wind';
    if (maxType === 'docs') return 'fog';
    if (maxType === 'test') return 'snow';

    // Default/Other -> Storm if high volume?
    // Or just Storm for 'other'.
    return 'storm';
}
