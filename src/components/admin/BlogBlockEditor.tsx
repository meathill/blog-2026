'use client';

import type { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { zh, en } from '@blocknote/core/locales';
import {
  BasicTextStyleButton,
  FormattingToolbar,
  FormattingToolbarController,
  getFormattingToolbarItems,
  useCreateBlockNote,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getInitialBlogBlocks } from '@/lib/blog-blocks';
import { looksLikeMarkdownDocument } from '@/lib/blog-markdown-paste';
import styles from '@/components/admin/BlogBlockEditor.module.css';

interface BlogBlockEditorProps {
  locale: string;
  name: string;
  defaultValue?: string | null;
}

export default function BlogBlockEditor({ locale, name, defaultValue }: BlogBlockEditorProps) {
  const [initialContent] = useState<PartialBlock[]>(() => getInitialBlogBlocks(defaultValue));
  const [serializedValue, setSerializedValue] = useState(() => JSON.stringify(initialContent));
  const [htmlValue, setHtmlValue] = useState('');
  const [markdownValue, setMarkdownValue] = useState('');
  const editor = useCreateBlockNote(
    {
      initialContent,
      dictionary: locale === 'en' ? en : zh,
      pasteHandler: handleEditorPaste,
      uploadFile: uploadEditorFile,
    },
    [locale],
  );

  useEffect(() => {
    setHtmlValue(editor.blocksToHTMLLossy(editor.document));
    setMarkdownValue(editor.blocksToMarkdownLossy(editor.document));
  }, [editor]);

  function handleChange() {
    const blocks = editor.document;
    setSerializedValue(JSON.stringify(blocks));
    setHtmlValue(editor.blocksToHTMLLossy(blocks));
    setMarkdownValue(editor.blocksToMarkdownLossy(blocks));
  }

  return (
    <div className={`${styles.editorRoot} space-y-3`}>
      <input type="hidden" name={name} value={serializedValue} />
      <input type="hidden" name="html" value={htmlValue} />
      <input type="hidden" name="markdown" value={markdownValue} />

      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        formattingToolbar={false}
        className="min-h-[26rem] rounded border border-border/60 bg-background py-4"
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              {[
                ...getFormattingToolbarItems(),
                <BasicTextStyleButton basicTextStyle="code" key="codeStyleButton" />,
              ]}
            </FormattingToolbar>
          )}
        />
      </BlockNoteView>

      <p className="text-sm text-muted-foreground">
        输入 <code>/</code> 可插入标题、列表、引用、代码块、分割线和图片。直接粘贴 Markdown 文本时会自动转换为
        block，图片会直接上传到 R2。
      </p>
    </div>
  );
}

interface BlogPasteHandlerContext {
  event: ClipboardEvent;
  editor: BlockNoteEditor;
  defaultPasteHandler: (options?: {
    prioritizeMarkdownOverHTML?: boolean;
    plainTextAsMarkdown?: boolean;
  }) => boolean | undefined;
}

function handleEditorPaste({ event, editor, defaultPasteHandler }: BlogPasteHandlerContext) {
  if (isSelectionInsideCodeBlock(editor)) {
    return defaultPasteHandler({
      plainTextAsMarkdown: false,
      prioritizeMarkdownOverHTML: false,
    });
  }

  const markdown = readClipboardText(event, 'text/markdown');
  if (markdown) {
    editor.pasteMarkdown(markdown);
    return true;
  }

  const plainText = readClipboardText(event, 'text/plain');
  if (looksLikeMarkdownDocument(plainText)) {
    editor.pasteMarkdown(plainText);
    return true;
  }

  return defaultPasteHandler({
    prioritizeMarkdownOverHTML: true,
    plainTextAsMarkdown: true,
  });
}

function isSelectionInsideCodeBlock(editor: BlockNoteEditor): boolean {
  return editor.transact(
    (transaction) =>
      transaction.selection.$from.parent.type.spec.code === true &&
      transaction.selection.$to.parent.type.spec.code === true,
  );
}

function readClipboardText(event: ClipboardEvent, format: string): string {
  return event.clipboardData?.getData(format)?.trim() || '';
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
