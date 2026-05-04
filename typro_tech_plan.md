# Typro 技术方案与实施路线

> 📐 **UI 设计稿**：[typro_design.html](./typro_design.html)（主界面 v2 + 实时渲染三状态）

## 一、关键技术选型

### 1. 桌面框架：Tauri 2.x（不选 Electron）

**理由：**

- **包体积**：Tauri 应用 ~10MB，Electron ~150MB
- **内存占用**：Tauri 用系统 WebView，常驻内存约 Electron 的 1/3
- **性能**：Rust 主进程处理文件 IO、监听文件夹变化，比 Node.js 快且省电
- **代价**：Rust 学习曲线、不同平台 WebView 行为不一致（macOS 用 WKWebView、Windows 用 WebView2）

> 如果完全不想碰 Rust，退而求其次选 Electron + electron-vite。但个人项目强烈推荐 Tauri。

### 2. 编辑器内核：CodeMirror 6（不选 Monaco / ProseMirror）

| 选项 | 适合场景 | 结论 |
|---|---|---|
| Monaco | 代码编辑器（VS Code 同款） | 太重，markdown 渲染不友好 |
| ProseMirror | 富文本「所见即所得」 | 最贴合，但学习曲线陡 |
| **CodeMirror 6** | 文本+轻富文本 | 用 `Decoration` API 实现符号显隐，代码量可控 ✅ |

**实时渲染实现思路：** CodeMirror 6 的 `Decoration.replace()` —— 对每个 `**bold**` 节点做 replace decoration 替换成渲染样式，当光标进入该节点范围时取消 decoration、露出源码。这就是 Typora 的本质。

### 3. Markdown 管线：unified（remark + rehype）

```
remark-parse
  → remark-gfm          # 表格、任务列表、删除线
  → remark-math         # 数学公式
  → rehype-katex        # KaTeX 渲染
  → rehype-mermaid      # 图表
  → rehype-stringify    # 输出 HTML
```

unified 插件化，后续加 front-matter、脚注、wiki link 都是装一个包的事。

### 4. 终端：xterm.js + Tauri portable-pty

- **前端**：`xterm.js` 显示终端 UI（VS Code 同款）
- **后端**：Rust 用 `portable-pty` crate 启动真实 shell（zsh/bash/pwsh），通过 IPC 把 stdin/stdout 流双向桥接到 xterm

> 不要用 `child_process` 模拟终端——没有 PTY 就处理不了 vim、top、彩色输出、tab 补全。

### 5. 文件树 + 文件夹监听

- **UI**：自己撸或用 `react-arborist`
- **后端**：Rust `notify` crate 监听文件系统事件，IPC 推送给前端刷新

### 6. HTML 预览

放一个 `<iframe sandbox>`，把 rehype 输出的 HTML 注入，外加导出主题 CSS。沙箱化避免 markdown 里嵌 `<script>` 出事。

### 7. PDF 导出

Tauri 内调用 headless WebView 加载预览 HTML，用系统原生「打印为 PDF」能力。**不要装 puppeteer**，那等于塞进一个 Chromium，包体积毁了。

---

## 二、架构分层

<svg width="100%" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- Layer label: WebView -->
  <text x="40" y="30" font-size="12" fill="#888">渲染层 · WebView (React + TypeScript)</text>

  <!-- WebView container -->
  <rect x="40" y="44" width="600" height="174" rx="12" fill="#EEEDFE" stroke="#AFA9EC" stroke-width="0.5"/>

  <!-- Row 1 boxes -->
  <rect x="60" y="68" width="172" height="64" rx="8" fill="#CEC BF6" stroke="#7F77DD" stroke-width="0.5"/>
  <rect x="60" y="68" width="172" height="64" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="146" y="97" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">编辑器内核</text>
  <text x="146" y="115" font-size="11" fill="#534AB7" text-anchor="middle">CodeMirror 6</text>

  <rect x="254" y="68" width="172" height="64" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="340" y="97" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">Markdown 解析</text>
  <text x="340" y="115" font-size="11" fill="#534AB7" text-anchor="middle">remark + rehype</text>

  <rect x="448" y="68" width="172" height="64" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="534" y="97" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">HTML 预览</text>
  <text x="534" y="115" font-size="11" fill="#534AB7" text-anchor="middle">iframe + 主题 CSS</text>

  <!-- Row 2 boxes -->
  <rect x="60" y="146" width="172" height="56" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="146" y="171" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">扩展渲染</text>
  <text x="146" y="189" font-size="11" fill="#534AB7" text-anchor="middle">KaTeX · Mermaid</text>

  <rect x="254" y="146" width="172" height="56" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="340" y="171" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">终端 UI</text>
  <text x="340" y="189" font-size="11" fill="#534AB7" text-anchor="middle">xterm.js</text>

  <rect x="448" y="146" width="172" height="56" rx="8" fill="#CECBF6" stroke="#7F77DD" stroke-width="0.5"/>
  <text x="534" y="171" font-size="13" font-weight="500" fill="#26215C" text-anchor="middle">UI 框架</text>
  <text x="534" y="189" font-size="11" fill="#534AB7" text-anchor="middle">React + Zustand</text>

  <!-- IPC arrow (bidirectional) -->
  <line x1="340" y1="218" x2="340" y2="260" stroke="#888" stroke-width="1" marker-end="url(#arrow)"/>
  <line x1="340" y1="260" x2="340" y2="218" stroke="#888" stroke-width="1" marker-end="url(#arrow)"/>
  <rect x="252" y="228" width="176" height="18" rx="4" fill="white"/>
  <text x="340" y="241" font-size="11" fill="#888" text-anchor="middle">IPC · invoke / event</text>

  <!-- Layer label: Tauri -->
  <text x="40" y="278" font-size="12" fill="#888">主进程 · Tauri (Rust)</text>

  <!-- Tauri container -->
  <rect x="40" y="292" width="600" height="174" rx="12" fill="#FAEEDA" stroke="#EF9F27" stroke-width="0.5"/>

  <!-- Row 1 -->
  <rect x="60" y="316" width="172" height="64" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="146" y="345" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">文件系统</text>
  <text x="146" y="363" font-size="11" fill="#854F0B" text-anchor="middle">读写 / 监听 / 树</text>

  <rect x="254" y="316" width="172" height="64" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="340" y="345" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">PTY 终端进程</text>
  <text x="340" y="363" font-size="11" fill="#854F0B" text-anchor="middle">portable-pty</text>

  <rect x="448" y="316" width="172" height="64" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="534" y="345" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">导出引擎</text>
  <text x="534" y="363" font-size="11" fill="#854F0B" text-anchor="middle">PDF / HTML 渲染</text>

  <!-- Row 2 -->
  <rect x="60" y="394" width="172" height="56" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="146" y="419" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">配置存储</text>
  <text x="146" y="437" font-size="11" fill="#854F0B" text-anchor="middle">JSON · 工作区状态</text>

  <rect x="254" y="394" width="172" height="56" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="340" y="419" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">图片资源管理</text>
  <text x="340" y="437" font-size="11" fill="#854F0B" text-anchor="middle">粘贴入库 / 路径</text>

  <rect x="448" y="394" width="172" height="56" rx="8" fill="#FAC775" stroke="#BA7517" stroke-width="0.5"/>
  <text x="534" y="419" font-size="13" font-weight="500" fill="#412402" text-anchor="middle">命令调度</text>
  <text x="534" y="437" font-size="11" fill="#854F0B" text-anchor="middle">tauri::command</text>

  <!-- OS bar -->
  <text x="40" y="490" font-size="12" fill="#888">操作系统 · 文件 I/O · 进程 · 字体 · 系统 API</text>
  <line x1="40" y1="498" x2="640" y2="498" stroke="#ccc" stroke-width="0.5" stroke-dasharray="3 3"/>

  <!-- Legend -->
  <rect x="40" y="510" width="10" height="10" rx="2" fill="#CECBF6"/>
  <text x="56" y="520" font-size="11" fill="#888">浏览器进程（UI / 渲染）</text>
  <rect x="220" y="510" width="10" height="10" rx="2" fill="#FAC775"/>
  <text x="236" y="520" font-size="11" fill="#888">原生进程（系统能力）</text>
</svg>

---

## 三、项目结构

```
typro/
├── src-tauri/              # Rust 主进程
│   ├── src/
│   │   ├── main.rs
│   │   ├── fs.rs           # 文件读写、文件夹树、监听
│   │   ├── pty.rs          # 终端进程管理
│   │   ├── export.rs       # PDF/HTML 导出
│   │   └── commands.rs     # 暴露给前端的命令
│   └── Cargo.toml
├── src/                    # React 前端
│   ├── editor/
│   │   ├── CodeMirrorView.tsx
│   │   ├── decorations/    # 实时渲染装饰器
│   │   │   ├── heading.ts
│   │   │   ├── bold-italic.ts
│   │   │   ├── link-image.ts
│   │   │   └── code-block.ts
│   │   └── markdown-extension.ts
│   ├── preview/
│   │   ├── HtmlPreview.tsx
│   │   └── pipeline.ts     # unified 管线
│   ├── terminal/
│   │   └── XtermView.tsx
│   ├── filetree/
│   │   └── FileTree.tsx
│   ├── outline/
│   │   └── Outline.tsx     # 从 mdast 抽 heading
│   ├── store/              # Zustand
│   │   ├── workspace.ts    # 当前打开的文件夹、tabs
│   │   ├── document.ts     # 当前文档内容、光标
│   │   └── settings.ts     # 主题、配置
│   ├── lib/
│   │   ├── ipc.ts          # 封装 invoke
│   │   └── shortcuts.ts    # 快捷键
│   └── App.tsx
└── package.json
```

---

## 四、实施路线

### 阶段 1：脚手架与最小可写（约 1 周）

Tauri + React + TS 模板搭起来。CodeMirror 6 跑通，能输入纯文本、保存到磁盘、读取 .md 文件。先不要碰渲染，先不要碰文件树。

**交付：** 能打开/编辑/保存单个文件的窗口

```bash
npm create tauri-app@latest
# 选 React + TypeScript
npm i @codemirror/state @codemirror/view @codemirror/lang-markdown
```

### 阶段 2：实时渲染核心（约 3 周，最难）

用 CodeMirror 6 的 `@lezer/markdown` 拿到语法树，按节点写 Decoration。

**优先级顺序：**

1. 标题、粗体斜体、代码块、引用、列表
2. 链接和图片
3. 表格

**交付：** 所见即所得编辑体验，光标进入段落露源码、离开后渲染

### 阶段 2.5：扩展元素（约 1 周）

在第二阶段的 Decoration 框架上插入：

- KaTeX 渲染数学公式块
- Mermaid 渲染图表块
- Shiki 或 highlight.js 代码高亮

**交付：** `$E=mc^2$` 和 mermaid 流程图能在编辑器里实时显示

### 阶段 3：工作区（约 2 周）

- Rust 端实现"打开文件夹"、目录树读取、notify 监听变化
- 前端做文件树、多 tab 切换
- 从 mdast 抽出 heading 生成大纲面板
- Ctrl+P 文件搜索

**交付：** 可以把 typro 当成一个 markdown 文件夹的 IDE 来用

### 阶段 4：HTML 预览 + 终端 + 主题（约 2 周）

- 右侧 iframe 预览面板，绑定 unified 管线输出
- 底部接 xterm.js + Rust portable-pty，cwd 跟随工作区根目录
- CSS 变量重构，先做明/暗两套主题

**交付：** 完整的 v0.1 内部 alpha 版本

### 阶段 5：导出 + 体验细节（约 2 周）

- PDF/HTML 导出对话框（页边距、主题、是否带目录）
- 图片粘贴入库
- Ctrl+F 查找替换
- 复制为富文本
- 源码模式逃生
- 打包签名分发

**交付：** v1.0，可以发到 GitHub release

> **总计约 11 周**，按业余开发每周 10–15 小时折算。如果阶段 2 卡住超过 4 周，考虑改用 ProseMirror 或退化为分屏模式。

---

## 五、Typora 核心功能清单

### MVP 必做（v1.0）

| 功能 | 说明 |
|---|---|
| 实时渲染 | 光标段落显源码，其他段落显渲染 |
| 文件夹树 | 打开文件夹，树形展示，监听变化 |
| HTML 预览 | 右侧面板展示最终渲染效果 |
| 集成终端 | xterm.js + PTY，cwd 跟随工作区 |
| 多标签页 | 同时打开多个文档 |
| 大纲/目录 | 从 heading 自动生成，点击跳转 |
| 表格编辑器 | Tab 跳格，右键加行删列 |
| 任务列表 | `- [ ]` 可点击勾选 |
| 图片粘贴 | 截图 Ctrl+V 自动入库，生成相对路径 |
| 查找替换 | Ctrl+F，支持正则 |
| 源码模式 | 逃生通道，万一渲染出问题 |
| 导出 PDF/HTML | 系统原生打印能力 |
| 主题切换 | 明/暗至少两套 |
| 复制为富文本 | 粘到飞书/钉钉/邮件直接带格式 |
| 自动保存 | + 文件外部修改检测 |

### v2 迭代

| 功能 | 说明 |
|---|---|
| 斜杠命令菜单 | 输入 `/` 弹出元素插入菜单 |
| 全局内容搜索 | 跨文件夹搜索内容 |
| 专注模式 | 高亮当前段落，其余变灰 |
| 打字机模式 | 光标始终在屏幕中央 |
| 脚注/上下标 | markdown 扩展语法 |
| front-matter | YAML 元数据支持 |
| 导入 Word/HTML | 转换为 Markdown |
| 主题市场 | 更多主题，用户自定义 |
| AI Agent 面板 | 接入终端 claude 命令或独立抽屉 |

---

## 六、关键技术陷阱

### 陷阱 1：实时渲染边界 bug（80% 会遇到）

用户输入到一半时 AST 不完整，强行 decoration 会闪烁。

**解决方案：** debounce 解析（150ms），且只对「光标不在该节点 AND 节点语法完整」的情况应用 decoration。

### 陷阱 2：中文输入法（IME）问题

中文输入未上屏时光标 range 计算异常，decoration 错位。

**解决方案：** 处理 `compositionstart/end` 事件，期间暂停 decoration 更新。

### 陷阱 3：Tauri WebView 跨平台差异

macOS WKWebView 不支持某些新 CSS，Linux WebKitGTK 最容易出问题。

**解决方案：** 打包时跑三个系统真机测试。

### 陷阱 4：PTY 在 Windows 上

Windows 必须用 ConPTY（Win10+），`portable-pty` 已处理，但要确认最低系统版本。

### 陷阱 5：大文件性能

markdown 文件超过 500KB 时全量解析会卡。

**解决方案：** CodeMirror 6 默认开启 viewport-based 渲染；mermaid 懒加载，只渲染可视区内的块。

### 陷阱 6：notify 在 macOS 的奇异行为

保存文件时 macOS 会先发 `Remove` 再发 `Create`（atomic save）。

**解决方案：** 防抖窗口聚合事件，不能简单根据事件类型判断「文件被删了」。

---

## 七、参考项目

| 项目 | 技术栈 | 参考价值 |
|---|---|---|
| [Marktext](https://github.com/marktext/marktext) | Electron + ProseMirror | 开源，可直接抄思路 |
| [Logseq](https://github.com/logseq/logseq) | CodeMirror 6 + Rust | 结构最贴近本方案 |
| [Zed](https://github.com/zed-industries/zed) | Rust + GPUI | 编辑器内核思路 |
