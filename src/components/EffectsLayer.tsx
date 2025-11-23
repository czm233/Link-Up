import React from 'react';
import { type Position } from '../logic/core';
import './EffectsLayer.css';

interface EffectsLayerProps {
    path: Position[] | null;
    width: number;
    height: number;
}

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ path, width, height }) => {
    if (!path) return null;

    // Convert grid coordinates to pixels
    // We need to know the tile size and gap.
    // Since we are using CSS variables, we can't easily know the exact pixel values in JS without measurement.
    // However, since this is an SVG overlay ON TOP of the grid, we can use percentage or viewbox units if we match the grid aspect ratio.
    // OR, we can use `calc` in CSS? No, SVG needs coordinates.
    // Alternative: Use absolute positioning for divs?
    // Better: Use SVG with viewBox="0 0 width height" and let it scale.
    // Then x=0.5 means center of first tile (0).
    // x = tileX + 0.5

    const points = path.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ');

    return (
        <div className="effects-layer">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="effects-svg"
                preserveAspectRatio="none"
            >
                <polyline
                    points={points}
                    className="lightning-path"
                />
                <polyline
                    points={points}
                    className="lightning-core"
                />
            </svg>
            {/* Flash effects at start and end */}
            <div
                className="flash-effect"
                style={{
                    left: `calc(${path[0].x} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`,
                    top: `calc(${path[0].y} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`
                }}
            />
            <div
                className="flash-effect"
                style={{
                    left: `calc(${path[path.length - 1].x} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`,
                    top: `calc(${path[path.length - 1].y} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`
                }}
            />
        </div>
    );
};
