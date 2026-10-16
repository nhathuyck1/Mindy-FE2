# Kiến trúc Mindy FE2

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

- `/manager` chuyển đến `/manager/materials`; `/manager/collections` là sổ phiếu thu cục bộ. `ManagerShell` dùng shell/CSS quản trị hiện có, menu desktop thu gọn/mobile sheet; chỉ mount nghiệp vụ cho MANAGER ACTIVE, key theo user ID. Staff login đưa MANAGER đến `/manager`; menu tài khoản có liên kết riêng.
- `features/manager` sở hữu UI, Query hooks, upload và receipt repository. DTO Material tái sử dụng contract chung với Mentor; manager filters/reject/upload scope có validation riêng. `lib/api/manager-rules.server.ts` sở hữu allowlist chính xác, không mở API thu tiền Manager chưa có contract.
- Query key gồm user/filter/page, không poll tài liệu; refetch sau mutation/focus. Detail/editor giữ revision đã xem khi xác nhận/lưu, 409 không tự retry. Signed URLs nằm trong component memory, hủy request khi unmount. Bài viết preview trong iframe sandbox với CSP chặn script/network; các ảnh inline có luồng lấy liên kết riêng.
- `ReceiptRepository` có implementation `localReceiptRepository`: localStorage theo user, runtime validation, trạng thái DRAFT/RECORDED_LOCAL/CANCELLED, xuất CSV chống formula injection. Không gọi API thanh toán hoặc đổi order/enrollment. Khi có contract thu tiền MANAGER, thay adapter và nối nguồn học viên/đơn thực tế.

## Tích hợp admin có chọn lọc — 16/10/2026

Admin nằm ở app/admin, features/admin và components/layout/admin-shell.tsx. Chỉ ghép bổ sung vào nền Booking; không thay code các tính năng public, student và commerce. lib/api/admin-rules.server.ts sở hữu allowlist/schema admin; proxy giữ toàn bộ rules học tập/commerce hiện có và bổ sung PATCH/PUT cho admin.

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
- Google, compiler và quản trị chưa triển khai. Thêm vào giỏ không đồng nghĩa enrollment ACTIVE.

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
- Lịch 7 cột ngang Thứ 2–Chủ nhật, tuần theo UTC+7, mobile cuộn bảng trong vùng riêng. GET `/me/schedule` lấy đủ các trang, giữ CANCELLED và buổi qua đêm theo overlap. Không hiển thị attendance/mentor theo buổi đang nằm ở roadmap Phase 4.4c.
- Browser vẫn same-origin `/api/v1`; proxy bổ sung đúng hai GET list, strict query, validate DTO và cookie access_token/no-store. Session/user ID nằm trong query key; dữ liệu riêng tư được xóa bởi luồng đổi phiên hiện có.

Cập nhật 16/10: user orders/courses hiển thị dạng bảng, dữ liệu chi tiết từ list DTO mở qua `UserDetailsDialog`. Calendar dùng cùng dialog với ScheduleEvent đã tải; không phát sinh API hay quyền mới. Link payOS/schedule/public course nằm trong dialog và chỉ điều hướng khi bấm.
