'use client';

import { LinkToolbarExtension } from '@blocknote/core';
import type { LinkToolbarProps } from '@blocknote/react';
import { useExtension } from '@blocknote/react';
import {
  CheckIcon,
  ExternalLinkIcon,
  HandshakeIcon,
  PencilIcon,
  ShieldAlertIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { cleanLinkUrl, encodeLinkUrl, isInternalLink, parseLinkUrl } from '@/lib/blog-links';

export default function BlogLinkToolbar(props: LinkToolbarProps) {
  const { editLink, deleteLink } = useExtension(LinkToolbarExtension);
  const [isEditing, setIsEditing] = useState(false);

  const { cleanUrl, isNofollow, isInternal } = parseLinkUrl(props.url);

  const [editUrl, setEditUrl] = useState(cleanUrl);
  const [editText, setEditText] = useState(props.text);
  const [editIsNofollow, setEditIsNofollow] = useState(isNofollow);

  useEffect(() => {
    const current = parseLinkUrl(props.url);
    setEditUrl(current.cleanUrl);
    setEditText(props.text);
    setEditIsNofollow(current.isNofollow);
  }, [props.url, props.text]);

  function handleQuickToggleDofollow() {
    if (isInternal) return;
    const nextNofollow = !isNofollow;
    const newUrl = encodeLinkUrl(cleanUrl, nextNofollow);
    editLink(newUrl, props.text, props.range.from);
  }

  function handleOpenLink() {
    if (!cleanUrl) return;
    const targetUrl =
      cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')
        ? cleanUrl
        : `https://${cleanUrl}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }

  function handleDeleteLink() {
    deleteLink(props.range.from);
    props.setToolbarOpen?.(false);
  }

  function handleStartEditing() {
    const current = parseLinkUrl(props.url);
    setEditUrl(current.cleanUrl);
    setEditText(props.text);
    setEditIsNofollow(current.isNofollow);
    setIsEditing(true);
    props.setToolbarPositionFrozen?.(true);
  }

  function handleCancelEditing() {
    setIsEditing(false);
    props.setToolbarPositionFrozen?.(false);
  }

  function handleSave(event?: FormEvent) {
    if (event) {
      event.preventDefault();
    }
    const targetCleanUrl = editUrl.trim();
    if (!targetCleanUrl) {
      handleDeleteLink();
      return;
    }
    const finalUrl = encodeLinkUrl(targetCleanUrl, editIsNofollow);
    editLink(finalUrl, editText.trim() || targetCleanUrl, props.range.from);
    setIsEditing(false);
    props.setToolbarPositionFrozen?.(false);
  }

  if (isEditing) {
    const isEditingInternal = isInternalLink(editUrl.trim());
    return (
      <form
        onSubmit={handleSave}
        className="flex w-80 flex-col gap-2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl backdrop-blur-md"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">链接地址 (URL)</label>
          <input
            type="text"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">链接文本</label>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="链接显示文字"
            className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="pt-1">
          {isEditingInternal ? (
            <div className="rounded bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
              本站内部链接自动追踪权重，不添加 nofollow
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded bg-muted/40 px-2 py-1.5 transition-colors hover:bg-muted/70">
              <input
                type="checkbox"
                checked={!editIsNofollow}
                onChange={(e) => setEditIsNofollow(!e.target.checked)}
                className="size-3.5 rounded border-muted-foreground text-primary focus:ring-ring"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">交换友链 (dofollow 传递权重)</span>
                <span className="text-[10px] text-muted-foreground">
                  {editIsNofollow ? '当前为普通外链（带 nofollow）' : '已勾选：发布时将保留权重传递（不带 nofollow）'}
                </span>
              </div>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleCancelEditing}
            className="inline-flex h-7 items-center gap-1 rounded px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-3.5" />
            取消
          </button>
          <button
            type="submit"
            className="inline-flex h-7 items-center gap-1 rounded bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <CheckIcon className="size-3.5" />
            保存
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={handleStartEditing}
        title="编辑链接"
        className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <PencilIcon className="size-3.5" />
        编辑
      </button>

      {isInternal ? (
        <span className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground select-none">站内链接</span>
      ) : (
        <button
          type="button"
          onClick={handleQuickToggleDofollow}
          title={isNofollow ? '点击切换为交换友链 (dofollow)' : '点击切换为普通外链 (nofollow)'}
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs transition-colors ${
            isNofollow
              ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
              : 'bg-emerald-500/10 font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
          }`}
        >
          {isNofollow ? (
            <>
              <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
              <span>nofollow</span>
            </>
          ) : (
            <>
              <HandshakeIcon className="size-3.5 text-emerald-500" />
              <span>友链 (dofollow)</span>
            </>
          )}
        </button>
      )}

      <div className="h-4 w-px bg-border/60" />

      <button
        type="button"
        onClick={handleOpenLink}
        title="新窗口打开"
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <ExternalLinkIcon className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleDeleteLink}
        title="取消链接"
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </div>
  );
}
