import React from 'react';
import { type Tile as TileType } from '../logic/core';
import { type SpriteConfig } from '../logic/themeManager';
import './Tile.css';

interface TileProps {
    tile: TileType | null;
    isSelected: boolean;
    isMatched?: boolean;
    isImageTheme?: boolean; // 是否使用图片主题
    spriteConfig?: SpriteConfig; // sprite sheet 配置（怀旧模式）
    onClick: () => void;
}

export const Tile: React.FC<TileProps> = ({
    tile,
    isSelected,
    isMatched,
    isImageTheme = false,
    spriteConfig,
    onClick
}) => {
    if (!tile) {
        return <div className="tile empty" />;
    }

    // 怀旧模式：使用独立图片 + 装饰性底座和边框
    if (spriteConfig && spriteConfig.blockUrl) {
        return (
            <div
                className="tile"
                onMouseDown={(e) => {
                    if (e.button === 0) {
                        onClick();
                    }
                }}
                onDragStart={(e) => e.preventDefault()}
                style={{ gridColumn: tile.x + 1, gridRow: tile.y + 1 }}
            >
                <div className={`tile-visual nostalgic-tile ${isMatched ? 'matched' : ''}`}>
                    {/* 方块底座 */}
                    <img
                        className="tile-block"
                        src={spriteConfig.blockUrl}
                        alt=""
                        draggable={false}
                    />
                    {/* 图标（独立图片） */}
                    <img
                        className="tile-nostalgic-icon"
                        src={tile.type}
                        alt=""
                        draggable={false}
                    />
                    {/* 选中边框 */}
                    {isSelected && spriteConfig.selectUrl && (
                        <img
                            className="tile-select-border"
                            src={spriteConfig.selectUrl}
                            alt=""
                            draggable={false}
                        />
                    )}
                </div>
            </div>
        );
    }

    // 普通模式：根据主题类型渲染不同的内容
    const renderContent = () => {
        if (isImageTheme) {
            return (
                <img
                    className="tile-content tile-image"
                    src={tile.type}
                    alt=""
                    draggable={false}
                />
            );
        }
        return <span className="tile-content">{tile.type}</span>;
    };

    return (
        <div
            className="tile"
            onMouseDown={(e) => {
                if (e.button === 0) {
                    onClick();
                }
            }}
            onDragStart={(e) => e.preventDefault()}
            style={{ gridColumn: tile.x + 1, gridRow: tile.y + 1 }}
        >
            <div className={`tile-visual ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}>
                {renderContent()}
            </div>
        </div>
    );
};
