import type { NavItem } from '@/components/layout/header/types';

export interface NavigationEditorProps {
  locale: 'zh' | 'en';
  section: 'header' | 'footer';
  hasCustomConfig: boolean;
  initialItems: NavItem[];
  parseWarning?: string | null;
}

export interface DragContext {
  parentId: string | null;
  fromIndex: number;
}

export interface DropTarget {
  parentId: string | null;
  toIndex: number;
}

export interface NavigationEditorPatch {
  href?: string;
  label?: string;
  external?: boolean;
}
