import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

interface House {
    x: number;
    width: number;     // in blocks
    wallHeight: number; // in blocks
    delay: number;
    hasChimney: boolean;
}

/**
 * StructureLayer — Small Minecraft village houses.
 * Only appears for storm and rain moods.
 */
export class StructureLayer extends BaseLayer {
    private houses: House[] = [];
    private blockSize: number = 16;
    private time: number = 0;

    resize(width: number, height: number) {
        super.resize(width, height);
        this.generateHouses();
    }

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood) {
            this.generateHouses();
            this.time = 0;
        }
    }

    private generateHouses() {
        this.houses = [];
        if (!this.width || !this.state) return;

        // Only rain/storm/snow get houses
        const mood = this.state.mood;
        if (mood !== 'rain' && mood !== 'storm' && mood !== 'snow') return;

        const count = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < count; i++) {
            const x = 100 + Math.random() * (this.width - 200);
            const gridX = Math.floor(x / this.blockSize) * this.blockSize;

            this.houses.push({
                x: gridX,
                width: 4 + Math.floor(Math.random() * 2),  // 4-5 blocks wide
                wallHeight: 3 + Math.floor(Math.random() * 2), // 3-4 blocks tall
                delay: 2.5 + Math.random() * 1.0,
                hasChimney: Math.random() > 0.5,
            });
        }
    }

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state || !this.houses.length) return;

        const palette = this.getHousePalette(this.state.mood);

        this.houses.forEach(house => {
            // Assembly animation
            const t = Math.max(0, Math.min(1, (this.time - house.delay) / 0.8));
            if (t <= 0) return;

            const p = 0.3;
            let scale = Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
            if (t >= 1) scale = 1;

            const groundY = this.getGroundY(house.x);
            const bs = this.blockSize;

            ctx.save();
            const centerX = house.x + (house.width * bs) / 2;
            ctx.translate(centerX, groundY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -groundY);

            // Walls
            for (let row = 0; row < house.wallHeight; row++) {
                for (let col = 0; col < house.width; col++) {
                    const bx = house.x + col * bs;
                    const by = groundY - (row + 1) * bs;
                    BlockRenderer.drawBlock(ctx, bx, by, bs, palette.wall);
                }
            }

            // Roof (triangle — each row is narrower by 1 on each side)
            const roofBottom = groundY - house.wallHeight * bs;
            let roofWidth = house.width + 2; // Overhang
            let roofX = house.x - bs;
            let roofRow = 0;

            while (roofWidth > 0) {
                for (let col = 0; col < roofWidth; col++) {
                    BlockRenderer.drawBlock(ctx, roofX + col * bs, roofBottom - (roofRow + 1) * bs, bs, palette.roof);
                }
                roofWidth -= 2;
                roofX += bs;
                roofRow++;
            }

            // Window (yellow glow)
            const windowX = house.x + bs;
            const windowY = groundY - bs * 2;
            ctx.fillStyle = palette.windowGlow;
            ctx.fillRect(windowX + 3, windowY + 3, bs - 6, bs - 6);

            // Second window if wide enough
            if (house.width >= 5) {
                const w2x = house.x + bs * 3;
                ctx.fillRect(w2x + 3, windowY + 3, bs - 6, bs - 6);
            }

            // Door
            const doorX = house.x + Math.floor(house.width / 2) * bs;
            BlockRenderer.drawBlock(ctx, doorX, groundY - bs, bs, palette.door);

            // Chimney (if applicable)
            if (house.hasChimney) {
                const chimneyX = house.x + (house.width - 1) * bs;
                const chimneyBottom = roofBottom - (roofRow) * bs;
                BlockRenderer.drawBlock(ctx, chimneyX, chimneyBottom - bs, bs, palette.chimney);
                BlockRenderer.drawBlock(ctx, chimneyX, chimneyBottom - bs * 2, bs, palette.chimney);
            }

            ctx.restore();
        });
    }

    private getHousePalette(mood: WeatherMood) {
        switch (mood) {
            case 'rain':
                return {
                    wall: '#6d4c41',   // Dark brown wood
                    roof: '#d32f2f',   // Red roof
                    door: '#3e2723',   // Dark door
                    windowGlow: 'rgba(255, 200, 50, 0.8)',
                    chimney: '#616161',
                };
            case 'storm':
                return {
                    wall: '#5d4037',
                    roof: '#4e342e',
                    door: '#3e2723',
                    windowGlow: 'rgba(255, 180, 40, 0.9)',
                    chimney: '#424242',
                };
            case 'snow':
                return {
                    wall: '#8d6e63',
                    roof: '#eceff1',   // Snow-covered roof
                    door: '#5d4037',
                    windowGlow: 'rgba(255, 200, 50, 0.8)',
                    chimney: '#757575',
                };
            default:
                return {
                    wall: '#795548',
                    roof: '#c62828',
                    door: '#4e342e',
                    windowGlow: 'rgba(255, 200, 50, 0.7)',
                    chimney: '#616161',
                };
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
