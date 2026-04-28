import { z, type ZodType } from 'zod';
import {
  addAppImageCore,
  createAppCore,
  deleteAppCore,
  deleteAppTranslationCore,
  getAppById,
  getAppBySlug,
  listAppImagesCore,
  listApps,
  removeAppImageCore,
  revalidateAfterAppMutation,
  setAppTagsCore,
  updateAppCore,
  upsertAppTranslationCore,
} from '@/lib/apps-core';
import { fetchRemoteImage, uploadToR2 } from '@/lib/mcp/upload';
import { createBlogPostRecord, getBlogPostRecord, listBlogPostRecords, updateBlogPostRecord } from '@/lib/blog-storage';
import { buildBlogSlug, normalizeBlogPostStatus } from '@/lib/blog-post';
import { buildDraftContentFromMarkdown, revalidateBlogAdminPaths } from '@/lib/mcp/blog-draft';

const BlogStatus = z.enum(['draft', 'published', 'archived']);

const Status = z.enum(['published', 'draft', 'archived']);
const Locale = z.enum(['en', 'zh']);
const ImageType = z.enum(['cover', 'screenshot']);

const TranslationInput = z
  .object({
    locale: Locale,
    name: z.string().nullish(),
    description: z.string().nullish(),
    content: z.string().nullish(),
  })
  .strict();

const ImageInput = z
  .object({
    url: z.string().url(),
    alt: z.string().nullish(),
    type: ImageType.optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

export interface McpTool<S extends ZodType = ZodType> {
  name: string;
  description: string;
  inputSchema: S;
  handler: (args: z.infer<S>) => Promise<unknown>;
}

function tool<S extends ZodType>(t: McpTool<S>): McpTool<S> {
  return t;
}

export const tools: McpTool[] = [
  tool({
    name: 'list_apps',
    description: 'List apps with optional filters. Returns summary rows ordered by updatedAt desc.',
    inputSchema: z
      .object({
        status: Status.optional(),
        tagSlug: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .strict(),
    handler: async (args) => listApps(args),
  }),

  tool({
    name: 'get_app',
    description: 'Get a single app by id or slug. Includes images, tags, and translations.',
    inputSchema: z
      .object({ id: z.string().optional(), slug: z.string().optional() })
      .strict()
      .refine((v) => Boolean(v.id) !== Boolean(v.slug), { message: 'Provide exactly one of id or slug' }),
    handler: async ({ id, slug }) => {
      if (id) return getAppById(id);
      return getAppBySlug(slug!);
    },
  }),

  tool({
    name: 'create_app',
    description: 'Create a new app entry. Returns the created app (full).',
    inputSchema: z
      .object({
        name: z.string().min(1),
        description: z.string().nullish(),
        content: z.string().nullish(),
        icon: z.string().nullish(),
        url: z.string().nullish(),
        repoUrl: z.string().nullish(),
        slug: z.string().optional(),
        status: Status.optional(),
        tagIds: z.array(z.string()).optional(),
        translations: z.array(TranslationInput).optional(),
        images: z.array(ImageInput).optional(),
      })
      .strict(),
    handler: async (args) => {
      const { id, slug } = await createAppCore(args);
      revalidateAfterAppMutation(slug);
      return getAppById(id);
    },
  }),

  tool({
    name: 'update_app',
    description: 'Update fields on an app. Only provided fields are changed.',
    inputSchema: z
      .object({
        id: z.string(),
        patch: z
          .object({
            name: z.string().min(1).optional(),
            description: z.string().nullish(),
            content: z.string().nullish(),
            icon: z.string().nullish(),
            url: z.string().nullish(),
            repoUrl: z.string().nullish(),
            slug: z.string().optional(),
            status: Status.optional(),
          })
          .strict(),
      })
      .strict(),
    handler: async ({ id, patch }) => {
      const { slug, prevSlug } = await updateAppCore(id, patch);
      revalidateAfterAppMutation(slug, prevSlug);
      return getAppById(id);
    },
  }),

  tool({
    name: 'delete_app',
    description: 'Delete an app and its images, tag links, and translations.',
    inputSchema: z.object({ id: z.string() }).strict(),
    handler: async ({ id }) => {
      const result = await deleteAppCore(id);
      revalidateAfterAppMutation(result?.slug ?? null);
      return { deleted: Boolean(result), slug: result?.slug ?? null };
    },
  }),

  tool({
    name: 'set_app_tags',
    description: 'Replace the entire tag set for an app.',
    inputSchema: z.object({ appId: z.string(), tagIds: z.array(z.string()) }).strict(),
    handler: async ({ appId, tagIds }) => {
      await setAppTagsCore(appId, tagIds);
      const app = await getAppById(appId);
      revalidateAfterAppMutation(app?.slug ?? null);
      return { ok: true };
    },
  }),

  tool({
    name: 'list_app_images',
    description: 'List all images attached to an app.',
    inputSchema: z.object({ appId: z.string() }).strict(),
    handler: async ({ appId }) => listAppImagesCore(appId),
  }),

  tool({
    name: 'upload_image',
    description:
      'Upload an image to R2 and return its public URL. Provide either base64 `data` (with `contentType`) or a https `sourceUrl` to fetch.',
    inputSchema: z
      .object({
        data: z.string().optional(),
        contentType: z.string().optional(),
        filename: z.string().optional(),
        sourceUrl: z.string().url().optional(),
      })
      .strict()
      .refine((v) => Boolean(v.data) !== Boolean(v.sourceUrl), {
        message: 'Provide exactly one of data or sourceUrl',
      })
      .refine((v) => !v.data || Boolean(v.contentType), {
        message: 'contentType is required when data is provided',
      }),
    handler: async (args) => {
      if (args.sourceUrl) {
        const { bytes, byteLength, contentType } = await fetchRemoteImage(args.sourceUrl);
        return uploadToR2({ bytes, byteLength, contentType, filename: args.filename });
      }
      const binary = atob(args.data!);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return uploadToR2({
        bytes,
        byteLength: bytes.byteLength,
        contentType: args.contentType!,
        filename: args.filename,
      });
    },
  }),

  tool({
    name: 'add_app_image',
    description: 'Attach an image (by URL) to an app. Use upload_image first to get a URL.',
    inputSchema: z
      .object({
        appId: z.string(),
        url: z.string().url(),
        alt: z.string().nullish(),
        type: ImageType.optional(),
        sortOrder: z.number().int().optional(),
      })
      .strict(),
    handler: async (args) => {
      const result = await addAppImageCore(args);
      const app = await getAppById(args.appId);
      revalidateAfterAppMutation(app?.slug ?? null);
      return result;
    },
  }),

  tool({
    name: 'remove_app_image',
    description: 'Remove an image attachment from an app by image id.',
    inputSchema: z.object({ imageId: z.string() }).strict(),
    handler: async ({ imageId }) => {
      const result = await removeAppImageCore(imageId);
      if (result) {
        const app = await getAppById(result.appId);
        revalidateAfterAppMutation(app?.slug ?? null);
      }
      return { removed: Boolean(result) };
    },
  }),

  tool({
    name: 'upsert_app_translation',
    description: 'Create or update a translation for an app in the given locale.',
    inputSchema: z
      .object({
        appId: z.string(),
        locale: Locale,
        name: z.string().nullish(),
        description: z.string().nullish(),
        content: z.string().nullish(),
      })
      .strict(),
    handler: async (args) => {
      await upsertAppTranslationCore(args);
      const app = await getAppById(args.appId);
      revalidateAfterAppMutation(app?.slug ?? null);
      return { ok: true };
    },
  }),

  tool({
    name: 'delete_app_translation',
    description: 'Delete a translation row for an app + locale.',
    inputSchema: z.object({ appId: z.string(), locale: Locale }).strict(),
    handler: async ({ appId, locale }) => {
      await deleteAppTranslationCore(appId, locale);
      const app = await getAppById(appId);
      revalidateAfterAppMutation(app?.slug ?? null);
      return { ok: true };
    },
  }),

  tool({
    name: 'list_blog_posts',
    description: 'List blog posts with pagination, ordered by updatedAt desc.',
    inputSchema: z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    handler: async (args) => listBlogPostRecords(args),
  }),

  tool({
    name: 'get_blog_post',
    description: 'Get a single blog post by id.',
    inputSchema: z.object({ id: z.string() }).strict(),
    handler: async ({ id }) => getBlogPostRecord(id),
  }),

  tool({
    name: 'create_blog_draft',
    description:
      'Create a new blog post draft from markdown. Renders html via marked and stores markdown in BlockNote-compatible blocks. Returns the created post.',
    inputSchema: z
      .object({
        title: z.string().min(1),
        markdown: z.string().min(1),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        status: BlogStatus.optional(),
        coverImage: z.string().nullish(),
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
      })
      .strict(),
    handler: async (args) => {
      const slug = buildBlogSlug(args.title, args.slug);
      const status = normalizeBlogPostStatus(args.status);
      const content = await buildDraftContentFromMarkdown(args.markdown);
      const id = await createBlogPostRecord({
        title: args.title,
        slug,
        excerpt: args.excerpt ?? '',
        status,
        coverImage: args.coverImage ?? null,
        categories: args.categories ?? [],
        tags: args.tags ?? [],
        blocksJson: content.blocksJson,
        markdown: content.markdown,
        html: content.html,
      });
      revalidateBlogAdminPaths(id);
      return getBlogPostRecord(id);
    },
  }),

  tool({
    name: 'update_blog_post',
    description:
      'Update fields on a blog post. If `markdown` is provided, html and blocksJson are regenerated. Only provided fields are changed; tags/categories replace the whole list.',
    inputSchema: z
      .object({
        id: z.string(),
        patch: z
          .object({
            title: z.string().min(1).optional(),
            slug: z.string().optional(),
            excerpt: z.string().optional(),
            status: BlogStatus.optional(),
            coverImage: z.string().nullish(),
            tags: z.array(z.string()).optional(),
            categories: z.array(z.string()).optional(),
            markdown: z.string().optional(),
          })
          .strict(),
      })
      .strict(),
    handler: async ({ id, patch }) => {
      const existing = await getBlogPostRecord(id);
      if (!existing) throw new Error(`Blog post not found: ${id}`);

      const title = patch.title ?? existing.title;
      const slug = patch.slug
        ? buildBlogSlug(title, patch.slug)
        : patch.title
          ? buildBlogSlug(title, existing.slug)
          : existing.slug;

      let blocksJson = existing.blocksJson;
      let markdown = existing.markdown;
      let html = existing.html;
      if (patch.markdown !== undefined) {
        const content = await buildDraftContentFromMarkdown(patch.markdown);
        blocksJson = content.blocksJson;
        markdown = content.markdown;
        html = content.html;
      }

      await updateBlogPostRecord(id, {
        title,
        slug,
        excerpt: patch.excerpt ?? existing.excerpt,
        status: patch.status ?? existing.status,
        coverImage: patch.coverImage === undefined ? existing.coverImage : (patch.coverImage ?? null),
        categories: patch.categories ?? existing.categories,
        tags: patch.tags ?? existing.tags,
        blocksJson,
        markdown,
        html,
      });
      revalidateBlogAdminPaths(id);
      return getBlogPostRecord(id);
    },
  }),
];

export const toolMap = new Map(tools.map((t) => [t.name, t]));

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: unknown;
}

export const toolDescriptors: ToolDescriptor[] = tools.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }),
}));
