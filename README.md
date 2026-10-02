# dsh-client-ui-browser-live — Browser Panel

A floating bottom-right browser panel for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
0.2.0-rc.2 client. It mirrors the browser actions your agent performs through
the Playwright MCP tools (`mcp__playwright_mcp__*`) in real time: the operation
trace (navigate / click / type / scroll / screenshot…), the current page URL,
open tabs, and the latest page snapshot text. One click hands the current URL
to the built-in sidebar browser (`ui-sidebar-browser`) so you can keep browsing
yourself.

> This is the "redesigned" panel. The repo's legacy `ui-browser` waited on a
> full `dshDesktop.browser` native bridge that the current desktop shell does
> not expose; this plugin instead reads the **session event log**, needs no
> shell changes, and works on the shipped 0.2.0-rc.2 desktop app.

## Features

- Real-time trace of every Playwright MCP browser tool call in the session.
- Current URL / title / tab strip and the latest `browser_snapshot` page text.
- Mirrors the latest *running* session automatically.
- **Read-only mirror**: adds no model-visible input, opens no extra browser
  process, and does not change session reconstructability (everything derives
  from existing `tool/call` / `tool/result` log events).
- Self-contained bundle: runtime dependencies are the client baseline
  (`react`, cordis types, `@deepseek-ai/dsh-client-store`); CSS is inlined.

## Install into the desktop app

1. Clone this repository somewhere stable:
   ```sh
   git clone https://github.com/<you>/dsh-plugin-browser-live
   ```
2. Add a `link:` dependency and the plugin row to your profile. For the
   `desktop` profile (profiles live under `~/.dsh/profiles/<name>/`):
   - in `package.json` `dependencies`:
     ```json
     "@deepseek-ai/dsh-client-ui-browser-live": "link:C:/path/to/dsh-path/dsh-plugin-browser-live"
     ```
   - run `pnpm install` inside the profile directory;
   - in `cordis.patch.yml` add the row:
     ```yaml
     - id: ui-browser-live
       name: '@deepseek-ai/dsh-client-ui-browser-live'
     ```
3. Fully quit DeepSeek Harness (tray icon → Exit) and reopen it.

After restart a small green-dot **"浏览器"** button appears at the bottom-right.
Click it to open the panel; ask your model to browse (for example "open
<https://www.deepseek.com> and summarize it") and watch the trace stream in.
Click **打开** to hand the current page to the right-side built-in browser.

To uninstall: remove the row from `cordis.patch.yml` and the `link:` dependency,
then restart. (Full backup restore guidance for the profile lives in the Harness
install notes.)

## Build from source

The plugin is a client-side package of the DeepSeek Harness workspace; its
bundle (`lib/client.js`) is committed to this repo so installs need no build.

To rebuild `lib/` from source you must build inside the Harness checkout (the
npm packages `@deepseek-ai/cordis` / `@deepseek-ai/dsh-client-store` are version
mismatched with 0.2.0-rc.2). From a Harness checkout that already contains
`packages/client/ui-browser-live`:

```sh
pnpm --filter @deepseek-ai/dsh-client-ui-browser-live bundle
```

then copy the resulting `src/` + `lib/` back into this repository. The helper
`scripts/build.mjs` does exactly that (it resolves the Harness path from
`$DSH_HARNESS_PATH`, defaulting to the sibling directory):

```sh
node scripts/build.mjs          # copy current built artifacts from the Harness
DSH_HARNESS_REBUILD=1 node scripts/build.mjs   # rebuild first, then copy
```

## Check / CI

Committed artifacts carry unit tests that run on plain Node (no install):

```sh
node --test
```

`.github/workflows/ci.yml` runs the same tests plus a smoke check on every push
so the shipped `lib/client.js` is verifiably loadable by the module-loader.

## Known limitations / deferred work

- Screenshots exist in the session log as attachment references, not inline
  data-URLs; the panel renders the page **snapshot text**, minus screenshot
  thumbnails (attachment reading is a later step).
- Mirrors the latest *running* session (simplest pick when several run in
  parallel).
- Trace capped at the latest 60 steps.
- UI copy is fixed (this plugin does not load the platform locale dictionary).

## License

[MIT](./LICENSE) © 2026 sunguangpeng.

## Provenance

Synced from `deepseek-harness` (`merge/upstream-017`) package
`packages/client/ui-browser-live`. See [ORIGIN.md](ORIGIN.md).