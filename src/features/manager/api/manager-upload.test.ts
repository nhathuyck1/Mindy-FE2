import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkManagerFile,
  fileValidationError,
  managerFileInput,
  uploadManagerFile,
} from './manager-upload';

const id = '11111111-1111-4111-8111-111111111111';
const unit = '22222222-2222-4222-8222-222222222222';
const status = {
  id,
  courseUnitId: unit,
  status: 'READY',
  originalFilename: 'lesson.pdf',
  declaredSizeBytes: 3,
  sizeBytes: 3,
  mimeType: 'application/pdf',
  kind: 'PDF',
  intentExpiresAt: '2026-10-16T10:30:00Z',
  readyAt: '2026-10-16T10:00:00Z',
  metadataStatus: 'PENDING',
  errorCode: null,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('Manager private upload flow', () => {
  it.each([
    ['lesson.PDF', '', 'application/pdf'],
    ['lesson.pdf', 'image/png', 'application/pdf'],
    ['lesson.pdf', 'application/octet-stream', 'application/pdf'],
    ['photo.jpeg', '', 'image/jpeg'],
    [
      'notes.docx',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    [
      'slides.pptx',
      '',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ['data.xlsx', '', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['sound.mp3', 'audio/mp3', 'audio/mpeg'],
    ['clip.mp4', '', 'video/mp4'],
    ['code.ts', 'video/mp2t', 'text/plain'],
    ['code.js', 'application/javascript', 'application/javascript'],
    ['notes.md', 'text/plain', 'text/plain'],
    ['notes.md', '', 'text/markdown'],
    ['data.csv', 'application/vnd.ms-excel', 'text/csv'],
  ])('declares exact metadata for %s (%s)', (name, type, mime) => {
    const file = new File(['Tiếng Việt'], name, { type });
    expect(managerFileInput(file, unit)).toEqual({
      courseUnitId: unit,
      originalFilename: name,
      declaredMimeType: mime,
      declaredSizeBytes: file.size,
    });
    expect(file.size).toBe(new TextEncoder().encode('Tiếng Việt').byteLength);
  });
  it.each(['pdf', '.pdf', 'lesson.exe', 'lesson.pdf.exe', 'lesson.pdf ', 'bad\u0085.pdf'])(
    'rejects unsupported filenames: %s',
    (name) => {
      expect(() =>
        managerFileInput(new File(['x'], name, { type: 'application/pdf' }), unit),
      ).toThrow();
    },
  );
  it('rejects empty files before creating an upload intent', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      uploadManagerFile(
        new File([], 'empty.pdf'),
        unit,
        new AbortController().signal,
        () => undefined,
      ),
    ).rejects.toThrow('Tệp phải có nội dung');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends raw bytes to storage without cookies and waits for READY before returning', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: { 'content-type': 'application/pdf' },
          uploadUrlExpiresAt: '2026-10-16T10:10:00Z',
          intentExpiresAt: '2026-10-16T10:30:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json(
          {
            ...status,
            status: 'PROCESSING',
            readyAt: null,
            kind: null,
            mimeType: null,
            sizeBytes: null,
          },
          { status: 202 },
        ),
      )
      .mockResolvedValueOnce(Response.json(status));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['pdf'], 'lesson.pdf');
    const messages: string[] = [];
    const promise = uploadManagerFile(file, unit, new AbortController().signal, (value) =>
      messages.push(value),
    );
    await vi.advanceTimersByTimeAsync(3001);
    expect((await promise).status).toBe('READY');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PUT',
      credentials: 'omit',
      body: file,
      headers: { 'content-type': 'application/pdf' },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      courseUnitId: unit,
      originalFilename: file.name,
      declaredMimeType: 'application/pdf',
      declaredSizeBytes: file.size,
    });
    expect(fetchMock.mock.calls[2][0]).toBe(`/api/v1/files/${id}/complete`);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'POST', body: '{}' });
    expect(messages).toContain('Đang kiểm tra tệp…');
    expect(fetchMock.mock.calls[3][0]).toBe(`/api/v1/files/${id}`);
  });
  it('recovers a lost complete response by reading status before polling', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: { 'content-type': 'application/pdf' },
          uploadUrlExpiresAt: '2030-01-01T00:00:00Z',
          intentExpiresAt: '2030-01-01T01:00:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(Response.json(status));
    vi.stubGlobal('fetch', fetchMock);
    expect(
      (
        await uploadManagerFile(
          new File(['pdf'], 'lesson.pdf'),
          unit,
          new AbortController().signal,
          () => undefined,
        )
      ).kind,
    ).toBe('PDF');
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      'POST',
      'PUT',
      'POST',
      'GET',
    ]);
  });
  it('never completes or attaches a file when the storage PUT fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: {},
          uploadUrlExpiresAt: '2026-10-16T10:10:00Z',
          intentExpiresAt: '2026-10-16T10:30:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      uploadManagerFile(
        new File(['pdf'], 'lesson.pdf'),
        unit,
        new AbortController().signal,
        () => undefined,
      ),
    ).rejects.toThrow('Chưa tải được tệp');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('identifies a browser network/CORS failure without completing the upload', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: {},
          uploadUrlExpiresAt: '2026-10-16T10:10:00Z',
          intentExpiresAt: '2026-10-16T10:30:00Z',
        }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      uploadManagerFile(
        new File(['pdf'], 'lesson.pdf'),
        unit,
        new AbortController().signal,
        () => undefined,
      ),
    ).rejects.toThrow('UPLOAD_STORAGE_NETWORK');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('keeps a storage configuration failure distinct from a document conflict', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          Response.json({ code: 'FILE_STORAGE_DISABLED', message: 'Unavailable' }, { status: 503 }),
        ),
    );
    await expect(
      uploadManagerFile(
        new File(['pdf'], 'lesson.pdf'),
        unit,
        new AbortController().signal,
        () => undefined,
      ),
    ).rejects.toThrow('Máy chủ chưa bật chức năng lưu trữ tệp');
  });
  it('bounds automatic status requests and keeps a pending file available for a later check', async () => {
    vi.useFakeTimers();
    const processing = { ...status, status: 'PROCESSING', readyAt: null };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: {},
          uploadUrlExpiresAt: '2030-01-01T00:00:00Z',
          intentExpiresAt: '2030-01-01T01:00:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockImplementation(async () => Response.json(processing));
    vi.stubGlobal('fetch', fetchMock);
    const promise = uploadManagerFile(
      new File(['pdf'], 'lesson.pdf'),
      unit,
      new AbortController().signal,
      () => undefined,
    );
    await vi.advanceTimersByTimeAsync(100_000);
    expect((await promise).status).toBe('PROCESSING');
    const gets = fetchMock.mock.calls.filter(([, init]) => init?.method === 'GET');
    expect(gets).toHaveLength(6);
    await vi.advanceTimersByTimeAsync(300_000);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'GET')).toHaveLength(6);
  });
  it('stops immediately on a terminal backend validation failure', async () => {
    const failed = {
      ...status,
      status: 'FAILED',
      readyAt: null,
      errorCode: 'FILE_RETRY_EXHAUSTED',
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: {},
          uploadUrlExpiresAt: '2030-01-01T00:00:00Z',
          intentExpiresAt: '2030-01-01T01:00:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json(failed));
    vi.stubGlobal('fetch', fetchMock);
    const result = await uploadManagerFile(
      new File(['pdf'], 'lesson.pdf'),
      unit,
      new AbortController().signal,
      () => undefined,
    );
    expect(fileValidationError(result)).toContain('máy chủ xử lý thất bại');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('manual checks only read the existing file once', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(status));
    vi.stubGlobal('fetch', fetchMock);
    expect((await checkManagerFile(id, unit, new AbortController().signal)).status).toBe('READY');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/files/${id}`);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
  });
  it('stops automatic checks when the page becomes hidden', async () => {
    vi.useFakeTimers();
    const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    vi.stubGlobal('document', page);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          fileId: id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: {},
          uploadUrlExpiresAt: '2030-01-01T00:00:00Z',
          intentExpiresAt: '2030-01-01T01:00:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ ...status, status: 'PROCESSING', readyAt: null }));
    vi.stubGlobal('fetch', fetchMock);
    const promise = uploadManagerFile(
      new File(['pdf'], 'lesson.pdf'),
      unit,
      new AbortController().signal,
      () => undefined,
    );
    await vi.advanceTimersByTimeAsync(1);
    page.visibilityState = 'hidden';
    page.dispatchEvent(new Event('visibilitychange'));
    expect((await promise).status).toBe('PROCESSING');
    await vi.advanceTimersByTimeAsync(100_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
