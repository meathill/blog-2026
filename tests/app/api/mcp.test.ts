import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mockRequireMcpAuth = vi.fn();
const mockHandler = vi.fn();

vi.mock('@/lib/mcp/auth', () => ({
  McpAuthError: class McpAuthError extends Error {
    readonly status: 401 | 503;
    constructor(message: string, status: 401 | 503) {
      super(message);
      this.name = 'McpAuthError';
      this.status = status;
    }
  },
  requireMcpAuth: (...args: unknown[]) => mockRequireMcpAuth(...args),
}));

vi.mock('@/lib/mcp/tools', () => {
  const fakeTool = {
    name: 'fake-tool',
    inputSchema: z.object({ q: z.string() }),
    handler: (...args: unknown[]) => mockHandler(...args),
  };
  return {
    toolMap: new Map([['fake-tool', fakeTool]]),
    toolDescriptors: [{ name: 'fake-tool', description: 'fake', inputSchema: {} }],
  };
});

import { GET, POST } from '@/app/api/mcp/route';
import { McpAuthError } from '@/lib/mcp/auth';

interface McpRpcResponse {
  result?: {
    protocolVersion?: string;
    serverInfo?: { name: string };
    tools?: { name: string }[];
    content?: { text: string }[];
  } & Record<string, unknown>;
  error?: { code: number; message: string };
}

async function readJson(res: Response): Promise<McpRpcResponse> {
  return (await res.json()) as McpRpcResponse;
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireMcpAuth.mockResolvedValue(undefined);
    mockHandler.mockResolvedValue({ ok: true });
  });

  it('GET 应返回 405', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });

  it('鉴权失败应按 McpAuthError 状态返回', async () => {
    mockRequireMcpAuth.mockRejectedValue(new McpAuthError('Invalid token', 401));

    const res = await POST(postRequest({ jsonrpc: '2.0', id: 1, method: 'ping' }));

    expect(res.status).toBe(401);
  });

  it('非法 JSON 应返回 Parse error', async () => {
    const res = await POST(postRequest('not json'));
    const json = await readJson(res);

    expect(json.error).toMatchObject({ code: -32700 });
  });

  it('非 2.0 请求应返回 Invalid Request', async () => {
    const res = await POST(postRequest({ id: 1, method: 'ping' }));
    const json = await readJson(res);

    expect(json.error).toMatchObject({ code: -32600 });
  });

  it('initialize 应返回协议版本与服务信息', async () => {
    const res = await POST(postRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' }));
    const json = await readJson(res);

    expect(json.result).toMatchObject({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'blog-2026-apps' },
    });
  });

  it('ping 与 notifications 应正常应答', async () => {
    const ping = await POST(postRequest({ jsonrpc: '2.0', id: 2, method: 'ping' }));
    expect((await readJson(ping)).result).toEqual({});

    const notif = await POST(postRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }));
    expect(notif.status).toBe(202);
  });

  it('tools/list 应返回工具描述', async () => {
    const res = await POST(postRequest({ jsonrpc: '2.0', id: 3, method: 'tools/list' }));
    const json = await readJson(res);

    expect(json.result).toMatchObject({ tools: [{ name: 'fake-tool' }] });
  });

  it('tools/call 未知工具应返回 -32602', async () => {
    const res = await POST(postRequest({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } }));
    const json = await readJson(res);

    expect(json.error).toMatchObject({ code: -32602 });
  });

  it('tools/call 参数非法应返回 Invalid arguments', async () => {
    const res = await POST(
      postRequest({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'fake-tool', arguments: {} } }),
    );
    const json = await readJson(res);

    expect(json.error).toMatchObject({ code: -32602, message: 'Invalid arguments' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('tools/call 成功应返回 content 文本', async () => {
    const res = await POST(
      postRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'fake-tool', arguments: { q: 'hi' } },
      }),
    );
    const json = await readJson(res);

    expect(mockHandler).toHaveBeenCalledWith({ q: 'hi' });
    expect(json.result).toMatchObject({ content: [{ text: expect.stringContaining('"ok": true') }] });
  });

  it('tools/call 处理器抛错应返回 isError', async () => {
    mockHandler.mockRejectedValue(new Error('boom'));

    const res = await POST(
      postRequest({
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'fake-tool', arguments: { q: 'hi' } },
      }),
    );
    const json = await readJson(res);

    expect(json.result).toMatchObject({ isError: true, content: [{ text: 'boom' }] });
  });

  it('未知方法带 id 返回 -32601，无 id 按通知 202 处理', async () => {
    const withId = await POST(postRequest({ jsonrpc: '2.0', id: 8, method: 'whatever' }));
    expect((await readJson(withId)).error).toMatchObject({ code: -32601 });

    const notif = await POST(postRequest({ jsonrpc: '2.0', method: 'whatever' }));
    expect(notif.status).toBe(202);
  });
});
