/**
 * Floating browser mirror panel. Reads the derived browser frame through the
 * registered inject `hooks` compartment (`useBrowserFrame`) and the
 * open-in-browser action; panel expansion is component-local state.
 */

import { useState, type ReactNode } from 'react'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-store'
import type { BrowserFrame, TraceStep } from './browser-live.ts'
import styles from './BrowserPanel.module.css'

/** Composed props: inject face members arrive as `use<Name>` hooks. */
export interface BrowserPanelProps {
  /** Selector hook over the live browser frame source. */
  useBrowserFrame: SnapshotSelectorHook<BrowserFrame>
  /** Open the given URL in the built-in sidebar browser. */
  openInBrowser: (url: string) => void
}

/** Human-readable tool op labels (local install; repo gates route copy through locale dicts). */
const OP_LABELS: Readonly<Record<string, string>> = {
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
}

function opLabel(op: string): string {
  return OP_LABELS[op] ?? op
}

function formatTime(time: number): string {
  const date = new Date(time)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function TraceRow({ step, last }: { step: TraceStep; last: boolean }): ReactNode {
  return (
    <li className={styles.traceRow + (last ? ` ${styles.traceLast}` : '')}>
      <span className={styles.traceOp}>{opLabel(step.op)}</span>
      <span className={styles.traceArgs}>{step.args.join(' · ')}</span>
      <time className={styles.traceTime}>{formatTime(step.time)}</time>
    </li>
  )
}

/** The floating browser panel (collapsed chip or expanded card). */
export function BrowserPanel({ useBrowserFrame, openInBrowser }: BrowserPanelProps): ReactNode {
  const frame = useBrowserFrame((value) => value)
  const [open, setOpen] = useState(false)
  const trace = [...frame.trace].reverse()
  const traceCount = frame.trace.length
  const hasContent = traceCount > 0 || frame.url !== undefined

  if (!open) {
    return (
      <button
        className={styles.chip}
        type="button"
        onClick={() => { setOpen(true) }}
        title="浏览器面板"
      >
        <span className={styles.chipDot} aria-hidden="true" />
        浏览器 {traceCount > 0 ? `· ${traceCount}` : ''}
      </button>
    )
  }

  return (
    <section className={styles.panel} aria-label="浏览器面板">
      <header className={styles.header}>
        <span className={styles.title}>浏览器面板</span>
        <button className={styles.headerButton} type="button" onClick={() => { setOpen(false) }}>
          收起
        </button>
      </header>

      <div className={styles.urlRow}>
        <span className={styles.url} title={frame.url} data-empty={frame.url === undefined ? '' : undefined}>
          {frame.url ?? 'AI 尚未在本会话中浏览网页'}
        </span>
        <button
          className={styles.openButton}
          type="button"
          disabled={frame.url === undefined}
          onClick={() => { if (frame.url !== undefined) openInBrowser(frame.url) }}
        >
          打开
        </button>
      </div>

      {frame.tabs.length > 0 && (
        <ul className={styles.tabs}>
          {frame.tabs.map((tab, index) => (
            <li key={`${index}-${tab}`} className={styles.tab}>{tab}</li>
          ))}
        </ul>
      )}

      <div className={styles.traceHeader}>
        <span>操作轨迹</span>
        <span className={styles.traceCount}>{traceCount} 步</span>
      </div>

      {hasContent ? (
        <ol className={styles.traceList}>
          {trace.map((step, index) => (
            <TraceRow key={step.key} step={step} last={index === trace.length - 1} />
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>AI 操作浏览器后，这里会实时显示轨迹与页面快照。</p>
      )}

      {frame.snapshotText !== undefined && (
        <details className={styles.snapshot}>
          <summary>页面快照</summary>
          <pre className={styles.snapshotText}>{frame.snapshotText}</pre>
        </details>
      )}
    </section>
  )
}