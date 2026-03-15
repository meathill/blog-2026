import { Badge } from '@/components/ui/badge';
import type { BlogPostStatus } from '@/lib/blog-post';

interface BlogStatusBadgeProps {
  status: BlogPostStatus;
}

interface WordPressSyncBadgeProps {
  status: BlogPostStatus;
  needsSyncToWordPress: boolean;
  hasWordPressSync: boolean;
}

const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

export function BlogStatusBadge({ status }: BlogStatusBadgeProps) {
  const variant = status === 'published' ? 'success' : status === 'archived' ? 'secondary' : 'warning';

  return <Badge variant={variant}>{BLOG_STATUS_LABELS[status]}</Badge>;
}

export function BlogWordPressSyncBadge({ status, needsSyncToWordPress, hasWordPressSync }: WordPressSyncBadgeProps) {
  if (status !== 'published') {
    return <Badge variant="outline">未发布到 WP</Badge>;
  }

  if (needsSyncToWordPress) {
    return <Badge variant="warning">待同步 WordPress</Badge>;
  }

  if (hasWordPressSync) {
    return <Badge variant="success">已同步 WordPress</Badge>;
  }

  return <Badge variant="outline">待发布到 WordPress</Badge>;
}
