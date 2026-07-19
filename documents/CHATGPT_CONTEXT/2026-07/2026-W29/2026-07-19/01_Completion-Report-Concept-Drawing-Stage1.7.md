# Completion Report — Concept Drawing Stage 1.7 (Semantic Topology and Sheet Correction)

Ngày: 2026-07-19. Trạng thái: đề nghị Tech Lead review lại bằng cách mở
trực tiếp `simple-house-floor-plan-print.html` (đã đính kèm) — Stage
1.6 đã bị "Not Accepted" đúng vì báo cáo trước đó thiếu artifact có thể
xem trực tiếp; báo cáo này nhúng SVG/JSON thật, không chỉ mô tả.

## 1. Tóm tắt thay đổi cốt lõi — Critical Architecture Correction

Stage 1.6 từng đổi tô-pô Design Intent Graph ("chỉ 2 phòng đầu chạm hub,
còn lại chạm phòng liền trước") để KHỚP với thuật toán hình học đã chọn —
Tech Lead xác nhận đây là lỗi kiến trúc: không được đổi Ý ĐỊNH kiến trúc
để geometry pass được validation. Bug thật hiện ra: `bedroom-2 -> wc-1`
là cạnh DUY NHẤT dẫn tới wc-1 → WC dùng chung chỉ vào được bằng cách đi
xuyên qua phòng ngủ của người khác.

**Đã sửa đúng hướng** (Design Intent → Layout Graph → Geometry, một
chiều, không bao giờ ngược lại):

1. Thêm 1 node THẬT `circulation` (sảnh/hành lang) vào Design Intent
   Graph — hub DUY NHẤT nối `living → circulation → {kitchen, bedroom-1,
   bedroom-2, wc-1}`. Tô-pô này khai báo TRƯỚC, không suy ra từ hình học.
2. Geometry Solver (`geometry.ts`, hàm mới `placeTierRowWithCirculation`)
   đặt circulation thành 1 cột hẹp (1.0m) chạy SUỐT chiều sâu của dải,
   nằm GIỮA 2 cột phòng còn lại — nhờ vậy circulation chạm được TẤT CẢ
   các phòng trong dải qua cạnh chung thật (không phải suy diễn), bất kể
   phòng nào rơi vào cột nào. Đây chính là cách HIỆN THỰC HOÁ đúng tô-pô
   đã khai báo, không phải điều chỉnh tô-pô để khớp geometry.
3. Thêm bước validate MỚI — `layoutGraphValidator.ts` —chạy TRÊN Layout
   Graph, TRƯỚC Geometry Solver (`layoutGenerator.ts` gọi nó ngay sau
   `buildLayoutGraph`, trước `solveGeometry`). Nếu tô-pô vi phạm bất biến
   circulation, `generateLayout()` throw ngay, KHÔNG để lọt xuống
   Geometry. Regression test bắt buộc đã thêm vào `drawing-poc.ts`: dựng
   tay chính đồ thị lỗi cũ (`entrance→living→kitchen→bedroom-2→wc`) và
   assert nó bị chặn.

## 2. Kết quả hình học thật (fixture `simple-house`, 6m x 10m)

Layout mới (đã sinh, xem file đính kèm `simple-house-geometry.json`):

```
Phòng khách   (living)      6.00 x 2.86 m = 17.14 m²   tỷ lệ 2.10:1  [cảnh báo — ngoài preferred 1.8, trong hard 3.0]
Bếp           (kitchen)     2.50 x 3.57 m =  8.93 m²   tỷ lệ 1.43:1
Phòng ngủ     (bedroom-2)   2.50 x 3.57 m =  8.93 m²   tỷ lệ 1.43:1
Phòng ngủ 2   (bedroom-1)   2.50 x 4.76 m = 11.90 m²   tỷ lệ 1.90:1  [cảnh báo — ngoài preferred 1.5, trong hard 2.0]
WC            (wc-1)        2.50 x 2.38 m =  5.95 m²   tỷ lệ 1.05:1
Sảnh/Hành lang(circulation) 1.00 x 7.14 m =  7.14 m²   (không áp constraint tỷ lệ — hành lang vốn dài/hẹp theo bản chất)
```

Bố trí: `living` phía mặt tiền (chạm entrance). Phía sau, `circulation`
là 1 cột dọc CHÍNH GIỮA, bên trái là cột `kitchen`/`bedroom-2` (xếp
chồng), bên phải là cột `bedroom-1`/`wc-1` (xếp chồng) — cả 2 cột đều
chạm trọn cạnh circulation.

**Tô-pô cửa (6 cửa)**: entrance↔living, living↔circulation,
circulation↔kitchen, circulation↔bedroom-1, circulation↔bedroom-2,
circulation↔wc-1. WC giờ vào trực tiếp từ circulation — KHÔNG còn đi
xuyên qua bedroom-2.

**Xác minh bằng chính validator mới** (không chỉ khẳng định suông):
`validateLayoutGraphTopology()` chạy trên đồ thị thật ở trên → PASS.
Chạy lại trên đồ thị lỗi cũ (`kitchen→bedroom-2→wc`, dựng tay trong
`drawing-poc.ts`) → FAIL đúng như kỳ vọng, với thông báo "wc chỉ tới
được bằng cách đi xuyên qua phòng riêng tư bedroom-2".

## 3. Window Model (Task 5)

Thêm `window.ts` — model tối thiểu `{id, wallId, roomId, offset, width}`,
đặt trên exterior wall, tránh chồng cửa đi (khoảng hở tối thiểu 0.15m).
Kết quả thật (4 cửa sổ, cả 4 phòng đủ điều kiện đều có):

```
window-0  living     wall-0-ext-top    offset 1.5   width 1.2
window-1  kitchen    wall-0-ext-left   offset 5.36  width 1.2
window-2  bedroom-2  wall-0-ext-left   offset 1.79  width 1.2
window-3  bedroom-1  wall-0-ext-right  offset 5.24  width 1.2
```

WC không có cửa sổ (không bắt buộc theo Task 5, chỉ living/kitchen/mọi
phòng ngủ). Validation mới (`geometryValidator.ts`): window phải tham
chiếu exterior wall có thật, nằm gọn trong wall, không chồng cửa đi.

## 4. True A4 Sheet Coordinate System (Task 6) — sửa lỗi cắt trang

Lỗi Stage 1.6: SVG "vẽ khít nội dung rồi `width:100%`" — không phải toạ
độ trang in thật, dẫn tới tràn/cắt khi in. **Đã viết lại hoàn toàn
`svgRenderer.ts`**:

- `viewBox="0 0 595 842"` CỐ ĐỊNH (đúng tỷ lệ A4, đơn vị point) — không
  còn phụ thuộc kích thước hình học.
- Chia vùng tường minh: header (tên dự án/scale, cao 46pt) → viewport vẽ
  mặt bằng (có chừa riêng 28pt trên / 42pt trái cho dimension tổng) →
  footer (warnings rồi disclaimer, chiều cao TÍNH từ số dòng thật sau khi
  bọc chữ, không đoán 1 số cố định).
- `scale = min(viewportWidth/frontage, viewportHeight/depth)` — luôn lấy
  chiều GIỚI HẠN hơn, đảm bảo mặt bằng nằm gọn trong khung còn lại, mặt
  bằng được CĂN GIỮA trong vùng dành cho nó.
- Đã sửa `globals.css` (`.design-print-area`) và `page.tsx` (ẩn heading/
  đoạn giới thiệu khi in — trước đây các phần này nằm PHÍA TRÊN svg
  trong `.design-print-area`, sẽ đẩy 1 trang A4-đầy-đủ tràn sang trang
  2) và bỏ margin `@page` (SVG đã tự chừa margin bên trong viewBox, cộng
  dồn thêm sẽ đẩy tràn trang).
- Kiểm tra thật (không chỉ khẳng định): parse toàn bộ toạ độ trong SVG đã
  sinh — max x = 500.3 (< 595), max y = 783 (< 842, còn dư ~59pt), min =
  0. Không có toạ độ nào vượt viewBox.

## 5. Text Layout (Task 7)

`wrapText()` + `tspanBlock()` (dùng `<tspan>` multi-line) cho: nhãn
phòng (co font-size dần, sàn 8px, nếu cột hẹp — vd "Sảnh / Hành lang"
tự tách 3 dòng "Sảnh /" / "Hành" / "lang" đúng như sinh thật, xem SVG
đính kèm dòng 56), tên dự án ở header, và từng dòng warnings/disclaimer
ở footer (độ dài tính trước để footer đủ cao, không cắt chữ).

**Bug tự phát hiện và tự sửa trong lúc làm**: `tspanBlock()` ban đầu
tính `fontSize` để chia dòng nhưng QUÊN in `font-size` ra thuộc tính SVG
— nghĩa là mọi nhãn multi-line sẽ hiển thị theo font mặc định trình
duyệt (thường lớn hơn), có thể tràn lại đúng thứ đang cố sửa. Phát hiện
khi đọc kỹ SVG sinh ra (dòng `<text ... font-weight="600">` thiếu
`font-size`), đã sửa ngay trước khi báo cáo.

"Phòng ngủ 2" (bedroom-1, cột rộng 151.5px) giờ vừa 1 dòng, không tràn —
khác Stage 1.6 (cột hẹp hơn nhiều do thuật toán cũ).

## 6. Dimension Presentation (Task 8)

Tách dimension TỔNG (width/depth) ra khỏi dimension từng phòng: dimension
width tổng có extension line đi từ góc mặt bằng LÊN vùng riêng phía trên
(không đè lên mặt bằng); dimension depth tổng có extension line ra vùng
riêng bên TRÁI, label XOAY DỌC (`transform="rotate(-90)"`) — khác Stage
1.6 (label ngang đặt đè lên chính đường dimension dọc, đọc bị vỡ). Dimension
từng phòng (sub-dimension) giữ kiểu cũ (tick nhỏ ngay trên hàng của nó)
nhưng dùng toạ độ trang in mới, không còn trùng lặp với dimension tổng
(kế thừa filter `isRedundantWithEnvelope` từ Stage 1.6).

## 7. Kết quả kiểm thử

```
npx tsc --noEmit        -> PASS (0 lỗi)
npm run poc:proposal    -> 4/4 PASS
npm run poc:drawing     -> 26/26 PASS (21 cũ + 5 mới: A4 viewBox, Window x3, circulation-hub, regression)
npm run test:regression -> KHÔNG áp dụng — script này gọi API tới server
                            đang chạy (npm run dev) để test Requirement
                            Extraction, không liên quan phạm vi Stage
                            1.7 (Concept Drawing); không có dev server
                            chạy trong môi trường này nên bỏ qua, không
                            phải regression do thay đổi lần này.
npx next build           -> xem mục 8 (chạy nền, đợi kết quả trước khi
                            gửi báo cáo)
```

## 8. Build Verification (Task 9)

Trước khi chạy `next build`, đã kiểm tra `tasklist` — vẫn có nhiều
`node.exe` đang chạy (môi trường có sẵn, không phải do phiên này khởi
tạo). Theo đúng nguyên tắc đã cam kết ("Do not kill unrelated Node
processes"), KHÔNG tắt bất kỳ tiến trình nào. `npx next build` được
chạy trực tiếp; kết quả đầy đủ sẽ bổ sung ngay bên dưới khi hoàn tất
(chạy nền do vượt quá 180s).

<!-- BUILD_RESULT_PLACEHOLDER -->

## 9. File đính kèm

- `simple-house-layout-graph.json` — LayoutGraph tô-pô mới (circulation là hub).
- `simple-house-geometry.json` — toạ độ polygon thật (mét).
- `simple-house-drawing-package.json` — Drawing Document đầy đủ (rooms/walls/doors/windows/dimensions).
- `simple-house-floor-plan.svg` — SVG viewBox A4 thật.
- `simple-house-floor-plan-print.html` — mở bằng trình duyệt, Ctrl+P → Save as PDF để kiểm tra bằng mắt.
- `simple-house-artifacts.zip` — gộp toàn bộ các file trên.

(Đường dẫn: `apps/web/demo-output/simple-house/` và `apps/web/demo-output/simple-house-artifacts.zip`.)

## Phụ lục A — LayoutGraph thật (tô-pô, nhúng trực tiếp)

```json
{
  "envelope": { "frontage": 6, "depth": 10 },
  "nodes": [
    { "id": "entrance", "type": "entrance", "floor": 0, "priority": 0, "areaWeight": 0 },
    { "id": "living", "type": "living", "floor": 0, "priority": 1, "areaWeight": 1.4 },
    { "id": "circulation", "type": "circulation", "floor": 0, "priority": 2, "areaWeight": 0 },
    { "id": "kitchen", "type": "kitchen", "floor": 0, "priority": 2, "areaWeight": 1 },
    { "id": "bedroom-1", "type": "bedroom", "floor": 0, "priority": 2, "areaWeight": 1 },
    { "id": "bedroom-2", "type": "bedroom", "floor": 0, "priority": 2, "areaWeight": 1 },
    { "id": "wc-1", "type": "wc", "floor": 0, "priority": 2, "areaWeight": 0.5 }
  ],
  "edges": [
    { "type": "door", "from": "entrance", "to": "living" },
    { "type": "door", "from": "living", "to": "circulation" },
    { "type": "door", "from": "circulation", "to": "kitchen" },
    { "type": "door", "from": "circulation", "to": "bedroom-1" },
    { "type": "door", "from": "circulation", "to": "bedroom-2" },
    { "type": "door", "from": "circulation", "to": "wc-1" }
  ]
}
```

So sánh trực tiếp với tô-pô lỗi Stage 1.6 (đã xoá):
`entrance→living→kitchen→bedroom-2→wc-1` (wc chỉ vào được qua bedroom-2)
→ giờ là `entrance→living→circulation→{kitchen, bedroom-1, bedroom-2,
wc-1}` (mọi phòng vào trực tiếp từ circulation, không có cạnh nào giữa
bedroom và wc/kitchen).

## Phụ lục B — SVG thật đã sinh (nhúng trực tiếp, không chỉ tham chiếu file)

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="595" height="842" fill="#ffffff" />

    <text x="24" font-size="12" font-weight="700"><tspan x="24" y="36.32">Simple House Demo</tspan></text>
    <text x="24" y="58" font-size="9" fill="#666">NOT TO SCALE — Mặt bằng tầng (Concept) — Lập ngày 19/7/2026</text>

      <line x1="136.7" y1="90" x2="136.7" y2="98" stroke="#bbb" stroke-width="0.5" />
      <line x1="500.3" y1="90" x2="500.3" y2="98" stroke="#bbb" stroke-width="0.5" />
      <line x1="136.7" y1="90" x2="500.3" y2="90" stroke="#666" stroke-width="0.6" />
      <text x="318.5" y="86" text-anchor="middle" font-size="9" fill="#333">6 m</text>

      <line x1="56" y1="98" x2="136.7" y2="98" stroke="#bbb" stroke-width="0.5" />
      <line x1="56" y1="704" x2="136.7" y2="704" stroke="#bbb" stroke-width="0.5" />
      <line x1="56" y1="98" x2="56" y2="704" stroke="#666" stroke-width="0.6" />
      <text x="0" y="0" text-anchor="middle" font-size="9" fill="#333" transform="translate(51, 401) rotate(-90)">10 m</text>

        <rect x="136.7" y="98" width="363.6" height="173.14" fill="#fafafa" stroke="none" />
        <text x="318.5" font-size="12" text-anchor="middle" font-weight="600"><tspan x="318.5" y="168.11">Phòng khách</tspan></text>
        <text x="318.5" y="222.66" text-anchor="middle" font-size="9" fill="#666">17.1 m²</text>

        <rect x="136.7" y="271.14" width="151.5" height="216.43" fill="#fafafa" stroke="none" />
        <text x="212.45" font-size="12" text-anchor="middle" font-weight="600"><tspan x="212.45" y="357.71">Bếp</tspan></text>
        <text x="212.45" y="426.97" text-anchor="middle" font-size="9" fill="#666">8.9 m²</text>

        <rect x="136.7" y="487.57" width="151.5" height="216.43" fill="#fafafa" stroke="none" />
        <text x="212.45" font-size="12" text-anchor="middle" font-weight="600"><tspan x="212.45" y="574.13">Phòng ngủ</tspan></text>
        <text x="212.45" y="643.4" text-anchor="middle" font-size="9" fill="#666">8.9 m²</text>

        <rect x="348.8" y="271.14" width="151.5" height="288.57" fill="#fafafa" stroke="none" />
        <text x="424.55" font-size="12" text-anchor="middle" font-weight="600"><tspan x="424.55" y="385.12">Phòng ngủ 2</tspan></text>
        <text x="424.55" y="478.91" text-anchor="middle" font-size="9" fill="#666">11.9 m²</text>

        <rect x="348.8" y="559.71" width="151.5" height="144.29" fill="#fafafa" stroke="none" />
        <text x="424.55" font-size="12" text-anchor="middle" font-weight="600"><tspan x="424.55" y="618.86">WC</tspan></text>
        <text x="424.55" y="663.6" text-anchor="middle" font-size="9" fill="#666">6.0 m²</text>

        <rect x="288.2" y="271.14" width="60.6" height="432.86" fill="#fafafa" stroke="none" />
        <text x="318.5" font-size="12" text-anchor="middle" font-weight="600"><tspan x="318.5" y="425.55">Sảnh /</tspan><tspan x="318.5" y="439.95">Hành</tspan><tspan x="318.5" y="454.35">lang</tspan></text>
        <text x="318.5" y="582.8" text-anchor="middle" font-size="9" fill="#666">7.1 m²</text>

    <!-- ...wall segments, door leaf+arc symbols (6), window symbols (4, màu #2563eb)... -->

    <text x="24" y="720" font-size="9" fill="#b45309">⚠ Phòng "living" ... tỷ lệ khung hình 2.10:1 — ngoài khoảng ưu tiên (tối đa 1.8:1)...</text>
    <text x="24" y="744" font-size="9" fill="#b45309">⚠ Phòng "bedroom-1" ... tỷ lệ khung hình 1.90:1 — ngoài khoảng ưu tiên (tối đa 1.5:1)...</text>
    <text x="24" y="772" font-size="8" fill="#b91c1c">Bản vẽ khái niệm sơ bộ — dựa trên thông tin và giả định đã cung cấp, cần kiến trúc sư/kỹ sư kiểm tra lại...</text>
  </svg>
```

(Bản đầy đủ không rút gọn: `apps/web/demo-output/simple-house/simple-house-floor-plan.svg`, 82 dòng.)

**Xác minh toạ độ không vượt viewBox** (chạy trực tiếp trên file SVG thật
vừa sinh, không phải suy đoán):

```
min coord: 0   max coord: 783   (viewBox: 0 0 595 842)
max x/x1: 500.3   max x2: 500.3
max y/y1: 783     max y2: 704
```

## 10. Giới hạn còn lại / chưa xử lý

- Vẫn CHƯA có xác nhận thị giác thật (browser/screenshot) — môi trường
  này không có display. Đã bù bằng: (a) parse toạ độ SVG sinh ra để xác
  nhận không vượt viewBox bằng số liệu cụ thể (mục 4), (b) tính tay đối
  chiếu vị trí nhãn/cửa sổ với toạ độ phòng. Đề nghị Tech Lead mở
  `simple-house-floor-plan-print.html` bằng trình duyệt thật để xác nhận
  cuối cùng bằng mắt — đây là bước bắt buộc trước khi "Accepted".
- `CIRCULATION_WIDTH = 1.0m` và ngưỡng chia 2 cột round-robin là giá trị
  Claude đề xuất (giống tinh thần `RoomGeometryConstraint` — "Open
  Decision" chưa qua Founder xác nhận), có thể chỉnh qua đúng 1 hằng số
  trong `geometry.ts`.
- Template hiện tại xử lý đúng 1 fixture (`simple-house`, 4 phòng ngoài
  living: kitchen + 2 bedroom + 1 wc). Round-robin 2-cột đã tổng quát
  hoá cho N phòng bất kỳ (không hardcode theo tên phòng), nhưng CHƯA thử
  với số phòng khác 4 — đúng tinh thần "candidate catalog nhỏ, không
  phải solver tổng quát" đã cho phép, nhưng cần lưu ý nếu Founder đổi
  fixture sau này.
