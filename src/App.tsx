import { useState } from 'react';
import './App.css'
import { Game } from './components/Game';
import { MainMenu } from './components/MainMenu';
import { Editor } from './components/Editor';
import { Settings } from './components/Settings';
import { themeManager } from './logic/themeManager';
import { type GameMode, getModeConfig } from './logic/gameMode';

function App() {
  const [view, setView] = useState<'menu' | 'game' | 'editor' | 'settings'>('menu');
  const [mapData, setMapData] = useState<number[][] | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode>('normal');

  // Tile Size State (default 40px)
  const [tileSize, setTileSize] = useState(() => {
      const saved = localStorage.getItem('link-up-tile-size');
      return saved ? parseInt(saved, 10) : 40;
  });

  // 主题状态（从 themeManager 初始化）
  const [currentThemeId, setCurrentThemeId] = useState(() => themeManager.getCurrentThemeId());

  const handleTileSizeChange = (size: number) => {
      setTileSize(size);
      localStorage.setItem('link-up-tile-size', size.toString());
  };

  const handleThemeChange = (themeId: string) => {
      themeManager.setCurrentTheme(themeId);
      setCurrentThemeId(themeId);
  };

  // 开始普通模式游戏
  const handleStartGame = () => {
    setGameMode('normal');
    setMapData(undefined);
    // 普通模式使用当前设置的主题
    setView('game');
  };

  // 开始怀旧模式游戏
  const handleStartNostalgicGame = () => {
    setGameMode('nostalgic');
    setMapData(undefined);
    // 怀旧模式强制使用 icon 主题
    const nostalgicConfig = getModeConfig('nostalgic');
    themeManager.setCurrentTheme(nostalgicConfig.themeId);
    setCurrentThemeId(nostalgicConfig.themeId);
    setView('game');
  };

  const handleLoadMap = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.map) {
          setMapData(json.map);
          setView('game');
        }
      } catch (err) {
        alert("Invalid map file!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
        className="app-container"
        style={{ 
            '--tile-size': `${tileSize}px` 
        } as React.CSSProperties}
    >
      {view === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onStartNostalgicGame={handleStartNostalgicGame}
          onOpenEditor={() => setView('editor')}
          onLoadMap={handleLoadMap}
          onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'game' && (
        <Game
          mapData={mapData}
          onExit={() => setView('menu')}
          themeId={currentThemeId}
          gameMode={gameMode}
        />
      )}
      {view === 'editor' && (
        <Editor onBack={() => setView('menu')} />
      )}
      {view === 'settings' && (
        <Settings
            onBack={() => setView('menu')}
            tileSize={tileSize}
            onTileSizeChange={handleTileSizeChange}
            currentThemeId={currentThemeId}
            onThemeChange={handleThemeChange}
        />
      )}
    </div>
  )
}

export default App
