import { BaseLayer } from './Layer';
import { CommitData, CommitType } from './types';

interface CommitColumn {
    x: number;
    particles: { y: number; speed: number; alpha: number; size: number }[];
    color: string;
    glowColor: string;
    commits: CommitData[];   // Commits in this column
    delay: number;
}

/**
 * FireflySystem — Vertical glowing commit columns rising from the ground.
 * Each column represents a group of commits, color-coded by type.
 */
export class FireflySystem extends BaseLayer {
    private columns: CommitColumn[] = [];
    private hoveredColumn: CommitColumn | null = null;
    private time: number = 0;

    private colors: Record<CommitType, { main: string; glow: string }> = {
        feat: { main: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
        fix: { main: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
        refactor: { main: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
        docs: { main: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' },
        test: { main: '#e0f2fe', glow: 'rgba(224, 242, 254, 0.3)' },
        other: { main: '#a78bfa', glow: 'rgba(167, 139, 250, 0.3)' },
    };

    resize(width: number, height: number) {
        super.resize(width, height);
    }

    setWeather(state: any) {
        super.setWeather(state);
        this.initColumns();
        this.time = 0;
    }

    private initColumns() {
        if (!this.state || !this.state.commits || !this.width) return;

        this.columns = [];
        const commits = this.state.commits.slice(0, 100);
        if (commits.length === 0) return;

        // Group commits by type for columns
        const groups: Record<CommitType, CommitData[]> = {
            feat: [], fix: [], refactor: [], docs: [], test: [], other: []
        };
        commits.forEach(c => groups[c.type].push(c));

        // Create a column for each non-empty group
        const types = Object.keys(groups) as CommitType[];
        const activeTypes = types.filter(t => groups[t].length > 0);
        const spacing = this.width / (activeTypes.length + 1);

        activeTypes.forEach((type, idx) => {
            const x = spacing * (idx + 1);
            const particleCount = Math.min(groups[type].length, 20);

            const particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    y: this.height + Math.random() * this.height, // Start below screen
                    speed: 30 + Math.random() * 40,
                    alpha: 0.4 + Math.random() * 0.6,
                    size: 3 + Math.random() * 4,
                });
            }

            this.columns.push({
                x,
                particles,
                color: this.colors[type].main,
                glowColor: this.colors[type].glow,
                commits: groups[type],
                delay: 2.5 + idx * 0.3,
            });
        });
    }

    checkHit(x: number, y: number): CommitData | null {
        for (const col of this.columns) {
            if (Math.abs(x - col.x) < 25) {
                this.hoveredColumn = col;
                // Return the first commit in this group
                return col.commits[0] || null;
            }
        }
        this.hoveredColumn = null;
        return null;
    }

    update(dt: number) {
        this.time += dt;

        this.columns.forEach(col => {
            if (this.time < col.delay) return;

            col.particles.forEach(p => {
                p.y -= p.speed * dt;

                // Reset particle when it goes above screen
                if (p.y < -20) {
                    p.y = this.height + 10;
                    p.alpha = 0.4 + Math.random() * 0.6;
                }
            });
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.columns.forEach(col => {
            if (this.time < col.delay) return;

            const fadeIn = Math.min(1, (this.time - col.delay) / 1.5);

            // Column glow line (background)
            ctx.save();
            ctx.globalAlpha = fadeIn * 0.15;
            ctx.strokeStyle = col.color;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(col.x, this.height);
            ctx.lineTo(col.x, 0);
            ctx.stroke();
            ctx.restore();

            // Wider ambient glow
            ctx.save();
            ctx.globalAlpha = fadeIn * 0.05;
            const grad = ctx.createLinearGradient(col.x - 30, 0, col.x + 30, 0);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.5, col.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(col.x - 30, 0, 60, this.height);
            ctx.restore();

            // Particles rising in the column
            col.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = fadeIn * p.alpha;

                // Glow around particle
                const glowSize = p.size * 3;
                const particleGrad = ctx.createRadialGradient(col.x, p.y, p.size, col.x, p.y, glowSize);
                particleGrad.addColorStop(0, col.color);
                particleGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = particleGrad;
                ctx.fillRect(col.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);

                // Core particle (square for voxel style)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(col.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

                ctx.restore();
            });

            // Hover highlight
            if (this.hoveredColumn === col) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(col.x, this.height);
                ctx.lineTo(col.x, 0);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        });
    }
}
