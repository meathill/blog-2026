import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getPost,
  getPostById,
  getPosts,
  stripHtml,
  getCategories,
  getCategoryBySlug,
  getMediaBySlug,
  buildPostDescription,
  WPPost,
} from '@/lib/wordpress';
import PostView from '@/views/PostView';
import { routing } from '@/i18n/routing';
import '@/app/post-content.css';

export const revalidate = 86400;

interface PostPageProps {
  params: Promise<{ slug: string[]; locale: string }>;
}

export async function generateStaticParams() {
  try {
    const [allCategories, firstPage] = await Promise.all([
      getCategories().catch(() => []),
      getPosts({ perPage: 100, embed: false, fields: ['slug', 'categories'] }),
    ]);

    const categoryMap = new Map<number, string>();
    allCategories.forEach((cat) => categoryMap.set(cat.id, decodeURIComponent(cat.slug)));

    const posts = [...(firstPage?.posts || [])];
    if (firstPage?.totalPages && firstPage.totalPages > 1) {
      const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2);
      const results = await Promise.all(
        remainingPages.map((page) =>
          getPosts({ page, perPage: 100, embed: false, fields: ['slug', 'categories'] }).catch(() => ({
            posts: [],
            total: 0,
            totalPages: 0,
          })),
        ),
      );
      results.forEach((res) => posts.push(...res.posts));
    }

    const params: { locale: string; slug: string[] }[] = [];
    for (const locale of routing.locales) {
      for (const post of posts) {
        if (!post.slug) continue;
        const catId = post.categories?.[0];
        const categorySlug = catId ? categoryMap.get(catId) || 'uncategorized' : 'uncategorized';
        params.push({
          locale,
          slug: [categorySlug, post.slug],
        });
      }
    }
    return params;
  } catch (error) {
    console.warn('[generateStaticParams] Failed to preload posts static params:', error);
    return [];
  }
}

/** 去掉路径末段可能残留的 `.html`，供 attachment 父文重定向使用。 */
function cleanParentPathSegments(segments: string[]): string[] {
  return segments.map((segment, index) => {
    if (index === segments.length - 1 && segment.endsWith('.html')) {
      return segment.replace(/\.html$/, '');
    }
    return segment;
  });
}

async function resolvePrimaryCategorySlug(post: WPPost): Promise<string> {
  if (post.categories?.length) {
    const allCategories = await getCategories();
    const cat = allCategories.find((c) => c.id === post.categories[0]);
    if (cat) {
      return decodeURIComponent(cat.slug);
    }
  }
  return 'uncategorized';
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  // attachment 页会 301 到父文；metadata 只保留 noindex + 父文 canonical，避免自指
  if (slug.length >= 2 && slug[slug.length - 2] === 'attachment') {
    const parentSegments = cleanParentPathSegments(slug.slice(0, slug.length - 2));
    const parentPath = parentSegments.length > 0 ? `/posts/${parentSegments.join('/')}` : '/posts';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meathill.com';
    const zhUrl = `${siteUrl}${parentPath}`;
    const enUrl = `${siteUrl}/en${parentPath}`;
    return {
      title: '附件已迁移',
      robots: { index: false, follow: true },
      alternates: {
        canonical: locale === routing.defaultLocale ? zhUrl : enUrl,
        languages: { zh: zhUrl, en: enUrl },
      },
    };
  }

  const postSlug = slug[slug.length - 1];
  const cleanSlug = postSlug.endsWith('.html') ? postSlug.replace('.html', '') : postSlug;
  const post = await getPost(cleanSlug);

  if (!post) {
    return {
      title: '文章未找到',
    };
  }

  const title = stripHtml(post.title.rendered);
  const description = buildPostDescription(post);

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og/post?slug=${cleanSlug}`;
  const ogImage = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    alt: title,
    type: 'image/jpeg',
  };

  const primaryCategorySlug = await resolvePrimaryCategorySlug(post);

  const basePath = `/posts/${primaryCategorySlug}/${cleanSlug}`;
  const zhUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${basePath}`;
  const enUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/en${basePath}`;
  const canonicalUrl = locale === routing.defaultLocale ? zhUrl : enUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Meathill LLC',
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: ogImageUrl, alt: title }],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, locale } = await params;
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;

  // 低价值 attachment URL → 301 到父文（issue #4：避免 self-canonical 继续喂给索引）
  if (slug.length >= 2 && slug[slug.length - 2] === 'attachment') {
    const parentSegments = cleanParentPathSegments(slug.slice(0, slug.length - 2));
    if (parentSegments.length === 0) {
      permanentRedirect(`${prefix}/posts`);
    }

    // 仅 post slug 时尝试解析主分类，跳到规范路径
    if (parentSegments.length === 1) {
      const parentPost = await getPost(parentSegments[0]);
      if (parentPost) {
        const primaryCategorySlug = await resolvePrimaryCategorySlug(parentPost);
        permanentRedirect(`${prefix}/posts/${primaryCategorySlug}/${parentPost.slug}`);
      }
    }

    permanentRedirect(`${prefix}/posts/${parentSegments.join('/')}`);
  }

  const lastSegment = slug[slug.length - 1];
  const cleanSlug = lastSegment.endsWith('.html') ? lastSegment.replace('.html', '') : lastSegment;

  const post = await getPost(cleanSlug);

  if (!post) {
    // 旧站单段 URL 兜底（middleware 把未知顶层 slug 301 到 /posts/{slug}）：
    // 先试旧分类外链（/js、/life），再试附件 slug（/img_0224 → 父文）
    if (slug.length === 1) {
      const category = await getCategoryBySlug(cleanSlug);
      if (category) {
        permanentRedirect(`${prefix}/category/${decodeURIComponent(category.slug)}`);
      }
      const media = await getMediaBySlug(cleanSlug);
      if (media?.post) {
        const parentPost = await getPostById(media.post);
        if (parentPost) {
          const primaryCategorySlug = await resolvePrimaryCategorySlug(parentPost);
          permanentRedirect(`${prefix}/posts/${primaryCategorySlug}/${parentPost.slug}`);
        }
      }
    }
    notFound();
  }

  const primaryCategorySlug = await resolvePrimaryCategorySlug(post);

  const expectedPath = `${primaryCategorySlug}/${cleanSlug}`;
  const currentPath = slug.join('/');
  if (currentPath !== expectedPath && decodeURIComponent(currentPath) !== decodeURIComponent(expectedPath)) {
    permanentRedirect(`${prefix}/posts/${expectedPath}`);
  }

  return <PostView post={post} locale={locale} />;
}
