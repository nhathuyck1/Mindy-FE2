---
version: 1
slug: "src-features-admin-components-admin-data-table-tsx"
primary_target: "src/features/admin/components/admin-data-table.tsx"
related_targets: ["src/app/admin/admin.css","src/features/admin/components/admin-record-details.tsx"]
---

# Bảng tài nguyên Admin

Mode: Operate. Phạm vi: AdminDataTable tại Người dùng, Khóa học, Lớp học.

## Direction contract

THESIS: Bảng trắng gọn như ảnh người dùng cung cấp; đọc nhanh danh tính, so sánh các cột, mở thông tin ngay dưới đúng hàng.

OWN-WORLD: Giữ Inter và palette Mindy. Nền trắng, đường phân cách nhẹ, mint cho chọn/mở và focus; nhãn trạng thái hình chữ nhật bo nhẹ, icon thao tác trung tính. Avatar chữ cái dùng tên thật đã tải.

STORY: Admin lọc danh sách, chọn dòng để xuất CSV, mở chi tiết bằng mũi tên và tiếp tục sửa/trạng thái/lịch bằng những thao tác hiện có. Mở chi tiết không chọn dòng và không phát sinh mutation.

FIRST VIEWPORT: Heading và toolbar hiện hữu phía trên; đầu bảng trắng, checkbox và mũi tên ở trái, danh tính kế tiếp, các thuộc tính ở giữa, thao tác bên phải. Hàng mở có nền mint rất nhạt cùng viền mint mảnh bao cả thông tin.

FORM: Bảng có disclosure, theo ảnh tham chiếu và xác nhận áp dụng cả ba tài nguyên của người dùng. seed: none (user-pinned). Chi tiết dùng dữ liệu list hiện có; giữ dialog cho sửa/xác nhận. Màn nhỏ cuộn riêng bảng, chi tiết xuống cột trong chiều rộng màn hình.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
