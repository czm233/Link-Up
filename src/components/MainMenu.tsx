import React from 'react';
import './MainMenu.css';

interface MainMenuProps {
    onStartGame: () => void;
    onStartNostalgicGame: () => void;
    onOpenEditor: () => void;
    onLoadMap: (file: File) => void;
    onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onStartNostalgicGame, onOpenEditor, onLoadMap, onOpenSettings }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onLoadMap(e.target.files[0]);
        }
    };

    return (
        <div className="main-menu">
            <h1 className="title">Link-Up</h1>
            <div className="menu-buttons">
                <button onClick={onStartGame} className="menu-btn primary">
                    🎮 Random Game
                </button>
                <button onClick={onStartNostalgicGame} className="menu-btn nostalgic">
                    👾 怀旧模式
                </button>
                <label className="menu-btn secondary" style={{ cursor: 'pointer', textAlign: 'center' }}>
                    📂 Load Map
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </label>
                <button onClick={onOpenEditor} className="menu-btn secondary">
                    ✏️ Map Editor
                </button>
                <button onClick={onOpenSettings} className="menu-btn secondary">
                    ⚙️ Settings
                </button>
            </div>
            <div className="credits">
                <p>Made with ❤️ by Antigravity</p>
            </div>
        </div>
    );
};
