/**
 * 素材主题管理器
 * 支持多种类型的方块素材：Emoji、图片、自定义
 */

// 单个方块素材的定义
export interface TileAsset {
    id: string;         // 唯一标识符，用于匹配（如 "fruit-1", "icon-5"）
    value: string;      // 实际值：emoji 字符、图片路径或 base64 数据
}

// 主题类型
export type ThemeType = 'emoji' | 'image' | 'sprite' | 'nostalgic' | 'custom';

// Sprite Sheet 配置（用于怀旧模式等）
export interface SpriteConfig {
    sheetUrl: string;       // sprite sheet 图片路径
    iconWidth: number;      // 每个图标的宽度
    iconHeight: number;     // 每个图标的高度
    iconCount: number;      // 图标总数
    blockUrl?: string;      // 方块底座图片路径
    selectUrl?: string;     // 选中边框图片路径
}

// 主题定义
export interface TileTheme {
    id: string;             // 唯一标识符
    name: string;           // 显示名称
    type: ThemeType;        // 主题类型
    tiles: TileAsset[];     // 包含的素材列表
    preview: string;        // 预览用的素材（第一个 tile 的值）
    spriteConfig?: SpriteConfig; // sprite 类型主题的配置
}

// 存储键名
const STORAGE_KEY = 'linkup-current-theme';
const CUSTOM_THEMES_KEY = 'linkup-custom-themes';

// 内置 Emoji 主题
const EMOJI_THEME: TileTheme = {
    id: 'emoji-fruits',
    name: 'Emoji 水果',
    type: 'emoji',
    tiles: [
        { id: 'e-1', value: '🍎' },
        { id: 'e-2', value: '🍌' },
        { id: 'e-3', value: '🍇' },
        { id: 'e-4', value: '🍊' },
        { id: 'e-5', value: '🍓' },
        { id: 'e-6', value: '🍉' },
        { id: 'e-7', value: '🍒' },
        { id: 'e-8', value: '🍑' },
        { id: 'e-9', value: '🍍' },
        { id: 'e-10', value: '🥝' },
        { id: 'e-11', value: '🥑' },
        { id: 'e-12', value: '🍆' },
    ],
    preview: '🍎',
};

// 生成图片主题（icon 文件夹中的 50 张图片）
function createImageTheme(): TileTheme {
    const tiles: TileAsset[] = [];
    // 使用 50 张图片
    for (let i = 1; i <= 50; i++) {
        tiles.push({
            id: `icon-${i}`,
            value: `/icon/${i}.png`,
        });
    }
    return {
        id: 'icon-set',
        name: '图标素材',
        type: 'image',
        tiles,
        preview: '/icon/1.png',
    };
}

const ICON_THEME = createImageTheme();

// 怀旧模式主题（使用独立图片 + 装饰性底座和边框）
function createNostalgicTheme(): TileTheme {
    const tiles: TileAsset[] = [];
    // 使用 nostalgic/icons 目录下的 50 张图片
    for (let i = 1; i <= 50; i++) {
        tiles.push({
            id: `nostalgic-${i}`,
            value: `/nostalgic/icons/${i}.png`,
        });
    }

    return {
        id: 'nostalgic',
        name: '怀旧经典',
        type: 'nostalgic', // 新增类型：nostalgic（带装饰的图片）
        tiles,
        preview: '/nostalgic/icons/1.png',
        spriteConfig: {
            sheetUrl: '', // 不再使用 sprite sheet
            iconWidth: 35,
            iconHeight: 35,
            iconCount: 50,
            blockUrl: '/nostalgic/block.png',
            selectUrl: '/nostalgic/select.png',
        },
    };
}

const NOSTALGIC_THEME = createNostalgicTheme();

// 内置主题列表
const BUILT_IN_THEMES: TileTheme[] = [EMOJI_THEME, ICON_THEME, NOSTALGIC_THEME];

/**
 * 主题管理器类
 * 单例模式，管理所有可用主题和当前选中的主题
 */
class ThemeManager {
    private currentThemeId: string;
    private customThemes: TileTheme[];

    constructor() {
        // 从 localStorage 加载当前主题
        this.currentThemeId = localStorage.getItem(STORAGE_KEY) || EMOJI_THEME.id;

        // 加载自定义主题
        const savedCustomThemes = localStorage.getItem(CUSTOM_THEMES_KEY);
        this.customThemes = savedCustomThemes ? JSON.parse(savedCustomThemes) : [];
    }

    /**
     * 获取所有可用主题
     */
    getAllThemes(): TileTheme[] {
        return [...BUILT_IN_THEMES, ...this.customThemes];
    }

    /**
     * 获取当前主题
     */
    getCurrentTheme(): TileTheme {
        const allThemes = this.getAllThemes();
        const theme = allThemes.find(t => t.id === this.currentThemeId);
        return theme || EMOJI_THEME; // 回退到默认主题
    }

    /**
     * 获取当前主题的 ID
     */
    getCurrentThemeId(): string {
        return this.currentThemeId;
    }

    /**
     * 设置当前主题
     */
    setCurrentTheme(themeId: string): void {
        const allThemes = this.getAllThemes();
        const theme = allThemes.find(t => t.id === themeId);
        if (theme) {
            this.currentThemeId = themeId;
            localStorage.setItem(STORAGE_KEY, themeId);
        }
    }

    /**
     * 获取当前主题的所有 tile 类型值
     * 这个方法返回的值用于 createGrid 函数
     */
    getTileTypes(): string[] {
        const theme = this.getCurrentTheme();
        return theme.tiles.map(t => t.value);
    }

    /**
     * 判断当前主题是否为图片类型
     */
    isImageTheme(): boolean {
        const type = this.getCurrentTheme().type;
        return type === 'image' || type === 'sprite' || type === 'nostalgic';
    }

    /**
     * 判断当前主题是否为 sprite 类型
     */
    isSpriteTheme(): boolean {
        return this.getCurrentTheme().type === 'sprite';
    }

    /**
     * 判断当前主题是否为怀旧模式（带装饰的图片）
     */
    isNostalgicTheme(): boolean {
        return this.getCurrentTheme().type === 'nostalgic';
    }

    /**
     * 获取当前主题的 sprite 配置
     */
    getSpriteConfig(): SpriteConfig | undefined {
        return this.getCurrentTheme().spriteConfig;
    }

    /**
     * 添加自定义主题
     * @param theme 新的主题定义
     */
    addCustomTheme(theme: TileTheme): void {
        // 确保 ID 唯一
        const existingIndex = this.customThemes.findIndex(t => t.id === theme.id);
        if (existingIndex >= 0) {
            this.customThemes[existingIndex] = theme;
        } else {
            this.customThemes.push(theme);
        }
        this.saveCustomThemes();
    }

    /**
     * 删除自定义主题
     */
    removeCustomTheme(themeId: string): boolean {
        const index = this.customThemes.findIndex(t => t.id === themeId);
        if (index >= 0) {
            this.customThemes.splice(index, 1);
            this.saveCustomThemes();

            // 如果删除的是当前主题，切换回默认
            if (this.currentThemeId === themeId) {
                this.setCurrentTheme(EMOJI_THEME.id);
            }
            return true;
        }
        return false;
    }

    /**
     * 保存自定义主题到 localStorage
     */
    private saveCustomThemes(): void {
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(this.customThemes));
    }

    /**
     * 根据主题类型获取渲染信息
     * @param value tile 的 type 值
     * @returns 渲染所需的信息
     */
    getRenderInfo(value: string): { type: ThemeType; value: string } {
        const theme = this.getCurrentTheme();
        return {
            type: theme.type,
            value: value,
        };
    }
}

// 导出单例实例
export const themeManager = new ThemeManager();
