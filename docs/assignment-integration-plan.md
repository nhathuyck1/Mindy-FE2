# Plan tích hợp Assignment QUIZ / ZIP cho FE2

Ngày: 02/11/2026. Trạng thái: **đã triển khai FE và kiểm chứng các luồng chính bằng mock + BE local**. Chi tiết và giới hạn nghiệm thu ở mục 9.

## 1. Nhánh và nguồn contract

- Repo: `Mindy-FE2`. Nhánh: `codex/assignment-api-integration`.
- Tạo từ `main`, sau đó fetch và fast-forward theo bản main người dùng vừa push: `origin/main` tại `e553fb32ff69f2ea8dc37aa8201cd2998da7d4a6`. Đây là base triển khai; bao gồm refresh token chung và logout mới.
- Contract chuẩn là source BE local, đặc biệt mục 5 mới nhất của [Phase 5 API](../../Mindy-BE/docs/api_flow/PHASE_5_flow-api-breakdown.md), [flow](../../Mindy-BE/docs/api_flow/PHASE_5_FLOW.md), [ZIP runbook](../../Mindy-BE/docs/core/ASSIGNMENT_ZIP_RUNBOOK.md), controller và DTO trong `../Mindy-BE/src/modules/assignments`. Các đoạn lịch sử ghi ZIP còn pending không thay thế contract ngày 02/11.
- BE local đã có QUIZ, bulk câu hỏi, file đề, ZIP, chấm/trả điểm, lịch sử và báo cáo. Không mặc định bản đó đã deploy lên upstream production của FE.
- Phạm vi: **35 method/path assignment** trong ba nhóm controller, cộng cập nhật schema/UI cho **2 API tiến độ hiện hữu**. Không thay BE, Google Login, attendance hoặc quy tắc hoàn thành khóa học.

Quy tắc triển khai theo [architecture](architecture.md), [API contracts](api-contracts.md), [UI rules](ui-rules.md), [chuẩn Student](student-ui-standard.md) và `AGENTS.md`. Đọc tài liệu Next.js được cài trong `node_modules/next/dist/docs/` trước khi viết route/code.

## 2. Kết quả cần đạt

Mentor có thể tạo bài theo buổi, soạn bộ câu hỏi ABCD, đính kèm đề, xuất bản, lưu trữ, gia hạn ZIP; xem danh sách nộp/thiếu, tải bài, lưu điểm, sửa điểm có lý do và trả điểm. Học viên có thể xem bài theo lớp, bắt đầu/tiếp tục QUIZ, tự lưu đáp án, nộp và xem kết quả; hoặc upload ZIP, chờ kiểm tra, gắn file, xác nhận nộp và đọc điểm đã công bố. Lịch sử và snapshot phải giữ đúng phiên bản đã nộp.

Mọi API trong ma trận phải có schema, proxy rule, consumer trên UI và bằng chứng kiểm chứng tương ứng. Chỉ mở allowlist hoặc viết một API helper chưa được tính là tích hợp xong.

## 3. Điểm gắn vào FE hiện tại

| Vị trí                                                | Thay đổi dự kiến                                                                                                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/mentor/components/mentor-class-page.tsx`    | Thêm tab Bài tập, filter loại/mục đích/buổi/trạng thái, danh sách và thống kê. Mentor dạy thay chỉ thấy scope BE cho phép; không mở roster/report toàn lớp bằng quyền giả. |
| `features/mentor/components/mentor-session-page.tsx`  | Panel Bài tập của buổi, tạo nháp và mở chi tiết. Đọc context trước; không làm thay đổi luồng điểm danh/notes.                                                              |
| `/mentor/assignments/[assignmentId]`                  | Chi tiết metadata, editor QUIZ, file đề, preview/publish/archive/delete, gia hạn và danh sách nộp/roster. UUID sai không gửi request.                                      |
| `/mentor/zip-submissions/[submissionId]`              | Đọc snapshot, tải bài, lưu/chỉnh điểm, xác nhận trả điểm, lịch sử điểm/audit. Tách quyền chấm lịch sử khỏi quyền tạo bài mới khi lớp đã đóng.                              |
| `features/learning/components/learning-page.tsx`      | Link/tab Bài tập cấp lớp, độc lập danh sách material và legacy unit lock. Không mount query assignment trong CASH_PREVIEW.                                                 |
| `features/user/components/my-courses-page.tsx`        | Lối vào bài tập của lớp khi có quyền; giữ hành vi hiện tại của lịch sử enrollment.                                                                                         |
| `/user/classes/[classId]/assignments`                 | Danh sách bài đã phát hành, filter/phân trang và link chi tiết. Không cần thêm mục sidebar toàn cục khi chưa có API tổng hợp mọi lớp.                                      |
| `/user/assignments/[assignmentId]`                    | Metadata, hướng dẫn, điều kiện/hạn/lượt nộp, start/resume QUIZ hoặc tạo/resume ZIP, lịch sử bài này.                                                                       |
| `/user/assignment-submissions/[submissionId]`         | Làm QUIZ và xem kết quả theo attempt ID; reload đọc GET trước, không tự POST start.                                                                                        |
| `/user/zip-submissions/[submissionId]`                | Upload nháp hoặc xem snapshot/kết quả lịch sử; deep-link GET được giữ kể cả khi quyền xem lớp hiện tại không còn.                                                          |
| `features/mentor/components/mentor-class-reports.tsx` | Hiển thị assignment summary từ API tiến độ; nhãn phân biệt hiện tại/lịch sử và chưa chấm/chưa trả điểm.                                                                    |

Các route mới chỉ compose feature, kế thừa shell và guard role ACTIVE hiện tại. Dùng Nunito/token Mindy, shared Button/Modal/Input; khu vực code dùng monospace. Nội dung đề/feedback hiển thị text, không render HTML tùy ý. Có loading/error/empty/retry riêng, keyboard/focus, 320px, desktop, reduced motion. Filter danh sách mới lưu trên URL và hỗ trợ Back/Forward; đổi filter reset page và lựa chọn.

### Giới hạn discovery lịch sử cần trình bày đúng

BE giữ quyền đọc bài đã nộp theo submission/assignment ID sau khi enrollment hoặc lớp đóng. Tuy nhiên chưa có API liệt kê tất cả assignment/submission của một tài khoản qua mọi enrollment đã kết thúc; API danh sách bài theo lớp cần quyền hiện tại. Vì vậy plan bảo đảm đọc lại bằng deep-link và lịch sử của assignment đã biết, không hứa một kho lịch sử toàn tài khoản mà API chưa cung cấp. Không chặn route submission bằng một query quyền lớp trước query ownership.

## 4. Ma trận bao phủ API

Các path dưới đây sau `/api/v1`; mọi tham số ID là UUIDv4. Page mặc định 1/20, tối đa 100. Filter cụ thể phải đối chiếu DTO, strict unknown/duplicate query và phân biệt filter Mentor/Student.

### 4.1. Mentor authoring — 9 API

| ID  | Method/path                                        | Consumer và điều kiện chính                                                                                                                               |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | POST /mentor/class-sessions/:sessionId/assignments | Form tạo DRAFT QUIZ/ZIP; purpose TEST/HOMEWORK. Lỗi mạng chưa biết kết quả phải reload danh sách trước khi tạo lại: API này không có receipt idempotency. |
| A02 | GET /mentor/class-sessions/:sessionId/assignments  | Panel buổi, phân trang/status/type/purpose/sessionId theo DTO.                                                                                            |
| A03 | GET /mentor/classes/:classId/assignments           | Tab lớp, cùng nhóm filter và scope BE.                                                                                                                    |
| A04 | GET /mentor/assignments/:assignmentId              | Chi tiết/editor Mentor, có keys riêng; không dùng schema/cache Student.                                                                                   |
| A05 | PATCH /mentor/assignments/:assignmentId            | Lưu metadata DRAFT với expectedRevision. Không cho sửa type/purpose/maxScore/maxAttempts qua PATCH.                                                       |
| A06 | PUT /mentor/assignments/:assignmentId/questions    | Lưu toàn bộ 1–200 câu ABCD, expectedRevision, giữ ID câu cũ; trả canonical IDs/order/revision.                                                            |
| A07 | POST /mentor/assignments/:assignmentId/publish     | Preview và xác nhận khóa nội dung; expectedRevision; file đề phải READY, dueAt tương lai nếu có.                                                          |
| A08 | POST /mentor/assignments/:assignmentId/archive     | PUBLISHED, expectedRevision + reason bắt buộc; xác nhận tác động tới các bản đang làm. Không có unarchive.                                                |
| A09 | DELETE /mentor/assignments/:assignmentId           | Xác nhận xóa DRAFT, JSON expectedRevision; xử lý 204, về danh sách và invalidate.                                                                         |

### 4.2. Student QUIZ — 7 API

| ID  | Method/path                                          | Consumer và điều kiện chính                                                                  |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A10 | GET /me/classes/:classId/assignments                 | Danh sách metadata được cấp quyền, phân trang/filter theo DTO; không có keys/questions.      |
| A11 | GET /me/assignments/:assignmentId                    | Metadata + hướng dẫn, không đọc câu hỏi trước start.                                         |
| A12 | POST /me/assignments/:assignmentId/start             | Nút Bắt đầu/Tiếp tục; expectedAssignmentRevision và Idempotency-Key; 201 mới/200 resume.     |
| A13 | GET /me/assignment-submissions/:submissionId         | Reload/khôi phục attempt, serverNow, version, answers và trạng thái.                         |
| A14 | PUT /me/assignment-submissions/:submissionId/answers | Autosave full replacement, expectedVersion + key, serialize từng request.                    |
| A15 | POST /me/assignment-submissions/:submissionId/submit | Xác nhận nộp đủ mọi câu; full answers + expectedVersion + key; dừng/hòa giải autosave trước. |
| A16 | GET /me/assignment-submissions/:submissionId/result  | Hiện kết quả BE; FINALIZING poll theo retryAfterSeconds, tối đa 60s rồi cho làm mới.         |

### 4.3. File đề, ZIP, điểm và báo cáo — 19 API

Mọi mutation trong nhóm này yêu cầu Idempotency-Key UUIDv4. Không áp dụng giả định đó cho các mutation authoring A01–A09 vốn không có receipt.

| ID  | Method/path                                             | Consumer và điều kiện chính                                                                                            |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A17 | POST /mentor/assignments/:id/instruction-upload-intents | DRAFT; expectedRevision, tên/MIME/kích thước; PDF/DOCX/PNG/JPEG, tối đa 25 MiB/file.                                   |
| A18 | PUT /mentor/assignments/:id/instruction-files           | expectedRevision, ordered fileIds 0–5, chỉ own READY cùng bài; [] gỡ hết trước publish.                                |
| A19 | POST /mentor/assignments/:id/extend                     | ZIP PUBLISHED; expectedRevision + reason, chỉ tăng dueAt hoặc maxAttempts, ít nhất một giá trị tăng thật.              |
| A20 | POST /me/assignments/:id/zip-submissions                | expectedAssignmentRevision; tạo/resume một DRAFT, chưa tiêu tốn lượt nộp.                                              |
| A21 | POST /me/zip-submissions/:id/upload-intents             | expectedVersion của SUBMISSION; application/zip, 1–20 MiB.                                                             |
| A22 | POST /assignment-files/:id/complete                     | expectedVersion của FILE, sau PUT storage thành công; PROCESSING chưa phải READY/nộp bài.                              |
| A23 | GET /assignment-files/:id                               | Status/version/errorCode; poll 2s đến READY/FAILED, tối đa 60s, có refresh thủ công.                                   |
| A24 | GET /assignment-files/:id/download                      | Nút tải file đề/bài nộp; URL riêng tư TTL 60s, lấy mới mỗi lần tải; không cache/persist URL.                           |
| A25 | PUT /me/zip-submissions/:id/file                        | expectedVersion của SUBMISSION + own READY fileId cùng nháp; lấy version mới để submit.                                |
| A26 | POST /me/zip-submissions/:id/submit                     | expectedVersion của SUBMISSION; xác nhận nộp, BE cấp attemptNumber và snapshot bất biến.                               |
| A27 | GET /me/zip-submissions/:id                             | Trang nháp/lịch sử Student; grade chỉ là bản đã release, không có gradeVersion/releasedVersion riêng tư.               |
| A28 | GET /mentor/zip-submissions/:id                         | Trang chấm; đọc snapshot/file/current grade/gradeVersion/releasedVersion.                                              |
| A29 | PUT /mentor/zip-submissions/:id/grade                   | expectedVersion của GRADE, 0 lần đầu; score decimal string trong snapshot.maxScore, feedback; sửa điểm cần reason.     |
| A30 | POST /mentor/zip-submissions/:id/grade/release          | expectedVersion và gradeVersion cùng bằng current grade revision; xác nhận trả bản điểm đang xem.                      |
| A31 | GET /mentor/zip-submissions/:id/grade/history           | Hai danh sách revisions/audits và hai total riêng, cùng page/pageSize; không gộp total hoặc suy thiếu trang.           |
| A32 | GET /me/assignments/:id/submissions                     | Lịch sử QUIZ/ZIP discriminated union; page/pageSize/attemptNumber/status chỉ SUBMITTED hoặc RELEASED.                  |
| A33 | GET /mentor/assignments/:id/submissions                 | Queue latest submitted/student mặc định; history=true xem lượt cũ, studentId/status/attemptNumber và phân trang.       |
| A34 | GET /mentor/assignments/:id/roster                      | Roster hiện tại, submitted/graded/released/missing; denominator CURRENT_ACTIVE_ENTITLEMENTS.                           |
| A35 | GET /mentor/classes/:id/assignment-metrics              | Thống kê với type/purpose/sessionId; trình bày đủ assignments/eligible/submitted/missing/ungraded/unreleased/released. |

### 4.4. Hai API tiến độ đã có

`GET /mentor/classes/:classId/progress` và `GET /mentor/classes/:classId/students/:studentId/progress` hiện đi qua `workspace-contracts.ts`, đang chỉ nhận `assignmentSummary.availability = NOT_IMPLEMENTED`. Bổ sung discriminated union cho `AVAILABLE` + counts và giữ nhánh cũ với counts null để không làm vỡ môi trường chưa cập nhật BE. Không biến null/lỗi thành số 0. Giữ `completionPolicy = UNDEFINED`, không suy số bài nộp thành hoàn thành chương/khóa.

## 5. Thiết kế triển khai

### F0 — Nền API và hợp đồng

- [x] Tạo `features/assignments/schemas/` chia metadata/authoring, QUIZ, file, ZIP/grade/report. Input strict Zod; output tách Mentor/Student và các trạng thái nullable. Decimal score giữ string, đối chiếu giới hạn bằng số nguyên phần trăm điểm để tránh lỗi float.
- [x] Thêm `lib/api/assignment-rules.server.ts`, đăng ký chính xác 35 method/path với body/query/response/cookie/idempotency. Không mở proxy theo prefix rộng. Thử UUID sai, foreign path, method sai, query lạ hoặc trùng.
- [x] Sửa cả ba điểm trong proxy: resolve rule, kiểm query/cookie và forward Idempotency-Key. `upstream()` hiện chỉ forward key khi resolver Mentor/Manager nhận route: thêm rule mới mà bỏ bước này sẽ làm toàn bộ mutation Student thất bại.
- [x] Thêm body limit theo rule: **8,388,608 bytes** riêng PUT questions, **65,536 bytes** cho payload assignment khác cần vượt mức Student 16 KiB. Không tăng giới hạn của route khác. Đếm byte UTF-8 thực tế và đọc stream có giới hạn để chặn cả request không có Content-Length. Test đúng biên và ký tự tiếng Việt/JSON escape.
- [x] Giữ field error an toàn `details[0].fields[{path,code}]` qua proxy, `client.ts` và `api-error.ts`; validation ở FE/proxy cũng phải trả vị trí tương ứng. Không chuyển tiếp rejected values, parser stack hoặc object lỗi upstream tùy ý. 422 bulk phải chỉ được câu/đáp án cần sửa.
- [x] Kiểm timeout bulk: proxy hiện 10s, browser 15s. Cho phép timeout riêng PUT questions (upstream 45s, browser 60s), có trạng thái đang lưu và xử lý kết quả chưa xác định; không tự replay mutation khi timeout. Route khác giữ mặc định.
- [x] Tạo query hooks/mutations trong `features/assignments/api/`, key theo user + role + resource + filter/page. `retry: false` cho lệnh; GET chỉ retry có chủ đích. Signed URLs dùng imperative request và state ngắn hạn, không lưu Query/mutation cache hay Web Storage.
- [x] Tái sử dụng `apiRequest`/`session-coordinator` của main mới: 401 phục hồi phiên/replay tối đa một lần, giữ nguyên serialized body/key, hủy phiên cũ khi logout. Không viết client refresh riêng; storage PUT không đi vào recovery. Mất phiên phải dừng autosave, polling và PUT storage; unmount hủy cập nhật UI cũ.

**Nghiệm thu F0:** đủ ma trận allowlist, input/output schemas, key thực sự đến BE; unit/proxy test ranh giới, privacy và regression auth pass. Chưa tuyên bố UI đã tích hợp khi chỉ xong F0.

### F1 — Mentor tạo và quản lý bài

- [x] Danh sách lớp/buổi, filter và route detail; guard/scope từ workspace + BE, không dùng createdBy để suy quyền.
- [x] Form tạo QUIZ/ZIP: title 1–250, description ≤20,000, maxScore 0.01–999999.99; QUIZ maxAttempts=1, timer null/1–240 phút và dueAt optional; ZIP dueAt bắt buộc, timer null, maxAttempts 1–10.
- [x] Metadata DRAFT chỉ sửa field API cho phép; mỗi lần lưu dùng revision hiện tại. 409 giữ draft tại component, tải bản mới để người dùng đối chiếu, không tự ghi đè.
- [x] Editor 1–200 câu, đủ A/B/C/D, key bắt buộc, thêm/xóa/sắp xếp/preview; kiểm nonblank và field limits. PUT gửi trọn bộ sau merge, không gửi append/raw text/Quizlet. Thay ID/order/revision local bằng canonical response sau thành công.
- [x] Publish/archive/delete có modal xác nhận và khóa double-click. Các lệnh không có receipt khi lỗi mạng cần refetch kiểm trạng thái trước ý định mới.

**Nghiệm thu F1:** tạo → soạn → lưu → preview → publish; thử 200 câu, 413, 422 indexed, stale revision, frozen content, archive/delete và mentor bị thu hồi scope.

### F2 — Học viên làm QUIZ

- [x] Danh sách và metadata không có câu hỏi/keys trước start. Nút bắt đầu chụp expectedAssignmentRevision và giữ key/body khi kết quả chưa xác định.
- [x] Sau start điều hướng route attempt; reload dùng A13. Không reset timer khi remount. Tính countdown từ serverNow/expiresAt với thời gian trôi monotonic, đồng bộ lại sau focus/resume; BE quyết định hết hạn. expiresAt=null không hiện timer giả.
- [x] Autosave debounce 800ms; tối đa một request đang chờ, gộp thay đổi mới nhất cho lần kế tiếp. Mỗi save gửi full answer set + version mới nhất; ghi rõ Đang lưu/Đã lưu/Lưu lỗi. Response cũ không ghi đè thao tác mới.
- [x] Nộp thủ công khóa chỉnh sửa, hủy debounce, đợi save đang gửi có kết quả/hòa giải version rồi gửi toàn bộ đáp án hiện tại. Không coi AbortController là rollback request đã đến BE. Thiếu câu thì chỉ vị trí, không nộp giả.
- [x] 409 do tab khác giữ draft và yêu cầu đọc lại, không replay với version mới tự động. Khi timeout/hết hạn, dừng input và chờ FINALIZING; không gửi đáp án muộn, không tự tính điểm. Worker chỉ chấm phần đã lưu.
- [x] Hiện điểm/đúng/sai từ result đã GRADED; poll FINALIZING tối đa 60s, dừng khi GRADED/VOIDED/401/403/404, có nút tải lại sau thời gian chờ. Hủy rời trang có cảnh báo khi còn thay đổi chưa lưu.

**Nghiệm thu F2:** start/resume, reload, untimed/timed, save chậm/mất mạng, nhiều tab, submit cùng autosave, hết hạn và worker chậm; không lộ keys trước GRADED.

### F3 — File đề và nộp ZIP

- [x] Uploader assignment riêng về contract, dùng lại component UI upload hiện có khi phù hợp; không dùng API material/file owner khác. Chuỗi: intent → PUT raw bytes với requiredHeaders và `credentials: 'omit'` → complete bằng FILE version → poll status.
- [x] File đề tối đa 5 file, đúng MIME/kích thước, bind/reorder toàn bộ bằng assignment revision khi READY. Publish khóa bindings; snapshot lịch sử giữ file cũ.
- [x] ZIP: create/resume DRAFT → intent bằng SUBMISSION version → storage/complete/poll → attach READY bằng SUBMISSION version → xác nhận submit bằng version mới. READY/attach chưa phải đã nộp.
- [x] Chỉ submit thành công mới tăng lượt; trạng thái nháp không thay thế kết quả submitted hiện tại. Nộp lại chỉ trong maxAttempts/hạn; không suy remaining attempts từ total history đang lọc hoặc chỉ trang đầu.
- [x] dueAt được BE kiểm lại khi submit. Upload trước hạn không giữ chỗ. Intent hết hạn/lỗi file tạo intent mới có chủ đích; 429 không tự tạo lặp. Hiển thị safe errorCode, worker quá 60s chuyển sang refresh thủ công.
- [x] Capabilities chỉ mô tả flag/storage, không phải quyền. Khi OFF/503, khóa thao tác mới phù hợp và giữ draft; lịch sử/điểm/download vẫn truy cập được theo quyền.
- [x] Tải file bằng A24 theo click, URL hết hạn thì xin lại; không tải archive để chạy/giải nén hoặc preview HTML tự do trên FE.

**Nghiệm thu F3:** instruction cho cả QUIZ/ZIP, loại/kích thước sai, upload hết hạn, processing/failed, worker dừng, attach nhầm owner, deadline, double submit, retries cùng receipt và flag OFF vẫn đọc lịch sử.

### F4 — Chấm, sửa và trả điểm

- [x] Queue có phân trang/filter, mặc định latest submitted/student; toggle lịch sử dùng history=true. Student xem lịch sử qua A32, không dùng queue Mentor hoặc filter tiết lộ draft grade.
- [x] Trang chấm đọc snapshot.maxScore và current gradeVersion. Tách rõ assignment revision, submission version, FILE version, GRADE version; không đặt chung biến version cho tất cả lệnh.
- [x] Điểm 0..snapshot.maxScore, tối đa 2 chữ số thập phân; feedback ≤10,000; correction reason nonblank ≤2,000. Lần đầu expectedVersion=0, sửa dùng gradeVersion hiện tại. Lưu điểm và Trả điểm là hai hành động riêng.
- [x] Modal release chụp đúng current grade revision và gửi cả expectedVersion/gradeVersion; stale refetch và xác nhận lại. Sửa sau release giữ bản cũ cho Student tới khi release bản mới.
- [x] History hiển thị version/score/feedback/reason và audit GRADE/RELEASE với pagination đúng hai total. Lịch sử submitted vẫn chấm được theo current mentor scope khi class/session đóng, dù authoring mới bị khóa.

**Nghiệm thu F4:** grade lần đầu, score=0/max, sai range/precision, correction thiếu reason, stale hai Mentor, release/replay, pending correction và Student chỉ thấy released grade. Lượt mới chưa chấm phải hiện chờ điểm, không lấy điểm lượt cũ làm kết quả hiện tại.

### F5 — Roster, metrics và tiến độ

- [x] A34: roster/missing theo current active entitlements; phân biệt chưa nộp, chưa chấm và chưa trả điểm. Không hiển thị mất dữ liệu là zero.
- [x] A35: dùng counts BE với filter thống nhất danh sách; không tự cộng history pages hoặc DRAFT thành số học viên nộp.
- [x] Hiển thị denominator/current-vs-history: submitted có thể gồm enrollment đã kết thúc, missing chỉ các cặp đang đủ điều kiện và đã quá hạn. Không ép submitted/eligible thành tỷ lệ 0–100% khi hai tập khác nhau.
- [x] released và unreleased có thể cùng tăng cho một bài đang sửa điểm; không coi các số là các phần loại trừ nhau của tổng. Đọc `historyIncludesTerminalEnrollments` và `missingIsHistorical` đúng contract.
- [x] Cập nhật union assignmentSummary cho 2 API tiến độ và UI; giữ branch NOT_IMPLEMENTED rõ ràng, không suy completion/certificate.
- [x] Invalidate đúng detail/list/history/roster/metrics/progress sau publish/archive/extend/submit/grade/release; không reset hoặc remount QUIZ đang làm chỉ để refresh thống kê.

**Nghiệm thu F5:** fixtures current/terminal enrollment, nhiều lượt, draft, archived, quá hạn, pending correction, counts zero/null và BE cũ chưa hỗ trợ summary.

### F6 — Hồi quy và nghiệm thu với BE local

- [ ] Unit/proxy: toàn bộ method/path, strict query/body, UUID/key/Origin/cookie, giới hạn UTF-8, validation field paths, 204, output Student không có private fields, status/error và version domains.
- [ ] Playwright mock desktop/mobile: Mentor QUIZ, Student timed/untimed, instruction/ZIP, grade/release/history, reports; kiểm 320px, keyboard, dialog focus, reload/Back/Forward và no horizontal overflow.
- [ ] Chạy hồi quy `client.test.ts`, auth refresh/logout E2E và workspace Mentor/Student; 401 đồng thời autosave/poll không tạo nhiều refresh, replay giữ nguyên body/key, logout ngăn request/cache phiên cũ.
- [ ] Chạy lint, format:check, check:types, unit, build và E2E theo scripts repo. Lỗi có sẵn phải ghi rõ bằng chứng, không nhận là pass hoặc sửa lan ngoài phạm vi theo phỏng đoán.
- [ ] Smoke BE thật local bằng hai browser context Mentor/Student; kiểm network và DB/trạng thái theo flow, không chỉ dựa mock. Lưu bằng chứng flags ON/OFF, worker, storage CORS, publish/start/save/submit, upload/READY/attach, grade/release và history sau nguồn đóng.
- [ ] Cập nhật `docs/api-contracts.md`, `docs/architecture.md`, `docs/progress.md` và UI rules khi có convention mới. Mỗi API đánh dấu xong chỉ khi UI và kiểm chứng đã có.

Thứ tự: **F0 → F1 → F2 → F3 → F4 → F5 → F6**. F1/F2 tạo luồng QUIZ dùng được trước; F3/F4 nối phần ZIP; F5 khép báo cáo. Mỗi giai đoạn ghi tiến độ và giới hạn kiểm chứng riêng; không tự commit/push/deploy.

## 6. Môi trường tích hợp local

1. FE dùng `.env.local` không commit: `API_BASE_URL=http://localhost:3000/api/v1`, `APP_ORIGIN=http://localhost:3001`. Port 3000 là mặc định BE; thay theo port chạy thực tế. Chạy FE bằng `npm run dev`, BE bằng `pnpm dev` ở repo BE sau khi chuẩn bị môi trường test.
2. BE dùng database local/test riêng, migration mới có đủ bảng assignment; tuyệt đối kiểm target trước chạy migration. Giữ CORS_ORIGINS có `http://localhost:3001`; browser vẫn chỉ gọi FE `/api/v1`, không fetch BE trực tiếp. Dùng cùng hostname localhost cho phiên tích hợp.
3. QUIZ cần timeout worker bật. File/ZIP cần `ASSIGNMENT_ZIP_ENABLED=true`, `MINIO_ENABLED=true`, `ASSIGNMENT_FILE_JOB_ENABLED=true`, bucket private/versioned và quyền theo runbook. Chuẩn bị bằng scripts local BE sau khi kiểm cấu hình, không dùng credentials mẫu làm cấu hình production.
4. Presigned storage URL phải truy cập được từ browser; storage CORS cho origin FE và PUT/headers đã ký. Đây là yêu cầu riêng với BE CORS. Không sửa signed URL/hostname phía FE.
5. Chuẩn bị Mentor chính/dạy thay và hai Student ACTIVE, enrollment đủ quyền, buổi/lớp mở, cùng case khóa/đã đóng để test 403/404/409 và retained history. Dùng dữ liệu test, không dùng tài khoản người học thật.
6. Playwright mock hiện chạy production port 3103 và cấu hình APP_ORIGIN riêng; giữ tách với smoke local 3001. Test mock không phải bằng chứng API mới đã deploy.

## 7. Tiêu chí hoàn tất

- [ ] 35/35 API trong ma trận được gắn UI; hai API tiến độ không còn lỗi schema khi BE trả AVAILABLE.
- [ ] Mentor tạo/xuất bản QUIZ và ZIP; Student làm/nộp; Mentor chấm/trả; Student xem đúng bản released và lịch sử/snapshot.
- [ ] Version conflict, request chưa biết kết quả, double-click, autosave/submit race, deadline, worker chậm và flag OFF có hành vi xác định, không ghi đè dữ liệu mới.
- [ ] Không lộ đáp án sớm, draft feedback/grade version, raw token, storage keys hoặc signed URLs trong persistent cache/log.
- [ ] Kiểm tra repo và E2E liên quan pass; smoke BE local có bằng chứng riêng hoặc được ghi rõ là chưa thực hiện. Không tuyên bố deploy/live pass từ kết quả mock.

## 8. Bằng chứng của bước lập plan

Đã fetch main mới và fast-forward nhánh assignment lên `e553fb3`; đọc quy tắc repo, source proxy/client/auth mới, điểm gắn Mentor/Student, controller/DTO và API/runbook BE local. Bước này chỉ tạo plan và ghi nhận phạm vi; checklist F0–F6 còn mở. Kết quả kiểm định tài liệu được ghi trong `docs/progress.md` sau khi chạy.

## 9. Triển khai và bằng chứng — 02/11/2026

- `features/assignments` và sáu route đã triển khai đủ consumer cho A01–A35. Schema/proxy tách Mentor/Student, strict body/query, receipt forwarding, stream byte limit, timeout bulk và safe field errors. Hai progress API nhận AVAILABLE/NOT_IMPLEMENTED và hiển thị counts đúng nguồn.
- Mentor: tab lớp/panel buổi, tạo/sửa metadata, bộ câu hỏi ABCD thêm/xóa/đổi thứ tự/xem trước, publish/archive/delete, file đề/binding/order/remove, gia hạn ZIP, queue/roster/metrics, chấm/sửa/trả điểm và lịch sử. Student: danh sách, metadata trước start, timed/untimed QUIZ với serialize autosave, reload/version conflict, submit/result, ZIP draft/upload/attach/submit và snapshot/điểm đã release.
- `assignment-proxy.test.ts` kiểm đủ 35 method/path và receipt tới upstream, privacy, Origin/cookie/UUID/query/body, indexed errors, UTF-8 64 KiB/8 MiB. `quiz-session.test.ts` kiểm slow save/coalescing/submit race và giữ draft sau lỗi. Contract tests kiểm 200 câu, ABCD, score, version, MIME/limit, filter và progress union. Xem số lượng kiểm tra cuối trong [progress](progress.md).
- Playwright kiểm desktop/mobile: create/edit/delete/archive/extend/instruction binding, start/autosave/reload/submit, timed/expired/conflict, ZIP explicit submit/feature OFF/historical deep-link, grade/release/audit, filter Back/Forward, 320px và dialog focus. Hồi quy auth refresh/logout, learning và mentor workspace chạy cùng bản build production riêng.
- Smoke BE thật đã pass hai browser context Mentor/Student, compiled local BE + PostgreSQL test mới + MinIO thật: file đề và ZIP PUT/worker READY/binding, submit, grade ẩn trước release, Student đọc bản released, flag OFF, class/enrollment đóng vẫn đọc snapshot/grade/download; kiểm DB xác nhận QUIZ GRADED và ZIP SUBMITTED/attempt 1. Không có lỗi JavaScript. File `../output/assignment-smoke-2026-11-02/result.json`, `quiz-result.png`, `zip-result.png` là bằng chứng, không phải dữ liệu production.
- Sau yêu cầu đổi port, FE dev/start dùng **3001**, `.env.local` trỏ **BE localhost:3000**. BE local đang chạy với Origin 3001, private versioned MinIO 19000 và workers ON. Database dev local localhost:5433/mindy_center đã backup `../output/assignment-local-2026-11-02/mindy-center-before-assignment.dump`, áp dụng 21 migration còn thiếu; không còn pending. Probe qua FE xác nhận login 200, create QUIZ 201, delete draft 204; không giữ bài probe. Không chỉnh source BE hoặc deploy server.
- Các nghiệm thu tổ hợp lỗi sâu (worker dừng quá 60s, mọi TTL/429, tab ngủ dài, hai Mentor đồng thời với pending correction) chưa có đầy đủ browser fixtures riêng. Mã đã có giới hạn poll, version guards và thao tác đọc lại, nhưng không đánh dấu những tổ hợp này đã được nghiệm thu chỉ từ happy path. Checklist F6/tiêu chí hoàn tất cần đọc cùng giới hạn này; không tuyên bố production/live pass.
