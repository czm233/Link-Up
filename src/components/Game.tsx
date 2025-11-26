import React, { useState, useEffect } from 'react';
import { type Grid, type Tile as TileType, createGrid, createGridFromMap } from '../logic/core';
import { findPath } from '../logic/pathfinding';
import { checkSolvability, getHint, shuffleGrid } from '../logic/mechanics';
import { Board } from './Board';
import { EffectsLayer, type ActiveEffect } from './EffectsLayer';
import { audioManager } from '../logic/audioManager';
import { themeManager } from '../logic/themeManager';
import { type GameMode, getModeConfig } from '../logic/gameMode';
import { SimpleLineChart } from './SimpleLineChart';
import './Game.css';
import './NostalgicMode.css';

const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;
const INITIAL_TIME = 30;
const EFFECT_DURATION = 300;

interface GameProps {
    mapData?: number[][];
    onExit: () => void;
    themeId?: string; // 当前主题 ID，变化时重新开始游戏
    gameMode?: GameMode; // 游戏模式
}

interface GameStats {
    hintCount: number;
    shuffleCount: number;
    totalClicks: number;
    matchCount: number;
    pathLengths: number[];
    matchTimes: number[]; // Time intervals between matches in ms
    accuracyHistory: { time: number, accuracy: number }[];
    matchHistory: { index: number, time: number, distance: number }[];
}

const INITIAL_STATS: GameStats = {
    hintCount: 0,
    shuffleCount: 0,
    totalClicks: 0,
    matchCount: 0,
    pathLengths: [],
    matchTimes: [],
    accuracyHistory: [],
    matchHistory: []
};

export const Game: React.FC<GameProps> = ({ mapData, onExit, themeId, gameMode = 'normal' }) => {
    // 获取当前模式的配置
    const modeConfig = getModeConfig(gameMode);
    const [grid, setGrid] = useState<Grid>([]);
    const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
    const [lockedTiles, setLockedTiles] = useState<Set<string>>(new Set());
    
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [dimensions, setDimensions] = useState({ w: GRID_WIDTH + 2, h: GRID_HEIGHT + 2 });
    const [combo, setCombo] = useState(0);
    
    const [elapsedTime, setElapsedTime] = useState(0);
    const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
    // Use a ref to track last match time to avoid re-renders
    const lastMatchTimeRef = React.useRef<number>(0);

    useEffect(() => {
        startNewGame();
    }, [mapData, themeId]);

    const startNewGame = () => {
        let newGrid;
        let w = GRID_WIDTH;
        let h = GRID_HEIGHT;

        // 从主题管理器获取当前的 tile 类型
        const tileTypes = themeManager.getTileTypes();

        if (mapData) {
            newGrid = createGridFromMap(mapData, tileTypes);
            w = mapData[0].length;
            h = mapData.length;
        } else {
            newGrid = createGrid(GRID_WIDTH, GRID_HEIGHT, tileTypes);
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
        setElapsedTime(0);
        setStats(INITIAL_STATS);
        lastMatchTimeRef.current = Date.now(); // Initialize match timer
        audioManager.resetCombo();
    };

    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    setGameState('lost');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing' || grid.length === 0) return;

        const isEmpty = grid.every(row => row.every(tile => tile === null));
        if (isEmpty && lockedTiles.size === 0 && activeEffects.filter(e => e.type !== 'hint').length === 0) {
            setGameState('won');
            return;
        }

        const activeMatchEffects = activeEffects.filter(e => e.type !== 'hint');
        if (!checkSolvability(grid)) {
            if (activeMatchEffects.length > 0) return;

            console.log("No moves possible, shuffling...");
            setTimeout(() => {
                setGrid(prev => shuffleGrid(prev));
            }, 500);
        }
    }, [grid, gameState, lockedTiles.size, activeEffects.length]);

    const clearHints = () => {
        setActiveEffects(prev => prev.filter(e => e.type !== 'hint'));
    };

    const handleBoardClick = () => {
        if (gameState === 'playing') {
            setStats(prev => {
                const newTotalClicks = prev.totalClicks + 1;
                const currentAccuracy = ((prev.matchCount * 2) / newTotalClicks) * 100;
                return {
                    ...prev,
                    totalClicks: newTotalClicks,
                    accuracyHistory: [...prev.accuracyHistory, { time: elapsedTime, accuracy: currentAccuracy }]
                };
            });
        }
    };

    const handleTileClick = (tile: TileType) => {
        if (gameState !== 'playing') return;
        if (lockedTiles.has(tile.id)) return;

        clearHints();

        if (selectedTile?.id === tile.id) {
            setSelectedTile(null);
            audioManager.playClick();
            return;
        }

        if (!selectedTile) {
            setSelectedTile(tile);
            audioManager.playClick();
            return;
        }

        const isSameType = selectedTile.type === tile.type;
        
        if (isSameType) {
            const start = { x: selectedTile.x, y: selectedTile.y };
            const end = { x: tile.x, y: tile.y };
            const foundPath = findPath(start, end, grid);

            if (foundPath) {
                // Calculate match time duration
                const now = Date.now();
                const matchDuration = now - lastMatchTimeRef.current;
                lastMatchTimeRef.current = now;

                // Update stats for successful match
                setStats(prev => ({
                    ...prev,
                    matchCount: prev.matchCount + 1,
                    pathLengths: [...prev.pathLengths, foundPath.length],
                    matchTimes: [...prev.matchTimes, matchDuration],
                    matchHistory: [...prev.matchHistory, {
                        index: prev.matchCount + 1,
                        time: matchDuration / 1000,
                        distance: foundPath.length
                    }]
                }));

                const effectId = `${Date.now()}-${Math.random()}`;
                const newEffect: ActiveEffect = {
                    id: effectId,
                    path: foundPath,
                    startTime: Date.now(),
                    type: 'match'
                };

                setActiveEffects(prev => [...prev, newEffect]);
                
                const tileId1 = selectedTile.id;
                const tileId2 = tile.id;
                setLockedTiles(prev => {
                    const next = new Set(prev);
                    next.add(tileId1);
                    next.add(tileId2);
                    return next;
                });

                const currentCombo = audioManager.playMatch();
                setCombo(currentCombo);
                setScore(prev => prev + 100 + (currentCombo > 1 ? currentCombo * 10 : 0));
                setTimeLeft(INITIAL_TIME);

                setSelectedTile(null);

                setTimeout(() => {
                    setGrid(prev => {
                        const newGrid = prev.map(row => [...row]);
                        if (newGrid[start.y][start.x]?.id === tileId1) {
                            newGrid[start.y][start.x] = null;
                        }
                        if (newGrid[end.y][end.x]?.id === tileId2) {
                            newGrid[end.y][end.x] = null;
                        }
                        return newGrid;
                    });

                    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
                    
                    setLockedTiles(prev => {
                        const next = new Set(prev);
                        next.delete(tileId1);
                        next.delete(tileId2);
                        return next;
                    });
                }, EFFECT_DURATION);

            } else {
                setSelectedTile(tile);
                audioManager.playClick();
            }
        } else {
            setSelectedTile(tile);
            audioManager.playClick();
        }
    };

    const handleHint = () => {
        clearHints();
        
        const hintResult = getHint(grid);
        if (hintResult) {
            setStats(prev => ({ ...prev, hintCount: prev.hintCount + 1 }));
            const { path } = hintResult;
            
            const hintEffect: ActiveEffect = {
                id: `hint-${Date.now()}`,
                path: path,
                startTime: Date.now(),
                type: 'hint'
            };
            
            setActiveEffects(prev => [...prev, hintEffect]);
            
            setTimeout(() => {
                setActiveEffects(prev => prev.filter(e => e.id !== hintEffect.id));
            }, 3000);
        }
    };

    const handleReset = () => {
        setStats(prev => ({ ...prev, shuffleCount: prev.shuffleCount + 1 }));
        clearHints();
        setGrid(prev => shuffleGrid(prev));
        setSelectedTile(null);
        audioManager.playShuffle();
    };

    const timePercentage = Math.max(0, Math.min(100, (timeLeft / INITIAL_TIME) * 100));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Derived stats calculations
    const validClicks = stats.matchCount * 2;
    const invalidClicks = stats.totalClicks - validClicks;
    const efficiency = stats.totalClicks > 0 ? ((validClicks / stats.totalClicks) * 100).toFixed(1) : '0.0';
    
    const maxDistance = stats.pathLengths.length > 0 ? Math.max(...stats.pathLengths) : 0;
    const minDistance = stats.pathLengths.length > 0 ? Math.min(...stats.pathLengths) : 0;
    const avgDistance = stats.pathLengths.length > 0 
        ? (stats.pathLengths.reduce((a, b) => a + b, 0) / stats.pathLengths.length).toFixed(1) 
        : '0.0';

    const minMatchTime = stats.matchTimes.length > 0 
        ? (Math.min(...stats.matchTimes) / 1000).toFixed(2) 
        : '--';
    const maxMatchTime = stats.matchTimes.length > 0 
        ? (Math.max(...stats.matchTimes) / 1000).toFixed(2) 
        : '--';

    // Prepare data for charts
    const speedData = stats.matchHistory.map(m => ({ x: m.index, y: m.time }));
    const distanceData = stats.matchHistory.map(m => ({ x: m.index, y: m.distance }));
    const accuracyData = stats.accuracyHistory.map(a => ({ x: a.time, y: a.accuracy }));

    return (
        <div className={`game-container ${modeConfig.cssClass}`}>
            <div className="game-header">
                <button onClick={onExit} className="exit-btn">🏠</button>
                <div className="score">Score: {score}</div>
                {combo > 1 && <div className="combo-display">Combo x{combo}!</div>}
                <div className={`timer ${timeLeft < 10 ? 'danger' : ''}`}>
                    {timeLeft}s
                </div>
            </div>

            <div 
                className="board-container"
                onMouseDownCapture={(e) => {
                    if (e.button === 0 && gameState === 'playing') {
                        handleBoardClick();
                    }
                }}
            >
                <Board
                    grid={grid}
                    selectedTile={selectedTile}
                    onTileClick={handleTileClick}
                    width={dimensions.w}
                    height={dimensions.h}
                    lockedTiles={lockedTiles}
                    isImageTheme={themeManager.isImageTheme()}
                    spriteConfig={themeManager.getSpriteConfig()}
                >
                    <EffectsLayer activeEffects={activeEffects} width={dimensions.w} height={dimensions.h} />
                </Board>

                {gameState !== 'playing' && (
                    <div className="game-overlay">
                        <div className="game-message">
                            <h2>{gameState === 'won' ? '🎉 You Won! 🎉' : '💀 Game Over 💀'}</h2>
                            
                            <div className="stats-grid">
                                <div className="stat-item"><span>Final Score</span><strong>{score}</strong></div>
                                <div className="stat-item"><span>Time Used</span><strong>{formatTime(elapsedTime)}</strong></div>
                                <div className="stat-item"><span>Efficiency</span><strong>{efficiency}%</strong></div>
                                <div className="stat-item"><span>Total Clicks</span><strong>{stats.totalClicks}</strong></div>
                                <div className="stat-item"><span>Valid / Invalid</span><strong>{validClicks} / {invalidClicks}</strong></div>
                                <div className="stat-item"><span>Tools</span><strong>H:{stats.hintCount} / S:{stats.shuffleCount}</strong></div>
                                <div className="stat-item"><span>Fastest Match</span><strong>{minMatchTime}s</strong></div>
                                <div className="stat-item"><span>Slowest Match</span><strong>{maxMatchTime}s</strong></div>
                                <div className="stat-item wide"><span>Distances (Tiles)</span><strong>Min: {minDistance} / Max: {maxDistance} / Avg: {avgDistance}</strong></div>
                            </div>

                            {/* Charts Section */}
                            <div className="charts-grid">
                                <SimpleLineChart 
                                    data={speedData} 
                                    title="Match Speed (Time per Match)" 
                                    color="#4caf50" 
                                    yLabel="Seconds"
                                    xLabel="Match Count"
                                />
                                <SimpleLineChart 
                                    data={distanceData} 
                                    title="Match Distance (Grid Cells)" 
                                    color="#2196f3"
                                    yLabel="Distance"
                                    xLabel="Match Count"
                                />
                                <SimpleLineChart 
                                    data={accuracyData} 
                                    title="Accuracy Trend (%)" 
                                    color="#ff9800" 
                                    yLabel="Accuracy %"
                                    xLabel="Time (s)"
                                    formatY={(v) => `${v.toFixed(0)}%`}
                                />
                            </div>

                            <button onClick={startNewGame} className="play-again-btn">Play Again</button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="time-progress-container">
                <div 
                    className={`time-progress-bar ${timeLeft < 10 ? 'danger' : ''}`} 
                    style={{ width: `${timePercentage}%` }}
                />
            </div>

            <div className="game-controls">
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
