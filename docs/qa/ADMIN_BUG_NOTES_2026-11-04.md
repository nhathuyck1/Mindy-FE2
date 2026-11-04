# Kiểm thử khu vực Admin — 04/11/2026

Môi trường: `http://localhost:3001` → backend deploy `https://api.quanh123.id.vn/api/v1`. Source FE2 `ab1d211`, BE local `37a9aa7`. Đã đăng nhập tài khoản Admin do người dùng cung cấp sau khi xác nhận lại email. Không lưu mật khẩu/cookie vào tài liệu hoặc artifact.

## Các vấn đề

| ID       | Ưu tiên | Vấn đề                                                                                            | Kiểm chứng                                          |
| -------- | ------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ADMIN-01 | P3      | Bộ lọc vai trò người dùng mất sau reload                                                          | Dữ liệu thật, desktop/mobile                        |
| ADMIN-02 | P2      | Trang hiện tại vượt tổng số trang sau khi tổng kết quả giảm, làm danh sách rỗng dù vẫn có dữ liệu | Fixture mô phỏng thay đổi đồng thời, desktop/mobile |

### ADMIN-01 — Reload làm mất lọc vai trò

**Bước tái hiện**

1. Vào **Người dùng**.
2. Chọn vai trò **Giảng viên (MENTOR)**.
3. Tải lại trang.

**Thực tế:** select trở về **Tất cả vai trò** và request đọc lại không giữ `role=MENTOR`. Đã tái hiện trực tiếp trên tài khoản thật ở cả desktop/mobile. Tại thời điểm kiểm tra, API có 31 Mentor trên tổng 77 người dùng.

**Mong đợi:** giữ vai trò đang lọc sau reload; có thể mở/chia sẻ lại cùng danh sách từ URL.

**Nguyên nhân:** `src/features/admin/components/admin-resource-page.tsx:29`–33 giữ status/filter/page/pageSize trong state cục bộ; không đọc/ghi query URL. Lượt này tái hiện cụ thể filter vai trò, không coi mọi bộ lọc ở tất cả route đã được kiểm đủ.

**Hướng sửa:** đưa bộ lọc và phân trang lên URL, validate giá trị và đặt lại page khi đổi bộ lọc.

Ảnh sau reload: [desktop](admin-2026-11-04/users-filter-reset-desktop.png), [mobile](admin-2026-11-04/users-filter-reset-mobile.png).

### ADMIN-02 — Hiển thị “3 / 2” và kết quả rỗng khi tổng giảm

**Điều kiện mô phỏng:** có 21 người dùng ACTIVE, mỗi trang 10 dòng. Trong lúc Admin đang ở trang 3, một người dùng ở trang cuối bị Admin khác tạm khóa nên còn 20 kết quả ACTIVE.

**Bước tái hiện**

1. Người dùng → chọn **Hoạt động**.
2. Đi đến trang 3/3, nơi có người dùng cuối cùng.
3. Cho lần đọc tiếp theo trả đúng dữ liệu mới: `items: []`, `page: 3`, `pageSize: 10`, `total: 20`.
4. Bấm **Làm mới**.

**Thực tế:** thanh phân trang hiển thị **3 / 2**, badge tổng vẫn là **20**, nhưng nội dung báo **Không có kết quả phù hợp**. Người dùng phải tự chuyển về trang trước mới thấy dữ liệu.

**Mong đợi:** khi page vượt giới hạn sau refetch/mutation, chuyển về trang hợp lệ gần nhất (ở đây là trang 2), đọc lại và hiển thị 10 dòng còn phù hợp. Không hiển thị empty state như thể bộ lọc không có kết quả.

**Nguyên nhân:** `src/features/admin/components/admin-resource-page.tsx:51` tính lại `totalPages` nhưng không điều chỉnh `page`. Dòng 242 chọn empty state theo `rows.length === 0`; dòng 313 hiển thị trực tiếp `page / totalPages`.

**Đối chiếu BE:** `src/modules/users/users.service.ts`, `listUsers()`, lọc status trước phân trang, sau đó dùng offset `(page - 1) * pageSize` và `getManyAndCount()`. Vì thế response trang vượt phạm vi nhưng `total > 0` là trường hợp bình thường khi kết quả thay đổi. `updateStatus()` làm tài khoản rời bộ lọc ACTIVE; client cần xử lý thay đổi tổng.

**Giới hạn:** đã tái hiện bằng fixture có đúng contract; không khóa tài khoản thật để tạo điều kiện này trên DB deploy.

**Hướng sửa:** chỉ sau khi query có response thành công, clamp page về `max(1, ceil(total/pageSize))` rồi refetch; xử lý cả tổng 0. Không clamp theo số 0 tạm thời khi query đang pending.

Ảnh: [desktop](admin-2026-11-04/page-out-of-range-desktop.png), [mobile](admin-2026-11-04/page-out-of-range-mobile.png). [Log tái hiện](admin-2026-11-04/pagination-repro-output.txt).

## Kết quả kiểm thử

- Unit Admin/proxy: **5 files / 17 tests pass**.
- E2E production hiện có: **38/38 pass**, gồm desktop/mobile. Dùng production build riêng `.next/mentor-qa` đã build thành công trước đó trong cùng phiên, cùng source nghiệp vụ. [Log](admin-2026-11-04/production-e2e-output.txt).
- Audit live: **2/2 pass**, đăng nhập thật và mở người dùng, khóa học, lớp, lịch sử hoạt động, đối soát; tái hiện ADMIN-01 ở desktop/mobile. [Log](admin-2026-11-04/audit-test-output.txt).
- Ca tái hiện ADMIN-02: **2/2 pass** với fixture, desktop/mobile. Các assertion chủ động xác nhận bug đang tồn tại; pass không có nghĩa đã sửa.
- API thật: **26 GET trả 200**. Đã đọc session, danh sách/filter/detail người dùng và khóa học, danh sách/filter/detail lớp, roster/contact học viên, tracking list/detail và reconciliation. [Endpoint/status/count](admin-2026-11-04/api-read-evidence.json).
- Dữ liệu tại lúc khảo sát: **77 người dùng**, **13 khóa học**, **34 lớp**, **496 sự kiện tracking**. Reconciliation đang có **0** sự kiện, nên bảng có dữ liệu/phân trang tại màn này được kiểm bằng fixture trong E2E, không phải dữ liệu thật.
- Suite hiện có bao gồm form tạo/sửa tài khoản/khóa học/lớp/học phần/lịch, đổi trạng thái, phân quyền, CSV, responsive, session recovery và tracking detail. Các thao tác ghi chỉ chạy với fixture; trên backend thật chỉ đăng nhập và đọc dữ liệu.
- Chưa chạy BE integration/HTTP local: repo BE chưa có node_modules/test database riêng. Không dùng DB deploy cho các suite reset schema.

## Đối chiếu BE và phạm vi

Đã đọc `Mindy-BE/docs/api_flow/ADMIN_TRACKING.md`, UsersController/UsersService, AdminCatalogController, AdminClassesController, DTO lịch buổi, tracking DTO và reconciliation DTO. Đối chiếu với allowlist, schema và consumer FE. Không xem các endpoint planned hoặc chưa được adapter mở là tính năng đã tích hợp.

Tracking chỉ là các audit BE đã ghi nhận, không phải toàn bộ HTTP/CRUD history. Màn reconciliation của FE hiện chỉ đọc theo phạm vi đã triển khai; không kết luận việc thiếu nút reconcile là bug.

Script và config QA đặt ngoài suite mặc định tại [playwright.config.ts](admin-2026-11-04/playwright.config.ts), [admin-audit.e2e.ts](admin-2026-11-04/admin-audit.e2e.ts), [api-read-audit.mjs](admin-2026-11-04/api-read-audit.mjs). Chạy từ gốc FE2; ca live nhận `MINDY_QA_EMAIL` và `MINDY_QA_PASSWORD` qua môi trường.

Chỉ thêm tài liệu/artifact QA. Chưa sửa code nghiệp vụ, commit/push hoặc deploy; không tạo/sửa/khóa tài khoản, thay lịch hoặc xử lý thanh toán thật.
