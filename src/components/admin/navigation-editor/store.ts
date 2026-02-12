'use client';

import { create } from 'zustand';
import type { NavItem } from '@/components/layout/header/types';
import {
  appendChildByParentId,
  createDefaultEditorItem,
  createEditorItems,
  moveChildrenByParentId,
  moveItemInList,
  removeItemById,
  toNavItems,
  updateItemById,
  type EditorNavItem,
} from './utils';

interface NavigationEditorState {
  items: EditorNavItem[];
  initialize: (navItems: NavItem[]) => void;
  addRootItem: () => void;
  addChildItem: (parentId: string) => void;
  updateItem: (itemId: string, patch: Partial<Pick<EditorNavItem, 'href' | 'label' | 'external'>>) => void;
  removeItem: (itemId: string) => void;
  moveRootItem: (fromIndex: number, toIndex: number) => void;
  moveChildItem: (parentId: string, fromIndex: number, toIndex: number) => void;
}

export const useNavigationEditorStore = create<NavigationEditorState>((set) => ({
  items: [],
  initialize(navItems) {
    set({
      items: createEditorItems(navItems),
    });
  },
  addRootItem() {
    set((state) => ({
      items: [...state.items, createDefaultEditorItem()],
    }));
  },
  addChildItem(parentId) {
    set((state) => ({
      items: appendChildByParentId(state.items, parentId),
    }));
  },
  updateItem(itemId, patch) {
    set((state) => ({
      items: updateItemById(state.items, itemId, patch),
    }));
  },
  removeItem(itemId) {
    set((state) => ({
      items: removeItemById(state.items, itemId),
    }));
  },
  moveRootItem(fromIndex, toIndex) {
    set((state) => ({
      items: moveItemInList(state.items, fromIndex, toIndex),
    }));
  },
  moveChildItem(parentId, fromIndex, toIndex) {
    set((state) => ({
      items: moveChildrenByParentId(state.items, parentId, fromIndex, toIndex),
    }));
  },
}));

export function serializeEditorItems(items: EditorNavItem[]): string {
  return JSON.stringify(toNavItems(items));
}
