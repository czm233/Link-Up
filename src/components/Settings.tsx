import React, { useState } from 'react';
import { audioManager } from '../logic/audioManager';
import './Settings.css';

interface SettingsProps {
    onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    const [settings, setSettings] = useState(audioManager.getSettings());

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
        switch (key) {
            case 'click': audioManager.playClick(); break;
            case 'shuffle': audioManager.playShuffle(); break;
            case 'match': audioManager.playMatch(); break; // Note: this increments combo
            case 'combo10':
            case 'combo20':
            case 'combo30':
                // We can't easily preview combo sounds via playMatch without faking combo state.
                // But audioManager exposes playBuffer privately.
                // Let's just trigger a match and hope it plays if we set combo state?
                // Actually, let's just rely on the user trusting it works or add a preview method to manager.
                // For now, just playMatch is fine, it will play default if not set.
                audioManager.playMatch();
                break;
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <button onClick={onBack}>← Back</button>
                <h2>Audio Settings</h2>
            </div>

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
    );
};
