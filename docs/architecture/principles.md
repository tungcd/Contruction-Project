# Architecture Principles

> **Document Info**
> - Mục đích: nguyên tắc ra quyết định kiến trúc + quy ước tài liệu, áp
>   dụng cho MỌI feature/module trong dự án.
> - Đối tượng đọc chính: ChatGPT (khi thiết kế), Claude (khi review),
>   Founder (khi ra quyết định cuối).
> - Trạng thái: **Source of Truth**. Tài liệu module khác chỉ được phép
>   **tham chiếu** (link) tới đây, không copy nội dung vào.
> - Tài liệu liên quan: mọi file trong `architecture/frozen/` và
>   `features/*/`.

Được đúc kết từ chuỗi thảo luận Requirement Domain Model
(`documents/milestone_1/`, 2026-07-18).

---

## A. Nguyên tắc ra quyết định (Decision-Making Principles)

### A1. Burden of Proof Rule

Không redesign kiến trúc hiện có chỉ vì mô hình mới "đẹp hơn", "tổng
quát hơn", hoặc "nhất quán hơn". Một thay đổi kiến trúc chỉ được chấp
nhận khi chỉ ra được ít nhất một: failure mode cụ thể, incorrect
behavior, migration blocker, scalability blocker, hoặc business blocker.
Nếu không có bằng chứng cụ thể, implementation hiện tại được giữ
nguyên.

**Vì sao:** với một solo founder, không có tiêu chí dừng sẽ dẫn tới vòng
lặp redesign vô hạn — luôn có một mô hình lý thuyết "thuần" hơn.

### A2. Domain drives implementation. Implementation validates domain.

Domain Model đưa ra giả thuyết; implementation cung cấp bằng chứng. Khi
implementation cho thấy domain model sai/thiếu, domain model cập nhật.
Khi domain model chứng minh implementation không đáp ứng đúng business
(có concrete reason, theo A1), implementation refactor.

### A3. Evidence quality matters more than idea quality

Hệ quả của A1+A2: bằng chứng từ implementation **đã được kiểm chứng
thực tế** (đã chạy, đã qua use case thật) có trọng số cao hơn một domain
model mới **chưa từng được thử nghiệm** — không phải vì implementation
có trước, mà vì nó là bằng chứng đắt hơn, khó thu thập lại hơn đối với
một đội ngũ một người.

**Hệ quả áp dụng:** một module chỉ nên freeze domain model ở độ chi
tiết cao khi đã có bằng chứng implementation thật đứng sau nó. Module
chưa có implementation (còn là giả thuyết AI) nên freeze ở mức thô
(boundary/contract), chưa nên freeze chi tiết cho tới sau Manual POC.

### A4. Simplicity before Generality

Không thiết kế cho nhu cầu tổng quát hoá chưa có bằng chứng cần thiết.
Ba dòng tương tự tốt hơn một abstraction sớm. Áp dụng cùng tinh thần với
A1 — tổng quát hoá cũng là một dạng "redesign" cần bằng chứng.

### A5. Move fast. Never violate frozen decisions. (Prototype-Driven Refinement, "thiết kế 80%")

Fast iteration áp dụng cho chi tiết implementation/schema. Không bao giờ
áp dụng cho invariant kiến trúc đã freeze.

Không cố thiết kế hoàn hảo trước khi code. Chấp nhận thiết kế ở mức
~80%, sau đó Prototype/Manual POC để lấy bằng chứng thực tế, rồi refine.
Review chỉ tập trung vào quyết định có ảnh hưởng kiến trúc; không tối ưu
trước cho vấn đề chưa có bằng chứng.

**Ranh giới bắt buộc:** "80%" chỉ áp dụng cho chi tiết **chưa có bằng
chứng cần thiết** (enum mở rộng, khả năng tương lai chưa dùng tới...).
KHÔNG áp dụng cho các invariant đã freeze ở tầng Architecture (vd No
Silent Drop, Explicit Precondition) — đó là điều kiện cần, không phải
phần "20% có thể bỏ qua". Đây là hệ quả vận hành của A1+A3, chính thức
hoá từ quyết định Founder ngày 2026-07-18 (Constraint Set Compiler
Schema Handoff).

---

## B. Quy ước tài liệu (Documentation Process Principles)

### B1. Docs-as-Code

Tài liệu kỹ thuật sống trong `docs/`, version cùng Git, không phụ thuộc
Notion/Google Docs làm nguồn chính thức. Áp dụng nguyên tắc như một kỷ
luật ngay từ đầu (gần như miễn phí); **hoãn đầu tư tooling** (doc site,
linter, CI check) cho tới khi có bằng chứng cụ thể về lệch pha
code/tài liệu gây hại — đúng tinh thần A1.

### B2. ADR Convention — 1 Decision = 1 File

Mỗi quyết định kiến trúc là một file riêng trong
`architecture/decisions/`, đặt tên `MODULE-Dn-slug.md` (vd
`REQ-D1-requirement-json-canonical.md`). Xem chi tiết format tại
[decisions/README.md](decisions/README.md).

### B3. Ngôn ngữ

Trao đổi kiến trúc AI-to-AI (Claude ↔ ChatGPT) có thể bằng tiếng Anh,
nhưng mọi tài liệu dự án (spec, business content, Decision Log, field
label hiển thị) phải bằng tiếng Việt. Tên module kỹ thuật có thể giữ
tiếng Anh (Requirement, Constraint Set, Design Intent Graph...).
