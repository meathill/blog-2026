import { describe, expect, it } from 'vitest';
import {
  appendChildByParentId,
  createEditorItems,
  hasInvalidEditorItems,
  moveChildrenByParentId,
  moveItemInList,
  removeItemById,
  toNavItems,
  updateItemById,
} from '@/components/admin/navigation-editor/utils';
import type { NavItem } from '@/components/layout/header/types';

function createFixture(): NavItem[] {
  return [
    {
      href: '/about',
      label: 'About',
    },
    {
      href: '/tech',
      label: 'Tech',
      children: [
        {
          href: '/category/js',
          label: 'JavaScript',
        },
        {
          href: '/category/ai',
          label: 'AI',
        },
      ],
    },
  ];
}

describe('navigation editor utils', () => {
  it('createEditorItems 与 toNavItems 应保持结构一致', () => {
    const source = createFixture();
    const editorItems = createEditorItems(source);

    expect(editorItems.length).toBe(2);
    expect(editorItems[1].children.length).toBe(2);
    expect(editorItems[0].id).toBeTruthy();
    expect(editorItems[1].children[0].id).toBeTruthy();

    const serialized = toNavItems(editorItems);
    expect(serialized).toEqual(source);
  });

  it('moveItemInList 应按索引移动元素', () => {
    expect(moveItemInList(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItemInList(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItemInList(['a', 'b', 'c'], 2, 9)).toEqual(['a', 'b', 'c']);
  });

  it('updateItemById 应可更新树中的任意节点', () => {
    const editorItems = createEditorItems(createFixture());
    const childId = editorItems[1].children[0].id;

    const updated = updateItemById(editorItems, childId, { label: 'JS' });
    expect(updated[1].children[0].label).toBe('JS');
  });

  it('appendChildByParentId/removeItemById/moveChildrenByParentId 应生效', () => {
    const editorItems = createEditorItems(createFixture());
    const parentId = editorItems[1].id;
    const firstChildId = editorItems[1].children[0].id;

    const appended = appendChildByParentId(editorItems, parentId);
    expect(appended[1].children.length).toBe(3);

    const moved = moveChildrenByParentId(appended, parentId, 0, 2);
    expect(moved[1].children[2].id).toBe(firstChildId);

    const removed = removeItemById(moved, firstChildId);
    expect(removed[1].children.length).toBe(2);
    expect(removed[1].children.some((item) => item.id === firstChildId)).toBe(false);
  });

  it('hasInvalidEditorItems 应识别空 label/href', () => {
    const editorItems = createEditorItems(createFixture());
    expect(hasInvalidEditorItems(editorItems)).toBe(false);

    const invalid = updateItemById(editorItems, editorItems[0].id, { label: '   ' });
    expect(hasInvalidEditorItems(invalid)).toBe(true);
  });
});
