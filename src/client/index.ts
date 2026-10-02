/**
 * Browser Live client plugin: registers the floating browser panel into the
 * shell overlay. The panel mirrors the current session's Playwright MCP
 * browser flow (trace, page view, tabs) and hands the latest URL to the
 * built-in sidebar browser.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type {} from './contract/slots.ts'
import type { BrowserFrame } from './browser-live.ts'
import { createBrowserFrameSource } from './browser-live.ts'
import { BrowserPanel } from './BrowserPanel.tsx'

export const name = 'client-ui-browser-live'

export const inject = ['slots', 'sessions']

/** Registration inject face: the live frame source and the open-in-browser action. */
export interface BrowserLiveInjected {
  readonly hooks: { readonly browserFrame: ObservableSnapshot<BrowserFrame> }
  /** Open a URL in the built-in sidebar browser; falls back to the system browser. */
  readonly openInBrowser: (url: string) => void
}

/** Optional sidebar service, read structurally to avoid a feature-plugin import. */
interface SidebarService {
  openTab?: (kind: string, options: { params?: { url?: string } }) => void
}

/**
 * Build the open-in-browser action. The sidebar browser tab kind is
 * 'browser'; when the sidebar service is absent, open the URL in the
 * system browser.
 * @param ctx - plugin context.
 * @returns the action.
 */
function openInBuiltInBrowser(ctx: Context): (url: string) => void {
  const sidebar = ctx.get('sidebarRight') as SidebarService | undefined
  return (url) => {
    if (sidebar?.openTab !== undefined) {
      try {
        sidebar.openTab('browser', { params: { url } })
        return
      } catch (error) {
        // Sidebar browser unavailable (tab type not registered); fall through
        // to the system browser rather than dropping the user's request.
        console.error('Browser Live: open in sidebar failed', error)
      }
    }
    window.open(url, '_blank', 'noopener')
  }
}

export function apply(ctx: Context): void {
  const browser = createBrowserFrameSource(ctx.sessions)
  ctx.effect(() => () => { browser.dispose() }, 'ui-browser-live: frame source teardown')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'browser-live',
    order: 20,
    inject: (): BrowserLiveInjected => ({
      hooks: { browserFrame: browser.source },
      openInBrowser: openInBuiltInBrowser(ctx),
    }),
  }, BrowserPanel))
}