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
    lockedTiles?: Set<string>;
}

export const Board: React.FC<BoardProps> = ({ grid, selectedTile, onTileClick, width, height, children, lockedTiles }) => {
    return (
        <div
            className="board"
            style={{
                // Include gap in the grid cell size to allow fuller click areas
                gridTemplateColumns: `repeat(${width}, calc(var(--tile-size) + var(--tile-gap)))`,
                gridTemplateRows: `repeat(${height}, calc(var(--tile-size) + var(--tile-gap)))`
            }}
        >
            {grid.map((row) => (
                row.map((tile, x) => (
                    <Tile
                        key={tile ? tile.id : `empty-${x}-${grid.indexOf(row)}`}
                        tile={tile}
                        isSelected={selectedTile?.id === tile?.id}
                        isMatched={tile ? lockedTiles?.has(tile.id) : false}
                        onClick={() => tile && onTileClick(tile)}
                    />
                ))
            ))}
            {children}
        </div>
    );
};
