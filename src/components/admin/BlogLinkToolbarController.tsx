'use client';

import { LinkToolbarExtension } from '@blocknote/core';
import type { LinkToolbarProps } from '@blocknote/react';
import { GenericPopover, useBlockNoteEditor, useEditorDOMElement, useExtension } from '@blocknote/react';
import { type FC, useEffect, useMemo, useState } from 'react';
import BlogLinkToolbar from '@/components/admin/BlogLinkToolbar';

interface BlogLinkData {
  url: string;
  text: string;
  range: { from: number; to: number };
  element: HTMLElement | null;
}

export interface BlogLinkToolbarControllerProps {
  linkToolbar?: FC<LinkToolbarProps>;
  portalElement?: HTMLElement | null;
}

/**
 * 自定义 LinkToolbarController：
 * 彻底移除 BlockNote 官方在整个编辑器上绑定的 mouseover 监听。
 * 避免用户在两行链接很近时，移动鼠标经过第一行导致第二行的工具栏被抢占移走。
 * 仅在光标选中/进入链接、或明确点击链接时激活并锁定工具栏。
 */
export default function BlogLinkToolbarController(props: BlogLinkToolbarControllerProps) {
  const editor = useBlockNoteEditor();
  const editorDom = useEditorDOMElement();
  const linkExtension = useExtension(LinkToolbarExtension);

  const [isOpen, setIsOpen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [linkData, setLinkData] = useState<BlogLinkData | undefined>(undefined);

  useEffect(() => {
    function updateLinkFromSelection() {
      if (isFrozen) return;

      const link = linkExtension.getLinkAtSelection();
      if (!link) {
        setLinkData(undefined);
        setIsOpen(false);
        return;
      }

      const element = linkExtension.getLinkElementAtPos(link.range.from);
      setLinkData({
        url: link.mark.attrs.href,
        text: link.text,
        range: link.range,
        element,
      });
      setIsOpen(true);
    }

    function handleLinkClickCapture(event: MouseEvent) {
      if (event.button !== 0 && event.button !== 1) return;
      if (!(event.target instanceof HTMLElement)) return;

      const anchorEl = event.target.closest('a');
      if (anchorEl && editorDom?.contains(anchorEl)) {
        // 核心：彻底屏蔽在编辑器内部点击超链接造成的跳转与跳出（原生导航与 ProseMirror window.open）
        event.preventDefault();
        event.stopPropagation();

        const link = linkExtension.getLinkAtElement(anchorEl);
        if (link) {
          setLinkData({
            url: link.mark.attrs.href,
            text: link.text,
            range: link.range,
            element: linkExtension.getLinkElementAtPos(link.range.from) || anchorEl,
          });
          setIsOpen(true);
        }
      }
    }

    const unsubChange = editor.onChange(updateLinkFromSelection);
    const unsubSelection = editor.onSelectionChange(updateLinkFromSelection);

    // 在 capture 阶段拦截点击与辅助点击，确保在任何内部 ProseMirror handleClick 执行前截停跳转
    editorDom?.addEventListener('click', handleLinkClickCapture, true);
    editorDom?.addEventListener('auxclick', handleLinkClickCapture, true);

    return () => {
      unsubChange();
      unsubSelection();
      editorDom?.removeEventListener('click', handleLinkClickCapture, true);
      editorDom?.removeEventListener('auxclick', handleLinkClickCapture, true);
    };
  }, [editor, editorDom, linkExtension, isFrozen]);

  const floatingOptions = useMemo(
    () => ({
      useFloatingOptions: {
        open: isOpen,
        onOpenChange: (open: boolean, _event?: unknown, reason?: string) => {
          if (isFrozen) return;
          if (reason === 'escape-key') {
            editor.focus();
          }
          setIsOpen(open);
        },
        placement: 'top-start' as const,
      },
      focusManagerProps: {
        disabled: true,
      },
      elementProps: {
        style: { zIndex: 50 },
      },
    }),
    [isOpen, isFrozen, editor],
  );

  if (!editor.isEditable) return null;

  const ToolbarComponent = props.linkToolbar || BlogLinkToolbar;
  const reference = linkData?.element ? { element: linkData.element } : undefined;

  return (
    <GenericPopover reference={reference} portalElement={props.portalElement} {...floatingOptions}>
      {linkData && (
        <ToolbarComponent
          url={linkData.url}
          text={linkData.text}
          range={linkData.range}
          setToolbarOpen={setIsOpen}
          setToolbarPositionFrozen={setIsFrozen}
        />
      )}
    </GenericPopover>
  );
}
