import { getCloudflareContext } from '@opennextjs/cloudflare';

export class McpAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 503,
  ) {
    super(message);
    this.name = 'McpAuthError';
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function requireMcpAuth(req: Request): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  const expected = (env as { MCP_TOKEN?: string }).MCP_TOKEN;

  if (!expected) {
    console.warn('[mcp] MCP_TOKEN is not configured; refusing all requests');
    throw new McpAuthError('MCP server not configured', 503);
  }

  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    throw new McpAuthError('Missing bearer token', 401);
  }
  const token = header.slice(7).trim();
  if (!constantTimeEqual(token, expected)) {
    throw new McpAuthError('Invalid token', 401);
  }
}
