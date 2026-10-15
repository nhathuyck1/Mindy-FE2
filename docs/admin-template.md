# Template quản trị Mindy FE2

Cập nhật 15/10/2026. Người dùng mở rộng sang Admin trên FE2; Mindy-FE và Mindy-BE chỉ đọc tham khảo, không sửa.

## Thiết kế và routes

Tham chiếu `docs/sidebar.png` cho sidebar gọn, nhóm điều hướng và trạng thái chọn; `docs/admin table.png` cho tab trạng thái, toolbar, bảng thành viên, badge và thao tác từng dòng. Dùng font Inter Variable (có tiếng Việt), chữ đen trên nền trắng; border, button và hover giữ palette Mindy.

| Route             | Nội dung                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `/admin`          | Bốn thẻ số liệu, chart hoạt động/tháng + trạng thái lớp + vai trò tài khoản, bảng lớp và khóa học theo số lớp |
| `/admin/users`    | Bảng tài khoản, filter role/status, thông tin liên hệ                                                         |
| `/admin/courses`  | Bảng khóa học, filter isActive, danh mục/học phí VND                                                          |
| `/admin/classes`  | Bảng lớp, filter status/deliveryMode, mentor/chỗ còn lại/khai giảng                                           |
| `/admin/workflow` | Hướng dẫn tài khoản → khóa học → lớp; ghi rõ module hiện hỗ trợ tra cứu                                       |

Sidebar 228px, thu gọn 76px; dưới 1024px dùng dialog menu. Canvas mint rất nhạt, panel trắng, viền mảnh; mint cho thao tác/chọn, peach/coral cho trạng thái cần chú ý. Bảng cuộn ngang trong panel, trang không tràn viewport 320px. Dialog/Sheet shadcn/ui (Radix) giữ focus, Escape đóng, restore focus sau unmount và khóa scroll nền.

## API và quyền

Đã GET Swagger live `https://api.quanh123.id.vn/docs-json` ngày 15/10/2026, đối chiếu ba list endpoint và UserPageDto/CourseManagementDto/ClassManagementDto. Đọc BE `docs/api_flow/PHASE_1_FLOW.md`, `PHASE_1_flow-api-breakdown.md`, `PHASE_2_3_TO_3_2_FLOW.md`, `PHASE_4_API_SUMMARY.md`; controller users/admin-catalog/admin-classes và DTO filter/response là nguồn thực thi.

| GET qua same-origin `/api/v1` | Query adapter cho phép                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/admin/users`                | page, pageSize, role ADMIN/MANAGER/MENTOR/STUDENT, status ACTIVE/PENDING_VERIFICATION/SUSPENDED                              |
| `/admin/courses`              | page, pageSize, categoryId UUID, isActive true/false                                                                         |
| `/admin/classes`              | page, pageSize, courseId UUID, mentorId UUID, status DRAFT/OPEN/IN_PROGRESS/COMPLETED/CANCELLED, deliveryMode ONLINE/OFFLINE |

List trả `{items,page,pageSize,total}`, không wrapper data. UI dùng role/status/isActive/deliveryMode; filter UUID validate ở adapter, chưa có control chọn category/course/mentor. Input strict, pageSize 1–100. Zod validate response và timestamps; meetingUrl bị loại khỏi projection bảng. Chỉ forward cookie access_token, private no-store; detail và writes được mở theo allowlist ở phần CRUD bên dưới.

Backend kiểm quyền ADMIN và trạng thái tài khoản; FE guard chỉ phục vụ điều hướng. Guest có link login giữ đúng admin returnTo allowlist. ADMIN ACTIVE vào shell; role khác bị chặn trước khi gọi list. API 401 yêu cầu login lại, 403 báo thiếu quyền, lỗi mạng có retry. Không lưu token trong browser storage. Login ADMIN thông thường đi `/admin`; returnTo hợp lệ vẫn được giữ, kể cả course registration.

Thay phiên dùng `replaceSession`: cancel query đang chạy, cập nhật query session được guard/header observe, xóa cache query khác và mutation cache. Không remove query session trước khi set dữ liệu vì observer đang mount có thể giữ phiên cũ. Logout ẩn nội dung admin ngay; regression được tìm thấy và sửa bằng browser tests.

## Cách dùng lại

- `AdminResourcePage` sở hữu filters/page/selection/columns/dialog; `AdminDataTable` render bảng và phát sự kiện.
- `admin-resources.ts` giữ nhãn, cột và mapping filter. `useAdminList` có query key gồm resource + filters; validate DTO rồi map sang row. Server state ở TanStack Query.
- Status/role/deliveryMode và pagination chạy server. Search không dấu và sort tên chỉ trong trang đã tải, có nhãn trên UI. Không gửi q/sort mà BE chưa hỗ trợ.
- Chọn dòng/cả trang, ẩn cột phụ, refresh, pageSize 10/20/50. CSV UTF-8 BOM xuất các dòng đã chọn hoặc kết quả hiển thị trong trang; escape quotes và trung hòa công thức spreadsheet.
- “Xem” mở thông tin từ list hiện tại; chưa tải giáo trình/lịch buổi đầy đủ. Không có mutation tạo/sửa giả.
- Tổng quan không có trend/doanh thu/chart giả. Chỗ còn lại dùng availableSeats; không suy ra số enrollment ACTIVE từ chỗ đang hold.

Dashboard bổ sung theo ảnh mẫu ngày 15/10/2026: Card/Chart shadcn và Recharts, bốn chỉ số người dùng/khóa học/lớp/đang tuyển sinh. Ba Query snapshot đọc đủ GET list pageSize tối đa 100, dùng pageSize thực server trả cho trang tiếp theo; chỉ aggregate sau khi đủ unique IDs và total nhất quán. Không mở API mới hoặc writes. Biểu đồ vùng tạo mới theo createdAt UTC+7 (3/6/12 tháng), bar số lớp từng trạng thái, donut vai trò người dùng; top khóa học dựa trên courseId của lớp. Bảng 5 lớp giữ popup thao tác. Đổi phiên xóa cache, mutations invalidate prefix admin. Có Skeleton/error/retry/empty và bản số liệu chữ cho chart; tắt animation Recharts, responsive từ 320px. Dữ liệu lịch sử tạo mới dựa trên các bản ghi hiện còn trong hệ thống, không tái dựng lịch sử trạng thái hay giao dịch.

Tạo tài khoản/đổi trạng thái, course units/activation và class lifecycle đã tích hợp theo yêu cầu CRUD. Payment, materials, mentor assignment và attendance chưa tích hợp. Flow Phase 4 phân công mentor cần expectedVersion/reason/idempotency; không ghép thành một nút sửa lớp chung. Source BE có API không đồng nghĩa mọi module đã deploy.

## CRUD theo API hiện có — 15/10/2026

Nút Tạo ở heading; thao tác từng dòng hiện là các Button icon có màu riêng theo yêu cầu mới, dùng chung cho users/courses/classes và tổng quan. Theo yêu cầu mới, Dialog nằm giữa màn hình với backdrop làm tối/blur nền, chuyển trực tiếp Xem/Sửa/Học viên bằng các nút trong modal. Dialog chi tiết nhanh dùng dữ liệu list; editor tải GET detail riêng, skeleton/error/retry. Modal có chế độ embedded để tái sử dụng nguyên nội dung trong popup mà không lồng overlay; create/category/confirmation vẫn dùng dialog. Modal giữ focus, đóng bằng Escape/bấm nền/dấu X và trả focus về nút đã mở. Chuyển mục không tự lưu form. Chọn danh mục và nút tạo danh mục trên một hàng. Status dùng nhãn + chấm pulse xanh/vàng/đỏ, reduced motion tắt.

| Tài nguyên | Allowlist mới                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Người dùng | POST `/admin/users`; GET `/admin/users/:id`; PATCH `/admin/users/:id/status`                                                                                             |
| Danh mục   | POST `/admin/course-categories`; lựa chọn dùng danh mục công khai đang hoạt động                                                                                         |
| Khóa học   | POST `/admin/courses`; GET/PATCH `/admin/courses/:id`; POST `/:id/units`, `/:id/activate`; PUT `/:id/units/order`                                                        |
| Lớp        | POST `/admin/classes`; GET/PATCH `/admin/classes/:id`; POST `/:id/sessions`, `/:id/open`, `/:id/start`, `/:id/complete`, `/:id/cancel`; PATCH `/:id/sessions/:sessionId` |

Các path viết tắt trong hai dòng cuối nằm dưới `/admin/courses` hoặc `/admin/classes`. Không có DELETE ở BE cho ba tài nguyên; user chỉ hỗ trợ trạng thái, course không có deactivate; không hiển thị thao tác giả. Mentor assignment cần version/reason/idempotency và chưa tích hợp.

User mới ACTIVE; khóa học mới inactive, cần học phần trước kích hoạt. Lớp mới DRAFT, sao chép học phần và cần lịch hợp lệ để mở. Chỉ DRAFT sửa ngày/sĩ số/hình thức; lớp hoàn thành/hủy chỉ đọc. Buổi mới gửi ISO có offset +07:00; đổi giờ gửi HH:mm, giữ ngày. Backend kiểm lịch trùng, điều kiện trạng thái và quyền.

Contracts đối chiếu Swagger và DTO/flow BE; adapter có strict Zod input/output, UUID, Origin và giới hạn body 64KiB cho Admin; access_token/private no-store. Mutation không tự retry, không optimistic update, invalidate admin/catalog và session khi đổi trạng thái tài khoản. Đã có unit boundary tests và E2E stateful mocks; chưa ghi dữ liệu backend thật.

## Kiểm chứng

Unit tests kiểm allowlist/cookie/403/filter invalid/unsupported write denied/CSV injection và admin returnTo. E2E fixtures chỉ ở `tests/e2e/admin-fixtures.ts`, không có dữ liệu demo trong runtime. Test guest/student/suspended admin không gọi list, login returnTo, logout xóa UI, pagination/filter/search/selection/export/columns, dialog focus/Escape, mobile navigation, lỗi 401/403/503/empty và viewport 1440/393/320px. Ảnh ở `test-results/` (gitignored).

Chỉ GET Swagger và anonymous/public endpoints live; chưa có credentials ADMIN nên chưa smoke test list bằng tài khoản backend thật. Không tạo tài khoản/lớp/khóa học hoặc giao dịch thật. Build `.next-admin-review` không ghi đè output preview đang chạy.

## Component shadcn/ui

Nguồn cài bằng CLI chính thức (new-york, Radix), cấu hình tại `components.json`. Admin dùng Button/Table/Input/Badge/Checkbox/Dialog/Sheet/NativeSelect/Popover từ `src/components/ui`; wrapper Modal dùng controlled Dialog/Sheet và restore focus cho trường hợp mở bằng state. Helper cn ở `src/lib/utils.ts`; semantic color tokens trong globals.css ánh xạ palette Mindy. Token muted hiện có dành cho chữ nên component dùng bg-soft cho bề mặt nhạt. Variant/size unstyled của Button phục vụ lớp admin-button hiện có; component vẫn dùng Slot, CVA và state/accessibility chuẩn shadcn. Khi thêm component bằng CLI, dùng imports cn từ helper dự án.

## Xem học viên theo lớp — 15/10/2026

Nút Học viên (link) trên bảng `/admin/classes` chuyển sang route `/admin/classes/[classId]/students`; page validate UUID (sai → notFound), returnTo đăng nhập lại cho phép đúng pattern này, sidebar giữ mục Lớp học active. Heading lấy GET `/admin/classes/:classId` (tên, mã, trạng thái, giảng viên, khai giảng). Bảng gọi GET `/admin/classes/:classId/students?page&pageSize` (10/20/50), tìm kiếm và sắp xếp tên chỉ trong trang đã tải; nút Xem mở Dialog gọi GET `/admin/classes/:classId/students/:studentId` (`AdminClassStudentDetailDto`: ngày đăng ký, tạo tài khoản, đăng nhập cuối). Đối chiếu Swagger live 16/10/2026: BE chỉ có hai GET này, không có POST/PATCH/DELETE học viên theo lớp, nên chưa có thao tác thêm/sửa/xóa. Danh sách gồm chờ thanh toán/đang học/hoàn thành, không phải roster điểm danh. Proxy chỉ mở đúng hai GET, UUID strict, query rỗng cho detail, access_token/private no-store. Có loading/error/retry/empty/phân trang.
