# Concept Drawing MVP — Architecture Package

**Ngày:** 2026-07-18
**Trạng thái:** Architecture — chưa code, theo đúng "Immediate Task"
("First inspect the existing repository... produce an implementation-
oriented architecture package"). Không reopen Requirement/Constraint
Compiler/Estimate/Proposal.

---

## 0. Continuity — đây KHÔNG phải bắt đầu từ số 0

Trước khi thiết kế, đã đọc lại toàn bộ pipeline M4-001 đã đóng băng
(`10_Frozen-Architecture...md`, `11_Phase-A-Golden-Pipeline-
Specification.md`). Phát hiện quan trọng nhất: **Concept Drawing MVP
không phải module mới — nó chính là phần Design Intent Graph + Geometry
Solver của pipeline M4 đã spec sẵn từ Phase A**, chỉ đổi thứ tự ưu tiên
(làm trước Descriptor/Prompt/Image thay vì làm sau) và đổi output cuối
(bản vẽ kỹ thuật SVG/PDF thay vì ảnh phối cảnh AI).

Tái sử dụng trực tiếp, không thiết kế lại:

| Đã có (Phase A) | Dùng lại cho |
|---|---|
| Contract #5 — Space Planner (Design Intent Graph Generator): schema `DesignIntentGraph` | Design Intent Graph MVP (mục 4) — schema giữ nguyên, chỉ đổi Owner từ AI sang deterministic rule/template |
| Contract #6 — Layout Validator: quy tắc đếm space khớp Constraint Set, đồ thị connection liên thông, ngưỡng elderly-proximity | Geometry Validation Rules (mục 7) |
| Contract #7 — Geometry Solver: schema `Geometry { floors: [{level, spaces:[{id,x,y,width,height}], doors}] }`, chiến lược Treemap/rectangle-subdivision | Layout Generator + Geometry Primitives (mục 5-6) |
| Space Syntax grounding (convex space, depth-from-entry, connectivity graph) | Cơ sở lý thuyết cho `relationships[]` và circulation validation |

**Một quyết định hay của Founder đáng ghi nhận:** đưa Layout Generator về
rule-based/template-assisted (deterministic) thay vì AI ngay từ đầu —
điều này **giảm đúng rủi ro lớn nhất** đã nêu tên nhiều lần trước đây
("Design Intent Graph realizability" — Rủi ro #1 cần Manual POC trước
khi tin tưởng AI). Bắt đầu deterministic nghĩa là không cần chờ bằng
chứng AI nữa — đúng tinh thần Burden of Proof/Prototype-Driven
Refinement (A5).

---

## 1. Existing repository capabilities relevant to drawing

- `packages/shared-types/src/constraint-set.ts` — đã có `site` (đất
  hình chữ nhật, frontage/depth/landArea), `building` (floors,
  buildingType, constructionScope), `spaces` (bedrooms/bathrooms/boolean
  rooms/otherRooms/excludedRooms), `structure` (roofType,
  foundationType), `style` (architecturalStyle), `household`
  (hasElderly, accessibilityNeeds) — đúng những gì Layout Generator cần
  đọc.
- `packages/shared-types/src/constraint-set-compiler.ts` — pipeline
  Requirement → ConstraintSet đã chạy được, có 3 fixture sẵn
  (simple-house/townhouse/villa).
- **Không có code SVG/geometry/CAD nào tồn tại** (đã grep xác nhận) —
  khác tình huống Estimate MVP (STOP file 15), không có rủi ro làm lại
  việc đã làm.
- Pattern đã kiểm chứng có thể tái dùng: Pure Function + Explicit
  Precondition + fixture/Manual POC theo `ts-node` (Constraint Compiler,
  Proposal), browser-print-to-PDF không cần dependency mới (Proposal
  Task 3).

## 2. Constraint Set fields available for design

| Field | Group | Ghi chú |
|---|---|---|
| `landArea`, `frontage`, `depth`, `roadWidth` | site | Đủ dựng envelope hình chữ nhật |
| `buildingFootprint`, `totalFloorArea` | site | Dùng để validate tổng diện tích hình học |
| `floors`, `basementLevels` | building | Số tầng cần layout |
| `bedrooms`, `bathrooms`, `livingRoom`, `kitchen`, `worshipRoom`, `storage`, `garage`, `garden`, `balcony` | spaces | Danh sách phòng cần đặt — **là tổng CẢ TOÀ NHÀ, không phải theo từng tầng** (xem mục 3) |
| `otherRooms`, `excludedRooms` | spaces | Free-text — cần bảng tra cứu tên→loại phòng (mục 3) |
| `hasElderly`, `accessibilityNeeds` | household | Input cho rule "phòng ngủ tầng 1 gần lối vào" |
| `roofType` | structure | Ảnh hưởng elevation (Stage 4, chưa cần Stage 1-2) |

## 3. Missing information required by the Layout Generator

**Quan trọng nhất — thiếu phân bổ phòng theo TỪNG TẦNG.** Constraint Set
(và cả Requirement) chỉ có tổng số phòng ngủ toàn nhà (`bedrooms: 4`),
không có "tầng 1: 1 phòng, tầng 2: 2 phòng" — thông tin này đã bị gộp
ngay từ bước AI extraction Requirement (xem
`apps/web/scripts/regression.mjs`, case "Cộng phòng ngủ mô tả theo từng
tầng" — cố tình cộng dồn thành 1 số theo Founder Decision cũ). Đây
KHÔNG phải lỗi cần sửa ngay — đề xuất Stage 1-2 dùng **heuristic phân bổ
mặc định** (vd: tầng 1 ưu tiên phòng khách+bếp+1 phòng ngủ nếu có người
già, các tầng trên chia đều phòng ngủ còn lại), ghi rõ đây là giả định
hiển thị trong `assumptions[]` của bản vẽ — không chặn Stage 1, chỉ ghi
nhận để sửa sau nếu heuristic tỏ ra không đủ tốt (bằng chứng từ Manual
POC, đúng A5).

**Thiếu hướng đất/hướng nhà.** Không có field nào trong Requirement/
Constraint Set. Task yêu cầu "North arrow when orientation is known" —
xử lý bằng cách **bỏ qua mũi tên hướng Bắc khi không có dữ liệu**, không
suy đoán. Không chặn Stage 1.

**Free-text room disambiguation.** `otherRooms`/`excludedRooms` là
chuỗi tự do (vd "phòng thờ ông bà") — Layout Generator cần một bảng tra
cứu nhỏ tên→loại phòng đã biết (worship, storage, guest...), giống hệt
vấn đề đã nêu cho Descriptor Compiler (Constraint Schema Review). Tên
không map được → xử lý như "unresolved" (không tự bịa vị trí hình học,
liệt kê trong `warnings[]`).

**Ưu tiên phân bổ diện tích khi không đủ chỗ.** Chưa có field nào — Stage
1 hardcode thứ tự ưu tiên cố định (khách/bếp > phòng ngủ > khu ướt >
kho), ghi rõ trong code comment, không cần field Requirement mới.

## 4. Design Intent Graph MVP schema

Tái dùng gần như nguyên vẹn Contract #5 (Phase A) — chỉ Owner đổi từ AI
sang deterministic rule/template cho Stage 1-2:

```ts
interface DesignIntentGraph {
  buildingContext: {
    frontage: number; depth: number; floors: number;
    roofType: string | null; architecturalStyle: string | null;
  };
  floors: {
    level: number;
    spaces: {
      id: string;
      type: string;        // "bedroom" | "kitchen" | "living" | "wc" | "staircase" | "worship" | ...
      zone: "public" | "semiPrivate" | "private" | "service";
      areaWeight: number;   // tỷ trọng diện tích tương đối trong tầng
      facadeExposure: string[]; // vd ["front"] — Stage 1 có thể để rỗng
    }[];
  }[];
  relationships: {
    type: "adjacency" | "connection" | "visualOpenTo" | "sequence";
    from: string; to: string;
  }[];
}
```

Cắt bớt so với Phase A cho đúng phạm vi Stage 1 (không over-model):
`facadeExposure` có thể để mảng rỗng ở Stage 1 (chỉ cần cho Stage 4
Elevation); không cần trường "note" tự do ở Stage 1.

## 5. Layout Generator strategy

Dùng đúng chiến lược 10 bước Founder đã đề xuất, ánh xạ cụ thể vào
Constraint Set:

1. Chuẩn hoá envelope — từ `site.frontage`/`site.depth` (đã là hình chữ
   nhật theo giả định phạm vi MVP).
2. Phân bổ tầng — từ `building.floors` + heuristic phân bổ mặc định
   (mục 3).
3. Chọn template layout — Stage 1: **đúng 1 template** cho nhà ống mặt
   tiền hẹp (frontage < depth); Stage 2 mở thêm template cho tỷ lệ vuông
   hơn (biệt thự).
4. Đặt lõi cố định — cầu thang (vị trí cố định xuyên suốt các tầng,
   đúng rule Contract #6 "vị trí Zone của staircase giống nhau ở mọi
   tầng"), khu ướt (cạnh trục cấp thoát nước ngầm định — Stage 1 giả
   định cạnh sau nhà), lối vào (mặt tiền).
5. Phân bổ phòng còn lại theo thứ tự ưu tiên (mục 3).
6. Điều chỉnh kích thước trong khoảng cho phép, khớp `totalFloorArea`.
7. Sinh tường/cửa từ ranh giới phòng liền kề (không cần entity `Wall`
   phức tạp ở Stage 1 — cạnh polygon phòng CHÍNH LÀ tường, tách entity
   riêng chỉ cần khi có độ dày/vật liệu thật ở Stage 3+).
8. Validate hình học (mục 7).
9. Score candidate — **Stage 1 bỏ qua bước này** (chỉ 1 candidate duy
   nhất), Stage 2+ mới cần khi so sánh nhiều layout.
10. Trả về candidate tốt nhất + `warnings[]`.

## 6. Geometry primitives

Tái dùng nguyên schema Contract #7:

```ts
interface Geometry {
  floors: {
    level: number;
    spaces: { id: string; x: number; y: number; width: number; height: number }[];
    doors: { betweenIds: [string, string]; position: number }[];
  }[];
}
```

Không thêm entity `Wall` riêng ở Stage 1 (suy ra trực tiếp từ cạnh
polygon phòng khi render SVG) — đúng "Simplicity before Generality",
thêm khi Stage 3+ cần độ dày tường thật cho bản vẽ in.

## 7. Geometry validation rules

Tái dùng nguyên quy tắc đã spec ở Contract #6+#7 (Phase A), không thiết
kế lại:

- Phòng nằm trong envelope; không chồng lấn (kiểm tra toán học).
- Diện tích mỗi phòng > 0.
- Mỗi cặp `relationship.type=connection` phải có cạnh chung (đặt được
  cửa).
- Cầu thang cùng vị trí Zone mọi tầng.
- Tổng diện tích hình học mỗi tầng khớp `totalFloorArea` (sai số ≤ 1% —
  đây là phép tính, không phải suy luận).
- Đồ thị liên thông — mọi Space có đường đi tới Space loại `entrance`
  (Space Syntax "depth from entry").
- `hasElderly=true` → tồn tại `bedroom` ở `level=1` với số bước
  `connection` tới entrance ≤ NGƯỠNG.

**2 ngưỡng vẫn CHƯA được Founder chốt** (đã nêu từ Phase A, giờ mới thực
sự cần dùng — xem mục "Risks" phần E).

## 8. Drawing Document Model

Rút gọn danh sách Founder đề xuất, chỉ giữ phần Stage 1-3 cần (Elevation/
Section hoãn Stage 4):

```ts
interface DrawingPackage { sheets: DrawingSheet[] }
interface DrawingSheet {
  floor: FloorPlanView;
  titleBlock: TitleBlock;
  warnings: string[];
  assumptions: string[];
}
interface FloorPlanView {
  level: number;
  spaces: { id: string; type: string; label: string; areaM2: number; polygon: Point[] }[];
  doors: { position: Point; width: number }[];
  dimensions: { from: Point; to: Point; label: string }[];
}
interface TitleBlock {
  projectName: string; scale: string | "NOT TO SCALE"; disclaimer: string; generatedAt: string;
}
```

`disclaimer` bắt buộc luôn hiển thị đúng câu Founder yêu cầu ("preliminary,
based on supplied information...").

## 9. SVG renderer design

`renderFloorPlanToSvg(sheet: DrawingSheet): string` — Pure Function,
sinh chuỗi SVG thô (không phải React component riêng) — lý do: chuỗi
này dùng LẠI NGUYÊN VẸN cho cả hiển thị web (`dangerouslySetInnerHTML`
hoặc inline) VÀ cho PDF (mục 10), tránh viết 2 lần logic vẽ.

## 10. PDF strategy

**Tái dùng đúng pattern đã có ở Proposal (Task 3, Demo Polish) — không
thêm dependency PDF mới.** Trang `/projects/[id]/design` render SVG
string vào DOM, CSS `@media print` riêng (scope class, giống
`.proposal-print-area`), nút "In / Xuất PDF" gọi `window.print()`.

## 11. UI integration

Trang mới `/projects/[id]/design`, chèn vào luồng TRƯỚC Estimate:
`Requirement → Concept Design → Drawing Preview → Estimate → Proposal`.
Action: Tạo bản vẽ, chọn tầng, xem trước, panel Giả định/Cảnh báo, Tạo
lại, Xuất SVG, In/PDF, Xác nhận concept. **Rút kinh nghiệm Demo Polish
Task 4 (thiếu nav Proposal): phải thêm link trang này vào
`WorkspaceHeader` NGAY khi implement**, không để tới lúc review mới phát
hiện thiếu.

## 12. Fixture strategy

Tái dùng ĐÚNG 3 fixture Requirement đã có
(`packages/shared-types/fixtures/constraint/{simple-house,townhouse,villa}/requirement.json`)
— không tạo fixture mới. Townhouse là case tham chiếu ưu tiên (theo yêu
cầu). Không hand-compute toạ độ kỳ vọng (giống bài học từ Proposal POC —
tránh tạo nơi thứ 2 phải giữ đồng bộ) — thay vào đó assert theo THUỘC
TÍNH: không chồng lấn, nằm trong envelope, đủ số phòng bắt buộc, SVG
sinh ra không rỗng/không lỗi.

## 13. Incremental implementation plan

Theo đúng 5 stage Founder đã liệt kê — không đổi, chỉ gắn module cụ thể
(xem Phần C).

## 14. Concrete acceptance criteria

Xem Phần D — tái dùng gần như nguyên văn "Completion Standard" Founder
đã viết (đã rất cụ thể, không cần diễn giải lại).

## 15. Risks and explicit non-goals

Xem Phần E.

---

# Phần B — Recommended Stage 1 Implementation Scope

**Single-Floor Geometry POC**, dùng fixture `simple-house` (đã có, ít
phòng nhất, chỉ 1 tầng): envelope hình chữ nhật từ `site.frontage`/
`site.depth`, phòng: khách + bếp + 2 phòng ngủ + 1 WC (đúng field
`spaces` của fixture này), 1 template layout duy nhất, tường suy từ
cạnh polygon, dimension cơ bản (chiều rộng/dài mỗi phòng), label + diện
tích, xuất SVG. **Không làm cầu thang** ở Stage 1 (simple-house chỉ 1
tầng, không cần) — cầu thang bắt đầu từ Stage 2 (townhouse/villa nhiều
tầng).

# Phần C — Exact files/modules

```text
apps/web/src/lib/drawing/
  designIntentGraph.ts   # types + generateDesignIntentGraph() (rule-based, Stage 1)
  layoutGenerator.ts      # generateLayout() — 10 bước mục 5
  geometry.ts             # types Geometry + solveGeometry()
  geometryValidator.ts    # validateGeometry() — quy tắc mục 7
  drawingDocument.ts      # types DrawingPackage/DrawingSheet/FloorPlanView/TitleBlock
  svgRenderer.ts          # renderFloorPlanToSvg()
  roomTypeLookup.ts       # bảng tra cứu tên tự do -> loại phòng (mục 3)

apps/web/src/app/projects/[id]/design/page.tsx      # trang mới
apps/web/src/features/drawing/components/DrawingView.tsx

apps/web/scripts/drawing-poc.ts                     # Manual POC, cùng pattern proposal-poc.ts
apps/web/src/features/workspace/components/WorkspaceHeader.tsx   # THÊM nav link (đừng quên)
apps/web/src/app/globals.css                        # thêm scope print CSS cho .drawing-print-area
```

Không sửa: `constraint-set.ts`, `constraint-set-compiler.ts`,
`requirement.ts`, Estimate Engine, Proposal Builder — đúng yêu cầu
"must not be redesigned".

# Phần D — Acceptance Criteria

Nguyên văn "Completion Standard" Founder đã viết — xác nhận đầy đủ,
không rút gọn:

- Hình học là dữ liệu có cấu trúc (không phải chỉ hiển thị ảnh).
- Cùng input + cùng settings → cùng hình học (deterministic).
- Cả 3 fixture đều sinh được bản vẽ.
- Không phòng nào vượt ra ngoài envelope; không chồng lấn.
- Dimension/label/diện tích hiển thị được.
- Giả định + cảnh báo hiển thị được.
- Xuất được SVG; in/xuất được PDF.
- Concept có thể được xác nhận (status, giống pattern
  Requirement/Estimate).
- Demo điều hướng được trọn vẹn Requirement → Drawing → Estimate →
  Proposal.

# Phần E — Risks requiring Founder input

1. **2 ngưỡng chưa chốt từ Phase A, giờ thực sự cần dùng:** sai số diện
   tích cho phép (đề xuất khởi điểm 10%) và số bước tối đa từ phòng ngủ
   người già tới lối vào (đề xuất ≤ 2). Không thể validate hình học nếu
   thiếu 2 số này — cần Founder xác nhận trước Stage 2.
2. **Heuristic phân bổ phòng theo tầng (mục 3) là suy đoán của Claude,
   chưa kiểm chứng với thực tế nhà thầu.** Rủi ro cụ thể: fixture villa
   (5 phòng ngủ, 2 tầng) — chia phòng nào lên tầng nào là quyết định
   thẩm mỹ/thực dụng cần kinh nghiệm ngành, không phải thứ suy luận
   thuần logic ra được. Đề xuất: Founder duyệt nhanh cách chia mặc định
   trước khi build Stage 2 (townhouse/villa), tránh phải sửa lại nhiều
   layout đã sinh.
3. **Template layout nhà ống (Stage 1-2) cần ít nhất 1-2 layout tham
   chiếu thật** (không phải Claude tự bịa tỷ lệ phòng) — nếu Founder có
   sẵn bản vẽ mẫu/kinh nghiệm về cách bố trí nhà ống phổ biến, nên cung
   cấp trước khi build Layout Generator, tránh template sai lệch xa
   thực tế phải sửa lại từ đầu.
4. Non-goals xác nhận lại (không phản biện, đồng ý toàn bộ): không sinh
   tài liệu thi công/pháp lý/kết cấu/MEP chi tiết/BIM/DWG/3D — đúng
   phạm vi presales concept đã nêu rõ.
