# Constraint Set Compiler — Architecture Review #2 (Claude)

> **Document Info**
> - Mục đích: review vòng 2/2 (giới hạn cuối theo quy ước đã thống
>   nhất) cho kiến trúc Constraint Set Compiler — trả lời câu hỏi có đủ
>   điều kiện chuyển sang Schema Design chưa.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử — không phải quyết định.
> - Tài liệu liên quan:
>   [01_constraint-set-compiler-review-1.md](01_constraint-set-compiler-review-1.md),
>   `docs/features/concept-design/constraint/constraint-domain-model.md`.

Phản hồi cho `Constraint Set Compiler — Architecture Review #2`.

---

## Xác nhận 4 điểm Accepted

Cả 4 đều hợp lý, không phản biện: Explicit Precondition (fail-fast, no
partial output), No Silent Drop (đối xứng No Information Creation,
preserve + explicit thay vì biến mất), Estimate Boundary (đọc mọi field,
không thực hiện business logic/giá/section), và tách Invariant (tính
chất bất biến) khỏi Boundary (responsibility) cho "Normalize Only".

## Về việc defer Descriptor hidden coupling

Đồng ý defer. Đây đúng là quyết định áp dụng đúng Burden of Proof Rule:
finding phụ thuộc vào hình dạng cụ thể của Constraint Set Schema (chưa
tồn tại), nên chưa có gì cụ thể để freeze ở tầng architecture. Cũng đúng
với giới hạn "không mở rộng sang module khác" của vòng review này.

**Một điều cần theo dõi (không phải finding mới, không yêu cầu xử lý
ngay):** invariant "No Silent Drop" vừa được chấp nhận bảo vệ phía
Constraint Set Compiler (không làm mất dữ liệu ở đầu ra của NÓ). Nhưng
để chuỗi bảo toàn thực sự khép kín tới Descriptor, module Descriptor khi
tới lượt review kiến trúc riêng cũng cần một invariant đối xứng ở đầu
vào của nó (không bỏ qua dữ liệu "chưa cấu trúc hoá" mà Constraint Set
Compiler truyền sang). Không cần quyết định gì bây giờ — chỉ ghi nhận
đây là một phụ thuộc giữa 2 module tương lai, để không bị quên khi
Descriptor bắt đầu vòng review của nó.

---

## Câu hỏi chính: đã đủ ổn để chuyển sang Schema Design chưa?

**Có, đủ ổn ở cấp độ architecture.** Sau khi rà lại toàn bộ tập hợp
invariant/boundary hiện tại (bao gồm 4 thay đổi vừa accepted), không tìm
thấy vấn đề nào đủ lớn để chặn việc chuyển sang Schema Design.

Có đúng **một điểm cần làm rõ** — không phải blocker, chỉ là một lưu ý
nên mang theo khi thiết kế schema:

**Phạm vi của "validate" (một trong 4 responsibility đã có) nên được
hiểu rõ là bao gồm cả kiểm tra nhất quán chéo giữa các field (cross-field
consistency), không chỉ kiểm tra kiểu dữ liệu từng field riêng lẻ.** Ví
dụ cụ thể: nếu `otherRooms` và `excludedRooms` cùng chứa một tên phòng
giống nhau (khách vừa nói muốn có vừa nói không cần — mâu thuẫn), đây là
lúc invariant Explicit Precondition/fail-fast cần áp dụng, không phải
một trường hợp compiler phải "chọn giúp" cái nào đúng. Điều này không
cần một invariant mới — nó đã nằm trong phạm vi "validate" sẵn có, chỉ
cần nói rõ khi viết schema để không bị bỏ sót.

*(Đã cân nhắc và loại bỏ 1 khả năng khác không đưa vào: liệu "confirmed"
có tự động đảm bảo Requirement nhất quán nội bộ hay không — đây là
assumption của Explicit Precondition, nhưng việc đảm bảo nó là trách
nhiệm của cơ chế xác nhận ở Requirement, không phải của Constraint Set
Compiler; module này chỉ cần tự defensive qua chính bước "validate" của
mình như trên, nên không cần mở sang module khác để giải quyết.)*

**Kết luận:** sẵn sàng chuyển sang Schema Design. Đây là vòng review 2/2
— không còn bất đồng nào cần Founder phân xử thêm.
