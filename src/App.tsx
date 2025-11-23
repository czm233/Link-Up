import { useState, useEffect } from 'react';
import './App.css'
import { Game } from './components/Game';
import { MainMenu } from './components/MainMenu';
import { Editor } from './components/Editor';

import { Settings } from './components/Settings';

function App() {
  const [view, setView] = useState<'menu' | 'game' | 'editor' | 'settings'>('menu');
  const [mapData, setMapData] = useState<number[][] | undefined>(undefined);
  
  // Tile Size State (default 40px)
  const [tileSize, setTileSize] = useState(() => {
      const saved = localStorage.getItem('link-up-tile-size');
      return saved ? parseInt(saved, 10) : 40;
  });

  const handleTileSizeChange = (size: number) => {
      setTileSize(size);
      localStorage.setItem('link-up-tile-size', size.toString());
  };

  const handleStartGame = () => {
    setMapData(undefined);
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
          onOpenEditor={() => setView('editor')}
          onLoadMap={handleLoadMap}
          onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'game' && (
        <Game
          mapData={mapData}
          onExit={() => setView('menu')}
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
        />
      )}
    </div>
  )
}

export default App
