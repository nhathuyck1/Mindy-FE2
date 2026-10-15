# Quy tắc giao diện Mindy

## Mentor — 16/10/2026

- Giao diện Mentor dùng thuật ngữ Chương thay cho Học phần, gồm tab Chương & học liệu, danh sách/chỉ số chương, buổi trong chương và mở/khóa chương. Tên unit trong API/code không đổi.

- Bảng học viên trong lớp dùng mẫu Admin: `admin-table-panel`/`admin-data-table`, header 48px, hàng 64px, viền cột mảnh, không avatar hoặc thao tác quản trị. Trạng thái có nhãn/chấm xanh-vàng-đỏ như Admin. Tab trạng thái thanh toán và bộ lọc hình thức dùng server; tìm kiếm/sắp xếp tên giới hạn trong trang. Header có tổng theo bộ lọc/Làm mới; footer chọn 10/20/50 dòng và phân trang. Loading dùng TableSkeleton, có lỗi/retry/empty và cuộn ngang từ 320px.

- Lịch dùng bố cục gọn: ô trống cao khoảng 80px, thẻ buổi học tối thiểu 104px; gap 2px, padding nhỏ, giữ cỡ chữ thông tin buổi hiện có. Ngày có nhiều buổi vẫn tăng chiều cao để hiển thị đầy đủ.

- Panel điều khiển lịch: ô chọn ngày dd/mm/yyyy ở trái (nhập trực tiếp hoặc mở Popover), ba nút Tuần trước / Tuần hiện tại / Tuần sau ở phải; hai nhóm căn giữa theo chiều dọc. Chọn ngày tự mở tuần chứa ngày đó; ngày không hợp lệ hiện lỗi. Nút hiện tại nền mint, nút còn lại outline. Mobile wrap, không tràn ngang.
- Cố định sáu ca: 1 = 07:30–09:00, 2 = 09:30–11:00, 3 = 13:00–15:30, 4 = 16:00–17:30, 5 = 18:00–19:30, 6 = 20:00–21:30. Luôn giữ sáu hàng kể cả ca trống. Cột Ca học hiện số thứ tự và khung giờ nhỏ bên dưới trên cùng một dòng dạng 07:30 | 09:00; giờ cụ thể trong từng buổi lấy nguyên từ BE. Ưu tiên ca chứa giờ bắt đầu; nếu bắt đầu trong khoảng nghỉ thì lấy ca giao nhau nhiều nhất. Buổi hoàn toàn ngoài khung hiện tại hàng Khác để không mất lịch.
- Bảng lịch gọn: cột ngày không có lớp trong cả tuần thu hẹp còn khoảng 80px; các ngày có lớp chia phần chiều rộng còn lại. Cột ca 96px, header/padding nhỏ; tên buổi tối đa hai dòng với title đầy đủ, dòng giờ và mentor có vị trí cố định, tên mentor dài rút gọn bằng dấu ba chấm. Nội dung các ô canh trên cùng; nhiều buổi trong một ô xếp dọc.

- Lịch Mentor theo ảnh tham khảo: bảng tuần thứ Hai–Chủ nhật, cột ca cố định bên trái, viền ô mảnh, buổi học hiển thị tên/giờ/mentor/trạng thái và nhãn dạy thay. Tô mint ngày hiện tại; các buổi trùng khung giờ cùng ngày xếp dọc trong ô. Ca nhóm theo giờ thực tế. Chuyển tuần trước/sau/hiện tại và chọn ngày bất kỳ; mobile cuộn ngang trong bảng, không tràn toàn trang.

- Shell Mentor riêng, dùng cùng palette/Inter và primitive shadcn của workspace Admin để giữ nhất quán. Desktop sidebar thu gọn, mobile Sheet, menu tài khoản và skip link. Hai mục chính: Lịch dạy, Lớp của tôi.
- Lịch thực tế có nhãn Dạy thay, khoảng ngày theo UTC+7, trạng thái, context và điểm danh. Điểm danh chỉ đổi tick sau khi server xác nhận; chốt buổi có Dialog nêu rõ người chưa tick thành vắng. Các nút theo permissions backend.
- Lớp có tab Học viên và Học phần & học liệu; bảng học viên chỉ xem trạng thái đăng ký/thanh toán. Không có menu hoặc nút thu tiền mặt.
- Học liệu có loại/trạng thái, xem chi tiết, HTML trong sandbox, file preview theo signed link, form nháp và gửi duyệt. Chỉ bản của chính mình, canEdit, DRAFT/REJECTED và chưa từng duyệt mới hiện sửa/xóa/gửi. Upload hiển thị tiến trình/kiểm tra/hủy; chờ READY mới lưu.
- Mở/khóa/hẹn giờ học phần bằng Dialog có nhãn UTC+7; không cho thay trạng thái COMPLETED. Loading/error/retry/empty/phân trang đầy đủ, modal giữ Escape/focus và giới hạn viewport.

## Admin template — 15/10/2026

- Tổng quan theo ảnh dashboard người dùng gửi: bốn thẻ số liệu có sparkline, hàng biểu đồ vùng/cột, bên dưới là bảng lớp + khóa học theo số lớp + donut vai trò tài khoản. Dùng Card/Chart shadcn và Recharts, palette Mindy và typography Admin hiện có. Tooltip, chú giải và số liệu dạng chữ đi cùng chart; tắt animation của chart để hỗ trợ reduced motion. Mobile xếp một cột, bảng cuộn trong panel.
- Số liệu lấy từ danh sách Admin thật đã tải đủ trang: tạo mới theo `createdAt`/tháng UTC+7, trạng thái lớp và vai trò tài khoản theo snapshot hiện tại. Có 3/6/12 tháng và Làm mới. Không suy diễn doanh thu/lợi nhuận, tỷ lệ chuyển đổi, lịch sử thay đổi trạng thái hay enrollment từ availableSeats. Loading/error/empty không biến thành số liệu giả.

- Yêu cầu tăng toàn bộ chữ Admin một nấc: +2px cho thang chữ hiện có (13→15, 14→16, 16→18, tiêu đề 32→34/36→38). Token text-size giới hạn trong admin-workspace/admin-typography; portal popup/Dialog/Sheet/confirmation cũng nhận cùng scope. Typography marketing giữ nguyên.

- Popup và Dialog ẩn thanh cuộn bằng utility scrollbar-hidden (kể cả vùng bảng bên trong); giữ overflow-auto để tiếp tục cuộn chuột, cảm ứng và bàn phím.

- Theo ảnh mẫu và yêu cầu mới: users/courses/classes dùng cùng Table gọn, hàng 64px, đường kẻ cột mảnh, avatar tròn, Theo yêu cầu tiếp theo, thao tác từng dòng dùng các Button icon: Eye màu mint, Pencil/ShieldCheck màu vàng, Users màu xanh lá. Theo yêu cầu mới nhất, mỗi nút mở Dialog shadcn nằm giữa màn hình, backdrop phủ tối và blur nền. Các nút chuyển mục có icon/màu được đặt trong modal, đổi nội dung trực tiếp không cần đóng. Áp dụng cả bảng tổng quan. Có title/aria-label, aria-expanded, trạng thái active, Escape và trả focus; modal giới hạn 90dvh, cuộn nội dung và giữ focus trong modal. Input/select Admin cao 48px; textarea cao tối thiểu 112px. Không giảm cỡ chữ đã yêu cầu.
- Bổ sung semantic tokens status-green/status-yellow/status-red theo yêu cầu người dùng: hoạt động/kích hoạt/đang tuyển/đang học/hoàn thành xanh; chờ xác thực/chưa kích hoạt/nháp/chờ thanh toán vàng; tạm khóa/đã hủy đỏ. Dùng lại AdminStatus cả đăng ký học viên, luôn có nhãn chữ bên cạnh màu. Chấm màu nhấp nháy nhẹ bằng animate-pulse, tắt khi reduced motion. Chọn danh mục và nút Tạo danh mục mới trên cùng một hàng.

- Loading dữ liệu dùng Skeleton shadcn/ui qua `TableSkeleton`/`StatCardSkeleton` dùng chung ở `components/ui/loading-skeletons.tsx`; không chép lại markup skeleton ở từng màn hình. Hiện skeleton khi query chưa có dữ liệu; giữ dữ liệu hiện tại khi background refetch.
- Loading page và modal (16/10/2026) dùng `LoadingOverlay` ở `components/ui/spinner.tsx`: làm mờ/blur nền rồi hiện spinner giữa. `scope="page"` cho `loading.tsx`, Suspense fallback, kiểm tra phiên admin và trang chi tiết khóa học; `scope="modal"` cho nội dung tải trong modal (editor admin, chi tiết học viên, chọn lớp, lịch học). Bảng giữ skeleton; thẻ số liệu/biểu đồ/nút bấm giữ trạng thái cũ. Reduced motion làm spinner quay chậm.

- Dùng component shadcn/ui theo yêu cầu: Button, Table, Input, Badge, Checkbox, Dialog, Sheet, NativeSelect, Popover. Cấu hình `components.json`, nguồn `src/components/ui`; giữ palette/typography Mindy qua semantic tokens, không áp theme neutral mặc định. `cn` dùng helper tại `src/lib/utils.ts`.

- Cập nhật typography theo yêu cầu: tiêu đề cột 14px/800 và màu forest; nội dung bảng/nút/menu 14px, thông tin phụ 13px; mô tả chính 16px, tiêu đề trang 32–36px. Áp dụng đồng bộ tổng quan, users/courses/classes, workflow và dialog Admin.

- Theo `docs/sidebar.png` và `docs/admin table.png`: sidebar thu gọn, header breadcrumb/account, tab trạng thái, toolbar, bảng gọn và badge. Dùng nguyên palette Mindy; canvas soft pha mint, panel trắng, viền mảnh, điểm nhấn mint/coral.
- `/admin` có shell riêng, không gắn header/footer marketing. Bảng chung cho users/courses/classes; desktop sidebar 228px/76px, mobile dialog, cuộn bảng trong panel từ 320px. Escape/focus restore và reduced motion được hỗ trợ.
- Không bịa số liệu/trend/dữ liệu thành viên. Search/sort và CSV ghi đúng phạm vi trang hiện tại. Chi tiết thiết kế và API ở [admin-template.md](admin-template.md).

## Màu chữ trang chủ và header — 15/10/2026

- Trang chủ dùng chữ đen cho tiêu đề và nội dung. Xanh Mindy dành cho một số nhãn, điểm nhấn ngắn, icon và trạng thái đang chọn; không tô xanh cả khối chữ.
- Hero giữ chữ trắng trên nền mint để đủ tương phản. Giữ CTA và màu thương hiệu đã thống nhất.
- Header dùng chữ đen cho menu chưa chọn, tên tài khoản và icon giỏ hàng; mục menu đang chọn, avatar và điểm nhấn tương tác giữ xanh.

## Giỏ hàng và thanh toán — 15/10/2026

- Header có Button shadcn dẫn `/cart`: desktop lớn hiện icon + “Giỏ hàng”, mobile giữ icon 44px và accessible label; badge số lớp từ backend.
- Luồng mới dùng shadcn Button, Card, Badge, Alert, Skeleton, Separator, Sonner với semantic tokens map vào palette hiện có. Component nghiệp vụ ghép các primitive; không thay theme toàn app.
- Giỏ desktop hai cột danh sách/tổng tiền, mobile một cột. Checkout đi thẳng trang QR; không có form xác nhận thứ hai. Giá từ backend, lớp không thể mua chặn CTA.
- QR nền trắng, khoảng trắng bốn module, không logo. Dùng payload qrCode; thiếu QR thì mở checkoutUrl payOS. Không dựng QR từ ID/URL rồi gọi đó là QR ngân hàng.
- Cùng điện thoại có nút mở payOS; hết hạn/đối soát/đã thanh toán ẩn QR và thao tác trả tiền. PAID backend mới hiện thành công; có nút kiểm tra trạng thái và quay lại giỏ.
- Kiểm tra 320px, mobile và desktop, bàn phím/focus; giữ Nunito, palette và header/footer.

## Nguồn thiết kế

Palette: [pallete.png](./pallete.png). Logo: [logo.jpg](./logo.jpg). Ảnh sidebar và admin table trong docs dành cho giai đoạn quản trị sau này.

Homepage tham khảo [Quanhpm/Mindy-FE, nhánh dev](https://github.com/Quanhpm/Mindy-FE/tree/dev), commit `b0ea585335251442999ba91f71620cdcc9d92045`, lấy ngày 15/10/2026. Các file nguồn:

- `src/features/home/components/home-content.tsx`: nội dung và thứ tự các section.
- `src/features/home/components/home-content.module.css`: tỷ lệ, khoảng cách và responsive tham khảo; bản FE2 chuyển sang Tailwind.
- `src/app/_components/home-shell.tsx`: header, menu mobile, footer tham khảo.
- `public/mindy/coding-mascot.png`: giữ nguyên mascot gốc từ commit trên. Hero dùng nền token mint, phủ `hero-clouds.webp` căn dưới: grayscale, brightness 50%, contrast 5, screen và opacity 40% để chỉ hiện vân mây trắng nhẹ trên nền xanh.
- `public/mindy/reading-mascot.png` và `public/mindy/journey-mascot.png`: hai tư thế ếch mới được tạo theo yêu cầu người dùng bằng imagegen, tham chiếu mascot gốc. Prompt lưu tại [mascot-prompts.md](./mascot-prompts.md).

Palette tại docs FE2 được ưu tiên hơn theme xanh dương của homepage nguồn.

## Palette đã chọn

| Vai trò       | Màu       | Tailwind token | Cách dùng                               |
| ------------- | --------- | -------------- | --------------------------------------- |
| Nền chính     | `#FFFFFF` | `canvas`       | Nền trang, khoảng trắng                 |
| Màu nhận diện | `#338A85` | `mint`         | Nút chính, icon, điểm nhấn              |
| Màu phụ       | `#1D5B57` | `forest`       | Chữ chính, menu, nền đậm                |
| Màu nhấn      | `#FF7F50` | `coral`        | CTA và chi tiết nổi bật                 |
| Thông báo     | `#FF5400` | `headsup`      | Banner sale/thông báo cần chú ý         |
| Vàng cam sáng | `#FFDDAE` | `sunshine`     | Nền khối giới thiệu theo ảnh người dùng |

Token gốc đặt tại `src/app/globals.css`. Các màu `soft`, `line`, `muted`, `peach` được pha từ palette gốc với trắng. Không đặt mã hex rải rác trong component và không tự thêm palette khác. Màu cam chỉ dùng vừa phải. Theo yêu cầu mới nhất, ActionLink homepage dùng chữ/icon trắng trên `action` (80% coral + trắng), hover dùng `action-hover` (70% coral + trắng), có viền trắng mờ và shadow forest nhẹ.

Chữ chính dùng forest; chữ phụ dùng muted pha 90% forest. Theo ảnh màu người dùng gửi ngày 15/10/2026, `hero` dùng trực tiếp mint `#338A85` (màu phổ biến nhất trích từ ảnh), `hero-ink` và `hero-copy` dùng canvas trắng. Caption trên thẻ trắng giữ chữ forest. Nền khối giới thiệu dùng `feature` (token sunshine), banner trống dùng `banner` (26% mint) với khung trắng giữ nguyên. Tất cả màu pha tham chiếu token gốc, tự đổi khi sửa palette.

## Ảnh trong slider cách bắt đầu — cập nhật 15/10/2026

- Giữ mascot bên trái. Khung bên phải dùng ảnh từ docs: `christina-wocintechchat-com-m-5UHFPbvBBzY-unsplash.jpg` cho tìm khóa học, `anhmih.jpg` cho học bằng cách thử, `hao.jpg` cho khởi đầu của riêng bạn; bản phục vụ web nằm trong `public/mindy`.
- Khung ảnh chuyển từ trắng sang mint, giữ độ dày 16/20px và thêm bóng mint nhẹ. Ảnh phủ kín khung bằng `object-cover`.

## Bố cục và typography

- Nền trắng, mint làm màu nhận diện; bố cục thoáng, dễ đọc.
- Font Nunito Variable hỗ trợ đầy đủ dấu tiếng Việt cho website public. Admin (`/admin`) dùng Inter Variable theo yêu cầu ngày 15/10/2026, gồm cả dialog/sheet/popover.
- Admin: chữ chính đen dịu `--color-ink-soft` (qua `--color-foreground`), chữ phụ (`text-muted`/`text-muted-foreground`: mô tả, email, nav chưa chọn, footer) xám `--color-ink-gray`, trong phạm vi `data-admin-root`; nền trắng `canvas`. Logo, border, button, hover, tab/nav đang chọn và link vẫn giữ mint/forest. Form admin: tiêu đề dialog `text-xl`, label/input 14px, hint 13px, dấu `*` bắt buộc màu `status-red`, input nền trắng viền `line`. Lớp phủ dialog/sheet/alert-dialog là trắng mờ `bg-canvas/60` + `backdrop-blur-md`; nội dung modal giữ viền `line` và `shadow-lg` để tách khỏi nền. Variant `dark:` chỉ chạy với class `.dark` (chưa có dark theme) để input không bị phủ màu theo hệ điều hành. Component dùng chung nên ghi `text-foreground` thay cho `text-forest` để public giữ forest còn admin thành đen.
- Nội dung rộng tối đa 1280px, gutter mobile 20px, tablet 32px, desktop 40px.
- Hero hai cột trên desktop, một cột trên mobile; giữ đúng tỷ lệ ảnh ếch.
- CTA ActionLink dùng chữ 16px mobile/18px từ sm, nút cao tối thiểu 64px và ô mũi tên 44px. CTA hero ghi “KHÁM PHÁ KHÓA HỌC” in hoa theo yêu cầu người dùng.
- Giữ thứ tự: hero, cách bắt đầu, khóa học, hành trình, thực hành, CTA cuối trang.
- Cách bắt đầu: ba khối nằm trong slider ngang, mỗi lần hiển thị một khối, theo ảnh tham khảo người dùng ngày 15/10/2026; ảnh ếch phía trên nội dung trái, CTA viền tròn, bên phải là banner mint trống có khung trắng. Mobile xếp nội dung và banner trong mỗi slide thành một cột. Không đặt chữ hướng dẫn hay ảnh tạm vào banner.
- Slider tự chuyển sau mỗi 3 giây và quay vòng, chỉ giữ ba chấm chọn ở giữa, bỏ hai nút trước/sau. Giữ phím trái/phải và vuốt native với scroll snap. Theo yêu cầu mới nhất, hover/focus không dừng slider. Tab ẩn tạm dừng; reduced motion tắt tự chạy và chuyển thủ công ngay. Slide ngoài màn hình dùng inert; tắt live announcement khi tự chuyển.
- Ưu tiên utility Tailwind; class chung chỉ dành cho pattern thực sự dùng lặp lại.

## Accessibility và tương tác

- Một `h1` mỗi trang; heading theo thứ tự, section có tên rõ ràng.
- Link dùng để điều hướng, button dùng cho thao tác. Không dùng `href="#"` hoặc link trỏ đến route chưa có.
- Menu mobile dùng được bằng bàn phím, báo `aria-expanded`, đóng khi chọn link hoặc nhấn Escape.
- Menu desktop: chữ 15px từ lg, 16px từ xl, font-black; từng mục trải hết chiều cao header 88px, không bo góc hoặc chừa khoảng trên/dưới cho nền active/hover. Các mục liền nhau, vùng focus nằm trong thanh.
- Tài khoản trong header dùng nút cao 56px, avatar chữ cái, tên và chevron trên tablet/desktop; mobile giữ avatar để không tràn. Bấm mở dropdown tên/email và đăng xuất, đóng khi bấm ngoài, rời focus hoặc Escape (trả focus về nút). Lỗi đăng xuất hiện trong dropdown, không thêm link tài khoản chưa triển khai.
- Hiển thị focus ring, có skip link và text thay thế cho ảnh có nội dung.
- Vùng chạm tối thiểu 44px cho điều khiển chính; không tràn ngang ở màn hình 320px trở lên.
- Tôn trọng `prefers-reduced-motion`. Không ẩn nội dung phụ thuộc JavaScript animation.
- Khi chưa có dữ liệu thật, dùng empty/loading/error state phù hợp; không bịa khóa học, giá hoặc số người học.

## Catalog và chi tiết khóa học — 15/10/2026

- Chi tiết khóa học dùng container riêng căn giữa để giảm khoảng trắng hai bên: desktop lớn khoảng 76%, mục tiêu tối thiểu 1280px trong giới hạn 92% viewport, tối đa 1800px. Sidebar đăng ký 320/360/400px, gap 24/32px; thẻ bo 16px, CTA cao 52px và thanh chuyển nội dung cao tối thiểu 48px. Homepage/catalog giữ container riêng hiện có.

- Card học phí/đăng ký: giá 36px, CTA/tiêu đề thông tin 16px, nhãn/mô tả/danh sách 14px semibold; hai CTA cao tối thiểu 52px. Giữ giá mint, CTA coral/forest với chữ trắng theo yêu cầu hiện tại.

- Yêu cầu mới nhất: tổng quan, giáo trình và mentor nối trong một khối nền `logo-soft` (#D8F0FA, trích nền logo), thẻ bên trong trắng đặc với viền trắng 2px và bóng nhẹ. Chữ forest, icon và điểm nhấn mint; đường chia trắng. Heading 20/24px, nội dung 16px, tên học phần 16/18px, tên mentor 18/20px. Giữ anchor và nút mentor mở chọn lớp.

- Catalog tham khảo HTML người dùng dán; detail tham khảo `stitch_mindy_coding_platform/code.html` và `screen.png`. Nội dung mẫu chỉ là tham khảo, không phải dữ liệu hoặc policy giao dịch.
- Dùng palette đã config; không nhập các mã màu của Stitch. Giữ header/footer, font và logo hiện có.
- Card dùng chung trên homepage/catalog/related: tên hai dòng, mô tả hai dòng có chiều cao thống nhất, giá 24px cùng hàng. Bỏ “Đăng nhập để bắt đầu”; bấm card đi thẳng chi tiết public.
- Typography riêng `/courses`: bộ lọc/mô tả/chips/phân trang 14px, input/toolbar và phần giới thiệu 16px; chữ nội dung semibold, tên card 18px, giá 26px. Homepage/related giữ cỡ trước; chiều cao vùng tên/mô tả catalog tăng tương ứng để giá tiếp tục thẳng hàng.
- Catalog có sidebar desktop/disclosure mobile, tìm kiếm, sort, grid/list, chips và phân trang. Chỉ đưa bộ lọc có dữ liệu thực; không tạo level/rating/mentor search khi API chưa cung cấp.
- Detail có ảnh thật hoặc placeholder, giáo trình, mentor từ lớp đang mở, card đăng ký bên phải desktop. Không có CTA học thử/video/review/ưu đãi không có nguồn.
- Giáo trình là danh sách học phần tĩnh theo unitNumber, gồm số thứ tự, tên và mô tả nếu có. Bỏ dropdown, nút mở/thu gọn và requiredScorePercent khỏi UI public theo yêu cầu ngày 15/10/2026; giữ DTO/API để không thay contract.
- Layout courses và các card dùng canvas trắng. Khối bọc tổng quan/giáo trình/mentor dùng nền logo-soft theo yêu cầu mới nhất; trạng thái chọn và CTA giữ điểm nhấn palette.
- Xem khóa học/lớp/lịch không cần đăng nhập. CTA xác nhận đăng ký lớp mới kiểm tra phiên; người chưa có tài khoản có thể đi từ login sang register.
- Bỏ hàng metadata dưới tiêu đề và các khối ghi chú đăng ký/lịch lặp lại. Tổng quan, giáo trình và mentor nằm chung một khối nền logo-soft; giáo trình dùng danh sách tĩnh và anchor riêng.
