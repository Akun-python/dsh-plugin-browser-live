import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Floating browser mirror panel. Reads the derived browser frame through the
 * registered inject `hooks` compartment (`useBrowserFrame`) and the
 * open-in-browser action; panel expansion is component-local state.
 */
import { useState } from 'react';
import styles from './BrowserPanel.module.css';
/** Human-readable tool op labels (local install; repo gates route copy through locale dicts). */
const OP_LABELS = {
    // Playwright MCP provider ops (mcp__playwright_mcp__browser_*).
    navigate: '打开网页',
    click: '点击',
    type: '输入',
    press_key: '按键',
    scroll: '滚动',
    hover: '悬停',
    screenshot: '截图',
    snapshot: '页面快照',
    new_tab: '新标签页',
    select_tab: '切换标签页',
    close_tab: '关闭标签页',
    go_back: '后退',
    go_forward: '前进',
    close: '关闭浏览器',
    wait: '等待',
    // tool-browser ops (browser_*), including desktop-bridge mode.
    open: '打开网页',
    snap: '页面快照',
    evaluate: '执行脚本',
    wait_for: '等待',
    keypress: '按键',
    back: '后退',
    forward: '前进',
    reload: '刷新',
    tab_list: '标签页列表',
    tab_new: '新标签页',
    tab_select: '切换标签页',
    tab_close: '关闭标签页',
    upload: '上传',
    download_wait: '等待下载',
    download_read: '读取下载',
    mouse_move: '移动鼠标',
    mouse_click: '鼠标点击',
    mouse_drag: '拖拽',
};
function opLabel(op) {
    return OP_LABELS[op] ?? op;
}
function formatTime(time) {
    const date = new Date(time);
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function TraceRow({ step, last }) {
    return (_jsxs("li", { className: styles.traceRow + (last ? ` ${styles.traceLast}` : ''), children: [_jsx("span", { className: styles.traceOp, children: opLabel(step.op) }), _jsx("span", { className: styles.traceArgs, children: step.args.join(' · ') }), _jsx("time", { className: styles.traceTime, children: formatTime(step.time) })] }));
}
/** The floating browser panel (collapsed chip or expanded card). */
export function BrowserPanel({ useBrowserFrame, openInBrowser }) {
    const frame = useBrowserFrame((value) => value);
    const [open, setOpen] = useState(false);
    const trace = [...frame.trace].reverse();
    const traceCount = frame.trace.length;
    const hasContent = traceCount > 0 || frame.url !== undefined;
    if (!open) {
        return (_jsxs("button", { className: styles.chip, type: "button", onClick: () => { setOpen(true); }, title: "\u6D4F\u89C8\u5668\u9762\u677F", children: [_jsx("span", { className: styles.chipDot, "aria-hidden": "true" }), "\u6D4F\u89C8\u5668 ", traceCount > 0 ? `· ${traceCount}` : ''] }));
    }
    return (_jsxs("section", { className: styles.panel, "aria-label": "\u6D4F\u89C8\u5668\u9762\u677F", children: [_jsxs("header", { className: styles.header, children: [_jsx("span", { className: styles.title, children: "\u6D4F\u89C8\u5668\u9762\u677F" }), _jsx("button", { className: styles.headerButton, type: "button", onClick: () => { setOpen(false); }, children: "\u6536\u8D77" })] }), _jsxs("div", { className: styles.urlRow, children: [_jsx("span", { className: styles.url, title: frame.url, "data-empty": frame.url === undefined ? '' : undefined, children: frame.url ?? 'AI 尚未在本会话中浏览网页' }), _jsx("button", { className: styles.openButton, type: "button", disabled: frame.url === undefined, onClick: () => { if (frame.url !== undefined)
                            openInBrowser(frame.url); }, children: "\u6253\u5F00" })] }), frame.tabs.length > 0 && (_jsx("ul", { className: styles.tabs, children: frame.tabs.map((tab, index) => (_jsx("li", { className: styles.tab, children: tab }, `${index}-${tab}`))) })), _jsxs("div", { className: styles.traceHeader, children: [_jsx("span", { children: "\u64CD\u4F5C\u8F68\u8FF9" }), _jsxs("span", { className: styles.traceCount, children: [traceCount, " \u6B65"] })] }), hasContent ? (_jsx("ol", { className: styles.traceList, children: trace.map((step, index) => (_jsx(TraceRow, { step: step, last: index === trace.length - 1 }, step.key))) })) : (_jsx("p", { className: styles.empty, children: "AI \u64CD\u4F5C\u6D4F\u89C8\u5668\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5B9E\u65F6\u663E\u793A\u8F68\u8FF9\u4E0E\u9875\u9762\u5FEB\u7167\u3002" })), frame.snapshotText !== undefined && (_jsxs("details", { className: styles.snapshot, children: [_jsx("summary", { children: "\u9875\u9762\u5FEB\u7167" }), _jsx("pre", { className: styles.snapshotText, children: frame.snapshotText })] }))] }));
}
//# sourceMappingURL=BrowserPanel.js.map