import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeaturedImage from '@/components/posts/featured-image';

describe('FeaturedImage', () => {
  it('应输出 LCP 关键加载属性', () => {
    render(<FeaturedImage src="https://example.com/cover.jpg" alt="示例封面图" />);

    const image = screen.getByRole('img', { name: '示例封面图' });

    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('quality', '70');
    expect(image).toHaveAttribute('sizes', '(max-width: 768px) calc(100vw - 2rem), (max-width: 1200px) 768px, 896px');
  });
});
