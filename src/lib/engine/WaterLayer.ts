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

                // Shimmer: subtle sine offset for top row
                const shimmerOffset = (j === 0)
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
        // Water shimmer (animated)
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

        if (this.state.mood === 'sunny') {
            this.drawShips(ctx, waterY, assemblyT);
        }

        ctx.restore();
    }

    private getWaterColors(mood: WeatherMood): { surface: string; mid: string; deep: string } {
        switch (mood) {
            case 'sunny':
                // Summer sea
                return { surface: '#4fc3f7', mid: '#29b6f6', deep: '#0288d1' };
            case 'rain':
                return { surface: '#1565c0', mid: '#0d47a1', deep: '#0a3670' };
            case 'storm':
                return { surface: '#283593', mid: '#1a237e', deep: '#0d1347' };
            case 'snow':
                // Frozen — icy blue, nearly white
                return { surface: '#b3e5fc', mid: '#81d4fa', deep: '#4fc3f7' };
            case 'fog':
                return { surface: '#6b4423', mid: '#5a3a2a', deep: '#4a2c20' }; // Dry dust
            case 'wind':
                return { surface: '#42a5f5', mid: '#1e88e5', deep: '#1565c0' };
            default:
                return { surface: '#1565c0', mid: '#0d47a1', deep: '#0a3670' };
        }
    }

    private drawShips(ctx: CanvasRenderingContext2D, waterY: number, assemblyT: number) {
        const ships = [
            { anchor: 0.22, bob: 0.7, scale: 1.0 },
            { anchor: 0.58, bob: 0.9, scale: 1.2 },
            { anchor: 0.82, bob: 0.6, scale: 0.85 },
        ];

        ctx.save();
        ctx.globalAlpha = assemblyT * 0.9;

        ships.forEach((ship, i) => {
            const bs = this.blockSize * ship.scale;
            const x = this.width * ship.anchor + Math.sin(this.time * 0.2 + i) * 18;
            const y = waterY + bs * 0.5 - bs * (0.8 + i * 0.1) + Math.sin(this.time * 1.8 + i) * ship.bob;

            // Hull
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(x, y, bs * 3.4, bs * 0.7);
            ctx.fillRect(x + bs * 0.4, y - bs * 0.35, bs * 2.6, bs * 0.35);

            // Mast
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(x + bs * 1.6, y - bs * 2, bs * 0.2, bs * 2);

            // Sail
            ctx.fillStyle = '#fff8e1';
            ctx.fillRect(x + bs * 1.8, y - bs * 1.9, bs * 1.1, bs * 1.2);

            // Flag accent
            ctx.fillStyle = '#ffb74d';
            ctx.fillRect(x + bs * 1.8, y - bs * 2.05, bs * 0.45, bs * 0.22);
        });

        ctx.restore();
    }
}
