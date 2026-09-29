// OpenNext 自定义 Worker 入口（wrangler.jsonc `main`，https://opennext.js.org/cloudflare/howtos/custom-worker）：
// 复用生成的 .open-next/worker.js，出口统一写 Workers Cache 边缘缓存策略（Issue #14，见 src/lib/workers-cache.ts）。
// `.open-next/worker.js` 由 `opennextjs-cloudflare build` 生成，通过 wrangler.jsonc 的 `alias`
// （open-next-generated-worker）在打包时解析。不直接写相对路径：TS（allowJs）会顺着 import 把 14MB 的
// server-functions/handler.mjs 拉进类型检查，`next build` 的 TypeScript 步骤会直接失败。
// @ts-ignore 仅 wrangler 打包时可解析
import { default as handler } from 'open-next-generated-worker';
import { applyEdgeCachePolicy, type EdgeCacheContext } from './src/lib/workers-cache';

export default {
  async fetch(request: Request, env: unknown, ctx: EdgeCacheContext): Promise<Response> {
    const response: Response = await handler.fetch(request, env, ctx);
    // 边缘缓存策略必须是出口最后一步：它依据最终的状态码 / 响应头决定缓存与否
    return applyEdgeCachePolicy(request, response);
  },
};

// DO queue（ISR 定时 revalidate）必须从入口导出，wrangler.jsonc 的 durable_objects 绑定它
// @ts-ignore 同上
export { DOQueueHandler } from 'open-next-generated-worker';
