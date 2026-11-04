# Kết nối FE–BE độc lập nơi host

Cập nhật 04/11/2026. HTTP và realtime dùng hai transport có cấu hình chung ở server. FE cần runtime Next.js (Vercel hoặc Node/container/self-host); không phải static export.

## Cấu hình FE

```dotenv
API_BASE_URL=https://api.quanh123.id.vn/api/v1
APP_ORIGIN=https://mindy-fe-2.vercel.app
REALTIME_ORIGIN=https://api.quanh123.id.vn
```

- API_BASE_URL: upstream HTTP đầy đủ prefix API. Mọi trang dùng apiRequest và proxy /api/v1 có allowlist. Không sửa URL trong từng feature.
- APP_ORIGIN: origin FE chính xác (scheme + hostname + port nếu có), không path/query. Dùng kiểm Origin của các mutation và cookie Secure.
- REALTIME_ORIGIN: origin BE công khai hỗ trợ WebSocket, không path/query/credentials. Không khai báo thì lấy origin API_BASE_URL. Nếu API_BASE_URL là địa chỉ Docker/VPC riêng, cấu hình origin công khai ở đây. FE HTTPS yêu cầu realtime HTTPS.
- Cả ba là env server, không NEXT_PUBLIC; URL realtime được trả lúc xin vé, không đóng cứng vào bundle. Restart/redeploy process sau khi đổi env. Không đưa JWT/secret vào các URL này.

## Cấu hình BE

```dotenv
CORS_ORIGINS=https://mindy-fe-2.vercel.app,https://app.example.com
CHAT_ENABLED=true
WHITEBOARD_ENABLED=true
```

Cho phép đúng các origin FE đang sử dụng; khi chuyển domain, thêm origin mới và gỡ origin cũ khi hết dùng. Không mở wildcard. Giữ JWT keys và session hiện có. Reverse proxy trước BE phải hỗ trợ WebSocket Upgrade cho /socket.io và /ws/whiteboards; không đặt hai đường này qua host FE. Signed file upload/download giữ URL do BE cấp.

## Luồng và thứ tự deploy

1. Deploy BE hỗ trợ POST /api/v1/auth/realtime-ticket và socket ticket auth trước. Không cần migration hay package mới.
2. Cấu hình FE ba env trên và BE CORS_ORIGINS; deploy FE mới.
3. Login như cũ: access/refresh vẫn HttpOnly tại domain FE. Browser xin vé qua same-origin proxy; proxy chỉ chuyển access cookie, Origin cấu hình và body channel.
4. Proxy trả {ticket,expiresAt,url}. Browser dùng ticket trong Socket.IO auth payload để nối trực tiếp BE. Vé không dùng cho REST, chỉ kênh/domain đã ký và hết hạn handshake tối đa60s. Vé là bearer ngắn hạn, có thể dùng lại trong cửa sổ60s; không lưu persistent hoặc ghi log.
5. Gateway vẫn kiểm session/account/resource, ngắt socket ở access expiry. Reconnect xin vé mới, dùng refresh HTTP chung nếu access cookie hết hạn. Logout/unmount hủy kết nối và attempt cũ.

Bỏ rewrites WebSocket khỏi next.config.ts. Không dùng cookie third-party, SameSite=None hoặc trả access token về JS để khắc phục khác domain.

## Kiểm tra khi đổi host

- Login → API khóa/lớp/tài liệu vẫn qua /api/v1 trên domain FE.
- Bảng hiện Đã lưu; thêm ghi chú được xác nhận; chat nối namespace /chat. Network WebSocket phải tới BE, không tới domain FE và không có ticket/token trong query URL.
- Ngắt/nối lại tạo request ticket mới; logout dừng socket; 401 refresh một lần, sai quyền không retry vô hạn.
- Node/controller/gateway smoke ở BE: node tools/build.mjs rồi node tools/realtime-smoke.mjs.
- Browser smoke: build FE và BE, đặt BACKEND_DIR tới repo BE đã build rồi chạy node scripts/realtime-portability-smoke.mjs từ FE. Cùng một build FE chạy ở127.0.0.1:3181 và localhost:3182; kiểm Whiteboard/chat/reconnect. Auth/controller/gateway/WebSocket thật; domain/session lookup và REST màn hình dùng fixture memory, không DB production. Ảnh ở test-results/realtime-portability.
- Script whiteboard-local-smoke.mjs cũ dành cho kiểm nghiệp vụ DB test riêng (TEST_DATABASE_URL phải kết thúc _test); không coi fixture transport là nghiệm thu enrollment/durability thật.
