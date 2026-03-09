import type { ImageLoaderProps } from 'next/image';

const TRANSFORM_PREFIX = '/cdn-cgi/image';

function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== 'production';
}

function normalizeWidth(width: number) {
  return Number.isFinite(width) && width > 0 ? Math.round(width) : 1200;
}

function normalizeQuality(quality: number | undefined) {
  if (quality === undefined) {
    return undefined;
  }

  const nextQuality = Math.round(quality);
  if (!Number.isFinite(nextQuality)) {
    return undefined;
  }

  return Math.min(100, Math.max(1, nextQuality));
}

export function buildCloudflareImageUrl({ src, width, quality }: ImageLoaderProps) {
  const normalizedSource =
    src.trim().startsWith('/') && !src.trim().startsWith('//') ? src.trim().slice(1) : src.trim();
  const options = [`fit=scale-down`, `format=auto`, `width=${normalizeWidth(width)}`];
  const normalizedQuality = normalizeQuality(quality);

  if (normalizedQuality !== undefined) {
    options.push(`quality=${normalizedQuality}`);
  }

  return `${TRANSFORM_PREFIX}/${options.join(',')}/${normalizedSource}`;
}

export default function cloudflareImageLoader(props: ImageLoaderProps) {
  if (isDevelopmentRuntime()) {
    return props.src;
  }

  return buildCloudflareImageUrl(props);
}
