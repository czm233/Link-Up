import React from 'react';
import { type Grid, type Tile as TileType } from '../logic/core';
import { Tile } from './Tile';
import './Board.css';

interface BoardProps {
    grid: Grid;
    selectedTile: TileType | null;
    onTileClick: (tile: TileType) => void;
    width: number;
    height: number;
    children?: React.ReactNode; // For EffectsLayer
}

export const Board: React.FC<BoardProps> = ({ grid, selectedTile, onTileClick, width, height, children }) => {
    return (
        <div
            className="board"
            style={{
                gridTemplateColumns: `repeat(${width}, var(--tile-size))`,
                gridTemplateRows: `repeat(${height}, var(--tile-size))`
            }}
        >
            {grid.map((row) => (
                row.map((tile, x) => (
                    <Tile
                        key={tile ? tile.id : `empty-${x}-${grid.indexOf(row)}`}
                        tile={tile}
                        isSelected={selectedTile?.id === tile?.id}
                        onClick={() => tile && onTileClick(tile)}
                    />
                ))
            ))}
            {children}
        </div>
    );
};
