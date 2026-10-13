import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * shiki 只服务后台编辑器（代码块语法高亮），不能进公开页面的 bundle。
 * 公开文章页的代码高亮仍然是 highlight.js（`src/components/CodeHighlight.tsx`），两套引擎互不干扰。
 *
 * 这里用静态 import 图守住边界：只要有人（比如将来给阅读页顺手加语法高亮）引入 shiki，
 * 或者绕开 fork 直接在高亮模块之外引入它，这个测试就会失败。
 * 构建产物层面的证据见 DEV_NOTE「编辑器内语法高亮走 shiki」。
 */

const SOURCE_ROOT = resolve(__dirname, '../../src');
const HIGHLIGHT_MODULE = 'lib/blog-code-block-highlight.ts';
const FORK_MODULE = 'lib/blog-code-block.ts';

/** `import x from 'y'` / `import 'y'` / `import type … from 'y'` / `export … from 'y'` / `import('y')`。 */
const SPECIFIER_PATTERNS = [
  /(?:^|\n)\s*import\s+[^'"]*from\s*['"]([^'"]+)['"]/g,
  /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g,
  /(?:^|\n)\s*export\s+[^'"]*from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return /\.tsx?$/.test(entry) ? [fullPath] : [];
  });
}

function extractModuleSpecifiers(code: string): string[] {
  return SPECIFIER_PATTERNS.flatMap((pattern) => Array.from(code.matchAll(pattern), (match) => match[1]));
}

const sourceFiles = collectSourceFiles(SOURCE_ROOT).map((file) => ({
  path: relative(SOURCE_ROOT, file),
  specifiers: extractModuleSpecifiers(readFileSync(file, 'utf-8')),
}));

/** 找出引用了某个模块（精确匹配或以其为前缀的子路径）的文件。 */
function findImporters(moduleName: string): string[] {
  return sourceFiles
    .filter(({ specifiers }) =>
      specifiers.some((specifier) => specifier === moduleName || specifier.startsWith(`${moduleName}/`)),
    )
    .map(({ path }) => path)
    .sort();
}

function findShikiImporters(): string[] {
  return sourceFiles
    .filter(({ specifiers }) =>
      specifiers.some(
        (specifier) => specifier === 'shiki' || specifier.startsWith('shiki/') || specifier.startsWith('@shikijs/'),
      ),
    )
    .map(({ path }) => path)
    .sort();
}

describe('编辑器 shiki 边界守卫', () => {
  it('src 下只有高亮模块可以引入 shiki（admin 之外、乃至编辑器其它文件都不行）', () => {
    expect(findShikiImporters()).toEqual([HIGHLIGHT_MODULE]);
  });

  it('高亮模块只被 codeBlock fork 引入（唯一入口）', () => {
    expect(findImporters('@/lib/blog-code-block-highlight')).toEqual([FORK_MODULE]);
  });

  it('codeBlock fork 只出现在 admin 侧，公开页面不会因此带上 shiki', () => {
    const importers = findImporters('@/lib/blog-code-block');

    expect(importers.length).toBeGreaterThan(0);
    expect(importers.filter((file) => !file.startsWith('components/admin/') && !file.startsWith('lib/'))).toEqual([]);
  });

  it('公开阅读页的高亮仍然是 highlight.js（shiki 不参与内容渲染）', () => {
    const importers = findImporters('@/lib/blog-code-block-highlight');

    expect(importers).not.toContain('components/CodeHighlight.tsx');
    expect(sourceFiles.find(({ path }) => path === 'components/CodeHighlight.tsx')?.specifiers).toContain(
      'highlight.js/styles/atom-one-dark.css',
    );
  });
});
