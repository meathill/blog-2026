'use client';

import { useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/atom-one-dark.css';
import supportedLanguages from '@/config/highlight-languages.json';

/**
 * highlight.js 语言模块的动态导入映射
 */
const LANGUAGE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  xml: () => import('highlight.js/lib/languages/xml'),
  css: () => import('highlight.js/lib/languages/css'),
  json: () => import('highlight.js/lib/languages/json'),
  bash: () => import('highlight.js/lib/languages/bash'),
  python: () => import('highlight.js/lib/languages/python'),
  php: () => import('highlight.js/lib/languages/php'),
  java: () => import('highlight.js/lib/languages/java'),
  sql: () => import('highlight.js/lib/languages/sql'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  diff: () => import('highlight.js/lib/languages/diff'),
  scss: () => import('highlight.js/lib/languages/scss'),
  less: () => import('highlight.js/lib/languages/less'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  swift: () => import('highlight.js/lib/languages/swift'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
  nginx: () => import('highlight.js/lib/languages/nginx'),
  ini: () => import('highlight.js/lib/languages/ini'),
  plaintext: () => import('highlight.js/lib/languages/plaintext'),
};

/**
 * 语言别名映射
 */
const ALIASES: Record<string, string[]> = {
  javascript: ['js'],
  typescript: ['ts'],
  xml: ['html', 'htm', 'svg'],
  bash: ['sh', 'shell', 'zsh'],
};

/**
 * 收集页面中代码块使用的语言，通过 beacon 上报。
 */
function reportLanguages() {
  const codeBlocks = document.querySelectorAll('pre code');
  const languages = new Set<string>();

  for (const block of codeBlocks) {
    for (const cls of block.classList) {
      if (cls.startsWith('language-') || cls.startsWith('hljs-')) {
        const lang = cls.replace('language-', '').replace('hljs-', '');
        if (lang && lang !== 'hljs') {
          languages.add(lang);
        }
      }
    }
  }

  if (languages.size === 0) return;

  const payload = JSON.stringify({
    type: 'highlight-languages',
    data: {
      languages: [...languages],
      path: location.pathname,
    },
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/perf', payload);
  }
}

export default function CodeHighlight() {
  useEffect(() => {
    async function loadAndHighlight() {
      // 只加载构建时确定的语言
      const loadPromises = (supportedLanguages as string[])
        .filter((lang) => lang in LANGUAGE_LOADERS)
        .map(async (lang) => {
          const mod = await LANGUAGE_LOADERS[lang]();
          hljs.registerLanguage(lang, mod.default as Parameters<typeof hljs.registerLanguage>[1]);
          const aliases = ALIASES[lang];
          if (aliases) {
            for (const alias of aliases) {
              hljs.registerLanguage(alias, mod.default as Parameters<typeof hljs.registerLanguage>[1]);
            }
          }
        });

      await Promise.all(loadPromises);
      hljs.highlightAll();

      // 上报实际使用的语言（供下次构建优化）
      const idle = globalThis.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 100));
      idle(() => reportLanguages());
    }

    loadAndHighlight();
  }, []);

  return null;
}
