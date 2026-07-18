# Frozen Architecture

> **Document Info**
> - Mục đích: định nghĩa "Frozen Document" là gì, khi nào một tài liệu
>   được freeze, và quy trình freeze/supersede.
> - Đối tượng đọc chính: ChatGPT, Claude, Founder, và bất kỳ ai triển
>   khai code dựa trên tài liệu ở đây.
> - Trạng thái: **Source of Truth** cho quy trình freeze (bản thân file
>   này), còn các file khác trong thư mục là Source of Truth cho nội
>   dung kiến trúc của chúng.
> - Tài liệu liên quan: [../draft/](../draft/) (nguồn trước khi freeze),
>   [../decisions/](../decisions/) (lý do đằng sau các quyết định trong
>   tài liệu frozen).

## Frozen Document là gì

Một tài liệu mô tả domain model/boundary/canonical flow của một
module, đã được Founder xác nhận là **đủ điều kiện dừng thảo luận** và
trở thành tham chiếu chính thức cho việc triển khai (implementation,
Requirement Template, Constraint Set Compiler, v.v.).

**Freeze không có nghĩa là mọi bài toán phía sau đã được giải quyết.**
Một tài liệu được phép freeze nếu các phần chưa giải quyết được ghi
nhận minh bạch trong một mục "Open Boundaries" — không được phép freeze
trong im lặng (silently assumed solved).

## Khi nào được freeze

Theo [Burden of Proof Rule và Evidence Quality](../principles.md) (A1,
A3): một module chỉ nên freeze ở độ chi tiết cao khi đã có bằng chứng
implementation thật đứng sau nó (như Requirement — đã có tháng vận
hành thật). Module chưa có bằng chứng (còn là giả thuyết AI, ví dụ
Design Intent Graph trước Manual POC) nên giữ ở mức draft/contract thô,
chưa freeze chi tiết.

## Quy trình freeze

```text
draft/ (thảo luận, tối đa 2 vòng review theo quy ước hiện tại)
  → Founder ra quyết định cuối nếu còn bất đồng sau 2 vòng
  → nội dung được soạn lại thành tài liệu frozen (không phải bản thảo luận thô)
  → ADR tương ứng được tạo trong decisions/
  → di chuyển/tạo file trong frozen/
```

## Quy trình supersede

Khi một tài liệu frozen cần thay đổi (theo đúng Burden of Proof Rule —
phải có concrete reason):

1. Tạo bản draft mới trong `draft/` giải thích thay đổi + lý do cụ thể.
2. Sau khi Founder chốt, tài liệu frozen cũ được đánh dấu
   `Status: Superseded by <link>` trong khối Document Info của nó
   (không xoá — giữ lịch sử).
3. Tài liệu frozen mới ghi rõ `Supersedes: <link tài liệu cũ>` và tăng
   version (vd v1.0 → v2.0).
4. ADR mới ghi rõ lý do supersede, trỏ ngược lại ADR cũ.

Thư mục này hiện chưa có tài liệu frozen nào ngoài việc chờ ChatGPT soạn
nội dung `Requirement Domain Model v1.0` (xem
[features/concept-design/requirement/](../../features/concept-design/requirement/)).
