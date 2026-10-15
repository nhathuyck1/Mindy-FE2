# Kế hoạch giỏ hàng và thanh toán QR

Ngày lập: 15/10/2026. Trạng thái: đã triển khai frontend và kiểm thử mock; chưa nghiệm thu giao dịch tiền thật.

## 1. Mục tiêu và phạm vi

Triển khai tiếp trên **Mindy-FE2** theo luồng người dùng yêu cầu:

**Bấm Giỏ hàng → xem lớp và tổng tiền → bấm Thanh toán → hiển thị QR → chờ backend xác nhận → thông báo thành công.**

- Dùng **shadcn/ui** cho các thành phần giao diện của luồng mới.
- Dùng **qrcode.react**, ưu tiên `QRCodeSVG`, để render QR tại frontend.
- Thanh toán online bằng payOS; checkout toàn bộ giỏ và tạo một order PAYOS.
- Giữ palette Mindy, font Nunito, header/footer và quy tắc responsive hiện có.
- Kế hoạch đã được triển khai theo yêu cầu tiếp theo; kết quả kiểm tra ghi trong docs/progress.md.
- CASH, trang quản trị và lịch sử đơn hàng đầy đủ dành cho giai đoạn sau. Có mục đơn chờ thanh toán tối thiểu để khôi phục giao dịch bị gián đoạn.

## 2. Hiện trạng đã kiểm tra

| Phần              | Hiện trạng                                       | Việc cần làm                                     |
| ----------------- | ------------------------------------------------ | ------------------------------------------------ |
| Thêm lớp vào giỏ  | Có `useAddCartItem`, CartDto/Zod và POST proxy   | Đồng bộ cache giỏ và số lượng trên header        |
| Trang giỏ hàng    | Chưa có `/cart`                                  | Hiển thị giỏ, xóa lớp, tổng tiền và CTA          |
| Checkout          | Backend có; FE2 chưa nối                         | Tạo order PAYOS và chuyển sang màn hình QR       |
| Thanh toán        | Backend có create/reuse link và đọc trạng thái   | Thêm schema, API hooks, QR và polling            |
| shadcn/ui         | Chưa có `components.json` và bộ primitive shadcn | Cấu hình vào dự án hiện tại                      |
| HTTP client/route | Chỉ hỗ trợ GET và POST                           | Bổ sung DELETE cho thao tác xóa lớp              |
| Same-origin proxy | Chỉ cho add-cart trong commerce                  | Mở allowlist chính xác cho cart/order/payment    |
| Login returnTo    | Chỉ chấp nhận route courses                      | Bổ sung cart, checkout và payment result an toàn |

Đã đọc `AGENTS.md`, `docs/architecture.md`, `docs/ui-rules.md`, `docs/progress.md`, `docs/api-contracts.md`; đối chiếu controller/DTO commerce/payments của backend và Swagger live `/docs-json` ngày 15/10/2026.

Swagger live có các endpoint ở mục 6 và `PaymentDto.qrCode` nullable. Việc endpoint được mô tả không chứng minh payOS đã bật hay giao dịch thực đã nghiệm thu. Khi implement cần kiểm tra lại contract trước khi nối API.

## 3. Luồng UI cụ thể

### 3.1. Điểm vào giỏ hàng

- Thêm nút Giỏ hàng ở header desktop/mobile, có accessible label và badge số lớp khi có phiên STUDENT.
- Sau khi thêm lớp thành công, báo “Đã thêm lớp vào giỏ hàng” kèm thao tác “Xem giỏ hàng”. Không tự checkout.
- Guest vào `/cart` được dẫn tới `/login?returnTo=/cart`; sau đăng nhập quay về giỏ.
- Tài khoản khác STUDENT nhận thông báo phù hợp, không gọi mutation checkout.

### 3.2. Trang `/cart`

- Desktop: danh sách lớp bên trái, Card tổng thanh toán bên phải; mobile xếp một cột, CTA rõ ràng và không che nội dung.
- Mỗi lớp có tên khóa học, tên/mã lớp, hình thức, ngày học, học phí hiện tại và nút “Xóa”. Mỗi lớp là một suất đăng ký; không có tăng/giảm số lượng.
- Dùng `currentPriceAmount` và `totalAmount` từ backend. Nếu khác `priceSnapshot`, báo giá đã cập nhật.
- Lớp `isPurchasable=false` có cảnh báo; chặn checkout và hướng dẫn xóa/lựa chọn lại lớp.
- Empty state có nút về `/courses`; loading dùng Skeleton, lỗi dùng Alert và nút thử lại.
- CTA chính: **“Thanh toán”**. Không có bước form trung gian; không hỏi lại thông tin tài khoản backend đã có.
- Hiển thị mục “Đơn đang chờ thanh toán” từ API để người dùng mở lại QR của đơn trước, kể cả khi giỏ đã trống.

### 3.3. Bấm “Thanh toán”

1. Khóa CTA trong lúc xử lý; gửi `POST /me/cart/checkout` với `{ paymentType: "PAYOS" }`.
2. Validate `{ orders: [...] }`; PAYOS theo contract có một order. Nếu response bất thường, hiển thị lỗi có thể khôi phục thay vì chọn order tùy ý.
3. Nhận `orders[0].id`, cập nhật/invalidate giỏ và danh sách đơn chờ. Backend đã chuyển giỏ thành order và giữ chỗ.
4. Chuyển ngay tới **`/checkout/[orderId]`** với trạng thái “Đang chuẩn bị mã QR”.
5. Trang đọc order trước. Nếu PENDING/PAYOS còn hạn và chưa có payment dùng được, gọi API create/reuse payment link cho **chính order đó**.
6. Khi nhận `qrCode`, render QR cùng số tiền, mã đơn Mindy, hạn thanh toán và trạng thái.

QR nằm trong trang riêng để reload, chia sẻ URL giữa các phiên của cùng tài khoản và mở lại sau khi chuyển app ngân hàng. Cả desktop/mobile dùng cùng route; không bắt người dùng đi qua màn hình checkout thứ hai để xác nhận.

### 3.4. Màn hình QR `/checkout/[orderId]`

- Desktop: QR ở vùng chính, tóm tắt các lớp/đơn ở cột bên; mobile xếp một cột.
- Hiển thị `orderCode` của Mindy, tổng tiền VND nguyên, thời gian còn lại từ `expiresAt` và hướng dẫn quét bằng app ngân hàng.
- Nút “Mở trang thanh toán payOS” dùng `checkoutUrl` đã validate để hỗ trợ thanh toán trên cùng điện thoại.
- Nút “Kiểm tra thanh toán” chỉ refetch trạng thái từ backend.
- Tự cập nhật kết quả; khi `order.status=PAID`, thay vùng QR bằng thông báo thành công ngay trên trang, số tiền và mã đơn.
- Có link “Tiếp tục khám phá” về `/courses`. Chỉ thêm link lớp đã mua khi route đích thực sự được triển khai.
- “Quay lại giỏ hàng” chỉ điều hướng, không hủy order hoặc trả lại lớp vào giỏ.

### 3.5. Trang `/payment/result`

- Hỗ trợ return/cancel URL của payOS bằng route backend đã quy ước.
- Lấy `orderCode` dạng chuỗi số từ query, gọi API mapping để tìm order của người đăng nhập.
- Chỉ dùng trạng thái backend để render kết quả; query `status`, `code`, `cancel`, `id` của provider không xác nhận đã trả tiền hoặc hủy đơn.
- Nếu PENDING, tiếp tục chờ/kiểm tra hoặc mở lại `/checkout/[orderId]`; nếu PAID thì hiện thành công.
- Nếu cần đăng nhập lại, giữ đúng returnTo đã validate, rồi đọc lại trạng thái; không tự tạo đơn mới.

## 4. QR và các loại mã ID

| Trường                         | Vai trò                                               |
| ------------------------------ | ----------------------------------------------------- |
| `order.id` / `payment.orderId` | UUID nội bộ, dùng route và đọc đơn                    |
| `order.orderCode`              | Mã đơn Mindy để hiển thị cho người dùng               |
| `payment.paymentId`            | UUID giao dịch nội bộ                                 |
| `payment.providerOrderCode`    | Mã số payOS, dùng mapping return URL                  |
| `payment.qrCode`               | Chuỗi payload QR thanh toán do backend/payOS cung cấp |
| `payment.checkoutUrl`          | URL trang thanh toán payOS, dùng fallback             |

**Chốt cách làm:** React tạo hình QR bằng `QRCodeSVG` với `value={payment.qrCode}`. Chuỗi ID bất kỳ có thể mã hóa thành QR, nhưng để app ngân hàng hiểu và thanh toán đúng đơn cần dùng payload thanh toán backend trả về. Không tự dựng payload ngân hàng từ orderId/paymentId.

- QR chỉ hiện khi order PENDING còn hạn, payment PENDING và có payload không rỗng.
- Dùng nền trắng, mã tối, khoảng trắng quanh QR theo API của phiên bản thư viện được chọn; không chèn logo hoặc cắt góc làm khó quét. Kích thước mục tiêu 240–280px, co phù hợp từ 320px.
- Nếu `qrCode=null` nhưng có `checkoutUrl`: hiển thị nút mở payOS và giải thích chưa có QR nhúng. Không encode URL rồi trình bày như QR chuyển khoản ngân hàng.
- Nếu cả hai chưa có và payment CREATING: tiếp tục trạng thái chuẩn bị, có cơ chế retry có giới hạn.
- DTO hiện chưa có số tài khoản/tên ngân hàng/nội dung chuyển khoản riêng; không tự thêm các thông tin này vào UI.

## 5. Components shadcn/ui

Cài vào dự án FE2 đang có theo hướng dẫn existing project; không tạo lại app. Cấu hình `components.json`, alias `@/components/ui`, tiện ích `cn` và các dependency đúng với component được chọn. Dùng npm và duy nhất `package-lock.json`.

| Thành phần UI                          | Component shadcn |
| -------------------------------------- | ---------------- |
| Nút giỏ hàng, thanh toán, xóa, thử lại | Button           |
| Khối tổng tiền, thông tin đơn, QR      | Card             |
| Số lớp và trạng thái                   | Badge            |
| Lỗi, giá thay đổi, chờ đối soát        | Alert            |
| Loading danh sách và payment           | Skeleton         |
| Phân cách thông tin                    | Separator        |
| Thông báo thêm/xóa lớp                 | Sonner           |

Chỉ thêm primitive thực sự dùng. QR là component nghiệp vụ bọc `QRCodeSVG` bên trong Card; layout dùng Tailwind. Các phần tử semantic như heading/list vẫn dùng HTML. Không tạo nút/card tự viết để thay cho primitive shadcn trong luồng này.

Map các semantic token shadcn (`background`, `foreground`, `primary`, `secondary`, `muted`, `border`, `ring`, trạng thái lỗi) về palette hiện có trong `globals.css`. Giữ Nunito và CSS/Tailwind v4 hiện tại, rà soát diff CSS do CLI sinh để tránh ghi đè thiết kế đang có. Giai đoạn này áp dụng shadcn vào luồng cart/payment và điểm vào header; việc chuyển toàn bộ UI cũ làm riêng nếu được yêu cầu.

## 6. API và proxy cần nối

Browser gọi cùng origin `/api/v1`; bảng dưới ghi path phía sau prefix này.

| Method / endpoint                         | Input                                | Output / cách dùng                    |
| ----------------------------------------- | ------------------------------------ | ------------------------------------- |
| GET `/me/cart`                            | Cookie phiên                         | CartDto, giỏ và badge                 |
| POST `/me/cart/items`                     | `{ classId }`, đã có                 | CartDto; cập nhật cache               |
| DELETE `/me/cart/items/:classId`          | UUID                                 | 204; invalidate giỏ                   |
| POST `/me/cart/checkout`                  | `{ paymentType: "PAYOS" }`           | 201 `{ orders: OrderDto[] }`          |
| POST `/me/orders/:orderId/payments/payos` | `{}`                                 | 201 PaymentDto, create hoặc reuse     |
| GET `/me/orders/:orderId`                 | UUID                                 | OrderPaymentDto; `payment` nullable   |
| GET `/me/orders/payment-result`           | `orderCode` chuỗi số hợp lệ          | OrderPaymentDto mapping từ provider   |
| GET `/me/orders`                          | `status=PENDING`, `page`, `pageSize` | OrderPageDto, khôi phục đơn gián đoạn |

- Mở method/path allowlist chính xác; validate UUID, query, body và response bằng Zod theo Swagger/DTO. Xử lý route `payment-result` riêng trước route UUID.
- Thêm DELETE vào `apiRequest` và export DELETE ở route handler; giữ xử lý 204 không parse JSON.
- Mở kiểm tra Origin cho DELETE như POST, không chỉ riêng checkout. Chỉ chuyển cookie auth cần thiết; giữ `private, no-store`, timeout và validation hiện có.
- Không proxy webhook hoặc route admin qua browser. Backend sở hữu giữ chỗ, giá cuối cùng và xác nhận tiền.
- Giữ `PAYOS_RETURN_URL`/`PAYOS_CANCEL_URL` phía backend trỏ tới `/payment/result` trên origin frontend triển khai. FE không tự gửi URL tùy ý khi tạo link.
- Mở rộng `safeReturnPath` theo allowlist cho `/cart`, `/checkout/:UUID`, `/payment/result?orderCode=...`; loại external URL/query thừa, giữ các route courses đang hỗ trợ.

## 7. State, retry và khôi phục

- TanStack Query quản lý cart, pending orders, order/payment. Query key có user ID và orderId tương ứng; chỉ enable khi có phiên STUDENT. Redux tiếp tục quản lý UI dùng chung, không sao chép server state.
- Add/remove cập nhật/invalidate cart và badge; checkout invalidate cart và pending orders. Khi thành công, invalidate order/pending orders và dữ liệu lớp liên quan nếu đã được dùng.
- Không tự retry mutation checkout khi timeout. Đọc lại giỏ và danh sách đơn chờ để tìm order đã tạo; backend có lock giỏ nhưng không có contract idempotency key để FE giả định.
- Nếu đã có order nhưng tạo payment lỗi, nút thử lại chỉ create/reuse payment trên cùng orderId. Reload trang đọc lại order trước khi cân nhắc mutation; không tạo order từ effect.
- Payment CREATING: retry create/reuse cùng order với backoff 2s → 4s → 8s, tối đa 3 lần tự động trong một chu kỳ chuẩn bị. Sau đó báo đang xử lý và cho thử lại thủ công; tránh request trùng khi rerender/Strict Mode.
- Payment PENDING: poll GET order khoảng 3s ban đầu, tăng tới 10s; tối đa 5 phút mỗi chu kỳ, dừng khi tab ẩn/unmount. Sau giới hạn, giữ trạng thái chờ và nút kiểm tra; focus trở lại thì refetch nếu còn phiên và đơn chưa kết thúc.
- Dừng vòng chờ QR khi PAID, EXPIRED, CANCELLED, REQUIRES_REVIEW, lỗi quyền hoặc phiên mất hiệu lực. Lỗi mạng có backoff, không chuyển thành đã thanh toán.
- Countdown dựa `expiresAt`, không hard-code TTL. Khi đồng hồ về 0, ẩn QR/CTA trả tiền và refetch; hết giờ ở máy khách không tự đổi trạng thái backend.
- Logout/đổi tài khoản phải hủy query và xóa cache riêng tư theo cơ chế session hiện có; không lộ QR/đơn của phiên trước.

| Tình huống                              | Hành vi UI                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Giỏ rỗng/lớp không còn mua được         | Chặn thanh toán, refetch và hướng dẫn sửa giỏ                               |
| Giá/chỗ học thay đổi khi checkout       | Hiện lỗi nghiệp vụ từ backend và tải lại giỏ; không tự tạo lại đơn          |
| 401 / 403 / 404                         | Đăng nhập lại / không có quyền / không tìm thấy; không lộ chi tiết đơn khác |
| PAYMENT_UNAVAILABLE / 503               | Báo thanh toán tạm gián đoạn, giữ đường mở lại order                        |
| Amount không hợp lệ / 422               | Hiện lỗi backend; không sửa số tiền hoặc tạo QR giả                         |
| Order PENDING, payment null             | Chuẩn bị payment cho cùng order nếu còn hạn                                 |
| Payment SUCCEEDED nhưng order chưa PAID | Tiếp tục đọc trạng thái đồng bộ; chưa báo hoàn tất                          |
| REQUIRES_REVIEW                         | Hiện “Giao dịch đang cần đối soát”; ẩn thao tác trả lại tiền lần nữa        |
| Order EXPIRED / CANCELLED               | Ẩn QR, báo trạng thái và dẫn về khóa học; không tự thêm lại giỏ             |
| Order PAID                              | Hiện thành công theo backend, dừng polling và không cho trả lần nữa         |

## 8. File dự kiến

```text
components.json
src/components/ui/{button,card,badge,alert,skeleton,separator,sonner}.tsx
src/lib/utils.ts
src/app/globals.css
src/app/layout.tsx                         # Toaster, theo ranh giới phù hợp
src/app/cart/page.tsx
src/app/checkout/[orderId]/page.tsx
src/app/payment/result/page.tsx
src/features/cart/{api,schemas,components}/
src/features/orders/{api,schemas,components}/
src/features/payments/{api,schemas,components}/
src/components/layout/site-header.tsx
src/features/auth/lib/return-path.ts
src/lib/api/{client,proxy.server}.ts
src/app/api/v1/[...path]/route.ts
tests/e2e/cart-checkout.e2e.ts
```

Tên file con chốt khi implement, chỉ tạo module/component có trách nhiệm thật. Route chỉ composition/metadata; UI nghiệp vụ đặt trong features. Không sao chép nguyên module từ Mindy-FE cũ sang FE2. Backend hiện đủ endpoint cho plan này; nếu phát hiện contract gap thì ghi nhận cụ thể trước khi mở rộng thay đổi backend.

## 9. Thứ tự thực hiện

### Giai đoạn 1 — Nền UI và contract

- [x] Đọc lại Swagger/DTO, các guide Next.js đang cài và kiểm tra thay đổi hiện có.
- [x] Cài/cấu hình shadcn, semantic tokens và qrcode.react; kiểm tra tương thích React/Tailwind đang dùng.
- [x] Bổ sung schemas, client DELETE, proxy allowlist/Origin và auth returnTo.

### Giai đoạn 2 — Giỏ hàng

- [x] Header cart/badge, thông báo sau add-cart và `/cart` dùng dữ liệu thật.
- [x] Xóa lớp, cập nhật tổng tiền, loading/error/empty/unpurchasable.
- [x] Mục đơn đang chờ để mở lại checkout đã gián đoạn.

### Giai đoạn 3 — Checkout và QR

- [x] Checkout PAYOS, chặn double click và chuyển tới orderId vừa tạo.
- [x] Đọc order, create/reuse payment, render QR từ payload và checkoutUrl fallback.
- [x] Countdown, polling có giới hạn, trạng thái kết thúc và khôi phục khi reload/lỗi mạng.
- [x] `/payment/result`, đăng nhập quay lại và kết quả theo backend.

### Giai đoạn 4 — Kiểm chứng và tài liệu

- [x] Test các hành vi bên dưới; sửa lỗi liên quan.
- [x] Cập nhật `docs/api-contracts.md`, `docs/architecture.md`, `docs/ui-rules.md`, `docs/progress.md` theo kết quả thực tế.
- [x] Cập nhật mục phạm vi commerce trong `AGENTS.md` đang ghi checkout chưa thuộc lần trước để phản ánh yêu cầu mới; giữ các quy tắc bảo mật khác.

## 10. Kiểm thử và tiêu chí hoàn tất

Unit/integration frontend kiểm tra: Zod nullable/status; proxy method/path/query/Origin kể cả DELETE; 204; safeReturnPath chống open redirect; quyết định hiển thị QR/poll/stop/retry bằng fake timer khi phù hợp.

Playwright mock theo contract kiểm tra:

- Guest → login → cart; STUDENT thêm lớp → badge → cart → xóa lớp → tổng tiền cập nhật.
- Bấm Thanh toán gọi checkout một lần với PAYOS, sau đó payment đúng orderId và hiển thị QR có payload mong đợi.
- Reload không tạo order mới; payment lỗi/CREATING chỉ retry cùng order; mất response checkout tìm được đơn chờ.
- Thiếu QR có fallback payOS; cả hai thiếu không tạo QR giả.
- PENDING → PAID hiển thị thành công; query redirect giả `status=PAID` vẫn không vượt qua trạng thái PENDING từ backend.
- EXPIRED/CANCELLED/REQUIRES_REVIEW dừng QR; countdown hết hạn refetch; mất mạng không báo thành công.
- Hết phiên/đổi tài khoản không hiện dữ liệu cũ; QR có thể mở lại sau login.
- Responsive ở 320px, khoảng 390px và 1440px; không tràn ngang, focus rõ, thao tác bàn phím, vùng chạm chính tối thiểu 44px và thông báo trạng thái có aria-live phù hợp.
- Decode QR render trong test để kiểm tra đúng payload; trước nghiệm thu live, quét bằng app ngân hàng để kiểm tra đúng đơn/số tiền trong môi trường kiểm thử được cấu hình.

Chạy `npm run lint`, `npm run format:check`, `npm run check:types`, `npm run test`, `npm run build`, `npm run test:e2e` theo quy tắc repo. Nếu preview đang chạy, dùng build output riêng theo convention hiện có.

**Hoàn tất khi:** từ nút Giỏ hàng, người dùng xem giỏ thật, bấm Thanh toán và thấy QR hợp lệ hoặc fallback rõ ràng; mở lại được đơn sau gián đoạn; chỉ trạng thái PAID của backend dẫn tới thông báo thanh toán thành công. Các control trong luồng mới dùng shadcn và giữ thiết kế Mindy. Test mock không được ghi nhận thành giao dịch tiền thật đã nghiệm thu.

## 11. Nguồn đối chiếu

- [shadcn/ui: cài vào Next.js hiện có](https://ui.shadcn.com/docs/installation/next).
- [qrcode.react: QRCodeSVG và API](https://github.com/zpao/qrcode.react).
- [Swagger backend live](https://api.quanh123.id.vn/docs) và [OpenAPI JSON](https://api.quanh123.id.vn/docs-json).
- Backend local: `../Mindy-BE/docs/PHASE_2_FE_CONTRACT.md`, commerce `cart.controller.ts`, `orders.controller.ts`, `order.dto.ts`, payment `payments.controller.ts`, `payment.dto.ts`, `payment-links.service.ts`.
