# Tiến độ

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

Course detail/lớp/lịch public, email registration/verification và add-cart đã được mở rộng theo yêu cầu 15/10/2026. Google, compiler, order/checkout/thanh toán và quản trị vẫn là phạm vi sau.
