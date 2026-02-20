import { cache } from 'react';
import { wpFetch } from './client';
import { WPUser } from './types';

export const getUserBySlug = cache(async (slug: string): Promise<WPUser | null> => {
  const users = await wpFetch<WPUser[]>(`/users?slug=${encodeURIComponent(slug)}`);
  return users[0] || null;
});
