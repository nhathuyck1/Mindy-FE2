# Tiến độ

- 16/10/2026: Tăng khoảng cách dọc 4px giữa giờ bắt đầu, dấu | và giờ kết thúc trong cột Ca học.

- 16/10/2026: Điều chỉnh giờ dưới số ca theo chiều dọc: giờ bắt đầu ở trên, dấu | ở giữa, giờ kết thúc ở dưới; thu cột ca về 64px.

- 16/10/2026: Giờ bắt đầu và kết thúc dưới số ca nằm cùng một dòng, ngăn bằng dấu |; cột Ca học rộng 96px để giờ không xuống dòng.

- 16/10/2026: Theo xác nhận mới, thêm khung giờ bắt đầu/kết thúc nhỏ bên dưới số ca 1–6 trong cột Ca học; dùng đúng sáu khung giờ đã chốt, giữ cột gọn và giờ thực tế trong từng buổi.

## 16/10/2026 — Sáu ca học cố định theo giờ người dùng

- Ca 1: 07:30–09:00; ca 2: 09:30–11:00; ca 3: 13:00–15:30; ca 4: 16:00–17:30; ca 5: 18:00–19:30; ca 6: 20:00–21:30. Luôn giữ đủ sáu ca, cột Ca học chỉ hiện số.
- Xếp buổi theo ca chứa giờ bắt đầu; giờ bắt đầu trong khoảng nghỉ lấy ca có phần giao nhau dài nhất. Giữ giờ BE trong thẻ buổi, không đổi lịch thực tế. Buổi hoàn toàn ngoài ca và qua nửa đêm vẫn hiển thị trong hàng Khác theo ngày UTC+7.

- 16/10/2026: Đổi nhãn Học phần thành Chương trên toàn bộ giao diện Mentor: tab Chương & học liệu, danh sách/tiêu đề chương, các buổi trong chương và quyền mở/khóa chương. Giữ nguyên contract/API unit và cập nhật locator E2E tương ứng.

## 16/10/2026 — Bảng học viên Mentor theo mẫu Admin

- Thay bảng đơn giản bằng panel/table dùng cùng class và shadcn primitives với Admin: hàng 64px, header 48px, đường kẻ cột, hover và nhãn trạng thái màu có chấm.
- Thêm tab trạng thái thanh toán, lọc hình thức, tìm tên không dấu/sắp xếp trong trang, Làm mới và chọn số dòng/phân trang. Các filter/pagination đi qua API Mentor hiện có; không mở cash-orders/confirm hoặc API quản trị. Loading dùng skeleton chung, giữ state error/retry/empty và bảng cuộn trong panel trên mobile.
- Kiểm tra TypeScript, production build, ESLint/Prettier file thay đổi và 16 E2E Mentor desktop/mobile đạt. Test mới xác nhận hàng 64px, tìm không dấu, sort, đổi trang/số dòng, lọc trạng thái/hình thức, dữ liệu rỗng và viewport 320px. Đã xem screenshot desktop/mobile; API được mock, không ghi backend thật.

- 16/10/2026: Đảo vị trí theo yêu cầu mới: ô ngày bên trái, nhóm nút chuyển tuần bên phải; giữ căn giữa chiều dọc và thứ tự bàn phím theo bố cục.

- 16/10/2026: Căn giữa nhóm nút chuyển tuần theo chiều dọc trong panel điều khiển lịch, giữ nhóm nút bên trái và ô ngày bên phải.

- 16/10/2026: Thu gọn lịch thêm theo yêu cầu: ô trống cao 80px, thẻ buổi học khoảng 104px, giảm padding/gap/header và dòng khoảng tuần. Giữ cỡ chữ nội dung buổi và bố cục cột hiện tại. Kiểm tra lint/format, build và E2E lịch desktop/mobile.

- 16/10/2026: Thu hẹp cột ngày không có lớp trong cả tuần còn khoảng 80px, dành phần rộng còn lại cho ngày có lịch. Giữ đủ bảy ngày, ô lịch căn thẳng và cuộn ngang trên mobile. Kiểm tra build/TypeScript, lint/format và E2E desktop/mobile, có kiểm chiều rộng cột trống nhỏ hơn cột có lớp.

- 16/10/2026: Bỏ giờ bắt đầu/kết thúc ở cột Ca học theo yêu cầu; cột này chỉ hiện số ca. Giữ giờ trong từng buổi và cách nhóm ca hiện có.

## 16/10/2026 — Nút chuyển tuần bên trái, chọn ngày bên phải, ca 1 lúc 07:30

- Đặt nhóm Tuần trước / Tuần hiện tại / Tuần sau bên trái panel, ô chọn ngày dd/mm/yyyy bên phải. Giữ bố cục wrap trên mobile.
- Ca đầu hiển thị 07:30; khi chưa có buổi bắt đầu giờ này, giữ hàng trống và không bịa giờ kết thúc. Các buổi có giờ dạy đúng theo BE, không đổi lịch thực tế.
- Kiểm tra build/TypeScript, ESLint/Prettier và E2E lịch desktop/mobile; xác nhận thứ tự điều khiển, ca đầu và ảnh giao diện.

## 16/10/2026 — Chọn ngày dd/mm/yyyy và lịch gọn, đều cột

- Đưa bộ chọn lịch sang góc phải, thay native week input bằng ô dd/mm/yyyy cố định; hỗ trợ nhập/Enter/blur, icon mở lịch Popover, kiểm ngày thực tế (gồm năm nhuận) trước khi chuyển tuần.
- Bảng dùng bảy cột ngày bằng nhau, header/padding thấp hơn, nội dung canh trên; tiêu đề hai dòng, giờ/mentor/trạng thái có hàng cố định để căn thẳng. Giữ tooltip tên đầy đủ và liên kết chi tiết. Giảm chiều cao ca và font phụ vừa phải.
- Kiểm tra unit tests, build/TypeScript, ESLint/Prettier và E2E lịch desktop/mobile, gồm nhập ngày sai, chọn ngày từ popup và viewport 320px. Xem lại screenshot để kiểm bố cục.

## 16/10/2026 — Khung chọn tuần riêng theo ảnh tham khảo

- Thêm panel trắng bo góc phía trên thời khóa biểu: ô chọn tuần/năm, nút Tuần trước, Tuần hiện tại màu mint có icon lịch và Tuần sau. Desktop xếp ngang; mobile tự xuống hàng trong viewport. Bỏ ô chọn ngày và nhóm chuyển tuần trùng ở header bảng.
- Week picker dùng ISO week (ví dụ 2026-W42), chuyển đúng thứ Hai theo năm tuần, kể cả tuần giáp năm. Giữ lịch và API hiện có. Kiểm tra 64 unit tests, TypeScript/build, ESLint file thay đổi và E2E chọn/chuyển tuần desktop/mobile; xem screenshot panel.

## 16/10/2026 — Lịch Mentor dạng thời khóa biểu tuần

- Thay danh sách lịch bằng bảng theo ảnh người dùng: thứ Hai–Chủ nhật, các ca theo giờ thực tế, ngày hiện tại tô mint, buổi dạy có giờ/mentor/trạng thái/dạy thay và liên kết chi tiết/điểm danh. Giữ palette Mindy; mobile cuộn ngang trong panel, cột ca cố định.
- Có tuần trước/sau, về tuần này và chọn ngày. Tuần và ngày tính theo UTC+7; sự kiện qua nửa đêm hiện ở cả hai ngày, các buổi chung ca được giữ đầy đủ trong ô. Tuần rỗng vẫn hiển thị bảy cột ngày.
- Tải toàn bộ trang API của tuần trước khi hiển thị, kiểm ID trùng/total thay đổi để tránh lịch thiếu buổi. Không đổi endpoint BE hoặc mở API thu tiền.
- Kiểm tra 63 unit tests, TypeScript, ESLint/Prettier file thay đổi, production build và 14 E2E Mentor desktop/mobile; gồm đổi tuần, chọn ngày, ca trùng, lịch rỗng, viewport 320px và các luồng điểm danh/học liệu cũ. Kiểm tra API bằng mock và xem screenshot bảng tuần.

## 16/10/2026 — Không gian Mentor (FE2)

- Đọc BE teaching/roster/attendance/files và các nhánh mentor submission/unit release; xác minh Swagger live `/docs-json` có đủ API đã nối. Chỉ sửa FE2.
- Thêm `/mentor`, `/mentor/classes`, `/mentor/classes/[classId]`, `/mentor/sessions/[sessionId]`: guard MENTOR ACTIVE, sidebar desktop/mobile, login default/returnTo và menu tài khoản.
- Lịch dạy thực tế gồm dạy thay; danh sách lớp và học viên kèm trạng thái đăng ký/thanh toán (chỉ xem); unit được phân công và danh sách buổi của unit.
- Điểm danh theo snapshot/totals/permissions BE: bắt đầu, tick/bỏ tick, đồng bộ roster, xác nhận chốt; expectedVersion và Idempotency-Key, không tự retry writes. Bỏ tick buổi đã chốt gửi ABSENT; buổi mở gửi UNMARKED; lỗi conflict đọc lại trạng thái.
- Học liệu ARTICLE/FILE/VIDEO: list/detail, tạo/sửa/xóa nháp của mình chưa từng duyệt, gửi Manager duyệt; expectedRevision theo từng thao tác. File chính/đính kèm qua MinIO intent → PUT không cookie → complete → status polling/cancel; chặn file chưa READY/FAILED. Preview signed link có expiry; nội dung HTML trong sandbox/CSP. Mở/khóa/hẹn giờ unit theo UTC+7.
- Không nối GET/POST cash-orders/confirm, không có UI thu tiền; không có mentor assignment, attendance recovery/audit, duyệt học liệu hoặc xin nghỉ/bù.
- Kiểm tra: ESLint, TypeScript, production build `.next-mentor-review`, 59 unit tests và toàn bộ E2E 111 pass/3 skip theo cấu hình nền tảng; riêng Mentor 12 E2E desktop/mobile gồm upload PROCESSING→READY/FAILED, preview, permissions/conflict và viewport 320px. Đã xem screenshot lịch desktop và editor mobile; dev preview 3003 trả 200 cho `/mentor`.
- Prettier các file thay đổi đạt. `prettier --check .` còn báo các file cũ ngoài phạm vi (chủ yếu CRLF từ checkout); không format lan toàn repo. Test dùng API mock, chưa nghiệm thu account Mentor/MinIO thật.

- 15/10/2026: Nút trạng thái người dùng ở bảng mở thẳng hộp xác nhận khóa/mở tài khoản, không qua modal trạng thái; chỉ PATCH sau Xác nhận, Quay lại không ghi dữ liệu. Trigger AlertDialog chuẩn shadcn khôi phục focus. Bỏ nhãn Không gian làm việc ở sidebar.

## 15/10/2026 — Tổng quan có chart theo ảnh dashboard

- Bốn thẻ chỉ số + sparkline; biểu đồ vùng người dùng/lớp tạo mới theo tháng, bar trạng thái lớp, donut vai trò tài khoản; bảng lớp dùng lại thao tác popup và khóa học xếp theo số lớp. Card/Chart shadcn, Recharts, palette/typography Mindy; mobile xếp dọc, bảng cuộn nội bộ.
- Snapshot users/courses/classes lấy đủ trang qua GET adapter hiện có, Zod/cancellation và kiểm total/unique IDs; không trình bày partial page thành tổng. Query cache nhận invalidation CRUD và xóa khi đổi phiên. Tháng tính UTC+7, loại bản ghi tương lai; có 3/6/12 tháng, refresh, tooltip, số liệu chữ và loading/error/empty. Không dùng số liệu doanh thu/trend giả.
- Kiểm tra lint/format các file thay đổi, TypeScript và production build đạt; 40 unit tests và 30 E2E Admin desktop/mobile đạt. Test mới xác nhận tải đủ hơn 100 bản ghi, đổi 3/6/12 tháng, lỗi/retry và dữ liệu rỗng. Đã xem giao diện 1440/1024/393/320px, không tràn ngang/lỗi JavaScript. E2E dùng API mock; giữ dev preview 3003 và build riêng `.next-overview-review`, không ghi dữ liệu backend thật.

- 15/10/2026: Bỏ toàn bộ nhóm nút chuyển Xem/Sửa/Học viên bên trong modal theo yêu cầu mới; các nút icon thao tác chỉ còn ở bảng. Giữ modal ở giữa, nền mờ và dấu X.

## 15/10/2026 — Modal ở giữa và làm mờ nền

- Chuyển popup từng dòng thành Dialog shadcn nằm giữa màn hình, backdrop tối/blur toàn phần nền; không còn anchor/mũi tên. Giữ các nút icon/màu ở bảng và thêm các nút chuyển Xem/Sửa/Học viên ngay trong modal.
- Nội dung dùng chung ở chế độ embedded, không lồng header/dấu đóng. Giữ font lớn, ẩn thanh cuộn, giới hạn chiều cao, focus trap/Escape, dấu X và trả focus về nút mở; chuyển mục không tự lưu form.
- Lint/TypeScript/build đạt; 22 E2E hiện có đạt, hai kiểm thử modal desktop/mobile đạt sau bổ sung aria-modal. Kiểm tra modal đúng tâm hai chiều, backdrop blur, một dialog duy nhất, chuyển mục bằng chuột/bàn phím và focus sau Escape.

- 15/10/2026: Tăng toàn bộ chữ Admin thêm 2px qua typography tokens theo scope, gồm sidebar/header/bảng/form/nút/trạng thái/popup và confirmation; đồng bộ các cỡ px riêng. Giữ nguyên cỡ chữ trang marketing.

- 15/10/2026: Bỏ dòng hướng dẫn tìm kiếm/sắp xếp khỏi ba bảng; thanh phụ chỉ xuất hiện khi có dòng được chọn hoặc có bộ lọc cần xóa.

- 15/10/2026: Bỏ dòng mã dưới tên trong bảng Khóa học/Lớp học và bảng lớp ở Tổng quan; giữ email ở bảng Người dùng.

- 15/10/2026: Popup thông tin bỏ mã khóa/lớp dưới tên, dòng UUID/ID và nút Đóng cuối nội dung; giữ email người dùng và dấu X góc popup.

- 15/10/2026: Bỏ avatar chữ cái và icon trang trí trước tên trong bảng dùng chung Người dùng/Khóa học/Lớp học theo yêu cầu; giữ nút icon thao tác.

- 15/10/2026: Căn giữa checkbox ở cả header và các dòng users/courses/classes; cột chọn rộng 48px, bỏ padding lệch và dịch chuyển checkbox mặc định của Table shadcn.

## 15/10/2026 — Ẩn thanh cuộn popup

- Thêm utility scrollbar-hidden cho popup thao tác và Dialog, gồm vùng cuộn bảng bên trong; giữ cuộn bằng chuột/cảm ứng/bàn phím. Production build và TypeScript đạt.

## 15/10/2026 — Số lượng nằm trong tab trạng thái đang chọn

- Chuyển badge số lượng từ cạnh tiêu đề danh sách sang tab đang chọn (Tất cả hoặc từng trạng thái) cho users/courses/classes.
- Dùng total API theo bộ lọc hiện tại; khi chuyển tab chờ dữ liệu thì hiện Skeleton, lỗi không có dữ liệu hiện dấu gạch ngang.
- ESLint/Prettier đạt; kiểm tra trình duyệt với API mock trên cả 13 tab của ba danh sách ở 1440px/320px: badge chuyển đúng tab, đúng total kể cả 0, không tràn ngang.

## 15/10/2026 — Căn giữa kính lúp và bỏ bo góc tab trạng thái

- Căn giữa icon tìm kiếm theo chiều cao Input 48px ở bảng users/courses/classes.
- Bỏ bo góc nút tab lọc trạng thái để đường gạch dưới thẳng ở hai đầu.
- ESLint/Prettier đạt; kiểm tra trình duyệt ở 1440px và 320px: icon lệch tâm 0px, tab có border-radius 0px, không tràn ngang.

## 15/10/2026 — Nút icon và popup đổi mục trực tiếp

- Theo yêu cầu mới, thay menu ba chấm từng dòng bằng Button icon có màu: Xem (mint), Sửa/Trạng thái (vàng), Học viên (xanh lá); tooltip và tên truy cập gồm tên dòng. Áp dụng dùng chung cả bảng tổng quan/users/courses/classes.
- Popover shadcn không modal, virtual anchor ở nút đang chọn và Arrow trỏ đúng nút; đổi trực tiếp giữa các mục, không cần đóng trước. Có active/aria-expanded, tránh mép viewport, cuộn nội dung, Escape/bấm ngoài/Đóng và trả focus.
- Tái sử dụng editor/detail/student qua chế độ embedded của Modal; create/category/confirmation giữ Dialog. Đổi mục không gửi mutation hoặc tự lưu dữ liệu chưa lưu.
- Lint/types/build và format các file sửa đạt; 24 E2E Admin desktop/mobile đạt. Kiểm tra chuyển trực tiếp ba mục, chỉ một popup, màu active, tọa độ mũi tên, keyboard/Escape/focus, phân trang học viên và viewport 320px. Screenshot popup dùng viewport để không làm thay đổi vị trí anchor khi Chromium mobile chụp toàn trang.

## 15/10/2026 — Admin mutations và bảng theo ảnh mẫu

- Cả users/courses/classes dùng bảng chung hàng gọn, đường kẻ cột, avatar tròn, badge xanh/vàng/đỏ và menu ba chấm shadcn/ui. Bỏ nút Quản lý trên dòng, gom Xem/chỉnh sửa/trạng thái/Học viên vào menu; chấm trạng thái nhấp nháy nhẹ (reduced motion tắt); input/select Admin cao 48px, textarea tối thiểu 112px.
- Tạo user và xác nhận khóa/mở tài khoản. Tạo danh mục/khóa học, sửa thông tin/học phí, thêm và sắp xếp học phần, kích hoạt khóa học. Tạo lớp từ khóa học hoạt động + mentor hoạt động, sửa lớp theo trạng thái, thêm lịch giờ Việt Nam/đổi giờ, xác nhận mở/bắt đầu/hoàn thành/hủy lớp.
- Forms/editor/confirmation dùng component chung shadcn, Zod kiểm input, TanStack Query invalidation sau khi ghi; không optimistic update hoặc tự retry mutation. BE chưa có DELETE cho ba module, cập nhật hồ sơ user hoặc tắt khóa học nên không thêm thao tác giả. Không sửa FE/BE cũ.
- Chọn danh mục và nút Tạo danh mục mới trên một hàng, cùng cao 48px. Kiểm tra lint/types/build, 35 unit và 22 E2E Admin desktop/mobile pass; menu/view/editor/học viên trả focus về ba chấm, pulse tắt khi reduced motion, viewport 320px không tràn.
- Proxy mở từng method/path chính xác, kiểm UUID/body/response, Origin cho POST/PATCH/PUT/DELETE; chỉ access_token và private no-store. Test writes dùng mock, không tạo hoặc đổi dữ liệu backend thật.

## 15/10/2026 — Skeleton loading dùng chung

- Thêm Skeleton chính thức shadcn/ui, map mint và tắt pulse khi reduced motion. Tách `components/ui/loading-skeletons.tsx`: `TableSkeleton` nhận rows/columns/label/className và `StatCardSkeleton` nhận label/className, không phụ thuộc Admin hoặc API.
- Dùng lại cho số liệu tổng quan, bảng tổng quan/users/courses/classes và dialog học viên. `AdminQueryState` trả TableSkeleton khi pending, giữ UI lỗi/retry/empty. Skeleton có aria-busy/status, ẩn các khối trang trí khỏi screen reader; cuộn/focus và quyền truy cập giữ nguyên.
- Lint/TypeScript/production build pass; các E2E Admin đã có pass, thêm test API bị trì hoãn cho tổng quan/bảng/học viên rồi resolve về dữ liệu thật, desktop/mobile pass. Screenshot loading tạm tắt animation để chụp ổn định trên Chromium mobile.

## 15/10/2026 — Xem học viên theo lớp

- Thêm nút “Học viên” cho từng lớp ở Tổng quan và trang Lớp học. Mở Dialog shadcn/ui có tên lớp, tên/email/điện thoại học viên, trạng thái đăng ký, trạng thái tài khoản và ngày nhập học; phân trang server 20 dòng. Loading/error/retry/empty và focus restore dùng cùng pattern Admin.
- Gắn GET `/admin/classes/:classId/students`, đối chiếu Swagger live và DTO/flow Phase 4 BE. Adapter chỉ nhận UUID, GET và pagination strict, forward access_token, validate response bằng Zod/private no-store. Không mở chi tiết học viên hay mutations.
- Danh sách đăng ký gồm PENDING_PAYMENT/ACTIVE/COMPLETED theo BE; phân biệt chờ thanh toán với đã nhập học và trạng thái tài khoản. Không suy ra học viên từ availableSeats.
- Kiểm tra lint/TypeScript/build pass; 29 unit và 14 E2E Admin desktop/mobile pass. Test đúng classId ở cả hai vị trí, chưa bấm không gọi API, phân trang, rỗng, retry lỗi, Escape/focus và viewport 320px. API E2E dùng mock, chưa có tài khoản ADMIN thật để smoke test live.

## 15/10/2026 — Chuyển Admin sang shadcn/ui

- Cài component từ registry chính thức bằng CLI shadcn; thêm `components.json`, helper `cn`, Radix UI và các dependency styling. Nguồn component ở `src/components/ui`, không chỉ đổi tên component tự viết.
- Bảng tổng quan/users/courses/classes dùng Table; thao tác dùng Button; search Input; trạng thái Badge; chọn dòng/cột Checkbox; bộ lọc NativeSelect; chọn cột Popover; thông tin Dialog và menu mobile Sheet. Wrapper Modal giữ interface đang dùng, chuyển focus trap/scroll lock/Escape cho Radix và khôi phục focus về nút mở.
- Semantic tokens ánh xạ palette Mindy, giữ cỡ chữ/hàng tiêu đề đậm đã chỉnh. Ghi yêu cầu dùng shadcn/ui cho UI tiếp theo vào AGENTS và UI rules.
- Lint/TypeScript/production build và 12/12 E2E Admin desktop/mobile pass; đã xem ảnh 1440/320px, không tràn ngang. Điều chỉnh khoảng trống chevron NativeSelect và viền Table sau visual review.

## 15/10/2026 — Tăng cỡ chữ Admin và làm đậm tiêu đề bảng

- Tăng chữ toàn bộ template Admin: nội dung/nút/menu từ 12 lên 14px, chữ phụ từ 11 lên 13px, mô tả từ 14 lên 16px; tiêu đề trang 32–36px.
- Hàng tiêu đề của mọi bảng, gồm bảng tổng quan, dùng 14px, font weight 800, màu forest và chiều cao 48px. Giữ cuộn ngang bảng trên mobile.
- Production build/TypeScript và 12/12 E2E Admin desktop/mobile pass; đã xem ảnh 1440px/320px, không tràn ngang.

## 15/10/2026 — Template Admin trên FE2

- Đọc architecture/ui-rules/progress/API contracts, ảnh sidebar và admin table; đối chiếu API flow Phase 1, 2.3→3.2 và Phase 4 summary, controller/DTO BE, ba list endpoint trên Swagger live. Chỉ sửa FE2; không sửa Mindy-FE/Mindy-BE.
- Thêm `/admin` tổng quan, `/admin/users`, `/admin/courses`, `/admin/classes`, `/admin/workflow`. Shell riêng có sidebar 228px/thu gọn 76px, breadcrumb/account, menu dialog mobile; giữ Nunito và palette Mindy.
- Bảng dùng lại có tab trạng thái, filter role/deliveryMode, pagination/pageSize, search không dấu/sort trong trang, chọn dòng, CSV UTF-8 BOM chống formula injection, ẩn cột và dialog thông tin từ list. Không tạo số liệu, trend hoặc dữ liệu giả trong runtime.
- Gắn GET list API thật qua allowlist chính xác, strict query và Zod response/timestamps, cookie access_token/private no-store; loại meetingUrl khỏi projection. Backend giữ quyền ADMIN; FE guard chặn guest/role khác/ADMIN suspended trước khi query. Chưa mở admin writes/detail động, payment/material/attendance/mentor assignment.
- Login ADMIN mặc định đi `/admin`, returnTo hợp lệ vẫn ưu tiên. Sửa regression cache phiên để logout cập nhật mọi guard/header và ẩn dữ liệu admin ngay; sửa restore focus sau khi dialog/menu đóng.
- Validation: lint, TypeScript và production build pass; 28 unit tests và 49 E2E production desktop/mobile pass, 3 skip có chủ đích theo nền tảng. Riêng Admin 12/12 E2E pass. Xem screenshot 1440/393/320px, không tràn ngang/lỗi JS. API trong E2E dùng mock; chưa smoke test bằng tài khoản ADMIN thật.
- Prettier trên các file mới/đổi pass. `format:check` toàn repo còn baseline CRLF ở các file không đổi và layout JSON của tsconfig do Next sinh; không format lan rộng. Build review `.next-admin-review` tách output preview; giữ tsconfig gốc sau kiểm tra.
- Tài liệu triển khai/mở rộng ở [admin-template.md](admin-template.md); cập nhật architecture/ui-rules/API contracts/README/AGENTS.

## 15/10/2026 — Ảnh slider cách bắt đầu

- Đặt ba ảnh `ảnh1`, `anhmih`, `hao` vào khung bên phải đúng slide; giữ mascot bên trái. Đổi khung trắng thành mint và thêm bóng nhẹ.

## 15/10/2026 — Giỏ hàng, checkout và QR payOS

- Thêm nút giỏ hàng shadcn trên header: icon + nhãn ở desktop lớn, icon trên mobile; badge số lớp từ API. Đã xác minh preview `http://localhost:3003` hiển thị nút, 320px không tràn ngang.
- `/cart` đọc/xóa lớp, giá hiện tại và thay đổi giá, chặn lớp không thể mua; checkout toàn giỏ PAYOS, khóa double click. Danh sách đơn chờ có phân trang và mở lại đơn khi checkout mất response.
- `/checkout/[orderId]` đọc order và create/reuse payment cùng ID, QRCodeSVG từ payload backend, fallback URL payOS, countdown và polling có giới hạn. `/payment/result` chỉ mapping orderCode, không tin status/cancel của redirect.
- shadcn Button/Card/Badge/Alert/Skeleton/Separator/Sonner dùng semantic tokens palette Mindy. Giữ Nunito và UI cũ; qrcode.react render QR, không tự dựng ngân hàng/tài khoản.
- Mở proxy allowlist cart/order/payment, UUID/query/body/Origin POST+DELETE; cookie HttpOnly/no-store. Session logout/login cancel và xóa queries riêng tư nhưng giữ session observer để UI ẩn QR và quay login đúng lúc.
- Lint, Prettier, types, unit 34/34, production build `.next-cart-check` pass. Playwright desktop/mobile: 69 pass, 3 skip theo nền tảng có sẵn; bao gồm 32 test commerce mới. Decode QR screenshot khớp payload; đã xem ảnh desktop và 320px.
- Kiểm thử thanh toán dùng mock theo contract; chưa chuyển tiền thật/quét app ngân hàng nghiệm thu. Lượt gọi Swagger live trong implement timeout; dùng contract đã xác minh lúc lập plan và DTO/backend source. Backend triển khai cần PAYOS bật, webhook và return/cancel URL đúng `/payment/result` của FE2.

## 15/10/2026 — Nới chiều ngang và cân đối detail

- Detail dùng container riêng căn giữa, khoảng 76% màn hình desktop lớn; tối thiểu mục tiêu 1280px trong giới hạn 92% viewport, tối đa 1800px. Mobile giữ gutter 20/32px.
- Cân tỷ lệ cột nội dung/thẻ đăng ký: sidebar 320/360/400px theo breakpoint, gap 24/32px. Thống nhất bo góc 16px và padding card; hai CTA giữ chiều cao 52px.
- Thanh chuyển nội dung tăng chữ 14px, nút cao 48px; mô tả 16px và thông tin dưới ảnh 14/12px, responsive một cột trên mobile nhỏ.
- ESLint/Prettier và build/TypeScript pass. Live 2560/1920/1811/1440/1024/800/393/320px không tràn ngang; desktop căn giữa cân hai lề. Ở 1811px nội dung rộng 1376px (~76%), sidebar 400px; hai CTA cùng rộng 342px/cao 52px. Preview 3003 đã cập nhật `.next-course-width`.

## 15/10/2026 — Nền xanh nhạt theo logo, thẻ trắng chữ xanh

- Trích nền logo `public/brand/mindy-logo.jpg`: màu phổ biến #D8F0FA, thêm token logo-soft cho khối bọc tổng quan/giáo trình/mentor.
- Các thẻ dùng trắng đặc, chữ forest, icon mint, viền trắng 2px và bóng nhẹ. Giữ typography lớn, mentor nối chung và callback mở chọn lớp.
- Prettier, ESLint và isolated build/TypeScript pass. Live 1440/393/320px: nền #D8F0FA, thẻ trắng, chữ #1D5B57, mentor nằm trong khối, không tràn ngang; xem screenshot desktop/mobile. Preview 3003 dùng `.next-course-logo`.

## 15/10/2026 — Tăng chữ breadcrumb và badge chi tiết khóa học

- Breadcrumb tăng 12→14px semibold; nhãn danh mục/mã khóa học tăng 11→14px, tăng padding dọc để vừa chữ. Giữ wrap trên mobile.

## 15/10/2026 — Nối mentor vào khối nội dung và tăng typography

- Đổi nền khối tổng quan/giáo trình từ forest sang mint sáng hơn, nối mentor vào cùng card qua đường chia trắng.
- Tăng heading lên 20/24px, nội dung lên 16px, tên học phần 16/18px và tên mentor 18/20px. Viền hàng trắng 65%, dày 2px; giữ chữ/icon trắng.
- Giữ anchor mentor/giáo trình và chuyển callback mở chọn lớp qua card gộp; không thay API hoặc dữ liệu.

## 15/10/2026 — Tăng font khối học phí/đăng ký

- Tăng toàn bộ chữ trong card đăng ký: giá 36px; hai CTA và tiêu đề thông tin 16px; nhãn, mô tả và danh sách 14px semibold. Hai nút cao 52px để chữ thoáng và dễ bấm; giữ màu hiện tại.

## 15/10/2026 — Màu hai nút đăng ký và giáo trình

- “Xem giáo trình” dùng nền forest và chữ/icon trắng như khối giáo trình. “Đăng ký học ngay” giữ nền coral, đổi chữ/mũi tên trắng; hover headsup để giữ chữ trắng rõ hơn.

## 15/10/2026 — Khối tổng quan và giáo trình nền xanh đậm

- Đổi card tổng quan/giáo trình sang token forest theo ảnh mẫu, chữ và icon trắng. Các ô nội dung dùng lớp trắng 5%, viền trắng 25%, số thứ tự nền trắng 15%; giữ nguyên danh sách giáo trình hiện tại.

## 15/10/2026 — Giáo trình gọn, bỏ dropdown và phần trăm

- Thay accordion unit bằng danh sách số thứ tự, tên và mô tả có sẵn. Bỏ nút mở/thu gọn, chevron, dòng phần trăm điểm yêu cầu và state đóng/mở.
- Giữ thứ tự unitNumber, anchor giáo trình và trạng thái chưa có nội dung; không đổi schema/API hoặc điều kiện hoàn thành phía backend.
- Prettier/ESLint, isolated build/TypeScript và E2E giáo trình desktop/mobile (2/2) pass. Live 1440/393/320px: đủ 5 học phần, không có nút xổ xuống hay phần trăm, không tràn ngang; xem screenshot. Preview 3003 dùng `.next-curriculum-flat`.

## 15/10/2026 — Tăng font CTA hero và in hoa

- Đổi nhãn nút thành “KHÁM PHÁ KHÓA HỌC”. ActionLink tăng chữ từ 14px lên 16/18px, chiều cao tối thiểu 64px, ô mũi tên 44px; padding/gap mobile gọn để vừa màn hình nhỏ.
- Prettier, ESLint và isolated build (kèm TypeScript) pass. Kiểm tra 1440/768/393/320px: nhãn in hoa, chữ 18px desktop/16px mobile, nút cao 64px và không tràn ngang. Preview 3003 dùng `.next-hero-action-size`.

## 15/10/2026 — CTA cam sáng, chữ trắng và vân mây trắng

- ActionLink homepage chuyển chữ/icon sang trắng, nền coral pha trắng 20%, hover pha trắng 30%; thêm viền trắng mờ và bóng đổ.
- Lớp mây hero dùng grayscale/brightness/contrast và screen để tạo vân trắng rõ hơn trên nền mint, giữ asset gốc.
- Prettier, ESLint và isolated production build (kèm TypeScript) pass. Kiểm tra 1440/393/320px: chữ nút trắng, nền cam sáng pha từ config, có shadow, không tràn ngang; xem screenshot mây trắng. Preview 3003 dùng `.next-hero-action`.

## 15/10/2026 — Chữ lớn và đậm hơn trên catalog

- Tăng typography phần nội dung `/courses`: bộ lọc/mô tả/chips/phân trang lên 14px, toolbar/input và giới thiệu 16px, tên card 18px, giá 26px; chữ nội dung semibold.
- Sidebar desktop rộng 250px; vùng tên và mô tả card tăng chiều cao để giữ giá thẳng hàng. Variant typography chỉ áp dụng catalog, không đổi card homepage/related.
- ESLint/Prettier và production build/TypeScript pass; E2E khóa học 15 pass/1 skip. Live 1440/1024/393/320px: filter 14px/600, tên 18px, giá 26px, không tràn ngang. Preview 3003 đã chuyển sang build riêng `.next-catalog-type`.

## 15/10/2026 — Nền hero theo mẫu màu người dùng

- Trích màu phổ biến nhất từ ảnh đính kèm: `#338A85` (46.638 pixel), trùng token mint. Hero dùng trực tiếp mint thay nền pha sáng.
- Giữ chữ trắng và caption chữ forest; mây chuyển soft-light nhẹ để không bạc nền. Link thực hành hover giữ trắng và gạch chân.
- Prettier, ESLint và isolated build (kèm TypeScript) pass. Kiểm tra 1440/393/320px: nền hero rgb(51,138,133), chữ h1 trắng, không tràn ngang; đã xem screenshot. Preview 3003 dùng `.next-hero-mint`.

## 15/10/2026 — Bóng nhẹ dưới header

- Thêm bóng đổ nhẹ hướng xuống dưới header, dùng forest với opacity 15% từ palette config để tách thanh điều hướng khỏi nội dung.

## 15/10/2026 — Menu header lớn và đậm hơn

- Menu desktop tăng từ 13px lên 15/16px, font-black. Mục active/hover phủ kín chiều cao header 88px, bỏ bo góc và khoảng hở giữa các mục.
- Giảm gap header ở desktop nhỏ để đủ chỗ cho menu và nút tài khoản.
- Prettier, ESLint và isolated production build (kèm TypeScript) pass. Kiểm tra 1440/1280/1024/393/320px với tên tài khoản dài: không tràn ngang. Các link desktop cao đủ 88px, top 0, font-weight 900; đã xem screenshot hover. Preview 3003 dùng `.next-header`.

## 15/10/2026 — Chữ hero trắng, CTA sáng và gộp nội dung khóa học

- Hero đổi token chữ sang canvas trắng theo ảnh người dùng, giữ nền/mây/mascot; caption nền trắng giữ chữ forest.
- Nút “Đăng ký học ngay” chuyển sang coral sáng của palette, hover sunshine.
- Bỏ hàng metadata học phần/mentor/hình thức dưới tiêu đề, widget “Một nhịp học phù hợp”, ghi chú “Bấm đăng ký…” và callout “Tìm lớp phù hợp…” lặp lại.
- Gộp “Bạn sẽ học được gì?” và “Giáo trình khóa học” vào một card trắng; giữ anchor, accordion và mở/thu gọn tất cả.
- ESLint, Prettier và production build/TypeScript pass; E2E khóa học 15 pass/1 skip theo nền tảng. Live UI 1440/393/320px: hero trắng, CTA coral, khối đã gộp và ghi chú đã bỏ, không tràn ngang/lỗi JS. Preview 3003 dùng `.next-course-refined` riêng, không ghi đè build đang chạy.

## 15/10/2026 — Nền trắng cho trang khóa học

- Layout courses đổi từ mint nhạt sang canvas trắng. Các bề mặt trong detail (badge, điều hướng nội dung, tổng quan, giáo trình, mentor, ghi chú đăng ký) dùng nền trắng với viền mảnh.
- Giữ điểm nhấn mint cho chữ/icon, CTA và học phần đang mở; placeholder ảnh khóa học dùng trắng.
- Prettier, ESLint và isolated production build (kèm TypeScript) pass. Kiểm tra live khóa HTML & CSS từ con số 0 ở 1440/393/320px: nền main rgb(255,255,255), không tràn ngang; đã xem screenshot. Preview 3003 dùng build `.next-course-white`.

## 15/10/2026 — Module khóa học, chi tiết và chọn lớp/lịch public

- Tách `features/courses/{api,schemas,lib,components}`; components chia catalog/detail/enrollment/shared. DTO validate bằng Zod và suy ra type; auth/cart giữ query/mutation và schema của riêng module. Routes chỉ composition.
- Catalog `/courses` theo HTML người dùng; detail `/courses/[courseId]` theo Stitch. Dùng nguyên palette config; danh mục/hình thức/học phí/search không dấu/sort/grid/list/pagination, giáo trình accordion và mentor thật. Không thêm nội dung đánh giá/ưu đãi/video giả.
- Card dùng chung homepage/catalog/related căn thẳng tên, mô tả và giá; giá 24px, bỏ “Đăng nhập để bắt đầu”, cả card dẫn đến detail public.
- “Đăng ký học ngay” mở dialog lớp đang mở theo API, mentor, số chỗ, lịch từng buổi/địa điểm/UTC+7; full/closed/empty/error/retry có trạng thái phù hợp. Xem khóa học/lớp/lịch không cần đăng nhập.
- Chỉ “Đăng ký lớp này” kiểm tra phiên: guest đi login/register, sau login về đúng course/class (kể cả lớp ngoài trang đầu), không tự mutation. STUDENT bấm tiếp thêm vào giỏ thật; không gửi giá từ client. Chưa tạo order/hold/payment/checkout.
- Thêm email registration và verify-email đúng DTO/cookie backend. 202 yêu cầu kiểm tra email, chưa phải login; verify chỉ chạy khi bấm. Không gửi email thật, dùng tài khoản thật hoặc giao dịch thanh toán trong kiểm thử.
- Sửa preview bị asset CSS/JS cũ sau rebuild: hỗ trợ `MINDY_DIST_DIR`, build/test ở output riêng, chỉ đổi preview sau build hoàn tất. Preview 3003 chạy `.next-course-final`; không build đè output đang phục vụ.
- Lint, Prettier, TypeScript/production build pass; Vitest 22/22; Playwright production desktop/mobile 37 pass, 3 skip đúng nền tảng (gồm thay đổi dropdown tài khoản đồng thời trong workspace).
- Live public GET qua adapter: courses/detail/course-classes/class-timetable đều 200; mẫu kiểm tra 6 khóa học, 5 học phần, 3 lớp mở và lịch có dữ liệu. Xem UI 1440/1024/800/393/320px, không tràn ngang và không lỗi JS/static assets. Bốn card homepage có tọa độ tên/mô tả/giá trùng nhau; `/login` tải font Nunito và CSS đầy đủ. Screenshot ở `.next-course-review/ui-review/`; E2E cuối ở `.next-course-final/e2e-results/` (gitignored).

## 15/10/2026 — Dropdown tài khoản header

- Thay tên và link đăng xuất nhỏ bằng nút tài khoản cao 56px, avatar chữ cái, tên và chevron theo palette hiện tại.
- Bấm mở dropdown tên/email và nút đăng xuất có icon, trạng thái đang xử lý và lỗi; dùng nguyên hooks auth hiện tại.
- Mobile dùng nút avatar gọn; dropdown giới hạn theo viewport. Hỗ trợ bàn phím, đóng khi click ngoài/rời focus/Escape và trả focus khi Escape.
- Kiểm tra lint, format, types và build pass. E2E auth xác nhận login/register/verify trên desktop/mobile; test dropdown desktop/mobile pass, gồm Escape, click ngoài và retry logout. Ở 1440/320px dropdown nằm trong viewport, không tràn ngang; xem screenshot. Preview 3003 đã hiển thị UI mới. Dùng port test 3113 vì 3103 đang được sử dụng, không đổi cấu hình test chính.

## 15/10/2026 — Hero mint sáng và chữ dịu hơn

- Nền hero lấy cùng hue mint config, tăng saturation ×1.6 và lightness lên 90%, giữ lớp mây nhẹ.
- Tiêu đề và nội dung hero dùng token chữ riêng pha mint/forest, nhạt hơn chữ forest trước đó; màu tập trung trong globals.css.
- Lint, format và production build (kèm TypeScript) pass. Xem hero 1440/393/320px, không tràn ngang; tương phản token chữ/nền: tiêu đề 4.35:1, chữ nhỏ 5.27:1 trước lớp mây. Preview 3003 đã cập nhật.

## 15/10/2026 — Slider tiếp tục chạy khi rê chuột; khôi phục mây hero

- Bỏ điều kiện dừng khi hover/focus theo yêu cầu: slider tiếp tục tự chuyển mỗi 3 giây cả khi chuột ở trên hoặc chấm chọn đang focus.
- Phủ lại ảnh mây cũ trên nền hero mint, opacity 25%, luminosity và căn dưới để thêm nhẹ chi tiết và giữ tông config.
- Kiểm tra: lint, format, types, build pass; E2E 16 pass, 2 skip đúng nền tảng, gồm tự chuyển khi hover và focus. Đã xem screenshot hero có mây nhẹ; preview 3003 đã cập nhật.

## 15/10/2026 — Tự chuyển slider và nền vàng cam

- Tự chuyển ba slide mỗi 3 giây, quay vòng; bỏ hai nút mũi tên, giữ chấm chọn giữa, bàn phím và vuốt.
- Nền khối giới thiệu dùng token sunshine `#FFDDAE` theo ảnh mẫu: vàng cam sáng nhẹ. Giữ nguyên banner mint và khung trắng bên phải.
- Tạm dừng lúc hover/focus hoặc tab ẩn; tắt tự chạy khi có reduced motion.
- Kiểm tra: lint, format, types, build pass; Playwright 16 pass, 2 skip đúng nền tảng, gồm tự chuyển 1→2→3→1, tạm dừng tương tác và reduced motion. Xem screenshot desktop/mobile 320px, không tràn ngang, không còn nút mũi tên; preview port 3003 đã cập nhật.

## 15/10/2026 — Slider cho ba khối giới thiệu

- Chuyển ba khối sang slider ngang, mỗi lần xem một khối; giữ nguyên mascot, màu và banner trống.
- Nút trái/phải quay vòng, chỉ báo chọn trực tiếp, hỗ trợ phím mũi tên và vuốt native trên mobile. Không thêm dependency hoặc tự chạy.
- Reduced motion chuyển ngay; slide ngoài màn hình không nhận focus; chỉ báo đồng bộ khi cuộn.
- Kiểm tra: lint, format, types, build pass; Playwright 14 pass, 2 skip đúng nền tảng, gồm chuyển vòng, chọn slide, bàn phím và vuốt mobile. Xem screenshot desktop/320px, không tràn ngang ở cả ba slide. Preview port 3003 đã cập nhật.

## 15/10/2026 — Điều chỉnh homepage theo ảnh tham khảo

- Hero bỏ lớp mây bạc màu, dùng nền mint pha trực tiếp từ token config.
- Giữ forest làm màu chữ chính, tăng muted lên 90% forest cho chữ phụ dễ đọc hơn.
- Thay ba card nhỏ bằng ba khối ngang: mascot và nội dung trái, CTA viền tròn, banner nền mint trống trong khung trắng bên phải; mobile xếp một cột.
- Tạo thêm mascot đọc sách và mascot đeo ba lô cầm bản đồ bằng imagegen, nền trong suốt; giữ ảnh ếch lập trình gốc. Prompt trong `docs/mascot-prompts.md`.
- Kiểm tra: lint, format, types, production build pass; Vitest 12/12; Playwright 11 pass, 1 skip theo cấu hình desktop. Kiểm tra ảnh tải đủ và không tràn ngang ở 1440, 800, 393, 320px; xem screenshot hero và card desktop/mobile. Đã khởi động lại production preview ở port 3003 để hiển thị bản mới.

## 15/10/2026 — Frontend foundation, homepage và email login

- Khởi tạo Mindy-FE2: Next.js App Router, TypeScript strict, Tailwind v4.
- Thêm TanStack Query cho API/server state, Redux Toolkit cho UI; providers và typed hooks.
- Viết AGENTS.md theo convention của ixartz/Next-js-Boilerplate, điều chỉnh cho Mindy.
- Chuyển homepage từ Mindy-FE dev sang Tailwind, giữ ảnh ếch và nền hero; nguồn commit trong ui-rules.md.
- Áp palette trắng/mint/xanh đậm/cam từ docs/pallete.png; font tiếng Việt local.
- Cấu hình env API https://api.quanh123.id.vn/api/v1; đọc Swagger và backend docs/api_flow + DTO.
- Nối courses/categories homepage và email login; cookie HttpOnly qua same-origin adapter, me/refresh/logout.
- Google Login tạm hoãn theo yêu cầu; không có cấu hình, route hoặc nút Google.
- Có lint, format, types, Vitest cho API/cookie boundary, Playwright desktop/mobile cho homepage và login.
- Live GET courses/categories trả 200; login được kiểm tra bằng mock hợp đồng, chưa dùng tài khoản backend thật.

## Kết quả kiểm tra cuối

- Lint, Prettier, type check và production build pass.
- Vitest: 12/12 test pass. Playwright: 11 pass, 1 skip có chủ đích (mobile navigation trên desktop).
- Live qua adapter Next.js: courses/categories 200; category filter trả đúng nhóm; anonymous me 401; Google route 404.
- Xem screenshot desktop/mobile; ảnh không lỗi, không có JavaScript error, không tràn ngang ở 393px và 320px.
- `npm audit --omit=dev`: 0 vulnerabilities. 5 cảnh báo dependency development được ghi trong README.
- Ảnh ếch có Git blob hash trùng file trong Mindy-FE dev.

## Phạm vi sau

Course detail/lớp/lịch public, email registration/verification, cart/checkout/QR payOS và template Admin (kèm Admin writes theo phần mới nhất phía trên) đã được mở rộng theo yêu cầu 15/10/2026. Nghiệm thu thanh toán tiền thật, CASH UI, Google và compiler là phần tiếp theo.
