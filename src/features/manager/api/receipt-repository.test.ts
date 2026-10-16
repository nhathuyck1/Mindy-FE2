import { afterEach, describe, expect, it, vi } from 'vitest';
import { localReceiptRepository, receiptsCsv } from './receipt-repository';
import { managerFileInput } from './manager-upload';
import type { Receipt } from '../schemas/manager-contracts';

const receipt: Receipt = {
  id: '11111111-1111-4111-8111-111111111111',
  studentName: '=HYPERLINK("https://example.test")',
  className: 'Lớp A',
  orderCode: 'ORDER-1',
  amount: 100000,
  method: 'CASH',
  note: 'Ghi chú\nDòng 2',
  createdAt: '2026-10-16T03:00:00.000Z',
  status: 'DRAFT',
};
afterEach(() => vi.unstubAllGlobals());
describe('Local receipt adapter', () => {
  it('isolates accounts and persists status transitions without a payment request', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    await localReceiptRepository.save('manager-a', receipt);
    expect(await localReceiptRepository.list('manager-b')).toEqual([]);
    await localReceiptRepository.save('manager-a', { ...receipt, status: 'RECORDED_LOCAL' });
    expect(await localReceiptRepository.list('manager-a')).toEqual([
      { ...receipt, status: 'RECORDED_LOCAL' },
    ]);
    expect(network).not.toHaveBeenCalled();
  });
  it('reports storage failures and exports CSV with formula escaping', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota');
      },
    });
    await expect(localReceiptRepository.save('manager', receipt)).rejects.toThrow('Không lưu được');
    const csv = receiptsCsv([receipt]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('"Ghi chú\nDòng 2"');
  });
  it('maps missing browser MIME types and enforces distinct size limits', () => {
    const id = receipt.id;
    expect(
      managerFileInput(new File(['pdf'], 'lesson.pdf', { type: '' }), id).declaredMimeType,
    ).toBe('application/pdf');
    expect(() => managerFileInput(new File([], 'empty.pdf'), id)).toThrow('Tệp phải có nội dung');
    expect(() => managerFileInput(new File(['x'], 'file.exe'), id)).toThrow('chưa được hỗ trợ');
    const large = new File([new Uint8Array(26 * 1048576)], 'large.pdf');
    expect(() => managerFileInput(large, id)).toThrow('25 MiB');
    expect(managerFileInput(new File([large], 'large.mp4'), id).declaredSizeBytes).toBe(large.size);
  });
});
