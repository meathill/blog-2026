import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

type Database = { exec(sql: string): Promise<unknown>; prepare(sql: string): { run(): Promise<unknown> } };
type Runtime = {
  dispatchFetch(url: string, init?: RequestInit): Promise<Response>;
  getD1Database(name: string): Promise<Database>;
  dispose(): Promise<void>;
};
type Event = { event: string; key?: string; before?: unknown; after?: unknown; status?: number; message?: string };
type Result = { path: string; status: number; headers: Record<string, string>; events: Event[] };
// 运行实际 wrangler dry-run 产物，所有 R2/D1 都在临时本地，外部数据源被离线替代。
// node scripts/research/verify-built-isr.ts <worker.js> <公开 skills.cache> <结果.json>
const [sourcePath, cachePath, outputPath] = process.argv.slice(2);
assert(sourcePath && cachePath && outputPath, '需要 dry-run Worker、公开缓存样本与结果路径');
const source = await readFile(resolve(sourcePath), 'utf8');
const exported = source.match(/(\w+) as default\s*\n?\}/)?.[1];
const buildId = source.match(/var BuildId = "([^"]+)"/)?.[1];
assert(exported && buildId, '需要非压缩的实际 Worker 产物');
const directory = await mkdtemp(join(tmpdir(), 'built-isr-verification-'));
const hash = createHash('sha256').update('/zh/skills').digest('hex');
const key = `incremental-cache/${buildId}/${hash}.cache`;
const sample = JSON.parse(await readFile(resolve(cachePath), 'utf8'));
assert.equal(sample.type, 'app');
sample.revalidate = 86400;

let instrumented = source.replace(`${exported} as default`, 'researchWorker as default');
// 只记录读取 TTL 前后的实际 Next 配置。产品函数保持不变。
const restore = /function restoreStoredRevalidate\d*\(key, entry, controls\) \{/g;
assert(source.match(restore)?.length, '修复函数未进入产物');
instrumented = instrumented.replace(
  restore,
  `$& globalThis.__events?.push({event:'restore',key,before:controls?.get(key),hasControls:!!controls});`,
);
instrumented += `
const researchWorker = { async fetch(request, env, ctx) {
  if(new URL(request.url).pathname==='/__seed') {
    await env.NEXT_INC_CACHE_R2_BUCKET.put(request.headers.get('key'),await request.text());
    return new Response('seeded');
  }
  const opts=await request.json();
  globalThis.__events=[];
  const events=globalThis.__events, bucket=env.NEXT_INC_CACHE_R2_BUCKET, pending=[];
  const bindings={...env,
    NEXT_INC_CACHE_R2_BUCKET:{
      async get(key){const item=await bucket.get(key);events.push({event:'get',key});
        return item?{json:()=>item.json(),uploaded:new Date(Date.now()-opts.ageSeconds*1000)}:null;},
      async put(key,value){events.push({event:'put',key});return bucket.put(key,value);},
      async delete(key){events.push({event:'delete',key});return bucket.delete(key);}
    },
    NEXT_CACHE_DO_QUEUE:{idFromName(name){return name;},get(){return{async revalidate(msg){events.push({event:'queue',message:msg.MessageBody.url});}};}}
  };
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async(req)=>{events.push({event:'external-fetch'});return Response.json([],{headers:{'x-wp-total':'0','x-wp-totalpages':'0'}});};
  try {
    const res=await ${exported}.fetch(new Request('http://localhost'+opts.path,{headers:{host:'localhost'}}),bindings,{waitUntil(p){pending.push(p);ctx.waitUntil(p);}});
    await res.text();
    let index=0;while(index<pending.length)await pending[index++].catch(error=>events.push({event:'background-error',message:String(error)}));
    const gateWrites=[];
    await runWithCacheWritePolicy(async()=>{
      await writeCacheWhenAllowed2(async()=>gateWrites.push('write'));
      return new Response('not found',{status:404});
    });
    events.push({event:'compiled-gate',status:404,writes:gateWrites.length});
    return Response.json({path:opts.path,status:res.status,headers:Object.fromEntries(res.headers),events});
  } finally { globalThis.fetch=oldFetch; }
}};
`;
const scriptPath = join(directory, 'worker.js');
await writeFile(scriptPath, instrumented);
const modules = [{ type: 'ESModule', path: scriptPath }];
for (const file of await readdir(dirname(resolve(sourcePath)))) {
  if (!file.endsWith('.wasm') && !file.endsWith('.bin')) continue;
  const path = join(directory, basename(file));
  await writeFile(path, await readFile(join(dirname(resolve(sourcePath)), file)));
  modules.push({ type: file.endsWith('.wasm') ? 'CompiledWasm' : 'Data', path });
}
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const sdk = (await import(wranglerRequire.resolve('miniflare'))) as {
  Miniflare: new (options: unknown) => Runtime;
  convertV4MiniflareOptions(options: unknown): unknown;
};
const results: Result[] = [];
async function run(label: string, ageSeconds: number, path = '/skills', tagInvalidated = false) {
  const runtime = new sdk.Miniflare(
    sdk.convertV4MiniflareOptions({
      workers: [
        {
          name: 'verification',
          modulesRoot: directory,
          modules,
          compatibilityDate: '2026-01-01',
          compatibilityFlags: ['nodejs_compat'],
          r2Buckets: ['NEXT_INC_CACHE_R2_BUCKET'],
          d1Databases: ['NEXT_TAG_CACHE_D1', 'DB'],
          bindings: { WORDPRESS_API_URL: 'https://offline.invalid/wp-json/wp/v2' },
        },
      ],
    }),
  );
  try {
    const tags = await runtime.getD1Database('NEXT_TAG_CACHE_D1');
    await tags.exec('CREATE TABLE revalidations (tag TEXT, revalidatedAt INTEGER, stale INTEGER, expire INTEGER)');
    if (tagInvalidated)
      await tags.exec(
        `INSERT INTO revalidations VALUES ('${buildId}/_N_T_/zh/skills', ${Date.now()}, ${Date.now()}, ${Date.now()})`,
      );
    const db = await runtime.getD1Database('DB');
    const migrations = resolve(dirname(import.meta.filename), '../../migrations');
    for (const file of (await readdir(migrations)).filter((file) => file.endsWith('.sql')).sort()) {
      for (const sql of (await readFile(join(migrations, file), 'utf8')).split(';').filter((sql) => sql.trim()))
        await db.prepare(sql).run();
    }
    await runtime.dispatchFetch('http://localhost/__seed', {
      method: 'POST',
      headers: { key },
      body: JSON.stringify(sample),
    });
    const response = await runtime.dispatchFetch('http://localhost/__probe', {
      method: 'POST',
      body: JSON.stringify({ path, ageSeconds }),
    });
    assert.equal(response.status, 200, await response.clone().text());
    const result = (await response.json()) as Result;
    results.push(result);
    console.log(
      JSON.stringify({
        label,
        status: result.status,
        next: result.headers['x-nextjs-cache'],
        ttl: result.headers['cache-control'],
        puts: result.events.filter((event) => event.event === 'put').length,
        queued: result.events.filter((event) => event.event === 'queue').length,
      }),
    );
    return result;
  } finally {
    await runtime.dispose();
  }
}
const fresh = await run('cold-fresh', 60);
assert.equal(fresh.headers['x-nextjs-cache'], 'HIT');
assert(!fresh.events.some((event) => event.event === 'put' || event.event === 'queue'));
assert.match(fresh.headers['cache-control'], /s-maxage=863\d\d/);
const expired = await run('cold-expired', 86410);
assert.equal(expired.headers['x-nextjs-cache'], 'STALE');
assert(expired.events.some((event) => event.event === 'put' && event.key === key));
const missing = await run('not-found', 60, '/posts/offline-missing-cache-regression');
assert.equal(missing.status, 404);
assert(!missing.events.some((event) => event.event === 'put'));
const invalidated = await run('tag-invalidated', 60, '/skills', true);
assert.equal(invalidated.headers['x-nextjs-cache'], 'MISS');
assert(invalidated.events.some((event) => event.event === 'put' && event.key === key));
for (const result of results) {
  const gate = result.events.find((event) => event.event === 'compiled-gate') as
    | (Event & { writes: number })
    | undefined;
  assert.equal(gate?.writes, 0, '实际入口与 server adapter 副本必须共享 404 写入保护');
}
await writeFile(
  resolve(outputPath),
  JSON.stringify(
    {
      buildId,
      sourceHash: createHash('sha256').update(source).digest('hex'),
      queueTransport: '捕获官方 RPC，不执行真实 DO；R2/D1 为本地',
      results,
    },
    null,
    2,
  ) + '\n',
);
