'use client';

import { Trash2Icon } from 'lucide-react';
import type * as React from 'react';
import { Button } from '@/components/ui/button';

interface DeleteBlogPostButtonProps {
  action: (formData: FormData) => Promise<void>;
  hasWordPressSync: boolean;
  postTitle: string;
}

export default function DeleteBlogPostButton({ action, hasWordPressSync, postTitle }: DeleteBlogPostButtonProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = hasWordPressSync
      ? `确定删除「${postTitle}」的本地记录吗？已同步到 WordPress 的文章不会被删除。`
      : `确定删除「${postTitle}」吗？`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <Button type="submit" variant="destructive-outline" size="sm" aria-label={`删除文章：${postTitle}`}>
        <Trash2Icon className="size-4" />
        删除
      </Button>
    </form>
  );
}
