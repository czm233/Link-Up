import React, { useState, useEffect } from 'react';
import { type Grid, type Tile as TileType, createGrid, createGridFromMap, type Position } from '../logic/core';
import { findPath } from '../logic/pathfinding';
import { checkSolvability, getHint, shuffleGrid } from '../logic/mechanics';
import { Board } from './Board';
import { EffectsLayer } from './EffectsLayer';
import { audioManager } from '../logic/audioManager';
import './Game.css';

const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;
const TILE_TYPES = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍒', '🍑', '🍍', '🥝', '🥑', '🍆'];
const INITIAL_TIME = 30;

interface GameProps {
    mapData?: number[][];
    onExit: () => void;
}

export const Game: React.FC<GameProps> = ({ mapData, onExit }) => {
    const [grid, setGrid] = useState<Grid>([]);
    const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
    const [path, setPath] = useState<Position[] | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [hint, setHint] = useState<[Position, Position] | null>(null);
    const [dimensions, setDimensions] = useState({ w: GRID_WIDTH + 2, h: GRID_HEIGHT + 2 });
    const [combo, setCombo] = useState(0);
    // Use hint to avoid unused variable warning if we use it in render or logic
    // Actually we use it in handleHint but we don't read it back except for clearing.
    // We can use it to highlight tiles.
    console.log(hint); // Temporary usage

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, [mapData]); // Re-init if mapData changes

    const startNewGame = () => {
        let newGrid;
        let w = GRID_WIDTH;
        let h = GRID_HEIGHT;

        if (mapData) {
            newGrid = createGridFromMap(mapData, TILE_TYPES);
            w = mapData[0].length;
            h = mapData.length;
        } else {
            newGrid = createGrid(GRID_WIDTH, GRID_HEIGHT, TILE_TYPES);
        }
        setGrid(newGrid);
        // We need to store current dimensions to pass to Board
        // But Board takes grid which has dimensions.
        // Actually Board props width/height are for CSS grid columns.
        // We should derive them from grid if possible or state.
        // Let's add state for dimensions.
        setDimensions({ w: w + 2, h: h + 2 });

        setSelectedTile(null);
        setPath(null);
        setScore(0);
        setTimeLeft(INITIAL_TIME);
        setGameState('playing');
        setHint(null);
        setCombo(0);
        audioManager.resetCombo();
    };

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setGameState('lost');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Auto-check solvability
    useEffect(() => {
        if (gameState !== 'playing' || grid.length === 0) return;

        // Check if board is empty (Win)
        const isEmpty = grid.every(row => row.every(tile => tile === null));
        if (isEmpty) {
            setGameState('won');
            return;
        }

        // Check solvability
        if (!checkSolvability(grid)) {
            // Auto shuffle
            console.log("No moves possible, shuffling...");
            // Add a small delay or visual cue could be nice
            setTimeout(() => {
                setGrid(prev => shuffleGrid(prev));
            }, 500);
        }
    }, [grid, gameState]);



    const handleTileClick = (tile: TileType) => {
        if (gameState !== 'playing') return;

        // If clicking same tile, deselect
        if (selectedTile?.id === tile.id) {
            setSelectedTile(null);
            audioManager.playClick();
            return;
        }

        // If no tile selected, select this one
        if (!selectedTile) {
            setSelectedTile(tile);
            setHint(null);
            audioManager.playClick();
            return;
        }

        // If matching type
        if (selectedTile.type === tile.type) {
            const start = { x: selectedTile.x, y: selectedTile.y };
            const end = { x: tile.x, y: tile.y };
            const foundPath = findPath(start, end, grid);

            if (foundPath) {
                // Match found!
                setPath(foundPath);
                const currentCombo = audioManager.playMatch();
                setCombo(currentCombo);

                // Remove tiles after delay
                setTimeout(() => {
                    setGrid(prev => {
                        const newGrid = prev.map(row => [...row]);
                        newGrid[start.y][start.x] = null;
                        newGrid[end.y][end.x] = null;
                        return newGrid;
                    });
                    setPath(null);
                    setSelectedTile(null);
                    setScore(prev => prev + 100 + (currentCombo > 1 ? currentCombo * 10 : 0));
                    setTimeLeft(INITIAL_TIME); // Reset timer
                }, 300);
            } else {
                // No path
                setSelectedTile(tile);
                audioManager.playClick();
            }
        } else {
            // Different type
            setSelectedTile(tile);
            audioManager.playClick();
        }
    };

    const handleHint = () => {
        const hintPair = getHint(grid);
        if (hintPair) {
            setHint(hintPair);
            // Highlight tiles? 
            // For now, maybe just flash them or select one?
            // Let's just set the first one as selected to help the user
            const [p1] = hintPair;
            const tile1 = grid[p1.y][p1.x];
            if (tile1) setSelectedTile(tile1);
        }
    };

    const handleReset = () => {
        setGrid(prev => shuffleGrid(prev));
        setHint(null);
        setSelectedTile(null);
        audioManager.playShuffle();
    };

    return (
        <div className="game-container">
            <div className="game-header">
                <button onClick={onExit} className="exit-btn">🏠</button>
                <div className="score">Score: {score}</div>
                {combo > 1 && <div className="combo-display">Combo x{combo}!</div>}
                <div className={`timer ${timeLeft < 10 ? 'danger' : ''}`}>
                    Time: {timeLeft}s
                </div>
            </div>

            <div className="board-container">
                <Board
                    grid={grid}
                    selectedTile={selectedTile}
                    onTileClick={handleTileClick}
                    width={dimensions.w}
                    height={dimensions.h}
                >
                    <EffectsLayer path={path} width={dimensions.w} height={dimensions.h} />
                </Board>

                {gameState !== 'playing' && (
                    <div className="game-overlay">
                        <div className="game-message">
                            {gameState === 'won' ? '🎉 You Won! 🎉' : '💀 Game Over 💀'}
                            <button onClick={startNewGame}>Play Again</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="game-controls">
                <button onClick={handleHint} disabled={gameState !== 'playing'}>
                    🧭 Hint
                </button>
                <button onClick={handleReset} disabled={gameState !== 'playing'}>
                    🔄 Shuffle
                </button>
            </div>
        </div>
    );
};
