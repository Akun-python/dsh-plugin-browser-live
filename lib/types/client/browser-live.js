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
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';
import { EMPTY_FRAME, foldWindow } from "./extractors.js";
/** Pick the session to mirror: latest-running, falling back to the newest row. */
function pickSessionId(state) {
    let best;
    let bestAt = -1;
    for (const id of state.ids) {
        const summary = state.byId[id];
        if (summary === undefined)
            continue;
        if (summary.running && summary.updatedAt >= bestAt) {
            best = id;
            bestAt = summary.updatedAt;
        }
    }
    return best ?? state.ids[state.ids.length - 1] ?? undefined;
}
/** Release every subscription owned by one generation of the source. */
function releaseGeneration(generation) {
    if (generation.window !== undefined) {
        generation.window();
        generation.window = undefined;
    }
    if (generation.reference !== undefined) {
        generation.reference.release();
        generation.reference = undefined;
    }
}
/**
 * Create the derived frame source. The catalog subscription runs for the
 * plugin lifetime; event-window subscriptions rebind when the mirrored
 * session changes and release on teardown.
 * @param sessions - client sessions service.
 * @returns the observable source and its disposer.
 */
export function createBrowserFrameSource(sessions) {
    const store = createSnapshotStore(EMPTY_FRAME);
    const generation = {
        window: undefined,
        reference: undefined,
    };
    let state = 0;
    /** Sync the snapshot from the current event window. */
    function publishWindow(window) {
        store.set(foldWindow(window, store.getSnapshot().sessionId));
    }
    /** Retain a session and subscribe its event window; drop any prior binding. */
    function bindSession(sessionId, stateToken) {
        releaseGeneration(generation);
        let reference;
        try {
            reference = sessions.retain(sessionId, { source: 'uiBrowserLive' });
        }
        catch {
            return;
        }
        void reference.ready.then((binding) => {
            if (stateToken !== state) {
                reference.release();
                return;
            }
            const source = binding.eventSource;
            publishWindow(source.getSnapshot());
            generation.window = source.subscribe(() => { publishWindow(source.getSnapshot()); });
            generation.reference = reference;
        }).catch(() => {
            // Session open failed (e.g. torn down between list and retain); the
            // next catalog change resamples and rebinds.
        });
    }
    function resample() {
        const token = ++state;
        releaseGeneration(generation);
        const list = sessions.list.getSnapshot();
        const sessionId = pickSessionId(list);
        if (sessionId === undefined) {
            store.set({ ...EMPTY_FRAME });
            return;
        }
        store.set({ ...store.getSnapshot(), sessionId: sessionId });
        bindSession(sessionId, token);
    }
    const unsubscribeCatalog = sessions.list.subscribe(resample);
    resample();
    return {
        source: store,
        dispose() {
            state += 1;
            unsubscribeCatalog();
            releaseGeneration(generation);
        },
    };
}
//# sourceMappingURL=browser-live.js.map