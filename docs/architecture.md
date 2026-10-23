# Kiến trúc Mindy FE2

## Manager duyệt đơn xin nghỉ Mentor — 23/10/2026

- `/manager/leave-requests` và `/manager/leave-requests/:requestId` nằm sau guard MANAGER ACTIVE. Sidebar có mục riêng; tổng quan hiển thị bảng PENDING phân trang theo tổng backend. Trang danh sách giữ status/mentor/page trên URL, mặc định PENDING và hỗ trợ Back/Forward.
- Trang chi tiết đọc cùng API detail theo trang độc lập cho lịch ảnh hưởng và xung đột học viên. Tên mentor, học viên, lớp được bổ sung từ các API manager hiện có theo ID; khi không tải được, ID vẫn hiển thị kèm retry.
- Lệnh approve/reject dùng hook mutation riêng với `managerRequest`, không tự retry; lỗi mạng/5xx giữ nguyên body và UUID idempotency để gửi lại cùng ý định. Kết quả xác định invalidate dữ liệu Manager/Mentor/lịch; approve báo stale lịch lớp liên quan và không tự tạo buổi bù ở FE.
- Proxy chỉ mở bốn endpoint quản lý đơn và các GET phụ cần giao diện. Backend giữ transaction, quyền, phiên bản và thay đổi lịch; FE không thêm API hoặc quyền xử lý.

## Dashboard và trang duyệt Manager — 23/10/2026

- `/manager` có bảng chờ duyệt dùng `ManagerPendingMaterials`, query phân trang 20 dòng theo `PENDING_REVIEW`; thống kê vẫn lấy `total` backend. Làm mới bảng đồng thời đọc lại ba thống kê. Link từng dòng mở `/manager/materials/:materialId`; route chỉ await params và lắp `ManagerMaterialReviewPage`, feature kiểm UUID trước khi mount query. Guard MANAGER ACTIVE và safeReturnPath áp dụng cho route chi tiết.
- Trang duyệt tái sử dụng `ManagerMaterialDetail` embedded và CKEditor, giữ workspace/kho hiện hữu. Duyệt/từ chối giữ trang để xem trạng thái mới; xóa chuyển về tổng quan. Query Manager được invalidate sau mutation để danh sách và số liệu cập nhật.
- Xác nhận duyệt/từ chối/xóa/xuất bản dùng Modal riêng thay form ở cuối bài. Revision được chụp khi mở; khóa gửi trùng hoặc khi dữ liệu đã đổi. Lỗi lệnh yêu cầu đọc lại tài liệu và người dùng xác nhận một ý định mới; không replay sau lỗi mạng/409. Escape/Hủy trả focus về nút mở, thông báo thành công nằm gần toolbar.

## Manager, Student và Admin read-only — 23/10/2026

- `/manager` là Tổng quan Manager, đọc ba `total` từ `GET /manager/materials?page=1&pageSize=1&reviewStatus=...`; lỗi tải không biến thành số 0. Thẻ thống kê và Toàn bộ tài liệu mở `/manager/materials?view=inventory&reviewStatus=...`. Query URL là nguồn trạng thái nên reload/Back/Forward giữ bộ lọc; route materials không query vẫn hiển thị danh sách khóa học/workspace cũ.
- Menu tài khoản chỉ đưa Student tới `/user/profile` và `/user/schedule`; Manager tới `/manager`, Admin tới `/admin`, Mentor tới `/mentor`. Student có thể mở tài liệu trực tiếp từ hàng khóa học chỉ khi `canViewClass` cho phép và `accessMode` là FULL/CASH_PREVIEW.
- ScheduleEvent giữ attendance vật lý, khả năng chuyên cần, metadata học bù và mentor nullable đúng API. Lịch không suy ABSENT từ null/UNMARKED hoặc từ trạng thái hoàn thành; định danh hợp sự kiện gồm session, enrollment và makeup placement để giữ các lượt học bù riêng.
- `/admin/tracking` và `/admin/payments/reconciliation` chỉ dành cho ADMIN ACTIVE. `AdminOnlyAccess` chặn trước khi mount query; sidebar ẩn hai mục khỏi Manager. Các query dùng user/filter/page trong key và `AbortSignal`; route proxy chỉ cho GET, cookie access_token và `private, no-store`. Tracking detail trình bày JSON như text, không dùng HTML từ API. Reconciliation không có mutation.
- Hai màn admin dùng admin shell, Inter, token Mindy và component UI hiện có; bảng cuộn trong panel, filter xuống hàng, dialog cuộn độc lập. Lỗi/empty/loading có nội dung riêng và retry.

## CKEditor cho học liệu Manager/Mentor — 23/10/2026

- `components/ui/article-editor.tsx` tải CKEditor 5 bằng dynamic import `ssr: false`; `article-editor-client.tsx` sở hữu cấu hình tiếng Việt, lifecycle, trạng thái sẵn sàng và thông báo lỗi/thử lại. Các form giữ HTML draft trong state, khóa lưu trước khi editor sẵn sàng và truyền `disabled` tường minh cho contenteditable. Source mode đồng bộ qua `getData()` khi nhập để không lưu bản cũ.
- ManagerMaterialEditor và MentorMaterialEditor dùng cùng component cho cả tạo/sửa, gửi `contentHtml`; tạo ARTICLE có `contentSchemaVersion: 1`, PATCH có `expectedRevision`. API, TanStack Query, sessionId, upload và attachments giữ workflow hiện hữu. `lib/article-content.ts` kiểm tra bài rỗng và 48 KiB UTF-8 tại submit; backend vẫn sở hữu sanitizer/phân quyền.
- Chỉ bật định dạng backend hỗ trợ. GeneralHtmlSupport giữ thẻ bài cũ, `data-file-id`/alt, title của liên kết và colspan/rowspan của bảng; không thêm upload ảnh bằng URL/data URI. Overlay của editor đặt trong dialog khi có để form liên kết dùng được với focus trap Radix.
- Npm `ckeditor5` và `@ckeditor/ckeditor5-react` được thêm theo yêu cầu người dùng. `lib/env.client.ts` đọc public `NEXT_PUBLIC_CKEDITOR_LICENSE_KEY`, mặc định `GPL`. Chỉ dùng cấu hình này khi tuân thủ điều khoản GPL của CKEditor; dùng khóa self-hosted thương mại khi áp dụng, rồi restart/rebuild Next.js. Không bật premium plugins. Tham khảo [CKEditor license key](https://ckeditor.com/docs/ckeditor5/latest/getting-started/licensing/license-key-and-activation.html).

## UI Mentor và trực quan tiến độ — 22/10/2026

- mentor-report-ui.tsx cung cấp presentation chung cho hàng học viên, heading/action và MentorProgressBar. Thanh nhận value nullable: số thật có role progressbar/aria-valuenow, unknown là track nét đứt không mang giá trị số. Không ghi tracking hoặc suy learning completion.
- Class summary chỉ vẽ độ phủ record theo counts BE; StudentProgress đọc phần trăm từng chương từ endpoint chi tiết hiện hữu. Đổi unit filter vẫn reset list/page; detail và danh sách giữ nguyên pagination/query/permission.
- mentor-leave-ui.tsx trình bày ba bước theo state preview/mapping và badge trạng thái đơn. MentorLeavePage chỉ mount form hoặc list; LeaveCreate/Detail/SessionMakeupSlot giữ mutations và contract cũ. Không thêm dependency hoặc API.

## Mentor workspace đầy đủ — 22/10/2026

- features/mentor/schemas/workspace-contracts.ts và leave-contracts.ts mô tả đúng DTO và quyền mới; lib/api/mentor-rules.server.ts mở chính xác method/path/query/body, chuyển key có kiểm UUIDv4 và Origin theo adapter cũ. Server state trong TanStack Query theo user/path/filter, không thêm Redux hoặc storage cho dữ liệu riêng tư.
- MentorClassPage đọc shell trước khi mount các tab Chương/Buổi học/Học viên/Chuyên cần/Tiến độ. Scope SESSION không mount roster/reports hoặc authoring. Giữ workspace nội dung và upload hiện hữu; loại bỏ UnitRelease đã bị BE xóa.
- MentorClassTimetable dùng timetable phân trang/range. MentorClassReports trình bày credit BE và tracking thiếu/zero/invalid, detail học viên phân trang. useMentorUnitIndex lấy đủ trang cho filter và tên chương.
- MentorSessionPage kiểm class state và session permissions, candidates trước start, snapshot sau start, guest placement IDs, confirm bulk toàn roster, meeting editor và notes editor. Note draft/version nằm trong editor; bản mới không tự ghi đè draft.
- /mentor/leave-requests dùng MentorLeavePage; LeaveCreate/SessionMakeupSlot/LeaveDetail tách form preview, chọn lịch, tạo/xem/rút đơn. Backend sở hữu phê duyệt, conflict, transaction và lịch.
- useMentorCommand giữ key của request chưa xác định khi lỗi mạng; thành công/lỗi business kết thúc ý định. Mutation invalidate mentor queries, không tự replay command. Đây là integration teaching-notes nội bộ theo BE mới, khác ghi chú từng dòng điểm danh đã bỏ trong lịch sử bên dưới.

## Nội dung Mentor theo từng buổi học — 22/10/2026

- MentorMaterials mở danh sách buổi trước thay vì tự chọn tài liệu đầu tiên. useMentorUnitSessions ghép danh sách buổi được cấp quyền `/units/:unitId/sessions` (ID/số buổi) với `/mentor/classes/:classId/sessions?unitId=...` (lịch/quyền) theo sessionId, tải đủ trang và kiểm đúng lớp/chương. Không dùng sessions trong chi tiết chương: BE hiện trả mảng rỗng cho Mentor. MentorSessionMaterials ghép Material.sessionId với kết quả, sắp buổi theo sessionNumber, nội dung theo sortOrder; phần chưa gắn buổi và liên kết không còn thuộc chương được giữ riêng, không tự gán vào buổi đầu.
- useMentorUnitMaterials lấy đủ các trang của endpoint materials hiện có (pageSize=100), xác thực từng response, loại trùng ID và chỉ hiển thị nhóm khi tải đủ; lỗi trang sau phải thử lại, không hiển thị số lượng thiếu. TanStack Query giữ server state, query key theo user/chương/reviewStatus, truyền AbortSignal và dùng cơ chế invalidate mentor hiện có.
- Chỉ giữ nút Thêm nội dung ở header chương; người dùng chọn buổi trong editor trước khi lưu. POST/PATCH vẫn dùng sessionId và expectedRevision theo contract cũ. Chi tiết nội dung, quyền sửa, gửi duyệt, upload và signed file access không đổi. Link Điểm danh chỉ hiện khi timetable trả capabilities.readSessionContext; không suy đoán phòng hoặc meeting URL từ API không có các field này.
- API hiện chỉ có ARTICLE/FILE/VIDEO; chưa tạo loại hay thao tác bài tập giả. Không sửa backend hoặc thêm endpoint để thực hiện bố cục này.

## Giới hạn thời gian hẹn giờ Mentor — 22/10/2026

- minimumScheduleInput dùng timestamp và UTC+7 để tạo min cho datetime-local, làm tròn lên phút vì input lưu giây 00. MentorMaterialEditor áp dụng khi tạo mới; UnitRelease áp dụng ở chế độ SCHEDULE.
- Hai form kiểm tra Date.now tại submit trước mutation để chặn giá trị đã trôi qua sau lúc chọn. Payload ISO +07:00 và contract API không đổi. Đây là validation UI, không migration hoặc sửa backend.

## Buổi học gắn với tài liệu Mentor — 22/10/2026

- MentorMaterials sở hữu useMentorUnitSessions và chia sẻ cùng dữ liệu cho danh sách buổi học phía dưới và MaterialSession ở ngay dưới tiêu đề tài liệu. Ghép sessionId của tài liệu với danh sách buổi được cấp quyền, không dùng mảng sessions rỗng của chi tiết chương hoặc tạo API mới.
- Khi sessionId null, hiển thị Chưa gắn buổi học và nút Gắn buổi học chỉ cho tác giả còn quyền sửa. Nút mở editor hiện hữu để chọn/lưu sessionId; khi đã gắn hiển thị tên, số và lịch buổi, không có nút Xem buổi học theo yêu cầu mới nhất. Không tự gán theo thứ tự hoặc buổi đầu tiên. Chờ/lỗi query phụ dùng thông báo tại chỗ, không thêm loading overlay.

## Loading dữ liệu Mentor — 22/10/2026

- MentorSessionPage dùng một MentorQueryState cho context và attendance: hai query vẫn chạy song song, chỉ một loading cho tới khi cả hai kết thúc; lỗi chung và Thử lại refetch cả hai. Background refetch có cache không che lại trang.
- Trong workspace chương, danh sách buổi học phụ chỉ hiện khi query kết thúc, không thêm overlay cùng danh sách/chi tiết. Khi mở editor, loading danh sách nội dung tạm ẩn để chỉ còn loading dữ liệu form; lỗi và thử lại của từng phần vẫn giữ.

## Hai nút điểm danh Mentor — 22/10/2026

- MentorAttendanceRoster hiển thị hai nút Có mặt/Vắng, không có state điểm danh riêng. MentorSessionPage sở hữu mutation/version/idempotency và refetch, chỉ gửi enrollmentId/status theo API hiện có.
- Theo yêu cầu mới nhất đã bỏ toàn bộ ô ghi chú, contract và mã backend/migration ghi chú chưa triển khai. Điểm danh dùng trực tiếp backend hiện có, không cần migration mới.

## Upload và phản hồi màu trong Mentor — 22/10/2026

MentorFileUpload quản lý lần tải đang chạy/lỗi/hủy, vùng kéo thả và input native ẩn. MentorUploadFileCard chỉ trình bày tên, dung lượng, trạng thái và action; MentorMaterialEditor giữ metadata tệp READY cho file chính và attachments. Bắt đầu thay tệp xóa fileId cũ khỏi form, do đó thất bại/hủy không thể lưu nhầm file cũ. Chỉ gọi onReady sau uploadMentorFile hoàn tất READY; VIDEO kiểm kind trước khi báo thành công. Controller ngăn hai lần tải trong cùng widget, hủy khi unmount và bỏ phản hồi sau abort. API, bytes PUT, polling và giới hạn dung lượng giữ nguyên.

## Giao diện điểm danh Mentor — 22/10/2026

MentorAttendanceRoster là component trình bày danh sách và thao tác điểm danh, dùng type suy từ attendanceSchema. Nhận items/disabled/scheduled/onMark từ MentorSessionPage; không có query, mutation hoặc state điểm danh riêng. Container 768px chuyển giữa bảng và thẻ mobile. MentorSessionPage giữ act, expectedVersion, idempotency key và permissions; hai nút gửi PRESENT/ABSENT trực tiếp. Table dùng chung không bị đổi style toàn cục.

## Responsive khung Mentor — 22/10/2026

MentorUnits dùng named container `mentor-course` để quyết định bố cục theo chiều rộng vùng nội dung sau sidebar của shell. Từ 48rem, danh sách chương 248px và MentorMaterials nằm cạnh nhau trong khung cao tối đa 800px/viewport trừ 32px; danh sách và body học liệu cuộn riêng, header/thao tác giữ vị trí. Dưới 48rem, NativeSelect thay danh sách chương, nội dung cuộn theo trang. Hai cách chọn dùng chung selectedId và không remount học liệu khi resize nên giữ bản nháp.

MentorMaterialEditor dùng container riêng `mentor-editor`: nhóm thứ tự/ngày chỉ chia đôi khi form rộng ít nhất 36rem, ô chọn có wrapper rộng đầy đủ. Material rail cuộn ngang trong panel. Thay đổi nằm trong feature Mentor; CourseContentFrame của Manager giữ nguyên.

## Khung nội dung cuộn độc lập — 16/10/2026

components/ui/course-content-frame.tsx cung cấp CourseContentFrame (sidebar title/list + panel) và CourseContentPanel (header + body). Hai component chỉ quản lý bố cục, không chứa state/API. Khung dùng trong workspace khi đã chọn khóa học; state theo course/unit và mọi query/mutation giữ ở feature.

Frame có chiều cao giới hạn bởi viewport, grid minmax(0,…) và các flex child min-h-0. Sidebar/body cuộn riêng, overscroll-y-contain giữ cuộn trong panel, scrollbar-hidden chỉ áp dụng trong frame. Header nằm ngoài vùng cuộn; các vùng cuộn có tên truy cập/tabIndex để dùng PageDown/End. Đổi chương remount panel nên vị trí cuộn nội dung trở về đầu.

## Manager collections từ máy chủ — 16/10/2026

ManagerCollectionsPage thay chế độ phiếu cục bộ bằng manager/orders filters, lớp picker và thống kê total. manager-collections-contracts.ts sở hữu DTO/validation riêng (tái dùng OrderDto), manager-collections.ts sở hữu class query, formatter/CSV và thông báo lỗi; manager-rules.server.ts mở chính xác GET classes/orders/detail và POST cash confirm. Các query dùng scope user của Manager, không lưu giao dịch vào Redux/Web Storage.

ManagerCashOrderDialog đọc detail, giữ tiền thực nhận/acknowledgement ở component, khóa form trong mutation và sau lỗi chưa được kiểm tra lại. Backend transaction duy nhất cập nhật PAID/entitlement; useManagerCommand invalidate Manager queries sau mutation, không optimistic settlement, không replay network/409/403. ManagerLocalReceipts đọc/xuất dữ liệu cũ bằng repository hiện hữu, không tự chuyển thành giao dịch thật và không sửa localStorage từ UI mới.

## Manager entry mặc định — 16/10/2026

ManagerMaterialsPage sở hữu view khóa học mặc định, courseId và dialog tạo tài liệu khi chưa có context. Màn vào trang dùng catalogue thật để render ManagerCourseList toàn chiều rộng; component list chỉ nhận courses/onSelect, không có query riêng, picker lặp hoặc panel placeholder. Chọn khóa mới mount ManagerCourseWorkspace; nút Danh sách khóa học đặt lại courseId. ManagerMaterialsInventory chỉ mount khi mở Toàn bộ tài liệu, giữ workflow kho hiện hữu. Không fetch course detail/totals/list toàn kho trên màn mặc định; reload trở về list. Kiểm UI dev trực tiếp trên port 3003 bằng API mock.

## Manager course workspace — 16/10/2026

ManagerMaterialsPage khi có courseId hiển thị course title/picker và ManagerCourseWorkspace thay cho dashboard/bảng học liệu. Workspace lấy units từ CourseDetail hiện hữu, sort theo unitNumber, chọn chương đầu tiên; ManagerChapterContent key theo unit ID để không giữ editor/filter/pagination của chương cũ. Query riêng manager/course-units/:id/materials, chọn tài liệu và render ManagerMaterialDetail embedded. Header chương tạo ManagerMaterialEditor embedded có sẵn courseId/unitId và callback chọn bản nháp vừa lưu. Không cần thêm API hoặc state Redux.

ManagerMaterialDetail/Editor giữ chế độ dialog mặc định cho kho toàn bộ và hỗ trợ embedded cho workspace. Review/publication/revision, signed access và uploader hiện hữu được tái sử dụng; nội dung mới trong workspace nhận contentText hoặc contentHtml theo contract chung. Không có class context nên không hiển thị lịch buổi học giả trong workspace khóa học.

## Mentor content workspace — 16/10/2026

MentorClassPage mặc định mở MentorUnits: sidebar phân trang chương + MentorMaterials key theo unit ID để tách state giữa chương. MentorMaterials chọn bài, render detail và MentorMaterialEditor embedded trong panel; dialog chỉ còn release và xác nhận submit/delete. Editor giữ revision tại lúc mở, báo lỗi 409 và giữ nội dung người dùng.

unitDetailSchema ánh xạ ClassUnitManagementDto riêng với unitSchema của list/release. lib/api/mentor-rules.server.ts mở chính xác unit detail và revision-bound preview/assets. Server state dùng useMentorQuery theo user/class/path; ký URL dùng apiRequest có AbortSignal trong component, không đưa URL vào Query cache/storage. Material schema dùng chung Manager/Mentor được bổ sung contentText và validation exclusive input.

## Manager — 16/10/2026

- `/manager` hiện là dashboard Tổng quan Manager; `/manager/materials` mặc định vẫn mở danh sách khóa học, còn `/manager/collections` giữ luồng thu tiền đã tích hợp. `ManagerShell` dùng shell/CSS quản trị hiện có, menu desktop thu gọn/mobile sheet; chỉ mount nghiệp vụ cho MANAGER ACTIVE, key theo user ID. Staff login và menu tài khoản đưa MANAGER đến `/manager`.
- `features/manager` sở hữu UI, Query hooks, upload và receipt repository. DTO Material tái sử dụng contract chung với Mentor; manager filters/reject/upload scope có validation riêng. `lib/api/manager-rules.server.ts` sở hữu allowlist chính xác, không mở API thu tiền Manager chưa có contract.
- Query key gồm user/filter/page, không poll tài liệu; refetch sau mutation/focus. Detail/editor giữ revision đã xem khi xác nhận/lưu, 409 không tự retry. Signed URLs nằm trong component memory, hủy request khi unmount. Bài viết preview trong iframe sandbox với CSP chặn script/network; các ảnh inline có luồng lấy liên kết riêng.
- `ReceiptRepository` có implementation `localReceiptRepository`: localStorage theo user, runtime validation, trạng thái DRAFT/RECORDED_LOCAL/CANCELLED, xuất CSV chống formula injection. Không gọi API thanh toán hoặc đổi order/enrollment. Khi có contract thu tiền MANAGER, thay adapter và nối nguồn học viên/đơn thực tế.

## Tích hợp admin có chọn lọc — 16/10/2026

Admin nằm ở app/admin, features/admin và components/layout/admin-shell.tsx. Chỉ ghép bổ sung vào nền Booking; không thay code các tính năng public, student và commerce. lib/api/admin-rules.server.ts sở hữu allowlist/schema admin; proxy giữ toàn bộ rules học tập/commerce hiện có và bổ sung các route đã chọn cho admin.

CSS hình thức admin ở app/admin/admin.css; override font/token giới hạn bởi html:has([data-admin-root]) để portal dùng cùng style và tự khôi phục khi rời admin. globals.css chỉ import app/admin/tokens.css để Tailwind sinh utility mới, không đổi token hiện có. Login và auth queries giữ nguyên; admin đi từ link tài khoản hoặc login có returnTo admin hợp lệ.

## Học tập — mở rộng 16/10/2026

`features/learning` sở hữu schemas, Query hooks, proxy policy và UI `/user/materials`, `/user/materials/[classId]`. UserShell bảo vệ STUDENT; sidebar active cho cả route con. Danh sách lấy đủ trang lớp rồi lọc quyền trước phân trang; courses dialog có link Vào học/Xem trước. Server route validate UUID và đọc async params/searchParams của Next 16.

Class detail phân biệt FULL và CASH_PREVIEW. Workspace chia sidebar unit và panel tài liệu/buổi học; Query cache theo user/class/unit/material, hủy bằng signal và không tự retry quyền bị từ chối. Nội dung ARTICLE dùng DOM allowlist; file access POST chỉ khi mở tệp/ảnh bài đọc, signed URL trong component memory và hủy request khi unmount. Không thêm dependency hoặc gọi API progress chưa có.

Stack: Next.js App Router, React, TypeScript strict, Tailwind CSS v4, TanStack Query và Redux Toolkit. App chạy port 3003; API cấu hình trong `.env.local` theo `.env.example`.

Tham khảo convention và cách tổ chức của [ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate); khởi tạo bằng create-next-app. Bộ công cụ frontend gồm ESLint, Prettier, Vitest và Playwright. Backend Mindy sở hữu auth, dữ liệu và giao dịch; không thêm Clerk, Drizzle hoặc database demo.

## Cấu trúc

```text
src/
  app/                  # Route, metadata, layout, providers, global CSS
    api/v1/[...path]/   # Same-origin adapter, method/path allowlist
    login/             # Email/password login
    register/          # Student registration, verification required
    verify-email/      # Explicit email verification and session establishment
    courses/           # Catalog + [courseId] detail, public
  components/
    layout/            # Header, footer, navigation
    ui/                # Brand, icon, action link
  features/
    home/              # Các section và catalog homepage
    auth/              # Login/session Query hooks và UI
    courses/
      api/             # Public queries; cache keys include filters/page/IDs
      schemas/         # Runtime Zod DTOs, inferred TypeScript types
      lib/             # Search, sort, prices and Vietnam timetable formatting
      components/
        catalog/       # Catalog toolbar, filters, grid/list
        detail/        # Course composition, overview, curriculum, mentors, registration card
        enrollment/    # Public class picker/timetable; protected registration action
        shared/        # Course card, image, pagination, query states
    cart/
      api/             # Add selected class mutation
      schemas/         # Cart DTO and class-only input; no client-supplied price
  lib/
    api/               # Client, Zod DTO, adapter, cookie policy
    store/             # Redux factory, UI slice, typed hooks
    env.server.ts      # Env server và validation
  utils/app-config.ts  # Tên ứng dụng, mô tả, navigation
public/
  brand/               # Logo từ docs/logo.jpg
  mindy/               # Ảnh ếch và nền từ Mindy-FE dev
```

`app` lắp ghép route; `features` chứa UI theo nghiệp vụ; `components` chứa thành phần dùng lại. Server Components là mặc định. Menu mobile, catalog và form login là Client Components.

## State và API

TanStack Query quản lý server state: courses, categories, current user và auth mutations. Redux Toolkit quản lý UI dùng chung; hiện có mobile navigation. Store và QueryClient tạo theo instance provider để không chia sẻ dữ liệu giữa server requests. Không sao chép API cache vào Redux, không lưu token trong hai store này.

API gắn homepage, catalog/detail/lớp/lịch public, email login/registration/verification và thêm lớp vào giỏ. Browser gọi cùng origin `/api/v1`, adapter forward đến `API_BASE_URL=https://api.quanh123.id.vn/api/v1`. Contract, nguồn Swagger/api_flow và quy tắc cookie trong [api-contracts.md](api-contracts.md).

Module sở hữu DTO trong `schemas` và suy ra `type` bằng `z.infer`; filter/props dùng type hoặc interface theo trách nhiệm, không khai báo DTO lặp lại. `lib/api` chỉ giữ HTTP client, adapter, cookie policy và auth contract có sẵn. Query hooks ở `features/<module>/api`; không đưa server state vào Redux. Module courses dùng auth cho session và cart cho mutation, không tự xử lý giao dịch.

Backend dùng cookie HttpOnly: access token Path `/`, refresh token Path `/api/v1/auth/refresh`. POST kiểm Origin; adapter chỉ chuyển cookie được allowlist. `/auth/me` khôi phục qua refresh một lần khi cần; auth operations được tuần tự hóa ở browser. Session cache bị xóa khi đổi phiên. Google Login tạm hoãn theo yêu cầu mới nhất.

## Styling và assets

Token màu ở `src/app/globals.css`, theo `docs/pallete.png`. Tailwind v4 dùng `@theme` và loader `@tailwindcss/turbopack` do create-next-app 16.4.1 tạo. Không thêm PostCSS xử lý Tailwind lần hai. Font Nunito Variable local qua Fontsource, có tiếng Việt; build không tải Google Fonts. Ảnh dùng next/image và sizes, ảnh API chỉ từ host allowlist.

## Phạm vi

- `/`: homepage theo Mindy-FE dev, palette docs; khóa học thật và bộ lọc danh mục, loading/error/empty.
- `/login`: email/password, cookie session và logout trong header.
- `/courses`: mẫu catalog người dùng gửi, tìm kiếm không dấu, lọc danh mục/hình thức/học phí, sắp xếp giá/tên, grid/list và phân trang. Search/price/sort chạy trên toàn bộ các trang API đã tải vì backend chưa có q/sort.
- `/courses/[courseId]`: mẫu Stitch chi tiết, dùng palette config; giáo trình là danh sách học phần tĩnh (số thứ tự/tên/mô tả, không hiển thị % điểm yêu cầu), mentor thật và lớp liên quan. Không bịa review, video học thử, số học viên hoặc cam kết hoàn tiền.
- Nút “Đăng ký học ngay” kiểm tra lại phiên qua Query: guest thấy popup “Bạn chưa đăng nhập” với link login giữ returnTo về khóa học; có phiên mới mở chọn lớp. Lỗi kiểm tra phiên có thông báo và cho thử lại. Mentor “Xem lớp & lịch học” vẫn mở lịch công khai. “Đăng ký lớp này” cần STUDENT và thêm lớp vào giỏ qua API; login không tự mutation. Return path dùng allowlist và UUID đã kiểm tra.
- Dialog native hỗ trợ Escape, focus trap/restore và scroll lock; mobile có bước quay lại danh sách lớp. Lịch dùng UTC+7, trạng thái hủy và số chỗ theo backend.
- `/register` gửi email registration; 202 không phải login. `/verify-email` xác thực khi người dùng bấm nút, thiết lập session HttpOnly. Backend cần cấu hình FRONTEND_BASE_URL/EMAIL_VERIFICATION_PATH đúng frontend triển khai.
- `/cart`: giỏ, xóa lớp, badge header, checkout toàn bộ PAYOS và danh sách đơn chờ phân trang để mở lại giao dịch gián đoạn.
- `/checkout/[orderId]`: đọc đơn thuộc phiên STUDENT, create/reuse payOS, QRCodeSVG từ payload backend, URL fallback, countdown và polling có giới hạn. Không tự checkout lại khi reload; PAID từ backend xác nhận hoàn tất.
- `/payment/result`: chỉ forward orderCode provider hợp lệ để mapping, bỏ qua status/cancel từ URL. Login returnTo mở rộng bằng allowlist cho cart/checkout/result.
- Google và compiler chưa triển khai. Admin tracking/reconciliation đã được thêm ở các route được nêu dưới đây. Thêm vào giỏ không đồng nghĩa enrollment ACTIVE.

## Commerce và shadcn — 15/10/2026

UI luồng mới dùng shadcn Button/Card/Badge/Alert/Skeleton/Separator và Sonner, mã nguồn tại `components/ui`, cấu hình `components.json`. Token semantic tham chiếu palette Mindy; giữ Tailwind v4 và Nunito. QR dùng `qrcode.react`, không dựng payload ngân hàng từ ID.

Module `cart` sở hữu giỏ/add/remove; `orders` sở hữu checkout, danh sách đơn chờ và đọc đơn; `payments` sở hữu chuẩn bị link và QR. Server state có user ID trong query key. Session được giữ nguyên observer khi logout/login, cancel và xóa query riêng tư trước khi hiển thị phiên tiếp theo.

`CommerceShell` dùng `features/auth/components/auth-guard.tsx` để kiểm tra phiên ACTIVE và quyền STUDENT trước khi mount nội dung `/cart`, `/checkout/[orderId]`, `/payment/result`. Guest, tài khoản thiếu quyền hoặc API trả 401/403 được `router.replace('/')`; lỗi kết nối giữ trạng thái thử lại. Guard chờ refresh phiên hiện có; không tự chuyển sang login. Link login chủ động vẫn hỗ trợ returnTo đã validate.

Client/route hỗ trợ DELETE. Proxy chỉ allowlist cart/order/payment cho STUDENT upstream, kiểm UUID/body/query và Origin cho POST/DELETE, cookie HttpOnly và no-store. Không proxy webhook/admin. DTO order/payment kiểm cùng orderId và amount. Không tự retry checkout; khi mất response đọc lại giỏ và đơn chờ.

Payment CREATING retry 2/4/8 giây (tối đa 3 lần), đọc lại đơn trước mỗi lần, hủy khi unmount. GET order poll 3–10 giây tối đa 5 phút mỗi chu kỳ, dừng background/kết thúc/review/quyền; nút kiểm tra mở chu kỳ mới. Countdown hết hạn ẩn QR và refetch, không tự đổi trạng thái backend.

## Kiểm tra

`npm run check` chạy lint, format, types, unit tests, production build và E2E. Unit tests kiểm tra cookie boundary, DTO và proxy allowlist/Origin. Playwright chạy production server riêng ở port 3103, có mock API ổn định; kiểm tra giao diện desktop/mobile, filter, login success/error và Web Storage không có token. Live catalog smoke được ghi riêng trong API contracts; không coi mocked login là live login.

Next config hỗ trợ `MINDY_DIST_DIR` cho build output riêng trong lúc preview chạy. Dùng cùng env khi build và start/test; mặc định vẫn `.next`. Không ghi đè output của production server đang chạy vì CSS/JS hash có thể mất khớp. `.next-*` gitignored, loại khỏi lint/format.

## Khu vực tài khoản học viên — 15/10/2026

- Các route `/user/profile`, `/user/orders`, `/user/schedule`, `/user/courses` dùng UserShell và AuthGuard STUDENT ACTIVE. `/user` chuyển profile. Sidebar theo `origin/admin:src/components/layout/admin-shell.tsx`: desktop 228px/thu gọn 76px, active indicator, topbar và mobile dialog focus trap/Escape/scroll lock. Không nhập các module quản trị.
- Profile đọc session `/auth/me`, chưa có endpoint sửa hồ sơ nên không thêm form lưu giả. Đơn hàng dùng `/me/orders` + filter status/page; link order payOS tái sử dụng checkout để đọc trạng thái, không tự tạo đơn mới.
- Khóa học dùng `/me/classes` với current/history/all và enrollmentId làm key. Không tự cấp quyền theo order PAID; accessReason/canViewSchedule từ backend quyết định trạng thái UI.
- Lịch 7 cột ngang Thứ 2–Chủ nhật, tuần theo UTC+7, mobile cuộn bảng trong vùng riêng. GET `/me/schedule` lấy đủ các trang, giữ CANCELLED và buổi qua đêm theo overlap. Điểm danh thật lấy từ `attendanceStatus`; `UNMARKED`/null không suy thành Vắng, còn `creditedAttendanceStatus` không thay thế điểm danh vật lý. Mentor nullable và metadata buổi học bù được giữ trong DTO.
- Browser vẫn same-origin `/api/v1`; proxy bổ sung đúng hai GET list, strict query, validate DTO và cookie access_token/no-store. Session/user ID nằm trong query key; dữ liệu riêng tư được xóa bởi luồng đổi phiên hiện có.

Cập nhật 16/10: user orders/courses hiển thị dạng bảng, dữ liệu chi tiết từ list DTO mở qua `UserDetailsDialog`. Calendar dùng cùng dialog với ScheduleEvent đã tải; không phát sinh API hay quyền mới. Link payOS/schedule/public course nằm trong dialog và chỉ điều hướng khi bấm.
