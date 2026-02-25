import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 性能数据收集 API
 * 通过 KV 存储代码高亮语言使用情况。
 *
 * KV 结构：
 * - key: `hl:langs` → value: JSON { [language]: count }
 * - key: `hl:paths` → value: JSON { [path]: [language1, language2, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body as { type: string; data: Record<string, unknown> };

    if (!type || !data) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    // PERF_KV 需要在 wrangler.jsonc 中配置 KV namespace 后重新运行 `wrangler types` 更新类型
    const kv = (env as unknown as Record<string, unknown>).PERF_KV as KVNamespace | undefined;
    if (!kv) {
      // KV 未绑定时静默失败，不影响正常功能
      return NextResponse.json({ ok: true });
    }

    switch (type) {
      case 'highlight-languages': {
        const { languages, path } = data as { languages: string[]; path: string };
        if (!languages?.length || !path) break;

        // 聚合语言计数
        const existing = (await kv.get('hl:langs', 'json')) as Record<string, number> | null;
        const counts = existing || {};
        for (const lang of languages) {
          counts[lang] = (counts[lang] || 0) + 1;
        }
        await kv.put('hl:langs', JSON.stringify(counts));

        // 记录每个 path 用了哪些语言（去重）
        const paths = (await kv.get('hl:paths', 'json')) as Record<string, string[]> | null;
        const pathMap = paths || {};
        const existingLangs = new Set(pathMap[path] || []);
        for (const lang of languages) {
          existingLangs.add(lang);
        }
        pathMap[path] = [...existingLangs];
        await kv.put('hl:paths', JSON.stringify(pathMap));

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
