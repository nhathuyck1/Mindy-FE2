# Tiến độ

## 28/10/2026 — Đăng xuất mượt, không hiện Session changed trên dashboard

- Menu tài khoản dùng logout mutation có trạng thái điều hướng riêng. Khi bấm, ẩn dashboard ngay và hiện màn trung tính gồm logo/Đang đăng xuất; không hiển thị vòng xoay trên dashboard hoặc thông báo cancellation. Thành công/401 chuyển về trang chủ và dọn dữ liệu riêng tư, giữ màn chuyển tiếp đến khi route hoàn tất.
- Hủy/revert query qua QueryClient trước khi đổi signal phiên và tạm ngừng auth/me khi logout đang chạy. Provider giữ quyền điều hướng sau khi menu unmount; logout sai audience tiếp tục giữ thông báo trên form login. API lỗi phục hồi màn trước, thông báo dễ hiểu và cho thử lại; không tự coi lỗi mạng là đăng xuất thành công.
- Lint/format/TypeScript, production build và 198 unit tests pass. 70 E2E auth/login/guard/refresh/logout cùng 4 E2E logout từ Admin/checkout pass trên desktop/mobile, dùng API mock. Kiểm dashboard còn request đang chờ, màn chuyển tiếp giữ đến response, không lọt Session changed, lỗi 503/thử lại, logout 401 không refresh, và login sai audience sau logout.
- Đã xem ảnh màn chuyển tiếp desktop và mobile 320px, không tràn ngang. Chỉ cập nhật FE2; chưa deploy, commit hoặc push.

## 28/10/2026 — Tự động refresh token cho toàn bộ FE2

- Gom recovery từ useSession/managerRequest về apiRequest chung cho Student, Admin, Manager, Mentor và Files. Sau 401, kiểm auth/me dưới khóa auth chung rồi POST auth/refresh khi cần; Promise dùng chung trong tab, Web Locks phối hợp nhiều tab, replay mỗi request tối đa một lần. Giữ query/body đã serialize/Idempotency-Key và schema Zod; không replay network/timeout/403/409/5xx hoặc signed storage PUT.
- Login/logout/email verify dùng cùng hàng đợi cookie và đổi AbortSignal phiên để chặn kết quả cũ. Hủy caller không hủy rotation chung; khi đã gửi refresh, chờ response/timeout trước khi giải phóng auth lock. Không thêm Axios, timer refresh, raw token trong storage hoặc thay đổi backend/mobile/cookie policy.
- Provider theo dõi session toàn ứng dụng, sở hữu điều hướng hết phiên và dọn cache riêng tư; guard chỉ chặn nội dung. Giữ query session đang được quan sát và để explicit refetch trả null, giữ catalogue, ngăn cleanup ghi đè login mới. Refresh 401/replay vẫn 401 chuyển đúng login Student/staff với returnTo an toàn, toast một lần nếu từng đăng nhập; public ở nguyên. Lỗi refresh tạm thời cho thử lại, 403 giữ xử lý quyền, logout chủ động về trang chủ.
- ESLint, Prettier, TypeScript, production build và **198 unit tests** pass. **62 E2E auth/login/guard/refresh** pass trên desktop/mobile, gồm cookie HttpOnly mới ở replay, hai tab chỉ rotate một lần, hết phiên, lỗi tạm thời và trang public giữ vị trí. Các fixture header cart và Manager dashboard được bổ sung API mock còn thiếu để không rơi xuống backend thật rồi trả 401.
- Lượt E2E mở rộng cuối: **342 pass, 5 skip có chủ đích, 1 ca focus modal Admin bị flaky**; chạy riêng lại ca đó pass. Sáu kịch bản Manager leave (12 biến thể desktop/mobile) được loại riêng khỏi lượt cuối sau khi **tái hiện cả sáu lỗi trên bản HEAD trước thay đổi** trong bản sao tách biệt; không sửa nghiệp vụ/selector của những ca này. Lượt mở rộng dùng `npm run test:e2e -- --workers=4 --grep-invert 'Manager confirms full-day conflicts|Manager can reject a partial-day|Manager can reject a stale-source|Manager must refresh and confirm again|Manager action locks while|Escape restores focus and detail has no horizontal'`.
- Kiểm thử dùng API/storage mock; chưa nghiệm thu phiên thật trên môi trường deploy. Chưa deploy hoặc commit/push. Chỉ thay Mindy-FE2 trong lần triển khai này.

## 26/10/2026 — Tài liệu chuẩn UI theo Student

- Hoàn tất [student-ui-standard.md](student-ui-standard.md) bằng tiếng Việt: bản đồ 5 mục Student và luồng public/auth/cart/payment; quy tắc font, màu, bo góc, kích thước, spacing, bảng/dialog, lịch/học liệu, state, bàn phím và responsive. Có liên kết code, bảng đối chiếu staff, thứ tự áp dụng và checklist nghiệm thu.
- Chốt Nunito cho UI mọi role; ghi rõ hiện staff vẫn dùng Inter/thang chữ riêng, component shared còn khác radius/height/border. Phân biệt hiện trạng, đề xuất chuẩn hóa và ngoại lệ; cập nhật định hướng mới ở ui-rules. Chỉ thay tài liệu và thêm 4 ảnh tham chiếu, không sửa UI, API hay nghiệp vụ.
- Production build pass; 7 suite Playwright liên quan cho 133 pass, 3 skip có chủ đích ở desktop (các ca riêng cho mobile), gồm viewport 320px. Đã xem 4 ảnh mới desktop/mobile từ lượt chạy; phiên/dữ liệu/giao dịch dùng API mock, chưa nghiệm thu backend live. Chi tiết lệnh và giới hạn kiểm chứng ở mục 12 của tài liệu.
- Đo computed style trên production xác nhận font/cỡ chữ/weight, góc nút 6px hiện tại, nav 8px, sidebar 228px và topbar 92px. ESLint, 168 unit tests, Prettier ba tài liệu và kiểm tra liên kết local/reference/anchor pass.

## 23/10/2026 — Manager duyệt đơn xin nghỉ Mentor

- Đã nối proxy/schema cho danh sách, detail, approve/reject và các GET manager bổ trợ. Thêm menu, bảng PENDING ở dashboard, danh sách URL-driven và detail có lịch ảnh hưởng/xung đột phân trang riêng.
- Modal xử lý tải lại detail trước khi xác nhận, giữ version, bắt buộc lý do, yêu cầu manager tick xác nhận xung đột FULL_DAY và chặn duyệt nghỉ theo buổi khi có xung đột. Mutation không tự retry; lỗi mạng/5xx gửi lại cùng key/body; kết quả thành công cập nhật cache.
- Local checks: lint, format:check, type-check và production build pass; 168/168 unit tests pass. Full Playwright desktop/mobile 339 pass, 5 skip; cả 16 E2E luồng xin nghỉ pass, gồm lọc/Back, stale/expired/version conflict, double-click lock, idempotency retry, Escape/focus và viewport 320px.
- Unit/proxy và E2E dùng API mock theo contract; chưa nghiệm thu thao tác thật bằng tài khoản test hoặc xác nhận transaction trên backend live.

## 23/10/2026 — Dashboard chờ duyệt và trang duyệt Manager

- Bổ sung bảng chờ duyệt tại `/manager`, phân trang 20 dòng, làm mới và link đúng ID sang `/manager/materials/:materialId`. Trang chi tiết tái sử dụng nội dung/editor hiện có, có Về tổng quan, hỗ trợ reload/link trực tiếp và safeReturnPath; UUID sai không gửi request.
- Đối chiếu source và Swagger live: API sửa/duyệt/từ chối/xóa đã có và đã nối. Sửa xác nhận nằm cuối bài thành Modal hiện ngay trong viewport, gồm tên/phiên bản, thông báo duyệt đồng thời xuất bản, lý do từ chối bắt buộc và Hủy/Escape trả focus. Thành công cập nhật chi tiết/danh sách/số liệu; xóa từ trang riêng trở về dashboard.
- Chặn gửi trùng, giữ expectedRevision khi mở xác nhận và yêu cầu tải lại sau 409/lỗi mạng trước khi gửi một ý định mới. Chỉnh sửa dùng CKEditor/PATCH hiện có và về DRAFT; bản nháp Mentor chưa đủ điều kiện không hiện nút duyệt. Giữ working tree/CKEditor và không sửa backend/database.
- Local: lint, format:check, TypeScript và production build riêng `.next-manager-review` pass; 162 unit tests và 78 E2E Manager/collections desktop/mobile pass, gồm 320px, viewport hộp thoại, focus, approve/reject/delete, lỗi/thử lại, revision, phân trang, workspace/upload/preview/CKEditor. Bài cuộn cũ chờ font và kết thúc chuyển động trước khi đo, giữ nguyên ngưỡng kiểm tra pixel.
- Ảnh dashboard/trang chi tiết/hộp thoại có trong các thư mục test tương ứng dưới `test-results/` (`manager-review-dashboard.png`, `manager-review-detail.png`, `manager-review-confirmation.png`); bản bàn giao được sao lưu tại `output/manager-review-2026-10-23` ở workspace cha. Mutations được kiểm bằng API mock; chưa nghiệm thu ghi bằng tài khoản thật. Không commit/push/deploy.

## 23/10/2026 — Bỏ phần cuối sidebar ngoài Student

- Bỏ liên kết Xem website và thẻ giới thiệu Mindy trong sidebar Admin, Manager, Mentor. Menu mobile dùng cùng navigation nên cũng bỏ liên kết; giữ nguyên giao diện Student.
- Cập nhật E2E chuyển từ Admin về trang chủ qua lịch sử trình duyệt.
- Kiểm tra local: ESLint các file sửa, TypeScript, Prettier, production build riêng `.next-sidebar-review` và 10 E2E desktop/mobile pass (Admin, Manager, Mentor và hồi quy Student). Đã xem ảnh sidebar Manager; API mock, chưa deploy.

## 23/10/2026 — Hoàn thiện 7 mục FE2 theo API hiện hành

- Manager có dashboard Tổng quan lấy tổng từ API, lọc kho tài liệu đồng bộ URL, điều hướng theo role và nhãn tài liệu nhất quán. Student có đường vào lớp theo quyền/accessMode; lịch phân biệt trạng thái buổi với điểm danh, hỗ trợ mentor nullable và buổi học bù.
- Admin có Lịch sử hoạt động và danh sách Cần đối soát thanh toán chỉ đọc. Proxy chỉ cho GET trên ba endpoint mới; query/response được kiểm bằng Zod, guard ADMIN ACTIVE chặn truy cập và hai màn không gọi mutation.
- Dùng shell, token và component UI hiện có; thêm trạng thái tải/lỗi/rỗng/thử lại, phân trang, modal có quản lý focus và bố cục 320px. Cập nhật `architecture.md`, `api-contracts.md` và `ui-rules.md` theo hành vi mới.
- Kiểm tra local: lint, format:check, TypeScript, 159 unit tests, production build riêng `.next-7-items-review` và 310 E2E desktop/mobile (305 pass, 5 skip có chủ đích). E2E dùng API mock theo contract; chưa kiểm bằng tài khoản thật hoặc xác nhận ghi dữ liệu trên backend. Build không thay thư mục preview đang chạy.
- Ảnh E2E desktop/320px nằm trong `test-results/`: `manager-overview-{desktop,mobile}.png` và ảnh `admin-tracking.png`/`admin-reconciliation.png` trong thư mục kết quả của từng test. Không commit, push hoặc deploy.

## 23/10/2026 — CKEditor cho nội dung học liệu

- Đã tích hợp CKEditor 5 cho tạo/chỉnh sửa ARTICLE ở Manager `/manager/materials` và workspace Mentor; dùng tiếng Việt, toolbar định dạng, bảng, liên kết, mã và nguồn HTML.
- Đã kiểm tra Swagger live/DTO/sanitizer; payload dùng contentHtml, version 1 khi tạo và expectedRevision khi sửa. Thêm validation bài rỗng, giới hạn 48 KiB UTF-8 và khóa lưu khi editor chưa sẵn sàng; giữ HTML, metadata, tệp đính kèm và luồng duyệt hiện có.
- Cấu hình license public qua NEXT_PUBLIC_CKEDITOR_LICENSE_KEY (mặc định GPL); hướng dẫn khóa thương mại và điều kiện sử dụng ở architecture.md/.env.example.
- Kiểm tra hoàn tất: lint, format:check, check:types và production build pass; 156/156 unit tests và 80/80 Playwright tests Manager/Mentor (desktop/mobile, API mock) pass. Đã xem giao diện, kiểm tra editor ở 320px và localhost hiện hữu không có lỗi JavaScript; chưa tạo/sửa dữ liệu kiểm thử trên backend live.

## 22/10/2026 — Làm gọn UI API mới và thêm thanh tiến độ Mentor

- Thu gọn metadata lớp, tab có icon/gạch dưới; timetable/chuyên cần/tiến độ phân cấp heading, bộ lọc, hàng học viên và action rõ hơn. Chuyên cần có thanh rate BE và giữ unknown khác zero.
- Tổng quan học tập có thanh Chương đã có dữ liệu từ counts, không suy thành hoàn thành toàn khóa; chi tiết có bar phần trăm từng chương. Đủ các trạng thái 0%, 60%, 100%, chưa tracking và dữ liệu sai, nhãn tiếng Việt; bỏ tracking jargon khỏi thông báo chính.
- Xin nghỉ tách danh sách và form, ba bước trực quan với aria-current, mapping buổi nghỉ/ngày bù, slot dễ chọn, status badge và lịch gốc/bù trong detail. Bulk và nhật ký buổi học thành nhóm riêng, giữ nghiệp vụ/version/idempotency/scope.
- Lint, TypeScript/production build, 156 unit tests PASS. Toàn bộ 76 Mentor E2E: 74 PASS, 2 skip có chủ đích trong ma trận viewport. Bổ sung kiểm bar 0/60/100/unknown/invalid, độ phủ 4/5 không double-count invalid, không mutation khi đọc và ba bước form/gửi đơn. Đã xem ảnh desktop/320px, kiểm tràn ngang, dùng mock API theo contract; chưa deploy.

## 22/10/2026 — Tích hợp toàn bộ nhóm API Mentor mới

- Đọc lại source BE dev 36753cf, API flow/DTO và đối chiếu endpoint Swagger live. Bổ sung 18 method/path mới dành cho Mentor vào proxy và các màn tiêu thụ; không mở staff approval/correction hoặc Admin tracking.
- Lớp đọc shell/capabilities trước khi mở các tab; có lọc PRIMARY/SUBSTITUTE/ANY, timetable phân trang/range, chuyên cần lớp/học viên và tiến độ lưu sẵn. Mentor dạy thay chỉ xem scope được phân công, không mount roster/report/authoring. Lớp hủy vào lịch sử, lớp hoàn thành vẫn cho sửa notes trong deadline theo BE.
- Buổi học có candidates chỉ đọc trước start, snapshot sau start, bulk có xác nhận toàn roster/mọi trang, guestRecords dùng makeupPlacementId. Sửa link riêng/null fallback với session version. Notes có version riêng, draft giữ sau 409/lỗi tải lại, merge do người dùng quyết định và kiểm deadline lúc submit.
- /mentor/leave-requests: danh sách/bộ lọc, preview, slots, FULL_DAY dayMappings hoặc sessionMappings, tạo/xem chi tiết/rút đơn bằng sourceVersions/expectedVersion/key hiện hành. Không giả giữ slot hoặc áp dụng lịch trước approval.
- Gỡ UnitRelease và route proxy đã bị BE xóa; giữ CRUD/submit/upload/access tài liệu hiện hữu. Giữ cookie HttpOnly, same-origin, strict Zod, Origin, no-store; UUIDv4 key giữ nguyên cho retry cùng request sau lỗi mạng. Không thay BE, không thêm dependency hoặc lưu token/draft trong Web Storage.
- Kiểm chứng local: lint PASS; 156 unit tests PASS; production build + TypeScript PASS. Ma trận Mentor desktop/mobile 66 PASS + 2 skip có chủ đích (hai test ma trận responsive tự chạy viewport); sau bổ sung case cancelled/completed và điều chỉnh guard, chạy lại 16 tests liên quan PASS, gồm 4 case mới. Tổng 70 scenario riêng biệt đã PASS, 2 skip. Kiểm ảnh 320px/desktop, ô ngày/buổi không chồng nhau; kiểm cả hồi quy material/upload/phân trang và lịch tuần.
- Prettier các tệp thay đổi PASS; git diff --check PASS. Format toàn repo chưa PASS: 250 tệp có sẵn ngoài phạm vi dùng định dạng/line ending khác; không format lại các feature không liên quan. Các marker merge trong phần lịch sử progress đã có từ trước, giữ nguyên nội dung.
- E2E dùng API/storage mock theo contract; chưa nghiệm thu thao tác ghi bằng tài khoản thật hoặc deploy FE. Swagger live chỉ xác nhận endpoint hiện diện.

## 22/10/2026 — Khôi phục danh sách buổi học theo API workspace Mentor

- Nguyên nhân: BE mới trả sessions rỗng trong chi tiết chương cho Mentor; FE vẫn dùng mảng này nên báo chưa có buổi và chuyển nội dung đã gắn buổi sang nhóm chưa xác định. Đã xác minh source BE và sự tồn tại/DTO của endpoint workspace trên Swagger live.
- FE chuyển sang hai endpoint buổi được cấp quyền: danh sách theo chương để lấy số buổi và timetable lớp có unitId để lấy lịch/quyền, ghép theo ID sau khi tải đủ trang. Không dùng khoảng tuần hiện tại, không sửa BE hay dữ liệu buổi. Lỗi/thiếu trang/sai scope phải thử lại, không hiển thị danh sách rỗng giả.
- Giữ một nút Thêm nội dung ở đầu chương, chọn buổi trong editor; link Điểm danh theo capabilities.readSessionContext. Fixture chi tiết chương đổi thành sessions rỗng đúng BE để bắt lỗi hồi quy.
- Local: production build/TypeScript, ESLint/Prettier file sửa, 15 unit/adapter tests và 10 E2E desktop/mobile pass. Đã xem ảnh hai kích thước, kiểm 320px, chọn/gắn buổi, đổi chương, tải thiếu trang và loading chung bằng API mock. Chưa nghiệm thu với phiên Mentor thật hoặc deploy frontend.

## 22/10/2026 — Sắp xếp nội dung theo buổi học cho Mentor

- Thay dãy nút tài liệu ngang và danh sách buổi tách rời bằng cấu trúc Chương → Buổi học → Nội dung. Mỗi buổi có lịch, trạng thái, danh sách bài viết/tài liệu/video và thao tác thêm/điểm danh; chưa gắn buổi và liên kết buổi không xác định hiển thị riêng.
- Thêm từ buổi tự chọn sessionId tương ứng trên form, lưu xong mở nội dung vừa tạo; quay lại danh sách thấy đúng nhóm. Giữ quyền sửa bản nháp, gửi duyệt, upload đã kiểm tra và signed access. Lấy đủ trang API trước khi gom nhóm; không thêm API hoặc loại bài tập chưa được hỗ trợ.
- Local: build/TypeScript, ESLint/Prettier, 144 unit tests và 44 E2E liên quan pass; 2 lượt mobile được skip chủ động vì hai ca responsive tự chạy ma trận viewport desktop/tablet/mobile. Đã xem ảnh desktop/mobile, kiểm tra 320px, bộ lọc, liên kết buổi không xác định, tạo đúng sessionId và thử lại khi trang API sau lỗi; chưa deploy.

## 22/10/2026 — Làm lại thẻ tệp đính kèm Mentor

- Thẻ gọn với biểu tượng mint, tên tệp 16px, nhãn loại tệp và dung lượng dễ đọc; thêm số tệp cạnh tiêu đề. Nút Xem / tải tệp đặt bên phải trên desktop, xuống hàng đầy đủ chiều rộng trên mobile.
- Giữ luồng lấy quyền xem khi nhấn, kiểm tra file/revision, hủy request và hết hạn liên kết; trình xem và liên kết mở tab mới vẫn hoạt động.
- Local: build/TypeScript, ESLint/Prettier và 4 E2E desktop/mobile pass cho tệp đính kèm đã lưu và upload tệp chính. Đã xem ảnh desktop/mobile; chưa deploy.

## 22/10/2026 — Chặn lịch quá khứ ở tạo chương và quyền truy cập

- Thêm min UTC+7 cho Khả dụng từ khi tạo mới và Thời điểm mở khi hẹn giờ quyền truy cập. Mốc phút cập nhật khi mở ô chọn; kiểm tra lại tại submit và không gửi mutation nếu thời gian đã qua.
- Không thay dữ liệu cũ của bản nháp, không bắt buộc Khả dụng từ; giữ Mở ngay/Khóa chương và payload API hiện có. Test thời gian qua nửa đêm và form để lâu trước khi lưu.
- Local: build/TypeScript, lint/format, 144 unit tests và 10 E2E desktop/mobile pass (4 ca thời gian mới, 6 ca hồi quy tạo/sửa/gắn buổi/quyền truy cập). Kiểm min UTC+7, quá khứ nhập tay, lịch đã trôi qua trong lúc sửa và payload thời gian tương lai; chưa deploy.

## 22/10/2026 — Bỏ nút Xem buổi học ở tài liệu

- Gỡ nút Xem buổi học khỏi khối buổi học của tài liệu, giữ tên/số/lịch buổi và chức năng gắn buổi cho bản nháp. Không chừa cột thao tác rỗng khi đã gắn thành công.
- Cập nhật E2E hiển thị/gắn buổi để bỏ bước điều hướng qua nút đã xóa.
- Local: lint/format, production build/TypeScript và 2 E2E gắn/hiển thị buổi học desktop/mobile pass. Chưa deploy.

## 22/10/2026 — Bỏ xác nhận chuyển sang Văn bản

- Xóa khung cảnh báo và hai nút xác nhận/giữ định dạng. Bấm Văn bản chuyển trực tiếp nội dung HTML thành chữ, giữ xuống dòng theo logic chuyển đổi hiện có; bỏ state xác nhận. Không tự lưu hoặc đổi API.
- Cập nhật E2E workspace để kiểm tra nội dung văn bản ngay sau một lần bấm Văn bản.
- Local: lint/format, production build/TypeScript và 2 E2E workspace desktop/mobile pass; chuyển trực tiếp vẫn giữ phần chữ. Chưa deploy.

## 22/10/2026 — Hiện buổi học của tài liệu Mentor

- Phần chi tiết trước đây không trình bày sessionId nên không biết tài liệu áp dụng cho buổi nào. Đưa tên/loại/trạng thái vào header và thêm khối buổi học gần tiêu đề, có tên, số buổi, lịch và nút mở buổi học/điểm danh.
- Chưa gắn thì thông báo rõ và cho tác giả còn quyền sửa mở form Gắn buổi học. Dùng API và sessionId hiện có; chia sẻ query chi tiết chương với danh sách buổi phía dưới, không tạo thêm loading hay tự gán dữ liệu.
- Local: build/TypeScript, ESLint/format file sửa và 144 unit tests pass. E2E liên quan 34 pass gộp lượt tổng hợp và lượt chạy lại 2 ca mới; 2 bản mobile của ma trận responsive skip có chủ đích. Test mới kiểm chưa gắn→chọn buổi→lưu→reload, payload sessionId, link điểm danh và 320px. Đã xem ảnh desktop; dữ liệu mock, chưa deploy.

## 22/10/2026 — Căn giữa tiêu đề Điểm danh

- Căn chữ Điểm danh theo tâm cụm hai nút rộng 220px bên dưới, giữ vị trí cụm nút và các cột còn lại.
- Local: lint/format, production build/TypeScript và 2 E2E điểm danh desktop/mobile pass. Chưa deploy.

## 22/10/2026 — Bỏ loading trùng ở Mentor

- Gộp context/attendance của trang buổi học vào một loading/error boundary, giữ hai request song song và retry cả hai. Không thay API, quyền hoặc mutation điểm danh.
- Rà soát schedule/classes/auth/route: các vùng chính đã chỉ có một loading. Workspace chương bỏ loading phụ của danh sách buổi học và không chồng loading danh sách với form editor.
- Local: production build/TypeScript, ESLint/format file sửa, 144 unit tests và 32 E2E Mentor pass; 2 bản mobile của ma trận responsive skip có chủ đích. Test mới giữ request chậm và đổi thứ tự context/attendance, lỗi/retry, mở editor khi danh sách còn tải; xác nhận chỉ một loading trên desktop/mobile. Giữ test lịch tuần cũ ngoài lượt chạy như các lần trước. API mock, chưa deploy.

## 22/10/2026 — Làm lại cụm nút và viền thống kê vắng

- Gom Có mặt/Vắng thành cụm chọn hai phần bằng nhau, nền nhẹ và góc bo đồng bộ. Lựa chọn hiện tại dùng nền trắng, chữ đậm có màu và viền nhẹ để tránh chữ trắng bị chìm; trạng thái bị khóa vẫn đọc rõ. Giữ căn trái, thao tác và quyền API.
- Viền thống kê Vắng mặt chỉ đỏ khi có ít nhất một học viên vắng, trở về viền thường khi số vắng bằng 0.
- Local: ESLint/format file sửa, production build/TypeScript và 4 E2E điểm danh desktop/mobile pass; kiểm số vắng 0→1→0, payload/phiên bản, quyền, bàn phím và 320px không tràn. Đã xem ảnh cả hai trạng thái, API dùng mock; chưa deploy.

## 22/10/2026 — Căn trái nút điểm danh

- Hai nút Có mặt/Vắng cùng kích thước 104×44px, căn trái trong ô. Tăng cột Điểm danh 32px để cụm nút dịch trái và có khoảng đệm bên phải; giữ trạng thái đủ chỗ và căn trái cả trên thẻ mobile.
- Local: lint/format file sửa, production build/TypeScript và 2 E2E điểm danh desktop/mobile pass, gồm 320px không tràn. Chưa deploy.

## 22/10/2026 — Bỏ ghi chú điểm danh theo yêu cầu mới

- Xóa cột/ô ghi chú, trạng thái bản nháp, callback lưu và contract ghi chú. Gỡ mã backend, migration chưa chạy và các test dành riêng cho note; giữ API điểm danh gốc.
- Giữ hai nút Có mặt/Vắng và viền đỏ của thẻ Vắng mặt, bố cục bảng ba cột/thẻ mobile. Không cần cập nhật backend hoặc migration mới để dùng hai nút.
- Local: build/TypeScript FE và BE, lint/format file sửa, 144 unit tests FE và 4 E2E attendance desktop/mobile pass. Kiểm ba cột, chuyển Có mặt/Vắng, tải lại trạng thái, payload chỉ có enrollmentId/status và 320px. Không còn mã/migration ghi chú trong source hoặc backend build; chưa deploy.

## 22/10/2026 — Ẩn thanh cuộn trong khung nội dung Mentor

- Áp dụng utility scrollbar-hidden hiện có vào đúng body cuộn của MentorMaterials, gồm form upload/chỉnh sửa embedded. Giữ overflow-y-auto, focus bàn phím và overscroll containment để vẫn xem/lưu được nội dung cuối khung.
- Chỉ thay hiển thị thanh cuộn trong panel Mentor, không đổi API hoặc logic upload.
- Local: ESLint/format file sửa, production build/TypeScript và 2 E2E responsive hiện có pass; kiểm 320–1440px, giữ draft khi resize và cuộn bằng bàn phím đến cuối khung. Chưa deploy.

## 22/10/2026 — Hai nút điểm danh

- Thay checkbox bằng hai nút Có mặt/Vắng, trạng thái chọn có aria-pressed và màu xanh/đỏ. Thẻ thống kê Vắng mặt có viền đỏ cả khi bằng 0.
- Phần ghi chú từng được chuẩn bị đã hủy theo yêu cầu tiếp theo; API và migration ghi chú chưa được deploy/chạy trên dữ liệu thật.

## 22/10/2026 — Upload tài liệu Mentor theo ảnh tham chiếu

- Thay ô file native bằng vùng kéo thả/nhấn chọn màu mint và thẻ tên tệp/dung lượng. READY hiện xanh, thất bại hiện đỏ và Thử lại; đang gửi/kiểm tra có spinner, hủy hiện trung tính. Dùng cùng thẻ cho file chính và attachments, bỏ tên tệp chính bị lặp.
- Thay file xóa lựa chọn cũ trước khi tải; lỗi/hủy không thể lưu lại fileId cũ. Giữ nguyên Files API, polling, khóa form và giới hạn dung lượng; VIDEO chỉ thành công khi kind đúng.
- Production build/TypeScript, ESLint/format các file sửa và 24 E2E liên quan pass (2 bản mobile của ma trận responsive skip có chủ đích). Kiểm chính xác READY trước xanh, thay file lỗi/không lưu nhầm, retry, kéo thả, hủy, attachments/bỏ tệp và 320px. Test responsive được cập nhật để chỉ đo control đang hiển thị sau khi file input native chuyển sang hidden.
- Đã xem ảnh upload thành công/thất bại trên desktop/mobile; dữ liệu API/storage dùng mock. Chưa deploy.

## 22/10/2026 — Làm lại giao diện điểm danh Mentor

- Tăng tên học viên lên 20px, trạng thái/header/nội dung phụ 16px, thêm avatar và khoảng đệm hàng. Bảng có header nền nhẹ, phân cách rõ, trạng thái kèm icon/màu và checkbox 24px trong vùng bấm 44px. Sắp xếp lại thông tin buổi, thống kê và hạn sửa.
- Tách MentorAttendanceRoster chỉ lo trình bày, chuyển sang thẻ khi vùng danh sách dưới 768px; giữ tên và trạng thái dễ đọc ở 320px. Không thay query, phiên bản, khóa idempotency hoặc quyền điểm danh; không ghi dữ liệu thật.
- Build/TypeScript, ESLint/format các file sửa, 144 unit tests và 20 E2E Mentor desktop/mobile liên quan pass (2 bản mobile của ma trận responsive skip có chủ đích). Test vòng đời điểm danh vào thẳng trang buổi học, kiểm đủ năm mutation, font tên, bàn phím Space và 320px. Hai lượt test lịch tuần cũ lệch mã lớp/tên buổi học nằm ngoài lần kiểm này.
- Đã xem ảnh desktop và 320px từ production build dùng API mock. Chưa deploy.

## 22/10/2026 — Sửa responsive khu vực chương và học liệu Mentor

- Theo phản hồi tiếp theo, đổi nhãn tab Chương & học liệu thành Chương; cập nhật selector E2E tương ứng.
- Phản hồi mới nhất: thay toàn bộ từ học liệu bằng chương trong nhãn Mentor, gồm nút tạo, bộ lọc, form, mô tả, thông báo và accessible labels. Đồng bộ selector E2E; giữ nguyên API và dữ liệu.
- Mở rộng bộ lọc trạng thái học liệu tối đa 384px, đưa sang góc phải phía trên nội dung và bỏ truncate; màn nhỏ dùng đủ chiều rộng panel.
- Theo ảnh tiếp theo, căn bộ lọc trạng thái chương và nút chọn nội dung trên cùng hàng, cao 48px; panel hẹp tự chia hàng để giữ nhãn bộ lọc đầy đủ.
- Điều chỉnh mới nhất: thu chiều rộng bộ lọc trạng thái còn 240px, giữ chiều cao và vị trí bên phải.
- Khi chưa có nội dung, thông báo rỗng xuống hàng riêng bên dưới bộ lọc, chiếm đủ chiều ngang panel.
- Khắc phục màn 1009px xếp toàn bộ danh sách chương lên trên học liệu: bố cục theo container 768px, hai cột khi đủ chỗ; màn hẹp dùng ô chọn chương và trạng thái. Khung rộng có hai vùng cuộn độc lập, giữ header/thao tác.
- Bộ lọc và ô chọn vừa panel, tên dài được ngắt dòng, rail học liệu cuộn ngang. Form dùng container riêng cho nhóm thứ tự/ngày và cho hàng nút xuống dòng. Giữ nguyên chương/nội dung đang soạn khi resize, giữ các luồng tạo/sửa/upload/release và quyền hiện có.
- ESLint toàn repo, format các file code/test sửa, production build/TypeScript và 144 unit tests pass. E2E responsive và lớp/học liệu Mentor: 18 pass, 2 bản chạy mobile được bỏ qua vì hai test mới tự chạy ma trận viewport. Đã kiểm 320/390/768/834/1009/1024/1280/1440px và 1009x600, cuộn bằng bàn phím và giữ draft; xem ảnh 1009px/390px/form 320px từ production build.
- Chạy toàn bộ Mentor cho 18 pass, 2 skip và 4 fail thuộc hai scenario lịch cũ đã ghi ngày 16/10: assertion tên buổi học/mẫu lịch không còn khớp UI mã lớp. Không sửa lịch trong lượt này. API dùng mock; chưa deploy lên Vercel.

<<<<<<< Updated upstream

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
  \=======

## 20/10/2026 — Đồng bộ font trang login admin

- Trang `/admin/login` dùng Nunito Variable giống `/login` qua token `font-brand` dùng chung; giữ bố cục, cỡ chữ và luồng đăng nhập hiện có. Các trang quản trị còn lại vẫn dùng Inter.
- Kiểm tra font thực tế trên trình duyệt: tiêu đề, mô tả, nhãn, input và nút admin đều dùng Nunito như trang user; không tràn ngang desktop. ESLint trang login và Prettier các file thay đổi pass.

> > > > > > > Stashed changes

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
