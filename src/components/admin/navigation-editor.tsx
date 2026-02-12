'use client';

import { type DragEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NavItem } from '@/components/layout/header/types';
import { serializeEditorItems, useNavigationEditorStore } from '@/components/admin/navigation-editor/store';
import { hasInvalidEditorItems, toNavItems, type EditorNavItem } from '@/components/admin/navigation-editor/utils';

interface NavigationEditorProps {
  locale: 'zh' | 'en';
  hasCustomConfig: boolean;
  initialItems: NavItem[];
  parseWarning?: string | null;
}

interface DragContext {
  parentId: string | null;
  fromIndex: number;
}

interface DropTarget {
  parentId: string | null;
  toIndex: number;
}

interface PreviewProps {
  items: NavItem[];
}

function PreviewDesktop({ items }: PreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">桌面导航预览</p>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={`${item.href}-${item.label}`} className="min-w-36 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center gap-1 text-sm font-semibold text-zinc-800">
              <span>{item.label}</span>
              {item.external && <ExternalLinkIcon size={12} className="text-zinc-500" />}
            </div>
            <p className="mt-1 text-xs text-zinc-500 break-all">{item.href}</p>
            {item.children && item.children.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-zinc-200 pt-2">
                {item.children.map((child) => (
                  <div
                    key={`${child.href}-${child.label}`}
                    className="rounded border border-zinc-200 bg-white px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-700">
                      <span>{child.label}</span>
                      {child.external && <ExternalLinkIcon size={10} className="text-zinc-500" />}
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500 break-all">{child.href}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewMobile({ items }: PreviewProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">移动导航预览</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.href}-${item.label}`} className="rounded-md border border-zinc-200 bg-zinc-50">
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-800">
              <span>{item.label}</span>
              {item.children && item.children.length > 0 && <ChevronDownIcon size={14} className="text-zinc-500" />}
            </div>
            <div className="px-3 pb-2 text-xs text-zinc-500 break-all">{item.href}</div>
            {item.children && item.children.length > 0 && (
              <div className="space-y-1 border-t border-zinc-200 px-3 py-2">
                {item.children.map((child) => (
                  <div
                    key={`${child.href}-${child.label}`}
                    className="rounded border border-zinc-200 bg-white px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-700">
                      <span>{child.label}</span>
                      {child.external && <ExternalLinkIcon size={10} className="text-zinc-500" />}
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500 break-all">{child.href}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NavigationEditor({ locale, hasCustomConfig, initialItems, parseWarning }: NavigationEditorProps) {
  const items = useNavigationEditorStore((state) => state.items);
  const initialize = useNavigationEditorStore((state) => state.initialize);
  const addRootItem = useNavigationEditorStore((state) => state.addRootItem);
  const addChildItem = useNavigationEditorStore((state) => state.addChildItem);
  const updateItem = useNavigationEditorStore((state) => state.updateItem);
  const removeItem = useNavigationEditorStore((state) => state.removeItem);
  const moveRootItem = useNavigationEditorStore((state) => state.moveRootItem);
  const moveChildItem = useNavigationEditorStore((state) => state.moveChildItem);

  const [dragContext, setDragContext] = useState<DragContext | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    initialize(initialItems);
    setCollapsedMap({});
  }, [initialize, initialItems]);

  const serializedItems = useMemo(() => {
    return serializeEditorItems(items);
  }, [items]);

  const previewItems = useMemo(() => {
    return toNavItems(items);
  }, [items]);

  const hasInvalidItems = useMemo(() => {
    if (items.length === 0) {
      return true;
    }
    return hasInvalidEditorItems(items);
  }, [items]);

  function moveItem(parentId: string | null, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    if (parentId === null) {
      moveRootItem(fromIndex, toIndex);
      return;
    }
    moveChildItem(parentId, fromIndex, toIndex);
  }

  function handleDragStart(parentId: string | null, fromIndex: number) {
    setDragContext({ parentId, fromIndex });
  }

  function handleDragOver(event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) {
    event.preventDefault();
    if (!dragContext) {
      return;
    }
    if (dragContext.parentId !== parentId) {
      setDropTarget(null);
      return;
    }
    setDropTarget({ parentId, toIndex });
  }

  function handleDrop(event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) {
    event.preventDefault();
    if (!dragContext) {
      return;
    }
    if (dragContext.parentId !== parentId) {
      setDragContext(null);
      setDropTarget(null);
      return;
    }
    moveItem(parentId, dragContext.fromIndex, toIndex);
    setDragContext(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDragContext(null);
    setDropTarget(null);
  }

  function toggleCollapsed(itemId: string) {
    setCollapsedMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  function renderEditorItems(list: EditorNavItem[], parentId: string | null, depth: number): ReactNode {
    return list.map((item, index) => {
      const isCollapsed = collapsedMap[item.id] === true;
      const isDropTarget = dropTarget?.parentId === parentId && dropTarget.toIndex === index;
      const hasChildren = item.children.length > 0;
      const hasFieldError = !item.label.trim() || !item.href.trim();
      const containerPadding = depth === 0 ? '' : 'ml-5 border-l border-zinc-200 pl-4';

      return (
        <div key={item.id} className={`space-y-3 ${containerPadding}`}>
          <div
            onDragOver={(event) => handleDragOver(event, parentId, index)}
            onDrop={(event) => handleDrop(event, parentId, index)}
            className={`rounded-lg border bg-white p-3 transition ${
              isDropTarget ? 'border-amber-400 ring-2 ring-amber-200' : 'border-zinc-200'
            } ${hasFieldError ? 'border-rose-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(parentId, index)}
                  onDragEnd={handleDragEnd}
                  className="rounded border border-zinc-200 bg-white p-1 text-zinc-500 hover:bg-zinc-50 cursor-grab active:cursor-grabbing"
                  title="拖拽排序"
                >
                  <GripVerticalIcon size={14} />
                </button>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(item.id)}
                    className="rounded border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-50"
                    title={isCollapsed ? '展开子导航' : '折叠子导航'}
                  >
                    {isCollapsed ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}
                  </button>
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-dashed border-zinc-200 text-[10px] text-zinc-400">
                    子项
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addChildItem(item.id)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  + 子导航
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Trash2Icon size={12} className="inline-block align-[-1px]" /> 删除
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1.4fr_auto]">
              <div>
                <p className="mb-1 text-xs text-zinc-500">标题</p>
                <Input
                  value={item.label}
                  onChange={(event) => updateItem(item.id, { label: event.target.value })}
                  placeholder="例如：技术"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">链接</p>
                <Input
                  value={item.href}
                  onChange={(event) => updateItem(item.id, { href: event.target.value })}
                  placeholder="例如：/tech 或 https://example.com"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-600 md:mt-6">
                <input
                  type="checkbox"
                  checked={item.external}
                  onChange={(event) => updateItem(item.id, { external: event.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                外链
              </label>
            </div>

            {hasFieldError && <p className="mt-2 text-xs text-rose-600">标题和链接都不能为空。</p>}
          </div>

          {hasChildren && !isCollapsed && (
            <div className="space-y-3">{renderEditorItems(item.children, item.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="itemsJson" value={serializedItems} />

      {parseWarning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {parseWarning}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            当前语言：<span className="font-medium text-zinc-700">{locale.toUpperCase()}</span>
            {hasCustomConfig ? '（使用自定义配置）' : '（当前是默认配置）'}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addRootItem}>
            <PlusIcon size={14} />
            添加顶级导航
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
              暂无导航项，先新增一个顶级导航吧。
            </div>
          ) : (
            renderEditorItems(items, null, 0)
          )}
        </div>

        <div className="space-y-4 xl:col-span-2">
          <PreviewDesktop items={previewItems} />
          <PreviewMobile items={previewItems} />
          <details className="rounded-lg border border-zinc-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">查看 JSON（调试用）</summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700">
              {JSON.stringify(previewItems, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={hasInvalidItems}
          className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          保存导航配置
        </button>
        {hasInvalidItems && <p className="text-xs text-rose-600">请先修复空标题或空链接后再保存。</p>}
      </div>
    </div>
  );
}
