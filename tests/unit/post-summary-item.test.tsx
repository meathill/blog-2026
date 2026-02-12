import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostSummaryItem } from '@/components/posts/post-summary-item';

describe('PostSummaryItem', () => {
  it('应渲染 timeline 样式条目', () => {
    render(
      <ul>
        <PostSummaryItem
          href="/posts/hello-world"
          title="Hello World"
          dateText="02-12"
          readingTimeText="3分钟"
          categoryText="技术"
          variant="timeline"
        />
      </ul>,
    );

    expect(screen.getByRole('link', { name: /Hello World/i })).toHaveAttribute('href', '/posts/hello-world');
    expect(screen.getByText('02-12')).toBeInTheDocument();
    expect(screen.getByText('3分钟')).toBeInTheDocument();
    expect(screen.getByText('技术')).toBeInTheDocument();
  });

  it('应渲染 search 样式条目并展示摘要', () => {
    render(
      <ul>
        <PostSummaryItem
          href="/posts/search-result"
          title="Search Result"
          dateText="2026-02-12"
          readingTimeText="8分钟"
          categoryText="随笔"
          excerptText="这是一段摘要内容"
          variant="search"
        />
      </ul>,
    );

    expect(screen.getByRole('link', { name: /Search Result/i })).toHaveAttribute('href', '/posts/search-result');
    expect(screen.getByText('这是一段摘要内容')).toBeInTheDocument();
    expect(screen.getByText('2026-02-12')).toBeInTheDocument();
    expect(screen.getByText('8分钟')).toBeInTheDocument();
    expect(screen.getByText('随笔')).toBeInTheDocument();
  });
});
