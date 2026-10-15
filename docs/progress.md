# Tiến độ

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

Course detail/lớp/lịch public, email registration/verification, cart/checkout/QR payOS đã được mở rộng theo yêu cầu 15/10/2026. Nghiệm thu thanh toán tiền thật, CASH UI, Google, compiler và quản trị là phần tiếp theo.
