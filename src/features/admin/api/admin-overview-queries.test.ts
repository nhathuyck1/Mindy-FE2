import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { fetchOverviewRecords } from './admin-overview-queries';

const schema = z.object({
  items: z.array(z.object({ id: z.string() })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
afterEach(() => vi.unstubAllGlobals());

describe('Complete overview lists', () => {
  it('Loads subsequent pages using the server page size before returning any aggregate', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '1' }, { id: '2' }], page: 1, pageSize: 2, total: 3 }),
      )
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '3' }], page: 2, pageSize: 2, total: 3 }),
      );
    vi.stubGlobal('fetch', fetch);
    expect(await fetchOverviewRecords('users', schema, new AbortController().signal)).toHaveLength(
      3,
    );
    expect(fetch.mock.calls.map((args) => args[0])).toEqual([
      '/api/v1/admin/users?page=1&pageSize=100',
      '/api/v1/admin/users?page=2&pageSize=2',
    ]);
  });

  it('Rejects incomplete/overlapping pages rather than charting inaccurate totals', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '1' }, { id: '2' }], page: 1, pageSize: 2, total: 3 }),
      )
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '2' }], page: 2, pageSize: 2, total: 3 }),
      );
    vi.stubGlobal('fetch', fetch);
    await expect(
      fetchOverviewRecords('users', schema, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'OVERVIEW_INCOMPLETE' });
  });

  it('Rejects a changed total and propagates auth/service errors instead of showing zero', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '1' }], page: 1, pageSize: 1, total: 2 }),
      )
      .mockResolvedValueOnce(
        Response.json({ items: [{ id: '2' }], page: 2, pageSize: 1, total: 3 }),
      );
    vi.stubGlobal('fetch', fetch);
    await expect(
      fetchOverviewRecords('users', schema, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'OVERVIEW_CHANGED' });
    fetch.mockResolvedValue(Response.json({ message: 'Forbidden' }, { status: 403 }));
    await expect(
      fetchOverviewRecords('users', schema, new AbortController().signal),
    ).rejects.toMatchObject({ status: 403 });
  });
});
