import type { BlockImplementation, CodeBlockOptions } from '@blocknote/core';
import { createBlockConfig, createBlockSpec, createExtension, getLanguageId } from '@blocknote/core';
import { DOMParser } from '@tiptap/pm/model';
import { attachMermaidPreview } from '@/lib/blog-code-block-mermaid-preview';
import { createBlogCodeHighlightPlugin } from '@/lib/blog-code-block-highlight';
import { MERMAID_LANGUAGE_ID } from '@/config/code-block-languages';

/**
 * Fork 自 `@blocknote/core` 的 `src/blocks/Code/block.ts`（已核对 0.51.4 与 0.49.0 该文件逐字节相同）。
 * BlockNote 的 `createCodeBlockSpec()` 是写死的工厂函数，propSchema 只有 `language`，没有扩展点，
 * 加不了文件名字段，只能整份 fork。`createBlockConfig`/`createBlockSpec`/`createExtension`/
 * `getLanguageId` 均为 `@blocknote/core` 公开导出，不是内部私有 API。
 *
 * 与上游的差异：
 * - propSchema 加了 `filename`（配合语言 select 一起放在 toolbar 里）。
 * - `language === 'mermaid'` 时，toolbar 下方挂一个实时预览面板（见 `blog-code-block-mermaid-preview.ts`）。
 * - 语法高亮：上游的 `lazyShikiPlugin` 没有公开导出，换成 `@/lib/blog-code-block-highlight` 里
 *   自实现的同款插件（同样是 shiki + prosemirror-highlight，加载协议一致）。
 * - 语言 select 多包了一层 `div.bn-code-block-language`：BlockNote 自带
 *   `.bn-block-content[data-content-type=codeBlock]>div>select` 会把「直接子 div 的直接子 select」
 *   绝对定位到左上角并透明化（上游靠 hover 才显示语言），隔一层就避开了那条规则。
 */

export const createBlogCodeBlockConfig = createBlockConfig(
  ({ defaultLanguage = 'text' }: CodeBlockOptions) =>
    ({
      type: 'codeBlock' as const,
      propSchema: {
        language: { default: defaultLanguage },
        filename: { default: '' },
      },
      content: 'inline',
    }) as const,
);

export type BlogCodeBlockConfig = ReturnType<typeof createBlogCodeBlockConfig>;

/** 单独导出方便单测直接调用，不用去模拟 BlockNote 内部 `wrapInBlockStructure` 的包裹逻辑。 */
export const createBlogCodeBlockImplementation = (
  options: CodeBlockOptions,
): BlockImplementation<
  BlogCodeBlockConfig['type'],
  BlogCodeBlockConfig['propSchema'],
  BlogCodeBlockConfig['content']
> => ({
  meta: {
    code: true,
    defining: true,
    isolating: false,
  },
  parse: (e) => {
    if (e.tagName !== 'PRE') {
      return undefined;
    }

    if (e.childElementCount !== 1 || e.firstElementChild?.tagName !== 'CODE') {
      return undefined;
    }

    const code = e.firstElementChild!;
    const language =
      code.getAttribute('data-language') ||
      code.className
        .split(' ')
        .find((name) => name.includes('language-'))
        ?.replace('language-', '');
    // `data-filename` 是新格式；`title` 是遗留 WordPress 原生 `.wp-block-code[title]` 的属性名，
    // 只有「直接把外部 HTML 粘贴进编辑器」这条窄路径会走到这里，兼容一下成本很低。
    const filename = e.getAttribute('data-filename') || e.getAttribute('title') || undefined;

    return { language, filename };
  },

  parseContent: ({ el, schema }) => {
    const parser = DOMParser.fromSchema(schema);
    const code = el.firstElementChild!;

    return parser.parse(code, {
      preserveWhitespace: 'full',
      topNode: schema.nodes['codeBlock'].create(),
    }).content;
  },

  render(block, editor) {
    const wrapper = document.createDocumentFragment();
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    pre.appendChild(code);

    const toolbar = document.createElement('div');
    toolbar.contentEditable = 'false';
    toolbar.className = 'bn-code-block-toolbar';

    let select: HTMLSelectElement | undefined;
    let removeSelectChangeListener: (() => void) | undefined;

    const previewEl = document.createElement('div');
    previewEl.contentEditable = 'false';
    previewEl.className = 'bn-code-block-mermaid-preview';
    const mermaidPreview = attachMermaidPreview(previewEl, code, block.id);
    const syncMermaidPreview = (language: string) => mermaidPreview.setActive(language === MERMAID_LANGUAGE_ID);

    if (options.supportedLanguages) {
      const supportedLanguages = options.supportedLanguages;
      select = document.createElement('select');
      select.setAttribute('aria-label', '代码语言');

      Object.entries(supportedLanguages).forEach(([id, { name }]) => {
        const option = document.createElement('option');
        option.value = id;
        option.text = name;
        select!.appendChild(option);
      });

      const currentLanguage = block.props.language || options.defaultLanguage || 'text';
      // 历史内容（WordPress 导入、MCP 草稿）可能带着词表外的语言，补一个同名选项，避免下拉错位
      if (!(currentLanguage in supportedLanguages)) {
        const option = document.createElement('option');
        option.value = currentLanguage;
        option.text = currentLanguage;
        select.appendChild(option);
      }
      select.value = currentLanguage;

      if (editor.isEditable) {
        const handleLanguageChange = (event: Event) => {
          const language = (event.target as HTMLSelectElement).value;
          editor.updateBlock(block.id, { props: { language } });
          syncMermaidPreview(language);
        };
        select.addEventListener('change', handleLanguageChange);
        removeSelectChangeListener = () => select!.removeEventListener('change', handleLanguageChange);
      } else {
        select.disabled = true;
      }

      const languageWrapper = document.createElement('div');
      languageWrapper.className = 'bn-code-block-language';
      languageWrapper.appendChild(select);
      toolbar.appendChild(languageWrapper);
    }

    const filenameInput = document.createElement('input');
    filenameInput.type = 'text';
    filenameInput.className = 'bn-code-block-filename';
    filenameInput.placeholder = '文件名（可选），如 next.config.js';
    filenameInput.value = block.props.filename ?? '';

    let removeFilenameChangeListener: (() => void) | undefined;
    if (editor.isEditable) {
      const handleFilenameChange = () => {
        editor.updateBlock(block.id, { props: { filename: filenameInput.value } });
      };
      filenameInput.addEventListener('change', handleFilenameChange);
      removeFilenameChangeListener = () => filenameInput.removeEventListener('change', handleFilenameChange);
    } else {
      filenameInput.disabled = true;
    }
    toolbar.appendChild(filenameInput);

    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
    wrapper.appendChild(previewEl);
    syncMermaidPreview(block.props.language);

    return {
      dom: wrapper,
      contentDOM: code,
      destroy: () => {
        removeSelectChangeListener?.();
        removeFilenameChangeListener?.();
        mermaidPreview.destroy();
      },
    };
  },
  toExternalHTML(block) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = `language-${block.props.language}`;
    code.dataset.language = block.props.language;
    if (block.props.filename) {
      pre.dataset.filename = block.props.filename;
    }
    pre.appendChild(code);
    return {
      dom: pre,
      contentDOM: code,
    };
  },
});

/** 单独导出方便单测浅层断言「确实挂上了几个 extension / key 对不对」。 */
export const createBlogCodeBlockExtensions = (options: CodeBlockOptions) => {
  return [
    // 与上游 key 同名同位置，只是换成了自己实现的 shiki 插件
    createExtension({
      key: 'code-block-highlighter',
      prosemirrorPlugins: [createBlogCodeHighlightPlugin(options)],
    }),
    createExtension({
      key: 'code-block-keyboard-shortcuts',
      keyboardShortcuts: {
        Delete: ({ editor }) => {
          return editor.transact((tr) => {
            const { block } = editor.getTextCursorPosition();
            if (block.type !== 'codeBlock') {
              return false;
            }
            const { $from } = tr.selection;

            // When inside empty codeblock, on `DELETE` key press, delete the codeblock
            if (!$from.parent.textContent) {
              editor.removeBlocks([block]);
              return true;
            }

            return false;
          });
        },
        Tab: ({ editor }) => {
          if (options.indentLineWithTab === false) {
            return false;
          }

          return editor.transact((tr) => {
            const { block } = editor.getTextCursorPosition();
            if (block.type === 'codeBlock') {
              tr.insertText('  ');
              return true;
            }

            return false;
          });
        },
        Enter: ({ editor }) => {
          return editor.transact((tr) => {
            const { block, nextBlock } = editor.getTextCursorPosition();
            if (block.type !== 'codeBlock') {
              return false;
            }
            const { $from } = tr.selection;

            const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
            const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n');

            // The user is trying to exit the code block by pressing enter at the end of the code block
            if (isAtEnd && endsWithDoubleNewline) {
              tr.delete($from.pos - 2, $from.pos);

              if (nextBlock) {
                editor.setTextCursorPosition(nextBlock, 'start');
                return true;
              }

              const [newBlock] = editor.insertBlocks([{ type: 'paragraph' }], block, 'after');
              editor.setTextCursorPosition(newBlock, 'start');
              return true;
            }

            tr.insertText('\n');
            return true;
          });
        },
        'Shift-Enter': ({ editor }) => {
          return editor.transact(() => {
            const { block } = editor.getTextCursorPosition();
            if (block.type !== 'codeBlock') {
              return false;
            }

            const [newBlock] = editor.insertBlocks([{ type: 'paragraph' }], block, 'after');
            editor.setTextCursorPosition(newBlock, 'start');
            return true;
          });
        },
      },
      inputRules: [
        {
          find: /^```(.*?)\s$/,
          replace: ({ match }) => {
            const languageName = match[1].trim();
            const language = getLanguageId(options, languageName) ?? languageName;

            return {
              type: 'codeBlock',
              props: { language },
              content: [],
            };
          },
        },
      ],
    }),
  ];
};

export const createBlogCodeBlockSpec = createBlockSpec(
  createBlogCodeBlockConfig,
  createBlogCodeBlockImplementation,
  createBlogCodeBlockExtensions,
);
