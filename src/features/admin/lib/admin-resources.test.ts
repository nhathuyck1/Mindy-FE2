import { describe, expect, it } from 'vitest';
import { adminCsv, type AdminRow } from './admin-resources';

describe('Admin CSV export', () => {
  it('Escapes quoted data and neutralizes spreadsheet formulas including phone numbers', () => {
    const row: AdminRow = {
      id: 'id',
      name: '=HYPERLINK("unsafe")',
      subtitle: 'user@example.test',
      secondary: 'Học viên',
      status: 'ACTIVE',
      metric: '+84901234567',
      date: '2026-10-15T00:00:00Z',
      fields: [],
    };
    const csv = adminCsv([row], 'users');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""unsafe"")"');
    expect(csv).toContain('"\'+84901234567"');
    expect(csv).toContain('15/10/2026');
    expect(adminCsv([{ ...row, name: '\t=SUM(1,2)' }], 'users')).toContain("'\t=SUM(1,2)");
  });
});
