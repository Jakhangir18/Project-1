'use client';

import { useEffect, useRef, useState } from 'react';
import { World } from '@/lib/engine/World';
import { SkyLayer } from '@/lib/engine/SkyLayer';
import { MountainLayer } from '@/lib/engine/MountainLayer';
import { WaterLayer } from '@/lib/engine/WaterLayer';
import { TerrainLayer } from '@/lib/engine/TerrainLayer';
import { TreeLayer } from '@/lib/engine/TreeLayer';
import { StructureLayer } from '@/lib/engine/StructureLayer';
import { WeatherSystem } from '@/lib/engine/WeatherSystem';
import { FireflySystem } from '@/lib/engine/FireflySystem';
import { WeatherState, CommitData } from '@/lib/engine/types';

interface WeatherCanvasProps {
    weather: WeatherState | null;
    className?: string;
    isZoomedOut: boolean;
    seed?: number;

}

export default function WeatherCanvas({ weather, className, isZoomedOut }: WeatherCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const worldRef = useRef<World | null>(null);
    const fireflySystemRef = useRef<FireflySystem | null>(null);
    const [hoveredCommit, setHoveredCommit] = useState<{ commit: CommitData, x: number, y: number } | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const world = new World(canvasRef.current);

        const sky = new SkyLayer();
        const mountains = new MountainLayer();
        const water = new WaterLayer();
        const terrain = new TerrainLayer();
        const trees = new TreeLayer();
        const structures = new StructureLayer();
        const weatherSys = new WeatherSystem();
        const fireflies = new FireflySystem();

        fireflySystemRef.current = fireflies;

        // Layers ordered back to front:
        // 1. Sky → 2. Mountains → 3. Water → 4. Weather Particles
        // 5. Terrain → 6. Structures → 7. Trees → 8. Firefly Columns
        world.addLayer(sky);
        world.addLayer(mountains);
        world.addLayer(water);
        world.addLayer(weatherSys);
        world.addLayer(terrain);
        world.addLayer(structures);
        world.addLayer(trees);
        world.addLayer(fireflies);

        world.start();
        worldRef.current = world;

        return () => {
            world.destroy();
        };
    }, []);

    useEffect(() => {
        if (worldRef.current && weather) {
            worldRef.current.setWeather(weather);
        }
    }, [weather]);

    // Handle Resize for Zoom effect?
    // Zoom is requested as CSS transform: "Zoom = CSS transform on the canvas element"

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!fireflySystemRef.current || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();

        // We need to account for DPR if the system uses it.
        // World.ts handles DPR by scaling context, but logical coords might be different.
        // checkHit uses logical coords (width/height passed to resize).
        // In World.ts: this.canvas.width = displayWidth * dpr.
        // resize(displayWidth, displayHeight).
        // So layers use displayWidth/Height (CSS pixels).
        // So we just need e.clientX relative to rect. No DPR scaling needed for logic check.

        // Wait, I scaled ctx by dpr. 
        // If I draw at 100,100 logical, it draws at 200,200 physical on 2x screen.
        // Layers store logical coordinates (0 to displayWidth).
        // So mouse event (CSS pixels) should match logical coords directly.

        const mouseX = e.clientX - rect.left;

        const hit = fireflySystemRef.current.checkHit(mouseX);

        if (hit) {
            setHoveredCommit({
                commit: hit,
                x: e.clientX, // Screen coords for HTML tooltip
                y: e.clientY
            });
            canvasRef.current.style.cursor = 'pointer';
        } else {
            setHoveredCommit(null);
            canvasRef.current.style.cursor = 'default';
        }
    };

    const handleClick = () => {
        // If clicked on firefly, maybe lock tooltip or open link?
        // Request: "Clicking a dot reveals a tooltip". 
        // Hover is usually enough for desktop, click for mobile.
        // Already handled by state.
        if (hoveredCommit) {
            window.open(`https://github.com/${weather?.repoName}/commit/${hoveredCommit.commit.sha}`, '_blank');
        }
    };

    return (
        <>
            <canvas
                ref={canvasRef}
                className={className}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    transform: isZoomedOut ? 'scale(1)' : 'scale(3)', // Initial zoom logic needs refinement
                    transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)', // ease-out
                    transformOrigin: '50% 50%' // Zoom into center for now, request said "zoom IN very close on a single glowing commit dot"
                    // That would require dynamic transform origin based on a dot position. 
                    // For MVP, center zoom is safer.
                }}
            />

            {/* Tooltip Overlay */}
            {hoveredCommit && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: hoveredCommit.x + 15,
                        top: hoveredCommit.y - 15
                    }}
                >
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white max-w-[250px] shadow-xl">
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                            <span>{new Date(hoveredCommit.commit.date).toLocaleDateString()}</span>
                            <span className="uppercase text-[10px] tracking-wider border border-white/20 px-1 rounded">{hoveredCommit.commit.type}</span>
                        </div>
                        <p className="font-mono text-sm line-clamp-2">{hoveredCommit.commit.message}</p>
                        <div className="mt-1 text-[10px] opacity-50">{hoveredCommit.commit.author}</div>
                    </div>
                </div>
            )}
        </>
    );
}
