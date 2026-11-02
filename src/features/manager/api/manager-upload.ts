import { ApiError } from '@/lib/api/client';
import { apiRequest } from '@/lib/api/client';
import type { z } from 'zod';
import {
  managerUploadSchema,
  fileStatusSchema,
  uploadIntentSchema,
} from '../schemas/manager-contracts';

export type ManagerFileStatus = z.infer<typeof fileStatusSchema>;
const checkDelays = [3000, 5000, 10000, 15000, 20000, 30000];

export function fileValidationError(file: ManagerFileStatus): string | null {
  if (file.status === 'DELETED') return 'Tệp đã bị xóa trên máy chủ. Vui lòng chọn tệp khác.';
  if (file.status !== 'FAILED') return null;
  const messages: Record<string, string> = {
    FILE_RETRY_EXHAUSTED:
      'Tệp đã tải lên nhưng máy chủ xử lý thất bại sau nhiều lần thử. Cần kiểm tra worker và kết nối kho lưu trữ phía backend.',
    FILE_BINARY_INVALID: 'Nội dung tệp không hợp lệ hoặc không khớp định dạng đã chọn.',
    FILE_SIZE_MISMATCH: 'Dung lượng tệp trên kho lưu trữ không khớp tệp đã chọn.',
    UPLOAD_EXPIRED: 'Phiên tải lên đã hết hạn. Vui lòng chọn lại tệp.',
  };
  return `${messages[file.errorCode ?? ''] ?? 'Máy chủ kiểm tra tệp không thành công.'}${file.errorCode ? ` [${file.errorCode}]` : ''}`;
}

function verifyFile(file: ManagerFileStatus, fileId: string, courseUnitId: string) {
  if (file.id !== fileId || file.courseUnitId !== courseUnitId)
    throw new Error('Kết quả kiểm tra không thuộc tệp hoặc học phần đã chọn.');
  return file;
}

export async function checkManagerFile(fileId: string, courseUnitId: string, signal: AbortSignal) {
  try {
    const file = await apiRequest({
      path: `files/${fileId}`,
      schema: fileStatusSchema,
      signal,
    });
    signal.throwIfAborted();
    return verifyFile(file, fileId, courseUnitId);
  } catch (error) {
    signal.throwIfAborted();
    throw uploadApiError(error, 'Chưa đọc được kết quả kiểm tra tệp');
  }
}

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  js: 'text/javascript',
  ts: 'text/plain',
  py: 'text/plain',
  java: 'text/plain',
  c: 'text/plain',
  cpp: 'text/plain',
  h: 'text/plain',
  css: 'text/css',
  sql: 'text/plain',
};
// The backend accepts these MIME declarations for every supported text/source extension.
const textMimeTypes = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/javascript',
  'application/javascript',
  'text/css',
];
export const managerFileAccept = Object.keys(mimeByExtension)
  .map((extension) => `.${extension}`)
  .join(',');
function uploadApiError(error: unknown, stage: string): Error {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      FILE_STORAGE_DISABLED: 'Máy chủ chưa bật chức năng lưu trữ tệp.',
      FILE_STORAGE_UNAVAILABLE: 'Máy chủ chưa kết nối được kho lưu trữ tệp.',
      FILE_UPLOAD_QUOTA_EXCEEDED: 'Có quá nhiều tệp đang chờ xử lý. Vui lòng thử lại sau.',
      MATERIAL_SCOPE_MISMATCH: 'Tệp không thuộc học phần đã chọn.',
      MATERIAL_ACCESS_DENIED: 'Tài khoản chưa có quyền tải tệp lên học phần này.',
      UPLOAD_EXPIRED: 'Phiên tải lên đã hết hạn. Vui lòng chọn lại tệp.',
      UPLOAD_FAILED: 'Máy chủ kiểm tra tệp không thành công. Vui lòng chọn lại tệp.',
    };
    return new Error(
      `${stage}: ${error.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản Manager.' : (messages[error.code] ?? error.message)} [${error.code}; HTTP ${error.status}]`,
    );
  }
  return new Error(
    `${stage}: ${error instanceof Error ? error.message : 'Chưa thể kết nối hệ thống.'}`,
  );
}
export function managerFileInput(file: File, courseUnitId: string) {
  const dot = file.name.lastIndexOf('.');
  const extension = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  const fallbackMime = Object.hasOwn(mimeByExtension, extension)
    ? mimeByExtension[extension]
    : undefined;
  if (!fallbackMime) throw new Error('Định dạng tệp chưa được hỗ trợ.');
  const browserMime = file.type.trim().toLowerCase();
  const allowedMimes = textMimeTypes.includes(fallbackMime) ? textMimeTypes : [fallbackMime];
  const mime = allowedMimes.includes(browserMime) ? browserMime : fallbackMime;
  if (
    !Number.isSafeInteger(file.size) ||
    file.size <= 0 ||
    file.size > (extension === 'mp4' ? 200 : 25) * 1048576
  )
    throw new Error('Tệp phải có nội dung và tối đa 25 MiB; video MP4 tối đa 200 MiB.');
  if (file.name !== file.name.trim() || /[\p{Cc}\\/]/u.test(file.name))
    throw new Error(
      'Tên tệp không được có dấu gạch chéo, ký tự điều khiển hoặc khoảng trắng ở hai đầu.',
    );
  return managerUploadSchema.parse({
    courseUnitId,
    originalFilename: file.name,
    declaredMimeType: mime,
    declaredSizeBytes: file.size,
  });
}
async function waitForCheck(signal: AbortSignal, delay: number): Promise<boolean> {
  signal.throwIfAborted();
  const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
  if (!visible()) return false;
  return new Promise<boolean>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', visibility);
    };
    const abort = () => {
      cleanup();
      reject(signal.reason);
    };
    const visibility = () => {
      if (!visible()) {
        cleanup();
        resolve(false);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(visible());
    }, delay);
    signal.addEventListener('abort', abort, { once: true });
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibility);
  });
}
export async function uploadManagerFile(
  file: File,
  courseUnitId: string,
  signal: AbortSignal,
  progress: (message: string) => void,
  onStatus?: (file: ManagerFileStatus) => void,
) {
  const body = managerFileInput(file, courseUnitId);
  progress('Đang tạo phiên tải lên…');
  let intent;
  try {
    intent = await apiRequest({
      path: 'files/upload-intents',
      method: 'POST',
      body,
      schema: uploadIntentSchema,
      signal,
    });
  } catch (error) {
    signal.throwIfAborted();
    throw uploadApiError(error, 'Không tạo được phiên tải lên');
  }
  signal.throwIfAborted();
  progress('Đang tải tệp lên…');
  let response;
  try {
    response = await fetch(intent.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: intent.requiredHeaders,
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(180_000)]),
    });
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof Error && error.name === 'TimeoutError')
      throw new Error(
        'Tải tệp quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại. [UPLOAD_STORAGE_TIMEOUT]',
      );
    throw new Error(
      'Chưa tải được tệp lên kho lưu trữ. Kết nối bị gián đoạn hoặc kho lưu trữ chưa cho phép tải lên từ địa chỉ website này (CORS). [UPLOAD_STORAGE_NETWORK]',
    );
  }
  if (!response.ok)
    throw new Error(
      `Chưa tải được tệp lên kho lưu trữ. ${response.status === 403 ? 'Liên kết tải lên có thể đã hết hạn hoặc bị từ chối.' : response.status === 413 ? 'Tệp vượt giới hạn dung lượng của máy chủ lưu trữ.' : 'Vui lòng thử lại.'} [UPLOAD_STORAGE_HTTP; HTTP ${response.status}]`,
    );
  signal.throwIfAborted();
  progress('Đã gửi tệp, đang xác nhận để máy chủ kiểm tra…');
  let status;
  try {
    status = await apiRequest({
      path: `files/${intent.fileId}/complete`,
      method: 'POST',
      body: {},
      schema: fileStatusSchema,
      signal,
    });
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof ApiError && [401, 403].includes(error.status))
      throw uploadApiError(error, 'Không xác nhận được tệp đã tải lên');
    try {
      status = await apiRequest({
        path: `files/${intent.fileId}`,
        schema: fileStatusSchema,
        signal,
      });
    } catch {
      signal.throwIfAborted();
      throw uploadApiError(error, 'Không xác nhận được tệp đã tải lên');
    }
    if (status.status === 'PENDING_UPLOAD')
      throw uploadApiError(error, 'Không xác nhận được tệp đã tải lên');
  }
  verifyFile(status, intent.fileId, courseUnitId);
  signal.throwIfAborted();
  onStatus?.(status);
  for (const delay of checkDelays) {
    if (!['PROCESSING', 'PENDING_UPLOAD'].includes(status.status)) break;
    progress('Đang kiểm tra tệp…');
    if (!(await waitForCheck(signal, delay))) break;
    status = await checkManagerFile(intent.fileId, courseUnitId, signal);
    onStatus?.(status);
  }
  return status;
}
