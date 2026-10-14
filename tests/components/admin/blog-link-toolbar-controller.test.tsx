import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BlogLinkToolbarController from '@/components/admin/BlogLinkToolbarController';

const mockGetLinkAtSelection = vi.fn();
const mockGetLinkElementAtPos = vi.fn();
const mockGetLinkAtElement = vi.fn();

let selectionChangeCallback: (() => void) | null = null;

const mockEditor = {
  isEditable: true,
  focus: vi.fn(),
  onChange: vi.fn(() => () => {}),
  onSelectionChange: vi.fn((cb: () => void) => {
    selectionChangeCallback = cb;
    return () => {
      selectionChangeCallback = null;
    };
  }),
};

let mockEditorDom: HTMLDivElement | null = null;

vi.mock('@blocknote/react', () => ({
  useBlockNoteEditor: () => mockEditor,
  useEditorDOMElement: () => mockEditorDom,
  useExtension: () => ({
    getLinkAtSelection: mockGetLinkAtSelection,
    getLinkElementAtPos: mockGetLinkElementAtPos,
    getLinkAtElement: mockGetLinkAtElement,
    editLink: vi.fn(),
    deleteLink: vi.fn(),
  }),
  GenericPopover: ({
    children,
    useFloatingOptions,
  }: {
    children: ReactNode;
    useFloatingOptions?: { open?: boolean };
  }) => {
    if (!useFloatingOptions?.open) return null;
    return <div data-testid="popover-root">{children}</div>;
  },
}));

describe('BlogLinkToolbarController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectionChangeCallback = null;
    mockEditorDom = document.createElement('div');
  });

  it('光标进入链接时激活工具栏，展示当前链接信息', () => {
    const fakeAnchor = document.createElement('a');
    mockGetLinkElementAtPos.mockReturnValue(fakeAnchor);
    mockGetLinkAtSelection.mockReturnValue({
      range: { from: 10, to: 20 },
      mark: { attrs: { href: 'https://line2-link.com' } },
      text: 'Line 2 Link',
    });

    const MockToolbar = (props: { url: string; text: string }) => (
      <div data-testid="custom-toolbar" data-url={props.url}>
        {props.text}
      </div>
    );

    render(<BlogLinkToolbarController linkToolbar={MockToolbar as never} />);

    // 触发光标选区进入链接
    act(() => {
      selectionChangeCallback?.();
    });

    expect(screen.getByTestId('popover-root')).toBeInTheDocument();
    expect(screen.getByTestId('custom-toolbar')).toHaveAttribute('data-url', 'https://line2-link.com');
    expect(screen.getByText('Line 2 Link')).toBeInTheDocument();
  });

  it('鼠标在编辑器中划过其他链接（mouseover）时，绝不抢走或切换当前工具栏', () => {
    const line2Anchor = document.createElement('a');
    mockGetLinkElementAtPos.mockReturnValue(line2Anchor);
    mockGetLinkAtSelection.mockReturnValue({
      range: { from: 50, to: 70 },
      mark: { attrs: { href: 'https://line2-link.com' } },
      text: 'Line 2 Target',
    });

    const MockToolbar = (props: { url: string; text: string }) => (
      <div data-testid="custom-toolbar" data-url={props.url}>
        {props.text}
      </div>
    );

    render(<BlogLinkToolbarController linkToolbar={MockToolbar as never} />);

    // 1. 用户光标选中第二行链接
    act(() => {
      selectionChangeCallback?.();
    });
    expect(screen.getByTestId('custom-toolbar')).toHaveAttribute('data-url', 'https://line2-link.com');
    expect(screen.getByText('Line 2 Target')).toBeInTheDocument();

    // 2. 模拟鼠标划过第一行的链接元素（line 1）
    const line1Anchor = document.createElement('a');
    line1Anchor.textContent = 'Line 1 Distractor';
    mockEditorDom?.appendChild(line1Anchor);

    mockGetLinkAtElement.mockReturnValue({
      range: { from: 0, to: 20 },
      mark: { attrs: { href: 'https://line1-distractor.com' } },
      text: 'Line 1 Distractor',
    });

    fireEvent.mouseOver(line1Anchor);

    // 工具栏必须牢牢锁定在 Line 2 Target，绝不能被划过的第一行链接抢走！
    expect(screen.getByTestId('custom-toolbar')).toHaveAttribute('data-url', 'https://line2-link.com');
    expect(screen.getByText('Line 2 Target')).toBeInTheDocument();
    expect(screen.queryByText('Line 1 Distractor')).not.toBeInTheDocument();
  });

  it('光标移出链接时正常关闭工具栏', () => {
    mockGetLinkAtSelection.mockReturnValue({
      range: { from: 10, to: 20 },
      mark: { attrs: { href: 'https://example.com' } },
      text: 'Example',
    });

    render(<BlogLinkToolbarController />);
    act(() => {
      selectionChangeCallback?.();
    });
    expect(screen.getByTestId('popover-root')).toBeInTheDocument();

    // 光标离开链接
    mockGetLinkAtSelection.mockReturnValue(undefined);
    act(() => {
      selectionChangeCallback?.();
    });

    expect(screen.queryByTestId('popover-root')).not.toBeInTheDocument();
  });

  it('点击正文超链接时，必须阻止默认跳转与事件冒泡，并立即弹出编辑工具栏', () => {
    const lineAnchor = document.createElement('a');
    lineAnchor.href = 'https://cloudflare-workflows.com';
    lineAnchor.textContent = 'Cloudflare Workflows';
    mockEditorDom?.appendChild(lineAnchor);

    mockGetLinkAtElement.mockReturnValue({
      range: { from: 10, to: 30 },
      mark: { attrs: { href: 'https://cloudflare-workflows.com' } },
      text: 'Cloudflare Workflows',
    });

    const MockToolbar = (props: { url: string; text: string }) => (
      <div data-testid="custom-toolbar" data-url={props.url}>
        {props.text}
      </div>
    );

    render(<BlogLinkToolbarController linkToolbar={MockToolbar as never} />);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    act(() => {
      lineAnchor.dispatchEvent(clickEvent);
    });

    // 必须调用 preventDefault 和 stopPropagation 阻止页面跳走！
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();

    // 必须弹出工具栏并显示该链接
    expect(screen.getByTestId('custom-toolbar')).toHaveAttribute('data-url', 'https://cloudflare-workflows.com');
    expect(screen.getByText('Cloudflare Workflows')).toBeInTheDocument();
  });
});
