import { getLanguageId, type CodeBlockOptions } from '@blocknote/core';
import { createHighlightPlugin, type Parser } from 'prosemirror-highlight';
import { createParser } from 'prosemirror-highlight/shiki';
import type { HighlighterCore } from 'shiki/core';

/**
 * 编辑器内代码块的语法高亮。
 *
 * 上游 `@blocknote/core` 的 `lazyShikiPlugin` 没有公开导出（只内联在 dist 里），这里按它的加载
 * 协议实现一份：highlighter 和语言包都懒加载，parser 在加载期间返回 Promise，
 * prosemirror-highlight 会在 resolve 后重算 —— 所以代码块第一次渲染先不上色，第二次才出装饰。
 * 装饰是 `Decoration`，不改动文档内容，不影响编辑、撤销和复制。
 *
 * 高亮结果是 shiki 的内联样式（`class="shiki"` + `style`），不需要额外的主题 CSS。
 */

/** shiki 主题。one-dark-pro 的背景色就是发布页代码块的 #282c34，两边观感一致。 */
const SHIKI_THEME_NAME = 'one-dark-pro';

/**
 * 编辑器语言 id → shiki 语言包。id 早就和 highlight.js 对齐过（见 `@/config/code-block-languages`），
 * 只有 bash 在 shiki 里叫 shellscript（它的 aliases 含 bash/sh/zsh/shell）。
 * `text`、`mermaid` 和词表外的语言都不在这里：它们不高亮，按原样显示。
 */
const SHIKI_LANGUAGE_LOADERS = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  bash: () => import('@shikijs/langs/shellscript'),
  json: () => import('@shikijs/langs/json'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  xml: () => import('@shikijs/langs/xml'),
  python: () => import('@shikijs/langs/python'),
  sql: () => import('@shikijs/langs/sql'),
  yaml: () => import('@shikijs/langs/yaml'),
  markdown: () => import('@shikijs/langs/markdown'),
  diff: () => import('@shikijs/langs/diff'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  nginx: () => import('@shikijs/langs/nginx'),
};

type ShikiLanguageId = keyof typeof SHIKI_LANGUAGE_LOADERS;
/** `createParser` 声明的 highlighter 形状（`HighlighterGeneric<string, string>`）。 */
type ShikiParserHighlighter = Parameters<typeof createParser>[0];

/** 整个编辑器共用一个 shiki 实例，首次真的渲染出代码块时才加载。 */
let highlighterPromise: Promise<HighlighterCore> | null = null;
let highlighter: HighlighterCore | null = null;
/** 按语言缓存加载过程：同一轮渲染里的多个同语言代码块只 loadLanguage 一次。 */
const languageLoading = new Map<ShikiLanguageId, Promise<void>>();
let tokenParser: Parser | null = null;

/**
 * 细粒度加载 shiki：只用 core + JS 正则引擎，不引入 oniguruma 的 .wasm 资源；
 * 主题随 highlighter 一起加载，语言包由 parser 按需 import。
 */
async function loadShikiHighlighter(): Promise<HighlighterCore> {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ]);

  return createHighlighterCore({
    themes: [import('@shikijs/themes/one-dark-pro')],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
}

/** 把 block 的 language 归一成 shiki 语言 id；不支持（含 text/mermaid/词表外语言）时返回 undefined。 */
function resolveShikiLanguage(options: CodeBlockOptions, language: string): ShikiLanguageId | undefined {
  const canonical = getLanguageId(options, language) ?? language;

  return canonical in SHIKI_LANGUAGE_LOADERS ? (canonical as ShikiLanguageId) : undefined;
}

/** 返回 Promise 就是 prosemirror-highlight 约定的「还没加载好，等下重算」。 */
function loadLanguage(language: ShikiLanguageId): Promise<void> {
  let loading = languageLoading.get(language);

  if (!loading) {
    loading = (async () => {
      highlighterPromise ??= loadShikiHighlighter();
      highlighter ??= await highlighterPromise;
      await highlighter.loadLanguage(SHIKI_LANGUAGE_LOADERS[language]());
    })();
    languageLoading.set(language, loading);
    // 加载失败（比如 chunk 拉取失败）就清掉缓存，下次渲染还会再试
    void loading.catch(() => languageLoading.delete(language));
  }

  return loading;
}

/** 单独导出方便单测。 */
export function createBlogCodeHighlightParser(options: CodeBlockOptions): Parser {
  return (parserOptions) => {
    const language = resolveShikiLanguage(options, parserOptions.language ?? '');

    if (!language) {
      return [];
    }

    if (!highlighter?.getLoadedLanguages().includes(language)) {
      return loadLanguage(language);
    }

    // shiki 的 HighlighterCore 是 `HighlighterGeneric<never, never>`，比插件声明的
    // `HighlighterGeneric<string, string>` 更窄（loadTheme 只接受具体主题名），运行时没有差别
    tokenParser ??= createParser(highlighter as ShikiParserHighlighter, { theme: SHIKI_THEME_NAME });

    return tokenParser({ ...parserOptions, language });
  };
}

export function createBlogCodeHighlightPlugin(options: CodeBlockOptions) {
  return createHighlightPlugin({
    parser: createBlogCodeHighlightParser(options),
    languageExtractor: (node) => node.attrs.language,
    nodeTypes: ['codeBlock'],
  });
}
