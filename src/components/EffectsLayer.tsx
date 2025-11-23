import React from 'react';
import { type Position } from '../logic/core';
import './EffectsLayer.css';

export interface ActiveEffect {
    id: string;
    path: Position[];
    startTime: number;
    type?: 'match' | 'hint'; // Added type
}

interface EffectsLayerProps {
    activeEffects: ActiveEffect[];
    width: number;
    height: number;
}

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ activeEffects, width, height }) => {
    if (!activeEffects || activeEffects.length === 0) return null;

    return (
        <div className="effects-layer">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="effects-svg"
                preserveAspectRatio="none"
            >
                {activeEffects.map(effect => {
                     const points = effect.path.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ');
                     const isHint = effect.type === 'hint';
                     
                     return (
                        <React.Fragment key={effect.id}>
                            <polyline
                                points={points}
                                className={`lightning-path ${isHint ? 'hint-path' : ''}`}
                            />
                            <polyline
                                points={points}
                                className={`lightning-core ${isHint ? 'hint-core' : ''}`}
                            />
                        </React.Fragment>
                     );
                })}
            </svg>
            
            {/* Flash effects at start and end for each path - Only for match effects */}
            {activeEffects.filter(e => e.type !== 'hint').map(effect => (
                <React.Fragment key={`flash-${effect.id}`}>
                    <div
                        className="flash-effect"
                        style={{
                            left: `calc(${effect.path[0].x} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`,
                            top: `calc(${effect.path[0].y} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`
                        }}
                    />
                    <div
                        className="flash-effect"
                        style={{
                            left: `calc(${effect.path[effect.path.length - 1].x} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`,
                            top: `calc(${effect.path[effect.path.length - 1].y} * (var(--tile-size) + var(--tile-gap)) + var(--tile-size)/2)`
                        }}
                    />
                </React.Fragment>
            ))}
        </div>
    );
};
