import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BlogLinkToolbar from '@/components/admin/BlogLinkToolbar';

const mockEditLink = vi.fn();
const mockDeleteLink = vi.fn();

vi.mock('@blocknote/react', () => ({
  useExtension: vi.fn(() => ({
    editLink: mockEditLink,
    deleteLink: mockDeleteLink,
  })),
}));

describe('BlogLinkToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('针对站内链接展示「站内链接」标识，不提供切换 nofollow 选项', () => {
    render(<BlogLinkToolbar url="/posts/my-cool-post" text="本站文章" range={{ from: 0, to: 10 }} />);

    expect(screen.getByText('站内链接')).toBeInTheDocument();
    expect(screen.queryByText('nofollow')).not.toBeInTheDocument();
    expect(screen.queryByText('友链 (dofollow)')).not.toBeInTheDocument();
  });

  it('针对普通外部链接默认展示 nofollow，并支持一键切换为友链 (dofollow)', () => {
    render(<BlogLinkToolbar url="https://friend.com" text="外部网站" range={{ from: 10, to: 20 }} />);

    const toggleBtn = screen.getByRole('button', { name: /nofollow/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    // 应该把 url 编码为带有 #__dofollow 的格式，调用 editLink
    expect(mockEditLink).toHaveBeenCalledWith('https://friend.com#__dofollow', '外部网站', 10);
  });

  it('针对已带有 dofollow 标记的交换链接展示「友链 (dofollow)」，并支持一键切回 nofollow', () => {
    render(<BlogLinkToolbar url="https://friend.com#__dofollow" text="交换友链" range={{ from: 5, to: 15 }} />);

    const toggleBtn = screen.getByRole('button', { name: /友链 \(dofollow\)/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    // 应该把 url 剥离标记，调用 editLink
    expect(mockEditLink).toHaveBeenCalledWith('https://friend.com', '交换友链', 5);
  });

  it('点击编辑按钮展开编辑表单，支持修改并勾选交换友链', () => {
    const setToolbarPositionFrozen = vi.fn();
    render(
      <BlogLinkToolbar
        url="https://partner.org"
        text="合作伙伴"
        range={{ from: 0, to: 8 }}
        setToolbarPositionFrozen={setToolbarPositionFrozen}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    expect(setToolbarPositionFrozen).toHaveBeenCalledWith(true);

    // 表单展开
    const urlInput = screen.getByPlaceholderText('https://example.com');
    const textInput = screen.getByPlaceholderText('链接显示文字');
    const checkbox = screen.getByRole('checkbox');

    expect(urlInput).toHaveValue('https://partner.org');
    expect(textInput).toHaveValue('合作伙伴');
    expect(checkbox).not.toBeChecked(); // 默认是 nofollow，所以 checkbox（交换友链）未勾选

    // 勾选交换友链
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // 点击保存
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(mockEditLink).toHaveBeenCalledWith('https://partner.org#__dofollow', '合作伙伴', 0);
  });

  it('点击删除按钮能够调用 deleteLink 并关闭工具栏', () => {
    const setToolbarOpen = vi.fn();
    render(
      <BlogLinkToolbar
        url="https://example.com"
        text="待删链接"
        range={{ from: 20, to: 30 }}
        setToolbarOpen={setToolbarOpen}
      />,
    );

    const deleteBtn = screen.getByTitle('取消链接');
    fireEvent.click(deleteBtn);

    expect(mockDeleteLink).toHaveBeenCalledWith(20);
    expect(setToolbarOpen).toHaveBeenCalledWith(false);
  });
});
