import { type Grid, type Tile, type Position } from './core';
import { findPath } from './pathfinding';

/**
 * Checks if there are any valid moves remaining on the grid.
 */
export function checkSolvability(grid: Grid): boolean {
    return getHint(grid) !== null;
}

/**
 * Returns a pair of positions that can be connected and the path between them, or null if none.
 * Updated to return the path as well for visual hints.
 */
export function getHint(grid: Grid): { start: Position, end: Position, path: Position[] } | null {
    const tiles: Tile[] = [];
    const height = grid.length;
    const width = grid[0].length;

    // Collect all non-null tiles
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = grid[y][x];
            if (tile) {
                tiles.push(tile);
            }
        }
    }

    // Group by type to reduce comparisons
    const byType: Record<string, Tile[]> = {};
    for (const tile of tiles) {
        if (!byType[tile.type]) {
            byType[tile.type] = [];
        }
        byType[tile.type].push(tile);
    }

    // Check pairs
    for (const type in byType) {
        const group = byType[type];
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const start = { x: group[i].x, y: group[i].y };
                const end = { x: group[j].x, y: group[j].y };
                const path = findPath(start, end, grid);
                
                if (path) {
                    return { start, end, path };
                }
            }
        }
    }

    return null;
}

/**
 * Shuffles the current tiles on the grid.
 * Keeps the layout (null spots remain null, filled spots remain filled),
 * but permutes the tile types/ids among the filled spots.
 */
export function shuffleGrid(grid: Grid): Grid {
    const height = grid.length;
    const width = grid[0].length;
    const tiles: Tile[] = [];
    const positions: Position[] = [];

    // Extract tiles and their positions
    // Note: grid now includes padding. We only shuffle non-null tiles.
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = grid[y][x];
            if (tile) {
                tiles.push(tile);
                positions.push({ x, y });
            }
        }
    }

    // Shuffle tiles array
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Create new grid copy
    const newGrid: Grid = grid.map(row => [...row]);

    // Place tiles back into positions
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const tile = tiles[i];
        // Update tile coordinates
        newGrid[pos.y][pos.x] = {
            ...tile,
            x: pos.x,
            y: pos.y
        };
    }

    return newGrid;
}
