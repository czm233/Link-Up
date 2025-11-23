import React, { useState, useEffect } from 'react';
import { type Grid, type Tile as TileType, createGrid, createGridFromMap, type Position } from '../logic/core';
import { findPath } from '../logic/pathfinding';
import { checkSolvability, getHint, shuffleGrid } from '../logic/mechanics';
import { Board } from './Board';
import { EffectsLayer, type ActiveEffect } from './EffectsLayer';
import { audioManager } from '../logic/audioManager';
import './Game.css';

const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;
const TILE_TYPES = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍒', '🍑', '🍍', '🥝', '🥑', '🍆'];
const INITIAL_TIME = 30;
const EFFECT_DURATION = 300;

interface GameProps {
    mapData?: number[][];
    onExit: () => void;
}

export const Game: React.FC<GameProps> = ({ mapData, onExit }) => {
    const [grid, setGrid] = useState<Grid>([]);
    const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
    // activeEffects supports multiple simultaneous connections
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    // lockedTiles tracks tiles that are matched but waiting for animation to finish
    const [lockedTiles, setLockedTiles] = useState<Set<string>>(new Set());
    
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [dimensions, setDimensions] = useState({ w: GRID_WIDTH + 2, h: GRID_HEIGHT + 2 });
    const [combo, setCombo] = useState(0);

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
        setDimensions({ w: w + 2, h: h + 2 });

        setSelectedTile(null);
        setActiveEffects([]);
        setLockedTiles(new Set());
        setScore(0);
        setTimeLeft(INITIAL_TIME);
        setGameState('playing');
        setCombo(0);
        audioManager.resetCombo();
    };

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) { // Use smaller threshold for smoother bar
                    setGameState('lost');
                    return 0;
                }
                // Decrease by 0.1s for smoother progress bar updates if we wanted, 
                // but 1s is fine for now. Let's stick to integer seconds for logic but maybe higher freq for UI?
                // Stick to 1s logic for consistency with original code, but check regularly.
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
        if (isEmpty && lockedTiles.size === 0 && activeEffects.filter(e => e.type !== 'hint').length === 0) {
            setGameState('won');
            return;
        }

        // Check solvability
        // Only check if not currently animating everything away
        // Ignore hints when checking if we should act
        const activeMatchEffects = activeEffects.filter(e => e.type !== 'hint');
        if (!checkSolvability(grid)) {
            // If we have locked tiles, the grid might become solvable after they disappear?
            // Or if grid is effectively empty but we are waiting for animation.
            // Let's wait until animations settle if we are not sure.
            if (activeMatchEffects.length > 0) return;

            // Auto shuffle
            console.log("No moves possible, shuffling...");
            setTimeout(() => {
                setGrid(prev => shuffleGrid(prev));
            }, 500);
        }
    }, [grid, gameState, lockedTiles.size, activeEffects.length]); // activeEffects.length includes hints but that's okay

    const clearHints = () => {
        setActiveEffects(prev => prev.filter(e => e.type !== 'hint'));
    };

    const handleTileClick = (tile: TileType) => {
        if (gameState !== 'playing') return;
        
        // Ignore clicks on tiles that are already matched (locked)
        if (lockedTiles.has(tile.id)) return;

        // Clear any existing hints on interaction
        clearHints();

        // If clicking same tile, deselect
        if (selectedTile?.id === tile.id) {
            setSelectedTile(null);
            audioManager.playClick();
            return;
        }

        // If no tile selected, select this one
        if (!selectedTile) {
            setSelectedTile(tile);
            audioManager.playClick();
            return;
        }

        // Check match
        const isSameType = selectedTile.type === tile.type;
        
        if (isSameType) {
            const start = { x: selectedTile.x, y: selectedTile.y };
            const end = { x: tile.x, y: tile.y };
            const foundPath = findPath(start, end, grid);

            if (foundPath) {
                // Match found!
                const effectId = `${Date.now()}-${Math.random()}`;
                const newEffect: ActiveEffect = {
                    id: effectId,
                    path: foundPath,
                    startTime: Date.now(),
                    type: 'match'
                };

                // 1. Add effect
                setActiveEffects(prev => [...prev, newEffect]);
                
                // 2. Lock tiles immediately to prevent interaction
                const tileId1 = selectedTile.id;
                const tileId2 = tile.id;
                setLockedTiles(prev => {
                    const next = new Set(prev);
                    next.add(tileId1);
                    next.add(tileId2);
                    return next;
                });

                // 3. Play sound & update score
                const currentCombo = audioManager.playMatch();
                setCombo(currentCombo);
                setScore(prev => prev + 100 + (currentCombo > 1 ? currentCombo * 10 : 0));
                setTimeLeft(INITIAL_TIME); // Reset timer

                // 4. Clear selection immediately so user can continue
                setSelectedTile(null);

                // 5. Schedule removal
                setTimeout(() => {
                    // Update Grid: remove tiles
                    setGrid(prev => {
                        const newGrid = prev.map(row => [...row]);
                        // Safe way: Check if the tile at [y][x] has the same ID.
                        if (newGrid[start.y][start.x]?.id === tileId1) {
                            newGrid[start.y][start.x] = null;
                        }
                        if (newGrid[end.y][end.x]?.id === tileId2) {
                            newGrid[end.y][end.x] = null;
                        }
                        return newGrid;
                    });

                    // Remove effect
                    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
                    
                    // Unlock tiles (though they are gone from grid now)
                    setLockedTiles(prev => {
                        const next = new Set(prev);
                        next.delete(tileId1);
                        next.delete(tileId2);
                        return next;
                    });
                }, EFFECT_DURATION);

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
        // Clear existing hints first
        clearHints();
        
        const hintResult = getHint(grid);
        if (hintResult) {
            const { path } = hintResult;
            
            // Create a hint effect
            const hintEffect: ActiveEffect = {
                id: `hint-${Date.now()}`,
                path: path,
                startTime: Date.now(),
                type: 'hint'
            };
            
            setActiveEffects(prev => [...prev, hintEffect]);
            
            // Auto-remove hint after some time (e.g., 3 seconds)
            setTimeout(() => {
                setActiveEffects(prev => prev.filter(e => e.id !== hintEffect.id));
            }, 3000);
        }
    };

    const handleReset = () => {
        clearHints();
        setGrid(prev => shuffleGrid(prev));
        setSelectedTile(null);
        audioManager.playShuffle();
    };

    // Calculate progress bar percentage
    const timePercentage = Math.max(0, Math.min(100, (timeLeft / INITIAL_TIME) * 100));

    return (
        <div className="game-container">
            <div className="game-header">
                <button onClick={onExit} className="exit-btn">🏠</button>
                <div className="score">Score: {score}</div>
                {combo > 1 && <div className="combo-display">Combo x{combo}!</div>}
                <div className={`timer ${timeLeft < 10 ? 'danger' : ''}`}>
                    {timeLeft}s
                </div>
            </div>

            <div className="board-container">
                <Board
                    grid={grid}
                    selectedTile={selectedTile}
                    onTileClick={handleTileClick}
                    width={dimensions.w}
                    height={dimensions.h}
                    lockedTiles={lockedTiles}
                >
                    <EffectsLayer activeEffects={activeEffects} width={dimensions.w} height={dimensions.h} />
                </Board>

                {gameState !== 'playing' && (
                    <div className="game-overlay">
                        <div className="game-message">
                            {gameState === 'won' ? '🎉 You Won! 🎉' : '💀 Game Over 💀'}
                            <div className="final-score">Final Score: {score}</div>
                            <button onClick={startNewGame}>Play Again</button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Progress Bar */}
            <div className="time-progress-container">
                <div 
                    className={`time-progress-bar ${timeLeft < 10 ? 'danger' : ''}`} 
                    style={{ width: `${timePercentage}%` }}
                />
            </div>

            <div className="game-controls">
                {/* Allow hint even if animations are playing, but maybe limit if already showing hint? */}
                <button onClick={handleHint} disabled={gameState !== 'playing'}>
                    🧭 Hint
                </button>
                <button onClick={handleReset} disabled={gameState !== 'playing' || activeEffects.filter(e => e.type !== 'hint').length > 0}>
                    🔄 Shuffle
                </button>
            </div>
        </div>
    );
};
