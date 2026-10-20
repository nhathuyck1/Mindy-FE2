# Quy tắc giao diện Mindy

## Danh sách khóa học trước khi mở nội dung — 16/10/2026

- Mặc định /manager/materials chỉ hiện danh sách khóa học toàn chiều rộng: tên, mã và nút mở học liệu. Bỏ picker lặp, khung hai cột và panel hướng dẫn trống ở bước chưa chọn khóa.
- Bấm một khóa mới mở workspace chương hiện hữu: bộ lọc phía trên, badge số tài liệu cạnh chương, khung cố định/scrollbar ẩn và chỉnh sửa tại chỗ. Có nút Danh sách khóa học để quay lại; reload trở về list. Không thêm search.

## Bộ lọc cạnh khóa học — 16/10/2026

- Khóa học, Trạng thái và Loại tài liệu nằm cùng hàng phía trên khung từ xl; màn nhỏ xếp dọc, giữ ô chọn 48px. Số tài liệu là nhãn nhỏ cạnh CHƯƠNG trong header cố định. Không lặp thanh lọc bên trong vùng cuộn nội dung chương.
- Bộ lọc vẫn theo chương, đổi chương đặt lại trạng thái/loại/trang. Khi tạo tài liệu, khóa hai bộ lọc đến khi đóng hoặc lưu form; màn kho chọn khóa học cũng dùng cùng bố cục.

## Khung khóa học cố định — 16/10/2026

- Dùng CourseContentFrame/CourseContentPanel: khung cao tối đa 800px và không quá viewport trừ 32px; không tăng chiều cao theo tài liệu. Desktop xl giữ sidebar 280px, mobile chia danh sách trên và nội dung dưới trong cùng khung.
- Tiêu đề Nội dung khóa học, header chương và nút Tạo tài liệu đứng yên. Chỉ danh sách chương và body tài liệu cuộn độc lập, ẩn scrollbar, chặn cuộn lan sang trang. Vùng cuộn vẫn focus được và dùng bàn phím/cảm ứng bình thường.
- Khung chỉ xuất hiện sau khi chọn khóa học. Đổi chương đưa body về đầu; không thay kích thước ô chọn hoặc thêm search.

## Thu tiền thành công — 16/10/2026

- Sau response CASH/PAID đúng đơn và tổng tiền, đóng modal thu tiền rồi hiện một modal Đã thu tiền thành công, có dấu kiểm mint, số tiền, mã đơn và nút Hoàn tất. Không chồng hai modal hoặc giữ form thu sau thành công.
- Lỗi hoặc kết quả chưa xác định giữ nguyên màn chi tiết để đối soát; mở một đơn PAID đã có chỉ hiển thị trạng thái thanh toán, không tự hiện thông báo thành công mới.

## Chi tiết tài liệu Manager — 16/10/2026

- Bộ lọc chương có nhãn và thu gọn về bên phải trên desktop, vẫn cao 48px. Chương chỉ có một tài liệu hiển thị chi tiết trực tiếp; nhiều tài liệu dùng hàng chọn cuộn ngang để không đẩy nội dung xuống cuối trang.
- Chi tiết embedded nằm trong một thẻ: trạng thái/phiên bản, tiêu đề/mô tả và thao tác cùng header; thông tin phát hành là hai mục nhỏ với ngày và giờ tách bằng dấu chấm giữa. Thao tác xóa dùng biểu tượng riêng có tên truy cập; mobile rút gọn nhãn phụ.
- Tệp có biểu tượng, tên được xuống dòng, nhãn PDF/Word/Video… và dung lượng KB/MB dễ đọc; nút Xem / tải tệp vẫn lấy signed access khi được bấm. Không hiển thị MIME thô hoặc thông báo upload thành công cho tệp đã lưu.

## Bộ lọc workspace Manager — 16/10/2026

- Ô chọn khóa học/trạng thái/loại tài liệu cao 48px, chữ 16px với line-height 24px để không cắt dấu tiếng Việt. Picker khóa học rộng tối đa 48rem, co theo chiều rộng trang trên mobile. Bỏ ô tìm kiếm theo yêu cầu cập nhật; chọn trực tiếp từ danh sách hoặc picker.

## Thu tiền Manager kết nối API — 16/10/2026

- /manager/collections mặc định là danh sách đơn tiền mặt từ máy chủ, có tên học viên, tổng cả đơn, trạng thái/hạn và Xem đơn. Bộ lọc lớp/status và tìm chính xác mã đơn chạy server; CSV ghi rõ chỉ trang đang xem. Các số đếm là total thật theo scope, không tạo tổng tiền/ledger khi API chưa có.
- Dialog hiển thị toàn bộ lớp trong đơn và Tổng phải thu cả đơn, yêu cầu nhập Tiền đã nhận (VND) đúng tổng + xác nhận đã nhận đủ trước khi bật Xác nhận đã thu tiền. Chỉ PAID response từ BE mới báo thành công; sau lỗi đọc lại đơn, không tự gửi lại lệnh thu. 320px không tràn trang, bảng cuộn trong panel.
- Bỏ banner Chưa kết nối thanh toán và Lập phiếu thu khỏi màn mặc định. Phiếu cũ trên thiết bị mở kho tra cứu/xuất riêng, không được tính là đã thanh toán máy chủ.

## Manager: màn mặc định — 16/10/2026

- Vào /manager/materials hiện danh sách khóa học thật toàn chiều rộng. Chọn một khóa mới hiển thị sidebar chương và nội dung; bỏ chọn, quay lại hoặc tải lại trở về danh sách, không hiện panel hướng dẫn trống.
- Dashboard thống kê/bảng kho nằm sau nút Toàn bộ tài liệu; nút Khóa học đưa về workspace. Không dùng dashboard cũ làm màn mặc định. Tạo tài liệu tiếp tục nằm bên phải; không tự chọn khóa học hoặc thêm dữ liệu giả.

## Manager: khung khóa học theo Student — 16/10/2026

- Sau khi chọn khóa học ở Quản lý tài liệu, thay khu thống kê/bảng bằng khung Student: sidebar Nội dung khóa học 280px bên trái từ xl, chương đang chọn nền mint nhạt, số tròn và tên chương; panel có header CHƯƠNG + title, nội dung bên phải. Mobile sidebar nằm trên với vùng cuộn giới hạn, 320px không tràn ngang.
- Tạo tài liệu ở góc phải header chương; chọn bài xem tại chỗ, thanh Chỉnh sửa/duyệt/xuất bản/xóa ở trên nội dung. Editor embedded, dùng chương hiện tại, không mở modal hay bắt chọn lại context. Kho toàn bộ vẫn giữ dialog và các công cụ duyệt hiện có.
- Catalogue không có số buổi theo lớp nên sidebar chỉ hiện số/tên chương; không bịa số buổi. Dùng palette/tokens và độ đậm chữ của Student, không đổi shell Manager hoặc trang Student.

## Mentor: bố cục chương và học liệu — 16/10/2026

- Trang chi tiết lớp mở mặc định Chương & học liệu; Học viên vẫn là tab riêng. Sidebar chương 280px bên trái từ xl, nội dung bên phải; mobile đặt sidebar trên nội dung và giới hạn chiều cao cuộn như Student.
- Header chương có Quyền truy cập và Tạo học liệu bên phải. Các học liệu được chọn trên thanh ngang; thanh thao tác bài đang xem đặt Chỉnh sửa/Gửi duyệt/Xóa nháp cạnh tiêu đề theo quyền BE.
- Xem/tạo/sửa bài tại panel chính, không mở thêm dialog cho thao tác soạn. Tạo ARTICLE mặc định nhập văn bản; HTML giữ định dạng bài cũ, chuyển thành text cần xác nhận trong form. File/video thay tệp thông qua upload hiện hữu, chỉ READY mới cho lưu.
- Dùng font bold 700 cho tiêu đề/chương, nội dung regular; palette/tokens Mindy hiện có. Không đổi UI Student hoặc dựng chức năng bài kiểm tra khi BE chưa có contract.

## Không gian Manager — 16/10/2026

- Kế thừa admin shell, Inter và palette Mindy trong `data-admin-root`. Hai mục: Quản lý tài liệu và Thu tiền; sidebar desktop thu gọn, mobile dùng sheet.
- Kho tài liệu có thống kê thật từ total API, bộ lọc duyệt/loại, bảng phân trang và dialog xem trước/soạn/duyệt. Không bịa tên tác giả/khóa học khi DTO chỉ có ID. Bài viết nhập HTML cơ bản theo pattern Mentor, preview sandbox sau khi lưu.
- Bộ lọc thêm khóa học → học phần; chọn học phần thì số liệu thống kê và bảng cùng phạm vi. Chọn khóa học nhưng chưa chọn học phần hiển thị hướng dẫn, không giữ bảng cũ. Bộ chọn xếp một cột ở 320px, hai cột từ sm và bốn cột từ xl; có loading/error/retry riêng cho picker.
- Các ô chọn của bộ lọc và form tài liệu cao 48px, rộng hết cột, line-height 24px. Khoảng cách trên đặt ở wrapper để mũi tên luôn ở giữa ô và không chèn chữ; dùng `NativeSelect.wrapperClassName` để định kích thước wrapper.
- Upload phân biệt đã gửi tệp và đã kiểm tra READY. Kiểm tra tự động có giới hạn, có Dừng kiểm tra tự động/Kiểm tra lại/Bỏ tệp đang chờ; không khóa toàn form vô thời hạn. Lưu bản nháp bị chặn nếu thiếu file chính hoặc còn file chờ; FAILED hiển thị lỗi backend rõ ràng và không tự upload lại.
- Upload dùng vùng chọn/kéo thả bằng tiếng Việt, input file native ẩn khỏi giao diện. Sau READY, chỉ hiện một thẻ với tên gốc, loại dễ hiểu, dung lượng KB/MB, dấu xác nhận “Đã tải lên thành công” và nút Thay tệp. Không lặp tên hoặc hiện MIME/raw bytes/field backend; declaration vẫn giữ chính xác khi gọi API.
- Attachment đã xong dùng cùng thẻ gọn, có nút bỏ được đặt tên theo tệp; nút thêm attachment không chiếm khối lớn. Header và hàng Lưu bản nháp giữ cố định trong dialog, phần form cuộn độc lập.
- Ô chọn file và form chỉ khóa trong lúc truyền dữ liệu/complete hoặc lưu; khi backend kiểm tra, cho phép chọn tệp thay thế và thêm attachment. Thay tệp hủy request/poll cũ, chỉ gắn kết quả của tệp mới; có giải thích riêng khi chưa chọn học phần hoặc Lưu còn chờ validation.
- Thu tiền có nhãn “Chế độ cục bộ · Chưa kết nối thanh toán”; phiếu nháp/ghi nhận/hủy tách khỏi trạng thái order. Không seed dữ liệu giả; tổng chỉ tính phiếu ghi nhận cục bộ chưa hủy; hỗ trợ xuất CSV.
- 320px không tràn toàn trang; bảng cuộn trong panel. Dialog hỗ trợ Escape/focus restore, bộ chọn có accessible label riêng.

## Giữ giao diện Booking khi tích hợp admin — 16/10/2026

- Giao diện public, giỏ hàng, thanh toán và khu vực user giữ nguyên. Không lấy CSS toàn cục hoặc thay Button/Card/Brand từ nhánh admin.
- Inter, typography và màu chữ admin chỉ kích hoạt khi có data-admin-root, kể cả modal portal. Token Mindy hiện có không bị ghi đè ngoài admin. Khi quay về website bằng client navigation, font Nunito, màu nền/chữ và kích thước header giữ nguyên (E2E desktop/mobile).
- Riêng `/admin/login` dùng Nunito Variable qua token `font-brand`, cùng font trang đăng nhập học viên; các trang quản trị còn lại vẫn dùng Inter.

## Tài liệu học tập — 16/10/2026

- Sidebar thêm Tài liệu học tập; danh sách chỉ hiện lớp có quyền FULL hoặc CASH_PREVIEW và canViewClass. Không hiện card Chưa có quyền truy cập. Phân trang tính sau lọc quyền.
- Workspace tham khảo Coursera: sidebar học phần với số thứ tự, panel nội dung bài đọc/video/tệp, điều hướng bài trước/tiếp theo và lịch từng học phần. Giữ palette Mindy; không thêm phần trăm hoặc dấu hoàn thành khi API chưa có tiến độ.
- Theo phản hồi mới nhất: cân giữa bản đầu và bản chữ mảnh, tiêu đề/tên học phần dùng weight 700, tên buổi học/link/metadata nhấn dùng 600; nội dung đọc regular, giữ strong/em từ bài viết. Không dùng extrabold trong vùng học.
- Mobile 320px xếp sidebar trên nội dung, giới hạn cuộn danh sách học phần; code/table/PDF cuộn trong panel. Signed URL mở tệp có trạng thái chờ/lỗi/làm mới; media giữ vị trí khi đổi URL, PDF có link mở tab mới dự phòng.

## Khôi phục bảng màu gốc và giữ chữ đen ở chi tiết khóa học — 15/10/2026

- Theo yêu cầu mới nhất, khôi phục mint `#338A85` và forest `#1D5B57`; dừng thử bảng xanh nhạt/xanh đậm mới. Các màu pha tự đi theo token chung.
- Nội dung, nhãn, mô tả, giá và link trang chi tiết khóa học dùng chữ đen, kể cả popup/lịch trong trang; SVG giữ điểm nhấn và nút nền đậm/coral giữ chữ trắng. Không thay màu nền bằng cách ghi đè token thương hiệu trong phạm vi trang.
- Hero và nút nền mint khôi phục chữ trắng như trước; logo/ảnh gốc giữ nguyên.

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
- `public/mindy/coding-mascot.png`: giữ nguyên mascot gốc từ commit trên. Hero dùng nền token mint, phủ `hero-clouds.webp` căn dưới: grayscale, brightness 50%, contrast 5, screen và opacity 55% để chỉ hiện vân mây trắng nhẹ trên nền xanh.
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
- Font Nunito Variable hỗ trợ đầy đủ dấu tiếng Việt.
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
- Xem khóa học/lớp/lịch qua mentor không cần đăng nhập. CTA “Đăng ký học ngay” kiểm tra lại phiên ngay khi bấm; guest thấy popup “Bạn chưa đăng nhập” và “Hãy đăng nhập để có thể đăng ký học ngay bây giờ.”, có Đăng nhập ngay/Để sau/đóng/Escape, giữ focus và khóa cuộn. Bỏ CTA cuối homepage “Sẵn sàng học một điều mới?” và link hero “Thử viết mã nguồn” theo yêu cầu mới nhất.
- Bỏ hàng metadata dưới tiêu đề và các khối ghi chú đăng ký/lịch lặp lại. Tổng quan, giáo trình và mentor nằm chung một khối nền logo-soft; giáo trình dùng danh sách tĩnh và anchor riêng.

## Khu vực user — 15/10/2026

- Dropdown tài khoản thêm Thông tin cá nhân và Lịch học, đóng khi điều hướng. UserShell theo sidebar nhánh admin, giữ palette mint/forest hiện tại và chữ nội dung đen. Bốn mục: Thông tin cá nhân, Đơn hàng của tôi, Lịch học, Khóa học của tôi.
- Lịch học dùng bảng 7 cột ngang Thứ 2–Chủ nhật, có ngày, giờ, lớp, mentor, hình thức/phòng và trạng thái; hiển thị tuần trước/sau, tuần này và chọn ngày. Mobile cuộn ngang trong bảng, không làm tràn trang. Không có nút tham gia/meeting URL giả.
- Sidebar desktop thu gọn được; mobile dùng dialog, đóng khi điều hướng/Escape, trả focus và khóa cuộn. Mỗi trang có một h1 và trạng thái loading/empty/error/retry.

## User: bảng và chi tiết theo yêu cầu — 16/10/2026

- Orders và My Courses dùng bảng một hàng/mục thay card lớn; chỉ hiện metadata tóm tắt. Nút Xem chi tiết mở dialog nội dung đầy đủ, đóng bằng Escape/nút đóng và trả focus. Không tự chuyển thanh toán khi mở chi tiết.
- Ô thời khóa biểu chỉ hiện giờ, tên khóa học tối đa hai dòng và trạng thái; cả ô là button mở modal Chi tiết lớp học. Mentor, phòng, nội dung buổi, học phần, ngày/giờ đầy đủ và trạng thái thanh toán tiền mặt nằm trong modal. Giữ bảng 7 cột/ngày và thông tin cancelled.
- Mobile giữ bảng cuộn ngang trong vùng riêng; modal giới hạn 90dvh, cuộn bên trong với header/nút đóng sticky.

- Cập nhật ô lịch 16/10: hiện giờ, tên khóa học, nhãn Online/Offline và icon người kèm tên mentor; bỏ Sắp diễn ra khỏi ô. Vẫn giữ Đã hủy/Đang diễn ra/Đã hoàn thành khi có; modal chi tiết không đổi.

- Cụm chuyển tuần là một nhóm nền nhẹ, hai mũi tên và Tuần này dùng nút ghost không viền/shadow; chữ Tuần này 16px semibold. Hình thức học trong ô lịch dùng icon màn hình (Online)/vị trí (Offline) kèm chữ, không dùng badge có viền.

- Cập nhật mới nhất 16/10: nền cụm ‹ Tuần này › dùng canvas trắng cùng nền lịch, thay nền soft nhẹ.

- Bảng Đơn hàng của tôi có cột Khóa học sau mã đơn, lấy courseTitle từ các dòng đơn và gộp tên trùng, giới hạn hai dòng để giữ hàng gọn. Bỏ mô tả Theo dõi đơn hàng và trạng thái thanh toán dưới tiêu đề.

## Màu chữ catalog — 16/10/2026

- Trang /courses dùng chữ đen cho tiêu đề, breadcrumb, toolbar, nội dung card và học phí; bộ lọc giữ xanh, icon và nền nhạt giữ điểm nhấn Mindy. Bỏ câu mô tả dưới tiêu đề catalog. Quy tắc chỉ áp dụng catalog.
- Điều chỉnh tiếp: chữ catalog dùng đen pha 15% trắng để dịu hơn; danh mục trên card giảm 14px xuống 12px, tên khóa học giảm 18px xuống 16px. Giữ cỡ chữ card homepage/related.
