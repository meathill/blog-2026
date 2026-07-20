import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeMock = vi.fn();
const renderMock = vi.fn();

vi.mock('mermaid', () => ({
  default: { initialize: initializeMock, render: renderMock },
}));

// 每个测试都重置模块缓存再动态 import，隔离 mermaid-render.ts 内部的模块级缓存（mermaidPromise），
// 避免测试之间因为共用同一份缓存而互相影响执行顺序。
async function freshRenderMermaid() {
  vi.resetModules();
  const mod = await import('@/lib/mermaid-render');
  return mod.renderMermaid;
}

describe('mermaid-render', () => {
  beforeEach(() => {
    initializeMock.mockClear();
    renderMock.mockClear();
  });

  it('成功渲染时返回 svg，并用给定的 id/source 调用 mermaid.render', async () => {
    const renderMermaid = await freshRenderMermaid();
    renderMock.mockResolvedValueOnce({ svg: '<svg>ok</svg>' });

    const result = await renderMermaid('id-1', 'flowchart TD\nA-->B');

    expect(result).toEqual({ svg: '<svg>ok</svg>' });
    expect(renderMock).toHaveBeenCalledWith('id-1', 'flowchart TD\nA-->B');
  });

  it('mermaid.render 抛出 Error 时返回错误文案，不向外抛异常', async () => {
    const renderMermaid = await freshRenderMermaid();
    renderMock.mockRejectedValueOnce(new Error('Parse error on line 1'));

    const result = await renderMermaid('id-2', 'not valid mermaid');

    expect(result).toEqual({ error: 'Parse error on line 1' });
  });

  it('抛出非 Error 值时也能转成字符串', async () => {
    const renderMermaid = await freshRenderMermaid();
    renderMock.mockRejectedValueOnce('boom');

    const result = await renderMermaid('id-3', 'x');

    expect(result).toEqual({ error: 'boom' });
  });

  it('多次调用只 initialize 一次，且使用 dark/strict 配置', async () => {
    const renderMermaid = await freshRenderMermaid();
    renderMock.mockResolvedValue({ svg: '<svg></svg>' });

    await renderMermaid('id-4', 'a');
    await renderMermaid('id-5', 'b');

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(initializeMock).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
    });
  });
});
