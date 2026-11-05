export function assignmentDeadline(dueAt: string | null, now: number) {
  if (!dueAt) return { label: 'Không giới hạn', urgent: false };
  const remaining = Date.parse(dueAt) - now;
  if (remaining <= 0) return { label: 'Đã qua hạn', urgent: true };
  const minutes = Math.ceil(remaining / 60_000);
  if (minutes < 60) return { label: `Còn ${minutes} phút`, urgent: true };
  if (minutes <= 24 * 60)
    return { label: `Còn ${Math.ceil(minutes / 60)} giờ · Sắp đến hạn`, urgent: true };
  return { label: `Còn ${Math.ceil(remaining / 86_400_000)} ngày`, urgent: false };
}
