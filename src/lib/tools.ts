import type { LucideIcon } from 'lucide-react';
import { BracesIcon, FileDownIcon, FileTextIcon, ImageIcon, ScanSearchIcon } from 'lucide-react';

interface Localized {
  zh: string;
  en: string;
}

export interface Tool {
  /** tools.meathill.com 下的路径 */
  path: string;
  icon: LucideIcon;
  name: Localized;
  description: Localized;
}

export const TOOLS_BASE_URL = 'https://tools.meathill.com';

const TOOLS: Tool[] = [
  {
    path: '/tools/image-converter',
    icon: ImageIcon,
    name: { zh: '图片格式转换', en: 'Image Converter' },
    description: {
      zh: 'PNG / JPG / WebP / HEIC 互转与缩放，本地处理不上传。',
      en: 'Convert and resize PNG / JPG / WebP / HEIC locally — nothing uploaded.',
    },
  },
  {
    path: '/tools/pdf-text-editor',
    icon: FileTextIcon,
    name: { zh: 'PDF 文字编辑', en: 'PDF Text Editor' },
    description: { zh: '直接在浏览器里修改 PDF 中的文字。', en: 'Edit text inside a PDF right in your browser.' },
  },
  {
    path: '/tools/json-viewer',
    icon: BracesIcon,
    name: { zh: 'JSON 查看器', en: 'JSON Viewer' },
    description: { zh: '格式化、校验与浏览 JSON 数据。', en: 'Format, validate, and explore JSON data.' },
  },
  {
    path: '/tools/og-image-validator',
    icon: ScanSearchIcon,
    name: { zh: 'OG 图校验', en: 'OG Image Validator' },
    description: { zh: '检查页面的 Open Graph 图片与元信息。', en: 'Check a page’s Open Graph image and metadata.' },
  },
  {
    path: '/tools/markdown-to-pdf',
    icon: FileDownIcon,
    name: { zh: 'Markdown 转 PDF', en: 'Markdown to PDF' },
    description: { zh: '把 Markdown 一键导出为 PDF。', en: 'Export Markdown to a clean PDF in one click.' },
  },
];

export function getAllTools(): Tool[] {
  return TOOLS;
}

export function localizeTool(field: Localized, locale: string): string {
  return locale === 'en' ? field.en : field.zh;
}
