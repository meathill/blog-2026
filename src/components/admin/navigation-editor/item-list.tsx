import { type DragEvent, type ReactNode } from 'react';
import { NavigationEditorItemCard } from '@/components/admin/navigation-editor/item-card';
import type { DropTarget, NavigationEditorPatch } from '@/components/admin/navigation-editor/types';
import type { EditorNavItem } from '@/components/admin/navigation-editor/utils';

interface NavigationEditorItemListProps {
  items: EditorNavItem[];
  parentId: string | null;
  depth: number;
  canEditChildren: boolean;
  collapsedMap: Record<string, boolean>;
  dropTarget: DropTarget | null;
  onToggleCollapsed: (itemId: string) => void;
  onDragStart: (parentId: string | null, fromIndex: number) => void;
  onDragOver: (event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) => void;
  onDrop: (event: DragEvent<HTMLElement>, parentId: string | null, toIndex: number) => void;
  onDragEnd: () => void;
  onAddChild: (parentId: string) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, patch: NavigationEditorPatch) => void;
}

export function NavigationEditorItemList({
  items,
  parentId,
  depth,
  canEditChildren,
  collapsedMap,
  dropTarget,
  onToggleCollapsed,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddChild,
  onRemove,
  onUpdate,
}: NavigationEditorItemListProps): ReactNode {
  return items.map((item, index) => {
    const isCollapsed = collapsedMap[item.id] === true;
    const isDropTarget = dropTarget?.parentId === parentId && dropTarget.toIndex === index;
    const containerPadding = depth === 0 ? '' : 'ml-5 border-l border-zinc-200 pl-4 dark:border-zinc-700';

    return (
      <div key={item.id} className={`space-y-3 ${containerPadding}`}>
        <NavigationEditorItemCard
          item={item}
          index={index}
          parentId={parentId}
          canEditChildren={canEditChildren}
          isCollapsed={isCollapsed}
          isDropTarget={isDropTarget}
          onToggleCollapsed={onToggleCollapsed}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onAddChild={onAddChild}
          onRemove={onRemove}
          onUpdate={onUpdate}
        >
          <div className="space-y-3">
            <NavigationEditorItemList
              items={item.children}
              parentId={item.id}
              depth={depth + 1}
              canEditChildren={canEditChildren}
              collapsedMap={collapsedMap}
              dropTarget={dropTarget}
              onToggleCollapsed={onToggleCollapsed}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          </div>
        </NavigationEditorItemCard>
      </div>
    );
  });
}
