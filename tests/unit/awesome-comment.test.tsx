import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AwesomeComment from '@/components/AwesomeComment';

describe('AwesomeComment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该渲染评论区标题', () => {
    render(<AwesomeComment />);

    expect(screen.getByText('评论')).toBeInTheDocument();
  });

  it('应该渲染评论容器元素', () => {
    render(<AwesomeComment />);

    const container = document.getElementById('awesome-comment');
    expect(container).toBeInTheDocument();
  });

  it('评论区标题应该有正确的样式类', () => {
    render(<AwesomeComment />);

    const heading = screen.getByRole('heading', { name: '评论' });
    expect(heading).toHaveClass('text-xl', 'font-bold');
  });

  it('评论区应该在 section 元素内', () => {
    const { container } = render(<AwesomeComment />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('mt-12', 'pt-8', 'border-t');
  });

  it('评论容器应该有正确的 id', () => {
    render(<AwesomeComment />);

    const container = document.getElementById('awesome-comment');
    expect(container).not.toBeNull();
    expect(container?.tagName.toLowerCase()).toBe('div');
  });
});
