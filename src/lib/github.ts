import { CommitData, CommitType, WeatherMood, WeatherState, Biome } from './engine/types';

const cache: Record<string, WeatherState> = {};

export async function fetchWeather(username: string): Promise<WeatherState> {
    const key = username.toLowerCase().trim();
    
    // Check localStorage cache first
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`cw_${key}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Cache for 1 hour
                if (Date.now() - parsed.timestamp < 3600000) {
                    return parsed.data;
                }
            } catch {
                // Invalid cache, proceed to fetch
            }
        }
    }
    
    if (cache[key]) return cache[key];

    // Step 1: Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${key}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (userRes.status === 404) throw new Error(`User "${username}" not found on GitHub`);
    if (userRes.status === 403) throw new Error('GitHub rate limit hit. Wait 1 minute and try again.');
    if (!userRes.ok) throw new Error('GitHub API error');

    const userData = await userRes.json();
    const publicRepos = userData.public_repos || 0;

    // Step 2: Fetch repositories to get all commits
    const reposRes = await fetch(
        `https://api.github.com/users/${key}/repos?per_page=100&sort=updated`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    );

    if (!reposRes.ok) throw new Error('Could not fetch repositories');

    const repos = await reposRes.json();
    
    // Step 3: Fetch recent commits from top repositories
    const commits: CommitData[] = [];
    const activeDays = new Set<string>();
    const commitsByType: Record<CommitType, number> = {
        feat: 0, fix: 0, refactor: 0, docs: 0, test: 0, other: 0
    };
    
    // Get commits from user's top 10 most recently updated repos
    const topRepos = repos.slice(0, 10);
    
    for (const repo of topRepos) {
        try {
            const commitsRes = await fetch(
                `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?author=${key}&per_page=30`,
                { headers: { 'Accept': 'application/vnd.github.v3+json' } }
            );
            
            if (!commitsRes.ok) continue;
            
            const repoCommits = await commitsRes.json();
            
            for (const c of repoCommits) {
                const commitDate = new Date(c.commit.author.date).toISOString().split('T')[0];
                activeDays.add(commitDate);
                
                const type = classifyCommit(c.commit.message);
                commitsByType[type]++;
                
                commits.push({
                    sha: c.sha,
                    message: c.commit.message.split('\n')[0], // First line only
                    date: c.commit.author.date,
                    type,
                    author: c.commit.author.name,
                });
            }
        } catch (err) {
            // Skip repos we can't access
            console.warn(`Could not fetch commits from ${repo.name}:`, err);
        }
    }

    const totalCommits = commits.length;
    const uniqueActiveDays = activeDays.size;
    const longestStreak = calculateLongestStreak(Array.from(activeDays));

    // Calculate score
    let score = 0;
    score += Math.min(totalCommits * 2, 40);
    score += Math.min(uniqueActiveDays * 3, 30);
    score += Math.min(longestStreak * 5, 20);
    score += Math.min(publicRepos * 0.5, 10);

    // Determine biome
    const biome = getBiomeFromScore(score);

    const seed = hashUsername(key);
    const mood = mapBiomeToMood(biome);

    const state: WeatherState = {
        repoName: key,
        commits,
        mood,
        seed,
        biome,
        score: Math.round(score),
        totalCommits,
        uniqueActiveDays,
        longestStreak,
        publicRepos,
        commitsByType,
    };

    cache[key] = state;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem(`cw_${key}`, JSON.stringify({
            data: state,
            timestamp: Date.now()
        }));
    }
    
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

function calculateLongestStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    
    const sorted = dates.sort();
    let longest = 1;
    let current = 1;
    
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            current++;
            longest = Math.max(longest, current);
        } else if (diffDays > 1) {
            current = 1;
        }
    }
    
    return longest;
}

function getBiomeFromScore(score: number): Biome {
    if (score === 0 || score < 10) return 'DEAD_DESERT';
    if (score < 25) return 'ICE_TUNDRA';
    if (score < 45) return 'SUBTROPICS';
    if (score < 70) return 'SPRING';
    return 'SUMMER';
}

function mapBiomeToMood(biome: Biome): WeatherMood {
    switch (biome) {
        case 'DEAD_DESERT': return 'fog'; // Dusty, hazy, lifeless desert
        case 'ICE_TUNDRA': return 'snow';
        case 'SUBTROPICS': return 'rain';
        case 'SPRING': return 'wind';
        case 'SUMMER': return 'sunny';
    }
}