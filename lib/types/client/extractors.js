/**
 * Pure browser-flow extractors: fold a session event window into a browser
 * frame snapshot. This module imports only types, so its compiled artifact
 * has zero runtime imports and unit-tests run on plain Node (no DOM, no
 * service stubs).
 */
export const EMPTY_FRAME = {
    sessionId: undefined,
    url: undefined,
    title: undefined,
    tabs: [],
    snapshotText: undefined,
    trace: [],
    updatedAt: 0,
};
export const TOOL_PREFIX = 'mcp__playwright_mcp__browser_';
export const TRACE_CAP = 60;
/** Argument label pairs kept for a browser tool call, ordered and deduped. */
export function callArguments(raw) {
    if (raw === undefined)
        return [];
    try {
        const parsed = JSON.parse(raw);
        const picks = [
            ['url', parsed.url],
            ['text', parsed.text],
            ['target', parsed.target],
            ['key', parsed.key],
            ['tab', parsed.tabIndex ?? parsed.tabId],
            ['direction', parsed.direction],
        ];
        const args = [];
        for (const [name, value] of picks) {
            if (typeof value === 'string' || typeof value === 'number') {
                args.push(`${name}=${value}`);
            }
        }
        return args;
    }
    catch {
        return [];
    }
}
/** Extract one trace step from a browser tool call event. */
export function traceStep(event) {
    const name = String(event.data.name);
    const op = name.startsWith(TOOL_PREFIX) ? name.slice(TOOL_PREFIX.length) : name;
    return {
        key: `trace-${event.seq}-${event.data.callId}`,
        op,
        args: callArguments(event.data.arguments),
        seq: event.seq,
        time: event.time,
    };
}
/** Parse a snapshot result's text payload; null when it is not one. */
export function snapshotPayload(text) {
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed.url !== 'string' || !('snapshot' in parsed || 'tabs' in parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function tabsOf(value) {
    if (!Array.isArray(value))
        return [];
    const titles = [];
    for (const tab of value) {
        if (tab !== null && typeof tab === 'object') {
            const title = tab.title;
            if (typeof title === 'string')
                titles.push(title);
        }
    }
    return titles;
}
/**
 * Fold the durable session event window into the browser frame snapshot.
 * Call events append trace rows; snapshot result events refresh the page
 * view (url, title, tabs, page summary text). Screen captures persist as
 * attachment references and are not surfaced here.
 * @param window - current session event window.
 * @param sessionId - mirrored session id, preserved across folds by the caller.
 * @returns the derived frame.
 */
export function foldWindow(window, sessionId) {
    const trace = [];
    let url;
    let title;
    let tabs = [];
    let snapshotText;
    for (const entry of window.entries) {
        if (entry.type !== 'event')
            continue;
        const event = entry.event;
        if (event.type === 'tool/call' && String(event.data.name).startsWith(TOOL_PREFIX)) {
            trace.push(traceStep(event));
            continue;
        }
        if (event.type !== 'tool/result')
            continue;
        const blocks = event.data.message?.content ?? [];
        for (const block of blocks) {
            if (block === null || typeof block !== 'object' || block.type !== 'tool-result')
                continue;
            const parts = block.content;
            if (!Array.isArray(parts))
                continue;
            for (const part of parts) {
                if (part === null || typeof part !== 'object' || part.type !== 'text')
                    continue;
                const text = part.text;
                if (typeof text !== 'string')
                    continue;
                const payload = snapshotPayload(text);
                if (payload === null)
                    continue;
                if (typeof payload.url === 'string')
                    url = payload.url;
                if (typeof payload.title === 'string')
                    title = payload.title;
                if (payload.tabs !== undefined)
                    tabs = tabsOf(payload.tabs);
                if (typeof payload.snapshot === 'string')
                    snapshotText = payload.snapshot;
            }
        }
    }
    const capped = trace.length > TRACE_CAP ? trace.slice(trace.length - TRACE_CAP) : trace;
    const last = capped[capped.length - 1];
    return {
        sessionId,
        url,
        title,
        tabs,
        snapshotText,
        trace: capped,
        updatedAt: last?.time ?? 0,
    };
}
//# sourceMappingURL=extractors.js.map