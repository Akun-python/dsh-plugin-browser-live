<div align="center">

# 🌐 dsh-plugin-browser-live

**为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的浏览器面板插件**
实时观看智能体浏览网页的每一步——并一键把页面接过来自己继续看。

[![CI](https://img.shields.io/github/actions/workflow/status/Akun-python/dsh-plugin-browser-live/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Akun-python/dsh-plugin-browser-live/actions)
[![License](https://img.shields.io/github/license/Akun-python/dsh-plugin-browser-live)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0--rc.2-2f6feb)](package.json)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.2.0--rc.2-4b6bfb)](https://github.com/deepseek-ai/deepseek-harness)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=nodedotjs)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/Akun-python/dsh-plugin-browser-live/pulls)

当智能体通过 Playwright MCP 工具（`mcp__playwright_mcp__*`），或 `tool-browser`
包的 `browser_*` 工具（桌面桥模式下直接驱动应用内置浏览器面板）浏览网页时，
Harness 桌面应用右下角会浮起一个小面板，实时显示**操作轨迹**、**当前页面
URL**、**打开的标签页**和最近一次的**页面快照文本**——点一下"打开"，当前页面
就会交到右侧内置浏览器里，由你亲自继续浏览。

*只读镜像设计、不依赖桌面壳改动、安装免构建。*

</div>

---

## ✨ 特性一览

| | |
|---|---|
| 📡 **实时镜像** | 折叠两类浏览器工具事件——`mcp__playwright_mcp__browser_*`（Playwright MCP）与 `browser_*`（tool-browser，含桌面桥模式）——操作一发生立刻上屏。 |
| 🧭 **当前页面** | URL、标题、标签页条，始终与最新一次 `browser_snapshot` 同步。 |
| 📋 **页面快照** | 展示模型可见的页面摘要文本，方便快速核对。 |
| 🚀 **一键接管** | 点"打开"把当前 URL 交给右侧内置浏览器（`ui-sidebar-browser`），自己接着浏览。 |
| 🔄 **自动跟随会话** | 自动镜像"最新运行中"的会话；会话关了自动切换到下一个。 |
| 🔒 **只读镜像** | 只派生自已有的会话日志事件（`tool/call` / `tool/result`）。不向模型注入额外输入、不开额外浏览器进程、不改动会话可重建性。 |
| 🪶 **产物自包含** | 运行时只依赖客户端基础外部模块（`react`、`@deepseek-ai/dsh-client-store`）；样式已内联。安装不需要构建。 |
| 📦 **构建产物入仓** | `lib/` 随仓库发布；`tests/` 纯 Node 即跑，零依赖安装。 |

---

## 🖥 界面一览

```
┌────────────────────────────────────────────────┐
│  🌐 浏览器面板                       [ 收起 ]   │
│  ┌──────────────────────────────────┬────────┐ │
│  │ https://www.deepseek.com         │ [打开] │ │
│  └──────────────────────────────────┴────────┘ │
│  ( DeepSeek – 深度求索 )  ( 文档 )              │
│  操作轨迹 · 14 步                               │
│  ┌──────────────────────────────────────────┐  │
│  │ 🖱 点击    target=#btn-submit  12:01:03   │  │
│  │ ⌨ 输入    text=deepseek       12:01:01   │  │
│  │ 🧭 打开网页 url=https://…     12:00:59   │  │
│  └──────────────────────────────────────────┘  │
│  ▸ 页面快照  (最近一次 browser_snapshot)        │
└────────────────────────────────────────────────┘
```

早期版本的同类功能（旧 `ui-browser`）依赖新版桌面壳才有的完整
`dshDesktop.browser` 原生桥；当前已发布的桌面壳只暴露租约式桥，硬装会
导致界面崩溃。**本插件就是重新设计后的版本**：改为读取会话事件日志，
可以在已发布的 0.2.0-rc.2 桌面应用上直接使用。

---

## 📦 安装

> 未发布到 npm。安装方式：克隆本仓库，然后以 `link:` 方式接入你的 DeepSeek
> Harness profile——与 Harness 插件管理器的安装流程一致。

### 前置条件

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **0.2.0-rc.2** 桌面应用
- 已启用智能体浏览器工具（Playwright MCP，`browser-use-playwright` 行）
- [Node.js](https://nodejs.org) ≥ 22 并安装 **pnpm**（仅 profile 的 `pnpm install` 需要）

### 1. 克隆

```sh
git clone https://github.com/Akun-python/dsh-plugin-browser-live.git
```

### 2. 把包链接进你的 profile

profile 在 `~/.dsh/profiles/<名字>/` 下。以 `desktop` 为例，编辑
`package.json` 的 `dependencies`：

```json
{
  "dependencies": {
    "@deepseek-ai/dsh-client-ui-browser-live": "link:C:/绝对路径/dsh-plugin-browser-live"
  }
}
```

然后在 profile 目录里执行：

```sh
pnpm install
```

### 3. 启用插件行

在 `cordis.patch.yml` 末尾追加：

```yaml
- id: ui-browser-live
  name: '@deepseek-ai/dsh-client-ui-browser-live'
```

### 4. 重启

**完全退出** DeepSeek Harness（托盘图标→退出），再重新打开。聊天窗口
右下角会出现一个带绿色小圆点的 **"浏览器"** 按钮。

---

## 🚀 快速开始

1. 点击浮动的 **浏览器** 按钮展开面板。
2. 让智能体去浏览，例如：
   > “用浏览器打开 <https://www.deepseek.com>，总结首页内容”
3. 观察轨迹实时滚进面板。
4. 点 **打开** 把当前页面交到右侧内置浏览器，自己接着浏览。

### 卸载

删除 `cordis.patch.yml` 里的 `ui-browser-live` 行与 `link:` 依赖，
重启应用即可。

---

## 🔍 工作原理

```
┌────────────┐  事件     ┌──────────────────────┐  hook   ┌───────────────┐
│ 智能体      │ ────────▶ │ 会话事件窗口          │ ──────▶ │ 浏览器面板      │
│ (Playwright│           │ (tool/call +          │         │ (shell.overlay)│
│  MCP 工具) │           │  tool/result)         │         └───────────────┘
└────────────┘           └──────────────────────┘
```

1. 一个派生可观察源（`createBrowserFrameSource`）采样客户端**会话目录**，
   retain 最新一条 *运行中* 的会话。
2. 订阅该会话的**实时事件窗口**：每一条 Playwright MCP 浏览器
   `tool/call` 折叠成一行轨迹；每一条 `browser_snapshot` 的 `tool/result`
   折叠成页面视图（url / 标题 / 标签页 / 快照文本）。
3. 快照通过裸 `client-store` 源发布，经 inject `hooks` 通道绑定进面板——
   **React 组件里没有任何订阅机制**，不新增模型可见输入，也不向会话日志写回任何内容。

bundle 以动态模块表行（`window.__ModuleLoader__.load`）加载，
外部依赖仅为基础客户端模块（`react`、`react/jsx-runtime`、
`@deepseek-ai/dsh-client-store`）。

---

## 🆚 对比

| | **旧 `ui-browser`** | **本插件** |
|---|---|---|
| 数据来源 | `dshDesktop.browser` 原生桥 | 会话事件日志 |
| 桌面壳依赖 | 需要重新设计的桌面壳 | 无——已发布的 0.2.0-rc.2 直接可用 |
| 现在能装吗 | ❌ 会弄崩界面 | ✅ `link:` + 一行 patch |
| 对模型的影响 | — | 无（只读折叠） |

---

## 🗂 项目结构

```
dsh-plugin-browser-live/
├── src/
│   ├── index.ts                     # Node 半（空 apply）
│   └── client/
│       ├── index.ts                 # 插件入口：shell.overlay 注册
│       ├── browser-live.ts          # 派生帧源（会话 → 事件）
│       ├── extractors.ts            # 纯日志折叠逻辑（零依赖）
│       ├── BrowserPanel.tsx         # 浮动面板组件
│       ├── BrowserPanel.module.css  # 基于设计令牌的样式（构建时内联）
│       └── contract/slots.ts        # shell.overlay 槽类型
├── lib/                             # 🔨 提交的构建产物（安装免构建）
│   ├── index.js / client.js         # Host + 模块表浏览器 bundle
│   └── types/                       # 供类型使用的 d.ts
├── tests/
│   └── extractors.test.mjs          # 纯 Node 单测（node --test）
├── scripts/
│   └── build.mjs                    # 从 DeepSeek Harness checkout 同步/重建
├── .github/workflows/ci.yml         # CI：单测 + bundle 冒烟
├── README.md / README.zh.md         # 双语文档
├── ORIGIN.md                        # 来源与构建约束
└── LICENSE                          # MIT
```

---

## 🔧 从源码构建

已提交的 `lib/` 让安装零构建。要重新构建，必须在 **DeepSeek Harness
工作区 checkout** 里进行——npm 上的 `@deepseek-ai/cordis` /
`@deepseek-ai/dsh-client-store` 与 0.2.0-rc.2 运行时版本不匹配，
不支持独立 npm 构建。

在已包含 `packages/client/ui-browser-live` 的 Harness checkout 里：

```sh
# 在 Harness 工作区内执行
pnpm --filter @deepseek-ai/dsh-client-ui-browser-live bundle
```

再把产物同步回本仓库：

```sh
node scripts/build.mjs                        # 直接拷贝当前构建产物
DSH_HARNESS_REBUILD=1 node scripts/build.mjs  # 先重建再拷贝
```

`scripts/build.mjs` 通过 `DSH_HARNESS_PATH` 定位 Harness（默认取同级目录
`../deepseek-harness`）。

---

## 🧪 测试与 CI

单元测试用**纯 Node 运行——无需安装依赖、无需 DOM**：

```sh
node --test
```

CI（`.github/workflows/ci.yml`）在每次 push/PR 时执行：
单元测试 → bundle 冒烟（模块表包装、槽注册、工具前缀）→ 构建脚本语法检查。

---

## ❓ FAQ

**Q: 重启后面板没出现？**  
确认 `ui-browser-live` 行在 `cordis.patch.yml` 里、profile 的
`pnpm install` 无报错；然后完全退出（托盘→退出）再重开。检查应用日志里
是否有该行加载失败的记录。

**Q: 面板会影响智能体看到的内容吗？**  
不会。它只是既有会话事件的纯查看器，不向模型或会话日志注入任何东西。

**Q: 为什么面板里没有截图？**  
截图在日志里是附件引用而非内联 data-URL。面板目前展示页面快照文本；
基于附件 API 的缩略图渲染已列入路线图。

**Q: 能发布到 npm 吗？**  
安装路径是 Git + `link:`（见上文）。包当前标记为 `private: true`；
发布 npm 需要去掉该标记并与 Harness 运行时版本对齐。

---

## 🛣 路线图

- [x] 实时轨迹与页面视图镜像
- [x] 一键接管至侧栏内置浏览器
- [x] 纯 Node 单测 + CI
- [ ] 通过附件 API 展示截图缩略图
- [ ] 面板内地址栏导航
- [ ] 多会话并行时的会话切换器
- [ ] 接入平台 locale 字典做本地化

---

## 🤝 参与贡献

欢迎提交 [issue](https://github.com/Akun-python/dsh-plugin-browser-live/issues)
与 [pull request](https://github.com/Akun-python/dsh-plugin-browser-live/pulls)！
改动源码时请用 `scripts/build.mjs` 重建，并保持测试通过
（`node --test`）。上游构建约束见 [ORIGIN.md](ORIGIN.md)。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 akun

## 🔗 相关链接

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [ORIGIN.md](ORIGIN.md) — 来源与构建约束