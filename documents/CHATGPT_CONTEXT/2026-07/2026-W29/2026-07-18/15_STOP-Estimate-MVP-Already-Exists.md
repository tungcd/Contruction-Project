# STOP — Estimate MVP đã tồn tại, chưa nên "bắt đầu" lại từ đầu

**Ngày:** 2026-07-18
**Gửi:** Founder + ChatGPT
**Trạng thái:** Dừng để xác nhận trước khi thực thi "MVP Demo-First Strategy".

---

## Phát hiện

Tài liệu `CONTEXT — AI Construction Copilot: MVP Demo-First Strategy`
yêu cầu bắt đầu "Estimate MVP" như một module hoàn toàn mới — phân tích
lại 2 file Excel thật, thiết kế lại Estimate Domain Model, viết lại
Estimate Engine từ đầu.

**Việc này đã được làm, đã hoàn thành, và đang chạy thật trong sản phẩm:**

- `documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-17/
  01_Analysis-M3-001-BOQ-Mapping-Engine.md` — đã phân tích **đúng 2 file**
  được nhắc trong context mới (`260309_BG CHI LINH ver 2.xlsx`,
  `2025.09.22 BOQ BAO GIA Mr Hung...xlsx`), kết luận: mô phỏng theo
  phong cách File 1 (đơn giá gộp), không theo File 2 (cần tích hợp định
  mức Nhà nước, ngoài phạm vi MVP).
- `.../02_Design-M3-002-BOQ-Draft-Schema-Rule-Catalog.md` — thiết kế
  BOQ Draft Schema + Rule Catalog dựa trên phân tích trên.
- `.../06_Completion-Report-Milestone-Estimate-MVP-Feature1-6.md` —
  **Milestone Estimate MVP đã hoàn thành cả 6 feature**: Persist
  Estimate Draft, Estimate History, Estimate Editor, Estimate Summary,
  PriceBook CRUD, Export Excel v1.
- Code đang chạy: `apps/web/src/lib/estimate/` (~1100 dòng: `engine.ts`,
  `sections.ts`, `rules/finishing.ts`, `rules/sanitaryEquipment.ts`,
  `excelExport.ts` dùng ExcelJS...), `EstimateDraft`/`PriceBook`/
  `PriceBookEntry` (Prisma), UI Estimate Editor
  (`app/projects/[id]/estimate/page.tsx`), API export
  (`app/api/estimate/export/route.ts`).
- PriceBook chuẩn đã import: `standard_pricebook_v1_80_items.*` (M3-008,
  Business Code taxonomy đã redesign, verified 24/29 dòng auto-price).

## Một mâu thuẫn kiến trúc cụ thể cần Founder quyết định

Context mới (mục 8) yêu cầu: *"Primary input: ConstraintSet... Should
not bypass Constraint Set and depend directly on Requirement unless
strictly necessary."*

Nhưng:

1. **Estimate Engine đang chạy nhận `Requirement` trực tiếp**
   (`buildEstimateDraft(requirement: Requirement, settings, priceBook)`
   — `apps/web/src/lib/estimate/engine.ts:21`), không phải
   `ConstraintSet`.
2. Đây KHÔNG phải nợ kỹ thuật bị bỏ sót — đây đúng là quyết định đã
   thống nhất hôm nay ở Constraint Schema Review: *"Requirement phục vụ
   2 consumer có áp lực tiến hoá khác nhau: Estimate Engine (cần field
   phẳng, cố định tên) và Concept Design pipeline... Constraint Set
   Compiler không thực hiện Estimate business logic"* — tức Estimate
   Engine đọc Requirement trực tiếp là **thiết kế có chủ đích**, không
   phải vi phạm cần sửa.

Theo Burden of Proof Rule: chưa có concrete failure mode nào cho thấy
Estimate Engine đọc Requirement trực tiếp là sai — nên **không nên đổi
input sang ConstraintSet chỉ vì muốn nhất quán với sơ đồ pipeline M4**.
Việc này sẽ là redesign một hệ thống đang chạy thật mà không có lý do cụ
thể, đúng loại rủi ro Burden of Proof Rule được lập ra để chặn.

## Đề xuất

Không thực hiện "Immediate Next Action" (phân tích lại Excel, viết lại
Estimate Domain Model/Engine) như tài liệu yêu cầu. Thay vào đó:

1. Giữ nguyên Estimate Engine đọc `Requirement` (khớp code đang chạy +
   quyết định Anti-Corruption-Layer đã có).
2. Đánh giá lại 6 feature Milestone Estimate MVP đã có so với mục tiêu
   Demo-First mới (60-70% draft hữu ích, xuất Excel dùng được) — phần
   thật sự CHƯA có là **Proposal MVP** (mục 15 context mới) và có thể là
   **độ khớp Excel export với đúng layout 2 file mẫu thật** (hiện tại
   "không cần giống 100%" theo quyết định Milestone cũ — có thể cần
   nâng cấp nếu Demo-First muốn giống thật hơn).
3. Founder xác nhận: Estimate Engine tiếp tục nhận `Requirement` hay
   cần chuyển sang `ConstraintSet` (là một quyết định kiến trúc thật,
   không nên mặc định theo tài liệu mới mà không xác nhận).
