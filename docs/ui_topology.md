# Link-Up UI拓扑图 (UI Topology)

## 应用根结构
```
App.tsx (应用主入口)
├── 状态: view ('menu' | 'game' | 'editor' | 'settings')
├── 状态: mapData (自定义地图数据)
└── 条件渲染四个主要视图
```

---

## 页面: 主菜单 (MainMenu)
- **路径**: `src/components/MainMenu.tsx`
- **语义锚点**: 游戏启动界面
- **布局特征**: 垂直居中flexbox，菜单项列表
- **交互元素**:
  - `开始游戏按钮` → 触发 onStartGame
  - `关卡编辑器按钮` → 触发 onOpenEditor
  - `加载地图输入` → 触发 onLoadMap(file)
  - `设置按钮` → 触发 onOpenSettings
- **样式文件**: `MainMenu.css`

---

## 页面: 游戏主界面 (Game)
- **路径**: `src/components/Game.tsx`
- **语义锚点**: 核心游戏区域
- **布局特征**: 三段式布局（顶部信息栏、中间棋盘、底部控制栏）

### 包含组件结构:
```
Game
├── .game-header (顶部信息栏)
│   ├── 退出按钮 (🏠) → onExit
│   ├── 分数显示 (Score: {score})
│   ├── 连击显示 (Combo x{combo}!) [条件显示]
│   └── 倒计时 (Time: {timeLeft}s) [危险状态: timeLeft < 10]
│
├── .board-container (棋盘容器)
│   ├── Board组件 (棋盘主体): `src/components/Board.tsx`
│   │   ├── CSS Grid布局 (动态columns/rows)
│   │   ├── Tile组件数组: `src/components/Tile.tsx`
│   │   └── EffectsLayer组件 (特效层): `src/components/EffectsLayer.tsx`
│   │
│   └── .game-overlay (游戏结束遮罩) [条件显示]
│       └── 胜利/失败消息 + 重玩按钮
│
└── .game-controls (底部控制栏)
    ├── 提示按钮 (🧭 Hint) → handleHint
    └── 洗牌按钮 (🔄 Shuffle) → handleReset
```

---

## 组件: 游戏棋盘 (Board)
- **路径**: `src/components/Board.tsx`
- **语义锚点**: 网格容器
- **Props接口**:
  ```typescript
  grid: Grid              // 二维数组网格数据
  selectedTile: Tile      // 当前选中方块
  onTileClick: Function   // 点击处理
  width/height: number    // 网格尺寸
  children: ReactNode     // 特效层插槽
  ```
- **布局特征**: CSS Grid，动态列数/行数
- **样式变量**: `--tile-size` (方块尺寸)

---

## 组件: 方块 (Tile)
- **路径**: `src/components/Tile.tsx`
- **语义锚点**: 单个可点击方块
- **Props接口**:
  ```typescript
  tile: Tile | null       // 方块数据
  isSelected: boolean     // 选中状态
  onClick: Function       // 点击回调
  ```
- **状态类名**:
  - `.tile` - 基础类
  - `.tile--selected` - 选中状态
  - `.tile--empty` - 空白格子
- **内容**: emoji图标或空

---

## 组件: 特效层 (EffectsLayer)
- **路径**: `src/components/EffectsLayer.tsx`
- **语义锚点**: 路径连线动画层
- **Props接口**:
  ```typescript
  path: Position[] | null // 路径点数组
  width/height: number    // 网格尺寸
  ```
- **渲染逻辑**: SVG polyline绘制连线
- **动画**: stroke-dasharray动画

---

## 页面: 地图编辑器 (Editor)
- **路径**: `src/components/Editor.tsx`
- **语义锚点**: 自定义关卡创建工具
- **布局特征**: 双栏布局（工具栏+画布）
- **核心功能**:
  - 网格尺寸调整 (宽度/高度输入)
  - 点击切换格子状态 (激活/禁用)
  - 导出JSON地图文件
  - 返回主菜单
- **状态管理**: 
  ```typescript
  grid: boolean[][]       // true=激活格子
  width/height: number    // 网格尺寸
  ```

---

## 页面: 设置界面 (Settings)
- **路径**: `src/components/Settings.tsx`
- **语义锚点**: 音效自定义配置
- **布局特征**: 表单式垂直布局
- **配置项**:
  - 点击音效 (文件上传)
  - 匹配音效 (文件上传)
  - 洗牌音效 (文件上传)
  - 10连击音效 (文件上传)
  - 20连击音效 (文件上传)
  - 30连击音效 (文件上传)
- **操作**:
  - 保存设置 → localStorage
  - 重置默认
  - 返回主菜单

---

## CSS架构
- **全局样式**: `src/index.css` (CSS变量定义)
- **应用容器**: `src/App.css` (根容器样式)
- **组件样式**: 每个组件独立CSS文件，BEM-like命名
- **关键CSS变量**:
  ```css
  --tile-size: 50px      // 方块尺寸
  --primary-color        // 主题色
  --danger-color         // 危险色(倒计时)
  ```

---

## 响应式断点
- **桌面端**: 默认布局
- **移动端**: 需要优化（当前为固定尺寸）
- **建议**: 添加媒体查询调整 `--tile-size`
