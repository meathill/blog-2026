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

import { DELETE, GET, POST } from '@/app/api/mcp/route';
import { McpAuthError } from '@/lib/mcp/auth';

const MODERN_VERSION = '2026-07-28';
const PROTOCOL_VERSION_META_KEY = 'io.modelcontextprotocol/protocolVersion';
const SERVER_INFO_META_KEY = 'io.modelcontextprotocol/serverInfo';

interface McpRpcResponse {
  result?: {
    protocolVersion?: string;
    serverInfo?: { name: string; version?: string };
    tools?: { name: string }[];
    content?: { text: string }[];
    resultType?: string;
    ttlMs?: number;
    cacheScope?: string;
    supportedVersions?: string[];
    isError?: boolean;
    _meta?: Record<string, unknown>;
  } & Record<string, unknown>;
  error?: { code: number; message: string; data?: { supported?: string[]; requested?: string } };
}

async function readJson(res: Response): Promise<McpRpcResponse> {
  return (await res.json()) as McpRpcResponse;
}

function postRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function modernMeta(version: string = MODERN_VERSION): Record<string, unknown> {
  return {
    [PROTOCOL_VERSION_META_KEY]: version,
    'io.modelcontextprotocol/clientInfo': { name: 'test-client', version: '1.0.0' },
    'io.modelcontextprotocol/clientCapabilities': {},
  };
}

function modernBody(
  method: string,
  paramsExtra: Record<string, unknown> = {},
  version: string = MODERN_VERSION,
): Record<string, unknown> {
  return { jsonrpc: '2.0', id: 1, method, params: { _meta: modernMeta(version), ...paramsExtra } };
}

function modernHeaders(method: string, name?: string): Record<string, string> {
  return {
    'MCP-Protocol-Version': MODERN_VERSION,
    'Mcp-Method': method,
    ...(name ? { 'Mcp-Name': name } : {}),
  };
}

describe('/api/mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireMcpAuth.mockResolvedValue(undefined);
    mockHandler.mockResolvedValue({ ok: true });
  });

  it('GET/DELETE 应返回 405', async () => {
    expect((await GET()).status).toBe(405);
    expect((await DELETE()).status).toBe(405);
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

  describe('legacy（initialize 握手）', () => {
    it('initialize 应原样返回支持的版本', async () => {
      const res = await POST(
        postRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }),
      );
      const json = await readJson(res);

      expect(json.result).toMatchObject({
        protocolVersion: '2025-06-18',
        serverInfo: { name: 'blog-2026-apps' },
      });
    });

    it('initialize 未知版本应回退到最新 legacy 版本', async () => {
      const res = await POST(postRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }));
      const json = await readJson(res);

      expect(json.result?.protocolVersion).toBe('2025-11-25');
    });

    it('ping 与 notifications 应正常应答', async () => {
      const ping = await POST(postRequest({ jsonrpc: '2.0', id: 2, method: 'ping' }));
      expect((await readJson(ping)).result).toEqual({});

      const notif = await POST(postRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }));
      expect(notif.status).toBe(202);
    });

    it('legacy tools/list 不带 modern 字段', async () => {
      const res = await POST(postRequest({ jsonrpc: '2.0', id: 3, method: 'tools/list' }));
      const json = await readJson(res);

      expect(json.result).toMatchObject({ tools: [{ name: 'fake-tool' }] });
      expect(json.result?.resultType).toBeUndefined();
      expect(json.result?.ttlMs).toBeUndefined();
    });

    it('legacy tools/call 成功应返回 content 文本', async () => {
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
      expect(json.result?.resultType).toBeUndefined();
    });

    it('legacy tools/call 参数非法应返回 -32602 且不调用 handler', async () => {
      const res = await POST(
        postRequest({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: { name: 'fake-tool', arguments: {} },
        }),
      );
      const json = await readJson(res);

      expect(json.error).toMatchObject({ code: -32602, message: 'Invalid arguments' });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('legacy tools/call 处理器抛错应返回 isError', async () => {
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

    it('legacy tools/call 未知工具应返回 -32602', async () => {
      const res = await POST(postRequest({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } }));
      const json = await readJson(res);

      expect(json.error).toMatchObject({ code: -32602 });
    });

    it('legacy 未知方法带 id 返回 -32601，无 id 按通知 202 处理', async () => {
      const withId = await POST(postRequest({ jsonrpc: '2.0', id: 8, method: 'whatever' }));
      expect((await readJson(withId)).error).toMatchObject({ code: -32601 });

      const notif = await POST(postRequest({ jsonrpc: '2.0', method: 'whatever' }));
      expect(notif.status).toBe(202);
    });

    it('legacy 带不支持的版本头应返回 400 -32022', async () => {
      const res = await POST(
        postRequest({ jsonrpc: '2.0', id: 9, method: 'tools/list' }, { 'MCP-Protocol-Version': '1999-01-01' }),
      );
      const json = await readJson(res);

      expect(res.status).toBe(400);
      expect(json.error?.code).toBe(-32022);
      expect(json.error?.data?.supported).toContain('2025-06-18');
      expect(json.error?.data?.requested).toBe('1999-01-01');
    });
  });

  describe('modern（2026-07-28，每请求 _meta）', () => {
    it('tools/list 应带 resultType/ttlMs/cacheScope/serverInfo', async () => {
      const res = await POST(postRequest(modernBody('tools/list'), modernHeaders('tools/list')));
      const json = await readJson(res);

      expect(res.status).toBe(200);
      expect(json.result).toMatchObject({
        resultType: 'complete',
        tools: [{ name: 'fake-tool' }],
        cacheScope: 'private',
      });
      expect(json.result?.ttlMs).toBeGreaterThan(0);
      expect(json.result?._meta?.[SERVER_INFO_META_KEY]).toMatchObject({ name: 'blog-2026-apps' });
    });

    it('server/discover 应返回支持版本与能力', async () => {
      const res = await POST(postRequest(modernBody('server/discover'), modernHeaders('server/discover')));
      const json = await readJson(res);

      expect(res.status).toBe(200);
      expect(json.result).toMatchObject({
        resultType: 'complete',
        supportedVersions: [MODERN_VERSION],
        cacheScope: 'private',
      });
      expect(json.result?.capabilities).toMatchObject({ tools: {} });
      expect(json.result?._meta?.[SERVER_INFO_META_KEY]).toMatchObject({ name: 'blog-2026-apps' });
    });

    it('tools/call 应校验 Mcp-Name 并返回 resultType', async () => {
      const res = await POST(
        postRequest(
          modernBody('tools/call', { name: 'fake-tool', arguments: { q: 'hi' } }),
          modernHeaders('tools/call', 'fake-tool'),
        ),
      );
      const json = await readJson(res);

      expect(mockHandler).toHaveBeenCalledWith({ q: 'hi' });
      expect(json.result).toMatchObject({
        resultType: 'complete',
        content: [{ text: expect.stringContaining('"ok": true') }],
      });
    });

    it('Mcp-Name 支持 base64 哨兵编码', async () => {
      const encoded = `=?base64?${Buffer.from('fake-tool', 'utf8').toString('base64')}?=`;
      const res = await POST(
        postRequest(
          modernBody('tools/call', { name: 'fake-tool', arguments: { q: 'hi' } }),
          modernHeaders('tools/call', encoded),
        ),
      );
      const json = await readJson(res);

      expect(res.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith({ q: 'hi' });
      expect(json.result?.resultType).toBe('complete');
    });

    it('tools/call 处理器抛错应返回 isError 且带 resultType', async () => {
      mockHandler.mockRejectedValue(new Error('boom'));

      const res = await POST(
        postRequest(
          modernBody('tools/call', { name: 'fake-tool', arguments: { q: 'hi' } }),
          modernHeaders('tools/call', 'fake-tool'),
        ),
      );
      const json = await readJson(res);

      expect(json.result).toMatchObject({ isError: true, resultType: 'complete', content: [{ text: 'boom' }] });
    });

    it('缺少 MCP-Protocol-Version 头应返回 400 -32020', async () => {
      const res = await POST(postRequest(modernBody('tools/list'), { 'Mcp-Method': 'tools/list' }));
      const json = await readJson(res);

      expect(res.status).toBe(400);
      expect(json.error?.code).toBe(-32020);
    });

    it('头与 body 版本不一致应返回 400 -32020', async () => {
      const res = await POST(
        postRequest(modernBody('tools/list'), {
          'MCP-Protocol-Version': '2020-01-01',
          'Mcp-Method': 'tools/list',
        }),
      );
      const json = await readJson(res);

      expect(res.status).toBe(400);
      expect(json.error?.code).toBe(-32020);
    });

    it('缺少 Mcp-Method 头应返回 400 -32020', async () => {
      const res = await POST(postRequest(modernBody('tools/list'), { 'MCP-Protocol-Version': MODERN_VERSION }));
      const json = await readJson(res);

      expect(res.status).toBe(400);
      expect(json.error?.code).toBe(-32020);
    });

    it('Mcp-Name 缺失或不匹配应返回 400 -32020', async () => {
      const missing = await POST(
        postRequest(
          modernBody('tools/call', { name: 'fake-tool', arguments: { q: 'hi' } }),
          modernHeaders('tools/call'),
        ),
      );
      expect(missing.status).toBe(400);
      expect((await readJson(missing)).error?.code).toBe(-32020);

      const wrong = await POST(
        postRequest(
          modernBody('tools/call', { name: 'fake-tool', arguments: { q: 'hi' } }),
          modernHeaders('tools/call', 'other-tool'),
        ),
      );
      expect(wrong.status).toBe(400);
      expect((await readJson(wrong)).error?.code).toBe(-32020);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('不支持的 modern 版本应返回 400 -32022 并列出支持版本', async () => {
      const res = await POST(
        postRequest(modernBody('tools/list', {}, '2025-01-01'), {
          'MCP-Protocol-Version': '2025-01-01',
          'Mcp-Method': 'tools/list',
        }),
      );
      const json = await readJson(res);

      expect(res.status).toBe(400);
      expect(json.error?.code).toBe(-32022);
      expect(json.error?.data?.supported).toEqual([MODERN_VERSION]);
      expect(json.error?.data?.requested).toBe('2025-01-01');
    });

    it('modern 未知方法应返回 404 + -32601', async () => {
      const res = await POST(postRequest(modernBody('whatever'), modernHeaders('whatever')));
      const json = await readJson(res);

      expect(res.status).toBe(404);
      expect(json.error).toMatchObject({ code: -32601 });
    });

    it('modern 通知（无 id）应返回 202', async () => {
      const res = await POST(
        postRequest({ jsonrpc: '2.0', method: 'notifications/initialized', params: { _meta: modernMeta() } }),
      );

      expect(res.status).toBe(202);
    });
  });
});
