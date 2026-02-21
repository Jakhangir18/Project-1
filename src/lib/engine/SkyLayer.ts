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
            case 'storm':
                // Desert storm: purple-pink-orange gradient (like the image)
                return [
                    [0.0, '#4a0e4e'],    // Deep purple top
                    [0.2, '#6b1f5c'],    // Purple-magenta
                    [0.35, '#8b2e66'],   // Magenta
                    [0.5, '#c2185b'],    // Red-pink
                    [0.65, '#d84315'],   // Orange-red
                    [0.8, '#f4511e'],    // Bright orange
                    [1.0, '#ff6f00'],    // Golden orange at horizon
                ];

            case 'sunny':
                // Vibrant summer day
                return [
                    [0.0, '#1e88e5'],    // Bright blue top
                    [0.3, '#42a5f5'],    // Sky blue
                    [0.6, '#64b5f6'],    // Light blue
                    [0.8, '#90caf9'],    // Pale blue
                    [1.0, '#bbdefb'],    // Near white at horizon
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

        // Sun for storm (desert) mood
        if (mood === 'storm') {
            this.drawDesertSun(ctx);
        }
    }

    private drawDesertSun(ctx: CanvasRenderingContext2D) {
        // Large bright sun in the sky (like the image)
        const cx = this.width * 0.5;
        const cy = this.height * 0.15;
        const radius = 60;

        // Outer glow
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2);
        glow.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
        glow.addColorStop(0.5, 'rgba(255, 200, 80, 0.2)');
        glow.addColorStop(1, 'rgba(255, 180, 60, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);

        // Main sun body
        const sunGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        sunGradient.addColorStop(0, '#fffacd');    // Light yellow center
        sunGradient.addColorStop(0.6, '#ffd54f');  // Golden
        sunGradient.addColorStop(1, '#ffb300');    // Orange edge

        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 15, 20, 0, Math.PI * 2);
        ctx.fill();
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
}
