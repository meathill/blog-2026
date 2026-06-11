// Cloudflare API 封装:Bearer 鉴权、信封解析、分页
// token 从环境变量 CLOUDFLARE_API_TOKEN 读取(不要写进 .env 或代码)
// 若机器走代理,node fetch 默认不读代理变量,需 `NODE_USE_ENV_PROXY=1 node ...`

import type { CfEnvelope, CfError, Zone } from './types.ts';

export const ACCOUNT_ID = 'fdc63eeea83ae8f5234357308b9a638b';
export const ZONE_NAME = 'meathill.com';
export const BLOG_HOST = 'blog.meathill.com';

const API_BASE = 'https://api.cloudflare.com/client/v4';

export class CfApiError extends Error {
  status: number;
  errors: CfError[];
  path: string;

  constructor(status: number, errors: CfError[], path: string) {
    super(
      `Cloudflare API ${status} @ ${path}: ${errors.map((e) => `[${e.code}] ${e.message}`).join('; ') || '(无错误详情)'}`,
    );
    this.name = 'CfApiError';
    this.status = status;
    this.errors = errors;
    this.path = path;
  }
}

function getToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error('缺少 CLOUDFLARE_API_TOKEN 环境变量。权限清单见 scripts/cloudflare/README.md');
    process.exit(1);
  }
  return token;
}

async function cfRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const envelope = (await response.json()) as CfEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new CfApiError(response.status, envelope.errors ?? [], path);
  }
  return envelope.result;
}

export function cfGet<T>(path: string): Promise<T> {
  return cfRequest<T>('GET', path);
}

/** GET,404(资源不存在,如 phase entrypoint 未创建)时返回 null */
export async function cfGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await cfRequest<T>('GET', path);
  } catch (error) {
    if (error instanceof CfApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function cfPost<T>(path: string, body: unknown): Promise<T> {
  return cfRequest<T>('POST', path, body);
}

export function cfPut<T>(path: string, body: unknown): Promise<T> {
  return cfRequest<T>('PUT', path, body);
}

export function cfPatch<T>(path: string, body: unknown): Promise<T> {
  return cfRequest<T>('PATCH', path, body);
}

export function cfDelete<T>(path: string): Promise<T> {
  return cfRequest<T>('DELETE', path);
}

/** 列表接口分页拉全(page 递增直到 total_pages) */
export async function cfGetAll<T>(path: string): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?';
  const results: T[] = [];
  let page = 1;
  for (;;) {
    const response = await fetch(`${API_BASE}${path}${separator}page=${page}&per_page=50`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const envelope = (await response.json()) as CfEnvelope<T[]>;
    if (!response.ok || !envelope.success) {
      throw new CfApiError(response.status, envelope.errors ?? [], path);
    }
    results.push(...envelope.result);
    const totalPages = envelope.result_info?.total_pages ?? 1;
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }
  return results;
}

let cachedZoneId: string | null = null;

export async function getZoneId(): Promise<string> {
  if (cachedZoneId) {
    return cachedZoneId;
  }
  const zones = await cfGet<Zone[]>(`/zones?name=${ZONE_NAME}`);
  const zone = zones[0];
  if (!zone) {
    console.error(`找不到 zone ${ZONE_NAME},检查 token 的 Zone Read 权限与 Zone Resources 范围`);
    process.exit(1);
  }
  cachedZoneId = zone.id;
  return zone.id;
}
