import { BaseLayer } from './Layer';
import { WeatherMood } from './types';

/**
 * SkyLayer — Rich multi-stop gradient sky with atmospheric haze.
 * Each mood has a unique 5+ stop gradient plus fog bands.
 */
export class SkyLayer extends BaseLayer {

    update() {
        // Static sky, no per-frame update needed
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

        // Atmospheric haze near the ground
        this.drawAtmosphere(ctx, this.state.mood);
    }

    private getGradientStops(mood: WeatherMood): [number, string][] {
        switch (mood) {
            case 'sunny':
                // Warm sunset: peach → coral → deep orange → warm horizon
                return [
                    [0.0, '#1a0a2e'],    // Deep purple-black top
                    [0.15, '#3d1752'],   // Purple
                    [0.35, '#c2185b'],   // Rose
                    [0.55, '#e65100'],   // Deep orange
                    [0.75, '#ff8f00'],   // Amber
                    [0.90, '#ffcc02'],   // Golden horizon
                    [1.0, '#fff8e1'],    // Warm white ground
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
                // Cool teal twilight
                return [
                    [0.0, '#004d40'],    // Deep teal
                    [0.2, '#00695c'],    // Teal
                    [0.4, '#00796b'],    // Medium teal
                    [0.6, '#00897b'],    // Lighter teal
                    [0.8, '#26a69a'],    // Pale teal
                    [1.0, '#4db6ac'],    // Light horizon
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
                hazeColor = '255, 200, 100';
                hazeAlpha = 0.15;
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
                hazeColor = '50, 160, 150';
                hazeAlpha = 0.15;
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
        const cy = this.height * 0.2;

        ctx.save();
        ctx.globalAlpha = 0.08;

        // Draw diagonal rays
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 0.6 - Math.PI * 0.1;
            const length = this.height * 1.2;

            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle - 0.03) * length,
                cy + Math.sin(angle - 0.03) * length
            );
            ctx.lineTo(
                cx + Math.cos(angle + 0.03) * length,
                cy + Math.sin(angle + 0.03) * length
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
