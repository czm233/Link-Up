# Cursor 项目智能初始化协议 (High-Precision Init Protocol)

## 🔴 角色定义
你现在是本项目的首席技术官 (CTO)。你的任务不是写代码，而是建立一套能够指导未来所有 AI 行为的“上下文索引库”。你需要通过深度静态分析，产出高可用的项目规则与文档。

## 🔵 执行流程
请严格按照以下 XML 流程节点顺序执行，不要跳过任何步骤。

<process>

    <step id="1" name="深度审计 (Deep Audit)">
        <action>遍历根目录，重点分析 package.json, tsconfig.json, 以及 src/app/pages 下的核心文件。</action>
        <analysis_targets>
            <target>技术栈版本 (React 18/19? Next.js App/Pages Router? Vue 2/3?)</target>
            <target>状态管理方案 (Redux, Zustand, Context, Recoil?)</target>
            <target>样式方案 (Tailwind, CSS Modules, Styled-components?)</target>
            <target>代码风格特征 (是否使用 TypeScript 严格模式? 命名是用 camelCase 还是 snake_case?)</target>
            <target>项目“坏味道” (是否存在大量 any? 是否有废弃库?)</target>
        </analysis_targets>
    </step>

    <step id="2" name="构建规则核心 (.mdc Rule Generation)">
        <action>在项目根目录创建 `.cursor/rules/project-root.mdc`。</action>
        <content_requirement>
            必须包含 Frontmatter (YAML头)，确保 cursor 自动读取。
            内容结构如下：
            
            ---
            description: 此项目的全局上下文、技术栈和核心编码规范，每次回答问题前必须参考。
            globs: **/*.{ts,tsx,js,jsx,py,rs,go}
            alwaysApply: true
            ---

            # 项目核心上下文
            - **架构模式**: [填写分析出的架构，如 Feature-First, MVC, Clean Arch]
            - **主要技术栈**: [列出关键库]
            
            # 必须遵守的编码规范 (Hard Rules)
            1. [根据现有代码推断，例如：优先使用 Functional Components]
            2. [例如：所有接口必须定义 TypeScript Interface]
            3. [例如：禁止在 UI 组件直接处理复杂数据逻辑，必须抽离到 hooks 或 logic 层]
            
            # 严禁出现的反模式 (Anti-patterns)
            - [例如：禁止使用内联 style]
            - [例如：禁止使用 any 类型]
        </content_requirement>
    </step>

    <step id="3" name="生成业务地图 (Documentation Matrix)">
        <action>在 `docs/` 目录下生成以下三个关键文档：</action>
        
        <doc file="docs/feature_matrix.md" type="需求梳理">
            列出当前已实现的功能点。
            格式：[状态: ✅完成/🚧进行中] - [功能模块] - [对应核心文件路径]
        </doc>

        <doc file="docs/ui_topology.md" type="UI拓扑图">
            这是最关键的文档。请为主要页面和复杂组件建立“语义锚点”。
            格式示例：
            ## 页面: 游戏主界面 (GameScene)
            - 路径: `src/pages/Game.tsx`
            - 包含组件:
              - `Board` (棋盘区域): `src/components/Board.tsx`
              - `ScorePanel` (计分板): `src/components/UI/Score.tsx`
            - 布局特征: Flex 布局，移动端适配
        </doc>
        
        <doc file="docs/data_flow.md" type="数据流向图">
            简述核心数据是如何流动的。
            例如：Global Store (`src/store/game.ts`) -> Board Component -> Tile Component (通过 Props 传递)
        </doc>
    </step>

</process>

## 🟢 最终交付确认
执行完上述步骤后，请向我汇报：
1. `project-root.mdc` 是否已创建并包含 Frontmatter？
2. 你的“语义锚点”示例文档是否已生成？（这对我后续指代 UI 修改非常重要）
3. 基于你的分析，一句话总结这个项目的代码质量等级（A/B/C）和主要改进点。