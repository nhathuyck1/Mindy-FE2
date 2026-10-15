# Mindy FE2 — Quy tắc phát triển

Tham khảo [AGENTS.md của ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate/blob/main/AGENTS.md), điều chỉnh cho frontend Mindy dùng Next.js và Tailwind. Đây là rules chính thức của dự án; chỉ áp dụng các công cụ đang được cài đặt.

## Đọc trước khi sửa

- `docs/architecture.md`: phạm vi, cấu trúc và ranh giới module.
- `docs/ui-rules.md`: palette, nguồn homepage và quy tắc giao diện.
- `docs/progress.md`: tính năng đã triển khai và việc còn lại.
- Khi làm Admin, đọc `docs/admin-template.md`: mẫu sidebar/table, quyền và ranh giới GET/mutation.
- `docs/pallete.png`: nguồn màu; `docs/logo.jpg`: logo. Giữ nguyên các tài liệu ảnh này.

## Nguyên tắc

- Ưu tiên rõ ràng, nhất quán; thay đổi vừa đủ và theo pattern hiện có.
- TypeScript strict; không dùng `any` hoặc ép kiểu để che lỗi. Dùng narrowing.
- Named exports; default export chỉ dùng khi framework/config yêu cầu.
- Import bằng `@/`; dùng đường dẫn tương đối cho file cùng thư mục.
- Tên file kebab-case; component PascalCase; tên page kết thúc bằng `Page`.
- Giữ component và hàm gọn. Tách khi có trách nhiệm riêng, tránh tạo abstraction hoặc thư mục chưa dùng.
- Không thêm dependency nếu API có sẵn đáp ứng tốt nhu cầu. Không thêm database/ORM hay auth provider demo vào frontend.
- Không sửa `../Mindy-FE` hoặc `../Mindy-BE` khi nhiệm vụ chỉ dành cho FE2.

## React và Next.js

- `app` chỉ chứa route composition, layout, metadata và file convention Next.js.
- UI nghiệp vụ ở `features/<feature>`; UI dùng lại ở `components/ui`; shell ở `components/layout`.
- Mặc định Server Components. Chỉ dùng `use client` ở ranh giới thật sự cần state, event hoặc browser API.
- Tránh effect và memo hóa không cần thiết. Không thêm animation library chỉ để hiện nội dung.
- Với component mới, ưu tiên một tham số `props` có type rõ ràng; dùng `React.ReactNode` cho children.
- Khi thêm dynamic route, đọc API của phiên bản Next.js đang cài; không giả định `params`/`searchParams` đồng bộ.
- Dùng `next/image` với alt, tỷ lệ và sizes phù hợp. Hero dùng preload; ảnh trang trí có alt rỗng.
- Giữ metadata và `lang="vi"`; font phải hỗ trợ tiếng Việt.

## Styling

- Theo yêu cầu người dùng: ưu tiên component shadcn/ui cho giao diện Admin và UI mới. Nguồn ở `src/components/ui`, cấu hình `components.json`; dùng lại Button/Table/Input/Badge/Checkbox/Dialog/Sheet/NativeSelect/Popover, tùy biến theo palette Mindy và typography hiện có. Không tự tạo lại primitive đã có.

- Tailwind CSS v4. Token màu tập trung trong `src/app/globals.css` bằng `@theme`.
- Palette bắt buộc: trắng `#FFFFFF`, mint `#338A85`, forest `#1D5B57`, coral `#FF7F50`, headsup `#FF5400`.
- Không hard-code hex trong JSX, không tự thêm theme. Các màu nhạt pha từ token gốc.
- Dùng lại `page-container`, `section-title`, `eyebrow`, `text-link` và component chung.
- Responsive từ 320px trở lên; kiểm tra desktop/mobile, focus, bàn phím, tương phản và reduced motion.
- Giữ mascot ếch gốc; dùng thêm hai tư thế ếch do người dùng yêu cầu ngày 15/10/2026 cho phần giới thiệu. Không thay mascot bằng emoji. File nguồn, commit và prompt có trong `docs/ui-rules.md`.
- Không tạo link chết, số liệu giả hoặc dữ liệu khóa học giả để lấp giao diện.

## State, API và bảo mật — phạm vi cập nhật 15/10/2026

- Stack bổ sung: TanStack Query và Redux Toolkit. Đọc `docs/api-contracts.md` trước khi sửa API.
- TanStack Query sở hữu server state: khóa học, danh mục, phiên đăng nhập và mutations. Không sao chép các dữ liệu này vào Redux.
- Redux Toolkit sở hữu client state dùng chung; hiện là mobile navigation. Store và QueryClient tạo theo instance provider, không dùng singleton server. Dùng typed hooks, query key có filter; không tự retry auth mutation.
- Browser chỉ gọi same-origin `/api/v1`. Upstream `API_BASE_URL=https://api.quanh123.id.vn/api/v1` nằm trong env server, được validate tại `src/lib/env.server.ts`.
- Phạm vi đã mở rộng theo yêu cầu 15/10/2026: homepage, courses/detail/open classes/timetable public, email login/register/verify và thêm lớp đã chọn vào cart. Proxy phải có method/path allowlist; dynamic IDs validate UUID. Checkout/order/payment chưa thuộc lần này.
- Google Login tạm hoãn theo yêu cầu mới nhất. Không thêm Google provider, client ID, callback, route hoặc nút Google lúc này.
- Phạm vi mở rộng Admin 15/10/2026: ADMIN ACTIVE được xem list/detail users/courses/classes và học viên theo lớp; tạo user/đổi trạng thái, tạo danh mục/khóa học/học phần, sửa/sắp xếp/kích hoạt khóa học, tạo/sửa lớp, lịch buổi và chuyển trạng thái lớp. Theo allowlist `admin-rules.server.ts`, UUID/query/body/response strict, kiểm Origin cho writes, chỉ forward access_token. Backend sở hữu phân quyền; chưa mở DELETE, sửa hồ sơ user, tắt khóa học, mentor assignment, attendance/payment.
- Đối chiếu Swagger live, `../Mindy-BE/docs/api_flow` và DTO trước khi sửa contract. Tài liệu local không đồng nghĩa đã deploy. Input/output API dùng Zod.
- Backend lưu `access_token` và `refresh_token` trong cookie HttpOnly. Adapter chỉ chuyển đúng cookie name/path, host-only, SameSite=Lax và Secure khi HTTPS. Không trả token trong JSON hay lưu trong Redux/Query/Web Storage.
- Backend sở hữu auth, phân quyền và giao dịch. Không lưu raw token trong localStorage/sessionStorage.
- Secret chỉ ở server; không commit file `.env`. Chỉ public dữ liệu thật sự cần qua `NEXT_PUBLIC_`.
- Env mẫu ở `.env.example`, local ở `.env.local`. Không đọc env rải rác trong component.

## Kiểm tra và tài liệu

- Dùng npm và `package-lock.json`; không thêm lockfile thứ hai.
- `npm run dev`: port 3003. `npm run start`: production ở port 3003.
- `npm run lint`, `npm run format:check`, `npm run check:types`, `npm run test`, `npm run build`.
- `npm run test:e2e`: Playwright desktop/mobile trên production build, port 3103. Lần đầu chạy `npx playwright install chromium`.
- `npm run check`: chuỗi kiểm tra đầy đủ. Sửa lỗi liên quan trước khi kết thúc.
- Test hành vi quan trọng; không viết test chỉ lặp lại chi tiết implementation.
- Cập nhật `docs/progress.md` khi hoàn tất một giai đoạn. Cập nhật architecture/ui-rules khi thay đổi convention hoặc thiết kế.
- Debug bằng giả thuyết có thể kiểm chứng; không sửa lan rộng theo phỏng đoán.
- Conventional Commits: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`. Không tự commit/push nếu người dùng chưa yêu cầu.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
