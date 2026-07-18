# Concept Design Pipeline (M4)

> **Document Info**
> - Mục đích: tổng quan pipeline "AI Concept Design" — sinh bản vẽ phối
>   cảnh/kỹ thuật từ Requirement khách hàng. Không đi sâu implementation.
> - Đối tượng đọc chính: ChatGPT, Claude, Founder.
> - Trạng thái: **Reference** (tổng quan) — chi tiết từng giai đoạn nằm
>   trong thư mục con của nó, trạng thái frozen/draft xem tại đó.
> - Tài liệu liên quan: [requirement/](requirement/),
>   [constraint/](constraint/), `documents/CHATGPT_CONTEXT/2026-07/
>   2026-W29/2026-07-18/10_Frozen-Architecture-M4-001...md` (nguồn gốc
>   kiến trúc pipeline này, trước khi có `docs/`).

## Canonical Flow

```text
Conversation → Requirement → Constraint Set → Design Intent Graph
  → Geometry → Descriptor → Prompt → Image → Concept Package
```

Mỗi mũi tên là ranh giới module. `Requirement → Constraint Set` và mọi
bước tất định khác không được diễn giải văn xuôi tự do (xem
[architecture/principles.md](../../architecture/principles.md)).
Design Intent Graph Generation và Image Generation là 2 giai đoạn AI có
rủi ro chất lượng cần benchmark liên tục (AI Contract Testing).

## Trạng thái từng module

| Module | Thư mục | Trạng thái |
|---|---|---|
| Requirement | [requirement/](requirement/) | Domain Model đã đồng thuận qua 5 vòng thảo luận (`documents/milestone_1/01_`–`09_`), chờ ChatGPT soạn nội dung Frozen v1.0. |
| Constraint Set Compiler | [constraint/](constraint/) | Được chọn là module tiếp theo để thiết kế/freeze (100% tất định, không cần chờ bằng chứng AI). Chưa bắt đầu. |
| Design Intent Graph | *(chưa có thư mục)* | Rủi ro cao nhất của pipeline — nên đợi bằng chứng Manual POC trước khi freeze chi tiết. |
| Geometry | *(chưa có thư mục)* | Chờ Design Intent Graph. |
| Descriptor | *(chưa có thư mục)* | Chờ Constraint Set Compiler + dữ liệu hội thoại thật. |
| Prompt / Image | *(chưa có thư mục)* | Chờ các module trên. |

## Manual POC — thứ tự ưu tiên rủi ro

1. Design Intent Graph có geometrically realizable với chiến lược
   Geometry đã chọn không.
2. Chiến lược Geometry (rectangle-subdivision) có generalize với đất
   thật đa dạng không.
3. Bảng Descriptor cố định có giữ được tính tất định khi gặp ngôn ngữ
   khách hàng thật không.
