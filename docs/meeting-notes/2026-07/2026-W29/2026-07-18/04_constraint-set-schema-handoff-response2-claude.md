# Constraint Set Compiler — Schema Handoff Response #2 (Claude)

> **Document Info**
> - Mục đích: phản hồi cho `Architecture Handoff (Schema Design)` lần 2
>   — đánh giá Founder Notes (workflow mới) + đề xuất đổi tên quy ước
>   review, và nhắc lại việc chưa có Schema draft để review.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử.
> - Tài liệu liên quan:
>   [03_constraint-set-schema-handoff-response-claude.md](03_constraint-set-schema-handoff-response-claude.md).

## Architecture

Không có gì thay đổi, không mở lại — recap trong tài liệu khớp chính
xác với đã freeze. Không cần bàn thêm.

## Founder Notes — đánh giá

**Đồng ý, và đây không phải một nguyên tắc mới — là hệ quả vận hành của
Burden of Proof Rule + Evidence Quality đã có sẵn** (thiết kế 80%, dùng
Prototype/Manual POC để lấy bằng chứng thay vì tối ưu trước khi có bằng
chứng). Nên chính thức hoá bằng một dòng bổ sung vào
`docs/architecture/principles.md` để không bị quên khi module sau cũng
áp dụng — đã thêm (xem A5 bên dưới).

**Một ranh giới cần giữ khi áp dụng "80%":** 80% áp dụng cho các chi
tiết schema **chưa có bằng chứng cần thiết** (enum mở rộng, hỗ trợ
tương lai chưa dùng tới...), KHÔNG áp dụng cho các invariant đã freeze
(No Silent Drop, Explicit Precondition...) — những cái đó không phải
"20% có thể bỏ qua", chúng là điều kiện cần để schema hợp lệ. Nói rõ
ranh giới này để "đi nhanh" không vô tình trôi qua vào việc bỏ luôn
invariant đã chốt.

## Đề xuất đổi tên quy ước review — đánh giá

**Hợp lý, nên áp dụng**, với một điều chỉnh nhỏ: tên theo artifact
(Architecture/Schema/Prototype/Implementation Review) nên là **tiêu đề
mô tả nội dung**, tách biệt với **số thứ tự vị trí file trong ngày**
(`01_/02_/03_` — vẫn giữ, phản ánh trình tự thời gian, không phải số
vòng review). Trong mỗi artifact-stage, nếu có nhiều hơn 1 vòng (như
Constraint Architecture Review vừa mất 2 vòng), thêm hậu tố "Round N"
vào tiêu đề — chỉ khi thực sự có vòng 2 trở lên, không mặc định gắn "Round
1" cho mọi stage chỉ mất đúng 1 vòng (giữ tên gọn khi không cần).

Ví dụ áp dụng (không đổi tên file cũ — theo đúng Founder Notes "không
tối ưu trước những vấn đề chưa có bằng chứng", đổi tên hồi tố không giải
quyết vấn đề cụ thể nào): các file review tiếp theo dùng tiêu đề dạng
`<Module> <Artifact> Review` (+ `— Round N` nếu >1 vòng), file name vẫn
theo số thứ tự ngày như hiện tại. Đã ghi quy ước này vào
`docs/meeting-notes/README.md`.

## Vẫn chưa có Schema draft để review

4 câu hỏi vẫn đang hỏi về một Schema chưa được đính kèm — phần "Nhiệm
vụ" vẫn chỉ liệt kê phạm vi công việc (top-level structure, naming
convention, enum strategy...), không phải nội dung schema thật. Đây là
lần thứ 2 mục này được nhắc — không phải để trách, chỉ để chắc chắn
không có bản schema nào bị bỏ sót giữa 2 tin nhắn. Checklist 6 điểm đã
đăng ký ở
[03_...](03_constraint-set-schema-handoff-response-claude.md) vẫn còn
hiệu lực, không cần lặp lại. Đợi bản Schema Design draft cụ thể để review
theo đúng 4 câu hỏi.
