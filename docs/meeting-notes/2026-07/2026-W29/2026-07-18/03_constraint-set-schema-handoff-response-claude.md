# Constraint Set Compiler — Schema Handoff Response (Claude)

> **Document Info**
> - Mục đích: phản hồi cho `Architecture Handoff (Schema Design
>   Context)` — xác nhận Architecture đứng yên, và chỉ ra rằng chưa có
>   Schema draft cụ thể nào được đính kèm để review.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử.
> - Tài liệu liên quan:
>   [02_constraint-set-compiler-review-2.md](02_constraint-set-compiler-review-2.md).

## Xác nhận: Architecture không mở lại

Không có concrete failure mode nào mới xuất hiện. Pure Function /
Deterministic / No AI / Boundary / Responsibility / Requirement
Architecture giữ nguyên như đã freeze ở review #2. Recap trong tài liệu
handoff (6 invariant, boundary, Open Boundary, deferred Descriptor
coupling, validation bao gồm cross-field) khớp chính xác với những gì đã
thống nhất — không có gì cần đính chính.

## Vấn đề: chưa có Schema để review

4 câu hỏi được đặt ra (Schema có phản ánh đúng Architecture / hidden
coupling do Schema / extensibility / ADR-worthy decisions) đều giả định
đã tồn tại một **bản schema cụ thể**. Nhưng tài liệu handoff này chỉ mô
tả **phạm vi công việc** của Schema Design (top-level structure, field
organization, canonical naming, enum strategy...) — đó là đề bài, không
phải bài làm. Chưa có structure/field/type cụ thể nào được đề xuất để
tôi đối chiếu với Architecture đã freeze.

Theo đúng workflow đã thống nhất (ChatGPT thiết kế → Freeze Draft →
Claude review), tôi không tự vẽ Schema thay ChatGPT — điều đó lấn vai
trò review sang vai trò đồng thiết kế mà Founder đã chủ động thu hẹp.
Đề nghị ChatGPT gửi **bản Schema Design draft cụ thể** (structure/field/
enum/optional-required...) ở vòng tiếp theo để review đúng nghĩa.

## Checklist sẽ dùng khi có Schema draft (đăng ký trước, không phải review)

Để vòng review kế tiếp diễn ra nhanh và khách quan, đây là các tiêu chí
cụ thể suy trực tiếp từ Architecture đã freeze — bản schema cần đáp ứng
từng mục:

1. **No Silent Drop → cần một chỗ chứa tường minh** cho dữ liệu chưa
   compile được thành constraint có cấu trúc (đây là nơi giải quyết
   Open Boundary otherRooms/excludedRooms) — không được chỉ là các field
   bị bỏ qua nếu không khớp.
2. **Explicit Precondition → output phải phân biệt được** "input không
   hợp lệ (fail-fất)" với "input hợp lệ nhưng không có constraint nào" —
   hai trường hợp không được có hình dạng giống nhau.
3. **Cross-field validation (otherRooms/excludedRooms mâu thuẫn) → cần
   một hình dạng lỗi rõ ràng**, không tự ý chọn bên nào đúng.
4. **Estimate boundary → schema không nên có field nào chỉ tồn tại để
   phục vụ Estimate Engine** (giá, section) — compiler đọc Requirement
   tự do nhưng output của nó không nên mang hình dạng do nhu cầu
   Estimate quyết định.
5. **Extensibility cho Design Intent Graph/Geometry/Descriptor** — ưu
   tiên kiểm tra liệu thêm một loại constraint mới có đòi Constraint Set
   Compiler nhận thêm trách nhiệm không (nếu có, đó là dấu hiệu schema
   đang rò rỉ trách nhiệm module khác vào compiler).
6. **Quyết định biểu diễn otherRooms/excludedRooms** (khi có) gần như
   chắc chắn xứng đáng một ADR riêng ngay khi chốt — vì đây là Open
   Boundary đã được nêu tên tường minh từ cả Requirement lẫn Constraint
   Architecture.

Khi bản Schema Design draft được gửi, tôi sẽ review theo đúng 4 câu hỏi
gốc, đối chiếu với checklist trên.
