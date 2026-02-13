import { type DragEvent, type ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon, GripVerticalIcon, Trash2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { NavigationEditorPatch } from '@/components/admin/navigation-editor/types';
import type { EditorNavItem } from '@/components/admin/navigation-editor/utils';

interface NavigationEditorItemCardProps {
  item: EditorNavItem;
  index: number;
  parentId: string | null;
  canEditChildren: boolean;
  isCollapsed: boolean;
  isDropTarget: boolean;
  onToggleCollapsed: (itemId: string) => void;
  onDragStart: (parentId: string | null, fromIndex: number) => void;
  onDragOver: (event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) => void;
  onDrop: (event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) => void;
  onDragEnd: () => void;
  onAddChild: (parentId: string) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, patch: NavigationEditorPatch) => void;
  children?: ReactNode;
}

export function NavigationEditorItemCard({
  item,
  index,
  parentId,
  canEditChildren,
  isCollapsed,
  isDropTarget,
  onToggleCollapsed,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddChild,
  onRemove,
  onUpdate,
  children,
}: NavigationEditorItemCardProps) {
  const hasChildren = item.children.length > 0;
  const hasVisibleChildren = canEditChildren && hasChildren;
  const hasFieldError = !item.label.trim() || !item.href.trim();

  return (
    <>
      <div
        onDragOver={(event) => onDragOver(event, parentId, index)}
        onDrop={(event) => onDrop(event, parentId, index)}
        className={`rounded-lg border bg-white p-3 transition dark:bg-zinc-900 ${
          isDropTarget ? 'border-amber-400 ring-2 ring-amber-200' : 'border-zinc-200'
        } ${hasFieldError ? 'border-rose-300' : ''} dark:border-zinc-700`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              draggable
              onDragStart={() => onDragStart(parentId, index)}
              onDragEnd={onDragEnd}
              className="cursor-grab rounded border border-zinc-200 bg-white p-1 text-zinc-500 hover:bg-zinc-50 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="拖拽排序"
            >
              <GripVerticalIcon size={14} />
            </button>

            {hasVisibleChildren ? (
              <button
                type="button"
                onClick={() => onToggleCollapsed(item.id)}
                className="rounded border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title={isCollapsed ? '展开子导航' : '折叠子导航'}
              >
                {isCollapsed ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}
              </button>
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-dashed border-zinc-200 text-[10px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                {canEditChildren ? '子项' : 'Footer'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEditChildren && (
              <button
                type="button"
                onClick={() => onAddChild(item.id)}
                className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                + 子导航
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
            >
              <Trash2Icon size={12} className="inline-block align-[-1px]" /> 删除
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1.4fr_auto]">
          <div>
            <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">标题</p>
            <Input
              value={item.label}
              onChange={(event) => onUpdate(item.id, { label: event.target.value })}
              placeholder="例如：技术"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">链接</p>
            <Input
              value={item.href}
              onChange={(event) => onUpdate(item.id, { href: event.target.value })}
              placeholder="例如：/tech 或 https://example.com"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-600 md:mt-6 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={item.external}
              onChange={(event) => onUpdate(item.id, { external: event.target.checked })}
              className="h-4 w-4 rounded border-zinc-300"
            />
            外链
          </label>
        </div>

        {hasFieldError && <p className="mt-2 text-xs text-rose-600">标题和链接都不能为空。</p>}
        {!canEditChildren && hasChildren && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
            Footer 不支持子导航，保存时会自动移除当前项的子项。
          </p>
        )}
      </div>

      {hasVisibleChildren && !isCollapsed && children}
    </>
  );
}
