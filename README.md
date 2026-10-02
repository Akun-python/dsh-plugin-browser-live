<div align="center">

# 🌐 dsh-plugin-browser-live

**A floating browser panel for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)**
Watch your agent browse the web in real time — and take the page over with one click.

[![CI](https://img.shields.io/github/actions/workflow/status/Akun-python/dsh-plugin-browser-live/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Akun-python/dsh-plugin-browser-live/actions)
[![License](https://img.shields.io/github/license/Akun-python/dsh-plugin-browser-live)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0--rc.2-2f6feb)](package.json)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.2.0--rc.2-4b6bfb)](https://github.com/deepseek-ai/deepseek-harness)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=nodedotjs)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/Akun-python/dsh-plugin-browser-live/pulls)

As your agent drives the web through the Playwright MCP tools
(`mcp__playwright_mcp__*`), a small floating panel at the bottom-right of the
Harness desktop app streams the **operation trace**, the **current page URL**,
**open tabs**, and the latest **page snapshot text** — then hands the current
page to the built-in sidebar browser with a single click.

*Read-only by design, no shell changes, no build needed to install.*

</div>

---

## ✨ Features

| | |
|---|---|
| 📡 **Live mirror** | Every `browser_navigate` / `click` / `type` / `scroll` / `screenshot` … appears in the panel the moment it happens. |
| 🧭 **Current page** | URL, title, and tab strip — always in sync with the latest `browser_snapshot`. |
| 📋 **Page snapshot** | The model-visible page summary text is shown for quick review. |
| 🚀 **One-click takeover** | “打开” hands the current URL to the built-in sidebar browser (`ui-sidebar-browser`) so you can keep browsing yourself. |
| 🔄 **Auto-follows sessions** | Mirrors the latest *running* session automatically; close it and it follows the next one. |
| 🔒 **Read-only mirror** | Derives *only* from existing session log events (`tool/call` / `tool/result`). No model-visible input added, no extra browser process, session reconstructability untouched. |
| 🪶 **Self-contained bundle** | Runtime deps are just the client baseline (`react`, `@deepseek-ai/dsh-client-store`); CSS is inlined. Install needs no build. |
| 📦 **Committed artifacts** | `lib/` ships inside the repo; `tests/` run on plain Node with zero install. |

---

## 🖥 UI at a glance

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

Earlier versions of this feature (the legacy `ui-browser`) depended on a full
`dshDesktop.browser` native bridge inside a redesigned desktop shell. Current
shipped builds only expose a lease-based bridge, so that panel cannot be
installed without breaking the UI. **This plugin is the redesigned version**: it
reads the session event log and works on the shipped `0.2.0-rc.2` desktop app.

---

## 📦 Installation

> Not published to npm. Install by cloning this repository and linking it into
> your DeepSeek Harness profile — the same flow the Harness plugin manager uses.

### Prerequisites

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **0.2.0-rc.2** desktop app
- The agent's browser tool enabled (Playwright MCP, row `browser-use-playwright`)
- [Node.js](https://nodejs.org) ≥ 22 with **pnpm** (only needed for `pnpm install` in the profile)

### 1. Clone

```sh
git clone https://github.com/Akun-python/dsh-plugin-browser-live.git
```

### 2. Link the package into your profile

Profiles live under `~/.dsh/profiles/<name>/`. For the `desktop` profile, edit
`package.json` → `dependencies`:

```json
{
  "dependencies": {
    "@deepseek-ai/dsh-client-ui-browser-live": "link:C:/absolute/path/to/dsh-plugin-browser-live"
  }
}
```

Then, inside the profile directory:

```sh
pnpm install
```

### 3. Enable the plugin row

Append to `cordis.patch.yml`:

```yaml
- id: ui-browser-live
  name: '@deepseek-ai/dsh-client-ui-browser-live'
```

### 4. Restart

**Fully quit** DeepSeek Harness (tray icon → Exit), then reopen. A small
green-dot **"浏览器"** button appears at the bottom-right of the chat window.

---

## 🚀 Quick Start

1. Click the floating **浏览器** button to expand the panel.
2. Ask your agent to browse, e.g.:
   > “用浏览器打开 <https://www.deepseek.com>，总结首页内容”
3. Watch the trace stream into the panel in real time.
4. Click **打开** to hand the current page to the built-in sidebar browser and
   browse it yourself.

### Uninstall

Remove the `ui-browser-live` row from `cordis.patch.yml` and the `link:`
dependency, then restart the app.

---

## 🔍 How It Works

```
┌────────────┐   events   ┌──────────────────────┐   hook    ┌───────────────┐
│ Agent      │ ─────────▶ │ Session event window │ ────────▶ │ Browser Panel │
│ (Playwright│            │ (tool/call +         │           │ (shell.overlay)│
│  MCP tools)│            │  tool/result)        │           └───────────────┘
└────────────┘            └──────────────────────┘
```

1. A derived observable (`createBrowserFrameSource`) samples the client
   **sessions catalog** and retains the latest *running* session.
2. It subscribes to that session's **live event window** and folds every
   Playwright MCP browser `tool/call` into a trace row, and every
   `browser_snapshot` `tool/result` into the page view (url / title / tabs /
   snapshot text).
3. The snapshot is published through a bare `client-store` source bound into
   the panel via the inject `hooks` compartment — **no subscription machinery
   inside React components**, no new model-visible input, nothing written back
   to the session log.

The bundle loads as a dynamic module-table row
(`window.__ModuleLoader__.load`) with externals limited to the client baseline
(`react`, `react/jsx-runtime`, `@deepseek-ai/dsh-client-store`).

---

## 🆚 Comparison

| | **Legacy `ui-browser`** | **This plugin** |
|---|---|---|
| Data source | `dshDesktop.browser` native bridge | Session event log |
| Shell dependency | Requires a redesigned desktop shell | None — works on shipped 0.2.0-rc.2 |
| Install today | ❌ Would crash the UI | ✅ `link:` + one patch row |
| Model-visible impact | — | None (read-only fold) |

---

## 🗂 Project Structure

```
dsh-plugin-browser-live/
├── src/
│   ├── index.ts                     # Node half (empty apply)
│   └── client/
│       ├── index.ts                 # Plugin entry: shell.overlay registration
│       ├── browser-live.ts          # Derived frame source (sessions → events)
│       ├── extractors.ts            # Pure log-fold logic (zero deps)
│       ├── BrowserPanel.tsx         # Floating panel component
│       ├── BrowserPanel.module.css  # Token-based styles (inlined at build)
│       └── contract/slots.ts        # shell.overlay slot typing
├── lib/                             # 🔨 Committed build artifacts (no build to install)
│   ├── index.js / client.js         # Host + module-table browser bundle
│   └── types/                       # d.ts for type consumers
├── tests/
│   └── extractors.test.mjs          # Plain-Node unit tests (node --test)
├── scripts/
│   └── build.mjs                    # Sync/rebuild from a DeepSeek Harness checkout
├── .github/workflows/ci.yml         # CI: tests + bundle smoke check
├── README.md / README.zh.md         # Bilingual docs
├── ORIGIN.md                        # Provenance & build constraints
└── LICENSE                          # MIT
```

---

## 🔧 Building From Source

The committed `lib/` makes installation build-free. To rebuild it you must
build inside a **DeepSeek Harness workspace checkout** — the npm copies of
`@deepseek-ai/cordis` / `@deepseek-ai/dsh-client-store` are version-mismatched
with the 0.2.0-rc.2 runtime, so a standalone npm build is not supported.

From a Harness checkout that already contains `packages/client/ui-browser-live`:

```sh
# inside the Harness workspace
pnpm --filter @deepseek-ai/dsh-client-ui-browser-live bundle
```

Then sync the artifacts back into this repo:

```sh
node scripts/build.mjs                        # copy current built artifacts
DSH_HARNESS_REBUILD=1 node scripts/build.mjs  # rebuild first, then copy
```

`scripts/build.mjs` resolves the Harness path from `DSH_HARNESS_PATH`
(defaults to the sibling directory `../deepseek-harness`).

---

## 🧪 Testing & CI

Unit tests run on **plain Node — no install, no DOM**:

```sh
node --test
```

CI (`.github/workflows/ci.yml`) runs on every push/PR:
unit tests → bundle smoke check (module-loader wrapper, slot registration,
tool prefix) → build-script syntax check.

---

## ❓ FAQ

**Q: The panel doesn't show after restart?**  
Ensure the `ui-browser-live` row is in `cordis.patch.yml` and the profile's
`pnpm install` printed no errors; then fully quit (tray → Exit) and reopen.
Check the app log for a failed row load.

**Q: Does the panel affect what my agent sees?**  
No. It is a pure viewer over existing session events; nothing is injected into
the model or the session log.

**Q: Why no screenshots in the panel?**  
Screenshots live in the log as attachment references, not inline data-URLs.
The panel currently shows the page snapshot text; attachment-based thumbnail
rendering is on the roadmap.

**Q: Can I publish this to npm?**  
The install path is Git + `link:` (see README). The package is marked
`private: true`; publishing to npm requires flipping that off and version
alignment with the Harness runtime.

---

## 🛣 Roadmap

- [x] Real-time trace & page view mirror
- [x] One-click takeover into the sidebar browser
- [x] Plain-Node unit tests + CI
- [ ] Screenshot thumbnails via the attachment API
- [ ] Address bar navigation from the panel
- [ ] Multi/session switcher when several sessions run in parallel
- [ ] Localization through the platform locale dictionary

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Open an
[issue](https://github.com/Akun-python/dsh-plugin-browser-live/issues) or a
[pull request](https://github.com/Akun-python/dsh-plugin-browser-live/pulls).
When changing source, rebuild via `scripts/build.mjs` and keep the tests green
(`node --test`). See [ORIGIN.md](ORIGIN.md) for the upstream build contract.

---

## 📄 License

[MIT](./LICENSE) © 2026 sunguangpeng

## 🔗 Links

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [ORIGIN.md](ORIGIN.md) — provenance and build constraints