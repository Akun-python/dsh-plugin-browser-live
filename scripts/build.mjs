#!/usr/bin/env node
/**
 * Copy the built artifacts of the plugin package from the DeepSeek Harness
 * checkout into this repository (src/ + lib/). Set DSH_HARNESS_PATH to point
 * at the Harness checkout; it defaults to the sibling directory.
 *
 * With DSH_HARNESS_REBUILD=1 the script first rebuilds the package inside the
 * Harness (tsc -b, then the tsdown client bundle), then copies the outputs.
 *
 * Usage:
 *   node scripts/build.mjs
 *   DSH_HARNESS_REBUILD=1 node scripts/build.mjs
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const harness =
  process.env.DSH_HARNESS_PATH && process.env.DSH_HARNESS_PATH.length > 0
    ? resolve(process.env.DSH_HARNESS_PATH)
    : join(dirname(root), 'deepseek-harness')

const pkgDir = join(harness, 'packages', 'client', 'ui-browser-live')
if (!existsSync(join(pkgDir, 'package.json'))) {
  process.stderr.write(`[build] Harness package not found: ${pkgDir}\n`)
  process.stderr.write('  set DSH_HARNESS_PATH to your deepseek-harness checkout.\n')
  process.exit(1)
}

if (process.env.DSH_HARNESS_REBUILD === '1') {
  console.log('[build] rebuilding in harness…')
  const opts = { stdio: 'inherit', cwd: harness }
  execSync('node node_modules/typescript/bin/tsc -b packages/client/ui-browser-live/tsconfig.json', opts)
  execSync('pnpm --filter @deepseek-ai/dsh-client-ui-browser-live bundle', opts)
}

for (const sub of ['src', 'lib', 'package.json']) {
  const from = join(pkgDir, sub)
  const to = join(root, sub)
  if (!existsSync(from)) {
    console.warn(`[build] missing in harness: ${from}`)
    continue
  }
  if (existsSync(to)) {
    if (sub === 'package.json') continue // keep this repo's manifest, not the workspace one
    rmSync(to, { recursive: true, force: true })
  }
  cpSync(from, to, { recursive: true })
}
console.log('[build] synced src/ + lib/ from', pkgDir)
console.log('[build] done. Commit the changes and push.')