# Gửi backend: upload đã PUT 200 nhưng kiểm tra file FAILED

## Mô tả lỗi để chuyển tiếp

Frontend Mindy FE2 tại `http://localhost:3003/manager/materials`, tài khoản MANAGER, tạo tài liệu FILE và tải file PDF nhỏ:

1. `POST /api/v1/files/upload-intents` → 201, nhận được fileId và presigned PUT URL.
2. `PUT` raw file tới MinIO → 200.
3. `POST /api/v1/files/:fileId/complete` → 202.
4. `GET /api/v1/files/:fileId` → HTTP 200 nhưng file còn PROCESSING; cuối cùng FAILED, `errorCode=FILE_RETRY_EXHAUSTED`.

File lỗi từ ảnh: `b5d2b2d0-e8d3-4653-8be0-a019a0545e79`. File thứ hai đang xử lý lúc chụp: `f8c93988-dd47-4f31-be7f-44db0d15b350`.

Expected: job VALIDATE hoàn tất, file READY với kind/mimeType/sizeBytes/readyAt để FE gắn fileId vào Material. HTTP 200 của GET chỉ xác nhận đọc được trạng thái, không xác nhận validation thành công. PUT 200 cho thấy lần này đã đi qua bước CORS/upload storage.

`FILE_RETRY_EXHAUSTED` do backend đánh dấu sau khi job thử hết số lần. Cần tìm exception gốc ở storage HEAD/COPY/GET, quyền truy cập version, scratch directory hoặc tiến trình binary validator; chưa có bằng chứng để chọn một nguyên nhân cụ thể. Giảm polling FE không sửa được exception này.

FE đã giảm GET trạng thái còn tối đa 6 lần tự động, giãn 3/5/10/15/20/30 giây, dừng khi tab ẩn hoặc FAILED/DELETED. Sau đó giữ file chờ, nút Kiểm tra lại chỉ GET một lần, không tạo lại intent/PUT/complete. Chặn lưu tài liệu khi file chưa READY.

## Lệnh chạy trên VPS

Chạy trong đúng thư mục BE đang triển khai. Dùng cùng compose project (`-p` nếu có), file env và các override như deployment hiện tại. Hàm dưới đây theo hai file compose của repo; không đổi image/tag hoặc restart service trong bước chẩn đoán.

```bash
dc() {
  docker compose --env-file .env.production \
    -f compose.production.yaml \
    -f compose.files-production.yaml "$@"
}

dc ps api minio
dc logs --since 30m --tail 500 api
```

Tìm các dòng `FILE_RETRY`, `FILE_FAILED`, `FILE_READY`, `FILE_LEASE_RECOVERY_REQUIRED`, `File worker failed`, hoặc UUID ở trên. Source hiện tại của `FileProcessingService.fail()` chỉ log errorCode/attempt; nếu không có exception gốc thì backend cần bổ sung log có cấu trúc cho stage, error.name/error.code/HTTP status. Không log credentials hoặc signed URL.

### Kiểm tra config, runner và quyền ghi thư mục tạm trong container API

Lệnh chỉ in các cấu hình liên quan, kiểm tra artifact runner và tạo/đọc/xóa một file probe riêng. Không in DATABASE_URL, access key, secret key hoặc cookie.

```bash
dc exec -T api node --input-type=module <<'NODE'
import { mkdir, mkdtemp, writeFile, readFile, unlink, rmdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

console.log({
  MINIO_ENABLED: process.env.MINIO_ENABLED ?? '(default false)',
  FILE_JOB_ENABLED: process.env.FILE_JOB_ENABLED ?? '(default true)',
  FILE_SCRATCH_DIRECTORY: process.env.FILE_SCRATCH_DIRECTORY ?? '(default tmpdir)',
});

const runner = resolve('dist/modules/files/validation/binary-validation.runner.js');
try { await access(runner); console.log('RUNNER_EXISTS', true); }
catch (error) { console.log('RUNNER_ERROR', error.code); process.exitCode = 1; }

const directory = process.env.FILE_SCRATCH_DIRECTORY || join(tmpdir(), 'mindy-file-validation');
let probe;
let probeFile;
try {
  await mkdir(directory, { recursive: true });
  probe = await mkdtemp(join(directory, 'mindy-upload-probe-'));
  probeFile = join(probe, 'probe.txt');
  await writeFile(probeFile, 'mindy-probe', { flag: 'wx', mode: 0o600 });
  console.log('SCRATCH_WRITE_READ_OK', (await readFile(probeFile, 'utf8')) === 'mindy-probe');
} catch (error) {
  console.log('SCRATCH_ERROR', error.code);
  process.exitCode = 1;
} finally {
  if (probeFile) await unlink(probeFile).catch(() => {});
  if (probe) await rmdir(probe).catch(() => {});
}
NODE
```

Expected: MINIO_ENABLED=true, FILE_JOB_ENABLED=true, RUNNER_EXISTS=true, SCRATCH_WRITE_READ_OK=true. `EACCES`/`EROFS` tại scratch là bằng chứng quyền/mount sai. Compose Files khai báo `/file-scratch` dạng tmpfs để API chạy user node trong filesystem read-only vẫn kiểm tra binary được; xác minh container API thực tế đã được triển khai với override này.

### Đọc trạng thái file và job trong PostgreSQL

SELECT trong transaction READ ONLY; không reset attempts, sửa status hoặc xóa dữ liệu.

```bash
dc exec -T postgres sh -c \
  'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
BEGIN READ ONLY;
SELECT f.id,
       f.status AS file_status,
       f.error_code AS file_error,
       f.processing_at,
       f.ready_at,
       (f.staging_version_id IS NOT NULL) AS has_staging_version,
       j.kind,
       j.status AS job_status,
       j.attempts,
       j.max_attempts,
       j.error_code AS job_error,
       j.available_at,
       j.lease_until,
       jsonb_array_length(j.copy_candidates) AS copy_candidate_count
FROM file_objects f
LEFT JOIN file_processing_jobs j ON j.file_object_id = f.id
WHERE f.id IN (
  'b5d2b2d0-e8d3-4653-8be0-a019a0545e79',
  'f8c93988-dd47-4f31-be7f-44db0d15b350'
)
ORDER BY f.id, j.kind;
ROLLBACK;
SQL
```

`has_staging_version=false` cho thấy chưa ghi nhận được version nguồn; kiểm tra HEAD/versioning. Có staging version và copy candidate nhưng FAILED thì cần log exception tại COPY/GET/scratch/validator để phân biệt, chưa thể kết luận chỉ từ các cột này.

### Backend cần trả lại

- Output config/runner/scratch và SELECT file/job ở trên.
- Log cùng fileId, attempts và exception gốc có stage; hiện errorCode chung chưa đủ chẩn đoán.
- Một lần kiểm thử mới PDF nhỏ qua browser: intent 201 → PUT 200 → complete 202 → file READY. File đã FAILED là terminal; kiểm thử mới dùng intent mới sau khi sửa nguyên nhân.

Các lệnh này đã đối chiếu tên service/table/field với source local; chưa được thực thi trên VPS.
