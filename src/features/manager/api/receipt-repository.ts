import { receiptSchema, receiptsSchema, type Receipt } from '../schemas/manager-contracts';

// Legacy local receipts remain available for read/export, separate from server orders.
// This repository never confirms a payment or changes an order.
export interface ReceiptRepository {
  list(userId: string): Promise<Receipt[]>;
  save(userId: string, receipt: Receipt): Promise<void>;
}
const storageKey = (userId: string) => `mindy:manager:receipt-drafts:v1:${userId}`;
export const localReceiptRepository: ReceiptRepository = {
  async list(userId) {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const result = receiptsSchema.safeParse(JSON.parse(raw));
    if (!result.success)
      throw new Error('Dữ liệu phiếu trên thiết bị chưa hợp lệ. Chưa thể đọc danh sách.');
    return result.data;
  },
  async save(userId, receipt) {
    const parsed = receiptSchema.parse(receipt);
    const current = await this.list(userId);
    const next = [parsed, ...current.filter((item) => item.id !== parsed.id)];
    if (next.length > 1000)
      throw new Error('Thiết bị đã lưu tối đa 1.000 phiếu. Hãy xuất dữ liệu trước khi tiếp tục.');
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch {
      throw new Error(
        'Không lưu được trên thiết bị. Kiểm tra dung lượng hoặc quyền lưu dữ liệu của trình duyệt.',
      );
    }
  },
};
export function receiptsCsv(items: Receipt[]) {
  const cell = (value: string | number) =>
    `"${String(value)
      .replace(/^[\s]*[=+@-]/, (prefix) => `'${prefix}`)
      .replaceAll('"', '""')}"`;
  return (
    '\uFEFF' +
    [
      [
        'Mã phiếu cục bộ',
        'Học viên',
        'Lớp',
        'Mã đơn tham chiếu',
        'Số tiền VND',
        'Phương thức',
        'Trạng thái',
        'Ngày tạo',
        'Ghi chú',
      ],
      ...items.map((item) => [
        item.id,
        item.studentName,
        item.className,
        item.orderCode,
        item.amount,
        item.method,
        item.status,
        item.createdAt,
        item.note,
      ]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n')
  );
}
