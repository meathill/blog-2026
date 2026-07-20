import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderMermaidMock = vi.fn();

vi.mock('@/lib/mermaid-render', () => ({
  renderMermaid: renderMermaidMock,
}));

const { default: MermaidRenderer } = await import('@/components/posts/mermaid-renderer');

async function flushMicrotasks(times = 8) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

async function mountAndRun() {
  render(<MermaidRenderer />);
  await act(async () => {
    vi.advanceTimersByTime(200);
    await flushMicrotasks();
  });
}

describe('MermaidRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    renderMermaidMock.mockReset();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('把 mermaid 代码块替换成渲染出的 SVG 容器', async () => {
    document.body.innerHTML = '<pre><code class="language-mermaid">flowchart TD\nA-->B</code></pre>';
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>diagram</svg>' });

    await mountAndRun();

    expect(document.querySelector('pre code.language-mermaid')).toBeNull();
    const container = document.querySelector('.mermaid-diagram');
    expect(container?.innerHTML).toBe('<svg>diagram</svg>');
    expect(renderMermaidMock).toHaveBeenCalledWith('mermaid-diagram-1', 'flowchart TD\nA-->B');
  });

  it('保留原 <pre> 的 data-filename，搬到替换后的容器上', async () => {
    document.body.innerHTML =
      '<pre data-filename="diagram.mmd"><code class="language-mermaid">flowchart TD\nA-->B</code></pre>';
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>diagram</svg>' });

    await mountAndRun();

    const container = document.querySelector('.mermaid-diagram') as HTMLElement;
    expect(container.dataset.filename).toBe('diagram.mmd');
  });

  it('不影响非 mermaid 的代码块', async () => {
    document.body.innerHTML = '<pre><code class="language-javascript">const x = 1;</code></pre>';

    await mountAndRun();

    expect(renderMermaidMock).not.toHaveBeenCalled();
    expect(document.querySelector('pre code.language-javascript')).not.toBeNull();
  });

  it('单块渲染失败时保留原始代码块，不影响其它块', async () => {
    document.body.innerHTML = [
      '<pre><code class="language-mermaid">broken !!!</code></pre>',
      '<pre><code class="language-mermaid">flowchart TD\nA-->B</code></pre>',
    ].join('');
    renderMermaidMock.mockResolvedValueOnce({ error: 'Parse error' });
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>ok</svg>' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await mountAndRun();

    expect(document.querySelectorAll('pre code.language-mermaid')).toHaveLength(1);
    expect(document.querySelectorAll('.mermaid-diagram')).toHaveLength(1);
    expect(document.querySelector('.mermaid-diagram')?.innerHTML).toBe('<svg>ok</svg>');
    errorSpy.mockRestore();
  });

  it('多个 mermaid 代码块依次渲染，使用各自独立的 id', async () => {
    document.body.innerHTML = [
      '<pre><code class="language-mermaid">flowchart TD\nA-->B</code></pre>',
      '<pre><code class="language-mermaid">flowchart TD\nC-->D</code></pre>',
    ].join('');
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>first</svg>' });
    renderMermaidMock.mockResolvedValueOnce({ svg: '<svg>second</svg>' });

    await mountAndRun();

    expect(renderMermaidMock).toHaveBeenNthCalledWith(1, 'mermaid-diagram-1', 'flowchart TD\nA-->B');
    expect(renderMermaidMock).toHaveBeenNthCalledWith(2, 'mermaid-diagram-2', 'flowchart TD\nC-->D');
    const containers = document.querySelectorAll('.mermaid-diagram');
    expect(containers).toHaveLength(2);
    expect(containers[0].innerHTML).toBe('<svg>first</svg>');
    expect(containers[1].innerHTML).toBe('<svg>second</svg>');
  });

  it('页面里没有 mermaid 代码块时不调用 renderMermaid', async () => {
    document.body.innerHTML = '<p>没有代码块</p>';

    await mountAndRun();

    expect(renderMermaidMock).not.toHaveBeenCalled();
  });
});
