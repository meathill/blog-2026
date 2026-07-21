/**
 * Issue #5 — 分析 export-meta.php 导出的全站文章 meta，标出 title / description
 * 过短的文章（Bing Webmaster 反馈项），并生成 meta-manifest.json 待填骨架。
 *
 * 用法：node scripts/seo/analyze-meta.ts scripts/seo/backup/meta-20260721.json
 *
 * 「有效 description」复刻前端 buildPostDescription（src/lib/wordpress/posts.ts）：
 * excerpt ≥20 字符用 excerpt，否则用正文纯文本开头（截 160）。
 */
import { readFile } from 'node:fs/promises';

// 阈值常量，按需调整
const DESCRIPTION_MIN = 80;
const DESCRIPTION_MAX = 160;
const TITLE_MIN = 15;
const TITLE_MAX = 70;
const EXCERPT_MIN_USABLE = 20;

interface ExportedPostMeta {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  contentLength: number;
  contentHead: string;
  modified: string;
}

interface MetaIssue {
  post: ExportedPostMeta;
  problems: string[];
  effectiveDescription: string;
}

function buildEffectiveDescription(post: ExportedPostMeta): string {
  const excerpt = post.excerpt.trim();
  if (excerpt.length >= EXCERPT_MIN_USABLE) {
    return excerpt.slice(0, DESCRIPTION_MAX);
  }
  return post.contentHead.slice(0, DESCRIPTION_MAX);
}

function analyze(posts: ExportedPostMeta[]): MetaIssue[] {
  const issues: MetaIssue[] = [];
  for (const post of posts) {
    const problems: string[] = [];
    const effectiveDescription = buildEffectiveDescription(post);
    if (post.excerpt.trim().length < EXCERPT_MIN_USABLE) {
      problems.push('excerpt 为空/过短，description 被正文开头顶替');
    }
    if (effectiveDescription.length < DESCRIPTION_MIN) {
      problems.push(`description 过短（${effectiveDescription.length} < ${DESCRIPTION_MIN}）`);
    }
    if (post.title.length < TITLE_MIN) {
      problems.push(`title 过短（${post.title.length} < ${TITLE_MIN}）`);
    }
    if (post.title.length > TITLE_MAX) {
      problems.push(`title 过长（${post.title.length} > ${TITLE_MAX}）`);
    }
    if (problems.length > 0) {
      issues.push({ post, problems, effectiveDescription });
    }
  }
  return issues;
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.log('用法：node scripts/seo/analyze-meta.ts <export-meta 导出的 JSON>');
    process.exitCode = 1;
    return;
  }

  const posts: ExportedPostMeta[] = JSON.parse(await readFile(inputPath, 'utf8'));
  const issues = analyze(posts);

  console.log(`共 ${posts.length} 篇，其中 ${issues.length} 篇有问题：\n`);
  for (const { post, problems, effectiveDescription } of issues) {
    console.log(`## ${post.slug} (ID ${post.id})`);
    console.log(`- URL: /posts/${post.category}/${post.slug}`);
    console.log(`- title (${post.title.length}): ${post.title}`);
    console.log(`- 有效 description (${effectiveDescription.length}): ${effectiveDescription.slice(0, 100)}`);
    for (const problem of problems) {
      console.log(`- ⚠️ ${problem}`);
    }
    console.log('');
  }

  // 输出 meta-manifest.json 骨架（excerpt 留空待填），粘贴到 scripts/seo/meta-manifest.json
  const skeleton = Object.fromEntries(issues.map(({ post }) => [post.slug, { title: post.title, excerpt: '' }]));
  console.log('--- meta-manifest.json 骨架（excerpt 留空待填；title 如需调整直接改）---');
  console.log(JSON.stringify({ posts: skeleton }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
