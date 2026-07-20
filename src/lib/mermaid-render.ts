import type { Mermaid } from 'mermaid';

export interface MermaidRenderSuccess {
  svg: string;
}

export interface MermaidRenderError {
  error: string;
}

export type MermaidRenderResult = MermaidRenderSuccess | MermaidRenderError;

let mermaidPromise: Promise<Mermaid> | null = null;

/**
 * 惰性加载并初始化 mermaid，模块级缓存保证同一个页面/编辑器会话里只 import + initialize 一次。
 * 后台编辑器的实时预览和前端发布页的渲染共用这个入口，保证两边配置（主题、安全级别）一致。
 */
function getMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/** 渲染一段 mermaid 源码为 SVG 字符串。失败时（多为语法错误）返回错误文案而不抛异常。 */
export async function renderMermaid(id: string, source: string): Promise<MermaidRenderResult> {
  try {
    const mermaid = await getMermaid();
    const { svg } = await mermaid.render(id, source);
    return { svg };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
