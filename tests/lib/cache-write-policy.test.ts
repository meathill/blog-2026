import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it, vi } from 'vitest';
import { runWithCacheWritePolicy, writeCacheWhenAllowed } from '@/lib/cache-write-policy';

describe('请求级缓存写入策略', () => {
  it('分别加载的模块副本共享请求上下文，404 不会提前写入', async () => {
    vi.resetModules();
    const entry = await import('@/lib/cache-write-policy');
    vi.resetModules();
    const adapter = await import('@/lib/cache-write-policy');
    const write = vi.fn(async () => {});
    await entry.runWithCacheWritePolicy(async () => {
      await adapter.writeCacheWhenAllowed(write);
      expect(write).not.toHaveBeenCalled();
      return new Response('Not Found', { status: 404 });
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('另一模块生成流式 404 标记后，即使响应为 200 也丢弃写入', async () => {
    vi.resetModules();
    const entry = await import('@/lib/cache-write-policy');
    vi.resetModules();
    const adapter = await import('@/lib/cache-write-policy');
    const write = vi.fn(async () => {});
    await entry.runWithCacheWritePolicy(async () => {
      await adapter.writeCacheWhenAllowed(write);
      adapter.rejectNotFoundCacheWrites();
      return new Response('streamed not found');
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('最终 404：渲染期间计划写入的数据和页面均不落盘', async () => {
    const write = vi.fn(async () => {});
    const response = await runWithCacheWritePolicy(async () => {
      await writeCacheWhenAllowed(write);
      await writeCacheWhenAllowed(write);
      expect(write).not.toHaveBeenCalled();
      return new Response('Not Found', { status: 404 });
    });
    expect(response.status).toBe(404);
    expect(write).not.toHaveBeenCalled();
  });

  it('最终 200：响应确定后正常提交', async () => {
    const write = vi.fn(async () => {});
    await runWithCacheWritePolicy(async () => {
      await writeCacheWhenAllowed(write);
      expect(write).not.toHaveBeenCalled();
      return new Response('OK');
    });
    expect(write).toHaveBeenCalledOnce();
  });

  it('延后提交仍保留 OpenNext 内层的异步上下文与 Cloudflare 绑定', async () => {
    const bindings = new AsyncLocalStorage<string>();
    const write = vi.fn(async () => {
      expect(bindings.getStore()).toBe('original-bindings');
    });
    await runWithCacheWritePolicy(() =>
      bindings.run('original-bindings', async () => {
        await writeCacheWhenAllowed(write);
        return new Response('OK');
      }),
    );
    expect(write).toHaveBeenCalledOnce();
  });

  it('并发 200 和 404 的写入互不影响', async () => {
    const badWrite = vi.fn(async () => {});
    const goodWrite = vi.fn(async () => {});
    const rendered = Promise.withResolvers<void>();
    await Promise.all([
      runWithCacheWritePolicy(async () => {
        await writeCacheWhenAllowed(badWrite);
        await rendered.promise;
        return new Response('Not Found', { status: 404 });
      }),
      runWithCacheWritePolicy(async () => {
        await writeCacheWhenAllowed(goodWrite);
        rendered.resolve();
        return new Response('OK');
      }),
    ]);
    expect(badWrite).not.toHaveBeenCalled();
    expect(goodWrite).toHaveBeenCalledOnce();
  });

  it('404 响应后才完成的后台写入也被丢弃', async () => {
    const write = vi.fn(async () => {});
    const release = Promise.withResolvers<void>();
    let pending: Promise<void> | undefined;
    await runWithCacheWritePolicy(async () => {
      pending = release.promise.then(() => writeCacheWhenAllowed(write));
      return new Response('Not Found', { status: 404 });
    });
    release.resolve();
    await pending;
    expect(write).not.toHaveBeenCalled();
  });

  it('渲染抛错：不提交计划写入', async () => {
    const write = vi.fn(async () => {});
    await expect(
      runWithCacheWritePolicy(async () => {
        await writeCacheWhenAllowed(write);
        throw new Error('render failed');
      }),
    ).rejects.toThrow('render failed');
    expect(write).not.toHaveBeenCalled();
  });

  it('缓存写入失败不把已生成的页面变成 500', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await runWithCacheWritePolicy(async () => {
      await writeCacheWhenAllowed(async () => {
        throw new Error('R2 unavailable');
      });
      return new Response('OK');
    });
    expect(response.status).toBe(200);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
