/**
 * Browser Live frame source: a derived observable that mirrors the browser
 * flow of the current running session.
 *
 * The source resamples the sessions catalog, retains the latest running
 * session, and reads its live event window for Playwright MCP tool activity.
 * The derived snapshot is a JSON-compatible {@link BrowserFrame} published
 * through a bare client-store source (no subscription machinery in render
 * code — components bind it through the inject `hooks` compartment).
 */

import { createSnapshotStore, type ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type {
  ISessions,
  SessionEventWindow,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionEventSource } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { EMPTY_FRAME, foldWindow, type BrowserFrame } from './extractors.ts'

export type { BrowserFrame, TraceStep } from './extractors.ts'

declare module '@deepseek-ai/dsh-api-session-controller/client' {
  interface SessionReferenceSourceMap {
    uiBrowserLive: unknown
  }
}

/** Pick the session to mirror: latest-running, falling back to the newest row. */
function pickSessionId(state: { readonly ids: readonly string[]; readonly byId: Record<string, { running: boolean; updatedAt: number }> }): string | undefined {
  let best: string | undefined
  let bestAt = -1
  for (const id of state.ids) {
    const summary = state.byId[id]
    if (summary === undefined) continue
    if (summary.running && summary.updatedAt >= bestAt) {
      best = id
      bestAt = summary.updatedAt
    }
  }
  return best ?? state.ids[state.ids.length - 1] ?? undefined
}

/** A live frame source plus its teardown. */
export interface BrowserFrameSourceHandle {
  /** Bare observable for the inject `hooks` compartment. */
  readonly source: ObservableSnapshot<BrowserFrame>
  /** Stop catalog/event subscriptions and release the retained session. */
  dispose(): void
}

/** Release every subscription owned by one generation of the source. */
function releaseGeneration(generation: {
  window: (() => void) | undefined
  reference: { release(): void } | undefined
}): void {
  if (generation.window !== undefined) {
    generation.window()
    generation.window = undefined
  }
  if (generation.reference !== undefined) {
    generation.reference.release()
    generation.reference = undefined
  }
}

/**
 * Create the derived frame source. The catalog subscription runs for the
 * plugin lifetime; event-window subscriptions rebind when the mirrored
 * session changes and release on teardown.
 * @param sessions - client sessions service.
 * @returns the observable source and its disposer.
 */
export function createBrowserFrameSource(sessions: ISessions): BrowserFrameSourceHandle {
  const store = createSnapshotStore<BrowserFrame>(EMPTY_FRAME)
  const generation: { window: (() => void) | undefined; reference: { release(): void } | undefined } = {
    window: undefined,
    reference: undefined,
  }
  let state = 0

  /** Sync the snapshot from the current event window. */
  function publishWindow(window: SessionEventWindow): void {
    store.set(foldWindow(window, store.getSnapshot().sessionId))
  }

  /** Retain a session and subscribe its event window; drop any prior binding. */
  function bindSession(sessionId: SessionId, stateToken: number): void {
    releaseGeneration(generation)
    let reference: { ready: Promise<{ eventSource: SessionEventSource }>; release(): void }
    try {
      reference = sessions.retain(sessionId, { source: 'uiBrowserLive' })
    } catch {
      return
    }
    void reference.ready.then((binding) => {
      if (stateToken !== state) {
        reference.release()
        return
      }
      const source: SessionEventSource = binding.eventSource
      publishWindow(source.getSnapshot())
      generation.window = source.subscribe(() => { publishWindow(source.getSnapshot()) })
      generation.reference = reference
    }).catch(() => {
      // Session open failed (e.g. torn down between list and retain); the
      // next catalog change resamples and rebinds.
    })
  }

  function resample(): void {
    const token = ++state
    releaseGeneration(generation)
    const list = sessions.list.getSnapshot()
    const sessionId = pickSessionId(list)
    if (sessionId === undefined) {
      store.set({ ...EMPTY_FRAME })
      return
    }
    store.set({ ...store.getSnapshot(), sessionId: sessionId as SessionId })
    bindSession(sessionId as SessionId, token)
  }

  const unsubscribeCatalog = sessions.list.subscribe(resample)
  resample()

  return {
    source: store,
    dispose() {
      state += 1
      unsubscribeCatalog()
      releaseGeneration(generation)
    },
  }
}