// Apps 域共享类型（2026-09 维护从 apps-core.ts 抽出：类型与 DB 逻辑分离，
// actions/mcp 等只需类型时不再拖入 next/cache 等服务端依赖）。

export type AppStatus = 'published' | 'draft' | 'archived';
export type AppImageType = 'cover' | 'screenshot';
export type AppLocale = 'en' | 'zh';

export interface AppRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  url: string | null;
  repoUrl: string | null;
  status: AppStatus;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface AppImageRow {
  id: string;
  appId: string;
  url: string;
  alt: string | null;
  type: AppImageType | null;
  sortOrder: number | null;
  createdAt: Date;
}

export interface AppTagRow {
  id: string;
  name: string;
  slug: string;
}

export interface AppTranslationRow {
  id: string;
  appId: string;
  locale: string;
  name: string | null;
  description: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppFull extends AppRow {
  images: AppImageRow[];
  tags: AppTagRow[];
  translations: AppTranslationRow[];
}

export interface CreateAppInput {
  name: string;
  description?: string | null;
  content?: string | null;
  icon?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  slug?: string;
  status?: AppStatus;
  featured?: boolean;
  sortOrder?: number;
  tagIds?: string[];
  translations?: Array<{
    locale: AppLocale;
    name?: string | null;
    description?: string | null;
    content?: string | null;
  }>;
  images?: Array<{
    url: string;
    alt?: string | null;
    type?: AppImageType;
    sortOrder?: number;
  }>;
}

export interface UpdateAppPatch {
  name?: string;
  description?: string | null;
  content?: string | null;
  icon?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  slug?: string;
  status?: AppStatus;
  featured?: boolean;
  sortOrder?: number;
}
