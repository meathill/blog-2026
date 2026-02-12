import { describe, expect, it } from 'vitest';
import { shouldSyncToWordPress } from '@/lib/notion-post-backup';

describe('shouldSyncToWordPress', () => {
  it('should return true when publishedAt is null', () => {
    const shouldSync = shouldSyncToWordPress(new Date('2025-01-02T00:00:00.000Z'), null);
    expect(shouldSync).toBe(true);
  });

  it('should return false when lastUpdateTime <= publishedAt + 60s', () => {
    const publishedAt = new Date('2025-01-02T00:00:00.000Z');

    expect(shouldSyncToWordPress(new Date('2025-01-02T00:00:30.000Z'), publishedAt)).toBe(false);
    expect(shouldSyncToWordPress(new Date('2025-01-02T00:01:00.000Z'), publishedAt)).toBe(false);
  });

  it('should return true when lastUpdateTime > publishedAt + 60s', () => {
    const publishedAt = new Date('2025-01-02T00:00:00.000Z');
    const shouldSync = shouldSyncToWordPress(new Date('2025-01-02T00:01:01.000Z'), publishedAt);

    expect(shouldSync).toBe(true);
  });
});
