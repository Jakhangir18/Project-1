import { BaseLayer } from './Layer';
import { WeatherState } from './types';

export class World {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private layers: BaseLayer[] = [];
    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private state: WeatherState | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha on main canvas if possible, but layers might need it.
        if (!ctx) throw new Error('Could not get 2d context');
        this.ctx = ctx;

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    private resize() {
        const dpr = window.devicePixelRatio || 1;
        // Get the display size from the canvas element (which comes from CSS)
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        // Set the internal resolution
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;

        // Scale the context to match dpr
        this.ctx.scale(dpr, dpr);

        // Notify layers of the new logical size
        this.layers.forEach(layer => layer.resize(displayWidth, displayHeight));
    }

    addLayer(layer: BaseLayer) {
        this.layers.push(layer);
        layer.resize(this.canvas.clientWidth, this.canvas.clientHeight);
        if (this.state) {
            layer.setWeather(this.state);
        }
    }

    setWeather(state: WeatherState) {
        this.state = state;
        this.layers.forEach(layer => layer.setWeather(state));
    }

    start() {
        if (!this.animationFrameId) {
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private loop(time: number) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    private update(dt: number) {
        this.layers.forEach(layer => layer.update(dt));
    }

    private draw() {
        // Clear canvas
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        // Actually, SkyLayer will cover everything, so clearRect might be redundant if SkyLayer covers full screen.
        // Keeping it for safety.
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.ctx.clearRect(0, 0, width, height);

        this.layers.forEach(layer => layer.draw(this.ctx));
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resize.bind(this));
    }
}
