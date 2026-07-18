# Demo Polish Report

**Ngày:** 2026-07-18
**Phương pháp:** rà soát ở mức code (đọc toàn bộ page/component của luồng
demo), **KHÔNG phải click-through trực tiếp trên trình duyệt** (môi
trường hiện tại không có công cụ mở UI thật). Đã tự sửa các lỗi rõ ràng
tìm được trong lúc rà soát thay vì chỉ liệt kê. Founder nên tự click qua
luồng thật 1 lượt trước khi demo khách để bắt các vấn đề thuần thị giác
(màu sắc, căn lề, responsive) mà rà soát code không thấy được.

---

## Đã sửa (tìm thấy và fix ngay, không chỉ báo cáo)

### 1. Thiếu đường dẫn tới Báo giá đề xuất — chặn cả luồng demo

`WorkspaceHeader` (thanh trên cùng của trang khai thác dự án) chỉ có nút
"Dự toán" và "Tạo Project Brief" — **không có nút nào tới trang Báo giá
đề xuất** (`/projects/[id]/proposal`). Trước khi sửa, cách duy nhất để
tới trang đó là gõ tay URL. Đây là lỗi nghiêm trọng nhất tìm được — vì
Proposal chính là đích cuối của luồng demo, không có nút bấm nghĩa là
demo thật sẽ bị kẹt ở bước Estimate. Đã thêm nút "Báo giá đề xuất" cạnh
"Dự toán".

### 2. Xác nhận Estimate có thể "xác nhận nhầm" bản chưa lưu

Nếu sửa số liệu 1 dòng dự toán rồi bấm "Xác nhận" ngay mà chưa bấm
"Lưu", server sẽ xác nhận đúng **bản đã lưu TRƯỚC ĐÓ** (state
`selectedVersion` chưa đổi) — thay đổi vừa sửa bị bỏ qua hoàn toàn,
không có cảnh báo gì. Người dùng sẽ thấy Proposal thiếu đúng con số vừa
sửa mà không hiểu vì sao. Đã thêm theo dõi `isDirty`: khoá nút "Xác
nhận" + hiện dòng cảnh báo màu vàng khi có thay đổi chưa lưu.

---

## Findings theo từng nhóm (yêu cầu của task)

### Duplicated clicks

- Luồng Estimate → Xác nhận yêu cầu 2 bước tách biệt (Lưu, rồi Xác
  nhận) — **cố tình giữ 2 bước**, không gộp lại: "Lưu" tạo version mới
  (lịch sử), "Xác nhận" đánh dấu version đó là bản chốt — gộp lại sẽ mất
  khả năng "lưu nháp nhiều lần trước khi chốt" mà Milestone Estimate MVP
  Feature 2 (History) đã cố tình thiết kế. Không sửa.

### Confusing wording

- "Thiếu / Câu hỏi" (tiêu đề panel ở trang khai thác) hơi cộc, đọc như
  tên biến hơn câu tiếng Việt tự nhiên — mức độ nhẹ, chấp nhận được cho
  công cụ nội bộ, không sửa ngay.
- Thông báo lỗi API khi validate thất bại (`ZodError`) trả về dạng
  `"companyName: Required"` — lộ tên field kỹ thuật. Rủi ro thấp (antd
  Form đã validate phía client trước khi gọi API trong hầu hết trường
  hợp), nhưng là lỗi hệ thống chung (`lib/http.ts`), không riêng feature
  nào — nên xử lý ở mức toàn cục nếu Founder thấy xuất hiện thật khi
  demo, chưa sửa vì chưa có bằng chứng cụ thể cần (đúng A5).

### Unnecessary confirmation

- Không thấy dialog xác nhận thừa nào mới phát sinh từ Proposal/
  Contractor Profile. `modal.confirm` hiện chỉ dùng đúng chỗ cần (xoá
  dự án/bảng giá, tạo lại dự toán đè bản đang xem) — giữ nguyên.

### Missing validations

- Đã sửa mục "Xác nhận nhầm bản chưa lưu" ở trên — đây là missing
  validation quan trọng nhất tìm được.
- `defaultPaymentPlan` trong Settings không validate tổng % = 100 —
  **cố tình để ngỏ** (đã ghi rõ trong Domain Model: contractor tự chịu
  trách nhiệm nhập, MVP không auto-validate) — không phải bỏ sót.

### Ugly screens

- Không thể đánh giá đáng tin cậy chỉ bằng đọc code (spacing/màu sắc
  thực tế phụ thuộc render thật). Riêng 1 điểm chắc chắn từ code: trang
  Proposal khi in (`window.print()`) đã có CSS riêng
  (`.proposal-print-area`) bỏ shadow/bo góc Card cho giống tài liệu in —
  nhưng CHƯA thử in thật để xem ngắt trang (`page-break`) có ổn khi
  danh sách hạng mục dài. Founder nên thử in 1 bản villa (nhiều dòng
  nhất) trước khi demo khách.

### Technical wording exposed to users

- Không tìm thấy field JSON thô (`null`, tên field tiếng Anh, enum
  key) lộ ra UI khách hàng-facing (Proposal/Brief) — cả 2 trang đều đi
  qua lớp label tiếng Việt (`brief-view.ts`, `ProposalView.tsx`).
  `ZodError` ở mục "Confusing wording" là chỗ duy nhất có nguy cơ, chỉ ở
  phía Founder (API lỗi), không phải khách hàng nhìn thấy.

---

## Tổng kết

2 lỗi thật đã sửa (thiếu nav Proposal, xác nhận nhầm bản chưa lưu) — cả
hai đều có thể làm hỏng demo nếu không phát hiện trước. Còn lại là các
điểm polish nhỏ, chấp nhận được ở mức MVP demo, không chặn gì. Khuyến
nghị duy nhất: Founder tự click qua luồng thật 1 lượt (đặc biệt là in
Proposal ra PDF) trước khi demo khách, vì rà soát này chỉ đọc code,
không thấy được vấn đề thuần thị giác.
