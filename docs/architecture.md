# Kiến trúc Mindy FE2

Stack: Next.js App Router, React, TypeScript strict, Tailwind CSS v4, TanStack Query, Redux Toolkit và shadcn/ui cho Admin. App chạy port 3003; API cấu hình trong `.env.local` theo `.env.example`.

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
    admin/             # Admin overview/users/courses/classes/workflow
  components/
    layout/            # Header, footer, navigation
    ui/                # Brand, icon, action link
  features/
    home/              # Các section và catalog homepage
    auth/              # Login/session Query hooks và UI
    admin/             # Protected admin, DTO/query/resource table and editors
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

Dashboard Admin dùng Card/Chart shadcn và Recharts. `admin-overview-queries.ts` giữ ba Query snapshot users/courses/classes, tải đủ pagination qua adapter hiện có và không công bố tổng hợp nếu dữ liệu thiếu/trùng hoặc total thay đổi giữa các trang. Query key `['admin', resource, 'overview']` nhận invalidation sau CRUD và được xóa khi đổi phiên. `lib/admin-overview.ts` tổng hợp tháng theo Asia/Ho_Chi_Minh, đếm trạng thái/vai trò và xếp khóa học theo số lớp; components chỉ trình bày/chart và state bộ lọc thời gian.

Token màu ở `src/app/globals.css`, theo `docs/pallete.png`. Tailwind v4 dùng `@theme` và loader `@tailwindcss/turbopack` do create-next-app 16.4.1 tạo. Không thêm PostCSS xử lý Tailwind lần hai. Font Nunito Variable local qua Fontsource, có tiếng Việt; build không tải Google Fonts. Admin import Inter Variable (Fontsource) trong `app/admin/layout.tsx`; `html:has([data-admin-root])` đổi `--font-sans` sang `--font-admin` để portal cũng dùng Inter. Ảnh dùng next/image và sizes, ảnh API chỉ từ host allowlist.

## Phạm vi

- `/`: homepage theo Mindy-FE dev, palette docs; khóa học thật và bộ lọc danh mục, loading/error/empty.
- `/login`: email/password, cookie session và logout trong header.
- `/courses`: mẫu catalog người dùng gửi, tìm kiếm không dấu, lọc danh mục/hình thức/học phí, sắp xếp giá/tên, grid/list và phân trang. Search/price/sort chạy trên toàn bộ các trang API đã tải vì backend chưa có q/sort.
- `/courses/[courseId]`: mẫu Stitch chi tiết, dùng palette config; giáo trình là danh sách học phần tĩnh (số thứ tự/tên/mô tả, không hiển thị % điểm yêu cầu), mentor thật và lớp liên quan. Không bịa review, video học thử, số học viên hoặc cam kết hoàn tiền.
- Nút “Đăng ký học ngay” mở lớp/lịch công khai. Chỉ “Đăng ký lớp này” mới cần tài khoản STUDENT và thêm lớp vào giỏ qua API. Guest đi `/login?returnTo=...`, có link `/register`; login quay lại đúng khóa học/lớp và không tự mutation. Return path chỉ cho phép route courses + UUID đã kiểm tra.
- Dialog/Sheet shadcn/ui (Radix) hỗ trợ Escape, focus trap/restore và scroll lock; mobile có bước quay lại danh sách lớp. Lịch dùng UTC+7, trạng thái hủy và số chỗ theo backend.
- `/register` gửi email registration; 202 không phải login. `/verify-email` xác thực khi người dùng bấm nút, thiết lập session HttpOnly. Backend cần cấu hình FRONTEND_BASE_URL/EMAIL_VERIFICATION_PATH đúng frontend triển khai.
- `/admin`: shell theo ảnh sidebar/admin table; tổng quan, users/courses/classes dùng bảng chung và hướng dẫn workflow. ADMIN ACTIVE, GET list có cookie/Zod, filter server, search/sort trong trang, chọn dòng/CSV/cột/dialog. Chi tiết ở [admin-template.md](admin-template.md).
- Login ADMIN mặc định đến `/admin`; ưu tiên returnTo hợp lệ. Đổi phiên giữ query session đang được observe và xóa cache khác để guard/header cập nhật đồng thời.
- `/cart`: giỏ, xóa lớp, badge header, checkout toàn bộ PAYOS và danh sách đơn chờ phân trang để mở lại giao dịch gián đoạn.
- `/checkout/[orderId]`: đọc đơn thuộc phiên STUDENT, create/reuse payOS, QRCodeSVG từ payload backend, URL fallback, countdown và polling có giới hạn. Không tự checkout lại khi reload; PAID từ backend xác nhận hoàn tất.
- `/payment/result`: chỉ forward orderCode provider hợp lệ để mapping, bỏ qua status/cancel từ URL. Login returnTo mở rộng bằng allowlist cho cart/checkout/result.
- Google và compiler chưa triển khai. Admin writes theo allowlist riêng. Thêm vào giỏ không đồng nghĩa enrollment ACTIVE.

## Commerce và shadcn — 15/10/2026

UI luồng mới dùng shadcn Button/Card/Badge/Alert/Skeleton/Separator và Sonner, mã nguồn tại `components/ui`, cấu hình `components.json`. Token semantic tham chiếu palette Mindy; giữ Tailwind v4 và Nunito. QR dùng `qrcode.react`, không dựng payload ngân hàng từ ID.

Module `cart` sở hữu giỏ/add/remove; `orders` sở hữu checkout, danh sách đơn chờ và đọc đơn; `payments` sở hữu chuẩn bị link và QR. Server state có user ID trong query key. Session được giữ nguyên observer khi logout/login, cancel và xóa query riêng tư trước khi hiển thị phiên tiếp theo.

Client/route hỗ trợ DELETE. Proxy chỉ allowlist cart/order/payment cho STUDENT upstream, kiểm UUID/body/query và Origin cho POST/DELETE, cookie HttpOnly và no-store. Không proxy webhook; Admin dùng allowlist riêng. DTO order/payment kiểm cùng orderId và amount. Không tự retry checkout; khi mất response đọc lại giỏ và đơn chờ.

Payment CREATING retry 2/4/8 giây (tối đa 3 lần), đọc lại đơn trước mỗi lần, hủy khi unmount. GET order poll 3–10 giây tối đa 5 phút mỗi chu kỳ, dừng background/kết thúc/review/quyền; nút kiểm tra mở chu kỳ mới. Countdown hết hạn ẩn QR và refetch, không tự đổi trạng thái backend.

## Mentor — 16/10/2026

`MentorClassStudents` dùng primitives shadcn và các class bảng Admin chung cho roster của Mentor; không phụ thuộc query/actions của module Admin. Server filters orderStatus/paymentType và pagination nằm trong query key; tìm tên/sort chỉ trong trang. Status badge theo palette xanh/vàng/đỏ, skeleton dùng TableSkeleton chung. Không mở thêm endpoint hoặc quyền thu tiền.

Lịch dùng `useMentorWeek` với key theo user ID và thứ Hai của tuần. Loader lấy đủ các trang `mentor/schedule` trong khoảng thứ Hai 00:00 tới thứ Hai kế tiếp 00:00 UTC+7, kiểm total/ID trùng; không đưa lịch một phần vào bảng. `weekly-timetable.ts` nhóm theo ngày Việt Nam và sáu ca cố định 07:30–09:00, 09:30–11:00, 13:00–15:30, 16:00–17:30, 18:00–19:30, 20:00–21:30. Giữ đủ sáu ca; buổi ngoài khung được giữ ở hàng Khác. Ưu tiên ca chứa giờ bắt đầu, nếu bắt đầu trong giờ nghỉ lấy ca giao nhau nhiều nhất; giữ nguyên giờ BE và tách buổi qua nửa đêm theo ngày. Bảng tuần giữ đủ bảy cột, sticky cột ca, mobile cuộn trong panel; không có phân trang UI cho lịch tuần.

`/mentor` có shell riêng và guard MENTOR ACTIVE; lịch thực tế gồm buổi dạy thay. `/mentor/classes` liệt kê lớp; `/mentor/classes/[classId]` xem học viên (chỉ đọc trạng thái thanh toán), unit, học liệu và cấu hình release. `/mentor/sessions/[sessionId]` đọc context và điểm danh. Login MENTOR mặc định về `/mentor`, account menu có liên kết và returnTo chỉ nhận các route Mentor đã triển khai với UUID hợp lệ.

Module `features/mentor` sở hữu Zod contract, TanStack Query theo user ID/path/filter và UI. `mentor-rules.server.ts` mở allowlist riêng theo method/path/UUID/query/body; adapter giữ Origin, cookie access_token và no-store. Attendance gửi expectedVersion + UUID Idempotency-Key, không tự retry mutations; invalidation cả khi lỗi giúp đọc lại trạng thái sau mất response hoặc conflict. UI dùng permissions BE.

Học liệu ARTICLE/FILE/VIDEO sử dụng revision, canEdit và ownership; chỉ sửa/xóa nháp DRAFT/REJECTED chưa từng duyệt. Upload qua intent → PUT MinIO không credentials → complete → polling file status tối đa hai phút, có hủy. Chỉ file READY đúng Course Unit được dùng. Preview lấy signed URL theo yêu cầu, giữ trong memory và bỏ khỏi giao diện khi hết hạn; HTML hiển thị trong iframe sandbox/CSP. Unit release gửi OPEN/LOCKED và unlockAt timezone rõ ràng, COMPLETED không cho thao tác.

Không có cash-orders/confirm trong allowlist hay UI. Đồng bộ roster chỉ nhận học viên do BE xác định đã đủ điều kiện. Không triển khai xin nghỉ/bù, assignment, recovery/audit hoặc tự duyệt nội dung.

## Kiểm tra tự động

`npm run check` chạy lint, format, types, unit tests, production build và E2E. Unit tests kiểm tra cookie boundary, DTO và proxy allowlist/Origin. Playwright chạy production server riêng ở port 3103, có mock API ổn định; kiểm tra giao diện desktop/mobile, filter, login success/error và Web Storage không có token. Live catalog smoke được ghi riêng trong API contracts; không coi mocked login là live login.

Next config hỗ trợ `MINDY_DIST_DIR` cho build output riêng trong lúc preview chạy. Dùng cùng env khi build và start/test; mặc định vẫn `.next`. Không ghi đè output của production server đang chạy vì CSS/JS hash có thể mất khớp. `.next-*` gitignored, loại khỏi lint/format.

## Xem học viên theo lớp — 15/10/2026

Nút Học viên trên bảng lớp của `/admin` và `/admin/classes` mở Dialog shadcn/ui, query theo classId và page; GET `/admin/classes/:classId/students?page=1&pageSize=20`. Đối chiếu Swagger live và `AdminClassStudentDto`/flow Phase 4 BE: tên/email/phone, studentStatus, enrollmentId/enrollmentStatus và enrolledAt nullable; response `{items,page,pageSize,total}`. Danh sách theo BE gồm chờ thanh toán/đang học/hoàn thành, không phải roster điểm danh. Chỉ mở đúng GET list có UUID/pagination strict và access_token/private no-store; chưa mở student detail hoặc mutations. Có loading/error/retry/empty/phân trang; query chỉ mount khi bấm nút.
