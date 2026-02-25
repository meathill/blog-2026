'use client';

import { useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import php from 'highlight.js/lib/languages/php';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('php', php);

/**
 * 收集页面中代码块使用的语言，通过 beacon 上报。
 */
function reportLanguages() {
  const codeBlocks = document.querySelectorAll('pre code');
  const languages = new Set<string>();

  for (const block of codeBlocks) {
    // hljs 高亮后会添加 language-xxx 类名
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
    hljs.highlightAll();

    // 高亮完成后上报语言使用情况（Safari 不支持 requestIdleCallback）
    const idle = globalThis.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 100));
    idle(() => reportLanguages());
  }, []);

  return null;
}
