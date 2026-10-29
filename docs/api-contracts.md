# API catalog, lớp học và tài khoản

## Phục hồi phiên trên frontend — cập nhật 28/10/2026

- HTTP client chung áp dụng cho API cần access cookie của mọi role. Backend đang trả 401 `AUTHENTICATION_REQUIRED` cho cookie thiếu/hết hạn/không hợp lệ; FE không giả định có mã `ACCESS_TOKEN_EXPIRED`.
- Sau 401: chờ khóa auth chung → GET `/auth/me` trực tiếp → nếu còn 401 thì POST `/auth/refresh` trực tiếp → retry request gốc một lần. Browser luôn gọi same-origin `/api/v1`, credentials same-origin và cache no-store; refresh giữ contract `{user, accessTokenExpiresAt}` cùng cookie qua adapter hiện hữu.
- Login/register/email verify/logout/refresh và GET catalogue không tự recovery. Request bị 403/409/5xx, timeout hoặc mất mạng không tự replay; signed storage PUT không tham gia cơ chế này. Retry sau 401 giữ body đã serialize và Idempotency-Key ban đầu.
- Refresh 401 hoặc retry vẫn 401 kết thúc phiên phía FE, dọn cache riêng tư và chuyển trang được bảo vệ về login theo khu vực với returnTo an toàn. Trang công khai giữ nguyên. Guest không bị báo hết phiên; lỗi refresh mạng/timeout/5xx cho thử lại. 403 không xóa phiên hoặc gọi refresh.
- Web Locks phối hợp rotation giữa các tab khi có hỗ trợ; fallback gom Promise trong từng tab. Không thay cookie name/path, thời hạn token, API backend hay đưa token vào JSON/store/Web Storage.

## Manager duyệt đơn xin nghỉ Mentor — 23/10/2026

Đã đối chiếu contract Manager leave trong FE2 với backend/Swagger. Response là JSON trực tiếp, không bọc `data`.

- `GET /management/mentor-leave-requests` nhận `page`, `pageSize`, `status`, `mentorId`; `GET /management/mentor-leave-requests/:requestId` nhận `page`, `pageSize` và trả phiên bản, hạn xử lý, lịch bị ảnh hưởng, `sourcesCurrent`, số lượng/danh sách xung đột và phản hồi.
- `POST .../:requestId/approve` gửi `{expectedVersion, reason, acknowledgeStudentConflicts}`; `POST .../:requestId/reject` gửi `{expectedVersion, reason}`. Cả hai yêu cầu `Idempotency-Key` UUIDv4. Approve trả đơn, buổi thay thế, ngày kết thúc lớp mới và số xung đột đã xác nhận; reject trả đơn đã xử lý.
- Proxy dùng schema strict cho query/body, kiểm UUID route, cookie `access_token`, Origin cùng `private, no-store`; chỉ chuyển `Idempotency-Key` cho rule đã đánh dấu idempotent. GET bổ trợ lấy mentor, học viên, lớp theo ID và tìm mentor để lọc.
- Chỉ cho approve đơn PENDING còn hạn, nguồn hiện hành; FULL_DAY có xung đột phải gửi xác nhận chủ động. Đơn theo buổi có xung đột bị chặn duyệt. Reject giữ nguyên lịch. Backend sở hữu transaction, hủy buổi gốc, tạo buổi bù, extension, khoảng nghỉ và audit.

## Dashboard và duyệt tài liệu Manager — 23/10/2026

Đã xác nhận controller/DTO/policy backend và Swagger live `/docs-json`. Các API duyệt đã có trong proxy; lượt này sửa cách xác nhận và bổ sung consumer dashboard/trang chi tiết, không thêm endpoint backend.

- Hàng chờ dùng GET `/manager/materials?reviewStatus=PENDING_REVIEW&page=...&pageSize=20`, phân trang/thứ tự từ backend; cột thời gian dùng updatedAt, không coi là thời điểm gửi duyệt. Chi tiết GET `/manager/materials/:id`; UUID sai không mount query.
- Chỉnh sửa lưu PATCH `/manager/materials/:id` cùng expectedRevision; backend tăng revision, về DRAFT và hủy approval/publication. Không giữ thao tác duyệt cho bản nháp Mentor chưa từng được duyệt và chưa gửi lại.
- Duyệt POST `/manager/materials/:id/approve` gửi `{expectedRevision}` và đồng thời xuất bản. Yêu cầu chỉnh sửa POST `.../reject` gửi `{expectedRevision,reason}` với reason trim không rỗng, tối đa 2000 ký tự. Xóa DELETE `/manager/materials/:id?expectedRevision=...` không có body, thành công 204.
- Hộp thoại giữ phiên bản khi mở, chặn gửi trùng; 409 hoặc lỗi mạng không tự replay. Người dùng phải tải lại và kiểm tra trước khi mở xác nhận mới. Thành công invalidate query Manager (chi tiết/danh sách/số liệu); same-origin, Origin, cookie HttpOnly, Zod và private/no-store giữ nguyên.

## Học liệu CKEditor — 23/10/2026

Đã đối chiếu Swagger live `https://api.quanh123.id.vn/docs-json` với DTO/controller và sanitizer trong backend local. Không cần sửa backend cho CKEditor.

- Manager tạo bằng POST `/manager/course-units/:courseUnitId/materials`, sửa bằng PATCH `/manager/materials/:materialId`.
- Mentor tạo bằng POST `/mentor/classes/:classId/units/:unitId/materials`, sửa bằng PATCH `/mentor/classes/:classId/materials/:materialId`.
- Tạo bài gửi `contentType: ARTICLE`, `title`, `contentHtml`, `contentSchemaVersion: 1` và metadata/attachmentFileIds. Sửa gửi `expectedRevision` đã đọc cùng HTML/metadata; không gửi contentType/contentSchemaVersion trong PATCH. Frontend mới chỉ dùng contentHtml, không gửi đồng thời contentText hoặc fileId cho ARTICLE.
- Giới hạn HTML là 49.152 bytes UTF-8 (bao gồm markup), backend làm sạch theo allowlist và lưu canonical HTML. Giữ `<img data-file-id="UUIDv4" alt="…">` cho ảnh đã upload; URL storage/base64 không thuộc contract. Màu, font, căn lề, embed không được bật vì backend loại các style/thuộc tính này.
- Lưu chỉnh sửa trở về DRAFT; duyệt/gửi duyệt và publication tiếp tục dùng workflow/revision hiện hữu. Kiểm thử mutations dùng API mock theo contract, không tạo dữ liệu kiểm thử vào backend live.

## Toàn bộ API Mentor — 22/10/2026

Đối chiếu source BE dev 36753cf, docs/api_flow Phase 4.4 mục 19, Phase 4.6, ATTENDANCE_BULK, MENTOR_SESSION_MEETING, CLASS_UNIT_ACCESS và Swagger live /docs-json ngày 22/10. Ghi chú này thay contract Mentor/release cũ phía dưới; Swagger presence không thay nghiệm thu bằng tài khoản thật.

- Lớp: GET mentor/classes thêm assignment ANY/PRIMARY/SUBSTITUTE (mặc định ANY), assignmentType PRIMARY/SUBSTITUTE/BOTH và accessScope CLASS/SESSION. GET mentor/classes/:classId cấp shell/capabilities/counts/readonly; UI chỉ mount roster/reports/authoring trong quyền. GET :classId/sessions phân trang, unitId tùy chọn, from/to phải đi cùng và tối đa 93 ngày, không có giới hạn tuần mặc định.
- Chuyên cần: GET :classId/attendance-summary; GET :classId/students/:studentId/attendance và attendance-summary. Class rows theo enrollment; student summary là STUDENT_CLASS_HISTORY. Dùng rate từ BE, null giữ Chưa có dữ liệu, phân biệt physical attendance với makeup credit.
- Tiến độ: GET :classId/progress (optional unitId) và :classId/students/:studentId/progress. Chỉ đọc tracking lưu sẵn; UNTRACKED/null khác STORED zero, INVALID_PERCENT hiển thị cần kiểm tra. Không tạo completion write, phần trăm toàn khóa hay assignment counts.
- Buổi: trước start dùng GET class-sessions/:sessionId/attendance-candidates, provisional=true. Sau start dùng snapshot attendance. PUT attendance/bulk gửi expectedVersion/checked, áp dụng toàn roster regular+guest qua mọi trang; false=ABSENT. PUT attendance cho một guest gửi records:[] và guestRecords:[{makeupPlacementId,status}], không dùng enrollmentId thay placement.
- PATCH mentor/class-sessions/:sessionId/meeting-url gửi expectedVersion/meetingUrl; null xóa override. GET/PUT class-sessions/:sessionId/teaching-notes gửi expectedVersion/content/nextSteps; note version độc lập session. Draft giữ trong form, conflict tải bản máy chủ để người dùng quyết định; không autosave/overwrite. Deadline được kiểm lại khi submit.
- Xin nghỉ: POST mentor/leave-requests/preview, POST makeup-slots, POST/GET mentor/leave-requests, GET :requestId và POST :requestId/withdraw. FULL_DAY dùng dayMappings; nghỉ theo buổi dùng sessionMappings từ slot. sourceVersions lấy preview; ngày và period theo timeZone của BE. Preview/slots không giữ chỗ. Tạo/rút không thay lịch; duyệt thuộc staff.
- Cookie access_token qua same-origin proxy, JSON DTO trực tiếp, Zod request/response strict, no-store. Notes/bulk/create/withdraw/start/mark/sync/finalize dùng UUIDv4 Idempotency-Key; lỗi mạng giữ cùng key/body cho retry của cùng ý định. 409 business không tự retry. Notes body được nhận tối đa 64 KiB UTF-8 như BE. GET không ghi dữ liệu.
- Đã bỏ proxy và UI PATCH mentor/classes/:classId/units/:unitId/release. Không dùng LOCKED/unlockAt để chặn nội dung mentor; material availableAt/publication và enrollment student vẫn do BE kiểm. Các route staff/admin và proposal Phase 5 nằm ngoài integration Mentor này.

## Manager thu tiền thật — 16/10/2026

Đã đọc BE Phase 2.3/2.4 api_flow, CashPaymentsController/Service, ManagerOperations DTO/service và Swagger live /docs-json?scope=cash-collection, /docs-json?scope=finance-contract. Swagger có GET manager/orders, order detail, classes và POST cash confirm; không chỉ dựa trên plan local.

- GET /manager/orders: page/pageSize (1..100), paymentType CASH/PAYOS, status PENDING/PAID/EXPIRED/CANCELLED, classId UUID, orderCode exact 1..50. UI thu tiền cố định paymentType=CASH, mặc định PENDING; filter/search chạy server và đặt lại trang. List trả ManagerOrdersPageDto với student {id,displayName}, payment summary nullable. Các ô thống kê đếm total từ API PENDING/PAID và list đang lọc, không tính tổng doanh thu giả.
- GET /manager/orders/:id: ManagerOrderDetailDto = OrderDto + student/payment; hiển thị tất cả snapshot lớp và tổng cả đơn. Không dùng GET /me/orders của Student. Signed/private fields không được đưa vào DTO UI; payment giữ id/orderId/amount/status/paidAt/confirmedBy/review.
- GET /manager/classes: dùng page/pageSize/status subset để lấy đủ các trang cho bộ lọc lớp. Có guard MANAGER ACTIVE ở shell và query, query key theo user; access cookie/no-store tại proxy và quyền cuối ở BE.
- POST /manager/cash-orders/:orderId/confirm: body duy nhất {receivedAmount:number}, số nguyên 1..MAX_SAFE_INTEGER, bằng toàn bộ totalAmount. Không cần Idempotency-Key. Response OrderDto CASH/PAID/paidAt cùng order ID; UI chỉ báo thành công sau response hợp lệ. Không checkout hay tạo đơn mới/phiếu tùy ý; một đơn nhiều lớp xác nhận một lần, không dùng classAmount.
- Dialog yêu cầu xem toàn bộ lớp, nhập tiền đã nhận và xác nhận đã nhận đủ. Khóa đơn quá hạn/đã PAID/PAYOS/review. 409/403/mất response không tự replay lệnh xác nhận; invalidate list/count/detail và đọc lại trạng thái. Cần Kiểm tra lại đơn trước khi thử lại sau lỗi chưa xác định; 401 dùng cơ chế khôi phục phiên hiện có, chỉ replay sau explicit 401.
- Proxy chỉ mở các route/method nêu trên, strict body/query, không duplicate params; giữ đóng GET manager/cash-orders, payments/finance summary và mentor cash khi chưa có consumer. Mutation kiểm Origin, chỉ chuyển access_token; response detail/confirm kiểm cùng path ID.
- Phiếu cũ localStorage được giữ nguyên theo tài khoản, đọc/xuất qua Phiếu cũ trên thiết bị; không tự import hoặc cộng vào đơn máy chủ, không tạo/ghi nhận phiếu cục bộ mới trên màn thu tiền.
- Tests dùng dữ liệu mô phỏng, chưa xác nhận tiền thật. Swagger presence không thay nghiệm thu phiên Manager và settlement thật.

## Mentor authoring — cập nhật 16/10/2026

Đã đối chiếu BE PHASE_3_3_flow-api-breakdown.md, controller/DTO và Swagger live https://api.quanh123.id.vn/docs-json trong lượt này.

- GET /mentor/classes/:classId/units/:unitId: ClassUnitManagementDto không có classId, có courseUnitId/position/title/status/unlockAt/sessions. BE hiện trả `sessions: []` cho Mentor theo phân quyền workspace; không dùng mảng này để kết luận chương chưa có buổi.
- Cập nhật 22/10/2026, đã đối chiếu source BE và Swagger live `/docs-json`: workspace lấy đủ trang GET `/mentor/classes/:classId/units/:unitId/sessions` để có id/classUnitId/title/sessionNumber/status; ghép theo ID với GET `/mentor/classes/:classId/sessions?unitId=:unitId&page=1&pageSize=100` để có startsAt/endsAt và capabilities.readSessionContext. Endpoint thứ hai không có khoảng tuần mặc định, không trả số buổi/phòng/meetingUrl. Proxy mở GET timetable với unitId UUID tùy chọn; màn chương luôn gửi unitId, page/pageSize 1..100; chỉ chuyển access cookie, private/no-store và giữ 403/404 từ BE. Hai nguồn phải tải đủ, không trùng ID và đúng lớp/chương; lỗi hoặc thiếu nguồn hiển thị Thử lại, không báo giả Chưa có buổi học. Query key có user/class/unit, giữ invalidate Mentor sau mutation. Editor tiếp tục dùng GET sessions phân trang để chọn buổi.
- GET /mentor/classes/:classId/materials/:materialId/preview và GET .../assets/:fileId/access: query expectedRevision bắt buộc 1..2147483647, strict/no duplicates; file access DTO có revision. Chỉ gọi khi người dùng mở file, đối chiếu materialId/fileId/revision; URL giữ trong component memory, hủy khi unmount, hết hạn phải xin lại. POST files/access hiện có được giữ tương thích.
- Create/PATCH Mentor nhận contentText như Create/PatchManagerMaterialDto: ARTICLE chọn duy nhất contentText hoặc contentHtml; text không trắng, tối đa 48 KiB UTF-8, BE escape và lưu canonical contentHtml. FILE/VIDEO không gửi text/HTML; fileId phải READY. Body Mentor tối đa 64 KiB UTF-8. PATCH giữ expectedRevision của lần mở editor, 409 giữ nội dung chưa lưu và refetch, không tự rebase/retry.
- Mentor chỉ sửa own never-approved DRAFT/REJECTED theo canEdit; mở khóa chương không tự duyệt/phát hành Material. Tạo mới đưa người dùng về học liệu vừa lưu; bộ lọc/phân trang được đặt lại.
- Swagger xác nhận endpoint đã có trên server; tests dữ liệu riêng tư dùng mock, chưa chứng minh phiên Mentor và binary storage thực tế.

## Manager materials và thu tiền cục bộ — 16/10/2026

Đọc `API_CONTRACT_FE.md` do người dùng cung cấp (16/10/2026, §15–17/20.4/22) và xác nhận các route manager/files trong Swagger live `/docs-json`. Source BE local cũ chưa có đầy đủ controller manager; dùng hợp đồng tổng hợp và Swagger đang triển khai. Chưa nghiệm thu mutation/storage bằng tài khoản thật.

- GET `/manager/materials`: page/pageSize, reviewStatus, contentType, courseUnitId; GET/POST `/manager/course-units/:courseUnitId/materials`: danh sách/tạo; GET/PATCH/DELETE `/manager/materials/:id`: chi tiết/sửa/xóa.
- POST `/manager/materials/:id/approve|reject|publish|unpublish`: expectedRevision; reject thêm reason trim 1–2000 ký tự. DELETE lấy expectedRevision từ query. Không tự duyệt revision mới sau 409; editor giữ revision từ detail đã mở.
- POST `/manager/materials/:id/files/:fileId/access`: không body; kiểm materialId/fileId/revision/expiry trước khi hiện URL. URL chỉ HTTP(S), không userinfo; không vào Query cache/Web Storage. Primary PDF/audio/video có preview và liên kết tab mới.
- Files: upload-intents → PUT raw File trực tiếp storage với credentials omit và nguyên requiredHeaders → complete với `{}` sau PUT thành công → tối đa 6 GET tự động sau 3/5/10/15/20/30 giây, không chồng request. Dừng READY/FAILED/DELETED/unmount/tab ẩn; còn PROCESSING thì giữ file và chuyển sang kiểm tra thủ công, mỗi lần bấm chỉ GET một lần, không tạo intent/PUT/complete mới. Manager chỉ gửi courseUnitId; DTO chung vẫn nhận đủ cặp classId/classUnitId cho Mentor. originalFilename lấy nguyên file.name, declaredSizeBytes lấy file.size theo bytes; không gửi kind. MIME dùng file.type nếu thuộc allowlist ứng với đuôi file; rỗng/sai thì fallback theo extension từ BE `file-upload-policy.ts` (gồm nhóm text/source chấp nhận chung 7 MIME). Giới hạn 25 MiB và MP4 200 MiB; chỉ READY đúng Course Unit và kind do BE trả mới gắn vào Material.
- Manager body tối đa 64 KiB tính byte UTF-8; query strict, UUID, cookie access_token, Origin và private/no-store giữ qua adapter. Backend quyết định quyền cuối. Không gọi preview cũ, thu tiền Manager hoặc route planned.
- Manager/Files dùng `apiRequest` chung theo cơ chế phục hồi phiên ở đầu tài liệu; không còn wrapper refresh riêng.
- Picker tạo mới và bộ lọc kho tài liệu dùng GET public `/courses` đủ trang và `/courses/:id` lấy units; chỉ khóa active. Chọn học phần gọi GET `/manager/course-units/:courseUnitId/materials` cho danh sách và thống kê theo trạng thái; gửi page/pageSize/reviewStatus/contentType, đổi bộ lọc quay về trang 1. Chưa chọn học phần thì không gọi danh sách theo học phần và không hiện nhầm danh sách toàn kho. Bỏ chọn khóa học trở về GET `/manager/materials`. Sau mutation refetch đúng danh sách đang xem.
- Tài liệu khóa inactive vẫn hiện trong queue chung và sửa qua detail; chưa có API picker Manager cho khóa inactive.
- `/manager/collections` dùng `ReceiptRepository` cục bộ theo tài khoản. Ghi nhận/hủy phiếu không xác nhận PAID, mở enrollment hoặc hoàn tiền. Adapter tách để nối API khi có contract MANAGER.

## Student learning — 16/10/2026

Đối chiếu Swagger live `https://api.quanh123.id.vn/docs-json` trong lượt này: hợp đồng server mới hơn source/plan BE local 3.3/3.4, đã có ARTICLE và file access. Mục này mở rộng phạm vi allowlist cũ ghi bên dưới.

| Method/path                                                            | Dữ liệu và consumer                                                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GET `/me/classes/:classId`                                             | StudentClassDto, FULL; units/sessions/private meeting URLs                                                                     |
| GET `/me/classes/:classId/preview`                                     | StudentClassPreviewDto, CASH_PREVIEW; không tài liệu hoặc meeting URL                                                          |
| GET `/me/classes/:classId/units/:classUnitId/materials`                | StudentMaterialPageDto; page/pageSize, lấy đủ trang, sort sortOrder/id                                                         |
| GET `/me/classes/:classId/materials/:materialId`                       | StudentMaterialDetailDto; ARTICLE contentHtml/contentSchemaVersion, inlineImages, attachments; file nullable                   |
| GET `/me/classes/:classId/materials/:materialId/download`              | StudentMaterialDownloadDto; primary signed URL, allowlist tương thích API                                                      |
| POST `/me/classes/:classId/materials/:materialId/files/:fileId/access` | Không body; MaterialFileAccessDto với materialId/fileId/role/revision/url/expiresAt; viewer dùng cho primary/inline/attachment |

ID validate UUID, chỉ session access cookie/private no-store. POST kiểm Origin và cấm body; chỉ list cho page/pageSize, detail/sign cấm query lạ/lặp. Không mở staff authoring/release. Signed URLs chỉ HTTP(S), không username/password, lưu trong state component; không đưa Query cache/Web Storage/HTML đã lưu. UI kiểm identity/revision/expiry; URL hết hạn được xin lại qua backend, video giữ currentTime/play state khi thay URL. PDF có tab mới dự phòng.

ARTICLE render bằng DOM allowlist, bỏ script/style/event và external image src; img data-file-id chỉ resolve nếu nằm trong inlineImages. Preview strip meeting URL và không mount material queries. `/user/materials` lấy đủ trang lớp, lọc canViewClass và accessMode khác NONE trước phân trang; quyền thật vẫn được backend kiểm lại trên từng endpoint. Live ClassUnitDto chỉ position/title/sessions, nhận optional courseUnitId/status/unlockAt khi server bổ sung; không suy quyền từ order, lịch hoặc tiêu đề.

Swagger chưa có progress/completion endpoint nên không tự lưu % hoàn thành. Kiểm tra cá nhân/assets dùng mock contract, chưa xác minh credentials, storage CORS/Range hay playback thực tế.

## Commerce/QR — triển khai 15/10/2026

Đối chiếu controller/DTO commerce/payments và Swagger live đã kiểm tra khi lập plan. Lượt xác minh live lại trong lúc implement gặp timeout; kiểm thử mới dùng mock theo contract, chưa nghiệm thu tiền thật.

Browser chỉ gọi `/api/v1` cùng origin. Các route bổ sung:

| Method/path (sau prefix)                  | Contract                                                   |
| ----------------------------------------- | ---------------------------------------------------------- |
| GET `/me/cart`                            | CartDto, currentPriceAmount/totalAmount backend            |
| DELETE `/me/cart/items/:classId`          | UUID, cookie + Origin, 204                                 |
| POST `/me/cart/checkout`                  | Strict `{paymentType:"PAYOS"}` → 201 `{orders:[OrderDto]}` |
| GET `/me/orders`                          | Strict page/pageSize/status, phân trang đơn chờ            |
| GET `/me/orders/:orderId`                 | OrderPaymentDto, payment nullable                          |
| POST `/me/orders/:orderId/payments/payos` | Strict `{}` → PaymentDto create/reuse cùng đơn             |
| GET `/me/orders/payment-result`           | Chỉ orderCode chuỗi số; mapping → OrderPaymentDto          |

Order status PENDING/PAID/EXPIRED/CANCELLED; payment status CREATING/PENDING/SUCCEEDED/REQUIRES_REVIEW. Payment qrCode/checkoutUrl nullable; URL chỉ HTTPS pay.payos.vn, không credentials/port. Kiểm payment.orderId và amount khớp order; QRCodeSVG render qrCode nguyên dạng. Không trả token ra JSON/cache/Web Storage.

Origin kiểm cho POST và DELETE; proxy cookie access_token, UUID allowlist và private/no-store. ReturnTo chỉ cart, UUID checkout, result với mã số hoặc courses cũ. Không dùng query status/cancel để settle/hủy đơn. Backend cấu hình PAYOS_RETURN_URL và PAYOS_CANCEL_URL trỏ `/payment/result` ở frontend triển khai; frontend không gửi return URL tùy ý.

Checkout không tự retry khi timeout. Giỏ/đơn chờ refetch để mở lại đơn đã tạo. Payment retry cùng ID, dừng khi PAID/hết hạn/hủy/review. Thử ngân hàng/payOS tiền thật cần môi trường được cấu hình; test QR decode chỉ chứng minh đúng payload render.

Các trang cart/checkout/payment result dùng AuthGuard: chờ kiểm tra/refresh phiên, chỉ mount nội dung cho STUDENT có status ACTIVE. Guest hoặc phiên hết hạn chuyển về `/login` với returnTo an toàn; thiếu quyền/403 tiếp tục về `/`. Lỗi 401 từ API commerce được client phục hồi một lần trước khi quyết định hết phiên. Lỗi mạng/5xx cho thử lại, 404 giữ thông báo không tìm thấy. Không đổi endpoint hay phân quyền backend; login returnTo vẫn áp dụng khi người dùng chủ động mở link đăng nhập.

Cập nhật 15/10/2026. Swagger: https://api.quanh123.id.vn/docs#/. OpenAPI đọc từ `/docs-json`, lưu tại [openapi.snapshot.json](openapi.snapshot.json). Base URL đã xác minh bằng GET: `https://api.quanh123.id.vn/api/v1`. `/docs#/` là trang tài liệu, không phải base URL request.

Đã đối chiếu `../Mindy-BE/docs/api_flow/PHASE_1_FLOW.md`, `PHASE_1_flow-api-breakdown.md`, ghi chú session recovery ở `PHASE_3_4_flow-api-breakdown.md`, cùng auth controller, LoginDto, UserDto và public course DTO/controller. Phase 1 sửa policy tạo tài khoản; **login vẫn nhận password 1–128 ký tự**, không áp minimum 6 của registration vào login.

## Env

Đã tạo `.env.local` (gitignored) và `.env.example`:

```dotenv
API_BASE_URL=https://api.quanh123.id.vn/api/v1
APP_ORIGIN=http://localhost:3003
```

APP_ORIGIN phải đúng origin người dùng mở app; cập nhật khi deploy. Production dùng HTTPS. Google Login tạm hoãn, không có cấu hình, route hay nút Google trong lần này.

## Endpoint được gắn

| API                      | Tác dụng                                    | Request                                         | Response                                       |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| GET `/courses`           | Khóa học nổi bật homepage                   | `page=1&pageSize=4`, optional UUID `categoryId` | `{ items: Course[], page, pageSize, total }`   |
| GET `/course-categories` | Bộ lọc danh mục homepage                    | `page=1&pageSize=100`                           | `{ items: Category[], page, pageSize, total }` |
| POST `/auth/login`       | Form `/login`                               | `{ email, password }`, optional `deviceName`    | `{ user, accessTokenExpiresAt }` và Set-Cookie |
| GET `/auth/me`           | Tên người dùng trong header                 | Cookie `access_token`                           | UserDto                                        |
| POST `/auth/refresh`     | Khôi phục phiên khi API cần session trả 401 | Cookie `refresh_token`                          | AuthenticatedUserDto và cookie mới             |
| POST `/auth/logout`      | Đăng xuất ở header                          | Cookie `access_token`                           | 204 và clear cookie                            |

Card khóa học dẫn thẳng `/courses/:courseId`, không yêu cầu đăng nhập. Code thực hành homepage là minh họa.

## Mở rộng course/class/registration — 15/10/2026

Đối chiếu Swagger live `/docs-json`, `CourseBrowseController`, `PublicCourseDetailDto`, `ClassDto/ClassDetailDto`, `ClassReadService`, commerce CartController/DTO, auth RegisterDto/VerifyEmailDto và `docs/api_flow/PHASE_2_3_TO_3_2_FLOW.md`, `PHASE_2_3_flow-api-breakdown.md`. Các ghi chú phân công cũ trong tài liệu BE chỉ là lịch sử; source BE không thay đổi trong lần này.

| API                              | Quyền                | Contract và consumer                                                                                                                                 |
| -------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/courses/:courseId`         | Public               | Course + `units[]` (`unitNumber`, `title`, nullable `description`, `requiredScorePercent`) + tối đa 20 `openClasses[]`; không coi đây là toàn bộ lớp |
| GET `/courses/:courseId/classes` | Public               | `{items: Class[], page, pageSize, total}`; phân trang 10, filter optional `deliveryMode=ONLINE                                                       | OFFLINE`, `startsFrom`, `startsTo` |
| GET `/classes/:classId`          | Public               | Class + `units[]` (`position`, `title`, `sessions[]`); lịch theo `startsAt/endsAt`, nullable `roomName`, `status`; không meeting URL                 |
| POST `/me/cart/items`            | STUDENT session      | Strict `{classId: UUID}`; trả CartDto (201). Không nhận giá/student ID; backend quyết định giá, eligibility và capacity                              |
| POST `/auth/register`            | Public + same Origin | `{displayName,email,password}`, password 6–128; trả `{message}` (202), không có session, không tiết lộ email tồn tại                                 |
| POST `/auth/email/verify`        | Public + same Origin | `{token}` 32–512; trả AuthenticatedUserDto và cả hai cookie. Chỉ gọi khi người dùng bấm xác thực                                                     |

Class có `id, courseId, code, name, startDate, endDate, deliveryMode, maxStudents, availableSeats, mentor: {id, displayName|null}`. OPEN được backend xác định và có thể gồm lớp đã bắt đầu nhưng chưa hết ngày kết thúc; frontend không tự lọc theo ngày hiện tại. Lớp hết chỗ vẫn xem lịch được, nút đăng ký bị disable. Class detail xác minh courseId trước khi hiển thị lịch; lịch sort theo startsAt và hiển thị cố định Asia/Ho_Chi_Minh (UTC+7), phân biệt CANCELLED.

Catalog API nhận thêm deliveryMode/startsFrom/startsTo; không có q/sort/level/rating. Tìm kiếm tên/code/description không dấu, học phí và sắp xếp chạy local **sau khi tải mọi trang** bằng pageSize=100. Danh mục/hình thức là server filters và nằm trong query key. Class list được refetch khi mở dialog/focus; không dùng openClasses summary để giả định còn chỗ. Các path dynamic chỉ GET, UUID hợp lệ, đúng số segment; không proxy admin/private meeting route.

Guest xem toàn bộ public UI. Bấm đăng ký lớp mới tới login và có thể chuyển register, giữ `returnTo=/courses/:courseId?classId=:classId`; destination validate allowlist để chặn open redirect. Login thành công quay về đúng dialog/lớp kể cả lớp ngoài trang đầu; không tự thêm giỏ. Tài khoản STUDENT bấm tiếp mới gọi add-cart; 401 quay login, lỗi full/closed/already-enrolled theo backend hiển thị và refetch catalog. Chưa tạo order/hold/payment hoặc triển khai checkout trong phạm vi này.

Registration không tự login; email verification cần backend `FRONTEND_BASE_URL`/`EMAIL_VERIFICATION_PATH` đúng host frontend. Token xác thực không lưu trong Web Storage/store, trang verify đặt no-referrer/noindex; auth verify dùng cùng hàng đợi/Web Lock với login/refresh/logout. Không thực hiện gửi email thật hoặc thêm giỏ trên tài khoản backend thật trong kiểm thử.

Course có `id`, `code`, `title`, nullable `description`, nullable `imgUrl`, `priceAmount` là số nguyên VND, `category: { id, name, slug }`. Không nhân/chia giá. Ảnh chỉ hiển thị từ host allowlist; ảnh khác dùng placeholder.

User có `id`, `email`, `displayName`, nullable `phone`, `role: ADMIN|MANAGER|MENTOR|STUDENT`, `status: PENDING_VERIFICATION|ACTIVE|SUSPENDED`, nullable `lastLoginAt`, `createdAt`. Schema tại `src/lib/api/contracts.ts`.

## Cookie và adapter

Browser gọi `/api/v1` cùng origin Next.js. Adapter chỉ cho phép method/path trong bảng, chuyển đến backend từ env. Không theo redirect upstream, không chuyển cookie vào API public.

- `access_token`: HttpOnly, Path `/`.
- `refresh_token`: HttpOnly, Path `/api/v1/auth/refresh`.
- Giữ đúng name/path; bỏ Domain để cookie thuộc host frontend; áp SameSite=Lax. HTTP local không đặt Secure, HTTPS production có Secure.
- POST yêu cầu Origin đúng APP_ORIGIN. Input validate theo DTO, không nhận role/status/token thừa.
- Response validate theo DTO từng endpoint. Token dư và meeting URL bị loại khỏi JSON public, không đưa vào Redux, Query cache hoặc Web Storage.
- Login/refresh/logout dùng hàng đợi và Web Locks khi có để tránh cạnh tranh xoay cookie. `/me` thử refresh một lần sau 401; không retry mutation vô hạn.
- Logout thành công hoặc phiên invalid xóa session Query cache. Logout 401 xóa cookie local; session backend không coi là đã revoke thành công trong trường hợp này.
- Dữ liệu trả `private, no-store`. API có timeout; UI có loading/error/empty và thử lại khóa học.

## Kiểm chứng

Live GET `/courses?page=1&pageSize=4` và `/course-categories` đều trả 200 cùng dữ liệu thật. Không dùng hoặc dò tài khoản backend. Login thành công/sai mật khẩu, cookie boundary và CSRF được kiểm tra bằng mock đúng contract. Login bằng tài khoản thật cần credentials của người dùng và chưa được coi là xác minh live.

Mở rộng 15/10: live qua adapter `/courses/:id`, `/courses/:id/classes`, `/classes/:id` đều 200; kiểm tra lịch thật, các trạng thái UI và responsive 320–1440px. Vitest 22 pass; Playwright production 37 pass/3 skip theo nền tảng, gồm anonymous viewing → login returnTo → explicit add-cart, registration/verify bằng mock. Không tạo đăng ký email/cart/order thật trong các kiểm tra.

## API khu vực user — 15/10/2026

Đã đọc Swagger live `/docs-json` từ https://api.quanh123.id.vn/docs, đối chiếu `Mindy-BE/docs/api_flow/PHASE_2_3_FLOW.md`, `PHASE_2_3_flow-api-breakdown.md` §2/§5 và `PHASE_4_API_SUMMARY.md`. Endpoint và DTO có trên Swagger đang triển khai; kiểm thử dữ liệu cá nhân dùng mock, không dùng tài khoản thật.

| Method/path        | Consumer và boundary                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/auth/me`     | Profile đọc displayName/email/phone/createdAt, guard STUDENT ACTIVE; không thêm mutation hồ sơ vì Swagger chưa có.                                               |
| GET `/me/orders`   | User orders: page/pageSize/status; tái sử dụng orderPageSchema.                                                                                                  |
| GET `/me/classes`  | User courses: current/history/all, page/pageSize; một dòng/enrollmentId, accessMode/accessReason và canViewSchedule từ API.                                      |
| GET `/me/schedule` | User schedule: from/to ISO có timezone, from < to ≤31 ngày, pageSize≤100, includeCancelled chuỗi true/false. Lấy đủ trang; UI tuần 7 ngày theo Asia/Ho_Chi_Minh. |

Proxy chỉ mở hai GET list mới, cookie access_token/private no-store; thiếu cookie trả 401 trước upstream. Strict query không cho chèn studentId, không proxy admin/private class detail/materials trong lần này. Schedule DTO strip field dư, calendar không có meeting URL và không suy ra attendance hoặc effective mentor theo Session. Buổi qua đêm hiện trên các ngày giao nhau theo startsAt < dayEnd && endsAt > dayStart; session CANCELLED có nhãn hủy. ReturnTo thêm đúng 5 path `/user`, `/user/profile`, `/user/orders`, `/user/schedule`, `/user/courses`; bỏ query/path lạ.

## Admin tracking và payment reconciliation — 23/10/2026

Đối chiếu backend mới ở `Mindy-BE` (source/controller/DTO tracking và reconciliation, Swagger live `/docs-json`). Hai nhóm endpoint chỉ mở trong allowlist FE2; backend vẫn thực thi role ADMIN.

| Method/path                                   | Contract FE2                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/admin/tracking/events`                  | page/pageSize; filter source, actorId, entityId, classId, sessionId, action, from/to; strict query, UUIDv4/source enum, timestamp phải có offset và from < to. Response event gồm actor nullable, entity/class/session IDs nullable, version/reason nullable, occurredAt. |
| GET `/admin/tracking/events/:source/:eventId` | source enum + UUIDv4; detail thêm `data: Record<string, unknown>` và `evidenceItems`. UI hiển thị JSON an toàn như text.                                                                                                                                                  |
| GET `/admin/payments/reconciliation`          | page/pageSize; response items có providerOrderCode, referenceCode, amount/currency, nullable paymentId/reason/actorId, source và createdAt. UI chỉ đọc; không allowlist POST `:paymentId/reconcile`.                                                                      |

Proxy kiểm tra duplicate/unsupported query, Zod response, cookie access_token và `private, no-store`. Query hooks được enable duy nhất với ADMIN ACTIVE; tracking filters/page và reconciliation page/pageSize nằm trong query key cùng user ID. Kiểm thử API/E2E dùng fixture giả lập đúng DTO, không gọi mutation hoặc coi mock là xác nhận tài khoản thật.
