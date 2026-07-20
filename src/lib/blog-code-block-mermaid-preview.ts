import { renderMermaid } from '@/lib/mermaid-render';

const DEBOUNCE_MS = 500;

export interface MermaidPreviewHandle {
  /** 激活/停用预览：语言切到/切出 mermaid 时调用。激活时会立即渲染一次当前内容。 */
  setActive(active: boolean): void;
  destroy(): void;
}

/**
 * 把 `previewEl` 变成 `codeEl`（code block 的 contentDOM）的实时 mermaid 预览。
 * 直接监听 contentEditable 的原生 `input` 事件，不依赖 BlockNote/ProseMirror 内部的
 * NodeView update 生命周期——更稳健，也不用去猜 BlockNote 内部契约。
 *
 * 失败时保留上一次成功渲染的图（不清空、不闪烁），只在图下方追加一行错误文案；
 * 用递增的 token 丢弃过期的异步渲染结果，避免防抖期间连续输入导致渲染乱序覆盖。
 */
export function attachMermaidPreview(
  previewEl: HTMLElement,
  codeEl: HTMLElement,
  blockId: string,
): MermaidPreviewHandle {
  let active = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let renderToken = 0;
  let lastGoodSvg: string | null = null;

  function clearTimer() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function showError(message: string) {
    const errorEl = document.createElement('p');
    errorEl.className = 'bn-mermaid-preview-error';
    errorEl.textContent = `Mermaid 语法错误：${message}`;

    if (lastGoodSvg) {
      previewEl.innerHTML = lastGoodSvg;
      previewEl.appendChild(errorEl);
    } else {
      previewEl.replaceChildren(errorEl);
    }
  }

  async function renderNow() {
    if (!active) return;

    const source = codeEl.textContent?.trim() ?? '';
    if (!source) {
      lastGoodSvg = null;
      previewEl.replaceChildren();
      return;
    }

    const token = ++renderToken;
    const result = await renderMermaid(`bn-mermaid-preview-${blockId}`, source);
    if (token !== renderToken || !active) {
      return;
    }

    if ('svg' in result) {
      lastGoodSvg = result.svg;
      previewEl.innerHTML = result.svg;
    } else {
      showError(result.error);
    }
  }

  function handleInput() {
    if (!active) return;
    clearTimer();
    timeoutId = setTimeout(() => void renderNow(), DEBOUNCE_MS);
  }

  codeEl.addEventListener('input', handleInput);
  previewEl.hidden = true;

  return {
    setActive(nextActive: boolean) {
      previewEl.hidden = !nextActive;
      if (active === nextActive) return;
      active = nextActive;

      if (active) {
        renderToken++;
        void renderNow();
      } else {
        clearTimer();
        lastGoodSvg = null;
        previewEl.replaceChildren();
      }
    },
    destroy() {
      clearTimer();
      codeEl.removeEventListener('input', handleInput);
    },
  };
}
