# Đối chiếu các nhánh FE — 06/11/2026

Nhánh làm việc: `Feat/FixUIstudent`, đầu vào `4b472bd`. Đã fetch và kiểm tra đủ 18 nhánh trên GitHub, phân biệt commit còn riêng bằng ancestry và patch equivalence. Không checkout sang nhánh người khác, không tạo commit/push/deploy hoặc sửa source BE.

## Kết quả nhánh

| Nguồn                                                 | Kết quả                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev` — `7e3dc7c`                                     | Có các commit mới chưa nằm trong nhánh hiện tại; chọn phần UI chung, danh sách bài tập/học liệu, dashboard tài liệu và import quiz.                                  |
| `feature/bug-mentor` — `81cdd08`                      | Tính năng đã có trong `dev`; không nhập lần hai.                                                                                                                     |
| `feature/test-mentor` — `91c3472`                     | Commit riêng là tài liệu/ảnh/script QA Admin, Manager, Mentor. Đọc báo cáo để kiểm lỗi; không coi kết quả QA cũ là nghiệm thu bản tích hợp.                          |
| `compiler` — `9f771ff`                                | Ngoài phạm vi theo yêu cầu mới nhất. Giữ nguyên thư mục code-assignments, editor/authoring/review/runner và các shell/CSS liên quan so với HEAD đầu vào.             |
| `main`, `codex/portable-backend`, `Feat/FixUIstudent` | Giữ lịch Student/Mentor dùng chung, giao diện buổi học, danh sách người trên bảng và kết nối realtime hiện tại.                                                      |
| `feature/manager-file-manage`, `Feat/FixUI`, `mentor` | Còn commit lịch sử riêng về UI. Đối chiếu chức năng với bản hiện tại; bảng tài liệu/lịch đã có triển khai mới tương ứng, không đưa toàn bộ bố cục cũ đè lên bản mới. |
| Các nhánh Admin/booking/manager/mentor cũ còn lại     | Đã kiểm tra lịch sử; không có nhóm tính năng mới ngoài các nguồn trên cần nhập thêm.                                                                                 |

Phần UI chung được chọn từ `2c4a4ed` và `81cdd08`; không nhập nguyên commit/nhánh. Thay đổi compiler/demo và code chat/bảng vẽ đã được gỡ khỏi diff theo yêu cầu của người dùng. [Nguồn FE](https://github.com/nhathuyck1/Mindy-FE2/commits/dev).

## Chức năng sau tích hợp

| Luồng                   | Kết quả                                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler, chat, bảng vẽ | Giữ nguyên triển khai ban đầu; không nhập workspace/demo/theme hoặc tính năng code chat/bảng từ các nhánh khác.                                                                                |
| QUIZ/ZIP                | Giữ nộp bài, lịch sử, grade/release, thêm import câu hỏi trắc nghiệm có xem trước.                                                                                                             |
| Bài tập Student         | Một danh sách QUIZ/ZIP/CODE, chọn lớp đủ trang, chỉ lớp `canViewClass/FULL`; URL giữ lớp và bộ lọc, có pagination.                                                                             |
| Học liệu                | Accordion mở tại chỗ, gom theo buổi/chương; giữ preview/quyền, meeting/bảng/bài tập và tracking ARTICLE khi thực sự mở viewer.                                                                 |
| Manager                 | Dashboard tài liệu theo khóa, hàng chờ có khóa/học phần/loại; giữ thu tiền, duyệt nghỉ, lịch tuần và retention hiện tại.                                                                       |
| Điều hướng              | Login giữ các route bài tập/review/tin nhắn và bảng Mentor đã validate. Dashboard → đúng buổi, buổi → lớp. Không thay điều hướng bên trong compiler.                                           |
| Bộ lọc                  | Xóa lọc bài tập giữ tab/lớp; inventory không đổi REJECTED/Tất cả thành PENDING_REVIEW. Admin, phân công Mentor và loại tài liệu có URL state; Admin sửa trang vượt giới hạn sau khi tổng giảm. |
| Link buổi học           | Không gửi PATCH khi chưa thay đổi URL, tránh ghi đè cơ chế kế thừa link lớp.                                                                                                                   |
| UI                      | Giảm card ở dashboard theo role/danh sách lớp/bộ lọc bài tập; rút gọn chữ, giữ palette và kiểm tra 320px.                                                                                      |

## Đối chiếu BE thật

Nguồn BE `dev` tại `6dd944f` và Swagger deploy `https://api.quanh123.id.vn/docs-json` đọc được 253 path trong lượt kiểm tra. Lịch tuần/preview và bulk-delete tài liệu có trong Swagger. Không sửa source BE.

Phát hiện và sửa chênh lệch của FE `dev`: `GET manager/materials` trên Swagger/source BE **không nhận `courseId`**. Hàng chờ dùng khóa để tải danh sách học phần, yêu cầu chọn học phần rồi gửi `courseUnitId`; proxy không mở query `courseId`. Không mô phỏng thêm API BE chưa tồn tại.

Giữ cả hai cách FULL_DAY (đổi ngày giữ giờ/chọn slot), catalogue slot từ BE, version/receipt, kiểm overlap, signed-image access, emoji và session recovery của nhánh hiện tại. Không nhập chức năng từ nhánh BE chưa merge.

## Kiểm chứng

- Production build, TypeScript và ESLint: thành công sau khi gỡ phần compiler.
- Unit tests bản UI chung: 347 tests thành công.
- E2E production desktop/mobile: **507 PASS, 5 SKIP** theo cấu hình viewport, 0 lỗi; chạy toàn bộ bằng `npm run test:e2e -- --workers=4` trong 3,5 phút.
- Prettier tất cả file sửa: PASS. `format:check` toàn repo còn 332 file baseline ngoài phạm vi, giữ nguyên theo yêu cầu không sửa compiler và không format lan rộng.
- Preview `http://localhost:3001`: GET trang chủ, Bài tập Student và học liệu Manager đều HTTP 200; server dev tiếp tục chạy để người dùng test.
- Fixture chung chặn request API chưa mô phỏng bằng lỗi 503 có mã riêng; không để kiểm thử lọt sang backend thật. Kiểm tra nghiệp vụ bằng fixture không thay nghiệm thu nhiều tài khoản, worker/runner/storage hoặc dữ liệu thật trên deploy.

Đây là thay đổi local chờ người dùng review/commit. Preview ở `http://localhost:3001`, dùng build directory riêng với production E2E.
