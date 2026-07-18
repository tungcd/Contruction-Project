# Architecture Decision Records (ADR)

> **Document Info**
> - Mục đích: định nghĩa format, quy ước đặt tên, và lifecycle của ADR.
> - Đối tượng đọc chính: ChatGPT (khi viết ADR), Claude (khi review ADR),
>   Founder.
> - Trạng thái: **Source of Truth** cho quy ước ADR. Mỗi file ADR trong
>   thư mục này là Source of Truth cho đúng quyết định đó.
> - Tài liệu liên quan: [ADR-TEMPLATE.md](ADR-TEMPLATE.md),
>   [../frozen/](../frozen/) (tài liệu mà ADR giải thích lý do).

## Vì sao ADR

`frozen/` trả lời **"kiến trúc là gì"**. `decisions/` trả lời **"vì sao
lại quyết định như vậy"** — bao gồm cả phương án đã bị loại bỏ và lý do.
Tách riêng để: dễ tìm (mỗi quyết định 1 file, git history riêng), dễ
review (không phải đọc lại cả tài liệu để hiểu 1 quyết định), dễ
supersede (không sửa đè lịch sử).

## Naming convention

```text
<MODULE>-D<n>-<slug-tieng-anh-ngan>.md
```

- `MODULE`: mã module viết hoa, ngắn (`REQ`, `CONSTRAINT`, `DIG` cho
  Design Intent Graph, `GEO` cho Geometry, `DESC` cho Descriptor...).
- `D<n>`: số thứ tự quyết định **trong module đó**, không phải số toàn
  cục — vd `REQ-D1`, `REQ-D2`, ..., `CONSTRAINT-D1`.
- `slug`: vài từ khoá tiếng Anh, không dấu, nối bằng `-`.

Ví dụ: `REQ-D1-requirement-json-canonical.md`.

**Vì sao không dùng số thứ tự `01_/02_` như quy ước
`documents/CHATGPT_CONTEXT/`:** quy ước đó dùng cho file thảo luận theo
trình tự thời gian trong 1 thư mục. ADR là record độc lập, cần ID tự mô
tả (biết ngay thuộc module nào) hơn là biết vị trí trong dòng thời gian.

## Lifecycle

| Status | Ý nghĩa |
|---|---|
| `Proposed` | Đang thảo luận trong `draft/`, chưa có ADR chính thức. |
| `Accepted` | Founder đã chốt — trạng thái phổ biến nhất khi tạo file ADR. |
| `Superseded by <ID>` | Đã bị thay thế bởi quyết định mới hơn — không xoá file cũ. |
| `Deprecated` | Không còn áp dụng (module bị loại bỏ), không có ADR thay thế. |

## Template

Dùng [ADR-TEMPLATE.md](ADR-TEMPLATE.md) cho mọi ADR mới.

Thư mục này hiện chưa có ADR nào — ChatGPT sẽ tạo `REQ-D1` đến `REQ-D8`
(và các ADR về Process Principles nếu cần) khi soạn nội dung Requirement
Domain Model v1.0.
