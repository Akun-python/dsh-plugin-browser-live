import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  callArguments,
  foldWindow,
  isBrowserToolName,
  browserToolPrefixOf,
  snapshotPayload,
  tabsOf,
  traceStep,
  TRACE_CAP,
} from '../lib/types/client/extractors.js'

test('callArguments keeps string/number picks and drops the rest', () => {
  assert.deepEqual(callArguments(JSON.stringify({ url: 'https://a.b', text: 'hi', target: '1', tabIndex: 0, junk: {} })), [
    'url=https://a.b',
    'text=hi',
    'target=1',
    'tab=0',
  ])
  assert.deepEqual(callArguments('{"only":{"junk":true}}'), [])
  assert.deepEqual(callArguments(undefined), [])
  assert.deepEqual(callArguments('not json'), [])
})

test('traceStep labels the op after the mcp prefix', () => {
  const step = traceStep({
    type: 'tool/call',
    seq: 4,
    time: 1,
    data: { name: 'mcp__playwright_mcp__browser_navigate', callId: 'c1', arguments: '{"url":"a/b"}' },
  })
  assert.equal(step.op, 'navigate')
  assert.equal(step.seq, 4)
  assert.deepEqual(step.args, ['url=a/b'])
})

test('browser tool names from both providers are folded', () => {
  assert.equal(isBrowserToolName('mcp__playwright_mcp__browser_click'), true)
  assert.equal(isBrowserToolName('browser_click'), true)
  assert.equal(isBrowserToolName('browser_open'), true)
  assert.equal(isBrowserToolName('read'), false)
  assert.equal(isBrowserToolName('bash_run'), false)
  assert.equal(browserToolPrefixOf('browser_navigate'), 'browser_')
  assert.equal(browserToolPrefixOf('mcp__playwright_mcp__browser_snapshot'), 'mcp__playwright_mcp__browser_')
  assert.equal(browserToolPrefixOf('read'), undefined)
})

test('traceStep strips the tool-browser prefix like the mcp prefix', () => {
  const step = traceStep({
    type: 'tool/call',
    seq: 5,
    time: 2,
    data: { name: 'browser_open', callId: 'c2', arguments: '{"url":"a/b"}' },
  })
  assert.equal(step.op, 'open')
  assert.deepEqual(step.args, ['url=a/b'])
})

test('snapshotPayload parses snapshot JSON and rejects non-snapshots', () => {
  const ok = snapshotPayload('{"url":"u","title":"T","tabs":[],"snapshot":"pages"}')
  assert.equal(ok?.url, 'u')
  assert.equal(ok?.snapshot, 'pages')
  assert.equal(snapshotPayload('{"url":"u"}'), null) // no snapshot/tabs
  assert.equal(snapshotPayload('{bad'), null)
})

test('tabsOf extracts string titles only', () => {
  assert.deepEqual(tabsOf([{ title: 'A' }, { title: 1 }, null, 'B', { title: 'C' }]), ['A', 'C'])
  assert.deepEqual(tabsOf('nope'), [])
})

test('foldWindow turns events into a browser frame', () => {
  const snapshot = '{"url":"https://a/b","title":"T","tabs":[{"title":"A"},{"title":"B"}],"snapshot":"page body"}'
  const window = {
    entries: [
      { type: 'event', event: { type: 'tool/call', seq: 1, time: 10, data: { name: 'mcp__playwright_mcp__browser_navigate', callId: 'c1', arguments: '{"url":"https://example.com"}' } } },
      { type: 'event', event: { type: 'tool/call', seq: 2, time: 11, data: { name: 'mcp__playwright_mcp__browser_click', callId: 'c2', arguments: '{"target":"#go"}' } } },
      { type: 'event', event: { type: 'tool/result', seq: 3, time: 12, data: { message: { content: [{ type: 'tool-result', toolCallId: 'c3', content: [{ type: 'text', text: snapshot }] }] } } } },
    ],
  }
  const frame = foldWindow(window, 'sess-x')
  assert.equal(frame.sessionId, 'sess-x')
  assert.equal(frame.url, 'https://a/b')
  assert.equal(frame.title, 'T')
  assert.deepEqual(frame.tabs, ['A', 'B'])
  assert.equal(frame.snapshotText, 'page body')
  assert.equal(frame.trace.length, 2)
  assert.equal(frame.trace[0].op, 'navigate')
  assert.equal(frame.trace[1].op, 'click')
  assert.equal(frame.updatedAt, 11)
})

test('foldWindow caps the trace at TRACE_CAP, oldest first dropped', () => {
  const entries = []
  for (let i = 0; i < TRACE_CAP + 5; i += 1) {
    entries.push({
      type: 'event',
      event: { type: 'tool/call', seq: i, time: i, data: { name: 'mcp__playwright_mcp__browser_navigate', callId: `c${i}`, arguments: '{"url":"x"}' } },
    })
  }
  const frame = foldWindow({ entries }, undefined)
  assert.equal(frame.trace.length, TRACE_CAP)
  assert.equal(frame.trace[0].seq, 5) // oldest 5 dropped
  assert.equal(frame.trace[TRACE_CAP - 1].seq, TRACE_CAP + 4)
})

test('foldWindow ignores non-event entries and unrelated tools', () => {
  const window = {
    entries: [
      { type: 'transient', event: { seq: 0 } },
      { type: 'event', event: { type: 'tool/call', seq: 1, time: 1, data: { name: 'read', callId: 'r', arguments: '{}' } } },
    ],
  }
  const frame = foldWindow(window, undefined)
  assert.equal(frame.trace.length, 0)
  assert.equal(frame.url, undefined)
})