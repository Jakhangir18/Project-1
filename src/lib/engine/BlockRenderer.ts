/**
 * BlockRenderer — shared utility for drawing 3D-looking Minecraft blocks.
 * Provides consistent shading across all layers.
 */

export class BlockRenderer {

    /**
     * Draw a single 3D-looking block with top highlight and side shadow.
     */
    static drawBlock(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        color: string,
        options?: {
            topHighlight?: boolean;    // Draw lighter top edge (default true)
            rightShadow?: boolean;     // Draw darker right edge (default true)
            outlineColor?: string;     // Grid line color (optional)
        }
    ) {
        const opts = {
            topHighlight: true,
            rightShadow: true,
            ...options
        };

        const highlightWidth = Math.max(2, size * 0.15);
        const shadowWidth = Math.max(2, size * 0.12);

        // Main face
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Top face highlight (lighter)
        if (opts.topHighlight) {
            ctx.fillStyle = BlockRenderer.lighten(color, 30);
            ctx.fillRect(x, y, size, highlightWidth);
        }

        // Right face shadow (darker)
        if (opts.rightShadow) {
            ctx.fillStyle = BlockRenderer.darken(color, 25);
            ctx.fillRect(x + size - shadowWidth, y, shadowWidth, size);
        }

        // Optional grid outline
        if (opts.outlineColor) {
            ctx.strokeStyle = opts.outlineColor;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, size, size);
        }
    }

    /**
     * Draw a column of blocks with different block types (e.g., grass → dirt → stone).
     * blockTypes is an array of { color, count } from top to bottom.
     */
    static drawColumn(
        ctx: CanvasRenderingContext2D,
        x: number,
        bottomY: number,
        totalBlocks: number,
        blockSize: number,
        blockTypes: { color: string; count: number }[]
    ) {
        let blocksDrawn = 0;

        for (const bt of blockTypes) {
            for (let j = 0; j < bt.count && blocksDrawn < totalBlocks; j++) {
                const by = bottomY - (blocksDrawn + 1) * blockSize;
                BlockRenderer.drawBlock(ctx, x, by, blockSize, bt.color);
                blocksDrawn++;
            }
        }
    }

    /**
     * Lighten a hex color by a given amount (0-255).
     */
    static lighten(hex: string, amount: number): string {
        const [r, g, b] = BlockRenderer.hexToRgb(hex);
        return BlockRenderer.rgbToHex(
            Math.min(255, r + amount),
            Math.min(255, g + amount),
            Math.min(255, b + amount)
        );
    }

    /**
     * Darken a hex color by a given amount (0-255).
     */
    static darken(hex: string, amount: number): string {
        const [r, g, b] = BlockRenderer.hexToRgb(hex);
        return BlockRenderer.rgbToHex(
            Math.max(0, r - amount),
            Math.max(0, g - amount),
            Math.max(0, b - amount)
        );
    }

    /**
     * Parse hex color to [r, g, b].
     */
    static hexToRgb(hex: string): [number, number, number] {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16)
        ];
    }

    /**
     * Convert r, g, b (0-255) to hex string.
     */
    static rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
    }

    /**
     * Blend two hex colors by a ratio (0 = colorA, 1 = colorB).
     */
    static blend(colorA: string, colorB: string, ratio: number): string {
        const [r1, g1, b1] = BlockRenderer.hexToRgb(colorA);
        const [r2, g2, b2] = BlockRenderer.hexToRgb(colorB);
        return BlockRenderer.rgbToHex(
            r1 + (r2 - r1) * ratio,
            g1 + (g2 - g1) * ratio,
            b1 + (b2 - b1) * ratio
        );
    }
}
