# Constraint Set Compiler

> **Document Info**
> - Mục đích: điểm vào tài liệu Constraint Set Compiler — module tiếp
>   theo được chọn để thiết kế/freeze sau Requirement.
> - Đối tượng đọc chính: ChatGPT (thiết kế), Claude (review), người
>   triển khai.
> - Trạng thái: Index.
> - Tài liệu liên quan:
>   [../requirement/requirement-domain-model.md](../requirement/requirement-domain-model.md)
>   (§6, §8 — Constraint Set Compiler là Anti-Corruption Layer, và là nơi
>   giải quyết Open Boundary về `otherRooms`/`excludedRooms`).

Constraint Set Compiler nhận Requirement JSON (đã `confirmed`), sinh ra
Constraint Set — **100% tất định**, không diễn giải văn xuôi tự do
(Golden Contract #3, `documents/CHATGPT_CONTEXT/2026-07/2026-W29/
2026-07-18/11_Phase-A-Golden-Pipeline-Specification.md`).

**Vì sao module này được chọn để freeze tiếp theo** (không phải Design
Intent Graph/Geometry/Descriptor): nó không đặt cược vào hành vi AI chưa
kiểm chứng — có thể freeze domain model với độ tin cậy tương đương
Requirement mà không vi phạm Burden of Proof Rule (xem
`documents/milestone_1/09_requirement-domain-model-final-confirmation-claude.md`).
Nó cũng là điều kiện tiên quyết để chạy Manual POC ưu tiên cao nhất
(Design Intent Graph realizability).

## Tài liệu trong thư mục này

Chỉ 2 file — khác với `requirement/` (4 file), vì Constraint Set không
có bản render cho người đọc (không cần "template") và không có bước
phỏng vấn (không cần "interview-spec").

| File | Vai trò | Trạng thái |
|---|---|---|
| [constraint-domain-model.md](constraint-domain-model.md) | Domain model, boundary, ranh giới tất định | Skeleton — chưa bắt đầu thiết kế |
| [constraint-compiler-spec.md](constraint-compiler-spec.md) | Đặc tả chi tiết cơ chế biên dịch (input/output/acceptance criteria) | Skeleton |
