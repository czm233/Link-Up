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
            className={`tile ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}
            onClick={onClick}
            style={{ gridColumn: tile.x + 1, gridRow: tile.y + 1 }}
        >
            <span className="tile-content">{tile.type}</span>
        </div>
    );
};
