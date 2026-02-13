import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetDb = vi.fn();

vi.mock('@/lib/db', () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

import { listBackupPosts, shouldSyncToWordPress, upsertNotionPostsToBackup } from '@/lib/notion-post-backup';

interface MockBackupRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string;
  categories: string;
  date: string | null;
  content: string;
  coverImage: string | null;
  lastUpdateTime: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface QueryState {
  limit: number;
  offset: number;
}

function buildMockRow(index: number, overrides: Partial<MockBackupRow> = {}): MockBackupRow {
  const timestamp = new Date(`2025-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`);
  return {
    id: `post-${index}`,
    title: `Post ${index}`,
    slug: `post-${index}`,
    status: 'Ready',
    tags: '[]',
    categories: '[]',
    date: null,
    content: `<p>post-${index}</p>`,
    coverImage: null,
    lastUpdateTime: timestamp,
    publishedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMockDb(rows: MockBackupRow[], queryState: QueryState) {
  return {
    select(selection?: unknown) {
      if (selection) {
        return {
          from() {
            return {
              async get() {
                return {
                  count: rows.length,
                };
              },
            };
          },
        };
      }

      return {
        from() {
          return {
            orderBy() {
              return {
                limit(limit: number) {
                  queryState.limit = limit;
                  return {
                    async offset(offset: number) {
                      queryState.offset = offset;
                      return rows.slice(offset, offset + limit);
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function createMockDbForUpsert(existingRows: Array<{ id: string; lastUpdateTime: Date }>, insertedIds: string[]) {
  return {
    select() {
      return {
        from() {
          return {
            async where() {
              return existingRows;
            },
          };
        },
      };
    },
    insert() {
      return {
        values(payload: { id: string }) {
          insertedIds.push(payload.id);
          return {
            async onConflictDoUpdate() {
              return;
            },
          };
        },
      };
    },
  };
}

describe('shouldSyncToWordPress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when publishedAt is null', () => {
    const shouldSync = shouldSyncToWordPress(new Date('2025-01-02T00:00:00.000Z'), null);
    expect(shouldSync).toBe(true);
  });

  it('should return false when lastUpdateTime <= publishedAt + 60s', () => {
    const publishedAt = new Date('2025-01-02T00:00:00.000Z');

    expect(shouldSyncToWordPress(new Date('2025-01-02T00:00:30.000Z'), publishedAt)).toBe(false);
    expect(shouldSyncToWordPress(new Date('2025-01-02T00:01:00.000Z'), publishedAt)).toBe(false);
  });

  it('should return true when lastUpdateTime > publishedAt + 60s', () => {
    const publishedAt = new Date('2025-01-02T00:00:00.000Z');
    const shouldSync = shouldSyncToWordPress(new Date('2025-01-02T00:01:01.000Z'), publishedAt);

    expect(shouldSync).toBe(true);
  });

  it('listBackupPosts 应归一化分页参数并计算 needsSyncToWordPress', async () => {
    const rows = [
      buildMockRow(1, {
        tags: '["Tag A"]',
        categories: '["Cat A"]',
        publishedAt: null,
      }),
      buildMockRow(2, {
        lastUpdateTime: new Date('2025-01-02T00:00:30.000Z'),
        publishedAt: new Date('2025-01-02T00:00:00.000Z'),
      }),
      buildMockRow(3, {
        lastUpdateTime: new Date('2025-01-03T00:01:01.000Z'),
        publishedAt: new Date('2025-01-03T00:00:00.000Z'),
      }),
    ];
    const queryState: QueryState = { limit: 0, offset: 0 };
    mockGetDb.mockResolvedValue(createMockDb(rows, queryState));

    const result = await listBackupPosts({ page: 0 });

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(queryState).toEqual({
      limit: 10,
      offset: 0,
    });
    expect(result.posts).toHaveLength(3);
    expect(result.posts.map((post) => post.needsSyncToWordPress)).toEqual([true, false, true]);
    expect(result.posts[0]?.tags).toEqual(['Tag A']);
    expect(result.posts[0]?.categories).toEqual(['Cat A']);
  });

  it('listBackupPosts 应限制 pageSize 并裁剪超过上限的页码', async () => {
    const rows = Array.from({ length: 60 }, (_, index) => buildMockRow(index + 1));
    const queryState: QueryState = { limit: 0, offset: 0 };
    mockGetDb.mockResolvedValue(createMockDb(rows, queryState));

    const result = await listBackupPosts({ page: 99, pageSize: 100 });

    expect(result.total).toBe(60);
    expect(result.pageSize).toBe(50);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(2);
    expect(queryState).toEqual({
      limit: 50,
      offset: 50,
    });
    expect(result.posts).toHaveLength(10);
    expect(result.posts[0]?.id).toBe('post-51');
    expect(result.posts[9]?.id).toBe('post-60');
  });

  it('upsertNotionPostsToBackup 应跳过本地时间相同或更新的记录', async () => {
    const insertedIds: string[] = [];
    mockGetDb.mockResolvedValue(
      createMockDbForUpsert(
        [
          { id: 'p-local-newer', lastUpdateTime: new Date('2025-01-03T00:00:00.000Z') },
          { id: 'p-local-equal', lastUpdateTime: new Date('2025-01-02T00:00:00.000Z') },
        ],
        insertedIds,
      ),
    );

    const count = await upsertNotionPostsToBackup([
      {
        id: 'p-local-newer',
        title: 'newer',
        slug: 'newer',
        status: 'Ready',
        tags: [],
        categories: [],
        content: '<p>a</p>',
        lastEditedTime: '2025-01-02T00:00:00.000Z',
      },
      {
        id: 'p-local-equal',
        title: 'equal',
        slug: 'equal',
        status: 'Ready',
        tags: [],
        categories: [],
        content: '<p>b</p>',
        lastEditedTime: '2025-01-02T00:00:00.000Z',
      },
      {
        id: 'p-need-update',
        title: 'update',
        slug: 'update',
        status: 'Ready',
        tags: [],
        categories: [],
        content: '<p>c</p>',
        lastEditedTime: '2025-01-02T00:00:00.000Z',
      },
    ]);

    expect(count).toBe(1);
    expect(insertedIds).toEqual(['p-need-update']);
  });
});
