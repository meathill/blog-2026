'use client';

import { useEffect } from 'react';
import { renderMermaid } from '@/lib/mermaid-render';

/**
 * 依次（非并发）渲染页面里所有 mermaid 代码块，替换成实际的 SVG 图。
 * 依次渲染是为了让某一块渲染失败时（比如语法错误）不影响其它块，且每块的
 * 渲染结果按顺序落地，不用担心并发场景下互相覆盖。
 */
async function renderAllMermaidBlocks() {
  const codeBlocks = document.querySelectorAll<HTMLElement>('pre code.language-mermaid');
  if (codeBlocks.length === 0) {
    return;
  }

  let index = 0;
  for (const code of codeBlocks) {
    const pre = code.parentElement;
    const source = code.textContent ?? '';
    index += 1;

    if (!pre || !source.trim()) {
      continue;
    }

    const result = await renderMermaid(`mermaid-diagram-${index}`, source);
    if ('error' in result) {
      // 保留原始代码块，不影响页面其它内容/其它图
      console.error('[MermaidRenderer] 渲染失败，保留原始代码块：', result.error);
      continue;
    }

    const container = document.createElement('div');
    container.className = 'mermaid-diagram';
    container.innerHTML = result.svg;

    const filename = pre.dataset.filename;
    if (filename) {
      container.dataset.filename = filename;
    }

    pre.replaceWith(container);
  }
}

export default function MermaidRenderer() {
  useEffect(() => {
    function runRenderAll() {
      void renderAllMermaidBlocks();
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    if (typeof globalThis.requestIdleCallback === 'function') {
      idleCallbackId = globalThis.requestIdleCallback(runRenderAll, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(runRenderAll, 200);
    }

    return () => {
      if (idleCallbackId !== null && typeof globalThis.cancelIdleCallback === 'function') {
        globalThis.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return null;
}
