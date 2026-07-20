import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderMermaidMock = vi.fn();

vi.mock('@/lib/mermaid-render', () => ({
  renderMermaid: renderMermaidMock,
}));

const { attachMermaidPreview } = await import('@/lib/blog-code-block-mermaid-preview');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('attachMermaidPreview', () => {
  let previewEl: HTMLDivElement;
  let codeEl: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    renderMermaidMock.mockReset();
    previewEl = document.createElement('div');
    codeEl = document.createElement('code');
    codeEl.textContent = 'flowchart TD\nA-->B';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('创建时预览容器默认是 hidden 的', () => {
    attachMermaidPreview(previewEl, codeEl, 'block-1');
    expect(previewEl.hidden).toBe(true);
  });

  it('setActive(true) 取消 hidden 并立即渲染当前内容', async () => {
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>ok</svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');

    handle.setActive(true);
    await flushMicrotasks();

    expect(previewEl.hidden).toBe(false);
    expect(previewEl.innerHTML).toBe('<svg>ok</svg>');
    expect(renderMermaidMock).toHaveBeenCalledWith('bn-mermaid-preview-block-1', 'flowchart TD\nA-->B');
  });

  it('内容为空时不调用 renderMermaid，只清空预览', async () => {
    codeEl.textContent = '   ';
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');

    handle.setActive(true);
    await flushMicrotasks();

    expect(renderMermaidMock).not.toHaveBeenCalled();
    expect(previewEl.innerHTML).toBe('');
  });

  it('渲染失败且没有历史成功结果时，只显示错误文案', async () => {
    renderMermaidMock.mockResolvedValueOnce({ error: 'Parse error on line 1' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');

    handle.setActive(true);
    await flushMicrotasks();

    const errorEl = previewEl.querySelector('.bn-mermaid-preview-error');
    expect(errorEl?.textContent).toBe('Mermaid 语法错误：Parse error on line 1');
  });

  it('渲染失败但有历史成功结果时，保留旧图并在下方追加错误文案', async () => {
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>good</svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();

    renderMermaidMock.mockResolvedValueOnce({ error: 'boom' });
    codeEl.textContent = 'flowchart TD\nA-->B-->C';
    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(500);

    expect(previewEl.innerHTML).toContain('<svg>good</svg>');
    expect(previewEl.querySelector('.bn-mermaid-preview-error')?.textContent).toBe('Mermaid 语法错误：boom');
  });

  it('输入事件按 500ms 防抖，未到时间不触发渲染', async () => {
    renderMermaidMock.mockResolvedValue({ svg: '<svg></svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();
    renderMermaidMock.mockClear();

    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(499);
    expect(renderMermaidMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(renderMermaidMock).toHaveBeenCalledTimes(1);
  });

  it('连续多次输入会合并成一次渲染（防抖重置计时器）', async () => {
    renderMermaidMock.mockResolvedValue({ svg: '<svg></svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();
    renderMermaidMock.mockClear();

    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(300);
    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(300);
    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(500);

    expect(renderMermaidMock).toHaveBeenCalledTimes(1);
  });

  it('setActive(false) 后隐藏、清空内容，且不再响应输入', async () => {
    renderMermaidMock.mockResolvedValue({ svg: '<svg></svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();
    renderMermaidMock.mockClear();

    handle.setActive(false);

    expect(previewEl.hidden).toBe(true);
    expect(previewEl.innerHTML).toBe('');

    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(500);
    expect(renderMermaidMock).not.toHaveBeenCalled();
  });

  it('destroy() 之后不再响应输入事件', async () => {
    renderMermaidMock.mockResolvedValue({ svg: '<svg></svg>' });
    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();
    renderMermaidMock.mockClear();

    handle.destroy();

    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(500);
    expect(renderMermaidMock).not.toHaveBeenCalled();
  });

  it('旧的渲染结果晚到时不会覆盖更新的渲染结果（token 丢弃过期响应）', async () => {
    const slowFirstCall = deferred<{ svg: string }>();
    renderMermaidMock.mockReturnValueOnce(slowFirstCall.promise);

    const handle = attachMermaidPreview(previewEl, codeEl, 'block-1');
    handle.setActive(true);
    await flushMicrotasks();
    // 此时第一次渲染仍未 resolve（renderMermaidMock 还没返回结果）

    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>second</svg>' });
    codeEl.textContent = 'flowchart TD\nA-->B-->C';
    codeEl.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(500);
    await flushMicrotasks();

    expect(previewEl.innerHTML).toBe('<svg>second</svg>');

    // 第一次（更旧）的渲染结果才姗姗来迟，应该被丢弃，不能覆盖已经显示的新结果
    slowFirstCall.resolve({ svg: '<svg>stale-first</svg>' });
    await flushMicrotasks();

    expect(previewEl.innerHTML).toBe('<svg>second</svg>');
  });
});
