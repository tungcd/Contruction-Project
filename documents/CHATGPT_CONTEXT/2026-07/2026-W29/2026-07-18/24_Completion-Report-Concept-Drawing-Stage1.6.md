# Completion Report — Concept Drawing Stage 1.6 (Demo-Grade Single-Floor Baseline)

**Ngày:** 2026-07-18/19

## Task 1 — Actual Review Artifacts (đính kèm nội dung thật, không chỉ path)

Đã sinh lại (`npm run drawing:artifacts`), file nằm tại
`apps/web/demo-output/simple-house/` (đã commit vào repo) + đóng gói
thêm `apps/web/demo-output/simple-house-artifacts.zip`. Dưới đây là NỘI
DUNG THẬT (không chỉ path) để review trực tiếp trong tài liệu này:

### Kích thước phòng thật (tính từ `simple-house-geometry.json`)

| Phòng | Rộng × Sâu | Diện tích | Tỷ lệ khung hình | Trong khoảng ưu tiên? |
|---|---|---|---|---|
| Phòng khách (living) | 6.0 × 2.86 m | 17.1 m² | 2.10:1 | Không — vượt preferred (1.8), **trong** hard (3.0) → warning |
| Bếp (kitchen) | 6.0 × 2.04 m | 12.2 m² | 2.94:1 | Không — vượt preferred (2.2), **trong** hard (3.5) → warning |
| Phòng ngủ (bedroom-1) | 3.6 × 5.10 m | 18.4 m² | 1.42:1 | **Có** |
| Phòng ngủ 2 (bedroom-2) | 2.4 × 3.40 m | 8.2 m² | 1.42:1 | **Có** |
| WC (wc-1) | 2.4 × 1.70 m | 4.1 m² | **1.41:1** | **Có** — so với 4.25:1 ở Stage 1.5 |

Tổng diện tích = 60.0 m² (khớp `buildingFootprint`).

### SVG thật (nội dung đầy đủ, không rút gọn)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 300 540" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="300" height="540" fill="#ffffff" />
        <line x1="60" y1="46" x2="240" y2="46" stroke="#999" stroke-width="0.5" />
        <text x="150" y="42" text-anchor="middle" font-size="9" fill="#999">6 m</text>
        <line x1="60" y1="46" x2="60" y2="346" stroke="#999" stroke-width="0.5" />
        <text x="60" y="192" text-anchor="middle" font-size="9" fill="#999">10 m</text>
        <line x1="60" y1="131.71428571428572" x2="240" y2="131.71428571428572" stroke="#999" stroke-width="0.5" />
        <text x="150" y="127.71428571428572" text-anchor="middle" font-size="9" fill="#999">6.0 m</text>
        <line x1="60" y1="192.93877551020407" x2="168" y2="192.93877551020407" stroke="#999" stroke-width="0.5" />
        <text x="114" y="188.93877551020407" text-anchor="middle" font-size="9" fill="#999">3.6 m</text>
        <line x1="168" y1="192.93877551020407" x2="240" y2="192.93877551020407" stroke="#999" stroke-width="0.5" />
        <text x="204" y="188.93877551020407" text-anchor="middle" font-size="9" fill="#999">2.4 m</text>
        <line x1="168" y1="294.9795918367347" x2="240" y2="294.9795918367347" stroke="#999" stroke-width="0.5" />
        <text x="204" y="290.9795918367347" text-anchor="middle" font-size="9" fill="#999">2.4 m</text>
        <rect x="60" y="60" width="180" height="85.71428571428572" fill="#fafafa" stroke="none" />
        <text x="150" y="96.85714285714286" text-anchor="middle" font-size="12" font-weight="600">Phòng khách</text>
        <text x="150" y="112.85714285714286" text-anchor="middle" font-size="10" fill="#666">17.1 m²</text>
        <rect x="60" y="145.71428571428572" width="180" height="61.224489795918345" fill="#fafafa" stroke="none" />
        <text x="150" y="170.32653061224488" text-anchor="middle" font-size="12" font-weight="600">Bếp</text>
        <text x="150" y="186.32653061224488" text-anchor="middle" font-size="10" fill="#666">12.2 m²</text>
        <rect x="60" y="206.93877551020407" width="108" height="153.06122448979593" fill="#fafafa" stroke="none" />
        <text x="114" y="277.46938775510205" text-anchor="middle" font-size="12" font-weight="600">Phòng ngủ</text>
        <text x="114" y="293.46938775510205" text-anchor="middle" font-size="10" fill="#666">18.4 m²</text>
        <rect x="168" y="206.93877551020407" width="72" height="102.04081632653063" fill="#fafafa" stroke="none" />
        <text x="204" y="251.9591836734694" text-anchor="middle" font-size="12" font-weight="600">Phòng ngủ 2</text>
        <text x="204" y="267.9591836734694" text-anchor="middle" font-size="10" fill="#666">8.2 m²</text>
        <rect x="168" y="308.9795918367347" width="72" height="51.0204081632653" fill="#fafafa" stroke="none" />
        <text x="204" y="328.48979591836735" text-anchor="middle" font-size="12" font-weight="600">WC</text>
        <text x="204" y="344.48979591836735" text-anchor="middle" font-size="10" fill="#666">4.1 m²</text>
    <line x1="60" y1="145.71428571428572" x2="136.5" y2="145.71428571428572" stroke="#6b7280" stroke-width="1.5" /><line x1="163.5" y1="145.71428571428572" x2="240" y2="145.71428571428572" stroke="#6b7280" stroke-width="1.5" /><line x1="60" y1="206.93877551020407" x2="100.5" y2="206.93877551020407" stroke="#6b7280" stroke-width="1.5" /><line x1="127.5" y1="206.93877551020407" x2="168" y2="206.93877551020407" stroke="#6b7280" stroke-width="1.5" /><line x1="168" y1="206.93877551020407" x2="190.5" y2="206.93877551020407" stroke="#6b7280" stroke-width="1.5" /><line x1="217.5" y1="206.93877551020407" x2="240" y2="206.93877551020407" stroke="#6b7280" stroke-width="1.5" /><line x1="168" y1="206.93877551020407" x2="168" y2="308.9795918367347" stroke="#6b7280" stroke-width="1.5" /><line x1="168" y1="308.9795918367347" x2="168" y2="360" stroke="#6b7280" stroke-width="1.5" /><line x1="168" y1="308.9795918367347" x2="190.5" y2="308.9795918367347" stroke="#6b7280" stroke-width="1.5" /><line x1="217.5" y1="308.9795918367347" x2="240" y2="308.9795918367347" stroke="#6b7280" stroke-width="1.5" /><line x1="60" y1="60" x2="136.5" y2="60" stroke="#111827" stroke-width="3" /><line x1="163.5" y1="60" x2="240" y2="60" stroke="#111827" stroke-width="3" /><line x1="240" y1="60" x2="240" y2="360" stroke="#111827" stroke-width="3" /><line x1="240" y1="360" x2="60" y2="360" stroke="#111827" stroke-width="3" /><line x1="60" y1="360" x2="60" y2="60" stroke="#111827" stroke-width="3" />
    <line x1="136.5" y1="60" x2="136.5" y2="87" stroke="#374151" stroke-width="1.5" />
    <path d="M 136.5 87 A 27 27 0 0 1 163.5 60" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
    <line x1="136.5" y1="145.71428571428572" x2="136.5" y2="172.7142857142857" stroke="#374151" stroke-width="1.5" />
    <path d="M 136.5 172.7142857142857 A 27 27 0 0 1 163.5 145.71428571428572" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
    <line x1="100.5" y1="206.93877551020407" x2="100.5" y2="233.93877551020407" stroke="#374151" stroke-width="1.5" />
    <path d="M 100.5 233.93877551020407 A 27 27 0 0 1 127.5 206.93877551020407" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
    <line x1="190.5" y1="206.93877551020407" x2="190.5" y2="233.93877551020407" stroke="#374151" stroke-width="1.5" />
    <path d="M 190.5 233.93877551020407 A 27 27 0 0 1 217.5 206.93877551020407" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
    <line x1="190.5" y1="308.9795918367347" x2="190.5" y2="335.9795918367347" stroke="#374151" stroke-width="1.5" />
    <path d="M 190.5 335.9795918367347 A 27 27 0 0 1 217.5 308.9795918367347" fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="2,2" />
    <text x="60" y="450" font-size="10" fill="#b45309">⚠ Phòng "living" (living) tỷ lệ khung hình 2.10:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được.</text><text x="60" y="464" font-size="10" fill="#b45309">⚠ Phòng "kitchen" (kitchen) tỷ lệ khung hình 2.94:1 — ngoài khoảng ưu tiên (tối đa 2.2:1), vẫn trong giới hạn chấp nhận được.</text>
    <text x="60" y="500" font-size="11" font-weight="600">Simple House Demo — Mặt bằng tầng (Concept)</text>
    <text x="60" y="516" font-size="9" fill="#666">NOT TO SCALE — Lập ngày 19/7/2026</text>
    <text x="60" y="532" font-size="9" fill="#b91c1c">Bản vẽ khái niệm sơ bộ — dựa trên thông tin và giả định đã cung cấp, cần kiến trúc sư/kỹ sư kiểm tra lại, KHÔNG dùng để thi công trực tiếp.</text>
</svg>
```

**Screenshot/PDF: vẫn KHÔNG có sẵn** — môi trường chạy không có trình
duyệt/display, không đổi so với Stage 1.5 (không phải bỏ sót, là giới
hạn môi trường đã nêu rõ 2 lần). File `.zip` + `.html` in được đã có sẵn
để Founder tự tạo PDF/ảnh chụp thật.

## Task 2 — Room Geometry Constraint

`roomConstraints.ts` (mới) — `RoomGeometryConstraint{minWidth, minDepth,
preferredAspectRatioMin/Max, hardAspectRatioMax}` cho 4 loại phòng
(living/kitchen/bedroom/wc). Giá trị là đề xuất của Claude (dựa trên
kích thước tối thiểu thông thường), CHƯA phải số liệu Founder xác nhận —
giống các Open Decision trước đây, có thể chỉnh trực tiếp trong file
này. Vi phạm `minWidth`/`minDepth`/`hardAspectRatioMax` → fail cứng; vi
phạm `preferredAspectRatioMax` (nhưng trong hard) → chỉ warning, vẫn
pass (đã thấy 2 warning thật ở living/kitchen, xem trên).

## Task 3 — Improved Single-Floor Template

Thuật toán "sequential bar" cũ: dải cuối (bedroom+wc) chia CHIỀU RỘNG
theo areaWeight nhưng giữ nguyên CHIỀU SÂU cho mọi phòng trong dải →
WC 1.2×5.1m (4.25:1). Sửa: 1 phòng NẶNG NHẤT đứng riêng 1 cột (cột A,
chiếm trọn chiều sâu dải), các phòng còn lại dồn cột B (xếp chồng theo
chiều sâu). Chiều rộng mỗi cột tính từ tỷ lệ khung hình MỤC TIÊU của
từng phòng (lấy MAX trong cột, không lấy trung bình — tránh phòng cần
rộng nhất bị thiếu hụt), rồi chuẩn hoá tổng đúng bằng mặt tiền.

**Phải sửa thêm tô-pô (Design Intent Graph)** — thuật toán mới khiến
`wc` không còn chạm `kitchen` trực tiếp (chỉ chạm `bedroom-2`, phòng xếp
ngay trước nó trong cột B) — validator bắt đúng lỗi này khi mới đổi
thuật toán, đã sửa `designIntentGraph.ts`: chỉ 2 phòng đầu (1 cột A + 1
đầu cột B) chạm hub, các phòng sau đó chạm phòng liền trước — khớp đúng
tô-pô hình học thực tế thay vì nối hết vào 1 hub.

**Kết quả:** WC từ 4.25:1 → **1.41:1**. bedroom-1/bedroom-2 đều 1.42:1
(trong khoảng ưu tiên). Không cần Constraint Solver tổng quát.

## Task 4 — Real Door Openings

`svgRenderer.ts` viết lại: wall được cắt thành nhiều đoạn "đặc"
(`wallSolidSegments`) quanh khoảng cửa — khe hở THẬT, không còn là đè
màu trắng lên tường liền mạch. Mỗi cửa vẽ thêm: lá cửa (line vuông góc
với wall, dài = door.width) + vòng cung mở 90° (SVG `<path>` arc). Domain
model `Door` giữ nguyên (không thêm `hingeSide`/`swingDirection`) —
renderer tự chọn quy ước xoay cố định (vuông góc theo 1 chiều nhất
quán) chỉ để hiển thị, không lưu vào domain.

## Task 5 — A4 Print Sheet

`svgRenderer.ts`: SVG dùng `width="100%"` + `viewBox` (không còn kích
thước pixel cố định ép buộc) + `preserveAspectRatio="xMidYMid meet"`.
CSS in (`globals.css` `.design-print-area` và artifact HTML): thêm
`@page { size: A4 portrait; margin: 15mm; }`, `svg { width:100% !important;
height:auto !important; }`. Print HTML dùng ĐÚNG chuỗi SVG do
`renderFloorPlanToSvg()` sinh ra — không có bản HTML riêng khác nội
dung với bản web.

## Task 6 — Visual QA (đã tự inspect file thật, tìm và SỬA 1 bug)

**Giới hạn nhắc lại:** không có trình duyệt/display, QA dựa trên đọc
trực tiếp nội dung SVG/JSON thật (không phải suy luận gián tiếp như
Stage 1.5, nhưng vẫn không phải xem ảnh render).

**Bug tìm được và ĐÃ SỬA:** đọc `simple-house-drawing-package.json` phát
hiện dimension của "Phòng khách" (0,0)-(6,0) trùng CHÍNH XÁC toạ độ với
dimension tổng envelope (0,0)-(6,0) — 2 đường + 2 label ("6 m" vs "6.0
m") đè lên nhau. Đã sửa `drawingDocument.ts`: bỏ dimension riêng của
phòng nếu trùng đúng cạnh envelope.

**Bug tìm được và ĐÃ SỬA (thứ 2, phát hiện khi tự kiểm chứng số liệu
warning):** `generate-drawing-artifacts.ts` tự gọi lại chuỗi
`generateLayout/deriveWalls/placeDoors/validateGeometry/
buildDrawingPackage` thay vì dùng `generateConceptDrawing()` — khi
`generateDrawing.ts` được cập nhật thêm `validation.warnings`, script
artifact bị BỎ SÓT không merge (thiếu đúng 1 chỗ). Đã refactor:
`generateDrawing.ts` giờ trả thêm `intermediates` (layoutGraph/geometry/
walls/doors) để script chỉ cần gọi ĐÚNG 1 entry point — loại bỏ hẳn khả
năng lặp lại lỗi này.

Checklist còn lại:
- **Room proportion:** WC/bedroom đều tốt (≤1.42:1). living/kitchen hơi
  dẹt (2.1:1/2.94:1) — cảnh báo, không chặn, đặc điểm cố hữu của phòng
  công cộng trải hết mặt tiền trong template 1 cột.
- **Label overlap:** đã tính lại toạ độ pixel — không phát hiện chồng
  lấn text trực tiếp (xem SVG nhúng ở trên).
- **Dimension overlap:** đã sửa 1 chồng lấn thật (trên). Còn lại không
  phát hiện thêm qua tính toán.
- **Door/wall:** cửa hiện có khe hở thật + lá cửa + vòng cung — xem SVG.
- **Title block/disclaimer:** có, đọc được ở footer SVG.
- **A4 fit:** SVG co giãn theo viewBox, chưa in thử thật — **vẫn cần
  Founder xác nhận bằng mắt**, đây là giới hạn không thể vượt qua chỉ
  bằng đọc mã nguồn.

## Manual POC

`npm run poc:drawing`: nâng từ 18 lên **20 assertion** (thêm kiểm tra
tỷ lệ WC < 2.5:1, có vòng cung mở cửa, wall bị cắt khe hở thật) — tất cả
PASS.

## Files

- Mới: `apps/web/src/lib/drawing/roomConstraints.ts`,
  `apps/web/demo-output/simple-house-artifacts.zip`.
- Sửa: `geometry.ts` (thuật toán tier 3+ node), `designIntentGraph.ts`
  (tô-pô khớp thuật toán mới), `geometryValidator.ts` (Room Geometry
  Constraint + `warnings` field), `drawingDocument.ts` (bỏ dimension
  trùng lặp), `svgRenderer.ts` (wall cắt khe hở + door leaf/arc + viewBox
  A4), `generateDrawing.ts` (thêm `intermediates`, là entry point DUY
  NHẤT), `generate-drawing-artifacts.ts` (refactor dùng entry point
  chung thay vì tự lặp pipeline), `globals.css` (A4 `@page`),
  `drawing-poc.ts` (4 assertion mới).

## Verify

- `npx tsc --noEmit`: PASS.
- `npm run poc:drawing`: 20/20 PASS.
- `npm run poc:proposal`: 4/4 PASS.
- `npm run poc:constraint` (shared-types): 3/3 PASS.
- `npx next build`: **KHÔNG xác nhận lại được lần này** — nhiều tiến
  trình `node.exe` đang chạy trên máy (có thể gồm cả các lần build bị
  timeout trước đó của chính phiên làm việc này), một trong số đó đang
  giữ khoá file `.next/trace` khiến build mới không chạy được. Theo
  đúng quy tắc an toàn đã đặt ra ("không kill toàn bộ tiến trình node"),
  tôi KHÔNG tự ý tắt bất kỳ tiến trình nào để gỡ khoá — không phân biệt
  được đâu là tiến trình của tôi, đâu có thể là của Founder. Nói rõ giới
  hạn này thay vì báo PASS không chắc chắn. `npx tsc --noEmit` (chính
  bước type-check mà `next build` cũng chạy) đã PASS, và các thay đổi
  Stage 1.6 chỉ thêm export/field vào file `lib/` có sẵn, không đụng gì
  tới routing/bundling — rủi ro build framework-level phát sinh mới là
  thấp, nhưng đây là suy luận, không phải xác nhận trực tiếp. Đề xuất
  Founder tự chạy `npm run build` một lần khi tiện (có thể cần khởi
  động lại terminal/máy để giải phóng khoá file trước).

## Next

Chờ Tech Lead visual review thật (mở file `.zip`/`.html` đính kèm) trước
khi bắt đầu Stage 2.
