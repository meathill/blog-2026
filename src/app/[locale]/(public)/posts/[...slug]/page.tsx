import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPost, stripHtml, getCategories, buildPostDescription } from '@/lib/wordpress';
import PostView from '@/views/PostView';
import { routing } from '@/i18n/routing';
import '@/app/post-content.css';

export const revalidate = 86400;

interface PostPageProps {
  params: Promise<{ slug: string[]; locale: string }>;
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

  // Determine primary category for canonical URL
  let primaryCategorySlug = 'uncategorized';
  if (post.categories && post.categories.length > 0) {
    const allCategories = await getCategories();
    const cat = allCategories.find((c) => c.id === post.categories[0]);
    if (cat) {
      primaryCategorySlug = decodeURIComponent(cat.slug);
    }
  }

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
      redirect(`${prefix}/posts`);
    }

    // 仅 post slug 时尝试解析主分类，跳到规范路径
    if (parentSegments.length === 1) {
      const parentPost = await getPost(parentSegments[0]);
      if (parentPost) {
        let primaryCategorySlug = 'uncategorized';
        if (parentPost.categories?.length) {
          const allCategories = await getCategories();
          const cat = allCategories.find((c) => c.id === parentPost.categories[0]);
          if (cat) {
            primaryCategorySlug = decodeURIComponent(cat.slug);
          }
        }
        redirect(`${prefix}/posts/${primaryCategorySlug}/${parentPost.slug}`);
      }
    }

    redirect(`${prefix}/posts/${parentSegments.join('/')}`);
  }

  const lastSegment = slug[slug.length - 1];
  const cleanSlug = lastSegment.endsWith('.html') ? lastSegment.replace('.html', '') : lastSegment;

  const post = await getPost(cleanSlug);

  if (!post) {
    notFound();
  }

  // Determine canonical category
  let primaryCategorySlug = 'uncategorized';
  if (post.categories && post.categories.length > 0) {
    const allCategories = await getCategories();
    // Prefer matching category if present in URL, otherwise first one
    const cat = allCategories.find((c) => c.id === post.categories[0]);
    if (cat) {
      primaryCategorySlug = decodeURIComponent(cat.slug);
    }
  }

  const expectedPath = `${primaryCategorySlug}/${cleanSlug}`;
  const currentPath = slug.join('/');
  if (currentPath !== expectedPath && decodeURIComponent(currentPath) !== decodeURIComponent(expectedPath)) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/posts/${expectedPath}`);
  }

  return <PostView post={post} locale={locale} />;
}
