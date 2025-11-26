import React, { useState } from 'react';
import { audioManager } from '../logic/audioManager';
import { themeManager, type TileTheme } from '../logic/themeManager';
import './Settings.css';

interface SettingsProps {
    onBack: () => void;
    tileSize: number;
    onTileSizeChange: (size: number) => void;
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, tileSize, onTileSizeChange, currentThemeId, onThemeChange }) => {
    const [settings, setSettings] = useState(audioManager.getSettings());
    const [themes] = useState<TileTheme[]>(themeManager.getAllThemes());

    const handleFileChange = (key: keyof typeof settings, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const newSettings = { ...settings, [key]: result };
            setSettings(newSettings);
            audioManager.saveSettings(newSettings);
        };
        reader.readAsDataURL(file);
    };

    const handleClear = (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: null };
        setSettings(newSettings);
        audioManager.saveSettings(newSettings);
    };

    const playPreview = (key: string) => {
        // Use previewSound for all sounds - it bypasses combo logic
        // and directly plays the custom buffer if set, or falls back to synthesized default
        audioManager.previewSound(key);
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <button onClick={onBack}>← Back</button>
                <h2>Settings</h2>
            </div>

            <div className="settings-section">
                <h3>Visual Settings</h3>
                <div className="setting-item">
                    <span className="setting-label">Tile Size: {tileSize}px</span>
                    <div className="setting-controls slider-container">
                        <input
                            type="range"
                            min="30"
                            max="80"
                            value={tileSize}
                            onChange={(e) => onTileSizeChange(parseInt(e.target.value, 10))}
                            className="slider"
                        />
                    </div>
                    <div className="preview-tile" style={{ width: tileSize, height: tileSize }}>
                        🍎
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h3>Tile Theme</h3>
                <div className="theme-list">
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className={`theme-item ${currentThemeId === theme.id ? 'selected' : ''}`}
                            onClick={() => onThemeChange(theme.id)}
                        >
                            <div className="theme-preview">
                                {theme.type === 'image' ? (
                                    <img src={theme.preview} alt={theme.name} className="theme-preview-image" />
                                ) : (
                                    <span className="theme-preview-emoji">{theme.preview}</span>
                                )}
                            </div>
                            <div className="theme-info">
                                <span className="theme-name">{theme.name}</span>
                                <span className="theme-count">{theme.tiles.length} 种图案</span>
                            </div>
                            {currentThemeId === theme.id && <span className="theme-check">✓</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-section">
                <h3>Audio Settings</h3>
                <div className="settings-list">
                    {Object.keys(settings).map((key) => (
                        <div key={key} className="setting-item">
                            <span className="setting-label">{key.toUpperCase()}</span>
                            <div className="setting-controls">
                                <label className="upload-btn">
                                    Upload
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileChange(key as any, e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {settings[key as keyof typeof settings] && (
                                    <button onClick={() => handleClear(key as any)} className="clear-btn">Clear</button>
                                )}
                                <button onClick={() => playPreview(key)} className="preview-btn">▶️</button>
                            </div>
                            <span className="status">{settings[key as keyof typeof settings] ? 'Custom' : 'Default'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
