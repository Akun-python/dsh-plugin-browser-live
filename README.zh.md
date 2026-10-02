# dsh-client-ui-browser-live — 浏览器面板

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
0.2.0-rc.2 客户端的右下角浮动浏览器面板。它实时镜像智能体通过 Playwright
MCP 工具（`mcp__playwright_mcp__*`）执行的浏览器操作：操作轨迹（打开/点击/
输入/滚动/截图…）、当前页面 URL、打开的标签页，以及最近一次页面快照文本。
点一下即可把当前页面交给右侧内置浏览器（`ui-sidebar-browser`）继续浏览。

> 这是"重新设计"后的面板。仓库里旧 `ui-browser` 依赖新版桌面壳才有的完整
> `dshDesktop.browser` 原生桥（当前桌面壳并未暴露）；本插件改为**读取会话
> 事件日志**，无需改动桌面壳，可在已安装的 0.2.0-rc.2 桌面应用上直接使用。

## 特性

- 实时显示会话中每一次 Playwright MCP 浏览器工具调用。
- 当前 URL / 标题 / 标签页，以及最近一次 `browser_snapshot` 的页面文本。
- 自动镜像"最新运行中"的会话。
- **只读镜像**：不向模型注入额外输入，不额外开浏览器进程，不改变会话可重建性
  （全部派生自已有的 `tool/call` / `tool/result` 日志事件）。
- 产物自包含：运行时依赖仅为基础外部模块（`react`、cordis 类型、
  `@deepseek-ai/dsh-client-store`）；样式已内联。

## 装进桌面应用

1. 克隆本仓库到稳定路径：
   ```sh
   git clone https://github.com/<你>/dsh-plugin-browser-live
   ```
2. 给 profile 加 `link:` 依赖与插件行。以 `desktop` profile 为例
   （profile 在 `~/.dsh/profiles/<名字>/`）：
   - `package.json` 的 `dependencies` 里加：
     ```json
     "@deepseek-ai/dsh-client-ui-browser-live": "link:C:/路径/dsh-plugin-browser-live"
     ```
   - 在 profile 目录里运行 `pnpm install`；
   - 在 `cordis.patch.yml` 里加一行：
     ```yaml
     - id: ui-browser-live
       name: '@deepseek-ai/dsh-client-ui-browser-live'
     ```
3. 完全退出 DeepSeek Harness（托盘图标→退出）再重新打开。

重启后右下角出现带绿色小圆点的 **"浏览器"** 按钮。点击展开面板；让模型去浏览
（例如"用浏览器打开 <https://www.deepseek.com> 并总结首页"），观察轨迹实时滚动。
点 **"打开"** 即可把当前页面交到右侧内置浏览器。

卸载：删除 `cordis.patch.yml` 里的行与 `link:` 依赖，重启即可。

## 从源码构建

本插件是 DeepSeek Harness 工作区里的客户端包；`lib/client.js` 已提交进本仓库，
安装无需构建。

要重新从源码构建 `lib/`，必须在 Harness checkout 里进行（npm 上的
`@deepseek-ai/cordis` / `@deepseek-ai/dsh-client-store` 与 0.2.0-rc.2 版本不匹配）。
在已含 `packages/client/ui-browser-live` 的 Harness checkout 里：

```sh
pnpm --filter @deepseek-ai/dsh-client-ui-browser-live bundle
```

然后把产出的 `src/` 与 `lib/` 拷回本仓库。辅助脚本 `scripts/build.mjs` 可以代劳
（从 `$DSH_HARNESS_PATH` 读取 Harness 路径，默认取同级目录）：

```sh
node scripts/build.mjs                        # 直接拷贝当前构建产物
DSH_HARNESS_REBUILD=1 node scripts/build.mjs  # 先重建再拷贝
```

## 检查 / CI

已提交的产物带有单元测试，用纯 Node 即可运行（无需安装任何依赖）：

```sh
node --test
```

`.github/workflows/ci.yml` 在每次 push 时跑同样的测试，并对
`lib/client.js` 做模块加载器冒烟检查，确保交付产物可加载。

## 已知限制 / 后续工作

- 截图在会话日志中为附件引用而非内联 data-URL；当前面板展示页面**快照文本**，
  暂不显示截图缩略图（读取附件列入后续）。
- 镜像"最新运行中"的会话（多会话并行时取最简单的一条）。
- 轨迹最近 60 步封顶。
- 界面文案为固定中文（本插件未接入平台 locale 字典）。

## 许可证

[MIT](./LICENSE) © 2026 sunguangpeng。

## 来源

同步自 `deepseek-harness`（`merge/upstream-017`）的
`packages/client/ui-browser-live` 包。见 [ORIGIN.md](ORIGIN.md)。