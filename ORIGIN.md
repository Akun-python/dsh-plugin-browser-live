# Origin and provenance

`src/` and `lib/` in this repository are the DeepSeek Harness **client plugin
package** `packages/client/ui-browser-live`, authored for this plugin and synced
from a local Harness checkout.

- Source checkout branch/commit:
  `merge/upstream-017` @ `d9127a8b12` (working tree)
- Runtime target: DeepSeek Harness **0.2.0-rc.2** desktop client.
- Bundle model: `lib/client.js` is a dynamic module-table row
  (`window.__ModuleLoader__.load({ id, factory })`). Runtime externals are the
  client baseline only: `react`, `react/jsx-runtime`, and
  `@deepseek-ai/dsh-client-store`. CSS is inlined as an injected `<style>`.
- The panel targets the `shell.overlay` slot, which the shipped (installed)
  desktop layout owns and renders. The local checkout's layout does not declare
  that slot name; `src/client/contract/slots.ts` restores it for this build.
- npm packages `@deepseek-ai/cordis` (4.0.4) and `@deepseek-ai/dsh-client-store`
  (0.1.2-alpha.2) exist but are **version-mismatched** with the 0.2.0-rc.2
  runtime — do not rebuild this package against the npm copies. Rebuild inside
  the Harness workspace (see README "Build from source").

To refresh the mirror: `node scripts/build.mjs`.