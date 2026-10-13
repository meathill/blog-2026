import type { ParserOptions } from 'prosemirror-highlight';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface ShikiLanguageModule {
  default: { name: string; aliases?: string[] }[];
}

interface ShikiThemeModule {
  default: { name: string; colors?: Record<string, string> };
}

const mocks = vi.hoisted(() => {
  const loadedLanguages = new Set<string>();
  const codeToTokens = vi.fn(() => ({
    tokens: [[{ content: 'const', color: '#C678DD' }]],
    fg: '#abb2bf',
    bg: '#282c34',
  }));
  const loadLanguage = vi.fn(async (languageModule: Promise<ShikiLanguageModule>) => {
    for (const language of (await languageModule).default) {
      loadedLanguages.add(language.name);
    }
  });
  const getLoadedLanguages = vi.fn(() => [...loadedLanguages]);
  const createHighlighterCore = vi.fn(async (options: { themes: Promise<ShikiThemeModule>[]; engine?: unknown }) => ({
    codeToTokens,
    loadLanguage,
    getLoadedLanguages,
  }));
  const createJavaScriptRegexEngine = vi.fn(() => ({ name: 'javascript-regex' }));

  return {
    loadedLanguages,
    codeToTokens,
    loadLanguage,
    getLoadedLanguages,
    createHighlighterCore,
    createJavaScriptRegexEngine,
  };
});

// 只替换 shiki 的入口，解析器仍用真的 prosemirror-highlight —— 这样能顺带校验我们传参是否正确
vi.mock('shiki/core', () => ({ createHighlighterCore: mocks.createHighlighterCore }));
vi.mock('shiki/engine/javascript', () => ({ createJavaScriptRegexEngine: mocks.createJavaScriptRegexEngine }));

const SUPPORTED_LANGUAGES = {
  text: { name: '纯文本', aliases: ['plaintext', 'txt'] },
  javascript: { name: 'JavaScript', aliases: ['js', 'jsx'] },
  bash: { name: 'Bash', aliases: ['sh', 'shell', 'zsh'] },
  mermaid: { name: 'Mermaid', aliases: ['mmd'] },
};

const CODE_BLOCK_OPTIONS = { defaultLanguage: 'text', supportedLanguages: SUPPORTED_LANGUAGES };
const CODE = 'const answer = 42;';
const POS = 10;

function makeParserOptions(overrides: Partial<ParserOptions> = {}): ParserOptions {
  return { content: CODE, language: 'javascript', pos: POS, size: CODE.length + 2, ...overrides };
}

async function loadHighlightModule() {
  return import('@/lib/blog-code-block-highlight');
}

async function createParser() {
  const { createBlogCodeHighlightParser } = await loadHighlightModule();

  return createBlogCodeHighlightParser(CODE_BLOCK_OPTIONS);
}

/** 取出第 n 次 loadLanguage 拿到的语言包，返回其中注册的语言名。 */
async function loadedLanguageNames(callIndex = 0): Promise<string[]> {
  const [languageModule] = mocks.loadLanguage.mock.calls[callIndex];

  return (await languageModule).default.map((language) => language.name);
}

describe('blog-code-block-highlight', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.loadedLanguages.clear();
    mocks.createHighlighterCore.mockClear();
    mocks.createJavaScriptRegexEngine.mockClear();
    mocks.codeToTokens.mockClear();
    mocks.loadLanguage.mockClear();
    mocks.getLoadedLanguages.mockClear();
  });

  it.each(['text', 'plaintext', 'mermaid', 'mmd', 'php', ''])(
    '语言 %s 不产出装饰，也不会去加载 shiki',
    async (language) => {
      const parser = await createParser();

      expect(parser(makeParserOptions({ language }))).toEqual([]);
      expect(mocks.createHighlighterCore).not.toHaveBeenCalled();
      expect(mocks.loadLanguage).not.toHaveBeenCalled();
    },
  );

  it('别名归一后加载对应的 shiki 语法包（js → javascript）', async () => {
    const parser = await createParser();

    await parser(makeParserOptions({ language: 'js' }));

    expect(mocks.loadLanguage).toHaveBeenCalledOnce();
    await expect(loadedLanguageNames()).resolves.toEqual(['javascript']);
  });

  it('bash 映射到 shiki 的 shellscript 语法包', async () => {
    const parser = await createParser();

    await parser(makeParserOptions({ language: 'bash' }));

    await expect(loadedLanguageNames()).resolves.toEqual(['shellscript']);
  });

  it('shiki 用细粒度 core + JS 正则引擎 + one-dark-pro 主题创建，且只创建一次', async () => {
    const parser = await createParser();

    await parser(makeParserOptions());
    await parser(makeParserOptions({ language: 'bash' }));

    expect(mocks.createHighlighterCore).toHaveBeenCalledOnce();
    expect(mocks.createJavaScriptRegexEngine).toHaveBeenCalledWith({ forgiving: true });

    const [highlighterOptions] = mocks.createHighlighterCore.mock.calls[0];
    const theme = (await highlighterOptions.themes[0]).default;
    expect(theme.name).toBe('one-dark-pro');
    // 主题背景色就是发布页代码块的底色，编辑器才能和线上观感一致
    expect(theme.colors?.['editor.background']).toBe('#282c34');
  });

  it('同一轮里的多个同语言代码块只加载一次语言包', async () => {
    const parser = await createParser();

    await Promise.all([parser(makeParserOptions()), parser(makeParserOptions({ pos: 100 }))]);

    expect(mocks.loadLanguage).toHaveBeenCalledOnce();
  });

  it('语言加载完后产出节点装饰和 token 装饰，并把语言与主题传给 shiki', async () => {
    const parser = await createParser();

    // 第一次调用只负责加载，返回 Promise 让 prosemirror-highlight 稍后重算
    expect(await parser(makeParserOptions())).toBeUndefined();

    // Decoration 的 from/to/inline 是公开字段，attrs 挂在 type 上（prosemirror-view @internal）
    const decorations = parser(makeParserOptions()) as unknown as {
      from: number;
      to: number;
      inline: boolean;
      type: { attrs: Record<string, string> };
    }[];

    expect(mocks.codeToTokens).toHaveBeenCalledWith(CODE, { lang: 'javascript', theme: 'one-dark-pro' });
    expect(decorations.map(({ from, to, inline, type }) => ({ from, to, inline, attrs: type.attrs }))).toEqual([
      {
        // 整块的节点装饰：样式变量供主题取色，边界是代码块自身
        from: POS,
        to: POS + CODE.length + 2,
        inline: false,
        attrs: { style: '--prosemirror-highlight:#abb2bf;--prosemirror-highlight-bg:#282c34' },
      },
      {
        // 'const' 共 5 个字符，从代码块内容的第一个位置开始
        from: POS + 1,
        to: POS + 6,
        inline: true,
        attrs: { class: 'shiki', style: 'color: #C678DD' },
      },
    ]);
  });

  it('语言包加载失败后清掉缓存，下次渲染会重新加载', async () => {
    const parser = await createParser();
    mocks.loadLanguage.mockRejectedValueOnce(new Error('chunk 加载失败'));

    await expect(parser(makeParserOptions())).rejects.toThrow('chunk 加载失败');
    await parser(makeParserOptions());

    expect(mocks.loadLanguage).toHaveBeenCalledTimes(2);
  });

  it('createBlogCodeHighlightPlugin 产出带 decorations 的高亮插件', async () => {
    const { createBlogCodeHighlightPlugin } = await loadHighlightModule();
    const plugin = createBlogCodeHighlightPlugin(CODE_BLOCK_OPTIONS);

    expect(typeof plugin.spec.props?.decorations).toBe('function');
    expect(plugin.spec.state?.apply).toBeTypeOf('function');
  });
});
