# Kiến trúc Mindy FE2

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
- Nút “Đăng ký học ngay” mở lớp/lịch công khai. Chỉ “Đăng ký lớp này” mới cần tài khoản STUDENT và thêm lớp vào giỏ qua API. Guest đi `/login?returnTo=...`, có link `/register`; login quay lại đúng khóa học/lớp và không tự mutation. Return path chỉ cho phép route courses + UUID đã kiểm tra.
- Dialog native hỗ trợ Escape, focus trap/restore và scroll lock; mobile có bước quay lại danh sách lớp. Lịch dùng UTC+7, trạng thái hủy và số chỗ theo backend.
- `/register` gửi email registration; 202 không phải login. `/verify-email` xác thực khi người dùng bấm nút, thiết lập session HttpOnly. Backend cần cấu hình FRONTEND_BASE_URL/EMAIL_VERIFICATION_PATH đúng frontend triển khai.
- Chưa tạo order/hold/payment/checkout, Google, compiler hoặc quản trị. Thêm vào giỏ không đồng nghĩa enrollment ACTIVE.

## Kiểm tra

`npm run check` chạy lint, format, types, unit tests, production build và E2E. Unit tests kiểm tra cookie boundary, DTO và proxy allowlist/Origin. Playwright chạy production server riêng ở port 3103, có mock API ổn định; kiểm tra giao diện desktop/mobile, filter, login success/error và Web Storage không có token. Live catalog smoke được ghi riêng trong API contracts; không coi mocked login là live login.

Next config hỗ trợ `MINDY_DIST_DIR` cho build output riêng trong lúc preview chạy. Dùng cùng env khi build và start/test; mặc định vẫn `.next`. Không ghi đè output của production server đang chạy vì CSS/JS hash có thể mất khớp. `.next-*` gitignored, loại khỏi lint/format.
