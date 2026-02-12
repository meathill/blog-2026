import type { NavItem } from '@/components/layout/header/types';

export interface EditorNavItem {
  id: string;
  href: string;
  label: string;
  external: boolean;
  children: EditorNavItem[];
}

interface EditableFields {
  href: string;
  label: string;
  external: boolean;
}

function generateEditorItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `nav-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultEditorItem(): EditorNavItem {
  return {
    id: generateEditorItemId(),
    href: '/',
    label: '新导航',
    external: false,
    children: [],
  };
}

function normalizeEditableFields(item: Partial<EditableFields>): EditableFields {
  return {
    href: typeof item.href === 'string' ? item.href : '/',
    label: typeof item.label === 'string' ? item.label : '新导航',
    external: item.external === true,
  };
}

export function createEditorItems(navItems: NavItem[]): EditorNavItem[] {
  return navItems.map((item) => {
    const fields = normalizeEditableFields(item);
    return {
      id: generateEditorItemId(),
      ...fields,
      children: createEditorItems(item.children || []),
    };
  });
}

export function toNavItems(editorItems: EditorNavItem[]): NavItem[] {
  return editorItems.map((item) => {
    const children = toNavItems(item.children);
    const navItem: NavItem = {
      href: item.href.trim(),
      label: item.label.trim(),
    };
    if (item.external) {
      navItem.external = true;
    }
    if (children.length > 0) {
      navItem.children = children;
    }
    return navItem;
  });
}

export function moveItemInList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return items;
  }
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

type EditorItemPatch = Partial<Pick<EditorNavItem, 'href' | 'label' | 'external'>>;

export function updateItemById(items: EditorNavItem[], itemId: string, patch: EditorItemPatch): EditorNavItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        ...patch,
      };
    }
    if (item.children.length === 0) {
      return item;
    }
    return {
      ...item,
      children: updateItemById(item.children, itemId, patch),
    };
  });
}

export function removeItemById(items: EditorNavItem[], itemId: string): EditorNavItem[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) => {
      if (item.children.length === 0) {
        return item;
      }
      return {
        ...item,
        children: removeItemById(item.children, itemId),
      };
    });
}

export function appendChildByParentId(
  items: EditorNavItem[],
  parentId: string,
  childItem: EditorNavItem = createDefaultEditorItem(),
): EditorNavItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [...item.children, childItem],
      };
    }
    if (item.children.length === 0) {
      return item;
    }
    return {
      ...item,
      children: appendChildByParentId(item.children, parentId, childItem),
    };
  });
}

export function moveChildrenByParentId(
  items: EditorNavItem[],
  parentId: string,
  fromIndex: number,
  toIndex: number,
): EditorNavItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: moveItemInList(item.children, fromIndex, toIndex),
      };
    }
    if (item.children.length === 0) {
      return item;
    }
    return {
      ...item,
      children: moveChildrenByParentId(item.children, parentId, fromIndex, toIndex),
    };
  });
}

export function hasInvalidEditorItems(items: EditorNavItem[]): boolean {
  return items.some((item) => {
    if (!item.href.trim() || !item.label.trim()) {
      return true;
    }
    return hasInvalidEditorItems(item.children);
  });
}
