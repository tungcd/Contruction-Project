# Constraint Schema Review (Claude)

> **Document Info**
> - Mục đích: review quyết định tổ chức top-level của Constraint Set
>   Schema (Domain First vs Constraint Semantics First) — review Schema
>   đầu tiên có artifact cụ thể để đối chiếu.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử.
> - Tài liệu liên quan:
>   [03_constraint-set-schema-handoff-response-claude.md](03_constraint-set-schema-handoff-response-claude.md)
>   (checklist đã đăng ký), `docs/features/concept-design/constraint/`.

Đây là bản draft đầu tiên có nội dung cụ thể để đối chiếu — không còn là
handoff/context. Đối chiếu nhanh với checklist đã đăng ký: `unresolved`
group đúng là chỗ chứa No Silent Drop cần có (**Confirmed Sound**).
Explicit Precondition và cross-field error shape chưa xuất hiện ở đây —
hợp lý, vì đó là hình dạng output/lỗi của compiler function, không phải
top-level grouping của Constraint Set, nên không cần có mặt ở review
này.

---

## 1. Domain First hay Constraint Semantics First?

**Đồng ý Domain First ở tầng top-level** — đúng lý do Founder đưa ra
(Separation of Responsibility: Constraint Set là domain model, tổ chức
theo semantics sớm sẽ mang trách nhiệm của Rule/Constraint Engine vào
compiler).

**Nhưng đây không phải lựa chọn nhị phân.** Constraint semantics (required/
optional/forbidden/range) vẫn cần được giữ lại — chỉ là ở **tầng field**,
không phải tầng top-level grouping. Ví dụ hiện tại:

```text
bedrooms = 3
garage = false
```

Hai giá trị thô này **mất thông tin** so với điều khách hàng thực sự nói.
`garage = false` giữ được ý nghĩa (đã là forbidden). Nhưng `bedrooms = 3`
thì không rõ: khách nói "đúng 3 phòng" (exact) hay "ít nhất 3 phòng"
(min)? Với giá trị thô, cả hai trường hợp collapse về cùng một biểu diễn
— đây là **concrete failure mode**, không phải lo ngại lý thuyết: Design
Intent Graph khi dựng đúng 3 node phòng ngủ sẽ cần biết chính xác điều
này, và hiện tại schema không có chỗ để phân biệt.

**Đề xuất:** Domain First ở top-level (giữ nguyên như Founder chọn), mỗi
field-lá dùng một wrapper tường minh loại constraint, ví dụ:

```text
spaces.bedrooms = { value: 3, type: "exact" | "min" | "max" }
spaces.garage    = { value: false, type: "forbidden" }
style.architectureStyle = { value: "modern", type: "preferred" | "required" }
```

Cách này lấy được lợi ích của Option B (giữ semantics cho downstream
reasoning) mà không vi phạm lý do Founder chọn Option A (top-level vẫn
là domain, không phải rule bucket).

## 2. Hidden coupling ở mỗi hướng

- **Domain First với field thô (như draft hiện tại):** mỗi consumer
  downstream phải tự suy đoán "field này required hay forbidden hay
  preferred" bằng quy ước ngầm (không nằm trong schema) — nếu quy ước
  không đồng nhất giữa Design Intent Graph/Geometry/Descriptor, 3 module
  có thể hiểu cùng một field khác nhau. Giải quyết bằng field-level type
  tag ở trên.
- **Constraint Semantics First (Option B):** buộc compiler phải quyết
  định MỘT thang mức độ (required/optional/forbidden) áp dụng đồng đều
  cho mọi domain — trong khi mức độ "chắc chắn" tự nhiên khác nhau giữa
  các domain (site thường là fact vật lý cứng, style thường là preference
  mềm). Ép vào một cấu trúc phẳng duy nhất sớm có thể làm mất sắc thái
  đặc thù từng domain.

## 3. Option nào giúp Design Intent Graph/Geometry/Descriptor consume dễ hơn mà không mở rộng responsibility của Compiler?

Domain First + field-level type tag (đề xuất ở mục 1): mỗi module chỉ
đọc đúng domain group liên quan tới nó (Geometry: `site` + `structure`;
Descriptor: `style` + `spaces` + phần forbidden; Design Intent Graph:
`spaces` + `structure` + `style`) — không cần lọc qua một bucket
required/optional/forbidden dùng chung cho mọi domain. Đây là dữ liệu
thuần (shape), không phải reasoning — không thêm responsibility cho
Compiler.

## 4. Nếu không đồng ý cả hai — đề xuất thứ ba?

Không hẳn là phương án thứ ba tách biệt — là tổng hợp của mục 1 (Domain
First + field-level type tag), với **một hệ quả kéo theo** cần Founder
quyết định: nếu field-lá đã tự mang type tag (`preferred`/`required`/...),
thì bucket `preferences` riêng ở top-level có thể dư thừa — nó đang áp
dụng đúng tư duy "tổ chức theo semantics" (soft vs hard) mà chính lý do
chọn Option A muốn tránh ở tầng top-level. Đề xuất: preference nằm ngay
trong domain group của nó (`style.architectureStyle = {..., type:
"preferred"}`) thay vì tách thành bucket `preferences` riêng — nhất quán
hơn với triết lý Domain First đã chọn.

## Một điểm cần làm rõ trước khi chốt top-level (không phải finding chặn)

**`rules` đang mơ hồ so với các domain group.** Chưa rõ đây là (a) view
phái sinh/trùng lặp của chính các domain group (site/spaces/style/...) —
nếu vậy nên bỏ, tránh 2 nơi giữ cùng một sự thật — hay (b) thực sự chứa
loại thông tin liên-domain không thuộc riêng nhóm nào (vd một constraint
bắc cầu giữa 2 domain). Nếu là (b), nên giữ lại; nếu là (a), nên gộp
vào field-level type tag ở mục 1 và bỏ bucket này. Cần ChatGPT làm rõ ý
định trước khi chốt danh sách top-level.

## Xác nhận thêm (Confirmed Sound)

- `metadata` là chỗ hợp lý để lưu compiler version + `compiledAt` — nên
  bao gồm cả tham chiếu ngược Requirement (đã `confirmed` lúc nào) để hỗ
  trợ audit, nhất quán với chiến lược snapshot đã có ở Requirement
  (`requirementSnapshotJson`).
- `budget` group hiện diện là hợp lý (đọc field, không tính giá) — không
  vi phạm Estimate boundary miễn nó chỉ mang facts (constructionScope,
  budgetMin/Max), không mang số đã tính toán.
- Việc đổi tên/nhóm lại so với Requirement (`structure` gộp từ
  floors/roofType/foundationType...) là hợp lý — Constraint Set không
  cần mirror 1:1 cấu trúc Requirement, đúng như Founder đã nói rõ "không
  phải Requirement v2".
