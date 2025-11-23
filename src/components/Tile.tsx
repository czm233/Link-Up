import React from 'react';
import { type Tile as TileType } from '../logic/core';
import './Tile.css';

interface TileProps {
    tile: TileType | null;
    isSelected: boolean;
    isMatched?: boolean;
    onClick: () => void;
}

export const Tile: React.FC<TileProps> = ({ tile, isSelected, isMatched, onClick }) => {
    if (!tile) {
        return <div className="tile empty" />;
    }

    return (
        <div
            className="tile"
            // Use onMouseDown for immediate response, rather than waiting for mouse up (click)
            onMouseDown={(e) => {
                // Only trigger on left click
                if (e.button === 0) {
                    onClick();
                }
            }}
            // Prevent default drag behavior which might interfere with rapid clicking
            onDragStart={(e) => e.preventDefault()}
            style={{ gridColumn: tile.x + 1, gridRow: tile.y + 1 }}
        >
            <div className={`tile-visual ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}>
                <span className="tile-content">{tile.type}</span>
            </div>
        </div>
    );
};
