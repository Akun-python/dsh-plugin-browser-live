/** Browser Live — 浏览器面板客户端插件（无 Host 逻辑）。 */

import type {} from './client/index.ts'

export const name = 'client-ui-browser-live'

export function apply(): void {
  // 纯浏览器半插件：所有能力在 ./client 的 Web 实例中注册。
}