// OpenNext 自定义 Worker 入口（wrangler.jsonc `main`）：
// 复用生成的 .open-next/worker.js，在出口等最终状态码确定后再决定是否写 R2 增量缓存。
// `.open-next/worker.js` 由 `opennextjs-cloudflare build` 生成，通过 wrangler.jsonc 的 `alias`
// （open-next-generated-worker）在打包时解析。不直接写相对路径：TS 会顺着 import 把生成的
// server-functions/handler.mjs 拉进类型检查。
// @ts-ignore 仅 wrangler 打包时可解析
import { default as handler } from 'open-next-generated-worker';
import { runWithCacheWritePolicy } from './src/lib/cache-write-policy';

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    return runWithCacheWritePolicy(() => handler.fetch(request, env, ctx));
  },
};

// DO queue（ISR 定时 revalidate）必须从入口导出，wrangler.jsonc 的 durable_objects 绑定它
// @ts-ignore 同上
export { DOQueueHandler } from 'open-next-generated-worker';
