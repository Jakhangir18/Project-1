import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood } from './types';

interface MountainBlock {
    x: number;
    y: number;
    height: number;  // In blocks
    delay: number;
    colorOffset: number;
}

interface MountainRange {
    blocks: MountainBlock[];
    scale: number;       // 1.0 = foreground, 0.6 = background
    alphaMultiplier: number;
}

/**
 * MountainLayer — Two parallax mountain ranges with multi-block-type rendering.
 * Each column has grass/snow on top, dirt/rock in middle, stone at bottom.
 */
export class MountainLayer extends BaseLayer {
    private ranges: MountainRange[] = [];
    private blockSize: number = 16;
    private time: number = 0;
    private animationDuration: number = 2.0;

    private seededRandom(seed: number) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    private generateMountains(width: number, seedStr: string) {
        this.ranges = [];
        let seed = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const cols = Math.ceil(width / this.blockSize);

        // Background range (far mountains, smaller, more muted)
        const bgBlocks: MountainBlock[] = [];
        for (let i = 0; i < cols; i++) {
            const x = i * this.blockSize;
            const nx = i / cols;

            const n1 = Math.sin(nx * 4 + seed * 1.3) * 0.5 + 0.5;
            const n2 = Math.sin(nx * 12 + seed * 2.7) * 0.5 + 0.5;

            let h = this.height * 0.15;
            h += n1 * this.height * 0.35;
            h += n2 * this.height * 0.05;

            const blockHeight = Math.floor(h / this.blockSize);
            const centerDist = Math.abs(nx - 0.5);
            const delay = centerDist * 1.2;

            bgBlocks.push({
                x,
                y: this.height - blockHeight * this.blockSize,
                height: blockHeight,
                delay,
                colorOffset: (this.seededRandom(seed + i + 1000) - 0.5) * 15
            });
        }

        // Foreground range (closer, taller, more detailed)
        const fgBlocks: MountainBlock[] = [];
        for (let i = 0; i < cols; i++) {
            const x = i * this.blockSize;
            const nx = i / cols;

            const n1 = Math.sin(nx * 5 + seed) * 0.5 + 0.5;
            const n2 = Math.sin(nx * 15 + seed * 2) * 0.5 + 0.5;
            const n3 = Math.sin(nx * 30 + seed * 3) * 0.5 + 0.5;

            let h = this.height * 0.2;
            h += n1 * this.height * 0.45;
            h += n2 * this.height * 0.1;
            h += n3 * this.height * 0.04;

            const blockHeight = Math.floor(h / this.blockSize);
            const centerDist = Math.abs(nx - 0.5);
            const delay = centerDist * 1.5;

            fgBlocks.push({
                x,
                y: this.height - blockHeight * this.blockSize,
                height: blockHeight,
                delay,
                colorOffset: (this.seededRandom(seed + i) - 0.5) * 20
            });
        }

        this.ranges = [
            { blocks: bgBlocks, scale: 0.7, alphaMultiplier: 0.5 },
            { blocks: fgBlocks, scale: 1.0, alphaMultiplier: 1.0 },
        ];
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        if (this.state) {
            this.generateMountains(width, this.state.repoName);
        }
    }

    setWeather(state: any) {
        const oldRepo = this.state?.repoName;
        const oldMood = this.state?.mood;
        super.setWeather(state);

        if (oldRepo !== state.repoName || oldMood !== state.mood || this.ranges.length === 0) {
            this.generateMountains(this.width, state.repoName);
            this.time = 0;
        }
    }

    update(dt: number) {
        if (this.time < this.animationDuration + 2) {
            this.time += dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.ranges.length) return;

        const palette = this.getPalette(this.state?.mood || 'storm');

        this.ranges.forEach(range => {
            ctx.save();
            ctx.globalAlpha = range.alphaMultiplier;

            range.blocks.forEach(block => {
                // Assembly animation
                const t = Math.max(0, Math.min(1, (this.time - block.delay) / 1.5));
                const ease = 1 - Math.pow(1 - t, 3);
                if (t <= 0) return;

                const totalBlocks = Math.round(block.height * ease);
                if (totalBlocks <= 0) return;

                // Draw each block in the column with appropriate type
                for (let j = 0; j < totalBlocks; j++) {
                    const by = this.height - (j + 1) * this.blockSize;
                    const blockFromTop = totalBlocks - 1 - j;

                    // Determine block type based on position from top
                    let color: string;
                    if (blockFromTop === 0) {
                        // Top block — snow cap or grass
                        color = palette.top;
                    } else if (blockFromTop <= 2) {
                        // Near top — dirt/transition
                        color = palette.mid;
                    } else {
                        // Body — stone/rock
                        color = palette.base;
                    }

                    BlockRenderer.drawBlock(ctx, block.x, by, this.blockSize, color);
                }
            });

            ctx.restore();
        });
    }

    private getPalette(mood: WeatherMood): { top: string; mid: string; base: string } {
        switch (mood) {
            case 'sunny':
                return {
                    top: '#8d6e63',   // Warm brown (sandstone top)
                    mid: '#6d4c41',   // Dark brown
                    base: '#4e342e',  // Deep brown stone
                };
            case 'rain':
                return {
                    top: '#4caf50',   // Green grass top
                    mid: '#5d4037',   // Dark dirt
                    base: '#37474f',  // Slate stone
                };
            case 'storm':
                return {
                    top: '#388e3c',   // Dark green
                    mid: '#4e342e',   // Brown
                    base: '#1a1a2e',  // Very dark
                };
            case 'snow':
                return {
                    top: '#eceff1',   // Snow white
                    mid: '#b0bec5',   // Light grey
                    base: '#78909c',  // Grey stone
                };
            case 'fog':
                return {
                    top: '#78909c',
                    mid: '#546e7a',
                    base: '#455a64',
                };
            case 'wind':
                return {
                    top: '#26a69a',
                    mid: '#00897b',
                    base: '#00695c',
                };
            default:
                return { top: '#546e7a', mid: '#37474f', base: '#263238' };
        }
    }
}
