# Meeting Notes

> **Document Info**
> - Mục đích: log thảo luận theo thời gian — quá trình đi tới các quyết
>   định, không phải bản thân quyết định.
> - Đối tượng đọc chính: ChatGPT, Claude, Founder (tra cứu bối cảnh/lý
>   do lịch sử).
> - Trạng thái: **Reference lịch sử** — KHÔNG phải kiến trúc chính thức.
>   Không được trích dẫn như đã chốt; nếu một thảo luận ở đây hội tụ
>   thành quyết định, quyết định đó phải được ghi lại trong
>   `architecture/decisions/` (ADR) hoặc `architecture/frozen/`
>   (domain model), không phải chỉ nằm trong log này.
> - Tài liệu liên quan: `documents/CHATGPT_CONTEXT/` và
>   `documents/milestone_1/` — 2 thư mục đó là nơi log thảo luận **hiện
>   tại** đang nằm (trước khi có `docs/`), giữ nguyên vị trí, không di
>   chuyển ngay.

## Quy ước

Dùng lại đúng cấu trúc đã có ở `documents/CHATGPT_CONTEXT/` thay vì phát
minh quy ước mới (Simplicity before Generality):

```text
meeting-notes/
  <year>-<month>/
    <ISO-week>/
      <YYYY-MM-DD>/
        01_chu-de.md
        02_chu-de-khac.md
```

- Đánh số `01_`, `02_`... **reset theo từng ngày** (thư mục
  `YYYY-MM-DD/`), không phải số toàn cục.
- Đổi tên file (chèn/xoá) dùng `git mv` để giữ lịch sử, và cập nhật lại
  mọi cross-reference trỏ tới file bị đổi tên.
- Xem ví dụ đã áp dụng: [2026-07/2026-W29/2026-07-18/](2026-07/2026-W29/2026-07-18/).

Các thảo luận trước đó (Requirement Domain Model, 5+2 vòng) vẫn nằm
nguyên trong `documents/milestone_1/` — không di chuyển ngược lại.

## Quy ước đặt tên (title, không phải tên file)

Tiêu đề file đặt theo **artifact đang được review/freeze**, không phải
số thứ tự tuỳ ý:

```text
<Module> <Artifact> Review[ — Round N]
```

- `Artifact` ∈ {Architecture, Schema, Prototype, Implementation} —
  artifact là thứ được freeze, không phải vòng review.
- `Round N` chỉ thêm khi artifact đó thực sự cần **hơn 1 vòng** để hội
  tụ (ví dụ Constraint Architecture Review mất 2 vòng) — không mặc định
  gắn "Round 1" cho stage chỉ mất đúng 1 vòng.
- Số thứ tự file (`01_/02_/03_`) vẫn giữ nguyên — phản ánh **vị trí thời
  gian trong ngày**, độc lập với số Round trong tiêu đề.
- Không đổi tên hồi tố các file cũ theo quy ước này (Simplicity before
  Generality / Prototype-Driven Refinement — xem
  [../architecture/principles.md](../architecture/principles.md) A5) —
  chỉ áp dụng cho file mới từ nay.
