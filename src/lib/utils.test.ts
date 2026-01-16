import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('应该合并多个类名', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('应该处理条件类名', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('应该处理对象形式的类名', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });

  it('应该合并 Tailwind 冲突类', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('应该处理 undefined 和 null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});
