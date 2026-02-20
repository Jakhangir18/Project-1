
export type WeatherMood = 'sunny' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind';

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
}

export interface Layer {
    resize(width: number, height: number): void;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}
