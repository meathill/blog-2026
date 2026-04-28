import { NextResponse } from 'next/server';
import { McpAuthError, requireMcpAuth } from '@/lib/mcp/auth';
import { toolDescriptors, toolMap } from '@/lib/mcp/tools';

export const dynamic = 'force-dynamic';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'blog-2026-apps';
const SERVER_VERSION = '0.1.0';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: data !== undefined ? { code, message, data } : { code, message },
  };
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function POST(req: Request) {
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

  const isNotification = body.id === undefined || body.id === null;
  const startedAt = Date.now();

  try {
    switch (body.method) {
      case 'initialize':
        return NextResponse.json(
          rpcResult(body.id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          }),
        );

      case 'notifications/initialized':
      case 'notifications/cancelled':
        return new NextResponse(null, { status: 202 });

      case 'ping':
        return NextResponse.json(rpcResult(body.id, {}));

      case 'tools/list':
        return NextResponse.json(rpcResult(body.id, { tools: toolDescriptors }));

      case 'tools/call': {
        const params = (body.params || {}) as { name?: string; arguments?: unknown };
        const tool = params.name ? toolMap.get(params.name) : undefined;
        if (!tool) {
          return NextResponse.json(rpcError(body.id, -32602, `Unknown tool: ${params.name}`));
        }
        const parsed = tool.inputSchema.safeParse(params.arguments ?? {});
        if (!parsed.success) {
          return NextResponse.json(rpcError(body.id, -32602, 'Invalid arguments', parsed.error.issues));
        }
        try {
          const out = await tool.handler(parsed.data);
          console.log(JSON.stringify({ mcp: true, tool: tool.name, ms: Date.now() - startedAt, ok: true }));
          return NextResponse.json(
            rpcResult(body.id, {
              content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
            }),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.log(
            JSON.stringify({
              mcp: true,
              tool: tool.name,
              ms: Date.now() - startedAt,
              ok: false,
              error: message,
            }),
          );
          return NextResponse.json(
            rpcResult(body.id, {
              isError: true,
              content: [{ type: 'text', text: message }],
            }),
          );
        }
      }

      default:
        if (isNotification) return new NextResponse(null, { status: 202 });
        return NextResponse.json(rpcError(body.id, -32601, `Method not found: ${body.method}`));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[mcp] handler error:', err);
    return NextResponse.json(rpcError(body.id ?? null, -32603, message));
  }
}
