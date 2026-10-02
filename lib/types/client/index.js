/**
 * Browser Live client plugin: registers the floating browser panel into the
 * shell overlay. The panel mirrors the current session's Playwright MCP
 * browser flow (trace, page view, tabs) and hands the latest URL to the
 * built-in sidebar browser.
 */
import { createBrowserFrameSource } from "./browser-live.js";
import { BrowserPanel } from "./BrowserPanel.js";
export const name = 'client-ui-browser-live';
export const inject = ['slots', 'sessions'];
/**
 * Build the open-in-browser action. The sidebar browser tab kind is
 * 'browser'; when the sidebar service is absent, open the URL in the
 * system browser.
 * @param ctx - plugin context.
 * @returns the action.
 */
function openInBuiltInBrowser(ctx) {
    const sidebar = ctx.get('sidebarRight');
    return (url) => {
        if (sidebar?.openTab !== undefined) {
            try {
                sidebar.openTab('browser', { params: { url } });
                return;
            }
            catch (error) {
                // Sidebar browser unavailable (tab type not registered); fall through
                // to the system browser rather than dropping the user's request.
                console.error('Browser Live: open in sidebar failed', error);
            }
        }
        window.open(url, '_blank', 'noopener');
    };
}
export function apply(ctx) {
    const browser = createBrowserFrameSource(ctx.sessions);
    ctx.effect(() => () => { browser.dispose(); }, 'ui-browser-live: frame source teardown');
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'browser-live',
        order: 20,
        inject: () => ({
            hooks: { browserFrame: browser.source },
            openInBrowser: openInBuiltInBrowser(ctx),
        }),
    }, BrowserPanel));
}
//# sourceMappingURL=index.js.map