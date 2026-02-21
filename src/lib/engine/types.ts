
export type WeatherMood = 'sunny' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind';

export type Biome = 'DEAD_DESERT' | 'ICE_TUNDRA' | 'SUBTROPICS' | 'SPRING' | 'SUMMER';

export type CommitType = 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'other';

export interface CommitData {
    sha: string;
    message: string;
    date: string;
    type: CommitType;
    author: string;
}

export interface WeatherState {
    mood: WeatherMood;
    commits: CommitData[];
    repoName: string;
    seed: number;
    // Extended fields for biome system
    biome: Biome;
    score: number;
    totalCommits: number;
    uniqueActiveDays: number;
    longestStreak: number;
    publicRepos: number;
    commitsByType: Record<CommitType, number>;
}

export interface Layer {
    resize(width: number, height: number): void;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}
