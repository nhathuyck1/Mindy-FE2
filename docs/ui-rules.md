# Quy tắc giao diện Mindy

## Tài liệu chung và nội dung theo buổi — 06/11/2026

- Mentor có tab Tài liệu chung giữa Chương và Bài tập, dùng lại bộ chọn chương. Tài liệu không gắn buổi chỉ nằm trong tab này; chi tiết không lặp khối Phạm vi tài liệu. Tab Buổi học riêng không còn ở lớp đang hoạt động.
- Student giữ nội dung chung tại chương, không thêm tab. Nút Tài liệu buổi học ở bên phải tiêu đề chương mở/thu gọn nội dung theo buổi, có aria-expanded/aria-controls; mobile tự xuống dòng và không tràn 320px. Mặc định thu gọn, không mount viewer theo buổi khi đóng.

## Workspace Manager và lịch riêng — 06/11/2026

- Áp dụng impeccable ở chế độ Operate: giữ palette Mindy/Inter, bỏ eyebrow lặp phía trên tiêu đề; Manager có thang chữ 16px riêng, nền mint pha trắng 3%, vùng dữ liệu trắng, header bảng soft và ô nhập/nút tối thiểu 44px. CSS chỉ scope `.manager-workspace`, không đổi Admin/Mentor.
- Lịch tuần/dời khai giảng nằm ở `/manager/schedule`, menu Lịch và khai giảng; Tổng quan chỉ dẫn sang trang mới. Chọn lớp trước, sau đó sửa lịch; ma trận ca có cột giờ sticky, vùng cuộn ngang riêng và hướng dẫn mobile. Ô ca giữ checkbox native cùng tên truy cập/focus, dấu chọn rõ; buổi đã tồn tại hiện nội dung đọc, không dùng input disabled.
- Tổng quan đặt thống kê tài liệu trước analytics, bỏ khối hướng dẫn/lối đi lặp ở cuối. Danh sách tài liệu, thu tiền, đơn nghỉ và detail dùng chung mật độ, bảng và control Manager.

## Dashboard vai trò và lớp Mentor — 06/11/2026

- Manager dùng biểu đồ xu hướng thu tiền, donut phương thức và cột ngang top 10 khóa/lớp. Bảng đầy đủ nằm trong details; dữ liệu trống có thông báo, không tạo lát donut giả. Quy tắc này áp dụng DTO thu tiền mới, thay các ghi chú dashboard Manager đào tạo cũ bên dưới.
- Mentor dùng cột số buổi theo chỉ số API, không cộng các nhóm hoặc suy tỷ lệ hoàn thành; donut đơn nghỉ có chú giải tiếng Việt và trạng thái trống. Lịch hôm nay dùng các dòng liên kết gọn với giờ bắt đầu/kết thúc, tên và trạng thái; chỉ hiện ngày Việt Nam hiện tại, có link xem lịch đầy đủ. Tổng quan đứng đầu sidebar ở mọi vai trò; Tin nhắn và Thông tin cá nhân nằm sau các mục nghiệp vụ.
- Lớp của tôi dùng grid 1/2/3 cột responsive, thẻ nền trắng/đầu mint nhạt, tên lớp nổi bật và CTA mint; bộ lọc chung trong khung soft. Dùng token palette và giữ focus bàn phím, 320px không tràn ngang.

## UI chung gọn và điều hướng theo ngữ cảnh — 06/11/2026

- Không thay UI compiler/code editor/authoring/review, chat hoặc bảng vẽ trong lượt này. Giữ nguyên các component/CSS/shell liên quan từ HEAD đầu vào.
- Bài tập Student có một bộ chọn lớp và danh sách theo hàng. Bộ lọc dùng đường phân cách; bỏ mô tả lặp. Danh sách lớp Mentor và thống kê role dashboard giảm card riêng lẻ.
- Giữ accordion học liệu của dev; có bảng/buổi/bài tập theo quyền và tracking khi mở viewer. Dashboard Mentor mở đúng buổi; từ buổi về lớp. Return path giữ các trang học tập đã validate.
- FULL_DAY vẫn có đổi ngày/giữ giờ và chọn slot. Ghi chú lịch sử về việc bỏ giữ giờ không áp dụng cho bản tích hợp này.

## Không gian học Student gọn và mở tại chỗ — 05/11/2026

- Dùng pattern khung chương của Mentor: sidebar 248px khi vùng nội dung đủ rộng, màn hẹp chọn chương bằng select thay danh sách dài phía trên. Header lớp/chương nhỏ, khung desktop cuộn nội dung riêng và giữ cột chương.
- Buổi học gộp ngay trong chương, hiển thị tên/lịch và lối vào lớp/bảng vẽ; không thêm tab buổi học. Bài đọc/tệp/video là accordion có số, tên, loại và chevron: bấm mở ngay dưới tiêu đề, bấm lại thu gọn, mỗi lần mở một bài; bài đầu mở sẵn. Không lặp tiêu đề lớn ở vùng đọc. Tệp/video chính lấy quyền xem khi mục mở, tệp đính kèm vẫn tải theo nút riêng.
- Nội dung chung và buổi chưa xác định giữ khu riêng, không tự gán buổi. Giữ quyền FULL/CASH_PREVIEW/chương khóa, các trạng thái lỗi/thử lại và bàn phím Enter/Space; responsive từ 320px.

## Danh sách bài tập theo buổi — 05/11/2026

- Cột Buổi học/Hạn nộp bỏ icon; Buổi học căn trái cả tiêu đề và nội dung, Hạn nộp căn giữa trên desktop. Mobile giữ nhãn và căn trái. Tiêu đề buổi đã có số không thêm tiền tố trùng. Nhãn cột chỉ ghi Hạn nộp.
- Danh sách lớp dùng hàng gọn với cột Bài tập / Buổi học / Hạn nộp và Xem bài; tối đa 1152px, mobile xếp dọc có nhãn. Buổi hiển thị số/tên, chương và lịch học thật từ context lớp; không suy số thứ tự theo vị trí mảng. Bộ lọc có nhãn, lựa chọn buổi gồm lịch để phân biệt tên trùng.
- Hạn nộp có giờ/ngày/năm theo Việt Nam và nhãn thời gian còn lại; trong 24 giờ dùng nền coral nhạt, hết hạn ghi Đã qua hạn. Nhãn cập nhật mỗi phút/khi focus, chỉ hiển thị với PUBLISHED; không suy tình trạng nộp bài từ hạn nộp. Null ghi Không giới hạn, metadata buổi thiếu/lỗi có thông báo và thử lại.

## Thống kê tài liệu theo khóa — 05/11/2026

- Trang danh sách khóa của quản lý tài liệu có ba thẻ count và donut Recharts theo khóa, kèm chú giải tên đầy đủ/số lượng/% và nút làm mới. Hàng khóa có count riêng: badge trên desktop, chữ dưới mã khóa ở mobile. Dùng token Mindy, không animation, 320px xếp dọc; lỗi không hiển thị tổng/tỷ lệ chưa đủ, tổng 0 có thông báo riêng.

## Sắp xếp lịch bù Mentor — 05/11/2026

- Slot giao với lịch bù đã chọn của buổi khác trong đơn bị disabled, nền nhạt và có chữ Trùng lịch bù buổi khác; cập nhật ngay cả khi hai bảng slot đã tải trước. Đổi/xóa lựa chọn mở lại các slot vừa được giải phóng. Hai buổi nối tiếp nhau được chọn; cùng giờ ở ngày khác vẫn hợp lệ.

- Mỗi buổi nghỉ có khối riêng kể cả nghỉ cả ngày, không gom nhiều buổi theo ngày. Header có số thứ tự/trạng thái; tên buổi, ngày, giờ gốc và thời lượng nằm bên trái desktop; ngày/buổi dạy bù và khung giờ nằm bên phải. Mobile xếp dọc, control 48px, giữ token Mindy và vùng focus.
- Ngày bù của FULL_DAY bắt đầu sau ngày kết thúc cả khoảng nghỉ; nghỉ theo buổi chặn ngày trước ngày buổi gốc. Cả hai đều không được trước hôm nay theo timezone backend, nhập tay cũng bị chặn tìm giờ. Có lựa chọn Cả ngày khi tìm giờ; chọn slot hiện tóm tắt ngày/giờ bù ngay trong buổi đó. Đổi ngày/period chỉ xóa mapping của buổi tương ứng. Tất cả buổi phải chọn slot hợp lệ trước khi gửi.

## Bộ lọc tài liệu chờ duyệt — 05/11/2026

- Bảng `/manager` thêm cột Khóa học và Học phần, có số thứ tự học phần. Ba bộ lọc khóa/học phần/loại nằm ngay trên bảng, control 48px, có Xóa bộ lọc; đổi khóa xóa lựa chọn học phần và mọi lần đổi lọc đưa về trang 1. Khóa chưa kích hoạt vẫn có trong bộ lọc Manager.
- Bộ lọc xếp dọc ở mobile, bảng cuộn ngang trong panel. Có lỗi/thử lại riêng cho dữ liệu bộ lọc và thông báo không có kết quả; không thay đổi trạng thái chờ duyệt hay thao tác xem/duyệt.

## Chi tiết bài tập Mentor — 05/11/2026

- QUIZ/ZIP dùng hai card chính: thông tin, thanh thao tác và nội dung đề ở card đầu; bài đã nộp và học viên hiện tại ở card theo dõi. Các vùng con dùng padding và đường phân cách, không lồng thêm khung card. Trình sửa mở riêng khi cần.
- Desktop rộng đặt lịch sử nộp và học viên cạnh nhau; mobile xếp dọc. Nhóm nút soạn đề và xuất bản tách rõ, viền nút dùng line/mint, nút Xuất bản là điểm nhấn. Header mục có icon mint; danh sách học viên dùng NameAvatar. Giữ quyền, API, bộ lọc URL và dialog xác nhận hiện có.
- Bộ lọc bài đã nộp không có thanh nền riêng: ba ô nền trắng có nhãn phía trên, chia đều khi vùng nội dung rộng ít nhất 30rem và xếp dọc khi hẹp hơn. Checkbox Gồm lượt cũ ở góc phải cùng hàng với tiêu đề Bài đã nộp, vùng bấm tối thiểu 44px; giữ tên truy cập và tham số bộ lọc hiện hữu.
- Trình soạn QUIZ có Nhập hàng loạt: dán văn bản hoặc chọn tệp .txt UTF-8, tải mẫu, kiểm tra lỗi theo dòng và xem trước ABCD với đáp án đúng. Mặc định thêm cuối bộ câu hỏi; thay toàn bộ là lựa chọn tường minh. Áp dụng chỉ cập nhật trình soạn, Lưu bộ câu hỏi mới ghi máy chủ. Dialog giữ tiêu đề/thao tác cố định và cuộn nội dung riêng trên mobile.

## Chi tiết buổi học Student — 04/11/2026

- Giữ dialog truy cập từ lịch, nền mint ở tiêu đề buổi; bảng vẽ/phòng học nền forest và bài tập đặt trước metadata để dễ tìm trên mobile. Danh sách bài tập ghi rõ QUIZ/ZIP/CODE, bài về nhà/kiểm tra, hạn nộp, có phân trang. Không có nút sửa link, bắt đầu buổi, điểm danh hoặc tạo bảng dành cho Mentor.
- Meeting dùng URL an toàn từ API riêng tư, ưu tiên buổi rồi lớp, mở tab mới với noopener/noreferrer/no-referrer. Phân biệt chưa có link, đã kết thúc, đã hủy, chờ thanh toán, lỗi và danh sách bài tập trống; học bù giải thích giới hạn bài tập lớp đích. Giữ Escape/focus restore và cuộn dialog tại 320px.

## Ca học và lịch dạy bù — 04/11/2026

- Dùng chung bảy ca trong teaching-slots: 07:30–09:00, 09:30–11:00, 12:00–14:00, 13:00–15:30, 16:00–17:30, 18:00–19:30, 20:00–21:30. Giữ giờ thực tế của buổi học từ BE; ca trưa mới không gộp mất ca 13:00.
- Chọn giờ dạy bù chỉ hiện các ca khớp cả giờ đầu/cuối trong danh sách BE trả về; không hiển thị các mốc 15 phút khác. Khi không có ca phù hợp còn trống, cho chọn ngày/buổi khác. Khoảng nghỉ sáng/chiều/tối/cả ngày giữ nguyên hợp đồng BE.

## Chi tiết buổi học Mentor — 04/11/2026

- Trang buổi học dùng nền soft nhẹ, hero mint gồm tên buổi/lớp, badge trạng thái, phân công và lịch/phòng. Không đổi theme hoặc shell các trang khác.
- Desktop có cột điểm danh/bài tập code chính và cột công cụ: bảng vẽ/phòng học nền forest, nhật ký nền peach, bài tập thường nền soft. Mobile xếp dọc; không tràn ngang320px. Tái sử dụng Button, NameAvatar và token palette hiện hữu, không thêm dependency/ảnh nền.
- Danh sách trước bắt đầu có avatar, số thứ tự theo trang, tên và nhãn học bù; không có nút điểm danh hoặc số chuyên cần giả. Sau bắt đầu dùng counters thật và roster hiện có. Bỏ câu Chỉ bắt đầu được trong ngày học / Hiện không thể sửa điểm danh và đoạn giải thích danh sách dự kiến theo yêu cầu; giữ deadline sửa, pending-payment count, lỗi/retry và toàn bộ permissions.
- Tham khảo cách phân cấp màu/avatar của School Attendance App – Muhammad Dias: https://dribbble.com/shots/26268194-School-Attendance-App-Clean-and-Intuitive-UI-Design ; không sao chép asset hoặc palette ngoài Mindy.

## Dashboard ba vai trò — 03/11/2026

- Phản hồi mới nhất: Manager chỉ giữ thẻ tổng quan, biểu đồ xu hướng và donut trạng thái, không hiển thị hai biểu đồ xếp hạng. Bỏ đoạn giải thích cách tính đăng ký/thời điểm cập nhật ở tất cả dashboard.

- Dùng token Mindy và admin-table-panel hiện hữu; bốn thẻ số liệu, Recharts AreaChart theo ngày, PieChart dạng donut cho trạng thái và BarChart ngang cho top khóa/mentor/lớp. Tooltip hiển thị tên đầy đủ và số liệu; bảng xếp hạng mở bằng details để đọc các tên dài. 320px xếp một cột, desktop chia cột, nhãn trục rút gọn một dòng và giữ số liệu đọc được.
- Mỗi thống kê ghi rõ tổng hiện tại hoặc trong kỳ; học viên distinct khác lượt đăng ký. Ngày/giờ hiển thị theo Việt Nam. Có loading/error/retry/empty độc lập, bảng ngày mở bằng details/summary, không animation hoặc số demo lấp chỗ.

## Cửa sổ chat nổi — 02/11/2026

- Launcher hình tròn mint ở góc phải dưới, có safe-area, badge headsup `99+` khi vượt 99 tin chưa đọc. Cửa sổ phía trên nút, rộng tối đa 416px, cao theo viewport và không che phủ bằng backdrop; 320px vẫn nằm gọn trong màn hình.
- Có nút thu gọn, về danh sách, mở trang đầy đủ; Escape đóng và trả focus về launcher. Chọn người/lớp ở trong khung, giữ URL trang hiện tại. Enter gửi, Shift + Enter xuống dòng, bộ gõ đang composition không gửi.
- Mỗi bong bóng có nút trả lời nhỏ ở bên cạnh; tin do mình gửi có menu ba chấm chứa Sửa/Xóa bằng chữ. Không thêm nút cảm xúc. Nút có aria-label/title và vùng bấm 44px; menu hỗ trợ bàn phím, dialog xác nhận giữ phiên bản và trả focus về nút ba chấm.

## Chat và avatar — 02/11/2026

- Avatar người dùng dùng chữ đầu/cuối tên, ví dụ Đặng Nhật Huy → ĐH, bo tròn `rounded-full`; không cần ảnh đại diện. Dùng `NameAvatar` trong chat và menu tài khoản.
- Tin nhắn dùng Nunito, token Mindy, panel bo 16px và control 44px. Desktop chia hội thoại/nội dung; mobile mở nội dung riêng với nút về danh sách. Nội dung xuống dòng, không render HTML, tên/file dài không đẩy tràn viewport. Lỗi/loading/empty/chỉ đọc có nội dung riêng và retry.
- Chat lớp Student nằm trong chi tiết khóa học để giữ hàng bảng gọn; Mentor chính mở từ lớp. Nhắn riêng từ thành viên có tên, không nhập UUID. Chỉ BE quyết định quyền truy cập/gửi/đính kèm.

## Bài tập Mentor / Student — 02/11/2026

- Nội dung ngắn, thao tác theo trạng thái thật: Tạo bản nháp → Soạn câu hỏi/Tệp đề → Xuất bản; ZIP phân biệt Đang kiểm tra/Đã gắn tệp/Đã nộp. Lưu điểm và Trả điểm là hai nút riêng, xác nhận tác động trong dialog.
- Assignment dùng Nunito/thang chữ Student ở cả Mentor và Student, scoped `.assignment-workspace`; control tối thiểu 44px, góc 8px, panel/dialog 16px. Không đổi typography toàn bộ staff. Màn 320px xuống hàng, tên dài wrap; vùng câu hỏi và bộ lọc không đẩy tràn trang.
- Filter loại/mục đích/buổi/trạng thái/lượt/trang lưu URL. Tab lớp Mentor cũng theo URL để Back giữ trang Bài tập. Chọn buổi/học viên bằng tên khi API/scope cho phép; không yêu cầu người dùng nhập UUID. Học viên lịch sử không có tên trong roster hiện tại có mã rút gọn; không tự xin roster toàn lớp bằng quyền dạy thay.
- Câu hỏi Mentor khi xem dùng details và đáp án đúng; ô nhập chỉ có trong trình sửa. Student chỉ thấy câu hỏi sau start, trạng thái tự lưu rõ ràng; phần chưa chọn có lối nhảy tới câu. Không render HTML từ đề/feedback.
- Lỗi phiên bản giữ bản nhập và có thao tác đọc lại/xác nhận thay thế; không tự đè bản nháp. Tệp chỉ tải bằng liên kết mới tại click. Không hiển thị lỗi/missing/null thành số 0, không hứa kho lịch sử toàn tài khoản.

## Đồng bộ lịch Student với Mentor — 04/11/2026

- Lịch Student dùng cùng bộ chọn ngày dd/mm/yyyy, nút tuần trước/hiện tại/sau, toolbar làm mới, bảng sáu ca, màu và kích thước ô như Mentor. Cột Ca học cố định khi cuộn ngang; buổi ngoài ca có hàng Khác. Mỗi buổi Student mở dialog cũ, giữ điểm danh thật và trạng thái hủy.
- Menu tài khoản Student gồm hồ sơ/lịch/khóa học/tài liệu. Mentor gồm hồ sơ/lịch dạy/lớp của tôi; hồ sơ có cùng bố cục Student và nhãn vai trò Mentor. Các quy tắc này thay bố cục lịch và giới hạn menu Student cũ bên dưới.

## Dashboard ba vai trò — 03/11/2026

- Phản hồi mới nhất: Manager chỉ giữ thẻ tổng quan, biểu đồ xu hướng và donut trạng thái, không hiển thị hai biểu đồ xếp hạng. Bỏ đoạn giải thích cách tính đăng ký/thời điểm cập nhật ở tất cả dashboard.

- Dùng token Mindy và admin-table-panel hiện hữu; bốn thẻ số liệu, Recharts AreaChart theo ngày, PieChart dạng donut cho trạng thái và BarChart ngang cho top khóa/mentor/lớp. Tooltip hiển thị tên đầy đủ và số liệu; bảng xếp hạng mở bằng details để đọc các tên dài. 320px xếp một cột, desktop chia cột, nhãn trục rút gọn một dòng và giữ số liệu đọc được.
- Mỗi thống kê ghi rõ tổng hiện tại hoặc trong kỳ; học viên distinct khác lượt đăng ký. Ngày/giờ hiển thị theo Việt Nam. Có loading/error/retry/empty độc lập, bảng ngày mở bằng details/summary, không animation hoặc số demo lấp chỗ.

## Chuẩn UI lấy Student làm mẫu — 26/10/2026

- Tài liệu áp dụng: [student-ui-standard.md](student-ui-standard.md), gồm bản đồ màn hình/logic, token, typography, bo góc/kích thước, trạng thái, responsive, đối chiếu staff và checklist nghiệm thu. Có dẫn nguồn code và ảnh mới từ production build với API mock.
- Theo quyết định người dùng ngày 26/10/2026, **Nunito Variable là font UI đích cho Student, Admin, Manager và Mentor**; code vẫn dùng monospace. Định hướng này thay thế các ghi chú lịch sử giữ Inter cho staff ở bên dưới. Chưa chuyển font hoặc sửa CSS/component staff trong lần tạo tài liệu này: staff hiện vẫn dùng Inter và thang chữ riêng.
- Phân biệt hiện trạng với chuẩn đích/đề xuất được đánh dấu trong tài liệu. Đích đồng bộ gồm thang chữ Student, palette Mindy, control thông thường góc 8px, CTA lớn 12px, panel/dialog 16px và vùng tương tác chính tối thiểu 44px; giữ ngoại lệ public/thương mại/nghiệp vụ có mô tả. Không coi các mặc định shared hiện tại đã đồng nhất hoàn toàn.
- Chỉ đồng bộ ngôn ngữ thị giác và pattern tương tác phù hợp; giữ menu, quyền, API, filter URL, draft, phiên bản/idempotency và workflow riêng từng role. Sidebar staff tiếp tục không có link Xem website/thẻ Mindy theo quyết định ngày 23/10/2026.

## Duyệt đơn xin nghỉ Mentor của Manager — 23/10/2026

- Bảng dashboard và trang danh sách có phân trang theo tổng backend; danh sách mặc định PENDING, lọc trạng thái/mentor/trang nằm trên URL. Bảng cuộn trong panel, vẫn dùng được ở viewport 320px.
- Detail hiển thị lý do và lịch gốc → bù; lịch ảnh hưởng và xung đột có pagination độc lập. Tên phụ được tải theo ID; lỗi giữ ID và có retry. Loading, lỗi, rỗng, trạng thái và phản hồi đều có chữ rõ ràng.
- Trước xác nhận, tải lại detail và chụp version hiện tại. Cả approve/reject cần lý do đã trim 1–1000 ký tự. Approve bị khóa khi không PENDING, hết hạn, nguồn stale hoặc nghỉ theo buổi có xung đột; stale vẫn cho reject và hướng dẫn mentor gửi đơn mới.
- FULL_DAY có xung đột hiển thị danh sách/tổng số và checkbox bỏ chọn mặc định. Khóa thao tác trong lúc gửi. Lỗi mạng/5xx cho gửi lại đúng body/key; 409 hoặc mã version/state/stale/expired tải lại và đóng xác nhận để manager quyết định lại. Không tự bật xác nhận xung đột.

## Hàng chờ và hộp thoại duyệt Manager — 23/10/2026

- Bảng Tài liệu chờ duyệt nằm dưới ba thẻ thống kê tại `/manager`, có tên/loại/trạng thái/cập nhật UTC+7 và Xem và duyệt. Link tên và nút cùng mở trang chi tiết theo ID; bảng cuộn trong panel ở 320px, thao tác/bộ lọc dùng component và token hiện có.
- Trang chi tiết có Về tổng quan và heading Xem và duyệt tài liệu. Giữ đủ nội dung/tệp/phiên bản, toolbar của workspace và editor CKEditor; lỗi ID/lỗi tải không hiển thị nội dung giả.
- Bấm Duyệt tài liệu, Yêu cầu chỉnh sửa hoặc Xóa phải mở hộp thoại giữa viewport ngay cả khi tài liệu dài. Hộp thoại có tên/phiên bản, xác nhận duyệt ghi rõ đồng thời xuất bản; lý do từ chối bắt buộc. Escape/Hủy trả focus về nút mở; đang gửi khóa thao tác và đóng hộp thoại. Lỗi phiên bản/mạng có Tải lại tài liệu trước khi gửi lại.

## Sidebar tài khoản nhân viên — 23/10/2026

- Sidebar Admin, Manager và Mentor bỏ liên kết Xem website và thẻ giới thiệu Mindy ở cuối thanh điều hướng, bao gồm menu mobile và chế độ thu gọn. Giao diện Student giữ nguyên.

## Manager overview, Student schedule và Admin read-only — 23/10/2026

- Admin/Manager tiếp tục dùng Inter, Student dùng Nunito. Dùng shell, token, Button, NativeSelect, Table, Modal, badge và phân trang đang có; panel trắng trên nền soft, viền line và bo góc hiện hữu.
- `/manager` dùng heading Tổng quan Manager và ba thẻ Chờ duyệt/Đã duyệt/Bản nháp. Mỗi số là total thật, không hiện 0 khi API lỗi. `/manager/materials` không có query vẫn là danh sách khóa học; inventory lưu view và reviewStatus trên URL.
- Menu tài khoản phân theo role; profile/lịch Student không xuất hiện với staff. Hàng Khóa học của tôi ưu tiên Vào học hoặc Xem trước chương theo quyền API, Xem chi tiết vẫn mở thông tin đăng ký.
- Lịch Student hiện “Có mặt”/“Vắng” chỉ với PRESENT/ABSENT. Trạng thái buổi hủy và điểm danh giữ riêng; null/UNMARKED không có badge điểm danh. Giảng viên nullable hiện “Chưa xác định giảng viên”.
- `/admin/tracking` có lọc nhóm/thời gian, nút áp dụng/xóa/làm mới, phân trang 10/20/50 và modal detail có Escape/focus restore. `/admin/payments/reconciliation` chỉ đọc danh sách phân trang; không có nút xử lý thanh toán.
- Bảng mới cuộn trong panel, không tràn trang từ 320px; bộ lọc và nút xuống hàng; ô lọc cao 48px, thao tác chính tối thiểu 44px. Có loading, error/retry và empty state. Tất cả trạng thái có chữ, không chỉ dùng màu.

## Soạn bài bằng CKEditor — 23/10/2026

- Thay nút Văn bản/HTML và textarea nội dung bằng CKEditor tiếng Việt cho cả Manager/Mentor, ở dialog và editor trong chương. Quy tắc chuyển chế độ Văn bản ngày 22/10 bên dưới được thay bằng giao diện mới này.
- Toolbar có tiêu đề, đậm/nghiêng/gạch dưới/gạch ngang, danh sách, bảng, liên kết, trích dẫn, mã, đường ngang, hoàn tác và nguồn HTML. Các mục tự gom vào Xem thêm khi thiếu chiều ngang; vùng soạn có chiều cao giới hạn/cuộn riêng, font tiếng Việt và màu từ token hiện có.
- Hiển thị dung lượng UTF-8 / 48 KiB, báo lỗi khi vượt giới hạn hoặc lưu nội dung rỗng. Giữ bản nháp khi lỗi API; chỉ gửi khi nhấn Lưu bản nháp. Nội dung HTML cũ được mở trực tiếp dưới dạng bài có định dạng.

## Gọn giao diện API Mentor và thanh tiến độ — 22/10/2026

- Navigation lớp dùng tab biểu tượng, gạch dưới và cuộn ngang trên mobile; phạm vi phân công trình bày gọn, không thêm thẻ thống kê giả. Buổi học, chuyên cần và tiến độ có tiêu đề/mô tả, bộ lọc và danh sách riêng.
- Chuyên cần/tiến độ dùng hàng học viên có avatar, thông tin theo cột và Xem chi tiết. Thanh chuyên cần dùng rate BE; null giữ trạng thái chưa có dữ liệu.
- Thanh tổng quan tiến độ ghi Chương đã có dữ liệu và số storedUnitCount/(storedUnitCount+untrackedUnitCount), không gọi là tỷ lệ hoàn thành. invalidStoredUnitCount là tập con của storedUnitCount, chỉ hiển thị badge cần kiểm tra, không cộng thêm vào mẫu số.
- Chi tiết học viên có thanh phần trăm đã lưu của từng chương, bao gồm 0 và 100; UNTRACKED/INVALID_PERCENT hiển thị thanh nét đứt, không giả làm 0 hoặc loading. aria-valuenow chỉ xuất hiện với giá trị thật. Không tính trung bình toàn khóa.
- Xin nghỉ tách chế độ tạo khỏi danh sách đơn; form có ba bước Khoảng nghỉ → Lịch dạy bù → Gửi đơn. Mapping ngày hiển thị buổi gốc cạnh ngày bù; slot dạng ô chọn, có dấu đã chọn. Giữ các field/version/key và bản nháp khi lỗi.
- Bulk điểm danh đặt riêng dưới thống kê với phạm vi cả buổi; nhật ký giảng dạy có mô tả và action riêng. Giữ kích thước/hành vi hai nút điểm danh từng học viên.

## Mentor workspace và xin nghỉ — 22/10/2026

- Lớp hiển thị tên/mã thật, phạm vi chính/dạy thay và các tab theo capabilities. Bỏ nút/modal khóa/mở/hẹn giờ chương; không thay bằng quyền giả tại UI.
- Chuyên cần hiển thị Chưa có dữ liệu với rate=null, kết quả điểm danh thực tế và credit học bù tách nhãn. Tiến độ ghi rõ dữ liệu lưu sẵn, không tự tính hoàn thành toàn khóa.
- Trang buổi học giữ một loading chính, xem trước học viên trước start; đánh dấu học bù rõ. Hai nút bulk xác nhận toàn bộ roster qua mọi trang. Ghi chú giảng dạy là khối nội bộ riêng với hai trường đã dạy/việc tiếp theo, không thêm cột ghi chú điểm danh.
- Menu Đơn xin nghỉ mở danh sách và form preview → lịch bù → gửi. Các ô ngày/buổi xếp một cột trên điện thoại, grid khi đủ chỗ; nút tối thiểu 44px, nhãn đọc đầy đủ và không đè nhau ở 320px. Conflict giữ dữ liệu người nhập, có hướng dẫn đọc lại và thao tác mới.

## Chương → Buổi học → Nội dung — 22/10/2026

- Tham khảo cách Coursera gom video, readings và assignments theo module tại https://www.coursera.org/learn/learning-and-development; Mindy áp dụng thêm cấp buổi học phù hợp lớp có lịch dạy. Không sao chép màu sắc hoặc thêm loại nội dung chưa được API hỗ trợ.
- Cột chương giữ nguyên. Vùng nội dung mặc định hiển thị từng buổi với tên, lịch UTC+7, trạng thái, số nội dung và nút Điểm danh khi được cấp quyền. Chỉ giữ một nút Thêm nội dung ở đầu chương, chọn buổi trong form; không lặp nút ở các thẻ bên dưới. Danh sách mỗi buổi có icon, tên, loại và trạng thái duyệt, nhấn để mở chi tiết và sửa/gửi duyệt khi có quyền.
- Phân biệt tên gọi: Chương là nhóm ngoài; Bài viết/Tài liệu/Video là nội dung bên trong buổi. Thao tác Tạo chương cũ ở tài liệu được đổi thành Thêm nội dung, form dùng Loại nội dung và bộ lọc Trạng thái nội dung.
- Chưa gắn buổi học là khu riêng cho nội dung dùng chung; buổi chưa xác định không bị giấu hoặc tự gán. Buổi trống và buổi không khớp bộ lọc có thông báo khác nhau. Màn hình tổng quan chờ cả chương và nội dung với một loading.
- Chi tiết/form mở trong cùng vùng cuộn, có Về danh sách buổi học. Các hàng có tên 16px xuống dòng và focus bàn phím rõ, nút tối thiểu 44px; kiểm tra từ 320px đến desktop.

## Thẻ tệp đính kèm Mentor — 22/10/2026

- Thẻ tệp đã lưu dùng biểu tượng tài liệu trên nền mint nhạt, tên 16px xuống dòng khi dài, nhãn loại tệp dễ hiểu và dung lượng B/KB/MB; không hiển thị MIME thô.
- Nút Xem / tải tệp cao tối thiểu 44px, nằm bên phải khi đủ chỗ và xuống hàng toàn chiều rộng trên màn hình nhỏ. Tiêu đề Tệp đính kèm có biểu tượng và số tệp.
- Chỉ lấy liên kết có hạn khi người dùng nhấn; giữ loading, lỗi, mở tab mới và trình xem nội tuyến sau khi được cấp quyền.

## Hẹn giờ Mentor không chọn quá khứ — 22/10/2026

- Khi tạo chương mới, ô Khả dụng từ có min theo giờ Việt Nam, làm tròn lên phút gần nhất. Hẹn giờ mở trong Quyền truy cập áp dụng cùng giới hạn. Mốc min cập nhật khi focus/nhấn ô và khi bị từ chối lưu vì thời gian đã trôi qua.
- Kiểm tra lại thời điểm thực khi lưu để chặn lịch đã thành quá khứ lúc form còn mở. Để trống Khả dụng từ vẫn hợp lệ; Mở ngay/Khóa chương vẫn hoạt động. Không bắt sửa mốc lịch cũ khi chỉ chỉnh nội dung bản nháp đã có.

## Chuyển chế độ soạn bài Mentor — 22/10/2026

- Bấm Văn bản chuyển trực tiếp từ HTML sang phần chữ, giữ xuống dòng; không có khung cảnh báo hoặc bước xác nhận. Chỉ cập nhật bản nháp trên form, dữ liệu server chỉ đổi khi bấm Lưu bản nháp.

## Thông tin buổi học của tài liệu — 22/10/2026

- Gom tên tài liệu và nhãn loại/trạng thái vào cùng phần đầu. Ngay bên dưới có khối Buổi học của tài liệu, icon lịch, tên buổi, số buổi và thời gian; bỏ nút Xem buổi học theo yêu cầu mới nhất.
- Tài liệu không có sessionId phải ghi rõ Chưa gắn buổi học; tác giả có quyền sửa được Gắn buổi học qua form hiện tại. Không suy đoán tài liệu thuộc buổi đầu của chương. Tên dài/nút xuống hàng trong panel nhỏ, vẫn đọc được ở 320px.

## Một loading cho dữ liệu Mentor — 22/10/2026

- Trang buổi học chỉ hiển thị một loading cho thông tin buổi và điểm danh, không xếp hai loading dọc. Hai dữ liệu cùng sẵn sàng mới hiện nội dung; lỗi có Thử lại.
- Workspace chương không thêm loading ở mục buổi học phụ khi nội dung chính/form đang tải. Không thay loading auth/route hoặc tiến trình upload tệp.

## Điểm danh Có mặt/Vắng — 22/10/2026

- Tiêu đề Điểm danh căn giữa theo chính cụm hai nút bên dưới, không căn theo toàn bộ chiều rộng cột.

- Hai nút Có mặt và Vắng nằm trong một cụm chọn bo góc rộng tối đa 220px, hai phần bằng nhau, cao 44px mỗi nút và căn trái. Nút được chọn có nền canvas, viền mint/đỏ nhẹ và chữ forest/đỏ đậm; nút còn lại trung tính. Giữ aria-pressed, icon, focus bàn phím và độ tương phản khi khóa chỉnh sửa.
- Thẻ số liệu Vắng mặt chỉ có viền status-red khi absent > 0; bằng 0 dùng border-line như các thẻ còn lại. Bảng chỉ còn Học viên, Trạng thái và Điểm danh.
- Vùng bảng dưới 768px chuyển thành thẻ, giữ đủ chỗ cho hai nút ở 320px. Điểm danh theo quyền và thời hạn do backend trả về.

## Upload tài liệu Mentor — 22/10/2026

- Thay input tệp native bằng vùng kéo thả/nhấn chọn, viền nét đứt và nền mint nhạt theo ảnh tham chiếu. Tên tệp 16px, dung lượng và trạng thái trên thẻ riêng; không lặp tên tệp chính. Giữ giới hạn 200 MiB hiện có.
- Chỉ sau khi máy chủ trả READY mới hiện thẻ xanh và chữ Tải lên thành công. Thất bại dùng nền/viền/chữ đỏ, icon lỗi, nguyên nhân và nút Thử lại. Đang gửi/kiểm tra dùng spinner và thông báo thật; hủy dùng màu trung tính.
- Áp dụng cùng thẻ cho tài liệu chính và tệp đính kèm. Kéo thả, chọn bằng bàn phím, thay tệp, thử lại và hủy phải hoạt động ở desktop/mobile; tên dài xuống dòng, không làm tràn 320px.

## Điểm danh Mentor — 22/10/2026

- Tên học viên dùng 20px/line-height 28px, weight 600 và avatar chữ cái; hiển thị đầy đủ tên, cho xuống dòng. Header bảng, trạng thái và nội dung phụ dùng ít nhất 16px, tiêu đề Bảng điểm danh 24px; số thống kê 32px.
- Bảng có header nền nhẹ, đường chia hàng và padding 20px theo chiều dọc. Có mặt dùng mint, Vắng mặt dùng đỏ và Chưa điểm danh dùng trung tính, luôn kèm chữ/icon. Hai nút điểm danh có vùng bấm tối thiểu 44px, focus bàn phím và disabled theo quyền máy chủ.
- Vùng danh sách rộng từ 768px dùng bảng; dưới mốc này dùng thẻ học viên với tên ở trên, trạng thái/thao tác phía dưới. 320px giữ cỡ chữ và cho xuống hàng, không cuộn ngang toàn trang. Styling chỉ ở feature Mentor.

## Mentor trên tablet và điện thoại — 22/10/2026

- Toàn bộ nhãn giao diện Mentor dùng Chương theo yêu cầu mới nhất: tab Chương, Tạo chương, Mọi trạng thái chương, Loại chương và các tiêu đề/thông báo tương ứng.
- Bộ lọc trạng thái chương đặt bên phải trên cùng hàng với các nút chọn nội dung; cả hai cao 48px. Ô lọc rộng 240px và không vượt chiều ngang panel; bên trái cuộn ngang danh sách nội dung. Panel dưới 576px đặt bộ lọc ở hàng riêng. Chữ 16px/line-height 24px, không dùng truncate để cắt nhãn bộ lọc.
- Khi danh sách nội dung rỗng, thông báo Chưa có dữ liệu nằm một hàng riêng bên dưới bộ lọc và rộng toàn panel.
- Khung chương/học liệu chuyển bố cục theo chiều rộng chính khung, không chờ viewport đạt xl. Vùng nội dung từ 768px dùng hai cột với sidebar chương 248px; danh sách chương và body học liệu cuộn độc lập, giữ header và thao tác bên ngoài vùng cuộn.
- Vùng hẹp hơn dùng ô Chương đang xem cao 48px kèm trạng thái, thay danh sách chương xếp dọc phía trên học liệu. Tiêu đề đầy đủ vẫn hiện trong panel. Các nút được xuống hàng, bộ lọc/select vừa panel, rail học liệu cuộn ngang; 320px không tràn hoặc cắt trường form.
- Form chỉ chia hai cột thứ tự/ngày khi bản thân form rộng từ 576px; resize hoặc thu gọn shell giữ chương và bản nháp đang soạn. Quy tắc này thay bố cục xếp danh sách chương phía trên trên màn nhỏ của Mentor ngày 16/10.

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
- Xác nhận hủy đơn nằm giữa viewport, không chèn nội dung vào ô thao tác. Dùng native dialog ở top layer để mở được từ chi tiết đơn; ưu tiên focus Giữ đơn hàng, Escape chỉ đóng xác nhận và trả focus. Thông báo lỗi nằm trong xác nhận, nút bị khóa khi đang gửi.
- Giỏ hàng có nhóm radio Hình thức thanh toán trong khối Tổng thanh toán: Chuyển khoản QR (mặc định) và Tiền mặt. Cả hai dùng nút Thanh toán; bỏ mô tả dưới lựa chọn và dưới nút theo yêu cầu 02/11. Tiền mặt chuyển danh sách đơn chờ thu, chỉ backend xác nhận đã thanh toán. Khóa lựa chọn trong lúc tạo đơn.

## Màu chữ catalog — 16/10/2026

- Trang /courses dùng chữ đen cho tiêu đề, breadcrumb, toolbar, nội dung card và học phí; bộ lọc giữ xanh, icon và nền nhạt giữ điểm nhấn Mindy. Bỏ câu mô tả dưới tiêu đề catalog. Quy tắc chỉ áp dụng catalog.
- Điều chỉnh tiếp: chữ catalog dùng đen pha 15% trắng để dịu hơn; danh mục trên card giảm 14px xuống 12px, tên khóa học giảm 18px xuống 16px. Giữ cỡ chữ card homepage/related.

## BE Change — 05/11/2026

Giữ panel/token Mindy, controls có label và bảng cuộn trên320px. Lịch tuần preview trước save, swap xác nhận hai buổi/lý do, material bulk có dialog title/revision và không báo freed bytes trước cleanup. Dashboard role-specific; ảnh chat signed bypass image optimizer, modal trả focus và nút lấy lại URL.

## Màn code (compiler) — bộ UI dùng chung (04/11/2026)

- Student làm bài, Mentor soạn đề (Studio) và Mentor chấm bài dùng chung một bộ: `code-chrome.tsx` (trang full màn hình, header 56px ba vùng, nhóm nút hành động, chip, thanh bước), `code-panel.tsx` (panel + tab có nền trượt), `resizable-split.tsx` (khung kéo được, nhớ tỉ lệ), `code-editor.tsx` (editor tô màu tự viết, không thêm thư viện), `code-theme.tsx` (theme editor).
- Khi mở các màn này, shell gọi `useShellFocus()` (`components/layout/shell-focus.tsx`): sidebar thu gọn, topbar/footer ẩn, trang chiếm đúng 1 màn hình; mỗi panel tự cuộn.
- Class `.code-ide` cố định thang chữ Student trong mọi shell (shell Mentor/Admin phóng to chữ).
- Editor có 3 theme (Mindy tối mặc định, Đêm, Sáng), biến màu đặt trong `globals.css` theo `[data-code-theme]`; lựa chọn nhớ theo trình duyệt. Màu cú pháp (`--syn-*`) là ngoại lệ duy nhất ngoài palette vì IDE cần màu token phân biệt.
- Studio soạn đề có 3 bước: Đề bài (gộp đề + hàm, có xem trước đúng như học viên thấy và code khởi đầu) → Lời giải & test (bố cục giống màn làm bài) → Giao đề (checklist bấm để sửa). Chuyển bước tự lưu phần Đề bài nếu có thay đổi.
- Tab trái của các màn được khai báo bằng mảng; tab "Bảng vẽ" cho mentor dạy trên code của học viên sẽ thêm vào đây sau.
