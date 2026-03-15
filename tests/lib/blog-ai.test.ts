import { describe, expect, it } from 'vitest';
import {
  buildBlogExcerptFallback,
  detectAiProvider,
  extractJsonObject,
  normalizeBlogMetadataSuggestion,
  parseBlogMetadataResponse,
  resolveBlogMetadataAiConfig,
} from '@/lib/blog-ai';

describe('blog-ai', () => {
  describe('detectAiProvider', () => {
    it('应该根据 gemini model 识别 Gemini provider', () => {
      expect(detectAiProvider('gemini-2.5-flash')).toBe('gemini');
      expect(detectAiProvider('models/gemini-2.5-pro')).toBe('gemini');
    });

    it('非 gemini model 应默认识别为 OpenAI provider', () => {
      expect(detectAiProvider('gpt-5-mini')).toBe('openai');
      expect(detectAiProvider('o4-mini')).toBe('openai');
    });
  });

  describe('resolveBlogMetadataAiConfig', () => {
    it('应该使用 AI_MODEL 和 OPENAI_API_KEY 解析 OpenAI 配置', () => {
      expect(
        resolveBlogMetadataAiConfig({
          AI_MODEL: 'gpt-5-mini',
          OPENAI_API_KEY: 'openai-key',
        }),
      ).toEqual({
        provider: 'openai',
        apiKey: 'openai-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-5-mini',
      });
    });

    it('应该使用 AI_MODEL 和 GEMINI_API_KEY 解析 Gemini 配置', () => {
      expect(
        resolveBlogMetadataAiConfig({
          AI_MODEL: 'models/gemini-2.5-flash',
          GEMINI_API_KEY: 'gemini-key',
        }),
      ).toEqual({
        provider: 'gemini',
        apiKey: 'gemini-key',
        baseUrl: 'https://generativelanguage.googleapis.com',
        apiVersion: 'v1beta',
        model: 'gemini-2.5-flash',
      });
    });

    it('应该把带版本号的 GEMINI_BASE_URL 解析成 SDK 配置', () => {
      expect(
        resolveBlogMetadataAiConfig({
          AI_MODEL: 'gemini-2.5-pro',
          GEMINI_API_KEY: 'gemini-key',
          GEMINI_BASE_URL: 'https://proxy.example.com/gemini/v1',
        }),
      ).toEqual({
        provider: 'gemini',
        apiKey: 'gemini-key',
        baseUrl: 'https://proxy.example.com/gemini',
        apiVersion: 'v1',
        model: 'gemini-2.5-pro',
      });
    });

    it('缺少 AI_MODEL 时应该报错', () => {
      expect(() => resolveBlogMetadataAiConfig({ OPENAI_API_KEY: 'openai-key' })).toThrow(
        'AI 未配置。请至少设置 AI_MODEL。',
      );
    });

    it('Gemini model 缺少 GEMINI_API_KEY 时应该报错', () => {
      expect(() =>
        resolveBlogMetadataAiConfig({
          AI_MODEL: 'gemini-2.5-flash',
          OPENAI_API_KEY: 'openai-key',
        }),
      ).toThrow('GEMINI_API_KEY');
    });
  });

  describe('extractJsonObject', () => {
    it('应该从 code fence 中提取 JSON', () => {
      expect(
        extractJsonObject(`
\`\`\`json
{"slug":"demo-post","excerpt":"摘要","tags":["cloudflare","email"]}
\`\`\`
        `),
      ).toBe('{"slug":"demo-post","excerpt":"摘要","tags":["cloudflare","email"]}');
    });

    it('应该从带前后文的文本中提取 JSON', () => {
      expect(extractJsonObject('这是结果：{"slug":"demo-post","excerpt":"摘要","tags":["cloudflare"]}请查收')).toBe(
        '{"slug":"demo-post","excerpt":"摘要","tags":["cloudflare"]}',
      );
    });
  });

  describe('parseBlogMetadataResponse', () => {
    it('应该解析出 slug、摘要和标签', () => {
      expect(parseBlogMetadataResponse('{"slug":"demo-post","excerpt":"摘要","tags":["cloudflare","email"]}')).toEqual({
        slug: 'demo-post',
        excerpt: '摘要',
        tags: ['cloudflare', 'email'],
      });
    });
  });

  describe('normalizeBlogMetadataSuggestion', () => {
    it('应该规范化 slug，并把字符串标签拆成数组', () => {
      expect(
        normalizeBlogMetadataSuggestion('Cloudflare Email Worker 自动化', '正文内容', {
          slug: 'cloudflare_email_worker',
          excerpt: '  自动处理企业邮件流转。  ',
          tags: 'Cloudflare, Email Worker, 自动化',
        }),
      ).toEqual({
        slug: 'cloudflare-email-worker',
        excerpt: '自动处理企业邮件流转。',
        tags: ['Cloudflare', 'Email Worker', '自动化'],
      });
    });

    it('缺少摘要时应该回退到正文摘要', () => {
      expect(
        normalizeBlogMetadataSuggestion(
          'Cloudflare Email Worker 自动化',
          `
## 背景

我们最近在用 Email Worker 处理公司的邮件自动化流程，希望把踩过的坑整理出来。
          `,
          {
            slug: 'cloudflare-email-worker-pitfalls',
            excerpt: '',
            tags: ['cloudflare', 'email worker', 'automation'],
          },
        ).excerpt,
      ).toContain('我们最近在用 Email Worker 处理公司的邮件自动化流程');
    });

    it('AI 未返回标签时应该报错', () => {
      expect(() =>
        normalizeBlogMetadataSuggestion('Cloudflare Email Worker 自动化', '正文内容', {
          slug: 'cloudflare-email-worker',
          excerpt: '摘要',
          tags: [],
        }),
      ).toThrow('AI 未生成可用标签');
    });
  });

  describe('buildBlogExcerptFallback', () => {
    it('应该移除 Markdown 标记与代码块', () => {
      expect(
        buildBlogExcerptFallback(`
## 标题

这是第一段。

\`\`\`ts
console.log('hello');
\`\`\`

- 列表项
        `),
      ).toBe('标题 这是第一段。 列表项');
    });
  });
});
