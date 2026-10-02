/**
 * Floating browser mirror panel. Reads the derived browser frame through the
 * registered inject `hooks` compartment (`useBrowserFrame`) and the
 * open-in-browser action; panel expansion is component-local state.
 */
import { type ReactNode } from 'react';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-store';
import type { BrowserFrame } from './browser-live.ts';
/** Composed props: inject face members arrive as `use<Name>` hooks. */
export interface BrowserPanelProps {
    /** Selector hook over the live browser frame source. */
    useBrowserFrame: SnapshotSelectorHook<BrowserFrame>;
    /** Open the given URL in the built-in sidebar browser. */
    openInBrowser: (url: string) => void;
}
/** The floating browser panel (collapsed chip or expanded card). */
export declare function BrowserPanel({ useBrowserFrame, openInBrowser }: BrowserPanelProps): ReactNode;
//# sourceMappingURL=BrowserPanel.d.ts.map