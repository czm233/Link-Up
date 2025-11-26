# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Link-Up 是一个连连看游戏，使用 React + TypeScript + Vite 构建，采用 Component-Logic Separation 架构模式。

**技术栈**:
- React 19.2.0
- TypeScript 5.9.3 (严格模式)
- Vite 7.2.4 (构建工具)
- Web Audio API (音频管理)
- 标准 CSS (无 CSS 框架)

## 常用开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 核心架构设计

### 1. Component-Logic Separation 分层架构

**严格的两层分离**:
- **UI 层** (`src/components/`): 只负责展示和用户交互
- **逻辑层** (`src/logic/`): 纯函数算法，无副作用

```
App.tsx (路由容器)
    ├── MainMenu.tsx (主菜单)
    ├── Game.tsx (游戏主控制器)
    │   ├── Board.tsx → Tile.tsx (棋盘渲染)
    │   └── EffectsLayer.tsx (SVG 连线动画)
    ├── Editor.tsx (地图编辑器)
    └── Settings.tsx (音效配置)

src/logic/
    ├── core.ts (Grid 数据结构, createGrid)
    ├── pathfinding.ts (BFS 寻路算法, 最多 2 转弯)
    ├── mechanics.ts (洗牌, 提示, 可解性检查)
    └── audioManager.ts (单例音频管理器)
```

### 2. 关键数据结构

**网格系统**:
```typescript
// 所有网格都包含 1 个单位的 padding，边界为 null
type Grid = (Tile | null)[][];

interface Tile {
    id: string;
    type: string;  // Emoji 字符
    x: number;     // 包含 padding 偏移后的坐标
    y: number;
}
```

**坐标系统**: `(x, y)` 从左上角开始，实际游戏区域坐标为 `[1, width]` 和 `[1, height]`，边界的 `grid[0][*]` 和 `grid[*][0]` 为 `null`。

### 3. 核心算法

**路径查找** (`src/logic/pathfinding.ts:15`):
- BFS 算法，最多允许 2 个转弯
- 路径只能通过空单元格（`null`）或目标单元格
- 返回 `Position[]` 路径数组或 `null`

**洗牌机制** (`src/logic/mechanics.ts:63`):
- 提取所有非空方块并 Fisher-Yates 洗牌
- 保持网格布局不变（`null` 位置不变）
- 如果无解会自动触发洗牌

**提示系统** (`src/logic/mechanics.ts:15`):
- 遍历所有同类型方块对
- 使用 `findPath` 验证可连接性
- 返回第一个可匹配的方块对和路径

### 4. 音频系统设计

**AudioManager 单例** (`src/logic/audioManager.ts:19`):
- 支持自定义音效上传（存储到 localStorage）
- 回退到合成音效（Web Audio API 生成）
- Combo 状态机：5 秒内连续消除计入 combo

**Combo 里程碑**:
- combo ≥ 15: `combo15` 音效
- combo ≥ 30: `combo30` 音效
- combo ≥ 50: `combo50` 音效

**音效类型**:
- `click`: 点击方块
- `match`: 成功匹配
- `shuffle`: 洗牌
- `combo15/30/50`: Combo 里程碑

### 5. 状态管理

使用 React 的 `useState` / `useEffect` 管理组件本地状态，**无全局状态管理库**。

**Game 组件核心状态** (`src/components/Game.tsx:45-59`):
```typescript
const [grid, setGrid] = useState<Grid>([]);
const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
const [score, setScore] = useState(0);
const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
const [combo, setCombo] = useState(0);
const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
```

### 6. 游戏交互流程

**用户点击方块**:
```
1. Tile.tsx onClick 事件
2. Board.tsx 冒泡到 onTileClick
3. Game.tsx handleTileClick 处理逻辑:
   - 第一次点击 → 选中方块
   - 第二次点击同类型 → 调用 findPath 验证
   - 路径存在 → 播放动画、更新分数、移除方块
   - 路径不存在 → 切换选中目标
```

**匹配成功后**:
```
1. 创建 ActiveEffect (连线动画)
2. 锁定两个方块 (lockedTiles Set)
3. 调用 audioManager.playMatch() 播放音效并更新 combo
4. 300ms 后移除方块并清理锁定状态
5. 检查游戏状态 (胜利/无解自动洗牌)
```

## 编码规范

### 必须遵守的规则

1. **组件定义**: 使用 `React.FC<Props>` 定义函数式组件，Props 必须有明确的 Interface
   ```typescript
   interface GameProps {
       mapData?: number[][];
       onExit: () => void;
   }
   export const Game: React.FC<GameProps> = ({ mapData, onExit }) => { ... }
   ```

2. **导出规范**: 使用具名导出 `export const ComponentName`，避免默认导出（App.tsx 除外）

3. **类型安全**: 禁止使用 `any` 类型，所有数据结构必须有明确的 TypeScript 接口

4. **架构分层**: UI 组件与业务逻辑严格分离，组件不应包含复杂算法

5. **样式导入**: 每个组件使用独立的 CSS 文件，通过 `import './ComponentName.css'` 导入

6. **文档注释**: 核心逻辑函数必须使用 JSDoc 风格注释

### 代码风格

- **命名规范**: 组件 `PascalCase`，函数 `camelCase`，常量 `UPPER_SNAKE_CASE`
- **缩进**: 4 个空格
- **分号**: 语句结尾使用分号
- **引号**: 优先单引号，JSX 属性使用双引号

### 严禁的反模式

- ❌ 禁止使用内联 `style` 属性（除非必要的动态样式，如 `grid-template-columns`）
- ❌ 禁止使用 `any` 类型
- ❌ 禁止在组件中直接实现复杂算法（必须抽离到 `logic` 层）
- ❌ 禁止省略 `useEffect` 依赖数组
- ❌ 禁止混用导出方式（统一具名导出）
- ❌ 禁止违反 React Hooks 规则（条件渲染中不能调用 Hook）

## 项目特殊约定

1. **Tile 尺寸**: 通过 CSS 变量 `--tile-size` 控制，默认 40px，可在 Settings 中调整
2. **时间限制**: 每次匹配成功重置为 30 秒，低于 10 秒时进度条变红
3. **效果动画持续时间**: 300ms (`EFFECT_DURATION`)
4. **Combo 时间窗口**: 5 秒 (`COMBO_WINDOW`)
5. **地图文件格式**: JSON `{ "map": number[][] }`，1 表示有方块，0 表示空

## 性能优化建议

1. **高频调用路径**: `handleTileClick` 需要快速响应，避免在其中执行重计算
2. **计算密集**: `checkSolvability` 在每次 `grid` 变化后执行，可考虑 debounce
3. **渲染密集**: `Tile` 组件可以使用 `React.memo` 优化
4. **内存占用**: AudioBuffer 缓存在 localStorage 中，大文件可能导致存储失败

## 调试与排查

- **路径无法连接**: 检查 `grid` 是否包含正确的 padding，坐标计算是否有偏移
- **音效不播放**: 检查浏览器 autoplay policy，AudioContext 可能处于 suspended 状态
- **无解死锁**: `checkSolvability` 会自动触发 `shuffleGrid`，注意 500ms 延迟
- **Combo 不触发**: 检查两次匹配时间间隔是否超过 5 秒（`COMBO_WINDOW`）
