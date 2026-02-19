import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood } from './types';

/**
 * WaterLayer — A horizontal river/lake strip with shimmer animation.
 */
export class WaterLayer extends BaseLayer {
    private time: number = 0;
    private blockSize: number = 16;
    private assemblyTime: number = 0;

    setWeather(state: any) {
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

        const waterY = this.height * 0.75;
        const waterHeight = this.blockSize * 3;

        const palette = this.getWaterColors(this.state.mood);
        const cols = Math.ceil(this.width / this.blockSize);

        // Fade in
        ctx.save();
        ctx.globalAlpha = assemblyT;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < 3; j++) {
                const x = i * this.blockSize;
                const y = waterY + j * this.blockSize;

                // Shimmer: subtle sine offset for top row
                const shimmerOffset = j === 0
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

        // Surface highlight (animated)
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

        ctx.restore();
    }

    private getWaterColors(mood: WeatherMood): { surface: string; mid: string; deep: string } {
        switch (mood) {
            case 'sunny':
                return { surface: '#00acc1', mid: '#00838f', deep: '#006064' };
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
                return { surface: '#00897b', mid: '#00796b', deep: '#00695c' };
            default:
                return { surface: '#1565c0', mid: '#0d47a1', deep: '#0a3670' };
        }
    }
}
