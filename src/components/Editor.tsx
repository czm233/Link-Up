import React, { useState } from 'react';
import './Editor.css';

interface EditorProps {
    onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ onBack }) => {
    const [width, setWidth] = useState(8);
    const [height, setHeight] = useState(10);
    // mapData: 1 = active, 0 = empty
    const [mapData, setMapData] = useState<number[][]>(
        Array(10).fill(0).map(() => Array(8).fill(1))
    );

    const handleResize = (w: number, h: number) => {
        const newMap = Array(h).fill(0).map((_, y) =>
            Array(w).fill(0).map((_, x) => {
                // Preserve existing data if possible
                if (y < mapData.length && x < mapData[0].length) {
                    return mapData[y][x];
                }
                return 1;
            })
        );
        setWidth(w);
        setHeight(h);
        setMapData(newMap);
    };

    const toggleCell = (x: number, y: number) => {
        const newMap = [...mapData];
        newMap[y] = [...newMap[y]];
        newMap[y][x] = newMap[y][x] === 1 ? 0 : 1;
        setMapData(newMap);
    };

    const handleSave = () => {
        const data = {
            width,
            height,
            map: mapData
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'link-up-map.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <button onClick={onBack}>← Back</button>
                <h2>Map Editor</h2>
                <button onClick={handleSave} className="save-btn">💾 Save JSON</button>
            </div>

            <div className="editor-controls">
                <label>
                    Width:
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => handleResize(Math.max(4, parseInt(e.target.value) || 4), height)}
                        min="4" max="12"
                    />
                </label>
                <label>
                    Height:
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => handleResize(width, Math.max(4, parseInt(e.target.value) || 4))}
                        min="4" max="16"
                    />
                </label>
            </div>

            <div
                className="editor-grid"
                style={{
                    gridTemplateColumns: `repeat(${width}, 30px)`,
                    gridTemplateRows: `repeat(${height}, 30px)`
                }}
            >
                {mapData.map((row, y) => (
                    row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            className={`editor-cell ${cell === 1 ? 'active' : 'inactive'}`}
                            onClick={() => toggleCell(x, y)}
                        />
                    ))
                ))}
            </div>

            <p className="hint">Click cells to toggle them on/off</p>
        </div>
    );
};
