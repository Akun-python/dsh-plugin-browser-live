/**
 * Browser Live client plugin: registers the floating browser panel into the
 * shell overlay. The panel mirrors the current session's Playwright MCP
 * browser flow (trace, page view, tabs) and hands the latest URL to the
 * built-in sidebar browser.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { BrowserFrame } from './browser-live.ts';
export declare const name = "client-ui-browser-live";
export declare const inject: string[];
/** Registration inject face: the live frame source and the open-in-browser action. */
export interface BrowserLiveInjected {
    readonly hooks: {
        readonly browserFrame: ObservableSnapshot<BrowserFrame>;
    };
    /** Open a URL in the built-in sidebar browser; falls back to the system browser. */
    readonly openInBrowser: (url: string) => void;
}
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map