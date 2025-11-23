import { type Grid, type Position, DIRECTIONS } from './core';

interface PathNode {
    x: number;
    y: number;
    turns: number;
    direction: number; // Index in DIRECTIONS, -1 for start
    parent: PathNode | null;
}

/**
 * Finds a path between two points with at most 2 turns.
 * Returns the path as an array of Positions, or null if no path found.
 */
export function findPath(start: Position, end: Position, grid: Grid): Position[] | null {
    // Basic checks
    if (start.x === end.x && start.y === end.y) return null;
    if (grid[start.y][start.x]?.type !== grid[end.y][end.x]?.type) return null;

    const width = grid[0].length;
    const height = grid.length;

    // Queue for BFS: [x, y, turns, directionIndex, parentNode]
    // We need to store path to reconstruct it.
    // Using a custom object for the queue to track state
    const queue: PathNode[] = [
        { x: start.x, y: start.y, turns: 0, direction: -1, parent: null }
    ];

    // Visited array to avoid cycles. 
    // We need to track visited state per (x, y, direction, turns) because arriving at a cell 
    // with fewer turns or different direction might be valid.
    // However, for simple 2-turn BFS, we can just be careful.
    // Optimization: visited[y][x] <= turns. If we reached here with fewer or equal turns before, skip.
    // But direction matters. A simple visited[y][x] is not enough because coming from left vs top matters for future turns.
    // Let's use a visited set key: `${x},${y},${direction}`.
    // Actually, we want to minimize turns.

    const visited = new Set<string>();

    while (queue.length > 0) {
        const current = queue.shift()!;

        // Check if reached end
        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(current);
        }

        // Explore neighbors
        for (let i = 0; i < DIRECTIONS.length; i++) {
            const dir = DIRECTIONS[i];
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;

            // Bounds check
            // Note: We allow path to go OUTSIDE the grid (if we want "border" paths).
            // But usually in these games, we add a padding of empty cells around the grid, 
            // OR we explicitly allow coords -1 and width/height.
            // For simplicity, let's assume the grid passed in HAS padding or we handle bounds strictly.
            // If we want to allow border paths, the grid generation should add empty padding rows/cols.
            // Let's assume strict bounds for now, and we will add padding in the UI/Grid generation if needed.
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            // Collision check: Must be empty OR be the target
            const isTarget = nx === end.x && ny === end.y;
            const isEmpty = grid[ny][nx] === null;

            if (!isEmpty && !isTarget) continue;

            // Turn calculation
            const newDirection = i;
            const turns = current.direction !== -1 && current.direction !== newDirection
                ? current.turns + 1
                : current.turns;

            if (turns > 2) continue;

            // Visited check
            // We only care if we found a 'better' or 'equal' way to this cell?
            // Actually, standard BFS guarantees shortest path by edges (steps), but we want shortest by TURNS.
            // So we should use a Deque and push front if 0 turns added, push back if 1 turn added?
            // Or just standard BFS is fine because max turns is small (2). 
            // But standard BFS minimizes steps, not turns.
            // To strictly minimize turns, we should prioritize nodes with fewer turns.
            // Let's just use standard BFS but be permissive with visited.
            // If we visit a node with SAME turns but different direction, it might be useful.
            // If we visit with FEWER turns, definitely useful.

            const stateKey = `${nx},${ny},${newDirection},${turns}`;
            if (visited.has(stateKey)) continue;
            visited.add(stateKey);

            queue.push({
                x: nx,
                y: ny,
                turns: turns,
                direction: newDirection,
                parent: current
            });
        }
    }

    return null;
}

function reconstructPath(node: PathNode): Position[] {
    const path: Position[] = [];
    let curr: PathNode | null = node;
    while (curr) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = curr.parent;
    }
    return path;
}
