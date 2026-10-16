# Tiến độ

## 16/10/2026 — Màn đầu chỉ hiện danh sách khóa học

- Thay rail khóa học/panel hướng dẫn trống bằng ManagerCourseList toàn chiều rộng, không hiện picker trùng ở bước đầu. Chỉ khi bấm một khóa mới mount workspace chương/tài liệu; nút Danh sách khóa học quay lại list, reload cũng về list.
- Giữ nguyên bộ lọc, badge số tài liệu cạnh chương, khung cuộn độc lập và tạo/sửa học liệu khi đã chọn khóa. Kho toàn bộ tiếp tục mở bằng nút riêng.
- Build/TypeScript, ESLint/format các file sửa và 144 unit tests pass. 42 E2E Manager desktop/mobile trên dev localhost:3003 và 2 scenario vào list/chọn khóa/quay lại/reload/bàn phím/320px trên production pass bằng API mock. Đã xem ảnh list desktop/mobile; không gọi course detail hoặc materials khi chưa chọn khóa.

## 16/10/2026 — Số tài liệu cạnh nhãn chương

- Chuyển Tài liệu (n) từ thanh lọc xuống cạnh CHƯƠNG, dùng nhãn nhỏ nền soft/chữ muted. Thanh trên chỉ còn ba ô chọn, giữ khung và header cố định.
- Build/TypeScript, ESLint và 4 E2E bố cục/cuộn desktop/mobile trên dev localhost:3003 pass; đã xem ảnh desktop.

## 16/10/2026 — Chuyển thanh lọc lên cạnh khóa học

- Đưa bộ lọc trạng thái/loại và số tài liệu lên cạnh picker khóa học, bỏ thanh cũ khỏi nội dung chương. ManagerCourseWorkspace nhận coursePicker slot từ màn chính/kho; ManagerChapterContent giữ query/filter/page/editor theo key chương và render cả thanh lọc lẫn frame.
- Giữ ô chọn 48px, tự xếp dọc trên mobile; đổi chương reset bộ lọc, tạo/sửa/upload vẫn trong khung cuộn độc lập.
- Build/TypeScript, ESLint/format các file sửa và 144 unit tests pass. 10 E2E workspace trên dev localhost:3003 và 42 E2E Manager trên production desktop/mobile pass; xác nhận ba ô chọn cùng hàng, bộ lọc không còn trong vùng cuộn, lọc/phân trang/reset theo chương và 320px. Đã xem ảnh desktop.

## 16/10/2026 — Khung khóa học đứng yên, cuộn bên trong

- Tách CourseContentFrame/CourseContentPanel dùng chung cho màn chọn khóa học và nội dung chương. Khung giới hạn chiều cao theo viewport; sidebar và nội dung cuộn độc lập, header/nút tạo cố định, ẩn thanh cuộn và chặn overscroll lan sang trang.
- Vùng cuộn có tên truy cập/tabIndex, hỗ trợ bàn phím; đổi chương reset cuộn nội dung, mobile xếp hai vùng trên/dưới và không tràn ở 320px.
- Build/TypeScript, ESLint/format các file sửa và 144 unit tests pass. 42 E2E Manager desktop/mobile trên dev localhost:3003 và 8 scenario workspace liên quan trên production build pass bằng API mock. Test danh sách 24 chương/12 tệp xác nhận hai vùng cuộn độc lập, header/khung không dịch chuyển, overscroll không kéo trang, scrollbar ẩn, bàn phím End và đổi chương reset cuộn. Đã xem ảnh desktop/mobile.

## 16/10/2026 — Thu tiền xong chuyển sang thông báo thành công

- Khi API confirm trả CASH/PAID đúng đơn và tổng tiền, đóng modal chi tiết/thu tiền và mở hộp Đã thu tiền thành công với mã đơn, số tiền và nút Hoàn tất. Danh sách/count được làm mới qua invalidation hiện hữu.
- Không hiện thông báo thành công khi lỗi, 409 hoặc mất response; giữ chi tiết để kiểm tra lại. Đóng thông báo đưa focus về Làm mới, không gửi lại lệnh thu.
- Build/TypeScript, ESLint/format các file sửa và 144 unit tests pass. 10 E2E thu tiền desktop/mobile pass trên dev localhost:3003 và production build bằng API mock, gồm đóng modal cũ/mở thông báo, mã đơn/số tiền, focus sau Hoàn tất, mở lại đơn PAID và lỗi không báo thành công. Đã xem ảnh mobile; không thực hiện thu tiền thật.

## 16/10/2026 — Làm gọn chi tiết tài liệu Manager

- Gom tiêu đề, trạng thái và thao tác vào cùng thẻ chi tiết; giảm số nền/khối lớn, làm rõ ngày phát hành/khả dụng. Tệp hiển thị icon, tên, định dạng và dung lượng dễ đọc, không còn MIME kỹ thuật.
- Một tài liệu mở trực tiếp, không lặp hàng chọn với tiêu đề; nhiều tài liệu chuyển sang hàng chọn cuộn ngang. Bộ lọc có nhãn, giữ chiều cao 48px và xếp dọc trên mobile.
- Kiểm chứng: build/TypeScript, ESLint/format các file sửa, 144 unit tests và 40 E2E Manager trên production desktop/mobile pass. Kiểm tra dev localhost:3003 bằng API mock, xem ảnh chi tiết PDF desktop/mobile, xác nhận không tràn ở 320px và signed access chỉ gọi khi bấm mở tệp.

## 16/10/2026 — Ô chọn và tìm khóa học Manager

- Cập nhật theo yêu cầu tiếp theo: bỏ tìm kiếm khóa học và phần lọc/số kết quả; giữ picker rộng, chiều cao 48px và danh sách khóa học đầy đủ.
- Sau khi bỏ tìm kiếm: ESLint và 4 E2E desktop/mobile trên dev localhost:3003 pass, gồm chọn khóa học, reload, kích thước ô chọn và 320px.

- Tăng các ô chọn khóa học/trạng thái/loại tài liệu trong workspace lên 48px, line-height 24px; mở rộng picker, xuống hàng trên mobile để tránh cắt chữ.
- Thêm tìm khóa học theo tên/mã, hỗ trợ gõ không dấu và không phân biệt hoa thường. Lọc cả danh sách và các lựa chọn, có số kết quả/trạng thái rỗng/nút xóa; tìm kiếm không tự đổi khóa học đang mở.
- Build, TypeScript, ESLint/format các file sửa và 144 unit tests pass. 38 E2E Manager desktop/mobile pass trên dev localhost:3003 bằng API mock; scenario search/kích thước ô chọn/320px cũng pass trên production build. Đã xem ảnh desktop/mobile.

## 16/10/2026 — Nối API thu tiền mặt Manager

- Xác minh Swagger live và source BE: đã có Manager orders/detail/classes và cash confirm; thay /manager/collections local-only bằng danh sách đơn thật, filter lớp/status, exact order code, pagination, CSV trang và counts từ API.
- Chi tiết đơn hiển thị học viên/toàn bộ lớp/tổng đơn/người thu. Confirm đòi đủ tổng tiền (không thu theo từng lớp), checkbox đã nhận, chặn quá hạn/đã PAID/quyền thay đổi; success chỉ sau CASH PAID từ BE. Không retry lệnh khi 409/403/lỗi mạng; đọc lại đơn để xử lý kết quả chưa xác định và mất response.
- Giữ dữ liệu phiếu cũ trong localStorage, chỉ đọc/xuất qua modal riêng. Không import thành order, không cộng vào thanh toán và không tạo phiếu giả để thay API.
- Build/TypeScript, ESLint/format các file sửa, 144 unit tests pass. 36 E2E Manager regression và 10 E2E thu tiền desktop/mobile pass (đa lớp, thiếu tiền, expiry, 403/409, mất response/không thu lặp, lọc/phân trang/CSV, 320px, bảo tồn phiếu cũ). Chạy smoke list/filter/CSV trên dev localhost:3003 bằng API mock: pass. Đã xem ảnh desktop/mobile.
- Không sửa BE, deploy hoặc xác nhận đơn/nhận tiền thật. Chưa nghiệm thu settlement bằng phiên Manager thật.

## 16/10/2026 — Mặc định Manager mở khung khóa học

- /manager/materials mở ngay bố cục hai cột: danh sách khóa học bên trái, panel nội dung bên phải. Chọn khóa học mở chương đầu tiên và workspace Student đã có; bỏ chọn/reload vẫn là khung mới, không quay về dashboard cũ. Tạo tài liệu ở góc phải; kho thống kê/bảng chỉ mount khi chủ động bấm Toàn bộ tài liệu.
- Tách giao diện kho sang ManagerMaterialsInventory để giữ đầy đủ duyệt/publication/upload và không gọi manager/materials/stat totals khi chỉ xem khóa học.
- Build/TypeScript, ESLint, 137 unit tests và 36 E2E Manager desktop/mobile pass. Có kiểm tra màn vào trang mặc định, chọn khóa bằng danh sách, reload, 320px và quyền Student. Chạy thêm scenario default/reload trực tiếp trên dev đang chạy localhost:3003: pass (API mock; không dùng tài khoản thật).
- Đã xem ảnh manager-default-course-desktop.png từ dev port 3003. Không sửa BE hoặc deploy.

## 16/10/2026 — Manager: chọn khóa học mở bố cục giống Student

- /manager/materials khi chọn khóa học chuyển toàn bộ vùng nội dung bên phải sang khung hai cột: sidebar chương 280px, panel chương/tài liệu. Tự mở chương đầu tiên; đổi chương reset bộ lọc, trang và tài liệu đang xem. Không hiện ba ô thống kê, bảng kho hoặc dropdown học phần trong workspace khóa học. Bỏ chọn khóa học quay về kho toàn bộ.
- Nút Tạo tài liệu đặt góc phải header chương; dùng sẵn courseId/courseUnitId hiện tại. Tạo văn bản/HTML hoặc upload FILE/VIDEO ngay trong panel, không phải chọn lại khóa học/học phần. Chi tiết có thanh Chỉnh sửa/duyệt/xuất bản/xóa và editor tại chỗ; giữ nguyên canEdit, revision, kiểm tra READY và xử lý xung đột.
- Course catalogue không có lịch buổi học theo lớp nên không bịa số buổi hoặc gọi Student APIs bằng quyền Manager. Chỉ dùng APIs hiện hữu.
- Production build/TypeScript, ESLint và format các file sửa pass; 137 unit tests và 34 E2E Manager desktop/mobile pass, gồm workspace hai cột, 320px, pagination/filter theo chương, sửa/tạo text tại chỗ, upload FILE đúng chương và duyệt/refetch.
- Đã xem ảnh desktop/mobile test-results/manager-student-workspace-*.png. Dữ liệu test dùng mock, chưa nghiệm thu phiên Manager/storage thật hoặc deploy FE.

## 16/10/2026 — Không gian học liệu Mentor theo trang Student

- Đọc lại BE api_flow 3.3/3.4 và controller/DTO; đối chiếu Swagger live /docs-json có unit detail, GET preview/assets theo expectedRevision và contentText cho Mentor.
- Mở lớp mặc định vào Chương & học liệu. Sidebar chương và panel nội dung dùng cùng bố cục/tokens trang Student; chọn chương/học liệu xem tại chỗ, thanh ngang có Chỉnh sửa/Gửi duyệt/Xóa nháp, Tạo học liệu ở góc phải. Danh sách buổi học hiển thị trực tiếp giờ Việt Nam và liên kết điểm danh.
- Tạo/sửa ngay trong panel: ARTICLE bằng văn bản hoặc HTML, FILE/VIDEO thay tệp đã READY. Bài HTML hiện hữu giữ định dạng; chuyển sang văn bản có xác nhận trong form. Lưu vẫn là bản nháp; canEdit/owner/firstApprovedAt/reviewStatus quyết định quyền sửa. Giữ form khi 409, không tự replay ghi đè.
- Proxy mở chính xác GET unit detail và GET preview/assets có expectedRevision bắt buộc; signed URL chỉ trong component memory, hủy request khi unmount và xóa khi hết hạn. Body Mentor giới hạn 64 KiB UTF-8 theo BE; ARTICLE chỉ nhận một trong contentText/contentHtml.
- Kiểm chứng: production build, TypeScript, ESLint và 137 unit tests pass; 54 E2E Mentor/Student/Manager liên quan desktop/mobile pass (có kiểm tra 320px, chuyển chương, soạn text, sửa tại chỗ, quyền sửa, 409, upload READY/FAILED và release). Hai scenario lịch Mentor có sẵn (4 lượt desktop/mobile) hiện lệch UI: assertion tên buổi học trong calendar trong khi UI hiện mã lớp. Không thay lịch trong lượt này. Format toàn repo báo CRLF/style tồn tại ở các file ngoài phạm vi; các file code/test sửa được format riêng.
- Đã xem screenshot desktop/mobile. Các luồng cá nhân dùng mock contract; chưa nghiệm thu tài khoản Mentor/storage thật hoặc deploy FE.

## 16/10/2026 — Làm lại UI upload sau khi tải thành công

- User cung cấp ảnh PDF READY trên server: declaredSizeBytes = sizeBytes = 230670, mimeType application/pdf, kind PDF, errorCode null. Đây là bằng chứng upload PDF thành công do user cung cấp.
- Thay input file native bằng nút chọn/kéo thả tiếng Việt; trạng thái truyền/kiểm tra dùng spinner và thông báo ngắn. Sau READY chỉ hiện một thẻ file có icon, tên, dung lượng dễ đọc, xác nhận thành công và Thay tệp; bỏ MIME/bytes kỹ thuật và tên lặp.
- Attachment dùng cùng thẻ với nút bỏ; nút thêm gọn, nhãn Không bắt buộc. Form cuộn độc lập và hàng Lưu bản nháp luôn hiện ở đáy dialog. Giữ chọn lại/hủy/kiểm tra thủ công, chặn lưu khi file chưa READY.
- ESLint, production build/TypeScript, format các file sửa, 134 unit tests và 30 E2E Manager desktop/mobile pass. Kiểm cả 320px không tràn form, hàng nút lưu luôn hiện, hộp chọn tệp, kéo thả, không lặp file thành công, thêm/bỏ attachment, thay tệp và refresh phiên. Đã xem screenshot desktop/mobile; sửa grid ô ngày cho màn hình nhỏ. Preview 3003 trả 200.

## 16/10/2026 — Khôi phục phiên khi request Manager trả 401

- Ảnh người dùng: upload-intents trả 401 AUTHENTICATION_REQUIRED trước PUT; metadata file đã đúng. Phát hiện chỉ auth/me có refresh, request tài nguyên Manager/Files chưa có bước khôi phục phiên.
- Thêm managerRequest cho queries, commands, file access và intent/complete/status: chỉ khi HTTP 401 mới kiểm auth/me dưới khóa phiên hiện có, refresh một lần nếu cần, rồi gọi lại request bị từ chối một lần. Không retry lỗi quyền, conflict, network hoặc 5xx; hủy upload thì dừng recovery. PUT storage giữ nguyên và không đi qua refresh.
- Complete hết phiên/quyền dừng ngay, không tiếp tục GET hoặc refresh lặp qua nhánh khôi phục response bị mất. Lỗi 401 hiển thị hướng dẫn đăng nhập lại bằng Manager khi không thể refresh.
- ESLint, format các file sửa, production build/TypeScript, 134 unit tests và 28 E2E Manager desktop/mobile pass; gồm mô phỏng 401 ở cả intent, complete và polling, refresh nối tiếp luồng mà chỉ PUT một lần. Preview 3003 trả 200; chưa xác nhận refresh bằng phiên thực tế trong trình duyệt người dùng.

## 16/10/2026 — Đối chiếu upload Manager với Postman Phase 3.2

- Đã đọc collection người dùng gửi, `Mindy-BE/docs/api_flow/PHASE_3_2_FLOW.md`, API breakdown, DTO và allowlist BE; xác nhận lại ba Files routes/DTO trên Swagger live `/docs-json`.
- Manager tự bắt tên/MIME/size byte từ File và hiện metadata trên form. Giữ file.type nếu hợp lệ cho đuôi file; fallback khi rỗng/sai, gồm `.ts` bị browser nhận là video/mp2t. Loại kind chỉ lấy từ BE sau READY. Chặn đuôi không hỗ trợ, tên không có extension hoặc ký tự điều khiển đúng policy BE.
- Giữ đúng intent → PUT raw File với requiredHeaders → complete `{}` → poll status; thêm thông báo bước complete và kiểm abort trước chuyển bước. Không complete khi PUT thất bại, không gắn file PROCESSING/FAILED.
- Kiểm thử: ESLint, format các file sửa, production build/TypeScript, 125 unit tests và 26 E2E Manager desktop/mobile pass. E2E kiểm đúng metadata PDF có MIME browser sai, bytes PUT, complete 202 và GET tự động đến READY. Dữ liệu upload dùng mock contract, chưa nghiệm thu worker/storage thật trên VPS.

## 16/10/2026 — Mở lại ô chọn file khi backend kiểm tra

- Người dùng báo ô chọn file bị mờ. Tách khóa lúc truyền tệp khỏi trạng thái đợi validation: sau complete, ô file chính/attachment và các trường form hoạt động lại; có thể thay tệp ngay khi file cũ còn PROCESSING.
- Mỗi uploader có trạng thái truyền riêng để request kiểm tra file này hoàn tất không mở nhầm khóa khi file khác đang truyền. Thay file hủy request/poll cũ; unmount dọn state. Lưu vẫn đợi file READY và có hướng dẫn rõ cạnh nút.
- Production build/TypeScript, ESLint, format code sửa, 103 unit tests và 24 E2E desktop/mobile pass. Đã kiểm thay file trong lúc PROCESSING, thêm attachment, mở lại input sau FAILED và hủy request khi đóng form; xem screenshot ô file đã mở và preview 3003 trả 200.

## 16/10/2026 — Giảm polling upload và bàn giao lỗi worker

- Giảm tối đa 6 GET trạng thái tự động theo backoff 3/5/10/15/20/30 giây, dừng khi tab ẩn hoặc terminal. Giữ file PROCESSING trong form; Kiểm tra lại chỉ GET một lần, không upload lại. Có dừng/bỏ file chờ, chặn lưu khi chưa READY; FILE_RETRY_EXHAUSTED được mô tả đúng là lỗi xử lý backend.
- Manager Query có staleTime 30 giây để hạn chế refetch do đổi focus. Mutation vẫn invalidate/refetch dữ liệu liên quan.
- Tạo `manager-upload-backend-handoff.md` theo yêu cầu người dùng, gồm mô tả 201→200→202→FAILED, UUID từ ảnh, lệnh log/config/scratch/runner/DB cho BE. Chưa chạy hoặc thay cấu hình VPS; chưa xác định exception gốc phía worker.
- TypeScript/production build, ESLint, format code sửa, 103 unit tests và 20 E2E Manager desktop/mobile pass, gồm terminal stop, kiểm tra một lần và không upload lại. Đã xem screenshot lỗi backend mới; preview 3003 trả 200.

## 16/10/2026 — Chẩn đoán upload Manager

- Bổ sung E2E PDF cho cả desktop/mobile: intent → PUT storage → complete READY → gắn fileId/lưu FILE. Mock pass; chưa có phiên Manager thật để nghiệm thu storage.
- FE hiện phân biệt lỗi theo bước upload và giữ mã lỗi HTTP/backend, không đưa lỗi file về thông báo conflict tài liệu. Có thông báo riêng cho CORS/network, timeout và HTTP storage; không complete khi PUT lỗi.
- Live storage health 200, nhưng OPTIONS cho localhost:3003 thiếu CORS allow headers. Ghi bằng chứng và cách xử lý VPS trong `manager-upload-troubleshooting.md`; chưa khẳng định nguyên nhân lần lỗi người dùng do chưa có thông báo/request thực tế, chưa thay cấu hình VPS.
- TypeScript/production build, ESLint, format code sửa, 99 unit tests và 16 E2E Manager desktop/mobile pass. Nghiệm thu upload thật còn cần dòng lỗi hoặc request thực tế và cấu hình CORS storage hợp lệ.

## 16/10/2026 — Nới kích thước ô chọn Manager

- Tăng ô chọn trạng thái/loại/khóa học/học phần ở bộ lọc và form tài liệu lên 48px, full chiều rộng cột, line-height 24px để chữ không bị cắt.
- Thêm prop tùy chọn wrapperClassName cho NativeSelect, chuyển khoảng cách trên ra wrapper để căn giữa mũi tên. Consumer khác giữ nguyên kích thước mặc định.
- Production build/TypeScript, ESLint, format các file sửa và 14 E2E Manager desktop/mobile pass; đã xem ảnh bộ lọc/form mới. Preview 3003 trả 200.

## 16/10/2026 — Nối GET tài liệu theo học phần cho Manager

- Kho tài liệu bổ sung bộ chọn khóa học/học phần và gọi GET `/manager/course-units/:courseUnitId/materials`, hoàn tất consumer cho 11 API manager-materials. Dùng danh mục public thật để chọn khóa active và Course Unit ID.
- Danh sách/thống kê đổi theo học phần, giữ bộ lọc duyệt/loại và phân trang; đổi bộ lọc về trang 1, bỏ chọn khóa về toàn kho. Không hiện dữ liệu toàn kho khi đang chờ chọn học phần; mutation refetch danh sách của học phần đang xem.
- Xác nhận contract Swagger live. TypeScript/production build, ESLint, format code sửa, 97 unit tests và 14 E2E Manager desktop/mobile pass. E2E kiểm luồng hiện có cùng chọn học phần, phân trang, reset, 320px và refetch sau duyệt; dữ liệu dùng mock theo contract. Đã xem screenshot desktop/mobile; preview port 3003 trả 200.

## 16/10/2026 — Manager quản lý tài liệu và thu tiền chờ API

- Thêm `/manager/materials` và `/manager/collections`, shell responsive, guard MANAGER ACTIVE; staff login và menu tài khoản dẫn đúng khu vực.
- Nối API kho tài liệu: lọc/phân trang, chi tiết/preview, tạo/sửa ARTICLE/FILE/VIDEO, upload private/attachment, duyệt/từ chối có lý do, xuất bản/ẩn, xóa. Giữ revision đã xem, không retry 409; file access kiểm identity/revision/expiry, URL chỉ trong memory.
- Thu tiền cục bộ: lập nháp → ghi nhận → hủy, chi tiết, tìm/lọc, tổng tiền và CSV; lưu theo user trong trình duyệt. Không gọi API chưa tồn tại hoặc đổi order/enrollment. `ReceiptRepository` tách riêng cho lần nối API.
- Đối chiếu contract người dùng và route Swagger live. TypeScript, ESLint, production build pass; 96/96 unit tests; 26/26 E2E desktop/mobile (Manager, login, admin/public style regression) pass; đã xem screenshot desktop/mobile, kiểm không tràn ngang 320px. Mutation/storage dùng mock, chưa nghiệm thu tài khoản hoặc thanh toán thật.
- Prettier toàn repo báo định dạng ở 237 file nền có sẵn; code mới/sửa đã format. Không format lại module ngoài phạm vi.

## 16/10/2026 — Tích hợp admin có chọn lọc trên Booking

- Nền giữ nguyên main/Feat/Booking tại 86780a8; thực hiện trên nhánh main-admin. Chỉ lấy module, routes, shell, primitive mới và test admin từ origin/admin (90499af); không merge toàn bộ nhánh.
- Giữ nguyên homepage, courses, cart, orders/payments, user/learning, root layout, login UI, auth queries và các primitive đã có. Button chỉ thêm unstyled, Icon chỉ thêm tên mới. Header chỉ bổ sung link quản trị cho ADMIN ACTIVE; returnTo thêm allowlist admin.
- CSS admin ở src/app/admin/admin.css, chỉ đổi font/token khi có data-admin-root; globals.css chỉ import token/animation bổ sung. Thêm Inter, Recharts và tw-animate-css để phục vụ module admin.
- API adapter thêm policy admin riêng, GET/POST/PATCH/PUT allowlist, UUID/schema/query validation, cookie access_token và Origin cho mutations. Quyền ADMIN do backend kiểm tra; không nới quyền API student.
- Production build pass; 68 unit tests pass. Toàn bộ E2E: 157 pass, 3 skip đúng nền tảng; thêm 2 test desktop/mobile kiểm font/màu/header của website không đổi sau client navigation qua admin. Test dùng API mock theo contract, chưa nghiệm thu tài khoản admin/VPS thật.
- Không thay đổi các file khác chỉ để sửa format: format:check toàn repo còn cảnh báo sẵn có trên nhiều file Booking (chủ yếu CRLF); kiểm format riêng các file tích hợp.

## 16/10/2026 — Đổi tên học phần thành chương

- Thống nhất chữ Chương/chương trong khu vực học tập, giáo trình public, nút xem trước và chi tiết lịch học; cập nhật nhãn accessibility và test liên quan. Giữ nguyên tên field và contract API.

## 16/10/2026 — Cân lại độ đậm chữ khu vực học tập

- Điều chỉnh về mức giữa hai bản theo yêu cầu: tiêu đề/tên học phần 700, tên buổi học/link/metadata nhấn 600; nội dung bài đọc giữ regular. Áp dụng cho danh sách tài liệu, workspace và viewer.
- Kiểm tra Prettier, ESLint và production build/TypeScript pass.

## 16/10/2026 — Tài liệu học tập và không gian học theo unit

- Thêm `/user/materials`, lấy đủ trang `/me/classes?view=all`, chỉ hiện `canViewClass && accessMode !== NONE`; lọc trước khi phân trang 10 lớp/trang. Ẩn thẻ chưa có quyền theo yêu cầu mới nhất. Cash preview chỉ xem giáo trình/buổi học, không gọi Material/asset API.
- `/user/materials/[classId]`: bố cục theo Coursera với sidebar học phần, vùng đọc bài, bài trước/tiếp theo, buổi học và meeting URL từ private detail. Giữ palette Mindy; giảm chữ xuống medium/semibold theo phản hồi. Responsive 320px.
- Swagger live ngày 16/10 đã có ARTICLE/detail/inlineImages/attachments và POST file access, mới hơn tài liệu/source BE local. Nối class/full/preview, unit materials đủ trang, detail, signed assets; allowlist GET primary download. Không sửa BE hoặc Mindy-FE.
- Bài đọc dựng DOM bằng allowlist, loại script/event/style và URL nguy hiểm; ảnh chỉ resolve fileId được DTO cho phép. PDF/video/audio/image dùng signed URL; tải attachment, làm mới URL và giữ vị trí media. URL chỉ ở memory, không optimizer/Web Storage; kiểm materialId/fileId/revision/expiry, hủy request khi unmount.
- Swagger chưa có API progress/completion: không bịa phần trăm hoặc tự đánh dấu hoàn thành. Unit status/unlockAt optional để tương thích live DTO; backend kiểm tra release/access mỗi lần list/detail/sign.
- Kiểm tra cuối: lint, Prettier, TypeScript và production build pass; 52/52 unit tests; toàn bộ E2E desktop/mobile 127 pass, 3 skip đúng nền tảng. Đã xem screenshot chữ mới và bài đọc desktop/mobile 320px, không tràn trang. Dữ liệu cá nhân/tệp E2E dùng mock theo contract; chưa nghiệm thu tài khoản thật hoặc playback/Range/storage VPS.

## 16/10/2026 — Tên khóa học trong bảng đơn hàng

- Thêm cột Khóa học từ order.details[].courseTitle, gộp tên trùng và hiển thị tối đa hai dòng; tooltip giữ tên đầy đủ. Bỏ dòng mô tả Theo dõi đơn hàng và trạng thái thanh toán.

## 16/10/2026 — Nền trắng cho cụm chuyển tuần

- Đổi nền cụm ‹ Tuần này › từ soft/60 sang canvas trắng, cùng nền lịch.

## 16/10/2026 — Cụm chuyển tuần và icon hình thức học

- Gộp hai mũi tên/Tuần này thành nhóm liền, bỏ viền nút và shadow, tăng chữ Tuần này lên 16px; viền input ngày giảm nhẹ. Online/Offline chuyển sang icon kèm chữ, bỏ khung badge. Build/TypeScript pass.

## 16/10/2026 — Hình thức học và mentor trong ô lịch

- Thêm Online/Offline theo deliveryMode và icon người kèm mentor.displayName vào ô lịch. Bỏ Sắp diễn ra; giữ trạng thái hủy/đang học/hoàn thành và modal chi tiết. Tên mentor dài được rút gọn trong ô.
- Build/TypeScript và 4 test lịch desktop/mobile pass; đã xem screenshot ô lịch mới.

## 16/10/2026 — Danh sách dạng bảng và lịch gọn mở modal

- Đơn hàng/Khóa học của tôi chuyển sang bảng: mỗi mục một hàng ngắn, thông tin tổng quan và nút Xem chi tiết. Popup hiển thị đầy đủ lớp/giá/trạng thái hoặc metadata khóa học. Đơn CASH cũng xem được chi tiết; payOS chỉ đi trang thanh toán khi người dùng bấm link riêng.
- Ô lịch chỉ giữ giờ, tên khóa học và trạng thái. Bấm ô mở modal Chi tiết lớp học, hiển thị tên/mã lớp, nội dung buổi, học phần, mentor, thời gian đầy đủ, hình thức/phòng và cảnh báo CASH_PREVIEW. Dùng DTO lịch đã tải, không thêm endpoint/meeting URL hoặc tự thay quyền học.
- Dialog chung có focus trap native, Escape/nút đóng, scroll lock và trả focus; bảng cuộn trong vùng riêng trên 320px. Bộ lọc/phân trang giữ nguyên.
- Lint, Prettier, TypeScript/production build và 45 unit tests pass; E2E khu vực user desktop/mobile 14/14 pass. Đã xem screenshot bảng/lịch/modal và kiểm tra hàng gọn, CASH/PAYOS, cancelled, focus, mobile không tràn trang.

## 15/10/2026 — Khu vực user và thời khóa biểu ngang

- Dropdown tài khoản thêm Thông tin cá nhân/Lịch học. Tạo `/user` → profile và bốn trang profile/orders/schedule/courses. Sidebar lấy cấu trúc và kích thước từ nhánh `origin/admin` tại `de14eb0`: 228px, thu gọn 76px, topbar và menu mobile dialog/Escape/focus/scroll lock.
- Profile đọc dữ liệu session thật; orders phân trang/lọc trạng thái qua API có sẵn; courses dùng enrollmentId/current/history/all và access hints. Không tự thêm API chỉnh hồ sơ hoặc dữ liệu demo.
- Lịch 7 cột ngang Thứ 2–Chủ nhật, tuần trước/sau/tuần này/chọn ngày, UTC+7; mobile 320px cuộn trong bảng. Lấy đủ page API, giữ CANCELLED và xử lý buổi qua đêm theo overlap.
- Đã đọc Swagger live docs-json, PHASE_2_3_FLOW, PHASE_2_3_flow-api-breakdown và PHASE_4_API_SUMMARY trong BE/docs/api_flow. Proxy chỉ bổ sung hai GET `/me/classes` và `/me/schedule`, validate range/DTO/query, cookie/private-no-store; AuthGuard chặn guest trước dữ liệu riêng tư.
- ESLint, Prettier, production build/TypeScript pass. Vitest 45/45; Playwright toàn bộ desktop/mobile 113 pass, 3 skip theo nền tảng; gồm 8 lượt user mới. Đã xem ảnh lịch desktop/320px và profile; preview localhost:3003 được khởi động lại với CSS mới, đã xác nhận sidebar grid 228px. Auth/data E2E dùng mock theo contract, chưa đăng nhập tài khoản backend thật.

## 15/10/2026 — Vân mây hero trắng rõ hơn

- Tăng opacity lớp mây từ 40% lên 55%, giữ brightness 50% và screen/grayscale/contrast để mây nổi trắng nhẹ trên nền mint.

## 15/10/2026 — Khôi phục màu mint ban đầu

- Khôi phục mint `#338A85`, forest `#1D5B57` và chữ trắng ở hero/nút mint theo yêu cầu. Giữ chữ đen trong trang chi tiết khóa học.

## 15/10/2026 — Thử palette xanh mới và chữ đen ở chi tiết khóa học

- Đổi token mint sang `#9CD5FF` và forest sang `#355872`, lấy từ hai ảnh tham chiếu người dùng; các nền/viền/màu pha cập nhật qua globals.css. Hero và nút nền xanh nhạt dùng chữ đậm để dễ đọc.
- Chữ nội dung, học phí, nhãn và mô tả trong course detail/popup chuyển đen; giữ nền thương hiệu, SVG và chữ trắng trên nút đậm/coral.
- Production build (kèm TypeScript) và Prettier pass; E2E homepage/courses desktop/mobile 31 pass, 3 skip theo nền tảng. Đã xem ảnh homepage và popup course detail; mobile 320px không tràn ngang.

## 15/10/2026 — Auth guard chuyển về homepage

- Thêm AuthGuard dùng chung ở CommerceShell cho cart, checkout và payment result: kiểm tra/refresh phiên trước khi mount nội dung; chỉ cho STUDENT ACTIVE truy cập. Guest, sai vai trò, tài khoản chưa xác thực/bị khóa chuyển thẳng `/` bằng replace.
- API commerce trả 401/403 cũng chuyển về `/`, không giữ màn hình báo thiếu quyền. Lỗi kết nối cho thử lại, 404 vẫn báo không tìm thấy; login chủ động giữ returnTo hợp lệ. Đăng xuất khỏi checkout ẩn QR và về homepage.
- ESLint, Prettier, type check, production build `.next-auth-guard` và 34 unit tests pass. Playwright desktop/mobile: 105 pass, 3 skip theo nền tảng; gồm 32 lượt kiểm tra auth guard mới, chặn private requests trước khi xác thực, refresh phục hồi phiên, API denial và retry lỗi phiên.

## 15/10/2026 — Kiểm tra phiên ngay khi đăng ký và bỏ CTA thừa

- “Đăng ký học ngay” kiểm tra lại phiên khi bấm: guest thấy popup “Bạn chưa đăng nhập” và “Hãy đăng nhập để có thể đăng ký học ngay bây giờ.”; có Đăng nhập ngay, Để sau, đóng và Escape. Login quay lại khóa học; có phiên mở chọn lớp, không tự thêm giỏ.
- Lỗi đọc phiên có thông báo và cho thử lại; phiên hết hạn được phát hiện ngay cả khi Query từng có user. Dialog khóa cuộn, giữ focus và trả về nút đăng ký khi đóng; responsive 320px.
- Bỏ khối cuối homepage “Sẵn sàng học một điều mới?” và link hero “Thử viết mã nguồn” theo ảnh người dùng. Giữ khu vực thực hành và các luồng còn lại.
- Lint, Prettier, TypeScript qua production build và 34 unit tests pass. E2E courses/home desktop/mobile: 31 pass, 3 skip theo nền tảng; gồm guest → popup → login → quay lại → chọn lớp, phiên lỗi/hết hạn, Escape/focus và 320px. Đã xem screenshot popup desktop/mobile.

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

## 16/10/2026 — Cuộn khi chuyển trang sau đăng nhập

- Khai báo data-scroll-behavior trên html để Next.js tạm tắt cuộn mượt khi chuyển route.
- Bổ sung kiểm tra scrollY = 0 sau đăng nhập về trang chủ; Playwright desktop/mobile 2/2 pass, production build pass.
