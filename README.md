# Mindy FE2

Frontend Mindy Coding: **Next.js App Router + Tailwind CSS v4 + TypeScript + TanStack Query + Redux Toolkit**.

Khởi tạo bằng create-next-app, tham khảo cấu trúc và rules của [ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate). Homepage chuyển sang Tailwind từ [Mindy-FE dev](https://github.com/Quanhpm/Mindy-FE/tree/dev), giữ ảnh ếch và áp palette trong docs.

## Chạy local

Node.js >= 22.20.0, npm. `.env.local` đã cấu hình trong workspace; lần cài mới sao chép `.env.example` thành `.env.local`.

```bash
npm ci
npm run dev
```

Mở [http://localhost:3003](http://localhost:3003); [khóa học](http://localhost:3003/courses), [đăng nhập](http://localhost:3003/login), [đăng ký](http://localhost:3003/register).

```dotenv
API_BASE_URL=https://api.quanh123.id.vn/api/v1
APP_ORIGIN=http://localhost:3003
```

Base URL API không chứa `/docs#/`. APP_ORIGIN phải đúng origin mở app; production dùng HTTPS. Font/mascot phục vụ local.

## Phạm vi đã gắn

Homepage đọc khóa học và danh mục thật. Email login theo backend lưu cookie HttpOnly, đọc `/auth/me`, refresh và logout; TanStack Query giữ dữ liệu API, Redux giữ UI. Không lưu token trong Redux/localStorage/sessionStorage. Google Login tạm hoãn, chưa cấu hình.

Catalog và chi tiết khóa học/lớp/lịch xem công khai. Nút đăng ký lớp mới yêu cầu login/registration và giữ lớp đã chọn khi quay lại. Email registration cần xác thực qua `/verify-email`; tài khoản STUDENT có thể thêm lớp vào giỏ theo API thật. Chưa tạo order/hold/payment/checkout, hoặc compiler. Admin có tạo/sửa/chuyển trạng thái theo docs/admin-template.md. Khu vực code homepage chỉ là ví dụ.

Template [Admin](http://localhost:3003/admin) gồm tổng quan và bảng users/courses/classes theo ảnh trong docs, dùng GET API thật và quyền ADMIN ACTIVE; có lọc, phân trang, CSV, chọn cột và xem thông tin. ADMIN login mặc định đến trang quản trị. Xem [admin-template.md](docs/admin-template.md) cho contract và phạm vi mở rộng.

## Kiểm tra

```bash
npx playwright install chromium
npm run check
```

Hoặc chạy riêng `lint`, `format:check`, `check:types`, `test`, `build`, `test:e2e`. `npm run format` sửa format, `npm run start` chạy production port 3003. E2E dùng production build trên port 3103, dữ liệu mock và screenshot trong `test-results/` (gitignored). Live GET catalog đã kiểm tra; chưa đăng nhập bằng tài khoản backend thật.

Khi cần build/check trong lúc production preview đang mở, đặt `MINDY_DIST_DIR` sang thư mục `.next-*` khác (PowerShell: `$env:MINDY_DIST_DIR = '.next-review'`) cho cả build và test/start. Không build đè vào thư mục của server đang chạy; build hoàn tất rồi mới khởi động preview bằng output mới để tránh CSS/JS cũ không khớp.

## Tài liệu

- [AGENTS.md](AGENTS.md): coding rules, state/API boundaries.
- [Kiến trúc](docs/architecture.md).
- [UI rules](docs/ui-rules.md): palette và nguồn asset/commit.
- [API contracts](docs/api-contracts.md): Swagger và api_flow backend.
- [Tiến độ](docs/progress.md).

## Dependency audit

Ngày 15/10/2026: 5 mục high ở chuỗi dependency development của ESLint Next.js (`braces` → `micromatch` → `fast-glob`). npm chưa đề xuất bản vá tương thích; `audit fix --force` sẽ hạ eslint-config-next về Next.js 14 nên không áp dụng. Kiểm tra lại khi upstream có bản vá. Production runtime kiểm tra riêng bằng `npm run audit:prod` (`npm audit --omit=dev`); CI nên dùng lệnh này cho bước audit.
