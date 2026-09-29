import { NextResponse } from 'next/server';
import { McpAuthError, requireMcpAuth } from '@/lib/mcp/auth';
import { handleRpc, rpcError, type JsonRpcRequest } from '@/lib/mcp/protocol';

export const dynamic = 'force-dynamic';

// 规范要求校验 Origin 防 DNS rebinding；CLI 类客户端不带 Origin，不受影响
function isAllowedOrigin(origin: string): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meathill.com';
  return origin === siteUrl || origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000';
}

function methodNotAllowed() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await requireMcpAuth(req);
  } catch (e) {
    if (e instanceof McpAuthError) {
      return new NextResponse(e.message, { status: e.status });
    }
    return new NextResponse('Auth failed', { status: 401 });
  }

  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error'));
  }

  if (!body || typeof body !== 'object' || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return NextResponse.json(rpcError(body?.id ?? null, -32600, 'Invalid Request'));
  }

  try {
    return await handleRpc(body, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[mcp] handler error:', err);
    return NextResponse.json(rpcError(body.id ?? null, -32603, message));
  }
}
