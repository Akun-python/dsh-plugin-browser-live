/**
 * Pure browser-flow extractors: fold a session event window into a browser
 * frame snapshot. This module imports only types, so its compiled artifact
 * has zero runtime imports and unit-tests run on plain Node (no DOM, no
 * service stubs).
 */
import type { SessionEventWindow } from '@deepseek-ai/dsh-api-session-controller/client';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
/** One trace row: a Playwright MCP browser tool call, labeled by op and key args. */
export interface TraceStep {
    /** Stable key; the panel keys rows by it. */
    readonly key: string;
    /** Tool name after the `mcp__playwright_mcp__browser_` prefix. */
    readonly op: string;
    /** Human-readable argument labels, verbatim from the call arguments. */
    readonly args: readonly string[];
    /** Durable event seq; ordering follows the session log. */
    readonly seq: number;
    readonly time: number;
}
/** Panel-visible mirror of the current session's browser activity. */
export interface BrowserFrame {
    readonly sessionId: string | undefined;
    /** Latest page URL seen in this session's snapshot results. */
    readonly url: string | undefined;
    readonly title: string | undefined;
    /** Browser tab titles from the latest snapshot result. */
    readonly tabs: readonly string[];
    /** Latest snapshot page summary (the model-visible page text). */
    readonly snapshotText: string | undefined;
    /** Browser tool trace, newest last, capped. */
    readonly trace: readonly TraceStep[];
    readonly updatedAt: number;
}
export declare const EMPTY_FRAME: BrowserFrame;
export declare const TOOL_PREFIX = "mcp__playwright_mcp__browser_";
export declare const TRACE_CAP = 60;
/** Argument label pairs kept for a browser tool call, ordered and deduped. */
export declare function callArguments(raw: string | undefined): readonly string[];
/** Extract one trace step from a browser tool call event. */
export declare function traceStep(event: SessionEvent<'tool/call'>): TraceStep;
interface SnapshotPayload {
    url?: unknown;
    title?: unknown;
    tabs?: unknown;
    snapshot?: unknown;
}
/** Parse a snapshot result's text payload; null when it is not one. */
export declare function snapshotPayload(text: string): SnapshotPayload | null;
export declare function tabsOf(value: unknown): readonly string[];
/**
 * Fold the durable session event window into the browser frame snapshot.
 * Call events append trace rows; snapshot result events refresh the page
 * view (url, title, tabs, page summary text). Screen captures persist as
 * attachment references and are not surfaced here.
 * @param window - current session event window.
 * @param sessionId - mirrored session id, preserved across folds by the caller.
 * @returns the derived frame.
 */
export declare function foldWindow(window: SessionEventWindow, sessionId: string | undefined): BrowserFrame;
export {};
//# sourceMappingURL=extractors.d.ts.map