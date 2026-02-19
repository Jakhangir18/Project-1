import { WeatherState } from './types';

export abstract class BaseLayer {
    protected width: number = 0;
    protected height: number = 0;
    protected state: WeatherState | null = null;

    constructor() { }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    setWeather(state: WeatherState) {
        this.state = state;
    }

    abstract update(dt: number): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;
}
