import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPost, stripHtml, getCategories, getMediaBySlug } from '@/lib/wordpress';
import PostView from '@/views/PostView';
import AttachmentView from '@/views/AttachmentView';
import { routing } from '@/i18n/routing';

export const revalidate = 86400;

interface PostPageProps {
  params: Promise<{ slug: string[]; locale: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Check for attachment pattern: .../attachment/[slug]
  if (slug.length >= 2 && slug[slug.length - 2] === 'attachment') {
    const attachmentSlug = slug[slug.length - 1];
    const media = await getMediaBySlug(attachmentSlug);

    if (media) {
      const title = stripHtml(media.title.rendered);
      const description = media.description?.rendered
        ? stripHtml(media.description.rendered).slice(0, 160)
        : `Attachment: ${title}`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          images: [media.source_url],
        },
      };
    }
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
  const description = stripHtml(post.excerpt.rendered).slice(0, 160);

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og/post?slug=${cleanSlug}`;
  const images = [ogImageUrl];

  // Determine primary category for canonical URL
  let primaryCategorySlug = 'uncategorized';
  if (post.categories && post.categories.length > 0) {
    const allCategories = await getCategories();
    const cat = allCategories.find((c) => c.id === post.categories[0]);
    if (cat) {
      primaryCategorySlug = decodeURIComponent(cat.slug);
    }
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${primaryCategorySlug}/${cleanSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: `${process.env.NEXT_PUBLIC_SITE_URL}/en/posts/${primaryCategorySlug}/${cleanSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.date,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, locale } = await params;

  // Check for attachment pattern: .../attachment/[slug]
  if (slug.length >= 2 && slug[slug.length - 2] === 'attachment') {
    const attachmentSlug = slug[slug.length - 1];
    const media = await getMediaBySlug(attachmentSlug);

    if (media) {
      const parentPathSegments = slug.slice(0, slug.length - 2);
      let parentPostSlug = parentPathSegments.join('/');
      if (parentPostSlug.endsWith('.html')) {
        parentPostSlug = parentPostSlug.replace('.html', '');
      }
      return <AttachmentView media={media} parentPostSlug={parentPostSlug} />;
    }
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

  return <PostView post={post} />;
}
