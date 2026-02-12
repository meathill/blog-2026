import { describe, expect, it } from 'vitest';
import { buildAppSlug } from '@/lib/app-slug';

describe('buildAppSlug', () => {
  it('should convert spaces to hyphen and lowercase', () => {
    expect(buildAppSlug('  Hello World  ')).toBe('hello-world');
  });

  it('should remove symbols and keep letters/numbers', () => {
    expect(buildAppSlug('C++ Builder 2.0')).toBe('c-builder-20');
  });

  it('should collapse repeated separators', () => {
    expect(buildAppSlug('a---b___c')).toBe('a-b-c');
  });
});
