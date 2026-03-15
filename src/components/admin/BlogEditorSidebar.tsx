import { ExternalLinkIcon, ImageUpIcon, LoaderCircleIcon, SaveIcon, SendHorizonalIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogEditorSidebarProps {
  mode: 'create' | 'edit';
  isBusy: boolean;
  isUploadingCover: boolean;
  activeIntent: 'save' | 'publish' | null;
  coverImage: string;
  categoriesInput: string;
  tagsInput: string;
  categoryPreview: string[];
  tagPreview: string[];
  previewPath: string | null;
  onCoverImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCoverUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onCategoriesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTagsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveClick: () => void;
  onPublishClick: () => void;
  onBackClick: () => void;
}

export default function BlogEditorSidebar({
  mode,
  isBusy,
  isUploadingCover,
  activeIntent,
  coverImage,
  categoriesInput,
  tagsInput,
  categoryPreview,
  tagPreview,
  previewPath,
  onCoverImageChange,
  onCoverUpload,
  onCategoriesChange,
  onTagsChange,
  onSaveClick,
  onPublishClick,
  onBackClick,
}: BlogEditorSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>发布信息</CardTitle>
          <CardDescription>封面、分类和标签会在发布时一并同步到 WordPress。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">封面图</span>
            <div className="flex gap-2">
              <input
                name="coverImage"
                value={coverImage}
                onChange={onCoverImageChange}
                placeholder="https://..."
                className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                {isUploadingCover ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ImageUpIcon className="size-4" />}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onCoverUpload}
                  disabled={isUploadingCover}
                />
              </label>
            </div>
          </label>

          {coverImage && (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/30">
              <img src={coverImage} alt="封面预览" className="aspect-[16/9] w-full object-cover" />
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">分类</span>
            <input
              name="categoriesInput"
              value={categoriesInput}
              onChange={onCategoriesChange}
              placeholder="技术, 前端, 生活"
              className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            <TagPreview items={categoryPreview} emptyLabel="尚未设置分类" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">标签</span>
            <input
              name="tagsInput"
              value={tagsInput}
              onChange={onTagsChange}
              placeholder="react, nextjs, markdown"
              className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            <TagPreview items={tagPreview} emptyLabel="尚未设置标签" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>操作</CardTitle>
          <CardDescription>保存只写入 D1，点击发布才会真正同步 WordPress。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="submit" onClick={onSaveClick} disabled={isBusy} className="w-full" variant="outline">
            {activeIntent === 'save' ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
            {activeIntent === 'save' ? '保存中…' : '保存草稿'}
          </Button>
          <Button type="submit" onClick={onPublishClick} disabled={isBusy} className="w-full">
            {activeIntent === 'publish' ? <LoaderCircleIcon className="animate-spin" /> : <SendHorizonalIcon />}
            {activeIntent === 'publish'
              ? '发布中…'
              : mode === 'create'
                ? '发布到 WordPress'
                : '更新 WordPress 文章'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onBackClick}>
            返回上一页
          </Button>

          {previewPath && (
            <a
              href={previewPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ExternalLinkIcon className="size-4" />
              预览公开页面
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TagPreviewProps {
  items: string[];
  emptyLabel: string;
}

function TagPreview({ items, emptyLabel }: TagPreviewProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}
