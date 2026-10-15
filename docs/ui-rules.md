# Quy tắc giao diện Mindy

## Nguồn thiết kế

Palette: [pallete.png](./pallete.png). Logo: [logo.jpg](./logo.jpg). Ảnh sidebar và admin table trong docs dành cho giai đoạn quản trị sau này.

Homepage tham khảo [Quanhpm/Mindy-FE, nhánh dev](https://github.com/Quanhpm/Mindy-FE/tree/dev), commit `b0ea585335251442999ba91f71620cdcc9d92045`, lấy ngày 15/10/2026. Các file nguồn:

- `src/features/home/components/home-content.tsx`: nội dung và thứ tự các section.
- `src/features/home/components/home-content.module.css`: tỷ lệ, khoảng cách và responsive tham khảo; bản FE2 chuyển sang Tailwind.
- `src/app/_components/home-shell.tsx`: header, menu mobile, footer tham khảo.
- `public/mindy/coding-mascot.png`: giữ nguyên mascot gốc từ commit trên. Hero dùng nền token mint, phủ nhẹ `hero-clouds.webp` ở opacity 25%, luminosity và căn dưới theo yêu cầu mới nhất ngày 15/10/2026.
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

Token gốc đặt tại `src/app/globals.css`. Các màu `soft`, `line`, `muted`, `peach` được pha từ palette gốc với trắng. Không đặt mã hex rải rác trong component và không tự thêm palette khác. Màu cam chỉ dùng vừa phải; dùng chữ xanh đậm trên CTA cam để dễ đọc.

Chữ chính dùng forest; chữ phụ dùng muted pha 90% forest để giữ độ tương phản. Hero có token riêng theo yêu cầu làm sáng/tươi hơn: `hero` lấy hue mint, saturation ×1.6 và lightness 90%; `hero-ink` pha 70% mint với forest cho tiêu đề nhạt hơn, `hero-copy` pha 40% mint với forest cho chữ nhỏ. Nền khối giới thiệu dùng `feature` (token sunshine, vàng cam sáng theo yêu cầu người dùng), banner trống dùng `banner` (26% mint) với khung trắng giữ nguyên. Tất cả màu pha tham chiếu token gốc, tự đổi khi sửa palette.

## Bố cục và typography

- Nền trắng, mint làm màu nhận diện; bố cục thoáng, dễ đọc.
- Font Nunito Variable hỗ trợ đầy đủ dấu tiếng Việt.
- Nội dung rộng tối đa 1280px, gutter mobile 20px, tablet 32px, desktop 40px.
- Hero hai cột trên desktop, một cột trên mobile; giữ đúng tỷ lệ ảnh ếch.
- Giữ thứ tự: hero, cách bắt đầu, khóa học, hành trình, thực hành, CTA cuối trang.
- Cách bắt đầu: ba khối nằm trong slider ngang, mỗi lần hiển thị một khối, theo ảnh tham khảo người dùng ngày 15/10/2026; ảnh ếch phía trên nội dung trái, CTA viền tròn, bên phải là banner mint trống có khung trắng. Mobile xếp nội dung và banner trong mỗi slide thành một cột. Không đặt chữ hướng dẫn hay ảnh tạm vào banner.
- Slider tự chuyển sau mỗi 3 giây và quay vòng, chỉ giữ ba chấm chọn ở giữa, bỏ hai nút trước/sau. Giữ phím trái/phải và vuốt native với scroll snap. Theo yêu cầu mới nhất, hover/focus không dừng slider. Tab ẩn tạm dừng; reduced motion tắt tự chạy và chuyển thủ công ngay. Slide ngoài màn hình dùng inert; tắt live announcement khi tự chuyển.
- Ưu tiên utility Tailwind; class chung chỉ dành cho pattern thực sự dùng lặp lại.

## Accessibility và tương tác

- Một `h1` mỗi trang; heading theo thứ tự, section có tên rõ ràng.
- Link dùng để điều hướng, button dùng cho thao tác. Không dùng `href="#"` hoặc link trỏ đến route chưa có.
- Menu mobile dùng được bằng bàn phím, báo `aria-expanded`, đóng khi chọn link hoặc nhấn Escape.
- Tài khoản trong header dùng nút cao 56px, avatar chữ cái, tên và chevron trên tablet/desktop; mobile giữ avatar để không tràn. Bấm mở dropdown tên/email và đăng xuất, đóng khi bấm ngoài, rời focus hoặc Escape (trả focus về nút). Lỗi đăng xuất hiện trong dropdown, không thêm link tài khoản chưa triển khai.
- Hiển thị focus ring, có skip link và text thay thế cho ảnh có nội dung.
- Vùng chạm tối thiểu 44px cho điều khiển chính; không tràn ngang ở màn hình 320px trở lên.
- Tôn trọng `prefers-reduced-motion`. Không ẩn nội dung phụ thuộc JavaScript animation.
- Khi chưa có dữ liệu thật, dùng empty/loading/error state phù hợp; không bịa khóa học, giá hoặc số người học.

## Catalog và chi tiết khóa học — 15/10/2026

- Catalog tham khảo HTML người dùng dán; detail tham khảo `stitch_mindy_coding_platform/code.html` và `screen.png`. Nội dung mẫu chỉ là tham khảo, không phải dữ liệu hoặc policy giao dịch.
- Dùng palette đã config; không nhập các mã màu của Stitch. Giữ header/footer, font và logo hiện có.
- Card dùng chung trên homepage/catalog/related: tên hai dòng, mô tả hai dòng có chiều cao thống nhất, giá 24px cùng hàng. Bỏ “Đăng nhập để bắt đầu”; bấm card đi thẳng chi tiết public.
- Catalog có sidebar desktop/disclosure mobile, tìm kiếm, sort, grid/list, chips và phân trang. Chỉ đưa bộ lọc có dữ liệu thực; không tạo level/rating/mentor search khi API chưa cung cấp.
- Detail có ảnh thật hoặc placeholder, giáo trình, mentor từ lớp đang mở, card đăng ký bên phải desktop. Không có CTA học thử/video/review/ưu đãi không có nguồn.
- Theo yêu cầu nền trắng ngày 15/10/2026: layout courses và các bề mặt trong detail dùng canvas trắng; bỏ các mảng soft ở tổng quan, giáo trình, mentor và ghi chú đăng ký. Dùng viền mảnh để phân tách; trạng thái chọn và CTA giữ điểm nhấn mint.
- Xem khóa học/lớp/lịch không cần đăng nhập. CTA xác nhận đăng ký lớp mới kiểm tra phiên; người chưa có tài khoản có thể đi từ login sang register.
