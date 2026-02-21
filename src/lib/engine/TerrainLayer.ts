import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

/**
 * TerrainLayer — Multi-layer ground with grass/dirt/stone block types
 * and stepped height variations.
 */
export class TerrainLayer extends BaseLayer {
    private columns: { x: number; height: number; delay: number }[] = [];
    private blockSize: number = 16;
    private time: number = 0;

    private generateTerrain(width: number) {
        this.columns = [];
        const cols = Math.ceil(width / this.blockSize);

        for (let i = 0; i < cols; i++) {
            const x = i * this.blockSize;
            const nx = i / cols;

            // Stepped terrain with gentle variation
            // Base is about 20% of canvas height from bottom
            const baseBlocks = 6;
            const variation = Math.sin(nx * 8) * 2 + Math.sin(nx * 20) * 0.5;
            const totalBlocks = Math.max(3, Math.round(baseBlocks + variation));

            // Assembly delay — left to right wave
            const delay = nx * 1.2;

            this.columns.push({ x, height: totalBlocks, delay });
        }
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        this.generateTerrain(width);
    }

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood || this.columns.length === 0) {
            this.generateTerrain(this.width);
            this.time = 0;
        }
    }

    update(dt: number) {
        if (this.time < 4) {
            this.time += dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.columns.length || !this.state) return;

        const palette = this.getBlockPalette(this.state.mood);

        this.columns.forEach(col => {
            // Assembly animation
            const t = Math.max(0, Math.min(1, (this.time - col.delay) / 1.0));
            const ease = 1 - Math.pow(1 - t, 3);
            if (t <= 0) return;

            const visibleBlocks = Math.round(col.height * ease);
            if (visibleBlocks <= 0) return;

            for (let j = 0; j < visibleBlocks; j++) {
                const by = this.height - (j + 1) * this.blockSize;
                const blockFromTop = visibleBlocks - 1 - j;

                // Block type: grass (top 1) → dirt (next 2) → stone (rest)
                let color: string;
                if (blockFromTop === 0) {
                    color = palette.grass;
                } else if (blockFromTop <= 2) {
                    color = palette.dirt;
                } else {
                    color = palette.stone;
                }

                BlockRenderer.drawBlock(ctx, col.x, by, this.blockSize, color);

                // Fallen sakura petals in Spring
                if (blockFromTop === 0 && this.state?.mood === 'wind') {
                    const colIndex = Math.floor(col.x / this.blockSize);
                    const petalMask = colIndex % 6;

                    if (petalMask === 1 || petalMask === 4) {
                        ctx.save();
                        ctx.globalAlpha = 0.55;
                        ctx.fillStyle = petalMask === 1 ? '#ce93d8' : '#ba68c8';

                        ctx.fillRect(col.x + 2, by + 2, 4, 2);
                        if (colIndex % 3 === 0) {
                            ctx.fillRect(col.x + 9, by + 4, 3, 2);
                        }

                        ctx.restore();
                    }
                }
            }
        });
    }

    private getBlockPalette(mood: WeatherMood): { grass: string; dirt: string; stone: string } {
        switch (mood) {
            case 'sunny': // Dead Desert
                return { grass: '#f2d59b', dirt: '#d2b27b', stone: '#b89b6a' }; // Beach sand layers
            case 'rain':
                return { grass: '#2e7d32', dirt: '#5d4037', stone: '#37474f' };
            case 'storm':
                return { grass: '#388e3c', dirt: '#4e342e', stone: '#1a1a2e' };
            case 'snow':
                return { grass: '#eceff1', dirt: '#b0bec5', stone: '#78909c' };
            case 'fog':
                return { grass: '#546e7a', dirt: '#455a64', stone: '#37474f' };
            case 'wind':
                return { grass: '#66bb6a', dirt: '#795548', stone: '#546e7a' };
            default:
                return { grass: '#4caf50', dirt: '#795548', stone: '#455a64' };
        }
    }
}
