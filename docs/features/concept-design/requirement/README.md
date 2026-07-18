# Requirement

> **Document Info**
> - Mục đích: điểm vào cho toàn bộ tài liệu Requirement feature.
> - Đối tượng đọc chính: ChatGPT (viết nội dung), Claude (review),
>   người triển khai Requirement JSON Schema/Template/Interview.
> - Trạng thái: Index.
> - Tài liệu liên quan: `documents/milestone_1/01_`–`09_` (toàn bộ log
>   thảo luận dẫn tới các file skeleton dưới đây).

Requirement ghi nhận **ý định khách hàng** (customer intent), không
phải thiết kế (xem nguyên tắc "Requirement is not Design" — sẽ nằm
trong `requirement-domain-model.md`).

## Tài liệu trong thư mục này

| File | Vai trò | Trạng thái |
|---|---|---|
| [requirement-domain-model.md](requirement-domain-model.md) | Domain model, boundary, canonical flow — **source of truth chính** | Skeleton — chờ ChatGPT soạn nội dung (Frozen v1.0) |
| [requirement-json-schema.md](requirement-json-schema.md) | Schema field-by-field, tham chiếu `packages/shared-types/src/requirement.ts` | Skeleton |
| [requirement-template.md](requirement-template.md) | Đặc tả bản render Requirement.md cho người đọc (Founder/kiến trúc sư) | Skeleton |
| [interview-spec.md](interview-spec.md) | Đặc tả luồng phỏng vấn AI (Conversation → Requirement JSON) | Skeleton |

`requirement-domain-model.md` là **source of truth**; 3 file còn lại là
**đặc tả triển khai chi tiết hơn**, phải nhất quán với nó — nếu mâu
thuẫn, domain model thắng (rồi cập nhật file kia).
