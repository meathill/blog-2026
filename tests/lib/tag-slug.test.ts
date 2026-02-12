import { describe, expect, it, vi } from 'vitest';
import { normalizeTagSlug, resolveBySlugWithNormalizedFallback } from '@/lib/tag-slug';

describe('normalizeTagSlug', () => {
  it('should normalize uppercase and dots', () => {
    expect(normalizeTagSlug('Next.JS')).toBe('next-js');
  });

  it('should keep hyphenated slug unchanged except lowercase', () => {
    expect(normalizeTagSlug('A-B-C')).toBe('a-b-c');
  });
});

describe('resolveBySlugWithNormalizedFallback', () => {
  it('should return first result when exact slug exists', async () => {
    const resolver = vi.fn(async (slug: string) => (slug === 'react' ? { slug } : null));

    const result = await resolveBySlugWithNormalizedFallback('react', resolver);

    expect(result).toEqual({ slug: 'react' });
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver).toHaveBeenCalledWith('react');
  });

  it('should fallback to normalized slug when first miss', async () => {
    const resolver = vi.fn(async (slug: string) => {
      if (slug === 'next-js') {
        return { slug };
      }
      return null;
    });

    const result = await resolveBySlugWithNormalizedFallback('Next.JS', resolver);

    expect(result).toEqual({ slug: 'next-js' });
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(resolver).toHaveBeenNthCalledWith(1, 'Next.JS');
    expect(resolver).toHaveBeenNthCalledWith(2, 'next-js');
  });

  it('should not call resolver twice when normalized is same', async () => {
    const resolver = vi.fn(async () => null);

    const result = await resolveBySlugWithNormalizedFallback('plain-tag', resolver);

    expect(result).toBeNull();
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver).toHaveBeenCalledWith('plain-tag');
  });
});
