import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { buildBlogSlug, parseBlogStringListInput } from '@/lib/blog-post';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_GEMINI_API_VERSION = 'v1beta';
const MAX_EXCERPT_LENGTH = 160;
const MAX_MARKDOWN_LENGTH = 12_000;
const MAX_TAG_COUNT = 6;
const BLOG_METADATA_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    slug: {
      type: 'string',
    },
    excerpt: {
      type: 'string',
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['slug', 'excerpt', 'tags'],
} as const;

export type AiProvider = 'openai' | 'gemini';

export interface BlogMetadataSuggestion {
  slug: string;
  excerpt: string;
  tags: string[];
}

export interface BlogMetadataAiEnv {
  AI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_BASE_URL?: string;
}

interface BlogMetadataPromptInput {
  locale: string;
  title: string;
  markdown: string;
}

interface BlogMetadataAiConfigBase {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

interface OpenAiBlogMetadataAiConfig extends BlogMetadataAiConfigBase {
  provider: 'openai';
  baseUrl: string;
}

interface GeminiBlogMetadataAiConfig extends BlogMetadataAiConfigBase {
  provider: 'gemini';
  baseUrl: string;
  apiVersion: string;
}

type BlogMetadataAiConfig = OpenAiBlogMetadataAiConfig | GeminiBlogMetadataAiConfig;

type OpenAiMessageContent =
  | string
  | Array<{
      text?: string;
    }>
  | null
  | undefined;

interface ParsedBlogMetadataPayload {
  slug?: unknown;
  excerpt?: unknown;
  tags?: unknown;
}

export async function generateBlogMetadataSuggestion(
  env: BlogMetadataAiEnv,
  input: BlogMetadataPromptInput,
): Promise<BlogMetadataSuggestion> {
  const config = resolveBlogMetadataAiConfig(env);
  const content =
    config.provider === 'gemini'
      ? await requestGeminiBlogMetadata(config, input)
      : await requestOpenAiBlogMetadata(config, input);

  if (!content) {
    throw new Error('AI 没有返回可用的元数据结果。');
  }

  return normalizeBlogMetadataSuggestion(
    titleOrFallback(input.title),
    input.markdown,
    parseBlogMetadataResponse(content),
  );
}

export function detectAiProvider(model: string): AiProvider {
  const normalizedModel = normalizeAiModel(model);
  if (normalizedModel.includes('gemini')) {
    return 'gemini';
  }

  return 'openai';
}

export function resolveBlogMetadataAiConfig(env: BlogMetadataAiEnv): BlogMetadataAiConfig {
  const model = normalizeAiModel(env.AI_MODEL || '');
  if (!model) {
    throw new Error('AI 未配置。请至少设置 AI_MODEL。');
  }

  const provider = detectAiProvider(model);
  if (provider === 'gemini') {
    const endpoint = resolveGeminiEndpoint(env.GEMINI_BASE_URL);
    return {
      provider,
      apiKey: readRequiredEnvValue(env.GEMINI_API_KEY, 'GEMINI_API_KEY'),
      baseUrl: endpoint.baseUrl,
      apiVersion: endpoint.apiVersion,
      model,
    };
  }

  return {
    provider,
    apiKey: readRequiredEnvValue(env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
    baseUrl: normalizeBaseUrl(env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL),
    model,
  };
}

export function parseBlogMetadataResponse(content: string): ParsedBlogMetadataPayload {
  const json = extractJsonObject(content);
  const parsed = JSON.parse(json) as Record<string, unknown>;

  return {
    slug: parsed.slug,
    excerpt: parsed.excerpt,
    tags: parsed.tags,
  };
}

export function normalizeBlogMetadataSuggestion(
  title: string,
  markdown: string,
  payload: ParsedBlogMetadataPayload,
): BlogMetadataSuggestion {
  const slug = buildBlogSlug(title, typeof payload.slug === 'string' ? payload.slug : '');
  const excerpt = normalizeExcerpt(typeof payload.excerpt === 'string' ? payload.excerpt : '', markdown);
  const tags = normalizeTags(payload.tags);

  if (tags.length === 0) {
    throw new Error('AI 未生成可用标签，请重试。');
  }

  return {
    slug,
    excerpt,
    tags,
  };
}

export function buildBlogExcerptFallback(markdown: string): string {
  const plainText = stripMarkdownToPlainText(markdown);
  if (!plainText) {
    return '';
  }

  if (plainText.length <= MAX_EXCERPT_LENGTH) {
    return plainText;
  }

  return `${plainText.slice(0, MAX_EXCERPT_LENGTH).trim()}...`;
}

export function extractJsonObject(content: string): string {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI 返回结果不是合法 JSON。');
  }

  return content.slice(firstBrace, lastBrace + 1).trim();
}

function buildBlogMetadataSystemPrompt(): string {
  return [
    '你是技术博客编辑助手。',
    '请根据标题和正文 Markdown 生成文章元数据。',
    '你只能返回 JSON，不要输出解释、前言或 Markdown 代码块。',
    'JSON 必须包含 slug、excerpt、tags 三个字段。',
    'slug 必须是 ASCII kebab-case，适合 URL，不带日期、不带域名。',
    'excerpt 必须是文章原语言的一段简短摘要，不超过 160 个字符。',
    'tags 必须是 3 到 6 个短标签组成的字符串数组，避免过长句子。',
  ].join('');
}

function buildBlogMetadataUserPrompt(input: BlogMetadataPromptInput): string {
  const articleLanguage = input.locale === 'en' ? 'English' : '中文';
  const markdown = input.markdown.trim().slice(0, MAX_MARKDOWN_LENGTH);

  return [
    `文章语言：${articleLanguage}`,
    `标题：${input.title.trim()}`,
    '正文 Markdown：',
    markdown,
    '请只返回 JSON，例如：{"slug":"demo-post","excerpt":"...","tags":["tag-a","tag-b"]}',
  ].join('\n\n');
}

async function requestOpenAiBlogMetadata(
  config: OpenAiBlogMetadataAiConfig,
  input: BlogMetadataPromptInput,
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: buildBlogMetadataSystemPrompt(),
        },
        {
          role: 'user',
          content: buildBlogMetadataUserPrompt(input),
        },
      ],
    });

    return readOpenAiChatCompletionContent(response.choices?.[0]?.message?.content);
  } catch (error) {
    throw wrapAiRequestError(error);
  }
}

async function requestGeminiBlogMetadata(
  config: GeminiBlogMetadataAiConfig,
  input: BlogMetadataPromptInput,
): Promise<string> {
  const client = new GoogleGenAI({
    apiKey: config.apiKey,
    apiVersion: config.apiVersion,
    httpOptions: {
      baseUrl: config.baseUrl,
    },
  });

  try {
    const response = await client.models.generateContent({
      model: config.model,
      contents: buildBlogMetadataUserPrompt(input),
      config: {
        systemInstruction: buildBlogMetadataSystemPrompt(),
        responseMimeType: 'application/json',
        responseJsonSchema: BLOG_METADATA_RESPONSE_JSON_SCHEMA,
      },
    });

    return readGeminiGenerateContentText(response);
  } catch (error) {
    throw wrapAiRequestError(error);
  }
}

function normalizeAiModel(model: string): string {
  return model.trim().replace(/^models\//, '');
}

function readRequiredEnvValue(value: string | undefined, key: string): string {
  const normalizedValue = value?.trim() || '';
  if (!normalizedValue) {
    throw new Error(`AI 未配置。当前模型需要环境变量 ${key}。`);
  }

  return normalizedValue;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveGeminiEndpoint(value: string | undefined): { baseUrl: string; apiVersion: string } {
  const normalized = normalizeBaseUrl(value || `${DEFAULT_GEMINI_BASE_URL}/${DEFAULT_GEMINI_API_VERSION}`);
  const matched = normalized.match(/^(.*)\/(v\d+(?:alpha|beta)?)$/i);

  if (matched?.[1] && matched[2]) {
    return {
      baseUrl: normalizeBaseUrl(matched[1]),
      apiVersion: matched[2],
    };
  }

  return {
    baseUrl: normalized,
    apiVersion: DEFAULT_GEMINI_API_VERSION,
  };
}

function readOpenAiChatCompletionContent(content: OpenAiMessageContent): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => (typeof item.text === 'string' ? item.text : ''))
    .join('')
    .trim();
}

function readGeminiGenerateContentText(response: { text?: string; promptFeedback?: { blockReason?: string } }): string {
  const text = response.text?.trim() || '';
  if (text) {
    return text;
  }

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini 拒绝了请求：${blockReason}`);
  }

  return '';
}

function wrapAiRequestError(error: unknown): Error {
  const message = error instanceof Error && error.message.trim() ? error.message.trim() : '上游服务没有返回错误详情。';
  return new Error(`AI 元数据生成失败：${message}`);
}

function titleOrFallback(title: string): string {
  return title.trim() || 'untitled-post';
}

function normalizeExcerpt(value: string, markdown: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const excerpt = normalized || buildBlogExcerptFallback(markdown);

  if (!excerpt) {
    throw new Error('AI 未生成可用摘要，请补充正文后重试。');
  }

  if (excerpt.length <= MAX_EXCERPT_LENGTH) {
    return excerpt;
  }

  return `${excerpt.slice(0, MAX_EXCERPT_LENGTH).trim()}...`;
}

function normalizeTags(value: unknown): string[] {
  const source =
    typeof value === 'string'
      ? parseBlogStringListInput(value)
      : Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];

  return Array.from(new Set(source.map((item) => item.trim()).filter(Boolean))).slice(0, MAX_TAG_COUNT);
}

function stripMarkdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
