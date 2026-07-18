# Completion Report — Concept Drawing Stage 1 (Single-Floor Geometry POC)

**Ngày:** 2026-07-18

## Implementation Summary

Đúng pipeline đã duyệt (`21_Architecture-Concept-Drawing-MVP-Revised.md`):

```text
ConstraintSet → Design Intent Graph (rule-based) → Layout Graph
  → Geometry (polygon) → Wall (derived) → Geometry Validation
  → Drawing Document → SVG Renderer → window.print()
```

- `designIntentGraph.ts` — rule-based, entrance→living→kitchen→
  {bedrooms, wc} (hub tuần tự). `otherRooms`/`excludedRooms` → cảnh báo
  (chưa đặt vị trí), không tự bịa (No Silent Drop).
- `layoutGraph.ts` — `LayoutNode{id,type,floor,priority,areaWeight}`,
  `LayoutEdge{type,from,to}`. `areaWeight` và `envelope` là 2 bổ sung
  nhỏ so với đề xuất gốc của Tech Lead — cần thiết để Geometry Solver
  chỉ đọc `LayoutGraph`, không quay lại đọc Design Intent Graph/
  Constraint Set (giữ đúng ranh giới đã thống nhất).
- `templates/townhouse.ts` — 1 template Stage 1, chỉ chọn/điều phối,
  không tự giải hình học (đúng Tech Lead Review mục 6).
- `geometry.ts` — thuật toán "sequential bar layout": nhóm node theo
  `priority` thành các dải ngang, dải cuối chia theo `areaWeight`.
  Không biết "living"/"bedroom" là gì — chỉ dùng priority/areaWeight,
  dùng lại được cho template khác cùng hình dạng tuyến tính.
- `wall.ts` — `deriveWalls()` tính tự động từ Geometry (không hand-
  author), tìm cạnh chung giữa mọi cặp phòng bằng bounding-box overlap.
- `geometryValidator.ts` — tái dùng quy tắc Golden Contract #6/#7
  (không chồng lấn, trong envelope, diện tích dương, số phòng khớp
  Constraint Set, mọi cạnh "door" có wall tương ứng, tổng diện tích khớp
  buildingFootprint).
- `drawingDocument.ts` + `svgRenderer.ts` — Drawing Document thuần dữ
  liệu, SVG Renderer là hàm thuần sinh chuỗi dùng chung cho web + in/PDF
  (không renderer PDF riêng, đúng phản biện đã chốt).

## Bổ sung ngoài phạm vi thuật toán hình học (plumbing bắt buộc)

**Requirement chưa từng có action "Xác nhận" trong app thật** — field
`status` chỉ mới tồn tại trong schema (dùng qua fixture/script khi build
Constraint Set Compiler), chưa nối vào UI. Không có cách nào để
Constraint Set Compiler chạy được trên project thật nếu thiếu việc này
— giống hệt phát hiện ở Demo Polish Task 1 (Estimate). Đã thêm tối
thiểu: `confirmRequirement()` (repository) + `POST /api/projects/:id/
confirm-requirement` + nút "Xác nhận yêu cầu" hiện ngay trên trang
Design khi bị chặn. Đây là phần nối dây cần thiết để Stage 1 chạy được
end-to-end trên dữ liệu thật, không phải mở rộng phạm vi hình học.

## Bugs phát hiện qua Manual POC (đã sửa)

1. **`bedroom` và `wc` khác `priority`** → thuật toán "sequential bar"
   xếp chúng thành 2 dải riêng, khiến `kitchen` không còn liền kề `wc`
   dù Design Intent Graph có quan hệ `connection` — validator báo đúng
   lỗi "không tìm thấy cạnh chung". Sửa: `bedroom`/`wc` dùng chung
   `priority=3` để nằm cùng 1 dải, đúng ý đồ tô-pô ban đầu.
2. **`entrance` (node ảo, không có polygon) bị validator đòi hỏi wall**
   như một phòng thật. Sửa: cạnh nối tới `entrance` kiểm tra riêng —
   phòng còn lại phải chạm mặt tiền (y≈0), không kiểm tra wall chung.

Cả 2 đều là lỗi thật, không phải giả định sai — đúng mục đích Manual POC.

## Manual POC

```
npm run poc:drawing   (fixture: simple-house, đúng Stage 1 authorization)

  PASS  template được chọn
  PASS  geometry validation passed (không lỗi)
  PASS  có đúng 1 sheet (Stage 1: 1 tầng)
  PASS  có phòng khách / bếp / đủ 2 phòng ngủ / đủ 1 WC
  PASS  tổng diện tích khớp buildingFootprint
  PASS  có title block + disclaimer
  PASS  có wall exterior + interior
  PASS  SVG sinh được, không rỗng
  PASS  deterministic — chạy lại cho cùng hình học

13/13 pass
```

Không hand-compute toạ độ kỳ vọng — assert theo THUỘC TÍNH hình học
(cùng lý do đã áp dụng ở proposal-poc.ts).

## Files

- Mới: `apps/web/src/lib/drawing/{designIntentGraph,layoutGraph,
  layoutGenerator,geometry,wall,geometryValidator,drawingDocument,
  svgRenderer,generateDrawing}.ts`,
  `apps/web/src/lib/drawing/templates/townhouse.ts`,
  `apps/web/src/app/projects/[id]/design/page.tsx`,
  `apps/web/src/app/api/projects/[id]/confirm-requirement/route.ts`,
  `apps/web/scripts/drawing-poc.ts`.
- Sửa: `apps/web/src/features/project/project.repository.ts`
  (`confirmRequirement`), `apps/web/src/services/project.service.ts`,
  `apps/web/src/features/workspace/components/WorkspaceHeader.tsx` (nav
  "Bản vẽ khái niệm"), `apps/web/src/app/globals.css` (print CSS
  `.design-print-area`), `apps/web/package.json` (script
  `poc:drawing`), `packages/shared-types/fixtures/constraint/
  simple-house/*.json` (thêm frontage/depth/buildingFootprint —
  simple-house trước đó chỉ có landArea, không đủ dựng envelope).

## Verify

- `npx tsc --noEmit` (apps/web): PASS.
- `npm run poc:drawing`: 13/13 PASS.
- `npm run poc:proposal`: 4/4 PASS (không ảnh hưởng bởi thay đổi
  fixture simple-house).
- `npm run poc:constraint` (shared-types): 3/3 PASS.
- `npx next build`: PASS — route `/projects/[id]/design` compile được.

## Completion Standard (đối chiếu với yêu cầu Founder)

- Hình học là dữ liệu có cấu trúc (Point[] polygon) — ✅.
- Cùng input → cùng hình học — ✅ (assert trong Manual POC).
- Cả 3 fixture: **chỉ simple-house được test** (đúng Stage 1
  authorization "Target fixture: simple-house", townhouse/villa chưa
  làm — cần cầu thang/nhiều tầng, ngoài phạm vi Stage 1).
- Không phòng nào vượt envelope; không chồng lấn — ✅.
- Dimension/label/diện tích hiển thị — ✅.
- Giả định + cảnh báo hiển thị — ✅.
- SVG xuất được; in/PDF qua `window.print()` — ✅.
- Concept có thể xác nhận (status) — **chưa làm** (ngoài phạm vi Stage 1
  đã tuyên bố — "Do not expand Stage 1 scope").
- Demo điều hướng Requirement → Drawing → Estimate → Proposal — nav đã
  nối (`WorkspaceHeader`), nhưng cần "Xác nhận yêu cầu" trước (đã thêm).

## Next

Chờ Tech Lead Review trước khi mở rộng sang Stage 2 (multi-floor,
staircase, townhouse/villa fixture, floor allocation heuristic — xem 3
rủi ro Founder-input đã nêu ở `20_...md` Phần E, vẫn cần xác nhận trước
Stage 2).
