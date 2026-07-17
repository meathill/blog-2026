import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetDb = vi.fn();

vi.mock('@/lib/db', () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

import { listBlogPostRecords } from '@/lib/blog-storage';

function mockDb(countRow: { count: number } | undefined, rows: unknown[]) {
  const countGet = vi.fn().mockResolvedValue(countRow);
  const countWhere = vi.fn().mockReturnValue({ get: countGet });
  const countFrom = vi.fn().mockReturnValue({ where: countWhere });

  const rowsOffset = vi.fn().mockResolvedValue(rows);
  const rowsLimit = vi.fn().mockReturnValue({ offset: rowsOffset });
  const rowsOrderBy = vi.fn().mockReturnValue({ limit: rowsLimit });
  const rowsWhere = vi.fn().mockReturnValue({ orderBy: rowsOrderBy });
  const rowsFrom = vi.fn().mockReturnValue({ where: rowsWhere });

  const select = vi.fn().mockReturnValueOnce({ from: countFrom }).mockReturnValueOnce({ from: rowsFrom });

  return { select, countWhere, rowsWhere };
}

describe('listBlogPostRecords 搜索过滤', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 search 时，count 查询和行查询的 where 均为 undefined', async () => {
    const { select, countWhere, rowsWhere } = mockDb({ count: 0 }, []);
    mockGetDb.mockResolvedValue({ select });

    await listBlogPostRecords({});

    expect(countWhere).toHaveBeenCalledWith(undefined);
    expect(rowsWhere).toHaveBeenCalledWith(undefined);
  });

  it('带 search 时，count 查询和行查询必须使用同一个 where 条件（否则总页数会算错）', async () => {
    const { select, countWhere, rowsWhere } = mockDb({ count: 1 }, []);
    mockGetDb.mockResolvedValue({ select });

    await listBlogPostRecords({ search: 'hello' });

    const countArg = countWhere.mock.calls[0][0];
    const rowsArg = rowsWhere.mock.calls[0][0];
    expect(countArg).toBeDefined();
    expect(countArg).toBe(rowsArg);
  });

  it('纯空白 search 视为无搜索', async () => {
    const { select, countWhere, rowsWhere } = mockDb({ count: 0 }, []);
    mockGetDb.mockResolvedValue({ select });

    await listBlogPostRecords({ search: '   ' });

    expect(countWhere).toHaveBeenCalledWith(undefined);
    expect(rowsWhere).toHaveBeenCalledWith(undefined);
  });
});
