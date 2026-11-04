# Kiểm thử khu vực Manager — 04/11/2026

Môi trường: `http://localhost:3001` → backend deploy `https://api.quanh123.id.vn/api/v1`. Source FE2 `ab1d211`, BE local `37a9aa7`. Đã dùng tài khoản Manager do người dùng cung cấp; không lưu mật khẩu hoặc cookie vào tài liệu/artifact. Source BE local dùng đối chiếu, không khẳng định commit deploy trùng source local.

## Các vấn đề

| ID         | Ưu tiên | Vấn đề                                                                                           | Bằng chứng                                                                        |
| ---------- | ------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| MANAGER-01 | P2      | Bộ lọc “Cần chỉnh sửa” và “Tất cả trạng thái” bị đổi thành “Chờ duyệt”                           | Tái hiện bằng dữ liệu thật trên desktop/mobile                                    |
| MANAGER-02 | P3      | Mất bộ lọc loại tài liệu khi tải lại trang                                                       | Tái hiện FILE → reload → Tất cả loại trên dữ liệu thật                            |
| MANAGER-03 | P2      | FE cho xác nhận duyệt nghỉ cả ngày có xung đột học viên, trong khi source BE chặn trường hợp này | Tái hiện UI bằng fixture; đối chiếu source BE, chưa gửi approve trên backend thật |

### MANAGER-01 — Không chọn được tất cả trạng thái hoặc tài liệu bị từ chối

**Các bước**

1. Vào Quản lý tài liệu → Toàn bộ tài liệu, hoặc mở `/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW`.
2. Chọn **Cần chỉnh sửa** trong Trạng thái duyệt.
3. Chọn tiếp **Tất cả trạng thái**.

**Thực tế:** bước 2 URL là `reviewStatus=REJECTED` nhưng select trở về **Chờ duyệt**; bước 3 bỏ `reviewStatus` trên URL nhưng select vẫn trở về **Chờ duyệt**. Query danh sách dùng giá trị PENDING_REVIEW đã bị thay thế, không dùng lựa chọn của người dùng.

**Mong đợi:** REJECTED gửi đúng bộ lọc REJECTED; Tất cả trạng thái không gửi bộ lọc trạng thái.

**Nguyên nhân:** `src/features/manager/components/manager-materials-page.tsx:23` chỉ chấp nhận `PENDING_REVIEW`, `APPROVED`, `DRAFT`. Giá trị REJECTED hoặc thiếu query đều bị ép về PENDING_REVIEW, trong khi `ManagerMaterialsInventory` có đủ option cho hai lựa chọn này.

**Đối chứng API thật:** toàn kho có 35 tài liệu, PENDING_REVIEW có 6, APPROVED có 14, DRAFT có 15, REJECTED có 0 tại thời điểm kiểm tra. GET REJECTED trả 200, nên FE phải hiển thị đúng empty state thay vì đổi sang nhóm 6 tài liệu chờ duyệt.

**Hướng sửa:** phân biệt giá trị mặc định với “Tất cả”; validate đủ enum trạng thái của BE, giữ URL và bộ lọc đồng nhất.

Ảnh: [desktop](manager-2026-11-04/rejected-filter-desktop.png), [mobile](manager-2026-11-04/rejected-filter-mobile.png).

### MANAGER-02 — Reload làm mất lọc loại tài liệu

**Các bước:** trong kho tài liệu, chọn Loại tài liệu = **Tệp tài liệu (FILE)** → tải lại trang.

**Thực tế:** loại lọc trở về **Tất cả loại**. URL không lưu `contentType`, nên không thể reload hoặc chia sẻ lại cùng bộ lọc.

**Mong đợi:** giữ loại tài liệu đang lọc sau reload; các query key của bộ lọc nằm trên URL.

**Nguyên nhân:** `src/features/manager/components/manager-materials-inventory.tsx:36` giữ `type` chỉ trong `useState('')`. `page` và lựa chọn khóa học cũng đang dùng state cục bộ; lượt này tái hiện cụ thể mất `type`, không coi các trường còn lại đã được kiểm thử đầy đủ.

**Hướng sửa:** đọc/ghi `contentType` và page vào URL, kiểm giá trị hợp lệ và reset page khi thay bộ lọc.

Ảnh sau reload: [desktop](manager-2026-11-04/type-filter-reset-desktop.png), [mobile](manager-2026-11-04/type-filter-reset-mobile.png).

### MANAGER-03 — Quy tắc duyệt nghỉ FULL_DAY lệch giữa FE và BE

**Điều kiện:** đơn PENDING còn hạn, nguồn còn khớp, period FULL_DAY và `studentConflictCount > 0`.

**Tái hiện bằng fixture:** mở đơn → **Duyệt đơn** → chọn “Xác nhận đã xem xung đột lịch học viên” → nhập lý do. FE bật **Xác nhận duyệt**, thể hiện có thể tiếp tục duyệt dù lịch học viên bị trùng.

**Đối chiếu source:**

- FE `src/features/manager/components/manager-leave-detail-page.tsx:62` chỉ coi xung đột là điều kiện chặn khi `period !== 'FULL_DAY'`; dòng 86 kiểm tra lại cũng giữ ngoại lệ này. Dialog FULL_DAY cho xác nhận xung đột ở dòng 477.
- BE `src/modules/teaching-operations/services/mentor-leave.service.ts:394` gọi `planning.validate()` trước bước acknowledge.
- BE `src/modules/teaching-operations/services/leave-planning.service.ts:218` ném `LEAVE_STUDENT_CONFLICT` khi có bất kỳ xung đột học viên nào, không có ngoại lệ FULL_DAY. Vì thế acknowledge không thể làm trường hợp này được duyệt theo source hiện tại.
- `Mindy-BE/docs/api_flow/PHASE_4_4_FLOW.md` có cập nhật 23/10/2026: mọi period đều chặn student overlap khi tạo và duyệt.

**Tác động:** Manager được dẫn qua thao tác không thể hoàn tất với policy BE hiện tại. Không phải bằng chứng FE vượt qua được phân quyền hoặc transaction BE.

**Hướng sửa:** đồng bộ policy với BE: chặn duyệt khi có xung đột ở mọi period, giải thích rõ cần sắp lại lịch và vẫn cho từ chối đơn còn hạn. Cập nhật fixture còn giả định FULL_DAY có thể duyệt sau acknowledge.

**Giới hạn:** chưa thực hiện approve trên DB deploy để chứng minh response live; kết luận dựa trên source BE và UI fixture. Không thay lịch học thật trong lượt kiểm tra.

Ảnh dialog cho phép xác nhận: [desktop](manager-2026-11-04/full-day-conflict-approval-desktop.png), [mobile](manager-2026-11-04/full-day-conflict-approval-mobile.png).

## Kết quả kiểm thử

- Unit Manager/proxy: **6 files / 55 tests pass**.
- E2E production hiện có: **82 pass / 12 fail** trong 94 ca desktop/mobile. Dùng production build riêng `.next/mentor-qa` đã build thành công trong cùng phiên, cùng source nghiệp vụ. [Log](manager-2026-11-04/production-e2e-output.txt).
- Cả 12 fail thuộc 6 ca xử lý đơn xin nghỉ chạy trên hai viewport. Fixture có hạn duyệt `2026-10-27`, nhưng suite không cố định clock; ngày kiểm tra là 04/11/2026 nên UI đúng khi ẩn nút xử lý đơn quá hạn. Đây là vấn đề tính ổn định của bộ test, cần sửa fixture/clock; không coi là 12 bug sản phẩm.
- Bản sao suite xin nghỉ chỉ bổ sung clock `2026-10-23`: **16/16 pass** trên desktop/mobile, tách khỏi tests sản phẩm để xác minh nguyên nhân thời gian. Các assertion FULL_DAY cũ vẫn mô tả policy FE cũ; pass không chứng minh đã đồng bộ với BE.
- Lượt audit gộp có **19 pass / 1 fail**: ca live mobile chưa điều hướng sau login. Chạy lại đúng ca đó có response login 200 và **1/1 pass**, tái hiện MANAGER-01/02 trên mobile. Chưa xác định nguyên nhân lần đăng nhập chậm/thất bại trước đó, nên không kết luận thành bug auth. [Log audit](manager-2026-11-04/audit-test-output.txt), [log chạy lại mobile](manager-2026-11-04/mobile-live-recheck.txt). Các test tái hiện chủ động assert hành vi lỗi đang tồn tại; pass không có nghĩa đã sửa bug.
- API live qua adapter: **23 GET trả 200**, gồm session, 34 lớp, mentor directory, 39 đơn CASH, danh sách/detail tài liệu, 11 đơn xin nghỉ và detail. [Endpoint/status/count](manager-2026-11-04/api-read-evidence.json).
- Hai probe GET `manager/classes/:id/units` trả 404 `ENDPOINT_NOT_ALLOWED` tại adapter. Đây là endpoint BE ngoài allowlist FE hiện có; không có consumer UI của Manager trong phạm vi này, nên ghi nhận giới hạn khảo sát API, không đưa vào danh sách bug.
- Trên backend thật chỉ đăng nhập và đọc dữ liệu. Thu tiền, duyệt/từ chối tài liệu, upload, duyệt/từ chối đơn xin nghỉ và kiểm tra retry/version dùng các fixture trong test; không thực hiện giao dịch thu tiền hoặc sửa lịch/dữ liệu thật.
- Không chạy BE integration local vì repo BE thiếu node_modules/test database riêng; không dùng DB deploy cho các suite reset schema.

## Phạm vi source đã đối chiếu

`Mindy-BE/docs/api_flow/PHASE_2_4_FLOW.md`, cập nhật workflow leave trong `PHASE_4_4_FLOW.md`, ManagerOperationsController, CashPaymentsController, ManagerMaterialsController, ManagementLeaveController, material review policy và leave planning/service. Backend sở hữu role, version, transaction và các quyết định thu tiền/lịch học.

Script kiểm thử riêng tại [playwright.config.ts](manager-2026-11-04/playwright.config.ts) và [api-read-audit.mjs](manager-2026-11-04/api-read-audit.mjs). Chạy từ gốc FE2 với `MINDY_QA_EMAIL` / `MINDY_QA_PASSWORD` trong môi trường; không ghi credential vào file.

Chỉ thêm tài liệu/artifact QA. Chưa sửa code nghiệp vụ, commit/push hoặc deploy.
