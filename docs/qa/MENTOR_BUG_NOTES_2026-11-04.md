# Kiểm thử khu vực Mentor — 04/11/2026

Phạm vi: Mindy-FE2 tại `http://localhost:3001`, backend deploy được cấu hình là `https://api.quanh123.id.vn/api/v1`. Đã đọc luồng và source trong `../Mindy-BE`; không sửa nghiệp vụ FE/BE. Tài khoản kiểm thử do người dùng cung cấp; không lưu mật khẩu/cookie trong báo cáo.

Source tại lúc kiểm tra: FE2 `ab1d211`, BE `37a9aa7`. Source BE local là tài liệu đối chiếu; không khẳng định commit deploy trùng commit local.

## Các vấn đề

| ID | Ưu tiên | Vấn đề | Mức kiểm chứng |
| --- | --- | --- | --- |
| QA-01 | P2 | Xóa lọc Bài tập làm thoát tab Bài tập | Tái hiện với dữ liệu thật và fixture |
| QA-02 | P2 | Lưu link không thay đổi có thể làm mất cơ chế kế thừa link lớp | Kiểm chứng request bằng fixture; đối chiếu cách BE đọc/ghi; chưa ghi thử trên dữ liệu thật |
| QA-03 | P3 | Mất bộ lọc phân công khi vào lớp rồi quay lại | Tái hiện với dữ liệu thật và fixture |

P2: nên sửa trong lượt sửa lỗi gần nhất. P3: lỗi duy trì trạng thái/trải nghiệm, mức ảnh hưởng thấp hơn.

### QA-01 — “Xóa lọc” chuyển người dùng về Chương

**Bước tái hiện**

1. Đăng nhập Mentor → Lớp của tôi → mở một lớp.
2. Chọn tab **Bài tập**; có thể chọn Loại bài = Trắc nghiệm.
3. Bấm **Xóa lọc**.

**Thực tế:** URL mất cả `tab=assignments`; tab **Chương** được chọn. Đã tái hiện trên lớp `HTML-CSS-101-10S-20261013`, kể cả khi chưa chọn bộ lọc nào.

**Mong đợi:** xóa `page/type/purpose/status/sessionId` của bài tập và giữ `tab=assignments`.

**Nguyên nhân:** `src/features/assignments/components/assignment-list.tsx:117` gọi `router.push(pathname)`, xóa toàn bộ query string. `src/features/mentor/components/mentor-class-page.tsx:27` mặc định về `units` khi không có `tab`.

**Hướng sửa:** chỉ xóa các query key thuộc bộ lọc bài tập; giữ tab và query không thuộc feature này.

Ảnh: [trước khi xóa lọc](mentor-2026-11-04/live-tab-4-desktop.png), [sau khi xóa lọc](mentor-2026-11-04/live-clear-filter-desktop.png), [tái hiện với fixture mobile](mentor-2026-11-04/assignment-clear-mobile.png).

### QA-02 — Lưu nguyên link kế thừa tạo override ngoài ý muốn

**Điều kiện:** buổi học chưa có link riêng (`session.meetingUrl = null`), đang dùng link chung của lớp, ví dụ URL A.

**Bước tái hiện theo contract**

1. Mở buổi học → **Sửa link buổi học**.
2. Giữ nguyên URL A đang điền sẵn.
3. Bấm **Lưu link buổi học**.
4. Nếu sau đó link chung của lớp đổi sang B, buổi này tiếp tục dùng A.

**Nguyên nhân đã đối chiếu:**

- BE `src/modules/classes/services/teaching-read.service.ts:271` trả `session.meetingUrl ?? classEntity.meetingUrl` qua trường `meetingUrl` của context, nên FE nhận giá trị hiệu lực, không phân biệt link riêng với link kế thừa.
- FE `src/features/mentor/components/mentor-meeting-editor.tsx:15` điền sẵn giá trị đó và dòng 32 gửi lại như một override tường minh. Kiểm thử trình duyệt xác nhận mở form rồi lưu không sửa vẫn gửi PATCH với URL đang hiển thị.
- BE `src/modules/classes/services/session-meeting.service.ts:51` so sánh với **link riêng** hiện lưu và ghi URL vào `session.meetingUrl`. Với trạng thái ban đầu null, thao tác này đổi cách buổi học nhận các cập nhật link lớp trong tương lai.

**Mong đợi:** lưu form không thay đổi phải giữ chế độ kế thừa. Nên có trạng thái rõ “Dùng link chung của lớp” / “Link riêng của buổi”, hoặc contract trả riêng override và effective URL.

**Giới hạn bằng chứng:** đã kiểm request FE bằng fixture và đọc implementation BE; không chỉnh link lớp/buổi trên backend thật để thực hiện bước 4. Đây là kết luận từ contract và source, không phải một transaction đã kiểm chứng trên DB deploy.

### QA-03 — Quay lại danh sách làm mất bộ lọc

**Bước tái hiện**

1. Lớp của tôi → Phân công = **Mentor chính**.
2. Mở một lớp từ kết quả.
3. Bấm **← Lớp của tôi**.

**Thực tế:** Phân công trở về **Tất cả phân công**. Đã kiểm chứng bằng tài khoản thật với `PRIMARY → ANY`; fixture cũng tái hiện `SUBSTITUTE → ANY`.

**Mong đợi:** quay lại đúng bộ lọc/trang vừa dùng. Tương tự, reload cũng nên giữ trạng thái danh sách.

**Nguyên nhân:** `src/features/mentor/components/mentor-classes-page.tsx:17`–19 giữ page/status/assignment trong `useState`; link quay lại là `/mentor/classes`, không mang trạng thái danh sách.

**Hướng sửa:** đặt filter/page trên URL và giữ URL quay lại. Ảnh đối chứng: [desktop](mentor-2026-11-04/class-filter-reset-desktop.png), [mobile](mentor-2026-11-04/class-filter-reset-mobile.png).

## Kiểm chứng và giới hạn

- API thật: **82 GET trả 200**, qua adapter cùng origin, gồm 6 lớp, lịch tuần, đơn xin nghỉ, workspace, chương, buổi học, roster, chuyên cần, tiến độ, bài tập, học liệu, context, điểm danh và ghi chú. Chi tiết endpoint/status/count tại [api-read-evidence.json](mentor-2026-11-04/api-read-evidence.json). Đây là kiểm tra đọc, không chứng minh mọi trường hợp dữ liệu hoặc mọi mutation đều đúng.
- FE unit: **4 files / 20 tests pass** (`src/features/mentor` và `mentor-workspace-proxy.test.ts`).
- Production build: **pass**, dùng output riêng `.next/mentor-qa` để không thay preview đang chạy. [Build log](mentor-2026-11-04/build-output.txt).
- E2E hiện có trên production build mới: **72 pass / 2 fail / 2 skip**, cả desktop/mobile. Hai fail cùng một assertion cũ ở `tests/e2e/mentor-session-materials.e2e.ts:24`: yêu cầu toàn trang không có nút chứa “bài tập”, trong khi class workspace hiện có tab **Bài tập** theo tính năng đã triển khai. Nên giới hạn assertion vào vùng nội dung chương nếu mục tiêu là kiểm tra không có nút bài tập ở từng buổi. Đây là lỗi kiểm thử cần cập nhật, không phải lý do để xóa tab sản phẩm. [Log đầy đủ](mentor-2026-11-04/production-e2e-output.txt).
- Các ca audit bổ sung: **6 pass / 2 timeout** trong lượt cuối. Các bước đã in log xác nhận QA-01 trên dữ liệu thật desktop/mobile và QA-03 trên dữ liệu thật desktop; hai bài live gộp nhiều thao tác hết tổng thời gian 30 giây. Không tính hai ca này là pass. File tái hiện được lưu riêng trong thư mục QA và tăng ngân sách thời gian cho lần chạy sau; chưa chạy lại bản đã điều chỉnh này. Một ca tái hiện pass chỉ chứng minh hành vi lỗi còn tồn tại. [Audit log](mentor-2026-11-04/audit-test-output.txt), [script tái hiện](mentor-2026-11-04/mentor-audit.e2e.ts).
- Không chạy BE integration/HTTP local: repo BE chưa có `node_modules`, và chưa cấu hình test database riêng. Không dùng DB deploy làm database cho các suite reset schema.
- Các mutation như start/finalize/điểm danh, gửi/rút đơn xin nghỉ, upload/gửi duyệt và sửa ghi chú được kiểm bằng fixture trong bộ E2E. Trên backend thật chỉ đăng nhập và đọc dữ liệu; chưa kiểm nghiệm các mutation đó trên DB deploy.
- Hai ca mobile của bộ responsive chủ động skip vì dành cho viewport desktop/tablet; xem log để phân biệt với lỗi.

## Luồng BE đã đối chiếu

- `docs/api_flow/PHASE_4_6_FLOW.md`: discovery `ANY/PRIMARY/SUBSTITUTE`, scope CLASS/SESSION, capability, attendance-candidates, note version/deadline và reports.
- `MentorWorkspaceService`: kiểm quyền theo phân công hiện tại; primary xem toàn lớp, substitute chỉ buổi/chương được giao; lớp cancelled/completed chỉ đọc.
- `effectiveMentorId`: SCHEDULED dùng override hoặc primary; sau start dùng teaching snapshot.
- `MentorWorkspaceController`, `MentorProgressService`, controller/service attendance, mentor assignments và `SessionMeetingService`: đối chiếu endpoint, role và điều kiện thao tác với consumer FE.

Chưa thay đổi code nghiệp vụ, chưa commit/push hoặc deploy.

Các script QA được đặt ngoài `tests/e2e` để không tự chạy trong suite thông thường. Chạy từ thư mục gốc FE2: `npx playwright test --config docs/qa/mentor-2026-11-04/playwright.config.ts`. Ca live cần `MINDY_QA_EMAIL` và `MINDY_QA_PASSWORD` trong môi trường; không điền credential vào file. Script API đọc tại [api-read-audit.mjs](mentor-2026-11-04/api-read-audit.mjs). Các ảnh live của tab Bài tập có thể chụp lúc query đang tải; dùng log API để kiểm tra status và ảnh sau xóa lọc để kiểm tra tab được chọn.
