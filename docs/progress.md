# Tiến độ

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

## 15/10/2026 — Nền trắng cho trang khóa học

- Layout courses đổi từ mint nhạt sang canvas trắng. Các bề mặt trong detail (badge, điều hướng nội dung, tổng quan, giáo trình, mentor, ghi chú đăng ký) dùng nền trắng với viền mảnh.
- Giữ điểm nhấn mint cho chữ/icon, CTA và học phần đang mở; placeholder ảnh khóa học dùng trắng.

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

Course detail/lớp/lịch public, email registration/verification, add-cart và template Admin chỉ đọc đã được mở rộng theo yêu cầu 15/10/2026. Google, compiler, order/checkout/thanh toán vẫn là phạm vi sau; Admin writes đã mở rộng theo phần mới nhất phía trên.
