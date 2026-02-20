import { CommitData, CommitType, WeatherMood, WeatherState } from './engine/types';

const cache: Record<string, WeatherState> = {};

export async function fetchWeather(username: string): Promise<WeatherState> {
    const key = username.toLowerCase().trim();
    if (cache[key]) return cache[key];

    // Step 1: Check user exists
    const userRes = await fetch(`https://api.github.com/users/${key}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (userRes.status === 404) throw new Error(`User "${username}" not found on GitHub`);
    if (userRes.status === 403) throw new Error('GitHub rate limit hit. Wait 1 minute and try again.');
    if (!userRes.ok) throw new Error('GitHub API error');

    // Step 2: Fetch public events (gives us commit data per user)
    const eventsRes = await fetch(
        `https://api.github.com/users/${key}/events/public?per_page=100`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    );

    if (!eventsRes.ok) throw new Error('Could not fetch events');

    const events = await eventsRes.json();

    // Step 3: Extract commits from PushEvents only
    const commits: CommitData[] = [];

    for (const event of events) {
        if (event.type !== 'PushEvent') continue;
        for (const c of (event.payload?.commits ?? [])) {
            commits.push({
                sha: c.sha ?? '',
                message: c.message ?? '',
                date: event.created_at,
                type: classifyCommit(c.message ?? ''),
                author: event.actor?.login ?? username,
            });
        }
    }

    const seed = hashUsername(key);
    const mood = analyzeMood(commits, events.length);

    const state: WeatherState = {
        repoName: key,
        commits,
        mood,
        seed,
    };

    cache[key] = state;
    return state;
}

// Same username always → same world (deterministic)
export function hashUsername(username: string): number {
    let hash = 5381;
    for (let i = 0; i < username.length; i++) {
        hash = (hash * 33) ^ username.charCodeAt(i);
    }
    return Math.abs(hash);
}

export function seededRandom(seed: number, index: number): number {
    const x = Math.sin(seed * 9301 + index * 49297 + 233) * 10000;
    return x - Math.floor(x);
}

function classifyCommit(message: string): CommitType {
    const msg = message.toLowerCase();
    if (/\b(feat|feature|add|new|implement|create|build)\b/.test(msg)) return 'feat';
    if (/\b(fix|bug|patch|hotfix|repair|resolve|crash|error)\b/.test(msg)) return 'fix';
    if (/\b(refactor|clean|improve|optimize|restructure|simplify)\b/.test(msg)) return 'refactor';
    if (/\b(doc|readme|comment|guide|license|changelog)\b/.test(msg)) return 'docs';
    if (/\b(test|spec|coverage|jest|cypress|e2e)\b/.test(msg)) return 'test';
    return 'other';
}

function analyzeMood(commits: CommitData[], totalEvents: number): WeatherMood {
    if (commits.length === 0 && totalEvents < 2) return 'fog';

    const total = commits.length;
    if (total === 0) return 'fog';

    const counts: Record<CommitType, number> = {
        feat: 0, fix: 0, refactor: 0, docs: 0, test: 0, other: 0
    };
    commits.forEach(c => counts[c.type]++);

    const featRatio = counts.feat / total;
    const fixRatio = counts.fix / total;
    const testRatio = counts.test / total;
    const refactorRatio = counts.refactor / total;

    if (total > 60) return 'storm';
    if (testRatio > 0.30) return 'snow';
    if (featRatio > 0.40) return 'sunny';
    if (fixRatio > 0.35) return 'rain';
    if (refactorRatio > 0.25) return 'wind';
    if (total < 5) return 'fog';

    const maxType = (Object.keys(counts) as CommitType[])
        .reduce((a, b) => counts[a] > counts[b] ? a : b);

    const map: Record<CommitType, WeatherMood> = {
        feat: 'sunny', fix: 'rain', refactor: 'wind',
        docs: 'fog', test: 'snow', other: 'storm',
    };
    return map[maxType];
}