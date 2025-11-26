/**
 * 游戏模式定义
 * 用于区分正常模式和怀旧模式，方便后续定制不同的界面风格
 */

// 游戏模式类型
export type GameMode = 'normal' | 'nostalgic';

// 模式配置接口
export interface ModeConfig {
    id: GameMode;
    name: string;
    description: string;
    themeId: string;  // 对应的主题 ID
    cssClass: string; // CSS 类名，用于样式区分
}

// 模式配置表
export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
    normal: {
        id: 'normal',
        name: '经典模式',
        description: '使用 Emoji 表情的标准游戏模式',
        themeId: 'emoji-fruits',
        cssClass: 'mode-normal',
    },
    nostalgic: {
        id: 'nostalgic',
        name: '怀旧模式',
        description: '复古风格的连连看，唤起童年回忆',
        themeId: 'nostalgic',
        cssClass: 'mode-nostalgic',
    },
};

/**
 * 获取模式配置
 */
export function getModeConfig(mode: GameMode): ModeConfig {
    return MODE_CONFIGS[mode];
}

/**
 * 获取所有可用模式
 */
export function getAllModes(): ModeConfig[] {
    return Object.values(MODE_CONFIGS);
}
