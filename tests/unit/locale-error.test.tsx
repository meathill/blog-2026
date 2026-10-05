import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LocaleError from '@/app/[locale]/error';

describe('LocaleError', () => {
  it('应渲染 500 文案与恢复入口，重试按钮触发 reset', () => {
    const reset = vi.fn();
    render(<LocaleError error={new Error('WordPress API error: 524')} reset={reset} />);

    expect(screen.getByRole('heading', { name: '服务器开小差了' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /重试/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('link', { name: /返回首页/i })).toHaveAttribute('href', '/');
  });
});
