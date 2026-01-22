'use client';

import { useState, useCallback, useMemo } from 'react';
import { EyeIcon, EditIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marked } from 'marked';

interface MarkdownEditorProps {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}

export default function MarkdownEditor({
  name,
  defaultValue = '',
  rows = 10,
  placeholder = '支持 Markdown 语法...',
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [isPreview, setIsPreview] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

  // Convert markdown to HTML for preview
  const previewHtml = useMemo(() => {
    if (!value) return '';
    return marked(value) as string;
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Content (Markdown)
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors',
              !isPreview
                ? 'bg-amber-600 text-white'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <EditIcon size={14} />
            编辑
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors',
              isPreview
                ? 'bg-amber-600 text-white'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <EyeIcon size={14} />
            预览
          </button>
        </div>
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {isPreview ? (
        <div
          className="prose prose-sm max-w-none p-4 min-h-[240px] rounded-lg border border-input bg-transparent overflow-auto"
          dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-muted-foreground italic">暂无内容</p>' }}
        />
      ) : (
        <textarea
          value={value}
          onChange={handleChange}
          rows={rows}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono text-sm"
        />
      )}

      <p className="text-xs text-muted-foreground">
        支持 Markdown 语法，包括标题、列表、链接、代码块等
      </p>
    </div>
  );
}

