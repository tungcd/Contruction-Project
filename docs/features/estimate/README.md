# Estimate Engine

> **Document Info**
> - Mục đích: điểm vào tài liệu Estimate Engine (Rule Engine, Business
>   Code taxonomy).
> - Đối tượng đọc chính: người triển khai/sửa Rule Engine, PriceBook.
> - Trạng thái: **Skeleton** — feature đã implement và đang chạy, tài
>   liệu domain model đang được bổ sung dần (không phải viết lại từ
>   đầu).
> - Tài liệu liên quan: `apps/web/src/lib/estimate/` (source of truth
>   thực thi), `documents/CHATGPT_CONTEXT/2026-07/.../02_Completion-
>   Report-M3-008-Rule-Catalog-Business-Code-Refactor.md` (lịch sử
>   thiết kế Business Code taxonomy).

Nội dung domain model (Business Code taxonomy `domain.subject.variant`,
`resolveUnitPrice()` exact-match-only, ranh giới với Requirement — xem
[../concept-design/requirement/requirement-domain-model.md](../concept-design/requirement/requirement-domain-model.md)
§6 Anti-Corruption Layer) sẽ được bổ sung khi cần, không bắt buộc ngay.
