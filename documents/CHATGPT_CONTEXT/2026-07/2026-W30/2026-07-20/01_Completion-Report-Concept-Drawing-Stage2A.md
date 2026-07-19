# Completion Report — Concept Drawing Stage 2A (Multi-Floor Townhouse and Stair Core POC)

Ngày: 2026-07-20. Cả 2 cổng xác minh của Tech Lead Review trước
("Remaining Verification Gate") đã PASS (`npx next build`, `npm run
poc:constraint`) trước khi bắt đầu Stage 2A — theo đúng quy tắc đã nêu
("If both commands pass, Stage 2 is automatically authorized"), không
chờ thêm 1 vòng review.

## 1. Tóm tắt

Mở rộng pipeline sang nhà NHIỀU TẦNG (fixture `townhouse`: mặt tiền 5m,
sâu 16m, 3 tầng, 4 phòng ngủ, 3 WC), có cầu thang thẳng hàng giữa các
tầng, mỗi tầng validate tô-pô circulation độc lập + validate thêm ở mức
toà nhà (thẳng hàng cầu thang + chuỗi tầng liên thông). `simple-house`
(Stage 1.7, 1 tầng) giữ nguyên hành vi — dùng LẠI đúng 1 pipeline, không
tạo nhánh song song (đã xác nhận bằng 26/26 test cũ vẫn PASS y hệt).

## 2. Kiến trúc — những gì THAY ĐỔI so với Stage 1.7

- **Design Intent Graph**: `relationships` chuyển vào TỪNG TẦNG (trước
  là 1 mảng phẳng dùng chung) — lý do: id như "circulation"/"staircase"
  LẶP LẠI ở mỗi tầng (mỗi tầng có sảnh/cầu thang riêng), cần tách đúng
  phạm vi tầng để không mơ hồ. Thêm `verticalConnections` — khái niệm
  MỚI (không phải 1 RelationshipType) nối "staircase" giữa 2 tầng liền
  kề.
- **Layout Graph**: `buildLayoutGraph` (1 đồ thị) → `buildLayoutGraphsPerFloor`
  (N đồ thị, 1/tầng) — đúng yêu cầu Task 4 "one Layout Graph per floor".
- **Floor Allocation** (`floorAllocation.ts`, MỚI — Task 1): quyết định
  phòng nào thuộc tầng nào TRƯỚC khi dựng tô-pô. Fixture `townhouse`
  không có chi tiết phòng-theo-tầng trong Requirement → dùng fallback:
  tầng trệt = khách/bếp/1 WC, các tầng còn lại chia đều 4 phòng ngủ + 2
  WC còn lại (2+1 mỗi tầng). Mọi quyết định heuristic ghi vào
  `assumptions[]`.
- **Staircase Domain** (`staircase.ts`, MỚI — Task 2): `StaircaseCore
  {id, polygon, levels, width, direction}` — dữ liệu DẪN XUẤT (giống
  Wall/Door), tổng hợp lại từ các GeometrySpace `type="staircase"` trên
  từng tầng để XÁC NHẬN (không chỉ giả định) chúng thẳng hàng.
- **Geometry Solver**: cầu thang đặt thành 1 dải TRỌN CHIỀU RỘNG mặt
  tiền, ở cuối mỗi tầng (`STAIRCASE_DEPTH = 3.0m`, tính THUẦN từ
  `envelope` — không phụ thuộc phòng nào khác) → tự động thẳng hàng giữa
  các tầng (cùng công thức, cùng envelope → cùng polygon), không cần
  thuật toán căn chỉnh chéo tầng riêng.
- **Layout Graph Validation** (`layoutGraphValidator.ts`, sửa — Task 3
  gốc mở rộng): giờ lọc đúng phạm vi 1 tầng (trước gộp
  `dig.floors.flatMap`, sẽ SAI khi có nhiều tầng cùng id "circulation").
  Gốc reachability đổi động: "entrance" cho tầng trệt, "staircase" cho
  tầng trên (điểm vào duy nhất của tầng đó).
- **Vertical Connection Validation** (`staircase.ts`, MỚI — Task 4):
  chạy SAU khi Geometry đã giải (cần toạ độ thật): (a) chuỗi
  `VerticalConnection` liên tục từ tầng 0, (b) mọi tầng nối nhau đều có
  mặt bằng cầu thang, (c) các polygon cầu thang trùng khít nhau (so
  sánh số liệu thật, không chỉ tin thuật toán).
- **Window/Door id + wall lookup multi-floor-safe**: phát hiện và sửa 2
  lỗi thật trong lúc làm (xem mục 6).
- **Drawing Document**: `TitleBlock` thêm `floorLabel`/`floorLevel`;
  `FloorPlanView` thêm `hasStairUp`/`hasStairDown` (cho hướng mũi tên).
- **SVG Renderer**: `stairSymbol()` mới — bậc thang mô phỏng + mũi tên
  lên/xuống theo đúng hướng thật của tầng.
- **UI** (`design/page.tsx`): thêm `Segmented` chọn tầng xem trên màn
  hình; nút In LUÔN in TOÀN BỘ sheet (mỗi tầng 1 trang, `page-break-after`
  trong `globals.css`), không giới hạn theo tầng đang xem.

## 3. Kết quả hình học thật (fixture `townhouse`, 5m x 16m, 3 tầng)

```
TẦNG TRỆT (Tầng trệt):
  Phòng khách        5.00 x 6.28 m = 31.38 m²  tỷ lệ 1.26:1
  Bếp                4.00 x 4.48 m = 17.93 m²  tỷ lệ 1.12:1
  WC                 4.00 x 2.24 m =  8.97 m²  tỷ lệ 1.78:1
  Sảnh/Hành lang     1.00 x 6.72 m =  6.72 m²  (không áp constraint tỷ lệ)
  Cầu thang          5.00 x 3.00 m = 15.00 m²  (không áp constraint tỷ lệ)

TẦNG 1 (và TẦNG 2 — giống hệt cấu trúc, khác id phòng):
  Phòng ngủ          4.00 x 5.20 m = 20.80 m²  tỷ lệ 1.30:1
  Phòng ngủ 2        4.00 x 5.20 m = 20.80 m²  tỷ lệ 1.30:1
  WC                 4.00 x 2.60 m = 10.40 m²  tỷ lệ 1.54:1
  Sảnh/Hành lang     1.00 x 13.00 m = 13.00 m²  (không áp constraint tỷ lệ)
  Cầu thang          5.00 x 3.00 m = 15.00 m²  (không áp constraint tỷ lệ)
```

Không có warning tỷ lệ khung hình nào (mọi phòng đều trong khoảng ưu
tiên, không chỉ trong hard limit) — khác `simple-house` (2 warning nhẹ,
đã chấp nhận từ Stage 1.7).

**Phân bổ phòng theo tầng** (assumptions thật, sinh ra từ
`floorAllocation.ts`):
```
- Tầng trệt: Phòng khách, Bếp, 1 WC (wc-1)
- Tầng 1: 2 phòng ngủ (bedroom-1, bedroom-2), 1 WC (wc-2)
- Tầng 2 (trên cùng): 2 phòng ngủ (bedroom-3, bedroom-4), 1 WC (wc-3)
```

**Warnings thật (Sheet 0, đầy đủ)**:
```
- Phân bổ phòng theo tầng dùng heuristic mặc định (Requirement không có
  chi tiết phòng theo từng tầng): tầng trệt = phòng khách/bếp/1 WC, các
  tầng còn lại chia đều phòng ngủ/WC còn lại.
- Yêu cầu có ban công (balcony) — Stage 2A chưa đặt hình học ban công
  (ngoài phạm vi task hiện tại), chỉ ghi nhận yêu cầu.
- Chưa hỗ trợ đặt vị trí cho phòng tự do: phòng thờ ông bà — chưa xuất
  hiện trong bản vẽ.
- Ghi nhận loại trừ (chưa cần xử lý hình học): phòng đọc sách.
```

## 4. Cầu thang — thẳng hàng thật (không chỉ giả định)

`StaircaseCore` sinh ra (đã đối chiếu bit-for-bit qua `validateVerticalConnections`):

```json
{
  "id": "staircase",
  "polygon": [{"x":0,"y":13},{"x":5,"y":13},{"x":5,"y":16},{"x":0,"y":16}],
  "levels": [0, 1, 2],
  "width": 5,
  "direction": "vertical"
}
```

Polygon `[0,13]-[5,16]` GIỐNG HỆT trên cả 3 tầng (đã kiểm bằng
`sameRect()` trong `staircase.ts`, không chỉ vì "công thức chắc đúng").
Cửa nối circulation-staircase tồn tại trên mọi tầng (xem mục 5). Mũi tên
hướng: tầng trệt chỉ có mũi tên LÊN, tầng 1 có CẢ 2 (lên+xuống), tầng
trên cùng chỉ có mũi tên XUỐNG — xác nhận bằng cách đếm số `<path>` mũi
tên trong SVG thật (1, 2, 1 tương ứng).

## 5. Tô-pô cửa thật (6 tầng dữ liệu, rút gọn)

```
Tầng trệt: living↔exterior(cửa chính), living↔circulation,
           circulation↔kitchen, circulation↔wc-1, circulation↔staircase
Tầng 1:    staircase↔circulation, circulation↔bedroom-1,
           circulation↔bedroom-2, circulation↔wc-2
Tầng 2:    staircase↔circulation, circulation↔bedroom-3,
           circulation↔bedroom-4, circulation↔wc-3
```

Không tầng nào có cửa nối trực tiếp giữa 2 phòng ngủ — xác nhận bằng
`townhouse-poc.ts` assertion "không có cửa nối trực tiếp 2 phòng ngủ"
(PASS cả 3 tầng).

## 6. Lỗi thật tự phát hiện và tự sửa trong lúc làm

1. **`placeWindows` không floor-scoped**: hàm tìm exterior wall theo
   suffix (`w.id.endsWith("-ext-top")`) — khi truyền `walls` đã GỘP
   nhiều tầng (mỗi tầng đều có `wall-{level}-ext-top`), `.find()` luôn
   khớp tầng ĐẦU TIÊN bất kể phòng đang xét ở tầng nào. Phát hiện khi rà
   lại code trước khi chạy thử (không phải qua crash) — sửa bằng cách
   lọc `walls` theo đúng tiền tố `wall-${floor.level}-` TRƯỚC khi tìm.
2. **Round-robin 2-cột không tổng quát cho mặt tiền hẹp**: thuật toán
   Stage 1.7 (đã validate cho `simple-house`, mặt tiền 6m) cho `townhouse`
   (mặt tiền 5m) ra lỗi thật: `wc-1` tỷ lệ 3.36:1 (vượt hard 2.5:1),
   `bedroom-1/2` rộng 2.00m (dưới tối thiểu 2.4m) — phát hiện qua chạy
   thử thật (`generate-drawing-artifacts.ts`), không phải suy đoán
   trước. Nguyên nhân: cột đơn-1-phòng "gánh" trọn chiều sâu dải trong
   bề rộng quá hẹp. Sửa: chỉ chia 2 cột khi `rest.length >= 4` (đủ
   2 phòng/cột — đúng trường hợp `simple-house`); còn lại (1-3 phòng)
   xếp CHỒNG vào 1 cột duy nhất (đủ rộng, tận dụng lô đất SÂU). Xác nhận
   lại: `simple-house` 26/26 vẫn PASS sau khi sửa (không phá case cũ).
3. **Warning trùng lặp**: `floorAllocation.ts` và `designIntentGraph.ts`
   cùng cảnh báo về `otherRooms` ("phòng thờ ông bà") theo 2 cách diễn
   đạt khác nhau — phát hiện khi đọc lại `warnings[]` thật trong drawing
   package. Đã bỏ bản trùng ở `floorAllocation.ts`, giữ 1 nguồn duy nhất.
4. **`tspanBlock()` (kế thừa từ Stage 1.7) thiếu `font-size`** — đã sửa
   ở báo cáo trước, xác nhận vẫn đúng ở artifact mới.

## 7. Kết quả kiểm thử

```
npx tsc --noEmit           -> PASS (0 lỗi)
npm run poc:proposal       -> 4/4 PASS
npm run poc:drawing        -> 26/26 PASS (simple-house, Stage 1.7 regression — không đổi)
npm run poc:townhouse      -> 19/19 PASS (MỚI — Stage 2A, xem danh sách dưới)
npm run poc:constraint     -> 3/3 PASS (packages/shared-types)
npx next build             -> PASS (route /projects/[id]/design build thành công, 36.7 kB)
```

`npm run poc:townhouse` (19 assertion): template chọn đúng, geometry
validation PASS, số tầng khớp Requirement (3), đủ 4 phòng ngủ + 3 WC
qua các tầng, có phòng khách/bếp ở tầng trệt, staircase tồn tại + thẳng
hàng trên mọi tầng, chuỗi tầng liên tục từ 0, mọi phòng nằm trong
envelope (x3 tầng), không có cửa nối trực tiếp 2 phòng ngủ (x3 tầng),
mọi sheet render SVG hợp lệ + đúng viewBox A4, deterministic.

**Xác minh build** — trước khi chạy, kiểm tra `Get-CimInstance
Win32_Process` lọc theo CommandLine chứa "next": KHÔNG có tiến trình
nào đang chạy → chạy `npx next build` 1 lần duy nhất, không tắt bất kỳ
tiến trình nào (đúng nguyên tắc đã cam kết).

## 8. File đính kèm

**simple-house** (`apps/web/demo-output/simple-house/`, không đổi so
với Stage 1.7 ngoài tên file theo quy ước mới `-floor-plan-0.svg`):
`README.md`, `simple-house-layout-graphs.json`, `simple-house-geometry.json`,
`simple-house-drawing-package.json`, `simple-house-staircase-core.json`
(null — 1 tầng), `simple-house-floor-plan-0.svg`,
`simple-house-floor-plan-print.html`, và `simple-house-artifacts.zip`.

**townhouse** (`apps/web/demo-output/townhouse/`, MỚI):
`README.md`, `townhouse-layout-graphs.json` (3 phần tử), `townhouse-geometry.json`
(3 tầng), `townhouse-drawing-package.json` (3 sheet), `townhouse-staircase-core.json`
(mục 4), `townhouse-floor-plan-0.svg`/`-1.svg`/`-2.svg`, `townhouse-floor-plan-print.html`
(3 trang, page-break-after giữa mỗi trang), và `townhouse-artifacts.zip`.

### Phụ lục — Layout Graph thật, Tầng 1 (townhouse)

```json
{
  "envelope": { "frontage": 5, "depth": 16 },
  "nodes": [
    { "id": "staircase", "type": "staircase", "floor": 1, "priority": 9, "areaWeight": 0 },
    { "id": "circulation", "type": "circulation", "floor": 1, "priority": 2, "areaWeight": 0 },
    { "id": "bedroom-1", "type": "bedroom", "floor": 1, "priority": 2, "areaWeight": 1 },
    { "id": "bedroom-2", "type": "bedroom", "floor": 1, "priority": 2, "areaWeight": 1 },
    { "id": "wc-2", "type": "wc", "floor": 1, "priority": 2, "areaWeight": 0.5 }
  ],
  "edges": [
    { "type": "door", "from": "staircase", "to": "circulation" },
    { "type": "door", "from": "circulation", "to": "bedroom-1" },
    { "type": "door", "from": "circulation", "to": "bedroom-2" },
    { "type": "door", "from": "circulation", "to": "wc-2" }
  ]
}
```

(`priority: 9` của staircase là giá trị mặc định chưa dùng tới —
`geometry.ts` loại staircase khỏi nhóm-theo-priority từ đầu, xử lý
riêng bằng `STAIRCASE_DEPTH`, nên priority không ảnh hưởng kết quả;
để lại rõ ràng hơn nếu thêm entry riêng, ghi nhận là dọn dẹp nhỏ có thể
làm sau, không chặn Stage 2A.)

## 9. Giới hạn còn lại / chưa xử lý

- **Chưa xác nhận thị giác thật** (không có browser trong môi trường
  này) — đã bù bằng kiểm tra toạ độ SVG thật (không vượt viewBox), đếm
  số mũi tên cầu thang khớp hướng mong đợi, và đối chiếu số liệu phòng
  bằng tay. Đề nghị Tech Lead mở `townhouse-floor-plan-print.html` bằng
  trình duyệt thật để xác nhận cuối cùng bằng mắt (3 trang, mỗi tầng 1
  trang) trước khi "Accepted".
- **Cầu thang rộng = trọn mặt tiền** (đơn giản hoá có chủ đích, ghi rõ
  trong assumptions mỗi sheet) — thực tế cầu thang thường hẹp hơn nhiều
  (~1.2-2.4m); chọn cách này vì đảm bảo thẳng hàng tuyệt đối bằng công
  thức đơn giản (không cần thuật toán căn chỉnh chéo tầng), và giữ toàn
  bộ hình học là hình chữ nhật (không có L-shape). Có thể tinh chỉnh sau
  nếu Founder muốn cầu thang hẹp hơn thực tế hơn.
- **Ban công (balcony) chưa đặt hình học** — chỉ ghi nhận qua warning
  (giống otherRooms), theo đúng chính sách "No Silent Drop" đã có từ
  Stage 1. Không nằm trong 9 task của Stage 2A (chỉ xuất hiện trong gợi
  ý fallback của Task 1), có thể là Stage riêng sau nếu cần.
- **Warnings/assumptions hiện áp dụng CHUNG cho mọi sheet** (không tách
  đúng theo từng tầng trong `DrawingPackage` — mỗi sheet nhận NGUYÊN
  mảng warnings của toàn bộ pipeline, dù đã prefix `[Tầng N]` trong nội
  dung text để phân biệt). Có thể tách đúng theo tầng ở 1 stage sau nếu
  cần UI rõ ràng hơn (hiện tại UI web đã lọc hiển thị đúng theo tầng
  đang chọn qua `titleBlock.floorLevel`, chỉ dữ liệu thô là gộp).
- **Section 3 của `geometryValidator.ts`** (door-wall consistency) khi
  gọi PER-FLOOR (đã làm ở `generateDrawing.ts`) là đúng — nhưng nếu ai
  đó sau này gọi nó với 1 LayoutGraph GỘP nhiều tầng (không theo đúng
  pattern hiện tại), id lặp lại ("circulation"/"staircase") có thể gây
  1 lỗi ở 1 tầng bị che bởi wall hợp lệ ở tầng khác (false-pass) — đã
  tránh bằng cách LUÔN gọi per-floor trong `generateDrawing.ts`, nhưng
  chưa có guard tường minh chặn việc gọi sai ở tương lai.
