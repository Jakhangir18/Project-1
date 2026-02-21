import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

/**
 * WaterLayer — A horizontal river/lake strip with shimmer animation.
 */
export class WaterLayer extends BaseLayer {
    private time: number = 0;
    private blockSize: number = 16;
    private assemblyTime: number = 0;

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood) {
            this.assemblyTime = 0;
        }
    }

    update(dt: number) {
        this.time += dt;
        if (this.assemblyTime < 4) {
            this.assemblyTime += dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state) return;

        // Assembly delay — water appears after terrain
        const assemblyT = Math.max(0, Math.min(1, (this.assemblyTime - 1.8) / 1.0));
        if (assemblyT <= 0) return;

        const waterY = this.height * 0.75 + 6 * 16; // Lower by 6 blocks total
        const palette = this.getWaterColors(this.state.mood);
        const cols = Math.ceil(this.width / this.blockSize);

        // Fade in
        ctx.save();
        ctx.globalAlpha = assemblyT;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < 4; j++) {
                const x = i * this.blockSize;
                const y = waterY + j * this.blockSize;

                // Shimmer: subtle sine offset for top row (disable for desert)
                const shimmerOffset = (j === 0 && this.state.mood !== 'sunny')
                    ? Math.sin(this.time * 2 + i * 0.3) * 2
                    : 0;

                // Top row is lighter (surface), deeper rows are darker
                const color = j === 0 ? palette.surface : j === 1 ? palette.mid : palette.deep;

                ctx.globalAlpha = assemblyT * (j === 0 ? 0.7 : 0.85);
                BlockRenderer.drawBlock(
                    ctx,
                    x,
                    y + shimmerOffset,
                    this.blockSize,
                    color,
                    { topHighlight: j === 0, rightShadow: false }
                );
            }
        }

        // Surface detail
        if (this.state.mood !== 'sunny') {
            // Water Shimmer (animated)
            ctx.globalAlpha = assemblyT * 0.15;
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < cols; i++) {
                const shimmer = Math.sin(this.time * 3 + i * 0.5) * 0.5 + 0.5;
                if (shimmer > 0.7) {
                    ctx.fillRect(
                        i * this.blockSize,
                        waterY + Math.sin(this.time * 2 + i * 0.3) * 2,
                        this.blockSize,
                        2
                    );
                }
            }
        } else {
            // Cracked earth for dry riverbed
            ctx.globalAlpha = assemblyT * 0.5;
            ctx.strokeStyle = '#8b6b5d'; // Dark brown cracks
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < cols; i++) {
                const xOffset = i * this.blockSize;
                if (i % 2 === 0) {
                    ctx.moveTo(xOffset + 2, waterY + 4);
                    ctx.lineTo(xOffset + 8, waterY + 12);
                    ctx.lineTo(xOffset + 14, waterY + 6);
                } else {
                    ctx.moveTo(xOffset + 4, waterY + 14);
                    ctx.lineTo(xOffset + 10, waterY + 2);
                    ctx.lineTo(xOffset + 16, waterY + 10);
                }
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    private getWaterColors(mood: WeatherMood): { surface: string; mid: string; deep: string } {
        switch (mood) {
            case 'sunny':
                // Dry cracked earth riverbed
                return { surface: '#d4a373', mid: '#cc8e5e', deep: '#a47148' };
            case 'rain':
                return { surface: '#1565c0', mid: '#0d47a1', deep: '#0a3670' };
            case 'storm':
                return { surface: '#283593', mid: '#1a237e', deep: '#0d1347' };
            case 'snow':
                // Frozen — icy blue, nearly white
                return { surface: '#b3e5fc', mid: '#81d4fa', deep: '#4fc3f7' };
            case 'fog':
                return { surface: '#546e7a', mid: '#455a64', deep: '#37474f' };
            case 'wind':
                return { surface: '#42a5f5', mid: '#1e88e5', deep: '#1565c0' };
            default:
                return { surface: '#1565c0', mid: '#0d47a1', deep: '#0a3670' };
        }
    }
}
