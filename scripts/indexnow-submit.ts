/**
 * IndexNow 手动提交脚本（issue #5）。发文 / 更新文章后手动跑一次，把 URL 推给
 * api.indexnow.org（会分发到 Bing / Yandex / Seznam 等全部参与引擎）。
 *
 * 用法：
 *   pnpm indexnow -- /posts/next-js/some-post          # 路径自动补站点前缀
 *   pnpm indexnow -- https://meathill.com/some-page    # 也可传绝对 URL，可多个
 *   pnpm indexnow -- --since 3                         # 提交 sitemap 中近 3 天更新过的 URL
 *
 * key 按 IndexNow 协议本就公开（/<key>.txt 任何人可访问），无需进 .env。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const HOST = 'meathill.com';
const SITE_URL = `https://${HOST}`;
const INDEXNOW_KEY = 'a44ae7d8815444ca6d7b7692ab26cf0b';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// 防止常量与 public/ 下的 key 文件漂移
async function assertKeyFileMatches(): Promise<void> {
  const keyFilePath = path.join(import.meta.dirname, '..', 'public', `${INDEXNOW_KEY}.txt`);
  const content = (await readFile(keyFilePath, 'utf8')).trim();
  if (content !== INDEXNOW_KEY) {
    throw new Error(`key 文件内容与脚本常量不一致：${keyFilePath}`);
  }
}

export function toAbsoluteUrl(input: string): string {
  if (input.startsWith('https://') || input.startsWith('http://')) {
    return input;
  }
  if (input.startsWith('/')) {
    return `${SITE_URL}${input}`;
  }
  throw new Error(`无法识别的 URL 或路径：${input}`);
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

// Next.js MetadataRoute 生成的 sitemap 格式规整，正则解析足够
export function parseSitemapUrls(xml: string, cutoffMs: number): string[] {
  const urls: string[] = [];
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1];
    if (!loc || !lastmod) {
      continue;
    }
    const modifiedAt = new Date(lastmod.trim()).getTime();
    if (!Number.isNaN(modifiedAt) && modifiedAt >= cutoffMs) {
      urls.push(decodeXmlEntities(loc.trim()));
    }
  }
  return urls;
}

async function collectRecentUrlsFromSitemap(sinceDays: number): Promise<string[]> {
  const response = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`拉取 sitemap 失败：HTTP ${response.status}`);
  }
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  return parseSitemapUrls(await response.text(), cutoff);
}

async function submit(urlList: string[]): Promise<void> {
  console.log(`将提交 ${urlList.length} 个 URL：`);
  for (const url of urlList) {
    console.log(`  ${url}`);
  }
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  // IndexNow 语义：200 = 收到，202 = 收到但 key 待验证，二者均为成功
  console.log(`IndexNow 响应：HTTP ${response.status}`);
  if (!response.ok && response.status !== 202) {
    const body = await response.text();
    throw new Error(`提交失败：${body || response.statusText}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  if (args.length === 0) {
    console.log('用法：pnpm indexnow -- <URL|路径>... 或 pnpm indexnow -- --since <天数>');
    process.exitCode = 1;
    return;
  }

  await assertKeyFileMatches();

  let urlList: string[];
  const sinceIndex = args.indexOf('--since');
  if (sinceIndex >= 0) {
    const sinceDays = Number(args[sinceIndex + 1]);
    if (!Number.isFinite(sinceDays) || sinceDays <= 0) {
      throw new Error('--since 需要一个正数天数，例如 --since 3');
    }
    urlList = await collectRecentUrlsFromSitemap(sinceDays);
    if (urlList.length === 0) {
      console.log(`sitemap 中没有近 ${sinceDays} 天更新的 URL，无需提交。`);
      return;
    }
  } else {
    urlList = args.map(toAbsoluteUrl);
  }

  await submit(urlList);
}

// 直接执行时才跑 main；被测试 import 时只导出纯函数
if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
