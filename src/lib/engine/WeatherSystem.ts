import { BaseLayer } from './Layer';
import { WeatherMood, WeatherState } from './types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    type: 'rain' | 'snow' | 'fog' | 'sun-dust' | 'wind';
}

interface LightningBolt {
    segments: { x1: number; y1: number; x2: number; y2: number }[];
    alpha: number;
    timer: number;
}

/**
 * WeatherSystem — Enhanced particles + drawn zigzag lightning bolts.
 * Square sun, square snow, improved rain, actual lightning shape.
 */
export class WeatherSystem extends BaseLayer {
    private particles: Particle[] = [];
    private lightning: LightningBolt | null = null;
    private stormTimer: number = 3;
    private time: number = 0;

    constructor() {
        super();
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        this.particles = [];
        this.initParticles();
    }

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood) {
            this.particles = [];
            this.initParticles();
            this.time = 0;
        }
    }

    private initParticles() {
        if (!this.state || this.width === 0) return;

        const count = this.getParticleCount(this.state.mood);
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(this.state.mood));
        }
    }

    private getParticleCount(mood: WeatherMood): number {
        switch (mood) {
            case 'rain': return 250;
            case 'snow': return 150;
            case 'storm': return 350;
            case 'wind': return 60;
            case 'fog': return 6;
            case 'sunny': return 30;
            default: return 0;
        }
    }

    private createParticle(mood: WeatherMood): Particle {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;

        switch (mood) {
            case 'rain':
            case 'storm':
                return {
                    x, y,
                    vx: -1.5 + Math.random() * -2,
                    vy: 12 + Math.random() * 8,
                    size: 12 + Math.random() * 10,
                    alpha: 0.15 + Math.random() * 0.3,
                    type: 'rain',
                };
            case 'snow':
                return {
                    x, y,
                    vx: Math.sin(Math.random() * Math.PI * 2) * 0.5,
                    vy: 0.8 + Math.random() * 1.5,
                    size: 3 + Math.random() * 4,
                    alpha: 0.4 + Math.random() * 0.5,
                    type: 'snow',
                };
            case 'wind':
                return {
                    x, y,
                    vx: 8 + Math.random() * 8,
                    vy: 0,
                    size: 0,
                    alpha: 0.2,
                    type: 'wind',
                };
            case 'fog':
                return {
                    x, y,
                    vx: 0.15 + Math.random() * 0.1,
                    vy: 0,
                    size: 150 + Math.random() * 100,
                    alpha: 0.06 + Math.random() * 0.04,
                    type: 'fog',
                };
            case 'sunny':
                return {
                    x, y,
                    vx: 0,
                    vy: -0.3 - Math.random() * 0.3,
                    size: 3 + Math.random() * 3,
                    alpha: 0.3 + Math.random() * 0.4,
                    type: 'sun-dust',
                };
            default:
                return { x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0, type: 'rain' };
        }
    }

    private generateLightning(): LightningBolt {
        const startX = this.width * 0.2 + Math.random() * this.width * 0.6;
        const segments: LightningBolt['segments'] = [];

        let x = startX;
        let y = 0;
        const endY = this.height * (0.5 + Math.random() * 0.3);
        const steps = 8 + Math.floor(Math.random() * 6);
        const stepY = endY / steps;

        for (let i = 0; i < steps; i++) {
            const nx = x + (Math.random() - 0.5) * 80;
            const ny = y + stepY;
            segments.push({ x1: x, y1: y, x2: nx, y2: ny });
            x = nx;
            y = ny;

            // Branch (50% chance)
            if (Math.random() > 0.6 && i > 2) {
                const bx = x + (Math.random() - 0.5) * 60;
                const by = y + stepY * 0.7;
                segments.push({ x1: x, y1: y, x2: bx, y2: by });
            }
        }

        return { segments, alpha: 1, timer: 0.3 };
    }

    update(dt: number) {
        if (!this.state) return;
        this.time += dt;

        // Delay before particles start (let world assemble)
        if (this.time < 2.5) return;

        // Lightning
        if (this.state.mood === 'storm' || this.state.mood === 'rain') {
            this.stormTimer -= dt;
            if (this.stormTimer <= 0) {
                this.stormTimer = 3 + Math.random() * 5;
                this.lightning = this.generateLightning();
            }
        }

        if (this.lightning) {
            this.lightning.timer -= dt;
            this.lightning.alpha = Math.max(0, this.lightning.timer / 0.3);
            if (this.lightning.timer <= 0) {
                this.lightning = null;
            }
        }

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (this.state?.mood === 'snow') {
                p.x += Math.sin(p.y * 0.01 + this.time) * 0.3;
            }

            // Wrap
            if (p.y > this.height + 10) {
                p.y = -p.size;
                p.x = Math.random() * this.width;
            }
            if (p.x > this.width + 50) {
                p.x = -50;
                p.y = Math.random() * this.height;
            }
            if (p.x < -50) {
                p.x = this.width + 50;
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state) return;
        if (this.time < 2.5) return;

        const fadeIn = Math.min(1, (this.time - 2.5) / 1.0);

        // Lightning flash (screen)
        if (this.lightning && this.lightning.alpha > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(this.lightning.alpha - 0.5) * 0.2})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw lightning bolt
        if (this.lightning && this.lightning.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.lightning.alpha * fadeIn;

            // Glow
            ctx.strokeStyle = '#e1bee7';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ce93d8';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            this.lightning.segments.forEach(seg => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();

            // Core (bright white)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            this.lightning.segments.forEach(seg => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();

            ctx.restore();
        }

        // Square Sun for sunny mood
        if (this.state.mood === 'sunny') {
            const cx = this.width * 0.45;
            const cy = this.height * 0.25; // Lower for sunset
            const size = 100;

            // Outer glow
            ctx.save();
            ctx.globalAlpha = fadeIn * 0.3;
            ctx.fillStyle = '#ffb300';
            ctx.fillRect(cx - size - 20, cy - size - 20, (size + 20) * 2, (size + 20) * 2);
            ctx.restore();

            // Main sun block
            ctx.save();
            ctx.globalAlpha = fadeIn * 0.95;
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

            // Brighter center core
            ctx.fillStyle = '#fff9c4';
            ctx.globalAlpha = fadeIn * 0.8;
            ctx.fillRect(cx - size / 4, cy - size / 4, size / 2, size / 2);
            ctx.restore();
        }

        // Particles
        ctx.save();
        ctx.globalAlpha = fadeIn;

        this.particles.forEach(p => {
            ctx.globalAlpha = fadeIn * p.alpha;

            switch (p.type) {
                case 'rain':
                    ctx.strokeStyle = this.state?.mood === 'storm' ? '#7986cb' : '#90caf9';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx * 0.8, p.y + p.vy * 0.8);
                    ctx.stroke();
                    break;

                case 'snow':
                    // Square snow
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                    break;

                case 'fog':
                    // Large semi-transparent blocks
                    ctx.fillStyle = '#cfd8dc';
                    ctx.fillRect(p.x, p.y, p.size, p.size * 0.3);
                    break;

                case 'wind':
                    ctx.strokeStyle = 'rgba(150, 210, 210, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + 40, p.y);
                    ctx.stroke();
                    break;

                case 'sun-dust':
                    // Square golden particles
                    ctx.fillStyle = '#ffd54f';
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                    break;
            }
        });

        ctx.restore();
    }
}
