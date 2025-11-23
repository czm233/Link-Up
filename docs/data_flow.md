# Link-Up 数据流向图 (Data Flow)

## 整体数据流架构
```
┌─────────────┐
│   App.tsx   │ ← 应用状态容器
│  view state │
└──────┬──────┘
       │ Props传递
       ↓
┌─────────────────────────────────────┐
│         四大视图组件                 │
│  MainMenu / Game / Editor / Settings │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│         逻辑层 (src/logic/)         │
│  纯函数算法，无副作用                │
└─────────────────────────────────────┘
```

---

## 核心游戏数据流

### 1. 游戏初始化流程
```
App.tsx (mapData?)
    ↓ Props
Game.tsx (startNewGame)
    ↓ 调用
logic/core.ts (createGrid/createGridFromMap)
    ↓ 返回Grid
Game.tsx (setGrid)
    ↓ Props
Board.tsx → Tile.tsx (渲染)
```

### 2. 用户交互流程
```
用户点击方块
    ↓
Tile.tsx (onClick)
    ↓ 事件冒泡
Board.tsx (onTileClick)
    ↓ Props回调
Game.tsx (handleTileClick)
    ├→ 选中逻辑判断
    ├→ logic/pathfinding.ts (findPath) ← 路径计算
    ├→ logic/audioManager.ts (playSound) ← 音效播放
    └→ 状态更新 (setGrid, setScore, setCombo)
        ↓
    Board重新渲染
```

### 3. 路径查找数据流
```
Game.tsx
    │
    ├─[起点/终点坐标]→ pathfinding.ts
    │                       ↓
    │                   BFS算法
    │                   (最多2转弯)
    │                       ↓
    ├←─[路径数组/null]──────┘
    │
    └→ EffectsLayer.tsx (绘制连线)
```

---

## 状态管理详解

### Game组件本地状态
```typescript
// src/components/Game.tsx
const [grid, setGrid] = useState<Grid>([]);           // 核心网格数据
const [selectedTile, setSelectedTile] = useState();   // 当前选中
const [path, setPath] = useState();                   // 连线路径
const [score, setScore] = useState(0);                // 分数
const [timeLeft, setTimeLeft] = useState(30);         // 倒计时
const [gameState, setGameState] = useState();         // 游戏状态
const [hint, setHint] = useState();                   // 提示对
const [combo, setCombo] = useState(0);                // 连击数
```

### 数据流向关系
```
grid ──────→ Board ──→ Tile[] (渲染所有方块)
     └────→ mechanics.ts (检查可解性)

selectedTile ──→ Board ──→ Tile.isSelected (高亮显示)

path ──────────→ EffectsLayer (SVG连线)

score/timeLeft/combo ──→ Game.tsx UI直接显示

gameState ─────→ 控制游戏流程和UI遮罩
```

---

## 音频系统数据流

### AudioManager单例模式
```
audioManager (全局单例)
    ├── settings (localStorage持久化)
    ├── buffers (Map<string, AudioBuffer>)
    └── comboState (连击状态机)

Settings.tsx 
    ↓ 上传音频文件
    ↓ Base64/URL
audioManager.saveSettings()
    ↓
localStorage + 内存缓存
    ↓
Game.tsx调用播放方法
```

### 连击系统状态机
```
初始状态: comboCount = 0
    ↓
消除匹配 → playMatch()
    ↓
检查时间窗口(5秒)
    ├─是→ comboCount++
    └─否→ comboCount = 1
    ↓
检查里程碑
    ├─≥30 → combo30音效
    ├─≥20 → combo20音效
    ├─≥10 → combo10音效
    └─默认 → 基础match音效
```

---

## 编辑器数据流

### Editor组件数据转换
```
Editor.tsx (boolean[][])
    ↓ 用户绘制
内部grid状态更新
    ↓ 导出
JSON.stringify({ map: grid })
    ↓ 下载文件
用户加载 → MainMenu
    ↓ FileReader
JSON.parse → mapData
    ↓ Props
Game.tsx → createGridFromMap
```

---

## 关键算法数据依赖

### 寻路算法 (BFS)
```
输入: {
    start: Position,
    end: Position,
    grid: Grid
}
    ↓
处理: {
    队列: PathNode[],
    访问集: Set<string>,
    方向数组: DIRECTIONS
}
    ↓
输出: Position[] | null
```

### 洗牌算法
```
输入: Grid
    ↓
提取: 所有非null的Tile
    ↓
Fisher-Yates洗牌
    ↓
重新放置到原位置
    ↓
输出: 新Grid (位置不变，内容打乱)
```

### 提示算法
```
输入: Grid
    ↓
收集: 按type分组的Tile
    ↓
双重循环: 同type配对
    ↓
调用: findPath验证
    ↓
输出: [Position, Position] | null
```

---

## 性能关键路径

1. **高频调用**: handleTileClick → 需要快速响应
2. **计算密集**: checkSolvability → 每次grid变化后执行
3. **渲染密集**: Board组件 → 大量Tile子组件
4. **内存占用**: AudioBuffer缓存 → 需要管理大小

## 优化建议

1. **React.memo**: Tile组件可以memo优化
2. **useMemo**: Grid衍生计算可以缓存
3. **debounce**: 自动洗牌可以防抖
4. **虚拟化**: 大网格可考虑虚拟滚动
