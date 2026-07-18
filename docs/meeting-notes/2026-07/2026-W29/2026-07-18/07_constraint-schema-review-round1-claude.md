# Constraint Schema Review — Round 1 (Claude)

> **Document Info**
> - Mục đích: review có cấu trúc (5 khía cạnh + phân loại
>   Critical/Recommended/Optional + Exit Decision) cho Conceptual Schema
>   của Constraint Set.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử.
> - Tài liệu liên quan:
>   [06_constraint-schema-review-claude.md](06_constraint-schema-review-claude.md)
>   (review sơ bộ trước đó — đề xuất field-level type tag đã được ghi
>   nhận và xuất hiện lại ở đây dưới dạng `{value, constraintType}`).

---

## 1. Domain Modeling

**`building` vs `structure` — ranh giới không rõ.** Cả hai cùng tồn tại
nhưng chưa rõ field nào thuộc nhóm nào (floors/roofType/foundationType
thuộc `building` hay `structure`?). Cần một câu định nghĩa rõ ràng cho
mỗi nhóm trước khi field nào đó vô tình xuất hiện ở cả hai hoặc rơi vào
nhóm sai.

**Thiếu nhóm cho dữ liệu household (`hasElderly`, `accessibilityNeeds`,
`children`).** Đây không phải suy đoán — Phase A Golden Pipeline
Specification đã liệt kê "elderly-proximity-to-entrance threshold" là
một Open Decision cần cho Design Intent Graph. Nếu Constraint Set không
có chỗ chứa dữ liệu household, Design Intent Graph Generator hoặc phải
đọc thẳng Requirement (phá vỡ nguyên tắc Constraint Set là ranh giới
duy nhất giữa Requirement và pipeline phía sau), hoặc bỏ qua nhu cầu này
hoàn toàn dù Requirement đã ghi nhận.

**Xác nhận đúng (không phải thiếu):** không có nhóm cho `timeline`
(expectedStart/expectedFinish) — hợp lý, không module downstream nào
(Design Intent Graph/Geometry/Descriptor/Prompt/Image) cần lịch thi
công. Loại bỏ có chủ đích, không phải bỏ sót.

## 2. Constraint Representation — `{ value, constraintType }`

**Chưa rõ hỗ trợ range.** `budget` vốn là một dải (`budgetMin`/
`budgetMax`) — đây là một Founder Decision đã có từ trước, không phải
giả định: `apps/web/scripts/regression.mjs` có test case ghi rõ *"Ngân
sách dạng dải: giữ nguyên min/max, không lấy trung bình."* Nếu `value`
chỉ là scalar, không có chỗ cho dải — vi phạm quyết định đã chốt. Cần
`value` hỗ trợ ít nhất 2 hình dạng (scalar, range), tuỳ theo field.

**Xác nhận đúng:** `garage = { value: false, constraintType:
"forbidden" }` — dạng biểu diễn tốt, không mất thông tin. Cấu trúc này
đúng hướng, chỉ cần mở rộng để `value` không luôn là scalar.

**Một điểm cần nói rõ (không phải lỗi, chỉ là làm rõ để tránh triển khai
sai):** field mà Requirement để `null` (không nhắc tới) nên được **bỏ
qua hoàn toàn** khỏi Constraint Set (không tạo entry với
`constraintType: "unspecified"`) — đúng nguyên tắc No Information
Creation (không có thông tin thì không tạo constraint), khác với
`unresolved` (dành cho thông tin CÓ tồn tại nhưng chưa compile được).
Nên viết rõ câu này vào spec để người triển khai không hiểu nhầm là phải
liệt kê đầy đủ mọi field.

## 3. Hidden Coupling

- **Design Intent Graph ↔ household (xem mục 1):** nếu thiếu nhóm
  household, coupling ẩn xảy ra theo 1 trong 2 hướng — Design Intent
  Graph đọc thẳng Requirement (phá ranh giới ACL), hoặc âm thầm bỏ qua
  nhu cầu accessibility đã ghi nhận. Concrete failure mode: một Requirement
  có `hasElderly = true` nhưng Concept Package sinh ra phòng ngủ chính ở
  tầng 2 không có lối đi thuận tiện — đúng dạng bug "yêu cầu bị bỏ qua"
  đã từng xảy ra thật (gara/ban công) chỉ khác ở chỗ lần này do thiếu
  chỗ chứa dữ liệu, không phải do AI diễn giải sai.
- **Geometry, Descriptor:** không thấy coupling ẩn mới — `site`+
  `structure` đủ cho Geometry, `style`+`spaces` (với `constraintType:
  "forbidden"`) đủ cho Descriptor lọc theo domain, đúng như đã xác nhận
  ở review trước.
- **Estimate:** không có coupling mới — `budget` chỉ mang fact, không
  mang giá đã tính.

## 4. Extensibility

Cấu trúc hiện tại phù hợp cho phạm vi MVP đã chốt (nhà phố/biệt thự xây
mới — quyết định này đã có từ vòng Requirement Domain Model, không phải
mới). **`site` (frontage/depth/landArea) mang hình dạng đặc thù nhà đất
riêng lẻ** — khi mở rộng sang chung cư sau này, `site` gần như chắc chắn
cần một biến thể khác (đơn vị trong toà nhà không có frontage/depth).
Không cần giải quyết bây giờ (đúng A5 — Prototype-Driven Refinement,
chưa có bằng chứng/nhu cầu chung cư), chỉ ghi nhận đây là điểm sẽ cần
sửa khi tới lúc, không phải lỗi hiện tại.

## 5. Separation of Responsibility

**`rules` là rủi ro lớn nhất ở mục này, tuỳ thuộc nội dung thật của nó.**
Nếu `rules` hoá ra chứa quan hệ giữa các không gian (adjacency, zone,
circulation) — đó chính xác là công việc của Design Intent Graph, không
phải Constraint Set. Nếu `rules` chỉ là một view phái sinh/trùng lặp của
các domain group khác — đó là rủi ro desync tài liệu (2 nơi giữ cùng một
sự thật), không phải lấn trách nhiệm module khác, nhưng vẫn nên loại bỏ.
Cả hai khả năng đều cần được ChatGPT làm rõ trước khi freeze — không thể
tự suy luận ý định từ tên gọi "rules" một mình.

Không thấy dấu hiệu lấn responsibility của Requirement hay Estimate
(đã xác nhận ở review trước, không đổi).

---

# Phân loại Findings

## Critical

1. **Constraint Representation chưa rõ hỗ trợ range** — vi phạm khả
   năng một Founder Decision đã chốt (budget dải min/max) nếu `value`
   chỉ là scalar.
2. **`rules` chưa rõ ý định** — nếu là quan hệ không gian, vi phạm
   Separation of Responsibility với Design Intent Graph; nếu là dữ liệu
   trùng lặp, vi phạm nguyên tắc một-nguồn-sự-thật. Cả hai khả năng đều
   cần giải quyết trước khi freeze.

## Recommended

3. **Thiếu nhóm `household`** — cần thêm trước khi Design Intent Graph
   bắt đầu, để không phải phá ranh giới ACL hoặc bỏ sót accessibility
   needs đã ghi nhận trong Requirement.
4. **`building` vs `structure` chưa phân định rõ** — cần một câu định
   nghĩa ranh giới rõ ràng cho mỗi nhóm.
5. **`preferences` có thể dư thừa** so với field-level `constraintType:
   "preferred"` — nên gộp vào domain group tương ứng, tránh tổ chức theo
   semantics ở top-level (đúng lý do Founder chọn Domain First).

## Optional

6. Ghi rõ trong spec: field `null` ở Requirement → bỏ qua hoàn toàn khỏi
   Constraint Set, không tạo entry `constraintType: "unspecified"`.
7. Ghi rõ `value` là polymorphic theo field (scalar/array/range), không
   phải luôn scalar.
8. `site` sẽ cần biến thể cho chung cư — không xử lý bây giờ, chỉ ghi
   nhận cho tương lai.

---

# Exit Decision

**⚠️ Proceed with Changes**

Không phải ❌ Blocked — hướng Domain First + field-level type tag là
đúng, không cần thiết kế lại từ đầu. Không phải ✅ Ready to Freeze — có
2 Critical cần giải quyết cụ thể trước khi freeze: khả năng biểu diễn
range (liên quan trực tiếp một Founder Decision đã có), và làm rõ ý định
của `rules` (rủi ro lấn responsibility Design Intent Graph nếu không
làm rõ). 3 Recommended nên xử lý cùng đợt vì chi phí thấp và tránh phải
sửa lại sau khi đã freeze.
