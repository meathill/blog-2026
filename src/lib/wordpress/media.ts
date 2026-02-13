import { cache } from 'react';
import { wpFetch } from './client';
import { WPMedia } from './types';

export const getMediaBySlug = cache(async (slug: string): Promise<WPMedia | null> => {
  const media = await wpFetch<WPMedia[]>(`/media?slug=${encodeURIComponent(slug)}`);
  return media[0] || null;
});

export const getMediaById = cache(async (id: number): Promise<WPMedia | null> => {
  return wpFetch<WPMedia>(`/media/${id}`);
});
