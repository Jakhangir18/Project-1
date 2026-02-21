import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

interface PyramidBlock {
    x: number;
    y: number;
    height: number;
    delay: number;
    colorOffset: number;
}

interface PyramidRange {
    blocks: PyramidBlock[];
    scale: number;
    alphaMultiplier: number;
}

export class PyramidLayer extends BaseLayer {
    private ranges: PyramidRange[] = [];
    private blockSize: number = 16;
    private time: number = 0;
    private animationDuration: number = 2.0;

    private seededRandom(seed: number) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    private generatePyramids(width: number, seedStr: string) {
        this.ranges = [];
        if (!this.state || this.state.mood !== 'storm') return; // Only process 'storm' (desert)

        const seed = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const cols = Math.ceil(width / this.blockSize);

        // Helper to generate a single pyramid in a block array
        const createPyramid = (centerX: number, baseWidth: number, baseHeightOffset: number, delayBase: number, targetBlocks: PyramidBlock[]) => {
            const centerCol = Math.floor(centerX / this.blockSize);
            const halfWidth = Math.floor(baseWidth / 2);

            for (let i = -halfWidth; i <= halfWidth; i++) {
                const col = centerCol + i;
                if (col < 0 || col >= cols) continue;

                const distFromCenter = Math.abs(i);
                if (distFromCenter >= halfWidth) continue;

                const heightInBlocks = halfWidth - distFromCenter + baseHeightOffset;

                targetBlocks.push({
                    x: col * this.blockSize,
                    y: this.height - heightInBlocks * this.blockSize,
                    height: heightInBlocks,
                    delay: delayBase + distFromCenter * 0.1,
                    colorOffset: 0
                });
            }
        };

        const bgBlocks: PyramidBlock[] = [];
        let cx = width * 0.2;
        createPyramid(cx, 16, 4, 1.0, bgBlocks);

        cx = width * 0.75;
        createPyramid(cx, 24, 6, 1.2, bgBlocks);

        for (let i = 0; i < cols; i++) {
            if (!bgBlocks.find(b => b.x === i * this.blockSize)) {
                bgBlocks.push({
                    x: i * this.blockSize,
                    y: this.height - 3 * this.blockSize,
                    height: 3,
                    delay: 1.5,
                    colorOffset: 0
                });
            }
        }

        const fgBlocks: PyramidBlock[] = [];
        cx = width * 0.1;
        createPyramid(cx, 26, 3, 1.5, fgBlocks);

        cx = width * 0.55;
        createPyramid(cx, 34, 5, 1.8, fgBlocks);

        cx = width * 0.9;
        createPyramid(cx, 20, 2, 2.0, fgBlocks);

        for (let i = 0; i < cols; i++) {
            if (!fgBlocks.find(b => b.x === i * this.blockSize)) {
                fgBlocks.push({
                    x: i * this.blockSize,
                    y: this.height - 2 * this.blockSize,
                    height: 2,
                    delay: 2.2,
                    colorOffset: 0
                });
            }
        }

        this.ranges = [
            { blocks: bgBlocks, scale: 0.7, alphaMultiplier: 0.6 },
            { blocks: fgBlocks, scale: 1.0, alphaMultiplier: 1.0 },
        ];
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        if (this.state) {
            this.generatePyramids(width, this.state.repoName);
        }
    }

    setWeather(state: WeatherState) {
        const oldRepo = this.state?.repoName;
        const oldMood = this.state?.mood;
        super.setWeather(state);

        if (oldRepo !== state.repoName || oldMood !== state.mood || this.ranges.length === 0) {
            this.generatePyramids(this.width, state.repoName);
            this.time = 0;
        }
    }

    update(dt: number) {
        if (this.time < this.animationDuration + 2) {
            this.time += dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.ranges.length || this.state?.mood !== 'storm') return;

        // Sandstone/brown palette
        const palette = {
            top: '#d4a373',
            mid: '#cc8e5e',
            base: '#a47148',
        };

        this.ranges.forEach(range => {
            ctx.save();
            ctx.globalAlpha = range.alphaMultiplier;

            range.blocks.forEach(block => {
                const t = Math.max(0, Math.min(1, (this.time - block.delay) / 1.5));
                const ease = 1 - Math.pow(1 - t, 3);
                if (t <= 0) return;

                const totalBlocks = Math.round(block.height * ease);
                if (totalBlocks <= 0) return;

                for (let j = 0; j < totalBlocks; j++) {
                    const by = this.height - (j + 1) * this.blockSize;
                    const blockFromTop = totalBlocks - 1 - j;

                    let color: string;
                    if (blockFromTop === 0) color = palette.top;
                    else if (blockFromTop <= 2) color = palette.mid;
                    else color = palette.base;

                    BlockRenderer.drawBlock(ctx, block.x, by, this.blockSize, color);
                }
            });

            ctx.restore();
        });
    }
}
