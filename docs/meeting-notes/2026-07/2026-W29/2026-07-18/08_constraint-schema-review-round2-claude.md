# Constraint Schema Review — Round 2 (Claude)

> **Document Info**
> - Mục đích: review vòng cuối (2/2) cho Conceptual Schema sau khi 5
>   finding của Round 1 được xử lý — trả lời có đủ điều kiện freeze
>   Conceptual Schema hay không.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử.
> - Tài liệu liên quan:
>   [07_constraint-schema-review-round1-claude.md](07_constraint-schema-review-round1-claude.md).

Xác nhận cả 5 thay đổi (polymorphic `value`, bỏ `rules`, thêm
`household`, phân định `building`/`structure`, gộp `preferences` vào
field-level, nguyên tắc null-handling) đều giải quyết đúng finding tương
ứng ở Round 1. Không phản biện nội dung các thay đổi này.

## Critical còn lại — đúng 1 điểm

**`unresolved` chưa rõ có dùng chung shape `ConstraintField<T>` hay
không, và nó không nên dùng chung.** `ConstraintField<T>` giả định đã có
một `constraintType` được phân loại (exact/min/forbidden/preferred...).
Nhưng bản chất của `unresolved` là dữ liệu **chưa được phân loại** — ép
nó vào cùng shape với field đã compile sẽ tạo ra câu hỏi vô nghĩa
("`constraintType` của một thứ chưa resolve là gì?") và làm mờ ranh giới
giữa "đã compile" và "chưa compile được" — chính ranh giới mà No Silent
Drop cần giữ rõ.

**Đề xuất giải quyết ngay (không cần vòng 3):** `unresolved` là một type
riêng, không phải instance của `ConstraintField<T>`, ví dụ hình dạng
tối thiểu:

```text
UnresolvedEntry {
  sourceField   // field nào trong Requirement sinh ra mục này
  rawValue      // dữ liệu gốc, chưa diễn giải
  reason        // vì sao chưa compile được (optional, phục vụ debug)
}
```

Nếu chấp nhận đề xuất này, Critical duy nhất được đóng ngay trong vòng
này, không cần vòng 3.

**Xác nhận thêm (không phải finding):** `metadata` cũng không nên dùng
`ConstraintField<T>` — đó là dữ liệu compiler-internal (version,
compiledAt, tham chiếu Requirement), không phải constraint miền, nên
đứng ngoài abstraction này. Nêu rõ để không bị hiểu nhầm là mọi field
trong `ConstraintSet` đều phải đồng nhất một shape.

## Trả lời câu hỏi chính

**Conceptual Schema đủ điều kiện freeze**, với điều kiện chấp nhận đề
xuất `UnresolvedEntry` là type riêng ở trên (một quyết định nhỏ, không
cần thiết kế lại top-level). Không còn Critical nào khác có thể làm thay
đổi Conceptual Schema.

## Một ghi chú riêng, không thuộc Conceptual Schema (về đề xuất fixture)

Đề xuất viết 3-5 fixture (`simple-house`, `villa`, `townhouse`,
`interior-only`, `renovation`) đúng tinh thần Prototype-Driven Refinement
(A5). Nhưng `interior-only.json` và `renovation.json` test đúng phạm vi
đã được quyết định **hoãn** ở vòng Requirement Domain Model (§4.I — chỉ
nhà phố/biệt thự xây mới cho v1). Test 2 case này bây giờ có nguy cơ tạo
áp lực "sửa schema cho vừa" một phạm vi chưa được quyết định hỗ trợ —
chính là điều A5 muốn tránh (tối ưu trước khi có bằng chứng/nhu cầu
thật). Đề xuất: chỉ viết fixture cho 3 case đúng phạm vi MVP hiện tại
(`simple-house`, `villa`, `townhouse`); hoãn `interior-only`/`renovation`
tới khi phạm vi đó thực sự được xét lại.
