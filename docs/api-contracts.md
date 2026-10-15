# API catalog, lớp học và tài khoản

## Mentor — 16/10/2026

UI roster theo mẫu Admin dùng GET `mentor/classes/:classId/students` với page/pageSize (10/20/50), orderStatus và paymentType đã có trong contract. Tab trạng thái và hình thức lọc trên server; tìm kiếm tên không dấu và sắp xếp chỉ trên trang đã tải, không gửi q/sort. Bảng chỉ trình bày các trường Mentor được trả về, không truy cập contact/detail của Admin hoặc xác nhận thu tiền.

Đã đọc Swagger live `https://api.quanh123.id.vn/docs-json`: các endpoint dưới đây có trong deployment. Đối chiếu source `../Mindy-BE` nhánh `Feat/Phase4` cho teaching/attendance/files/roster và `origin/codex/phase-3-3-4-unit-release` cho mentor materials/content context/release. Không sửa BE hoặc Mindy-FE. Kiểm thử ghi dữ liệu bằng API mock; chưa dùng tài khoản Mentor thật để xác minh quyền/MinIO.

| Endpoint                                                                                                                      | Contract/consumer                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `mentor/schedule`                                                                                                         | Phân trang, cặp from/to có timezone, classId tùy chọn; items TeachingSession gồm effectiveMentor/assignmentType/version/asOf/timeZone.                                                          |
| GET `mentor/classes`                                                                                                          | ClassDto + status, filter status và phân trang.                                                                                                                                                 |
| GET `mentor/classes/:classId/students`                                                                                        | Enrollment/payment status; chỉ hiển thị, không dùng canConfirmCash để mở thao tác thu tiền.                                                                                                     |
| GET `class-sessions/:sessionId/context`                                                                                       | session, roomName, meetingUrl, accessScope=SESSION.                                                                                                                                             |
| GET `class-sessions/:sessionId/attendance`                                                                                    | snapshot + permissions + totals toàn roster + pendingPaymentCount + phân trang.                                                                                                                 |
| POST `.../start`, `.../finalize`, `.../attendance/sync-roster`; PUT `.../attendance`                                          | Bắt buộc Idempotency-Key UUID và expectedVersion. PUT gửi records enrollmentId/status. Khi buổi đã chốt, bỏ tick gửi ABSENT; buổi mở gửi UNMARKED. Không gửi reason/recovery của staff.         |
| GET `mentor/classes/:classId/units`, `.../units/:unitId/sessions`                                                             | Phân trang unit được phân công và safe session context; tách Class Unit ID với Course Unit ID.                                                                                                  |
| GET/POST `.../units/:unitId/materials`; GET/PATCH/DELETE `.../materials/:materialId`; POST `.../materials/:materialId/submit` | ARTICLE/FILE/VIDEO; revision/canEdit/createdBy/firstApprovedAt; PATCH/submit gửi expectedRevision, DELETE dùng query expectedRevision. HTML tối đa 48 KiB UTF-8, không đổi contentType khi sửa. |
| POST `.../materials/:materialId/files/:fileId/access`                                                                         | Không body; response materialId/fileId/role/revision/url/expiresAt. Signed URL giữ memory, không Web Storage.                                                                                   |
| POST `files/upload-intents`, `files/:fileId/complete`; GET `files/:fileId`                                                    | Input Course Unit + Class/Class Unit context, tên/MIME/size; direct PUT theo requiredHeaders không cookie; complete `{}`; chỉ READY mới gắn vào học liệu.                                       |
| PATCH `mentor/classes/:classId/units/:unitId/release`                                                                         | status OPEN/LOCKED, unlockAt ISO có timezone hoặc null. Mở/khóa ngay xóa lịch cũ; hẹn giờ dùng LOCKED và timestamp UTC+7.                                                                       |

Adapter chỉ allowlist đúng các method/path trên, validate UUID/query/body/response, chặn query lặp và Origin không khớp, forward access_token và Idempotency-Key cho attendance, private/no-store. Không mở cash-orders/confirm, assignment, attendance audit/recover hoặc material approval. Login/returnTo và cache theo session dùng pattern hiện có.

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

| API                      | Tác dụng                          | Request                                         | Response                                       |
| ------------------------ | --------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| GET `/courses`           | Khóa học nổi bật homepage         | `page=1&pageSize=4`, optional UUID `categoryId` | `{ items: Course[], page, pageSize, total }`   |
| GET `/course-categories` | Bộ lọc danh mục homepage          | `page=1&pageSize=100`                           | `{ items: Category[], page, pageSize, total }` |
| POST `/auth/login`       | Form `/login`                     | `{ email, password }`, optional `deviceName`    | `{ user, accessTokenExpiresAt }` và Set-Cookie |
| GET `/auth/me`           | Tên người dùng trong header       | Cookie `access_token`                           | UserDto                                        |
| POST `/auth/refresh`     | Khôi phục phiên khi `/me` trả 401 | Cookie `refresh_token`                          | AuthenticatedUserDto và cookie mới             |
| POST `/auth/logout`      | Đăng xuất ở header                | Cookie `access_token`                           | 204 và clear cookie                            |

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

Catalog API nhận thêm deliveryMode/startsFrom/startsTo; không có q/sort/level/rating. Tìm kiếm tên/code/description không dấu, học phí và sắp xếp chạy local **sau khi tải mọi trang** bằng pageSize=100. Danh mục/hình thức là server filters và nằm trong query key. Class list được refetch khi mở dialog/focus; không dùng openClasses summary để giả định còn chỗ. Các path dynamic chỉ GET, UUID hợp lệ, đúng số segment; không proxy private meeting route. Admin GET list được mở rộng riêng theo mục dưới.

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

## Admin template — 15/10/2026

Admin CRUD theo yêu cầu bổ sung: `src/lib/api/admin-rules.server.ts` là method/path allowlist cho GET details, POST create/commands, PATCH edits/status/session hours và PUT course-unit order. Zod schemas tại `features/admin/schemas/admin-write-contracts.ts`; policy và các giới hạn BE tại [admin-template.md](admin-template.md). Mọi write kiểm Origin, body tối đa 64KiB; chỉ cookie access_token. Không có DELETE hoặc profile edit user, deactivate course, mentor reassignment hay payment/attendance trong allowlist.

Ba GET list `/admin/users`, `/admin/courses`, `/admin/classes` đã đối chiếu Swagger live, controller và DTO BE. Browser dùng same-origin, adapter chỉ forward access_token, strict query và validate Zod response, private no-store. Backend kiểm quyền ADMIN. Đã mở GET detail và mutations theo allowlist ở admin-rules.server.ts, mô tả bên dưới. Filter role/status/isActive/deliveryMode chạy server; search/sort và CSV trong trang hiện tại. Chi tiết contract, nguồn và giới hạn tại [admin-template.md](admin-template.md).

Guest đi login giữ admin returnTo allowlist; ADMIN ACTIVE dùng shell, role khác bị chặn UI trước khi query. Đổi phiên giữ query session đang observe, xóa các cache khác; logout ẩn nội dung admin. Chưa dùng tài khoản ADMIN backend thật để xác minh list; browser tests dùng mock contract.

## Xem học viên theo lớp — 15/10/2026

Nút Học viên trên bảng lớp của `/admin` và `/admin/classes` mở Dialog shadcn/ui, query theo classId và page; GET `/admin/classes/:classId/students?page=1&pageSize=20`. Đối chiếu Swagger live và `AdminClassStudentDto`/flow Phase 4 BE: tên/email/phone, studentStatus, enrollmentId/enrollmentStatus và enrolledAt nullable; response `{items,page,pageSize,total}`. Danh sách theo BE gồm chờ thanh toán/đang học/hoàn thành, không phải roster điểm danh. Chỉ mở đúng GET list có UUID/pagination strict và access_token/private no-store; chưa mở student detail hoặc mutations. Có loading/error/retry/empty/phân trang; query chỉ mount khi bấm nút.
