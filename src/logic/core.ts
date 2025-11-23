export interface Position {
    x: number;
    y: number;
}

export interface Tile {
    id: string;
    type: string; // The emoji character
    x: number;
    y: number;
}

export type Grid = (Tile | null)[][];

export interface GameState {
    grid: Grid;
    width: number;
    height: number;
    score: number;
    timeLeft: number;
    status: 'playing' | 'won' | 'lost' | 'paused';
}

// Directions for BFS: Up, Down, Left, Right
export const DIRECTIONS = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
];

/**
 * Creates a new grid with the specified dimensions and tile types.
 * @param width Width of the grid
 * @param height Height of the grid
 * @param tileTypes Array of emoji strings to use
 * @returns A populated Grid
 */
export function createGrid(width: number, height: number, tileTypes: string[]): Grid {
    const totalSlots = width * height;
    if (totalSlots % 2 !== 0) {
        throw new Error("Grid size must be even to ensure all tiles can be paired.");
    }

    // Create pairs
    let tiles: string[] = [];
    const numPairs = totalSlots / 2;

    for (let i = 0; i < numPairs; i++) {
        const type = tileTypes[i % tileTypes.length];
        tiles.push(type, type);
    }

    // Shuffle tiles
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Fill grid with padding
    // We add 1 row/col padding on all sides.
    // Actual grid size: (width + 2) x (height + 2)
    const grid: Grid = [];
    let tileIndex = 0;

    // Top padding row
    grid.push(Array(width + 2).fill(null));

    for (let y = 0; y < height; y++) {
        const row: (Tile | null)[] = [];
        // Left padding
        row.push(null);

        for (let x = 0; x < width; x++) {
            row.push({
                id: `${x}-${y}-${Math.random().toString(36).substr(2, 9)}`,
                type: tiles[tileIndex++],
                x: x + 1, // Offset by 1 due to padding
                y: y + 1
            });
        }

        // Right padding
        row.push(null);
        grid.push(row);
    }

    // Bottom padding row
    grid.push(Array(width + 2).fill(null));

    return grid;
}

/**
 * Creates a grid from a boolean map (1 = tile, 0 = empty).
 */
export function createGridFromMap(mapData: number[][], tileTypes: string[]): Grid {
    const height = mapData.length;
    const width = mapData[0].length;

    // Count active slots
    let activeSlots = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mapData[y][x] === 1) activeSlots++;
        }
    }

    if (activeSlots % 2 !== 0) {
        // If odd number of slots, remove one random slot or error?
        // Let's just error for now or handle gracefully by leaving one empty.
        // Better: throw error so editor knows.
        console.warn("Map has odd number of slots, one will be empty.");
        activeSlots--;
    }

    // Create pairs
    let tiles: string[] = [];
    const numPairs = Math.floor(activeSlots / 2);

    for (let i = 0; i < numPairs; i++) {
        const type = tileTypes[i % tileTypes.length];
        tiles.push(type, type);
    }

    // Shuffle tiles
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Fill grid with padding
    const grid: Grid = [];
    let tileIndex = 0;

    // Top padding
    grid.push(Array(width + 2).fill(null));

    for (let y = 0; y < height; y++) {
        const row: (Tile | null)[] = [];
        // Left padding
        row.push(null);

        for (let x = 0; x < width; x++) {
            if (mapData[y][x] === 1 && tileIndex < tiles.length) {
                row.push({
                    id: `${x}-${y}-${Math.random().toString(36).substr(2, 9)}`,
                    type: tiles[tileIndex++],
                    x: x + 1,
                    y: y + 1
                });
            } else {
                row.push(null);
            }
        }
        // Right padding
        row.push(null);
        grid.push(row);
    }

    // Bottom padding
    grid.push(Array(width + 2).fill(null));

    return grid;
}
