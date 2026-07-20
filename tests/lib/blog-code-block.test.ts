import { beforeEach, describe, expect, it, vi } from 'vitest';

const setActiveMock = vi.fn();
const destroyMock = vi.fn();

vi.mock('@/lib/blog-code-block-mermaid-preview', () => ({
  attachMermaidPreview: vi.fn(() => ({ setActive: setActiveMock, destroy: destroyMock })),
}));

const { createBlogCodeBlockExtensions, createBlogCodeBlockImplementation } = await import('@/lib/blog-code-block');
const { MERMAID_LANGUAGE_ID } = await import('@/config/code-block-languages');

const SUPPORTED_LANGUAGES = {
  text: { name: '纯文本', aliases: ['plaintext', 'txt'] },
  javascript: { name: 'JavaScript', aliases: ['js', 'jsx'] },
  [MERMAID_LANGUAGE_ID]: { name: 'Mermaid', aliases: ['mmd'] },
};

interface FakeBlock {
  id: string;
  props: { language: string; filename: string };
}

function fakeBlock(overrides: Partial<FakeBlock['props']> = {}): FakeBlock {
  return { id: 'block-1', props: { language: 'text', filename: '', ...overrides } };
}

function fakeEditor(overrides: { isEditable?: boolean; updateBlock?: ReturnType<typeof vi.fn> } = {}) {
  return { isEditable: overrides.isEditable ?? true, updateBlock: overrides.updateBlock ?? vi.fn() };
}

// biome-ignore lint/suspicious/noExplicitAny: 测试里只需要 render/parse/toExternalHTML 实际读取的那几个字段，
// 不用去凑 BlockNote 官方 Block/Editor 类型的完整形状
type AnyImpl = any;

describe('blog-code-block', () => {
  const impl = createBlogCodeBlockImplementation({
    defaultLanguage: 'text',
    supportedLanguages: SUPPORTED_LANGUAGES,
  }) as AnyImpl;

  beforeEach(() => {
    setActiveMock.mockClear();
    destroyMock.mockClear();
  });

  describe('parse', () => {
    it('从 language-x class 和 data-filename 里解析出语言与文件名', () => {
      const pre = document.createElement('pre');
      pre.dataset.filename = 'next.config.js';
      const code = document.createElement('code');
      code.className = 'language-python';
      code.dataset.language = 'python';
      pre.appendChild(code);

      expect(impl.parse(pre)).toEqual({ language: 'python', filename: 'next.config.js' });
    });

    it('没有 data-filename 时回退到遗留的 title 属性', () => {
      const pre = document.createElement('pre');
      pre.setAttribute('title', 'legacy.php');
      const code = document.createElement('code');
      code.className = 'language-php';
      pre.appendChild(code);

      expect(impl.parse(pre)).toEqual({ language: 'php', filename: 'legacy.php' });
    });

    it('两者都没有时 filename 是 undefined', () => {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-text';
      pre.appendChild(code);

      expect(impl.parse(pre)).toEqual({ language: 'text', filename: undefined });
    });

    it('非 PRE 标签返回 undefined', () => {
      expect(impl.parse(document.createElement('div'))).toBeUndefined();
    });

    it('PRE 里不是单个 CODE 子节点时返回 undefined', () => {
      const pre = document.createElement('pre');
      pre.textContent = '纯文本，没有 code 子节点';
      expect(impl.parse(pre)).toBeUndefined();
    });
  });

  describe('toExternalHTML', () => {
    it('导出 language class + data-language，并写入 data-filename', () => {
      const block = fakeBlock({ language: 'python', filename: 'app.py' });
      const result = impl.toExternalHTML(block);

      expect(result.dom.outerHTML).toBe(
        '<pre data-filename="app.py"><code class="language-python" data-language="python"></code></pre>',
      );
      expect(result.contentDOM.tagName).toBe('CODE');
    });

    it('没有 filename 时不写 data-filename 属性', () => {
      const block = fakeBlock({ language: 'bash', filename: '' });
      const result = impl.toExternalHTML(block);

      expect(result.dom.outerHTML).toBe('<pre><code class="language-bash" data-language="bash"></code></pre>');
    });
  });

  describe('render', () => {
    it('语言 select 包含每个 supportedLanguages 选项，且当前值正确回填', () => {
      const block = fakeBlock({ language: 'javascript' });
      const { dom } = impl.render(block, fakeEditor());
      const select = (dom as DocumentFragment).querySelector('select') as HTMLSelectElement;

      expect(Array.from(select.options).map((o) => o.value)).toEqual(['text', 'javascript', MERMAID_LANGUAGE_ID]);
      expect(select.value).toBe('javascript');
    });

    it('文件名 input 回填 block.props.filename', () => {
      const block = fakeBlock({ filename: 'index.ts' });
      const { dom } = impl.render(block, fakeEditor());
      const input = (dom as DocumentFragment).querySelector('input.bn-code-block-filename') as HTMLInputElement;

      expect(input.value).toBe('index.ts');
    });

    it('切换语言的 select 触发 updateBlock 并同步 mermaid 预览的 active 状态', () => {
      const updateBlock = vi.fn();
      const block = fakeBlock({ language: 'text' });
      const { dom } = impl.render(block, fakeEditor({ updateBlock }));
      const select = (dom as DocumentFragment).querySelector('select') as HTMLSelectElement;

      select.value = MERMAID_LANGUAGE_ID;
      select.dispatchEvent(new Event('change'));

      expect(updateBlock).toHaveBeenCalledWith('block-1', { props: { language: MERMAID_LANGUAGE_ID } });
      expect(setActiveMock).toHaveBeenCalledWith(true);
    });

    it('初始语言就是 mermaid 时，挂载后立即激活预览', () => {
      const block = fakeBlock({ language: MERMAID_LANGUAGE_ID });
      impl.render(block, fakeEditor());

      expect(setActiveMock).toHaveBeenCalledWith(true);
    });

    it('修改文件名 input 触发 updateBlock', () => {
      const updateBlock = vi.fn();
      const block = fakeBlock();
      const { dom } = impl.render(block, fakeEditor({ updateBlock }));
      const input = (dom as DocumentFragment).querySelector('input.bn-code-block-filename') as HTMLInputElement;

      input.value = 'new-name.ts';
      input.dispatchEvent(new Event('change'));

      expect(updateBlock).toHaveBeenCalledWith('block-1', { props: { filename: 'new-name.ts' } });
    });

    it('editor 不可编辑时，select 和 input 都禁用', () => {
      const block = fakeBlock();
      const { dom } = impl.render(block, fakeEditor({ isEditable: false }));
      const select = (dom as DocumentFragment).querySelector('select') as HTMLSelectElement;
      const input = (dom as DocumentFragment).querySelector('input.bn-code-block-filename') as HTMLInputElement;

      expect(select.disabled).toBe(true);
      expect(input.disabled).toBe(true);
    });

    it('contentDOM 是 code 元素，destroy 会清理 mermaid 预览', () => {
      const block = fakeBlock();
      const { contentDOM, destroy } = impl.render(block, fakeEditor());

      expect((contentDOM as HTMLElement).tagName).toBe('CODE');
      destroy?.();
      expect(destroyMock).toHaveBeenCalledOnce();
    });
  });

  describe('createBlogCodeBlockExtensions', () => {
    // createExtension({key, ...}) 返回的是个工厂函数，调用它（不传 ctx 也行，这个分支不读 ctx）
    // 才能拿到真正的 { key, keyboardShortcuts, inputRules } 对象。
    const extensions = (createBlogCodeBlockExtensions({ supportedLanguages: SUPPORTED_LANGUAGES }) as AnyImpl[]).map(
      (factory) => factory(),
    );

    it('只挂了一个 extension（不复用空转的 shiki highlighter）', () => {
      expect(extensions).toHaveLength(1);
      expect(extensions[0].key).toBe('code-block-keyboard-shortcuts');
    });

    it('输入规则把 ```lang 转成对应语言的 codeBlock', () => {
      const inputRule = extensions[0].inputRules[0];
      const result = inputRule.replace({ match: ['```javascript ', 'javascript'] });

      expect(result).toEqual({ type: 'codeBlock', props: { language: 'javascript' }, content: [] });
    });

    it('输入规则支持别名解析（js -> javascript）', () => {
      const inputRule = extensions[0].inputRules[0];
      const result = inputRule.replace({ match: ['```js ', 'js'] });

      expect(result.props.language).toBe('javascript');
    });

    it('输入规则遇到未知语言名时原样保留', () => {
      const inputRule = extensions[0].inputRules[0];
      const result = inputRule.replace({ match: ['```made-up-lang ', 'made-up-lang'] });

      expect(result.props.language).toBe('made-up-lang');
    });
  });
});
