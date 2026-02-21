import { BaseLayer } from './Layer';
import { WeatherMood } from './types';

/**
 * SkyLayer — Rich multi-stop gradient sky with atmospheric haze.
 * Each mood has a unique 5+ stop gradient plus fog bands.
 */
export class SkyLayer extends BaseLayer {
    private time: number = 0;

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state) return;

        // Main sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        const stops = this.getGradientStops(this.state.mood);

        stops.forEach(([offset, color]) => {
            gradient.addColorStop(offset, color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.state.mood === 'wind') {
            this.drawWindClouds(ctx);
        }

        // Atmospheric haze near the ground
        this.drawAtmosphere(ctx, this.state.mood);
    }

    private getGradientStops(mood: WeatherMood): [number, string][] {
        switch (mood) {
            case 'sunny':
                // Evening sunset over the sea
                return [
                    [0.0, '#4a235a'],    // Deep purple-black top
                    [0.15, '#7b3ff2'],   // Purple
                    [0.3, '#c471ed'],    // Violet pink
                    [0.5, '#ff6b35'],    // Warm orange
                    [0.7, '#ffa751'],    // Golden orange
                    [1.0, '#ffb35c'],    // Warm horizon gold
                ];

            case 'rain':
                // Dark moody blue: navy → slate → grey
                return [
                    [0.0, '#0a0a1a'],    // Near black
                    [0.2, '#1a1a3e'],    // Dark navy
                    [0.4, '#2d3561'],    // Slate blue
                    [0.6, '#3d4f7c'],    // Medium blue
                    [0.8, '#546e8a'],    // Grey-blue
                    [1.0, '#37474f'],    // Dark grey at ground
                ];

            case 'storm':
                // Purple-black: black → deep purple → dark indigo
                return [
                    [0.0, '#050510'],    // Near black
                    [0.15, '#1a0a2e'],   // Dark purple
                    [0.3, '#2d1b69'],    // Deep purple
                    [0.5, '#1e1b4b'],    // Indigo
                    [0.7, '#312e81'],    // Medium indigo
                    [0.85, '#1e293b'],   // Dark slate
                    [1.0, '#0f172a'],    // Navy ground
                ];

            case 'snow':
                // Cold light: steel blue → lavender → white
                return [
                    [0.0, '#cfd8dc'],    // Light steel
                    [0.2, '#b0bec5'],    // Lighter steel
                    [0.4, '#90a4ae'],    // Cool grey
                    [0.6, '#b0bec5'],    // Medium steel blue
                    [0.8, '#cfd8dc'],    // Light
                    [1.0, '#eceff1'],    // Near white ground
                ];

            case 'fog':
                // Misty grey
                return [
                    [0.0, '#37474f'],
                    [0.3, '#455a64'],
                    [0.6, '#546e7a'],
                    [0.8, '#78909c'],
                    [1.0, '#90a4ae'],
                ];

            case 'wind':
                // Fresh spring daytime sky
                return [
                    [0.0, '#4f8fd6'],    // Deep sky blue
                    [0.2, '#6ea7e6'],    // Soft blue
                    [0.4, '#8bbdef'],    // Mid blue
                    [0.6, '#a7cdf6'],    // Light blue
                    [0.8, '#c8defb'],    // Very light blue
                    [1.0, '#f4d6e6'],    // Warm spring horizon
                ];

            default:
                return [
                    [0.0, '#0f0f0f'],
                    [1.0, '#1a1a1a'],
                ];
        }
    }

    private drawAtmosphere(ctx: CanvasRenderingContext2D, mood: WeatherMood) {
        // Horizontal haze bands near the horizon
        const hazeY = this.height * 0.6;
        const hazeHeight = this.height * 0.25;

        let hazeColor: string;
        let hazeAlpha: number;

        switch (mood) {
            case 'sunny':
                hazeColor = '255, 140, 80';
                hazeAlpha = 0.25;
                break;
            case 'rain':
                hazeColor = '80, 100, 140';
                hazeAlpha = 0.2;
                break;
            case 'storm':
                hazeColor = '50, 30, 80';
                hazeAlpha = 0.15;
                break;
            case 'snow':
                hazeColor = '200, 210, 220';
                hazeAlpha = 0.3;
                break;
            case 'fog':
                hazeColor = '150, 160, 170';
                hazeAlpha = 0.4;
                break;
            case 'wind':
                hazeColor = '238, 184, 206';
                hazeAlpha = 0.12;
                break;
            default:
                return;
        }

        const haze = ctx.createLinearGradient(0, hazeY, 0, hazeY + hazeHeight);
        haze.addColorStop(0, `rgba(${hazeColor}, 0)`);
        haze.addColorStop(0.5, `rgba(${hazeColor}, ${hazeAlpha})`);
        haze.addColorStop(1, `rgba(${hazeColor}, 0)`);

        ctx.fillStyle = haze;
        ctx.fillRect(0, hazeY, this.width, hazeHeight);

        // Sun rays for sunny mood
        if (mood === 'sunny') {
            this.drawSunRays(ctx);
        }
    }

    private drawSunRays(ctx: CanvasRenderingContext2D) {
        const cx = this.width * 0.45;
        const cy = this.height * 0.25;

        ctx.save();
        ctx.globalAlpha = 0.08;

        // Draw diagonal rays
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 0.6 - Math.PI * 0.1;
            const length = this.height * 1.5;

            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle - 0.04) * length,
                cy + Math.sin(angle - 0.04) * length
            );
            ctx.lineTo(
                cx + Math.cos(angle + 0.04) * length,
                cy + Math.sin(angle + 0.04) * length
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    private drawWindClouds(ctx: CanvasRenderingContext2D) {
        const clouds = [
            { x: this.width * 0.1, y: this.height * 0.14, w: 140, h: 34, speed: 10, alpha: 0.2 },
            { x: this.width * 0.35, y: this.height * 0.22, w: 170, h: 40, speed: 14, alpha: 0.18 },
            { x: this.width * 0.62, y: this.height * 0.16, w: 120, h: 30, speed: 12, alpha: 0.22 },
            { x: this.width * 0.8, y: this.height * 0.26, w: 160, h: 36, speed: 16, alpha: 0.16 },
        ];

        ctx.save();

        clouds.forEach(cloud => {
            const drift = (this.time * cloud.speed) % (this.width + cloud.w * 2);
            const baseX = cloud.x + drift - cloud.w;

            for (let pass = 0; pass < 2; pass++) {
                const x = pass === 0 ? baseX : baseX - (this.width + cloud.w * 1.4);
                this.drawCloudCluster(ctx, x, cloud.y, cloud.w, cloud.h, cloud.alpha);
            }
        });

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const y = this.height * 0.18 + i * (this.height * 0.06);
            const offset = ((this.time * 120) + i * 80) % (this.width + 100);
            ctx.beginPath();
            ctx.moveTo(offset - 100, y);
            ctx.lineTo(offset - 20, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    private drawCloudCluster(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        alpha: number,
    ) {
        const color = `rgba(255, 245, 252, ${alpha})`;
        ctx.fillStyle = color;

        ctx.fillRect(x, y, width * 0.45, height * 0.5);
        ctx.fillRect(x + width * 0.2, y - height * 0.2, width * 0.35, height * 0.55);
        ctx.fillRect(x + width * 0.45, y - height * 0.1, width * 0.4, height * 0.5);
        ctx.fillRect(x + width * 0.7, y, width * 0.28, height * 0.42);
    }
}
