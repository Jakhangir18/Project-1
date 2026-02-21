import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

interface VoxelCactus {
    x: number;
    size: number;
    delay: number;
    depth: number;
    hasLeftArm: boolean;
    hasRightArm: boolean;
}

export class CactusLayer extends BaseLayer {
    private cacti: VoxelCactus[] = [];
    private blockSize: number = 16;
    private time: number = 0;

    resize(width: number, height: number) {
        super.resize(width, height);
        this.generateCacti();
    }

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood) {
            this.generateCacti();
            this.time = 0;
        }
    }

    private generateCacti() {
        this.cacti = [];
        if (!this.width || !this.state || this.state.mood !== 'storm') return; // storm = Desert

        const count = 8 + Math.floor(this.width / 150);

        for (let i = 0; i < count; i++) {
            const x = 30 + Math.random() * (this.width - 60);
            const gridX = Math.floor(x / this.blockSize) * this.blockSize;
            const depth = Math.random();

            this.cacti.push({
                x: gridX,
                size: 0.7 + Math.random() * 0.6,
                delay: 2.0 + Math.random() * 1.5,
                depth,
                hasLeftArm: Math.random() > 0.3,
                hasRightArm: Math.random() > 0.3,
            });
        }

        // Sort by depth (draw background trees first)
        this.cacti.sort((a, b) => b.depth - a.depth);
    }

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state || this.state.mood !== 'storm') return;

        const palette = {
            trunk: '#2e7d32',   // Cactus body
            leaves: '#388e3c',  // Cactus highlights
            leavesDark: '#1b5e20',
        };

        this.cacti.forEach(cactus => {
            // Smooth ease out instead of elastic pop to stop strange bouncing movement on tall cacti
            const t = Math.max(0, Math.min(1, (this.time - cactus.delay) / 0.8));
            if (t <= 0) return;

            const scale = 1 - Math.pow(1 - t, 3); // Ease out cubic
            const depthScale = 0.6 + (1 - cactus.depth) * 0.4;
            const bs = Math.round(this.blockSize * cactus.size * depthScale);
            const groundY = this.getGroundY(cactus.x);

            ctx.save();
            ctx.globalAlpha = 0.7 + (1 - cactus.depth) * 0.3;

            const centerX = cactus.x + bs / 2;
            ctx.translate(centerX, groundY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -groundY);

            this.drawCactus(ctx, cactus, groundY, bs, palette);

            ctx.restore();
        });
    }

    private drawCactus(ctx: CanvasRenderingContext2D, cactus: VoxelCactus, groundY: number, bs: number, palette: any) {
        const x = cactus.x;
        const y = groundY;

        // Main Body: 1 block wide, 3-5 blocks tall
        const height = 4;
        for (let j = 0; j < height; j++) {
            BlockRenderer.drawBlock(ctx, x, y - (j + 1) * bs, bs, palette.trunk, { topHighlight: j === height - 1 });
        }

        // Left arm (optional)
        if (cactus.hasLeftArm) {
            const armY = y - 2 * bs;
            BlockRenderer.drawBlock(ctx, x - bs, armY, bs, palette.leavesDark); // horizontal
            BlockRenderer.drawBlock(ctx, x - bs, armY - bs, bs, palette.trunk, { topHighlight: true }); // vertical
        }

        // Right arm (optional)
        if (cactus.hasRightArm) {
            const armY = y - 3 * bs;
            BlockRenderer.drawBlock(ctx, x + bs, armY, bs, palette.leaves); // horizontal
            BlockRenderer.drawBlock(ctx, x + bs, armY - bs, bs, palette.trunk, { topHighlight: true }); // vertical
        }
    }

    private getGroundY(x: number): number {
        if (this.width === 0) return this.height;

        const cols = Math.ceil(this.width / this.blockSize);
        const i = Math.floor(x / this.blockSize);
        const nx = i / cols;

        const baseBlocks = 6;
        const variation = Math.sin(nx * 8) * 2 + Math.sin(nx * 20) * 0.5;
        const totalBlocks = Math.max(3, Math.round(baseBlocks + variation));

        return this.height - totalBlocks * this.blockSize;
    }
}
