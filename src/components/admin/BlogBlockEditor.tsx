'use client';

import type { PartialBlock } from '@blocknote/core';
import { zh, en } from '@blocknote/core/locales';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useState } from 'react';
import { toast } from 'sonner';
import { getInitialBlogBlocks } from '@/lib/blog-blocks';

interface BlogBlockEditorProps {
  locale: string;
  name: string;
  defaultValue?: string | null;
}

export default function BlogBlockEditor({ locale, name, defaultValue }: BlogBlockEditorProps) {
  const [initialContent] = useState<PartialBlock[]>(() => getInitialBlogBlocks(defaultValue));
  const [serializedValue, setSerializedValue] = useState(() => JSON.stringify(initialContent));
  const editor = useCreateBlockNote(
    {
      initialContent,
      dictionary: locale === 'en' ? en : zh,
      uploadFile: uploadEditorFile,
    },
    [locale],
  );

  function handleChange() {
    setSerializedValue(JSON.stringify(editor.document));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serializedValue} />

      <div className="rounded-[1.5rem] border border-border/80 bg-background/90 p-3 shadow-xs/5">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          className="min-h-[26rem] rounded-[1.25rem] border border-dashed border-border/60 bg-background px-3 py-4"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        输入 <code>/</code> 可插入标题、列表、引用、代码块、分割线和图片。图片会直接上传到 R2。
      </p>
    </div>
  );
}

async function uploadEditorFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    const message = errorData.error || '正文图片上传失败。';
    toast.error(message);
    throw new Error(message);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}
