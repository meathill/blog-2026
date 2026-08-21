import type { LucideIcon } from 'lucide-react';
import { BracesIcon, FileDownIcon, FileTextIcon, ImageIcon, ScanSearchIcon } from 'lucide-react';

export interface Localized {
  zh: string;
  en: string;
  ja?: string;
  es?: string;
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
    name: {
      zh: '图片格式转换',
      en: 'Image Converter',
      ja: '画像フォーマット変換',
      es: 'Convertidor de Imágenes',
    },
    description: {
      zh: 'PNG / JPG / WebP / HEIC / BMP / AVIF 互转与缩放，本地处理不上传。',
      en: 'Convert and resize PNG / JPG / WebP / HEIC / BMP / AVIF locally — nothing uploaded.',
      ja: 'WebP / PNG / JPG / BMP / HEIC / AVIF をブラウザ上でローカル相互変換・リサイズ。',
      es: 'Convertir BMP a JPG, WebP a PNG, HEIC y más en local — sin subir archivos.',
    },
  },
  {
    path: '/tools/pdf-text-editor',
    icon: FileTextIcon,
    name: {
      zh: 'PDF 文字编辑',
      en: 'PDF Text Editor',
      ja: 'PDF テキストエディタ',
      es: 'Editor de Texto PDF',
    },
    description: {
      zh: '免费在线 PDF 文本编辑器，直接在浏览器里修改 PDF 中的文字。',
      en: 'Free online PDF text editor — edit text inside a PDF right in your browser.',
      ja: '無料オンライン PDF テキストエディタ — ブラウザ上で直接 PDF の文字を編集・修正。',
      es: 'Editor de texto PDF online gratis — edita texto de PDF directamente en tu navegador.',
    },
  },
  {
    path: '/tools/json-viewer',
    icon: BracesIcon,
    name: {
      zh: 'JSON 查看器',
      en: 'JSON Viewer',
      ja: 'JSON ビューアー',
      es: 'Visor de JSON',
    },
    description: {
      zh: '格式化、校验与浏览 JSON 数据。',
      en: 'Format, validate, and explore JSON data.',
      ja: 'JSON データのフォーマット・検証・閲覧。',
      es: 'Formatear, validar y explorar datos JSON.',
    },
  },
  {
    path: '/tools/og-image-validator',
    icon: ScanSearchIcon,
    name: {
      zh: 'OG 图校验',
      en: 'OG Image Validator',
      ja: 'OGP 画像チェッカー',
      es: 'Validador de Imagen Open Graph',
    },
    description: {
      zh: '检查页面的 Open Graph 图片与元信息。',
      en: 'Check a page’s Open Graph image and metadata.',
      ja: 'Web ページの OGP 画像とメタデータを検証。',
      es: 'Verifica la imagen Open Graph y los metadatos de una página web.',
    },
  },
  {
    path: '/tools/markdown-to-pdf',
    icon: FileDownIcon,
    name: {
      zh: 'Markdown 转 PDF',
      en: 'Markdown to PDF',
      ja: 'Markdown から PDF 変換',
      es: 'Markdown a PDF',
    },
    description: {
      zh: '把 Markdown 一键导出为清晰排版的 PDF。',
      en: 'Export Markdown to a clean PDF in one click.',
      ja: 'Markdown をワンクリックで美麗な PDF にエクスポート。',
      es: 'Exporta Markdown a un PDF limpio en un solo clic.',
    },
  },
];

export function getAllTools(): Tool[] {
  return TOOLS;
}

export function localizeTool(field: Localized, locale: string): string {
  if (locale === 'ja' && field.ja) return field.ja;
  if (locale === 'es' && field.es) return field.es;
  if (locale === 'en') return field.en;
  if (locale === 'zh') return field.zh;
  return field.en || field.zh;
}
