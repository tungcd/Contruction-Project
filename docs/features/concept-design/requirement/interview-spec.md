# Interview Spec

> **Document Info**
> - Mục đích: đặc tả luồng phỏng vấn AI (Conversation → Requirement
>   JSON) — Interview/Draft State, cách hỏi, cách xử lý assumption.
> - Đối tượng đọc chính: người triển khai/sửa AIProvider extraction,
>   prompt engineering.
> - Trạng thái: **Skeleton** — chờ nội dung.
> - Tài liệu liên quan:
>   [requirement-domain-model.md](requirement-domain-model.md) (§3 —
>   Interview/Draft State là ephemeral, không phải Requirement
>   persisted), `apps/web/scripts/regression.mjs` (AI Contract Test cho
>   module này).

<!-- Skeleton — nội dung do ChatGPT soạn -->

## 1. Phạm vi

Interview/Draft State là ephemeral, KHÔNG phải một phần của Requirement
persisted (nhắc lại boundary từ domain model §3).

## 2. Luồng phỏng vấn

Conversation → extraction call → merge vào Requirement JSON hiện có →
tính lại missing fields → câu hỏi tiếp theo.

## 3. Quy tắc suy diễn (không đoán mò)

Tri-state null/true/false — không bao giờ suy diễn `false` từ im lặng.

## 4. Trạng thái xác nhận (Confirmation Gate)

Khi nào Requirement chuyển `draft → needs_clarification → ready →
confirmed`; hành động "Xác nhận yêu cầu" trước khi vào Constraint Set
Compiler.

## 5. AI Contract Testing

Golden Conversation / Golden Output — tham chiếu
`apps/web/scripts/regression.mjs`, quy tắc mở rộng case khi phát hiện
bug extraction mới.
