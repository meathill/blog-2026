import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BlogEditorSidebar from '@/components/admin/BlogEditorSidebar';

describe('BlogEditorSidebar', () => {
  it('应该将主操作按钮与预览入口左对齐', () => {
    render(<BlogEditorSidebar {...createProps()} previewPath="/posts/demo-post" />);

    expect(screen.getByRole('button', { name: 'AI 处理' }).className).toContain('justify-start');
    expect(screen.getByRole('button', { name: '保存草稿' }).className).toContain('justify-start');
    expect(screen.getByRole('button', { name: '发布到 WordPress' }).className).toContain('justify-start');
    expect(screen.getByRole('button', { name: '返回上一页' }).className).toContain('justify-start');
    expect(screen.getByRole('link', { name: '预览公开页面' }).className).toContain('justify-start');
  });

  it('应该在操作区提供 AI 处理按钮并触发回调', () => {
    const onAiProcessClick = vi.fn();

    render(
      <BlogEditorSidebar
        {...createProps({
          onAiProcessClick,
          metadataPreview: {
            slug: '',
            excerpt: '',
            tags: [],
          },
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'AI 处理' }));

    expect(onAiProcessClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Slug：将根据标题和正文补充')).toBeInTheDocument();
    expect(screen.getByText('标签：将根据正文补充标签')).toBeInTheDocument();
  });
});

interface SidebarPropsOverrides {
  previewPath?: string | null;
  metadataPreview?: {
    slug: string;
    excerpt: string;
    tags: string[];
  };
  onAiProcessClick?: () => void;
}

function createProps(overrides: SidebarPropsOverrides = {}) {
  return {
    mode: 'create' as const,
    isBusy: false,
    isUploadingCover: false,
    isGeneratingMetadata: false,
    activeIntent: null,
    coverImage: '',
    categoriesInput: '',
    tagsInput: '',
    categoryPreview: [],
    tagPreview: ['Cloudflare', 'Email Worker'],
    previewPath: overrides.previewPath ?? null,
    metadataPreview: overrides.metadataPreview ?? {
      slug: 'cloudflare-email-worker',
      excerpt: '自动化处理企业邮件流转。',
      tags: ['Cloudflare', 'Email Worker'],
    },
    onCoverImageChange: vi.fn(),
    onCoverUpload: vi.fn(),
    onCategoriesChange: vi.fn(),
    onTagsChange: vi.fn(),
    onAiProcessClick: overrides.onAiProcessClick ?? vi.fn(),
    onSaveClick: vi.fn(),
    onPublishClick: vi.fn(),
    onBackClick: vi.fn(),
  };
}
