import { NextResponse } from 'next/server';
import { toolDescriptors, toolMap } from '@/lib/mcp/tools';

// MCP 规范：https://modelcontextprotocol.io/specification/2026-07-28
// dual-era 实现（规范 Versioning > Backward Compatibility）：
// - modern（2026-07-28）：无 initialize 握手，每个请求在 params._meta 里带协议版本，无状态应答
// - legacy（≤2025-11-25）：initialize 握手协商版本，之后按 legacy 语义应答（ping 等）
// 同一端点同时服务两个时代：initialize 选 legacy；带 _meta 的请求选 modern。
export const SERVER_NAME = 'blog-2026-apps';
export const SERVER_VERSION = '0.2.0';

// modern 语义下可通过 _meta 请求的版本
export const SUPPORTED_MODERN_VERSIONS: string[] = ['2026-07-28'];
// legacy 握手可协商的版本
export const SUPPORTED_LEGACY_VERSIONS: string[] = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const LATEST_LEGACY_VERSION = SUPPORTED_LEGACY_VERSIONS[0];

const PROTOCOL_VERSION_META_KEY = 'io.modelcontextprotocol/protocolVersion';
const SERVER_INFO_META_KEY = 'io.modelcontextprotocol/serverInfo';

// 规范 CacheableResult：list 类结果必须带 ttlMs（新鲜度提示）与 cacheScope。
// 工具清单随部署变化，且响应经过 Bearer 鉴权，取私有短缓存。
const LIST_TTL_MS = 5 * 60_000;
const LIST_CACHE_SCOPE = 'private';

const HEADER_MISMATCH_CODE = -32020;
const UNSUPPORTED_VERSION_CODE = -32022;
const BASE64_SENTINEL_PREFIX = '=?base64?';
const BASE64_SENTINEL_SUFFIX = '?=';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

export function rpcError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: data !== undefined ? { code, message, data } : { code, message },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getHeader(req: Request, name: string): string | undefined {
  const value = req.headers.get(name);
  return value === null ? undefined : value;
}

// 规范 Value Encoding：=?base64?...?= 哨兵格式的头值需解码后再与 body 比对
function decodeHeaderValue(raw: string): string {
  if (raw.startsWith(BASE64_SENTINEL_PREFIX) && raw.endsWith(BASE64_SENTINEL_SUFFIX)) {
    try {
      return atob(raw.slice(BASE64_SENTINEL_PREFIX.length, -BASE64_SENTINEL_SUFFIX.length));
    } catch {
      return raw; // 解码失败按原值比对，自然失配
    }
  }
  return raw;
}

function serverInfoMeta() {
  return { [SERVER_INFO_META_KEY]: { name: SERVER_NAME, version: SERVER_VERSION } };
}

function jsonRpcResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function notificationAccepted() {
  return new NextResponse(null, { status: 202 });
}

function headerMismatch(id: JsonRpcRequest['id'], detail: string) {
  return jsonRpcResponse(rpcError(id, HEADER_MISMATCH_CODE, `Header mismatch: ${detail}`), 400);
}

/** dual-era 入口：initialize 走 legacy 握手；带 _meta 版本的请求走 modern；其余按 legacy。 */
export async function handleRpc(body: JsonRpcRequest, req: Request): Promise<Response> {
  if (body.method === 'initialize') return legacyInitialize(body);

  const requestedVersion = readModernProtocolVersion(body.params);
  if (requestedVersion !== undefined) return handleModern(body, req, requestedVersion);
  return handleLegacy(body, req);
}

function legacyInitialize(body: JsonRpcRequest) {
  const requested = isRecord(body.params) ? body.params.protocolVersion : undefined;
  const protocolVersion =
    typeof requested === 'string' && SUPPORTED_LEGACY_VERSIONS.includes(requested) ? requested : LATEST_LEGACY_VERSION;
  return jsonRpcResponse(
    rpcResult(body.id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    }),
  );
}

function readModernProtocolVersion(params: unknown): string | undefined {
  if (!isRecord(params) || !isRecord(params._meta)) return undefined;
  const version = params._meta[PROTOCOL_VERSION_META_KEY];
  return typeof version === 'string' ? version : undefined;
}

function readTargetName(params: unknown): string | undefined {
  if (!isRecord(params)) return undefined;
  if (typeof params.name === 'string') return params.name;
  if (typeof params.uri === 'string') return params.uri;
  return undefined;
}

async function handleModern(body: JsonRpcRequest, req: Request, requestedVersion: string): Promise<Response> {
  const isNotification = body.id === undefined || body.id === null;
  // 本版本核心协议在 Streamable HTTP 上没有客户端通知，且通知的头部要求未定义，直接接受
  if (isNotification) return notificationAccepted();

  if (!SUPPORTED_MODERN_VERSIONS.includes(requestedVersion)) {
    return jsonRpcResponse(
      rpcError(body.id, UNSUPPORTED_VERSION_CODE, 'Unsupported protocol version', {
        supported: SUPPORTED_MODERN_VERSIONS,
        requested: requestedVersion,
      }),
      400,
    );
  }

  // 镜像头与 body 必须一致（规范 Server Validation），缺失或失配 → 400 HeaderMismatch
  const headerVersion = getHeader(req, 'mcp-protocol-version');
  if (headerVersion !== requestedVersion) {
    return headerMismatch(
      body.id,
      `MCP-Protocol-Version header '${headerVersion ?? ''}' does not match body version '${requestedVersion}'`,
    );
  }

  const headerMethod = getHeader(req, 'mcp-method');
  if (headerMethod !== body.method) {
    return headerMismatch(
      body.id,
      `Mcp-Method header '${headerMethod ?? ''}' does not match body method '${body.method}'`,
    );
  }

  const targetName = readTargetName(body.params);
  if (targetName !== undefined) {
    const headerName = getHeader(req, 'mcp-name');
    if (headerName === undefined || decodeHeaderValue(headerName) !== targetName) {
      return headerMismatch(body.id, `Mcp-Name header does not match body name '${targetName}'`);
    }
  }

  switch (body.method) {
    case 'server/discover':
      return jsonRpcResponse(rpcResult(body.id, discoverResult()));
    case 'tools/list':
      return jsonRpcResponse(
        rpcResult(body.id, {
          resultType: 'complete',
          tools: toolDescriptors,
          ttlMs: LIST_TTL_MS,
          cacheScope: LIST_CACHE_SCOPE,
          _meta: serverInfoMeta(),
        }),
      );
    case 'tools/call':
      return callTool(body, true);
    default:
      // modern 客户端以 HTTP 404 + -32601 识别 modern server（Backward Compatibility 探测）
      return jsonRpcResponse(rpcError(body.id, -32601, `Method not found: ${body.method}`), 404);
  }
}

async function handleLegacy(body: JsonRpcRequest, req: Request): Promise<Response> {
  const isNotification = body.id === undefined || body.id === null;
  const headerVersion = getHeader(req, 'mcp-protocol-version');
  // 2025-06-18 起客户端应在后续请求带版本头；缺失按规范视为 2025-03-26
  if (headerVersion !== undefined && !SUPPORTED_LEGACY_VERSIONS.includes(headerVersion)) {
    return jsonRpcResponse(
      rpcError(body.id ?? null, UNSUPPORTED_VERSION_CODE, 'Unsupported protocol version', {
        supported: SUPPORTED_LEGACY_VERSIONS,
        requested: headerVersion,
      }),
      400,
    );
  }

  switch (body.method) {
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return notificationAccepted();
    case 'ping':
      return jsonRpcResponse(rpcResult(body.id, {}));
    case 'server/discover':
      return jsonRpcResponse(rpcResult(body.id, discoverResult()));
    case 'tools/list':
      return jsonRpcResponse(rpcResult(body.id, { tools: toolDescriptors }));
    case 'tools/call':
      return callTool(body, false);
    default:
      if (isNotification) return notificationAccepted();
      return jsonRpcResponse(rpcError(body.id, -32601, `Method not found: ${body.method}`));
  }
}

function discoverResult() {
  return {
    resultType: 'complete',
    supportedVersions: SUPPORTED_MODERN_VERSIONS,
    capabilities: { tools: {} },
    _meta: serverInfoMeta(),
    instructions: 'Manage apps and blog content on meathill.com: apps CRUD, images, translations and blog drafts.',
    ttlMs: LIST_TTL_MS,
    cacheScope: LIST_CACHE_SCOPE,
  };
}

function toolResult(modern: boolean, content: { type: 'text'; text: string }[]) {
  return modern ? { resultType: 'complete', content, _meta: serverInfoMeta() } : { content };
}

function logToolCall(name: string, startedAt: number, ok: boolean, error?: string) {
  console.log(JSON.stringify({ mcp: true, tool: name, ms: Date.now() - startedAt, ok, ...(error ? { error } : {}) }));
}

async function callTool(body: JsonRpcRequest, modern: boolean): Promise<Response> {
  const params = (body.params || {}) as { name?: string; arguments?: unknown };
  const tool = params.name ? toolMap.get(params.name) : undefined;
  if (!tool) {
    return jsonRpcResponse(rpcError(body.id, -32602, `Unknown tool: ${params.name}`));
  }
  const parsed = tool.inputSchema.safeParse(params.arguments ?? {});
  if (!parsed.success) {
    return jsonRpcResponse(rpcError(body.id, -32602, 'Invalid arguments', parsed.error.issues));
  }

  const startedAt = Date.now();
  try {
    const out = await tool.handler(parsed.data);
    logToolCall(tool.name, startedAt, true);
    return jsonRpcResponse(
      rpcResult(body.id, toolResult(modern, [{ type: 'text', text: JSON.stringify(out, null, 2) }])),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logToolCall(tool.name, startedAt, false, message);
    return jsonRpcResponse(
      rpcResult(body.id, { ...toolResult(modern, [{ type: 'text', text: message }]), isError: true }),
    );
  }
}
