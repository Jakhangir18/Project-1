import { WeatherMood } from './types';

export class Renderer {
    static getSkyGradient(ctx: CanvasRenderingContext2D, width: number, height: number, mood: WeatherMood): CanvasGradient {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);

        switch (mood) {
            case 'sunny':
                // Deep amber to warm black
                gradient.addColorStop(0, '#f59e0b'); // Amber 500
                gradient.addColorStop(0.4, '#78350f'); // Amber 900
                gradient.addColorStop(1, '#1a1a1a'); // Near black
                break;
            case 'rain':
                // Dark slate to near black
                gradient.addColorStop(0, '#334155'); // Slate 700
                gradient.addColorStop(1, '#020617'); // Slate 950
                break;
            case 'storm':
                // Purple-black to black
                gradient.addColorStop(0, '#2e1065'); // Violet 950
                gradient.addColorStop(0.5, '#000000');
                gradient.addColorStop(1, '#000000');
                break;
            case 'snow':
                // Midnight blue to near black
                gradient.addColorStop(0, '#1e3a8a'); // Blue 900
                gradient.addColorStop(1, '#0f172a'); // Slate 900
                break;
            case 'fog':
                // Grey-blue to charcoal
                gradient.addColorStop(0, '#64748b'); // Slate 500
                gradient.addColorStop(1, '#1e293b'); // Slate 800
                break;
            case 'wind':
                // Teal-black to dark navy
                gradient.addColorStop(0, '#115e59'); // Teal 800
                gradient.addColorStop(1, '#0f172a'); // Slate 900
                break;
            default:
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(1, '#000000');
        }

        return gradient;
    }
}
