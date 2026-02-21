import { BaseLayer } from './Layer';
import { BlockRenderer } from './BlockRenderer';
import { WeatherMood, WeatherState } from './types';

interface VoxelTree {
    x: number;
    type: 'oak' | 'dark_oak' | 'spruce' | 'cactus';
    size: number;      // 0.7 to 1.3 for variety
    delay: number;
    depth: number;     // 0 = foreground, 1 = background (affects size)
    hasLeftArm?: boolean;
    hasRightArm?: boolean;
}

/**
 * TreeLayer — Detailed multi-block voxel trees with variety and depth.
 */
export class TreeLayer extends BaseLayer {
    private trees: VoxelTree[] = [];
    private blockSize: number = 16;
    private time: number = 0;

    resize(width: number, height: number) {
        super.resize(width, height);
        this.generateTrees();
    }

    setWeather(state: WeatherState) {
        const oldMood = this.state?.mood;
        super.setWeather(state);
        if (oldMood !== state.mood) {
            this.generateTrees();
            this.time = 0;
        }
    }

    private getTreePalette(mood: WeatherMood): {
        trunk: string;
        leaves: string;
        leavesLight: string;
        leavesDark: string;
        spruce: string;
        spruceLight: string;
    } {
        switch (mood) {
            case 'sunny':
                return {
                    trunk: '#2e7d32',   // Cactus body
                    leaves: '#388e3c',  // Cactus highlights
                    leavesLight: '#4caf50',
                    leavesDark: '#1b5e20',
                    spruce: '#000000',  // Unused
                    spruceLight: '#000000',
                };
            case 'rain':
                return {
                    trunk: '#4e342e',
                    leaves: '#2e7d32',
                    leavesLight: '#388e3c',
                    leavesDark: '#1b5e20',
                    spruce: '#1b5e20',
                    spruceLight: '#2e7d32',
                };
            case 'storm':
                return {
                    trunk: '#3e2723',
                    leaves: '#1b5e20',
                    leavesLight: '#2e7d32',
                    leavesDark: '#0d3310',
                    spruce: '#1b5e20',
                    spruceLight: '#2e7d32',
                };
            case 'snow':
                return {
                    trunk: '#5d4037',
                    leaves: '#eceff1',
                    leavesLight: '#fafafa',
                    leavesDark: '#cfd8dc',
                    spruce: '#1b5e20',
                    spruceLight: '#2e7d32',
                };
            case 'fog':
                return {
                    trunk: '#455a64',
                    leaves: '#78909c',
                    leavesLight: '#90a4ae',
                    leavesDark: '#607d8b',
                    spruce: '#546e7a',
                    spruceLight: '#607d8b',
                };
            case 'wind':
                return {
                    trunk: '#4e342e',
                    leaves: '#26a69a',
                    leavesLight: '#4db6ac',
                    leavesDark: '#00897b',
                    spruce: '#00796b',
                    spruceLight: '#00897b',
                };
            default:
                return {
                    trunk: '#5d4037',
                    leaves: '#4caf50',
                    leavesLight: '#66bb6a',
                    leavesDark: '#388e3c',
                    spruce: '#2e7d32',
                    spruceLight: '#388e3c',
                };
        }
    }
    private generateTrees() {
        this.trees = [];
        if (!this.width || !this.state) return;

        const count = 8 + Math.floor(this.width / 150);

        for (let i = 0; i < count; i++) {
            const x = 30 + Math.random() * (this.width - 60);
            const gridX = Math.floor(x / this.blockSize) * this.blockSize;

            let type: 'oak' | 'dark_oak' | 'spruce' | 'cactus' = 'oak';
            if (this.state?.mood === 'snow') type = 'spruce';
            else if (this.state?.mood === 'sunny') type = 'cactus';
            else if (this.state?.mood === 'storm' || this.state?.mood === 'rain') {
                type = Math.random() > 0.5 ? 'dark_oak' : 'oak';
            }

            const depth = Math.random();

            this.trees.push({
                x: gridX,
                type,
                size: 0.7 + Math.random() * 0.6,
                delay: 2.0 + Math.random() * 1.5,
                depth,
                hasLeftArm: type === 'cactus' ? Math.random() > 0.3 : undefined,
                hasRightArm: type === 'cactus' ? Math.random() > 0.3 : undefined,
            });
        }

        // Sort by depth (draw background trees first)
        this.trees.sort((a, b) => b.depth - a.depth);
    }

    update(dt: number) {
        this.time += dt;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.state) return;

        const palette = this.getTreePalette(this.state.mood);

        this.trees.forEach(tree => {
            // Animation: elastic pop
            const t = Math.max(0, Math.min(1, (this.time - tree.delay) / 0.8));
            if (t <= 0) return;

            const p = 0.3;
            let scale = Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
            if (t >= 1) scale = 1;

            // Depth-based sizing (background trees are smaller)
            const depthScale = 0.6 + (1 - tree.depth) * 0.4;
            const bs = Math.round(this.blockSize * tree.size * depthScale);

            const groundY = this.getGroundY(tree.x);

            ctx.save();
            ctx.globalAlpha = 0.7 + (1 - tree.depth) * 0.3; // Background trees more faded

            // Scale from bottom center
            const centerX = tree.x + bs / 2;
            ctx.translate(centerX, groundY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -groundY);

            if (tree.type === 'oak') {
                this.drawOak(ctx, tree.x, groundY, bs, palette);
            } else if (tree.type === 'dark_oak') {
                this.drawDarkOak(ctx, tree.x, groundY, bs, palette);
            } else if (tree.type === 'spruce') {
                this.drawSpruce(ctx, tree.x, groundY, bs, palette);
            } else if (tree.type === 'cactus') {
                this.drawCactus(ctx, tree, groundY, bs, palette);
            }

            ctx.restore();
        });
    }

    private drawCactus(ctx: CanvasRenderingContext2D, tree: VoxelTree, groundY: number, bs: number, palette: ReturnType<TreeLayer['getTreePalette']>) {
        const x = tree.x;
        const y = groundY;

        // Main Body: 1 block wide, 3-5 blocks tall
        const height = 4;
        for (let j = 0; j < height; j++) {
            BlockRenderer.drawBlock(ctx, x, y - (j + 1) * bs, bs, palette.trunk, { topHighlight: j === height - 1 });
        }

        // Left arm (optional)
        if (tree.hasLeftArm) {
            const armY = y - 2 * bs;
            BlockRenderer.drawBlock(ctx, x - bs, armY, bs, palette.leavesDark); // horizontal
            BlockRenderer.drawBlock(ctx, x - bs, armY - bs, bs, palette.trunk, { topHighlight: true }); // vertical
        }

        // Right arm (optional)
        if (tree.hasRightArm) {
            const armY = y - 3 * bs;
            BlockRenderer.drawBlock(ctx, x + bs, armY, bs, palette.leaves); // horizontal
            BlockRenderer.drawBlock(ctx, x + bs, armY - bs, bs, palette.trunk, { topHighlight: true }); // vertical
        }
    }

    private drawOak(ctx: CanvasRenderingContext2D, x: number, y: number, bs: number, palette: ReturnType<TreeLayer['getTreePalette']>) {
        // Trunk: 1 block wide, 4-5 blocks tall
        const trunkHeight = 5;
        for (let j = 0; j < trunkHeight; j++) {
            BlockRenderer.drawBlock(ctx, x, y - (j + 1) * bs, bs, palette.trunk);
        }

        // Canopy: 5 wide × 3 tall, centered on trunk top
        const canopyBottom = y - trunkHeight * bs;
        const canopyX = x - bs * 2;

        // Bottom row (5 wide)
        for (let i = 0; i < 5; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + i * bs, canopyBottom - bs, bs, palette.leaves);
        }
        // Middle row (5 wide)
        for (let i = 0; i < 5; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + i * bs, canopyBottom - bs * 2, bs, palette.leaves);
        }
        // Top row (3 wide, centered)
        for (let i = 0; i < 3; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + bs + i * bs, canopyBottom - bs * 3, bs, palette.leavesLight);
        }
        // Peak (1 wide)
        BlockRenderer.drawBlock(ctx, x, canopyBottom - bs * 4, bs, palette.leavesLight);
    }

    private drawDarkOak(ctx: CanvasRenderingContext2D, x: number, y: number, bs: number, palette: ReturnType<TreeLayer['getTreePalette']>) {
        // Trunk: 2 blocks wide, 4 blocks tall
        const trunkHeight = 4;
        for (let j = 0; j < trunkHeight; j++) {
            BlockRenderer.drawBlock(ctx, x, y - (j + 1) * bs, bs, palette.trunk);
            BlockRenderer.drawBlock(ctx, x + bs, y - (j + 1) * bs, bs, palette.trunk);
        }

        // Wide canopy: 6 wide × 3 tall
        const canopyBottom = y - trunkHeight * bs;
        const canopyX = x - bs * 2;

        // Bottom (6 wide)
        for (let i = 0; i < 6; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + i * bs, canopyBottom - bs, bs, palette.leavesDark);
        }
        // Middle (6 wide)
        for (let i = 0; i < 6; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + i * bs, canopyBottom - bs * 2, bs, palette.leavesDark);
        }
        // Top (4 wide)
        for (let i = 0; i < 4; i++) {
            BlockRenderer.drawBlock(ctx, canopyX + bs + i * bs, canopyBottom - bs * 3, bs, palette.leaves);
        }
    }

    private drawSpruce(ctx: CanvasRenderingContext2D, x: number, y: number, bs: number, palette: ReturnType<TreeLayer['getTreePalette']>) {
        // Trunk: 1 block wide, 5 blocks tall
        const trunkHeight = 5;
        for (let j = 0; j < trunkHeight; j++) {
            BlockRenderer.drawBlock(ctx, x, y - (j + 1) * bs, bs, palette.trunk);
        }

        // Spruce canopy: triangular tiers
        const canopyBottom = y - 2 * bs; // Starts at trunk block 2

        // Tier 1 (bottom, widest): 5 wide
        for (let i = 0; i < 5; i++) {
            BlockRenderer.drawBlock(ctx, x - 2 * bs + i * bs, canopyBottom - bs, bs, palette.spruce);
        }
        // Tier 2: 3 wide
        for (let i = 0; i < 3; i++) {
            BlockRenderer.drawBlock(ctx, x - bs + i * bs, canopyBottom - bs * 2, bs, palette.spruce);
        }
        // Tier 3: 5 wide (another wide tier for fullness)
        for (let i = 0; i < 5; i++) {
            BlockRenderer.drawBlock(ctx, x - 2 * bs + i * bs, canopyBottom - bs * 3, bs, palette.spruceLight);
        }
        // Tier 4: 3 wide
        for (let i = 0; i < 3; i++) {
            BlockRenderer.drawBlock(ctx, x - bs + i * bs, canopyBottom - bs * 4, bs, palette.spruceLight);
        }
        // Peak: 1 wide
        BlockRenderer.drawBlock(ctx, x, canopyBottom - bs * 5, bs, palette.spruceLight);

        // Snow on top for snow mood
        if (this.state?.mood === 'snow') {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            // Snow spots on tiers
            ctx.fillRect(x - 2 * bs, canopyBottom - bs - 3, bs * 5, 3);
            ctx.fillRect(x - bs, canopyBottom - bs * 2 - 3, bs * 3, 3);
            ctx.fillRect(x - 2 * bs, canopyBottom - bs * 3 - 3, bs * 5, 3);
            ctx.fillRect(x, canopyBottom - bs * 5 - 3, bs, 3);
            ctx.globalAlpha = 1;
        }
    }

    private getGroundY(x: number): number {
        if (this.width === 0) return this.height;

        // Match TerrainLayer height logic
        const cols = Math.ceil(this.width / this.blockSize);
        const i = Math.floor(x / this.blockSize);
        const nx = i / cols;

        const baseBlocks = 6;
        const variation = Math.sin(nx * 8) * 2 + Math.sin(nx * 20) * 0.5;
        const totalBlocks = Math.max(3, Math.round(baseBlocks + variation));

        return this.height - totalBlocks * this.blockSize;
    }
}
