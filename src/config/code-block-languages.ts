import type { CodeBlockOptions } from '@blocknote/core';

/** 代码块默认语言，沿用 BlockNote 自身的硬编码默认值，避免历史内容在下拉里错位。 */
export const DEFAULT_CODE_BLOCK_LANGUAGE = 'text';

/** Mermaid 图表使用的语言 id，前后端统一用这个常量判断，避免魔法字符串散落各处。 */
export const MERMAID_LANGUAGE_ID = 'mermaid';

/**
 * 代码块语言下拉词表。id 直接对齐 highlight.js 自己的语言名（`src/config/highlight-languages.json`
 * 和 `src/components/CodeHighlight.tsx` 的 `LANGUAGE_LOADERS`/`ALIASES`），避免编辑器和前端高亮之间
 * 出现一层额外的翻译映射。`mermaid` 是唯一例外：不走 highlight.js，由 mermaid.js 单独渲染成图。
 */
export const CODE_BLOCK_SUPPORTED_LANGUAGES: NonNullable<CodeBlockOptions['supportedLanguages']> = {
  text: { name: '纯文本', aliases: ['plaintext', 'txt'] },
  javascript: { name: 'JavaScript', aliases: ['js', 'jsx'] },
  typescript: { name: 'TypeScript', aliases: ['ts', 'tsx'] },
  bash: { name: 'Bash', aliases: ['sh', 'shell', 'zsh'] },
  json: { name: 'JSON', aliases: [] },
  css: { name: 'CSS', aliases: [] },
  scss: { name: 'SCSS', aliases: [] },
  xml: { name: 'HTML', aliases: ['html', 'htm', 'svg'] },
  python: { name: 'Python', aliases: ['py'] },
  sql: { name: 'SQL', aliases: [] },
  yaml: { name: 'YAML', aliases: ['yml'] },
  markdown: { name: 'Markdown', aliases: ['md'] },
  diff: { name: 'Diff', aliases: ['patch'] },
  dockerfile: { name: 'Dockerfile', aliases: ['docker'] },
  nginx: { name: 'Nginx', aliases: [] },
  [MERMAID_LANGUAGE_ID]: { name: 'Mermaid', aliases: ['mmd'] },
};
