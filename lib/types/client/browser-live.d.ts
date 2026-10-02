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
import { type ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client';
import { type BrowserFrame } from './extractors.ts';
export type { BrowserFrame, TraceStep } from './extractors.ts';
declare module '@deepseek-ai/dsh-api-session-controller/client' {
    interface SessionReferenceSourceMap {
        uiBrowserLive: unknown;
    }
}
/** A live frame source plus its teardown. */
export interface BrowserFrameSourceHandle {
    /** Bare observable for the inject `hooks` compartment. */
    readonly source: ObservableSnapshot<BrowserFrame>;
    /** Stop catalog/event subscriptions and release the retained session. */
    dispose(): void;
}
/**
 * Create the derived frame source. The catalog subscription runs for the
 * plugin lifetime; event-window subscriptions rebind when the mirrored
 * session changes and release on teardown.
 * @param sessions - client sessions service.
 * @returns the observable source and its disposer.
 */
export declare function createBrowserFrameSource(sessions: ISessions): BrowserFrameSourceHandle;
//# sourceMappingURL=browser-live.d.ts.map