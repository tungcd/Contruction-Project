# Concept Drawing MVP — Architecture Package (Revised per Tech Lead Review)

**Ngày:** 2026-07-18
**Trạng thái:** Architecture — vẫn CHƯA code. Phản hồi 8 điểm review của
Tech Lead: 6 điểm accept trực tiếp, 1 điểm accept có điều chỉnh phạm vi
(Wall), 1 điểm phản biện có lý do cụ thể (renderer PDF riêng).

---

## Phản hồi từng điểm review

### 1-2. Layout Graph — Accept

Đồng ý. Lý do Tech Lead đưa ra đúng và cụ thể: Design Intent Graph
(Contract #5 gốc) có Owner là AI (dù Stage 1-2 tạm thời deterministic) —
nếu Geometry Solver đọc thẳng quan hệ ngữ nghĩa (`adjacency`/`connection`)
để tự quyết định "đây là tường chung hay hành lang hay cửa", thì khi
Design Intent Graph đổi lại thành AI sinh (tương lai), quyết định
tô-pô-vật-lý đó sẽ vô tình phụ thuộc vào AI. Tách riêng Layout Graph giữ
đúng bất biến: **AI/rule chỉ được quyết định Ý ĐỊNH, tô-pô vật lý cụ thể
(cửa/hành lang/liên kết đứng) luôn tất định.**

Schema (rút gọn cho Stage 1 — không cần toàn bộ edge type ngay):

```ts
interface LayoutGraph {
  nodes: { id: string; type: string; floor: number; priority: number }[];
  edges: {
    type: "adjacency" | "connection" | "corridor" | "door" | "verticalConnection";
    from: string; to: string;
  }[];
}
```

Stage 1 (1 tầng, layout đơn giản) nhiều khả năng KHÔNG sinh `corridor`
hay `verticalConnection` nào (không cầu thang, không hành lang riêng) —
giữ 2 loại này trong enum cho Stage 2, không cần code xử lý chúng ở
Stage 1.

`priority` trên `LayoutNode` — accept, thay hardcode thứ tự ưu tiên
trong code bằng field tường minh, dễ đọc/dễ sửa hơn.

**Pipeline cập nhật:**

```text
Constraint Set → Design Intent Graph → Layout Graph → Geometry
  → Wall (derived) → Drawing Document → Renderer
```

### 3. Polygon thay vì x/y/width/height — Accept

Đồng ý, chi phí gần như bằng 0: Stage 1 vẫn CHỈ sinh hình chữ nhật —
chỉ khác là biểu diễn bằng 4 điểm (`Point[]`) thay vì 4 số riêng lẻ.
Thuật toán giải hình học Stage 1 không phức tạp hơn. Đổi lại tránh được
breaking change chắc chắn sẽ xảy ra khi hỗ trợ đất/phòng không phải
hình chữ nhật (đã có trong roadmap, chỉ là chưa tới Stage này).

```ts
type Point = { x: number; y: number };
interface Geometry {
  floors: {
    level: number;
    spaces: { id: string; polygon: Point[] }[]; // Stage 1: luôn 4 điểm (chữ nhật)
  }[];
}
```

Geometry Solver nhận `LayoutGraph`, KHÔNG tự suy diễn tô-pô (đã có sẵn
trong `LayoutGraph.edges`) — chỉ tính toạ độ thoả mãn các cạnh đó, đúng
nguyên tắc Tech Lead nêu ("Geometry should only realize topology").

### 4. Wall Entity — Accept, với điều chỉnh: derived, không hand-author

Đồng ý cần có `Wall` sớm để cửa/dimension tham chiếu bằng ID thay vì mỗi
nơi tự tính lại "cạnh chung giữa 2 phòng là gì" (đúng rủi ro trùng lặp
logic nếu không có). Điều chỉnh duy nhất: `Wall[]` là **dữ liệu tính ra
(derived)** ngay sau khi Geometry Solver chạy xong (hàm thuần
`deriveWalls(spaces: polygon[]): Wall[]` tìm cạnh polygon trùng nhau
giữa các phòng liền kề), không phải thứ Layout Generator hay Design
Intent Graph tự tạo tay — tránh có 2 nơi cùng quyết định tường nằm ở đâu.

```ts
interface Wall {
  id: string;
  start: Point;
  end: Point;
  type: "exterior" | "interior";
}
```

Không cần thickness/material — đúng như Tech Lead nói, chỉ cần tô-pô.

### 5. Drawing Model tách khỏi Renderer — Accept phần tách biệt, phản biện phần "PDF renderer riêng"

**Đồng ý:** `DrawingPackage`/`DrawingSheet`/`FloorPlanView` phải là dữ
liệu thuần, không biết gì về SVG/PDF — đây vốn đã là thiết kế ban đầu,
không đổi.

**Phản biện có lý do cụ thể việc coi PDF là một "Renderer implementation"
riêng biệt (khác SVG):** Task Demo Polish (Task 3, đã xong, đã chạy
thật) đã chứng minh pattern "PDF = in chuỗi SVG đã render qua
`window.print()`" hoạt động tốt cho Proposal, không cần thư viện PDF
riêng. Xây một "PDF Renderer" độc lập (vẽ lại hình bằng thư viện PDF
riêng) sẽ **trùng lặp toàn bộ logic vẽ đã có trong SVG Renderer** để
tạo ra cùng một kết quả thị giác — không có bằng chứng cụ thể nào cho
thấy cách làm đã chứng minh hiệu quả (browser print) không đủ dùng cho
bản vẽ kỹ thuật. Theo đúng Burden of Proof Rule, giữ nguyên:

```text
DrawingPackage (dữ liệu thuần)
  → SVG Renderer (renderFloorPlanToSvg — hàm thuần)
      → hiển thị web (trực tiếp)
      → in/xuất PDF (window.print() trên chính SVG đã render)
```

Không đóng cửa với DXF sau này — `DrawingPackage` vốn đã renderer-
independent, thêm 1 renderer DXF khi có nhu cầu thật không đòi hỏi đổi
gì ở tầng dữ liệu. Chỉ không tạo sẵn "PDF Renderer" riêng khi chưa có lý
do cụ thể.

### 6. Layout Template abstraction — Accept

Đồng ý, chi phí thấp, lợi ích rõ (thêm template villa/căn hộ sau không
đụng vào logic chọn/điều phối của Layout Generator).

```ts
interface LayoutTemplate {
  id: string; // "townhouse-narrow-v1"
  appliesWhen: (ctx: { frontage: number; depth: number; floors: number }) => boolean;
  buildLayoutGraph: (constraintSet: ConstraintSet) => LayoutGraph;
}
```

```text
apps/web/src/lib/drawing/templates/
  townhouse.ts   # Stage 1-2
  villa.ts       # Stage 2+, chưa code
```

`layoutGenerator.ts` chỉ chọn template phù hợp (`appliesWhen`) và gọi
`buildLayoutGraph` — không chứa logic layout cụ thể nào trong chính nó.

### 7. Floor Allocation — Accept nguyên tắc, ghi rõ thứ tự ưu tiên, chưa cần implement ở Stage 1

Đồng ý nguyên tắc: hỏi khách chính xác luôn tốt hơn suy đoán. Ghi rõ thứ
tự ưu tiên vào kiến trúc:

```text
1. Requirement có breakdown theo tầng thật (nếu sau này bổ sung field) → dùng trực tiếp.
2. Chưa có → hỏi thêm qua AI clarification (Discovery Chat) trước khi Requirement chuyển "confirmed".
3. Khách không trả lời được / đã confirmed mà vẫn thiếu → heuristic mặc định (fallback cuối cùng, luôn hiển thị trong assumptions[]).
```

**Không cần implement bước 1-2 ở Stage 1** — Stage 1 (single-floor POC,
fixture `simple-house`) không có khái niệm "nhiều tầng" nên câu hỏi
phân bổ theo tầng chưa phát sinh. Vấn đề này chỉ thực sự xuất hiện ở
Stage 2 (townhouse/villa nhiều tầng). Khi tới Stage 2, việc thêm field
breakdown-theo-tầng vào Requirement là bổ sung có tính CỘNG THÊM (giống
`excludedRooms`/`accessibilityNeeds` trước đây), không phải "redesign
Requirement" — nên không vi phạm ràng buộc "must not be redesigned".
Chưa thiết kế chi tiết field này ngay — sẽ làm khi Stage 2 thực sự bắt
đầu, đúng tinh thần A5 (không thiết kế trước khi có bằng chứng/nhu cầu
thật).

---

## Cấu trúc pipeline đã cập nhật (thay thế mục 0-15 bản trước)

```text
Requirement
  → Constraint Set Compiler → Constraint Set
  → Design Intent Graph (rule-based, Stage 1-2; AI có thể thay sau — Owner swappable)
  → Layout Graph (LUÔN deterministic — tô-pô vật lý cụ thể, không phụ thuộc Owner của bước trên)
  → Geometry Solver (LUÔN deterministic — chỉ HIỆN THỰC HOÁ tô-pô đã có, không tự suy diễn)
  → Wall (derived tự động từ Geometry, không hand-author)
  → Drawing Document Model (dữ liệu thuần, không biết SVG/PDF)
  → SVG Renderer (hàm thuần) → hiển thị web + in/PDF (window.print(), không renderer riêng)
```

Toàn bộ mục 1-2 (Existing capabilities, Constraint Set fields), mục 3
(Missing information — floor allocation, room-name lookup, orientation),
mục 7 (Geometry validation rules — tái dùng Contract #6/#7), mục 11-15
(UI integration, fixture strategy, risks) của bản gốc (`20_...md`) **giữ
nguyên, không đổi** — chỉ mục 4-10 (Design Intent Graph/Geometry/Wall/
Drawing Model/Renderer/Template) được cập nhật theo review này.

---

## Stage 1 Implementation Scope (cập nhật)

Vẫn `simple-house` (1 tầng, 4-5 phòng), vẫn không cầu thang. Thay đổi so
với bản trước: dữ liệu trung gian giờ đi qua đủ `LayoutGraph` (dù Stage 1
chỉ có `adjacency`/`connection`, không có `corridor`/`verticalConnection`),
`Geometry.spaces[].polygon` thay vì x/y/width/height, `Wall[]` tính ra
sau Geometry (không hand-code). `LayoutTemplate` interface có thật, chỉ
1 implementation (`townhouse.ts`) được viết. Không đổi timeline/độ khó —
đây là thay đổi HÌNH DẠNG dữ liệu, không phải thêm tính năng.

---

## Files/modules (cập nhật so với `20_...md` Phần C)

```text
apps/web/src/lib/drawing/
  designIntentGraph.ts
  layoutGraph.ts          # MỚI — types LayoutGraph + buildLayoutGraph() điều phối
  templates/
    townhouse.ts           # MỚI — LayoutTemplate cho Stage 1
  geometry.ts              # types Geometry (polygon), solveGeometry(layoutGraph)
  wall.ts                  # MỚI — deriveWalls(geometry): Wall[]
  geometryValidator.ts
  drawingDocument.ts
  svgRenderer.ts
  roomTypeLookup.ts
```

Không cần file `pdfRenderer.ts` riêng (mục 5).

---

## Xác nhận: sẵn sàng bắt đầu Stage 1 sau khi phản hồi này được duyệt

Không còn điểm nào tự thấy cần phản biện thêm ngoài mục 5 (đã nêu lý do
cụ thể). Chờ duyệt trước khi code, đúng yêu cầu "After review approval,
Stage 1 implementation may begin."
