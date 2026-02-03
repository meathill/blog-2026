import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPost, stripHtml, getCategories } from '@/lib/wordpress';
import PostView from '@/views/PostView';

interface PostPageProps {
  params: Promise<{ slug: string[]; locale: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, locale } = await params;

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
      primaryCategorySlug = cat.slug;
    }
  }

  const expectedPath = `${primaryCategorySlug}/${cleanSlug}`;
  const currentPath = slug.join('/');

  // Check if we need to redirect
  // We compare the *content* path (after /posts/).
  // If slug is `['tech', 'article.html']`, currentPath is `tech/article.html`. Expected: `tech/article`.
  // If slug is `['article']`, currentPath is `article`. Expected: `tech/article`.
  // We must redirect if they don't match.

  if (currentPath !== expectedPath) {
    // Construct absolute path for redirect to be safe and explicit
    // Path structure: /:{locale}/posts/:{expectedPath}
    // Note: if routing prefix is 'as-needed' and locale is default, it might duplicate.
    // Better to use `redirect` from `i18n/routing` if possible, but that's for Client Components usually?
    // Or `redirect` from `next-intl/server`?
    // `next/navigation`'s `redirect` takes a URL string.
    // If we manually construct `/${locale}/posts/${expectedPath}`, Next.js middleware handles it.

    // IMPORTANT: `redirect` throws internally.
    redirect(`/${locale}/posts/${expectedPath}`);
  }

  return <PostView post={post} />;
}
