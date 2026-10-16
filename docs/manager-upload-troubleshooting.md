# Chẩn đoán upload Manager — 16/10/2026

## Cập nhật sau ảnh lỗi mới

Lần tải mới đã có PUT 200, complete 202, rồi file FAILED với FILE_RETRY_EXHAUSTED. Bước CORS/upload storage đã chạy qua ở lần này; lỗi hiện tại nằm trong xử lý validation backend. Xem [mô tả và lệnh kiểm tra gửi backend](manager-upload-backend-handoff.md). Các ghi nhận CORS bên dưới là bằng chứng của lần chẩn đoán trước, không dùng để kết luận nguyên nhân lỗi worker hiện tại.

## Bằng chứng hiện có

- Swagger live có upload-intents, file status và complete; DTO hiện khớp schema FE.
- Storage tại `https://storage.quanh123.id.vn/minio/health/live` trả 200.
- Preflight OPTIONS tới storage root và `/mindy-center/`, Origin `http://localhost:3003`, method PUT, request header content-type trả 204 nhưng không có Access-Control-Allow-Origin/Methods/Headers. Trình duyệt không thể gửi PUT từ origin này nếu URL upload thực tế đi qua cùng cấu hình CORS. Chưa đọc được URL/thông báo của lần upload người dùng vì phiên trình duyệt kiểm tra chưa đăng nhập.
- E2E browser desktop/mobile với mock theo contract đã đi qua chọn PDF → upload intent → PUT raw bytes → complete READY → gắn fileId → lưu FILE material. Điều này chỉ xác nhận luồng FE, không xác nhận storage VPS.

## Thông báo FE

Uploader hiện phân biệt lỗi xin intent, PUT storage, complete, poll status. Lỗi mạng ở PUT có mã `UPLOAD_STORAGE_NETWORK`; HTTP lỗi storage giữ status, không gọi complete khi PUT chưa thành công. Lỗi cấu hình/quota/quyền từ backend giữ code và HTTP status, không bị đổi thành lỗi phiên bản tài liệu.

## Xử lý nếu lỗi thực tế là CORS

Trên VPS, bổ sung chính xác origin frontend đang dùng (`http://localhost:3003` cho địa chỉ hiện tại) vào CORS_ORIGINS hiện có, giữ các origin hợp lệ khác. `compose.files-production.yaml` của BE truyền giá trị này vào MINIO_API_CORS_ALLOW_ORIGIN. Áp dụng lại cấu hình cho MinIO; API cũng cần nhận cùng allowlist nếu đang chặn Origin của mutations.

Làm theo runbook `Mindy-BE/docs/PHASE_3_2_VPS_MINIO_RUNBOOK.md` với đúng compose project đang chạy; không xóa volume, không bật bucket public, không sửa hostname/path/query của signed URL. Kiểm lại OPTIONS trên URL/bucket thực tế phải có Access-Control-Allow-Origin đúng frontend và cho PUT/content-type, rồi nghiệm thu bằng file PDF nhỏ trong browser.

Chưa thay cấu hình hoặc triển khai lên VPS trong lượt chẩn đoán này. Cần thông báo lỗi/request thực tế để khẳng định đây là nguyên nhân của lần người dùng báo lỗi.
