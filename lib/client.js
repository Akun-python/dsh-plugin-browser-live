window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-browser-live",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/extractors.ts
		const EMPTY_FRAME = {
			sessionId: void 0,
			url: void 0,
			title: void 0,
			tabs: [],
			snapshotText: void 0,
			trace: [],
			updatedAt: 0
		};
		/**
		* Tool-name prefixes folded into the browser trace. The Playwright MCP
		* provider names its browser tools `mcp__playwright_mcp__browser_*`; the
		* `tool-browser` package (browser-use) names its tools `browser_*` and, in
		* desktop-bridge mode, drives the app's built-in browser panel through them.
		*/
		const TOOL_PREFIXES = ["mcp__playwright_mcp__browser_", "browser_"];
		TOOL_PREFIXES[0];
		/** Whether a tool name denotes a browser tool from a folded provider. */
		function isBrowserToolName(name) {
			return TOOL_PREFIXES.some((prefix) => name.startsWith(prefix));
		}
		/** Match a folded tool name against the known prefixes; undefined for none. */
		function browserToolPrefixOf(name) {
			return TOOL_PREFIXES.find((prefix) => name.startsWith(prefix));
		}
		/** Argument label pairs kept for a browser tool call, ordered and deduped. */
		function callArguments(raw) {
			if (raw === void 0) return [];
			try {
				const parsed = JSON.parse(raw);
				const picks = [
					["url", parsed.url],
					["text", parsed.text],
					["target", parsed.target],
					["key", parsed.key],
					["tab", parsed.tabIndex ?? parsed.tabId],
					["direction", parsed.direction]
				];
				const args = [];
				for (const [name, value] of picks) if (typeof value === "string" || typeof value === "number") args.push(`${name}=${value}`);
				return args;
			} catch {
				return [];
			}
		}
		/** Extract one trace step from a browser tool call event. */
		function traceStep(event) {
			const name = String(event.data.name);
			const prefix = browserToolPrefixOf(name);
			const op = prefix === void 0 ? name : name.slice(prefix.length);
			return {
				key: `trace-${event.seq}-${event.data.callId}`,
				op,
				args: callArguments(event.data.arguments),
				seq: event.seq,
				time: event.time
			};
		}
		/** Parse a snapshot result's text payload; null when it is not one. */
		function snapshotPayload(text) {
			try {
				const parsed = JSON.parse(text);
				if (typeof parsed.url !== "string" || !("snapshot" in parsed || "tabs" in parsed)) return null;
				return parsed;
			} catch {
				return null;
			}
		}
		function tabsOf(value) {
			if (!Array.isArray(value)) return [];
			const titles = [];
			for (const tab of value) if (tab !== null && typeof tab === "object") {
				const title = tab.title;
				if (typeof title === "string") titles.push(title);
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
		function foldWindow(window, sessionId) {
			const trace = [];
			let url;
			let title;
			let tabs = [];
			let snapshotText;
			for (const entry of window.entries) {
				if (entry.type !== "event") continue;
				const event = entry.event;
				if (event.type === "tool/call" && isBrowserToolName(String(event.data.name))) {
					trace.push(traceStep(event));
					continue;
				}
				if (event.type !== "tool/result") continue;
				const blocks = event.data.message?.content ?? [];
				for (const block of blocks) {
					if (block === null || typeof block !== "object" || block.type !== "tool-result") continue;
					const parts = block.content;
					if (!Array.isArray(parts)) continue;
					for (const part of parts) {
						if (part === null || typeof part !== "object" || part.type !== "text") continue;
						const text = part.text;
						if (typeof text !== "string") continue;
						const payload = snapshotPayload(text);
						if (payload === null) continue;
						if (typeof payload.url === "string") url = payload.url;
						if (typeof payload.title === "string") title = payload.title;
						if (payload.tabs !== void 0) tabs = tabsOf(payload.tabs);
						if (typeof payload.snapshot === "string") snapshotText = payload.snapshot;
					}
				}
			}
			const capped = trace.length > 60 ? trace.slice(trace.length - 60) : trace;
			const last = capped[capped.length - 1];
			return {
				sessionId,
				url,
				title,
				tabs,
				snapshotText,
				trace: capped,
				updatedAt: last?.time ?? 0
			};
		}
		//#endregion
		//#region src/client/browser-live.ts
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
		/** Pick the session to mirror: latest-running, falling back to the newest row. */
		function pickSessionId(state) {
			let best;
			let bestAt = -1;
			for (const id of state.ids) {
				const summary = state.byId[id];
				if (summary === void 0) continue;
				if (summary.running && summary.updatedAt >= bestAt) {
					best = id;
					bestAt = summary.updatedAt;
				}
			}
			return best ?? state.ids[state.ids.length - 1] ?? void 0;
		}
		/** Release every subscription owned by one generation of the source. */
		function releaseGeneration(generation) {
			if (generation.window !== void 0) {
				generation.window();
				generation.window = void 0;
			}
			if (generation.reference !== void 0) {
				generation.reference.release();
				generation.reference = void 0;
			}
		}
		/**
		* Create the derived frame source. The catalog subscription runs for the
		* plugin lifetime; event-window subscriptions rebind when the mirrored
		* session changes and release on teardown.
		* @param sessions - client sessions service.
		* @returns the observable source and its disposer.
		*/
		function createBrowserFrameSource(sessions) {
			const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(EMPTY_FRAME);
			const generation = {
				window: void 0,
				reference: void 0
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
					reference = sessions.retain(sessionId, { source: "uiBrowserLive" });
				} catch {
					return;
				}
				reference.ready.then((binding) => {
					if (stateToken !== state) {
						reference.release();
						return;
					}
					const source = binding.eventSource;
					publishWindow(source.getSnapshot());
					generation.window = source.subscribe(() => {
						publishWindow(source.getSnapshot());
					});
					generation.reference = reference;
				}).catch(() => {});
			}
			function resample() {
				const token = ++state;
				releaseGeneration(generation);
				const sessionId = pickSessionId(sessions.list.getSnapshot());
				if (sessionId === void 0) {
					store.set({ ...EMPTY_FRAME });
					return;
				}
				store.set({
					...store.getSnapshot(),
					sessionId
				});
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
				}
			};
		}
		//#endregion
		//#region \0dsh-css:C:\Users\24260\Desktop\研究生生涯\AIforScience\参考项目\deepseek-harness\packages\client\ui-browser-live\src\client\BrowserPanel.module.css.mjs
		const css = ".fHRTma_chip{z-index:40;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:999px;align-items:center;gap:8px;padding:9px 14px;font-size:13px;display:inline-flex;position:fixed;bottom:20px;right:20px;box-shadow:0 8px 28px #00000024}.fHRTma_chip:hover{background:var(--dsw-alias-interactive-bg-hover)}.fHRTma_chipDot{background:var(--dsw-alias-state-success-primary);border-radius:50%;width:8px;height:8px}.fHRTma_panel{z-index:40;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);width:380px;max-width:calc(100vw - 32px);max-height:min(62vh,560px);color:var(--dsw-alias-label-primary);border-radius:14px;flex-direction:column;gap:10px;padding:12px;font-size:13px;display:flex;position:fixed;bottom:20px;right:20px;box-shadow:0 10px 40px #0000002e}.fHRTma_header{justify-content:space-between;align-items:center;display:flex}.fHRTma_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600}.fHRTma_headerButton{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;font-size:13px}.fHRTma_headerButton:hover{color:var(--dsw-alias-label-primary)}.fHRTma_urlRow{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;align-items:center;gap:8px;padding:8px 10px;display:flex}.fHRTma_url{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1;overflow:hidden}.fHRTma_url[data-empty]{color:var(--dsw-alias-label-dimmed)}.fHRTma_openButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-brand-primary);cursor:pointer;white-space:nowrap;border-radius:8px;padding:4px 10px;font-size:13px}.fHRTma_openButton:disabled{opacity:.5;cursor:default}.fHRTma_tabs{gap:6px;margin:0;padding:0;list-style:none;display:flex;overflow-x:auto}.fHRTma_tab{text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);max-width:150px;color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:3px 8px;font-size:12px;overflow:hidden}.fHRTma_traceHeader{color:var(--dsw-alias-label-secondary);justify-content:space-between;align-items:center;display:flex}.fHRTma_traceCount{color:var(--dsw-alias-label-dimmed);font-size:12px}.fHRTma_traceList{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;margin:0;padding:0;list-style:none;overflow-y:auto}.fHRTma_traceRow{border-bottom:1px solid var(--dsw-alias-border-l1);grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:7px 10px;display:grid}.fHRTma_traceLast{border-bottom:0}.fHRTma_traceOp{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);white-space:nowrap;border-radius:999px;padding:2px 8px;font-size:12px}.fHRTma_traceArgs{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary);overflow:hidden}.fHRTma_traceTime{color:var(--dsw-alias-label-dimmed);white-space:nowrap;font-size:11px}.fHRTma_empty{color:var(--dsw-alias-label-dimmed);margin:4px 0;line-height:1.5}.fHRTma_snapshot{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px}.fHRTma_snapshot summary{color:var(--dsw-alias-label-secondary);cursor:pointer;padding:8px 10px}.fHRTma_snapshotText{white-space:pre-wrap;word-break:break-word;max-height:140px;color:var(--dsw-alias-label-secondary);font-family:var(--dsh-font-family-mono,monospace);margin:0;padding:0 10px 10px;font-size:12px;overflow:auto}";
		const tagId = "@deepseek-ai/dsh-client-ui-browser-live/BrowserPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-browser-live";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var BrowserPanel_module_css_default = {
			"chip": "fHRTma_chip",
			"chipDot": "fHRTma_chipDot",
			"empty": "fHRTma_empty",
			"header": "fHRTma_header",
			"headerButton": "fHRTma_headerButton",
			"openButton": "fHRTma_openButton",
			"panel": "fHRTma_panel",
			"snapshot": "fHRTma_snapshot",
			"snapshotText": "fHRTma_snapshotText",
			"tab": "fHRTma_tab",
			"tabs": "fHRTma_tabs",
			"title": "fHRTma_title",
			"traceArgs": "fHRTma_traceArgs",
			"traceCount": "fHRTma_traceCount",
			"traceHeader": "fHRTma_traceHeader",
			"traceLast": "fHRTma_traceLast",
			"traceList": "fHRTma_traceList",
			"traceOp": "fHRTma_traceOp",
			"traceRow": "fHRTma_traceRow",
			"traceTime": "fHRTma_traceTime",
			"url": "fHRTma_url",
			"urlRow": "fHRTma_urlRow"
		};
		//#endregion
		//#region src/client/BrowserPanel.tsx
		/**
		* Floating browser mirror panel. Reads the derived browser frame through the
		* registered inject `hooks` compartment (`useBrowserFrame`) and the
		* open-in-browser action; panel expansion is component-local state.
		*/
		/** Human-readable tool op labels (local install; repo gates route copy through locale dicts). */
		const OP_LABELS = {
			navigate: "打开网页",
			click: "点击",
			type: "输入",
			press_key: "按键",
			scroll: "滚动",
			hover: "悬停",
			screenshot: "截图",
			snapshot: "页面快照",
			new_tab: "新标签页",
			select_tab: "切换标签页",
			close_tab: "关闭标签页",
			go_back: "后退",
			go_forward: "前进",
			close: "关闭浏览器",
			wait: "等待",
			open: "打开网页",
			snap: "页面快照",
			evaluate: "执行脚本",
			wait_for: "等待",
			keypress: "按键",
			back: "后退",
			forward: "前进",
			reload: "刷新",
			tab_list: "标签页列表",
			tab_new: "新标签页",
			tab_select: "切换标签页",
			tab_close: "关闭标签页",
			upload: "上传",
			download_wait: "等待下载",
			download_read: "读取下载",
			mouse_move: "移动鼠标",
			mouse_click: "鼠标点击",
			mouse_drag: "拖拽"
		};
		function opLabel(op) {
			return OP_LABELS[op] ?? op;
		}
		function formatTime(time) {
			const date = new Date(time);
			const pad = (value) => String(value).padStart(2, "0");
			return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
		}
		function TraceRow({ step, last }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: BrowserPanel_module_css_default.traceRow + (last ? ` ${BrowserPanel_module_css_default.traceLast}` : ""),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: BrowserPanel_module_css_default.traceOp,
						children: opLabel(step.op)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: BrowserPanel_module_css_default.traceArgs,
						children: step.args.join(" · ")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
						className: BrowserPanel_module_css_default.traceTime,
						children: formatTime(step.time)
					})
				]
			});
		}
		/** The floating browser panel (collapsed chip or expanded card). */
		function BrowserPanel({ useBrowserFrame, openInBrowser }) {
			const frame = useBrowserFrame((value) => value);
			const [open, setOpen] = (0, react.useState)(false);
			const trace = [...frame.trace].reverse();
			const traceCount = frame.trace.length;
			const hasContent = traceCount > 0 || frame.url !== void 0;
			if (!open) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				className: BrowserPanel_module_css_default.chip,
				type: "button",
				onClick: () => {
					setOpen(true);
				},
				title: "浏览器面板",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: BrowserPanel_module_css_default.chipDot,
						"aria-hidden": "true"
					}),
					"浏览器 ",
					traceCount > 0 ? `· ${traceCount}` : ""
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: BrowserPanel_module_css_default.panel,
				"aria-label": "浏览器面板",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: BrowserPanel_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: BrowserPanel_module_css_default.title,
							children: "浏览器面板"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: BrowserPanel_module_css_default.headerButton,
							type: "button",
							onClick: () => {
								setOpen(false);
							},
							children: "收起"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BrowserPanel_module_css_default.urlRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: BrowserPanel_module_css_default.url,
							title: frame.url,
							"data-empty": frame.url === void 0 ? "" : void 0,
							children: frame.url ?? "AI 尚未在本会话中浏览网页"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: BrowserPanel_module_css_default.openButton,
							type: "button",
							disabled: frame.url === void 0,
							onClick: () => {
								if (frame.url !== void 0) openInBrowser(frame.url);
							},
							children: "打开"
						})]
					}),
					frame.tabs.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: BrowserPanel_module_css_default.tabs,
						children: frame.tabs.map((tab, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
							className: BrowserPanel_module_css_default.tab,
							children: tab
						}, `${index}-${tab}`))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BrowserPanel_module_css_default.traceHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "操作轨迹" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: BrowserPanel_module_css_default.traceCount,
							children: [traceCount, " 步"]
						})]
					}),
					hasContent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
						className: BrowserPanel_module_css_default.traceList,
						children: trace.map((step, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TraceRow, {
							step,
							last: index === trace.length - 1
						}, step.key))
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: BrowserPanel_module_css_default.empty,
						children: "AI 操作浏览器后，这里会实时显示轨迹与页面快照。"
					}),
					frame.snapshotText !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: BrowserPanel_module_css_default.snapshot,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: "页面快照" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: BrowserPanel_module_css_default.snapshotText,
							children: frame.snapshotText
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		const name = "client-ui-browser-live";
		const inject = ["slots", "sessions"];
		/**
		* Build the open-in-browser action. The sidebar browser tab kind is
		* 'browser'; when the sidebar service is absent, open the URL in the
		* system browser.
		* @param ctx - plugin context.
		* @returns the action.
		*/
		function openInBuiltInBrowser(ctx) {
			const sidebar = ctx.get("sidebarRight");
			return (url) => {
				if (sidebar?.openTab !== void 0) try {
					sidebar.openTab("browser", { params: { url } });
					return;
				} catch (error) {
					console.error("Browser Live: open in sidebar failed", error);
				}
				window.open(url, "_blank", "noopener");
			};
		}
		function apply(ctx) {
			const browser = createBrowserFrameSource(ctx.sessions);
			ctx.effect(() => () => {
				browser.dispose();
			}, "ui-browser-live: frame source teardown");
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "browser-live",
				order: 20,
				inject: () => ({
					hooks: { browserFrame: browser.source },
					openInBrowser: openInBuiltInBrowser(ctx)
				})
			}, BrowserPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map