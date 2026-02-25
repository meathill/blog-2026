import { NextRequest, NextResponse } from 'next/server';

/**
 * 性能数据收集 API
 * 接收来自客户端的 beacon 请求，记录代码高亮语言使用情况等性能数据。
 * 未来可扩展为收集更多前端性能指标。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body as { type: string; data: unknown };

    switch (type) {
      case 'highlight-languages': {
        const { languages, path } = data as { languages: string[]; path: string };
        console.log(`[Perf] highlight-languages | path=${path} | languages=${languages.join(',')}`);
        break;
      }

      default:
        console.log(`[Perf] unknown type=${type}`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
