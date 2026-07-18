# Requirement Domain Model — Thảo luận vòng 4 (phản hồi Claude)

Phản hồi cho `Requirement Domain Model — Discussion Round 4 (Context for
Claude)`.

---

## 1. Trả lời câu hỏi chính: đã sẵn sàng freeze chưa?

**Sẵn sàng freeze**, với đúng một điểm cần ghi rõ TRONG tài liệu frozen
như một "Open Boundary" — không phải lý do để trì hoãn freeze, mà là
điều không được phép freeze-trong-im-lặng (silently assumed solved).

### Điểm đó là gì

`otherRooms: string[]` (đã có từ trước) và `excludedRooms: string[]`
(thêm ở vòng 1) là **free-text, mở, không đóng kín từ vựng**. Nhưng
Constraint Set Compiler — theo đúng kiến trúc M4 đã đóng băng — bắt buộc
phải **100% tất định, không được diễn giải văn xuôi tự do** (Golden
Contract #3). Hai điều này đối nghịch nhau: nếu khách hàng nói "không
cần phòng đọc sách", câu đó vào `excludedRooms` dưới dạng chuỗi tự do —
nhưng chưa có cơ chế nào biến chuỗi tự do đó thành một constraint tất
định (Descriptor hiện chỉ có bảng tra cứu cố định cho các field boolean
đã biết trước, không cho chuỗi tự do).

**Đây có phải lý do để hoãn freeze Requirement Domain Model không?
Không** — vì đây không phải vấn đề thuộc phạm vi của Requirement. Đúng
theo nguyên tắc đã thống nhất ("Requirement is not design"), Requirement
chỉ có trách nhiệm **ghi nhận sự kiện**, không có trách nhiệm **biên
dịch sự kiện đó thành constraint**. Việc "chuỗi tự do → constraint tất
định" là bài toán của Constraint Set Compiler Specification — một tài
liệu freeze khác, ở tầng sau, chưa tồn tại.

**Vì vậy:** Requirement Domain Model v1.0 nên freeze như dự kiến, nhưng
phải ghi rõ, minh bạch, trong chính tài liệu: *"otherRooms/excludedRooms
là sự kiện Requirement hợp lệ; cơ chế biên dịch chúng thành constraint
tất định KHÔNG được giải quyết ở đây — đây là một ràng buộc mở, bắt buộc
phải giải quyết trước khi Constraint Set Compiler Specification được
freeze."* Nếu không ghi rõ, rủi ro là ai đó (kể cả tương lai chính chúng
ta) sẽ âm thầm giả định vấn đề này đã có lời giải chỉ vì Requirement đã
freeze.

Ngoài điểm này, không còn quyết định nền tảng nào khác thiếu bằng chứng
— các nguyên tắc còn lại (tri-state, 2-axis scope, snapshot, ACL boundary,
status lifecycle) đều đã có concrete reasoning hoặc đã map với
implementation đã kiểm chứng.

---

## 2. Đề xuất cấu trúc tài liệu: Requirement Domain Model v1.0 (Frozen)

Đây là **cấu trúc**, chưa phải nội dung đầy đủ — đề xuất để thống nhất
khung trước, sau đó có thể soạn full nội dung ngay khi được xác nhận.

```text
docs/architecture/frozen/requirement-domain-model-v1.md
```

### 0. Metadata

- Version: 1.0 — Status: FROZEN — Ngày freeze — Supersedes: (none, v1
  đầu tiên) — Người tham gia: Founder / ChatGPT / Claude.
- Phạm vi: tài liệu này chỉ chốt **Domain Model của Requirement** —
  KHÔNG bao gồm rendering chi tiết Requirement Template v2, KHÔNG bao
  gồm Constraint Set Compiler Specification (tài liệu freeze riêng, sau
  này).

### 1. Purpose & Scope

- Requirement là gì / không phải là gì (customer intent, không phải
  thiết kế) — nhắc lại ranh giới "Không thuộc Requirement" đã có từ v1
  template.
- Liệt kê rõ những gì tài liệu này KHÔNG quyết định (để tránh tài liệu
  phình to ngoài phạm vi).

### 2. Canonical Data Flow

```text
Conversation → AI Interview → Requirement JSON
    ├→ Requirement.md (generated rendering, không lưu)
    └→ Constraint Set Compiler (deterministic, spec riêng, chỉ chạy khi status = confirmed)
```

Tham chiếu REQ-D1.

### 3. Core Entities & Boundaries

- Requirement (canonical, persisted, single-row/ghi đè).
- Interview/Draft State (ephemeral, client-side, không persisted).
- Requirement.md (rendering, không lưu).
- Bảng ranh giới dữ liệu (từ vòng 2, mục B) — cái gì thuộc Requirement,
  cái gì thuộc Constraint Set, cái gì thuộc Design Intent Graph.

### 4. Data Model Principles (nguyên tắc, không phải full schema)

- Tri-state `null/true/false` cho field cố định + `otherRooms`/
  `excludedRooms` cho trường hợp mở (REQ-D3).
- Hai trục độc lập `projectType` × `constructionScope` (REQ-D4).
- Household: bổ sung tối thiểu `accessibilityNeeds` +
  `householdNote`, không dựng relationship graph.
- Reference images: `{url, note}`, note bắt buộc, url opaque (REQ-D6).
- Status lifecycle: `draft → needs_clarification → ready → confirmed`
  + `confirmedAt`. Không versioning, không `confirmedBy` (chưa có auth).
- Ghi rõ: schema đầy đủ (field-by-field) sống ở
  `packages/shared-types/src/requirement.ts` +
  `docs/features/concept-design/requirement/requirement-json-schema.md`
  riêng — tài liệu này không lặp lại toàn bộ schema.

### 5. Architecture Principles (áp dụng toàn dự án, được xác lập qua chuỗi thảo luận này)

- Burden of Proof Rule.
- Domain drives implementation / Implementation validates domain +
  hệ quả "Evidence quality matters more than idea quality."
- Requirement is not design.
- Deterministic downstream boundary — Constraint Set Compiler không
  được diễn giải văn xuôi tự do.
- AI Contract Testing (Golden Conversation / Golden Output, field-level
  assertion) — áp dụng cho Requirement Extraction, Design Intent Graph
  Generation, Image Generation.

### 6. Consumer Boundaries (Anti-Corruption Layer)

- Requirement phục vụ 2 consumer có áp lực tiến hoá khác nhau: Estimate
  Engine (cần field phẳng, cố định tên) và Concept Design pipeline (cần
  cấu trúc tổng quát hơn).
- Constraint Set Compiler là nơi hấp thụ khác biệt — Requirement giữ
  hình dạng ổn định, không tổng quát hoá theo áp lực của Concept Design.

### 7. Snapshot & Audit Strategy

- Không versioning Requirement.
- `ConceptSet.requirementSnapshotJson` + `requirementSnapshotMarkdown`
  làm bản sao denormalized tại thời điểm generate — phục vụ audit mà
  không cần version chain.

### 8. Open Boundaries (chủ động ghi rõ, chưa giải quyết)

- **otherRooms/excludedRooms → deterministic constraint**: chưa có cơ
  chế; phải giải quyết trước khi freeze Constraint Set Compiler
  Specification (xem mục 1 ở trên).
- Per-field provenance/confidence: hoãn có chủ đích, không chặn schema.
- Phạm vi MVP: chỉ nhà phố/biệt thự xây mới; căn hộ/cải tạo hoãn.
- `confirmedBy`: hoãn (chưa có khái niệm auth/user trong toàn hệ thống).

### 9. Decision Log Index (ADR references)

Bảng liệt kê, mỗi dòng trỏ tới 1 file ADR riêng (theo quy ước 1
file/quyết định đã thống nhất ở vòng 3):

| ID | Tiêu đề | Status |
|---|---|---|
| REQ-D1 | Requirement JSON canonical, Requirement.md rendering | Accepted |
| REQ-D2 | Mở rộng schema hiện có, không tạo schema song song | Accepted |
| REQ-D3 | Tri-state hiện có + excludedRooms | Accepted |
| REQ-D4 | Giữ 2 trục projectType × constructionScope | Accepted |
| REQ-D5 | Snapshot trên ConceptSet, không versioning Requirement | Accepted (revised) |
| REQ-D6 | Reference image note bắt buộc, không suy diễn bố cục | Accepted |
| REQ-D7 *(mới)* | Status lifecycle + confirmedAt, hoãn confirmedBy/versioning | Accepted |
| REQ-D8 *(mới)* | Burden of Proof Rule là Architecture Principle chính thức | Accepted |

*(REQ-D7/D8 chưa từng được đánh số riêng trong các vòng trước — đề xuất
chính thức hoá thành ADR khi soạn full nội dung, vì đã được đồng thuận
nhưng chưa có ID.)*

### 10. Manual POC Priorities (pointer, không sở hữu nội dung)

- Trỏ sang tài liệu Concept Design pipeline: 3 rủi ro ưu tiên (Design
  Intent Graph realizability → Geometry strategy → Descriptor lookup) —
  không lặp lại nội dung ở đây, vì đây không thuộc phạm vi Requirement.

### 11. Change Log

- v1.0 — freeze ban đầu, chưa có supersede nào.

---

## 3. Đề xuất bước tiếp theo

Nếu cấu trúc trên được xác nhận, bước kế tiếp là soạn **full nội dung**
tài liệu này (không chỉ outline), cùng lúc tách các quyết định REQ-D1
đến REQ-D8 thành 8 file ADR riêng trong `docs/architecture/decisions/`
— đúng quy ước đã thống nhất. Sau đó, Requirement Domain Model v1.0 mới
thực sự trở thành single source of truth để Requirement JSON Schema,
Requirement Template v2, và Constraint Set Compiler Specification cùng
tham chiếu.
