'use client';

import { type DragEvent, useEffect, useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavigationEditorItemList } from '@/components/admin/navigation-editor/item-list';
import { normalizeFooterNavItems, NavigationPreview } from '@/components/admin/navigation-editor/preview';
import { useNavigationEditorStore } from '@/components/admin/navigation-editor/store';
import type {
  DragContext,
  DropTarget,
  NavigationEditorPatch,
  NavigationEditorProps,
} from '@/components/admin/navigation-editor/types';
import { hasInvalidEditorItems, toNavItems } from '@/components/admin/navigation-editor/utils';

export function NavigationEditor({
  locale,
  section,
  hasCustomConfig,
  initialItems,
  parseWarning,
}: NavigationEditorProps) {
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
  const canEditChildren = section === 'header';

  useEffect(() => {
    initialize(initialItems);
    setCollapsedMap({});
  }, [initialize, initialItems]);

  const previewItems = useMemo(() => {
    const navItems = toNavItems(items);
    if (section === 'footer') {
      return normalizeFooterNavItems(navItems);
    }
    return navItems;
  }, [items, section]);

  const serializedItems = useMemo(() => {
    return JSON.stringify(previewItems);
  }, [previewItems]);

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

  function handleUpdateItem(itemId: string, patch: NavigationEditorPatch) {
    updateItem(itemId, patch);
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="itemsJson" value={serializedItems} />

      {parseWarning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          {parseWarning}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            当前语言：<span className="font-medium text-zinc-700 dark:text-zinc-100">{locale.toUpperCase()}</span>
            {' · '}
            区域：<span className="font-medium text-zinc-700 dark:text-zinc-100">{section.toUpperCase()}</span>
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
          {!canEditChildren && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Footer 仅支持顶级链接，不支持子导航。
            </div>
          )}
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              暂无导航项，先新增一个顶级导航吧。
            </div>
          ) : (
            <NavigationEditorItemList
              items={items}
              parentId={null}
              depth={0}
              canEditChildren={canEditChildren}
              collapsedMap={collapsedMap}
              dropTarget={dropTarget}
              onToggleCollapsed={toggleCollapsed}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onAddChild={addChildItem}
              onRemove={removeItem}
              onUpdate={handleUpdateItem}
            />
          )}
        </div>

        <div className="space-y-4 xl:col-span-2">
          <NavigationPreview section={section} items={previewItems} />
          <details className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">
              查看 JSON（调试用）
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
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
