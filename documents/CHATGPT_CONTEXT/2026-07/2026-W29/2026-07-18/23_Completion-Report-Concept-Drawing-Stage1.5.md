# Completion Report — Concept Drawing Stage 1.5 (Visual Proof & Geometry Hardening)

**Ngày:** 2026-07-18

## Task 1 — Reviewable Visual Artifacts

Đã sinh (`npm run drawing:artifacts`), lưu tại
`apps/web/demo-output/simple-house/`:

1. `simple-house-layout-graph.json`
2. `simple-house-geometry.json`
3. `simple-house-drawing-package.json`
4. `simple-house-floor-plan.svg`
5. `simple-house-floor-plan-print.html`
6. **Screenshot/PDF: KHÔNG có sẵn.** Môi trường chạy script không có
   trình duyệt/display — không thể tự chụp ảnh hay xuất PDF (đúng quyết
   định đã chốt: PDF = in SVG qua trình duyệt thật, không dựng renderer
   riêng). `README.md` trong cùng thư mục hướng dẫn Founder mở file
   `.html` bằng trình duyệt và Ctrl+P → Save as PDF để tự tạo file thật.
   Đây là giới hạn môi trường, không phải bỏ sót — nói rõ thay vì giả
   vờ đã kiểm tra bằng mắt.

## Task 2 — Coordinate & Unit Contract

Đã viết thành doc comment tường minh ở đầu `geometry.ts` (đơn vị mét,
gốc toạ độ góc trái-mặt tiền, trục X theo mặt tiền, trục Y theo chiều
sâu, `GEOMETRY_EPS=1e-6`). Đã ENFORCE (không chỉ ghi tài liệu): `wall.ts`
đổi từ hằng số `EPS` cục bộ sang dùng chung `GEOMETRY_EPS`;
`geometryValidator.ts` giữ `AREA_EPS` (0.01) riêng có chú thích rõ vì
sao khác `GEOMETRY_EPS` (dung sai "chồng lấn có ý nghĩa" cần lớn hơn
dung sai "toạ độ bằng nhau tuyệt đối"), và đổi các so sánh mang tính
"toạ độ bằng nhau" (`touchesFacade`) sang dùng `GEOMETRY_EPS` cho đúng ý
nghĩa. `svgRenderer.ts` vẫn là module DUY NHẤT biết `SCALE`/`MARGIN`
(pixel) — không module nào khác đọc ngược pixel về domain.

## Task 3 — Harden Wall Derivation

Đã chọn **Temporary alternative** (không phải Preferred/collinear
segment intersection tổng quát) — lý do cụ thể: thuật toán bounding-box
hiện tại đã ĐÚNG cho hình chữ nhật trục-thẳng (bbox của 1 hình chữ nhật
trục-thẳng CHÍNH LÀ nó), và Stage 1-2 CHỈ tạo hình chữ nhật (không có
hình học cong theo đúng giới hạn phạm vi Founder đã đặt từ đầu) — viết
thuật toán polygon tổng quát bây giờ là suy đoán trước khi có nhu cầu
thật. Thay vào đó thêm `assertAxisAlignedRectangle()` — kiểm tra mỗi
polygon đúng 4 điểm và mọi điểm trùng 1 trong 4 góc bounding box của
chính nó, throw `WallDerivationError` rõ ràng nếu không phải — không
còn "ngầm định" xử lý đúng cho polygon bất kỳ.

Wall ID đổi từ bộ đếm tăng dần (`wall-0-3`) sang tên theo 2 phòng đã sắp
xếp alphabet (`wall-0-kitchen-living`) — deterministic không phụ thuộc
thứ tự duyệt mảng, dễ debug hơn.

## Task 4 — Explicit Door Model

`door.ts` (mới) — `Door{id, wallId, connects, offset, width}`. Cửa
chính (nối `entrance`) đặt trên wall exterior mặt tiền; cửa nội bộ đặt
giữa wall interior tương ứng, width tiêu chuẩn 0.9m (tự thu nhỏ + cảnh
báo nếu wall ngắn hơn, không tự ý im lặng). `geometryValidator.ts` bổ
sung đủ 6 rule bắt buộc: wall tồn tại, offset trong đoạn wall, width
dương, không vượt 2 đầu wall, đúng cặp phòng dự kiến, và **mọi cạnh
"door" trong LayoutGraph phải có Door tương ứng** (No Silent Drop — cạnh
ngữ nghĩa không được "biến mất" mà không có cửa vẽ được). SVG Renderer
vẽ cửa bằng đoạn nét đứt xanh cắt ngang wall — không chỉ là 1 cạnh ngữ
nghĩa vô hình.

## Task 5 — Visual QA (dựa trên số liệu tính toán, KHÔNG phải xem ảnh thật)

**Giới hạn phải nói rõ:** môi trường này không có trình duyệt/display —
không thể trực tiếp NHÌN bản vẽ render ra. QA dưới đây dựa trên tính
toán số liệu thật từ `simple-house-geometry.json` (toạ độ, kích thước)
và cấu trúc SVG sinh ra — không phải quan sát hình ảnh bằng mắt.
Founder nên tự mở `simple-house-floor-plan-print.html` để xác nhận bằng
mắt thật trước khi coi Stage 1.5 hoàn tất về mặt thị giác.

Số liệu thật (từ geometry.json):

| Phòng | Kích thước | Diện tích | Nhận xét |
|---|---|---|---|
| living | 6.0 × 2.86 m | 17.1 m² | Rộng, nông — chấp nhận được |
| kitchen | 6.0 × 2.04 m | 12.2 m² | Khá nông cho bề rộng 6m, kiểu bếp chữ I dài |
| bedroom-1/2 | 2.4 × 5.10 m | 12.2 m² mỗi phòng | Hẹp-sâu (tỷ lệ ~2.1:1), dùng được nhưng không lý tưởng |
| **wc-1** | **1.2 × 5.10 m** | 6.1 m² | **Tỷ lệ ~4.25:1 — hình dạng "khe hẹp", KHÔNG hợp lý kiến trúc thực tế** |

**Defect thị giác/kiến trúc thật, nói rõ không né tránh:** WC 1.2m ×
5.1m là hệ quả trực tiếp của thuật toán "sequential bar" — dải cuối
cùng chia chiều rộng theo `areaWeight` nhưng giữ NGUYÊN chiều sâu của cả
dải cho mọi phòng trong đó, không xét tỷ lệ khung hình từng phòng. Đây
đúng là giới hạn Tech Lead đã nêu trước ("sequential bar algorithm must
not be treated as proof of architectural layout quality") — **không sửa
thuật toán ở Stage 1.5** (tránh vá tạm một thuật toán vốn đã được thừa
nhận là chưa chứng minh chất lượng kiến trúc), đề xuất xử lý cùng lúc
với việc có layout template tham chiếu thật ở Stage 2 (đã nêu ở
`20_...md` Phần E — rủi ro "template cần layout tham chiếu thật").

Các mục khác trong checklist:

- **Label chữ:** tính theo kích thước phòng nhỏ nhất (wc 1.2m=36px
  rộng) — nhãn "WC" (2 ký tự) vẫn vừa. Nhãn dài nhất ("Phòng ngủ 2", 11
  ký tự) trong bedroom-2 (72px rộng) — tính toán cho thấy khả năng vừa
  nhưng khá sát, chưa xác nhận bằng mắt thật.
- **Dimension line:** tính toán toạ độ cho thấy nhãn dimension của
  kitchen (ngay trên đường kitchen/living) và label diện tích của living
  cách nhau ~15px — không chồng nhưng khá gần, có thể trông hơi chật khi
  in nhỏ.
- **Wall phân biệt exterior/interior:** đã cải thiện chủ động trong lúc
  hardening — trước đó chỉ khác độ dày (3px/1.5px, cùng màu), giờ khác
  CẢ màu (đen đậm/xám) lẫn độ dày.
- **Cửa hiển thị:** có (SVG chứa `stroke-dasharray`, xác nhận qua POC).
  Chưa có ký hiệu vòng cung mở cửa (swingDirection — optional, chưa
  làm).
- **Title block/disclaimer:** có, nằm trong vùng +120px dưới bản vẽ,
  font 9-11px — kích thước hợp lý để đọc được trên màn hình, CHƯA xác
  nhận khi in giấy thật.
- **In ấn:** **rủi ro chưa xác minh được** — kích thước SVG hiện tại
  (~300×520px ở 30px/m) khá nhỏ về pixel tuyệt đối; in ra giấy A4 có thể
  hiển thị bản vẽ nhỏ, không chiếm hết trang. Chưa có cơ chế "fit to
  page" tường minh. Cần Founder tự in thử để xác nhận.

## Manual POC

`npm run poc:drawing` — nâng từ 13 lên **17 assertion** (thêm 4 check
Door): tất cả PASS.

## Files

- Mới: `apps/web/src/lib/drawing/door.ts`,
  `apps/web/scripts/generate-drawing-artifacts.ts`,
  `apps/web/demo-output/simple-house/*` (5 file + README).
- Sửa: `geometry.ts` (contract doc + `GEOMETRY_EPS`), `wall.ts` (guard
  + ID deterministic theo tên phòng), `geometryValidator.ts` (dùng
  `GEOMETRY_EPS` đúng chỗ + 6 rule Door), `drawingDocument.ts` (thêm
  `doors` vào `FloorPlanView`), `svgRenderer.ts` (vẽ cửa + phân biệt
  màu wall), `generateDrawing.ts` (nối `placeDoors`), `drawing-poc.ts`
  (4 assertion Door mới), `package.json` (`drawing:artifacts`).

## Verify

- `npx tsc --noEmit`: PASS.
- `npm run poc:drawing`: 17/17 PASS.
- `npm run poc:proposal`: 4/4 PASS (không ảnh hưởng).
- `npm run poc:constraint` (shared-types): 3/3 PASS.
- `npx next build`: PASS — route `/projects/[id]/design` compile được
  (28.8 kB, tăng nhẹ so với Stage 1 do thêm Door module). (Lần chạy đầu
  gặp EPERM thoáng qua trên Windows ghi `.next/trace` — không phải do
  dev server, đã xác nhận không có server nào chạy — chạy lại thành
  công ngay, không phải lỗi thật.)

## Next

Chờ Tech Lead visual review (mở `simple-house-floor-plan-print.html`
thật) trước khi bắt đầu Stage 2. Đề xuất Stage 2 cần giải quyết cùng
lúc: (1) tỷ lệ phòng WC/bedroom bất hợp lý ở thuật toán "sequential
bar", (2) layout tham chiếu thật cho nhà ống/villa, (3) 2 ngưỡng
Founder-input còn thiếu (sai số diện tích, elderly-proximity).
