# Completion Report — Concept Drawing Stage 2B (Townhouse Program Completeness and Layout Quality)

Ngày: 2026-07-20. Trạng thái: đề nghị Tech Lead mở
`townhouse-floor-plan-print.html` để xác nhận cuối cùng bằng mắt — báo
cáo này khắc phục toàn bộ 10 "Proven Issues" đã nêu, có số liệu thật
đối chiếu từng mục.

## 1. Đối chiếu 10 Proven Issues — Trước / Sau

```
1. Thiếu phòng thờ (worshipRoom)          -> ĐÃ CÓ, phân bổ tầng trên cùng (Task 1)
2. Ban công yêu cầu không có hình học      -> ĐÃ CÓ, tầng trên cùng, viền nét đứt (Task 2)
3. Cầu thang 5m x 3m = 15m²/tầng           -> 2.0m x 4.0m = 8m²/tầng (Task 5)
4. WC 9.0-10.4m²                          -> 6.4m² (WC 1/2/3, đều nhau)
5. Circulation tầng trên 13.0m²           -> 12.0m² (giảm nhẹ, do usableDepth đổi theo Task 5)
6. Phòng ngủ phình to 20.8m²              -> 18.0m² (tầng 1) / 13.71m² (tầng 2, do có thêm phòng thờ+ban công)
7. bedroom-3/4 hiển thị sai số ("Phòng ngủ"/"Phòng ngủ 2") -> "Phòng ngủ 3"/"Phòng ngủ 4" (Task 6)
8. Dimension tổng/dimension từng phòng đè nhau -> tách 2 lane cách nhau ~19px (Task 7)
9. Mũi tên cầu thang đè lên nhãn/diện tích -> nhãn lệch trục mũi tên (Task 7)
10. Icon cảnh báo ⚠ phụ thuộc font hệ thống -> thay bằng text "CẢNH BÁO:" (Task 7)
```

Tất cả đã xác minh bằng SỐ LIỆU THẬT từ artifact vừa sinh (không chỉ khẳng định), xem mục 2-6.

## 2. Room Program hoàn chỉnh (Task 1) — Kết quả thật

`roomProgramNormalizer.ts` (mới) nhận diện "phòng thờ ông bà" (otherRooms,
text tự do) → `worshipRoom` chính thức, KHÔNG sửa Requirement/ConstraintSet
(đã đóng băng) — chuẩn hoá ngay tại ranh giới Drawing/Floor Allocation.
`floorAllocation.ts` đặt `worshipRoom` + `balcony` (nếu có) vào TẦNG TRÊN
CÙNG.

Kết quả: `worship-1` (Phòng thờ 1) xuất hiện đúng 1 lần, tầng 2. Warning
"Chưa hỗ trợ đặt vị trí cho phòng tự do: phòng thờ ông bà" (Stage 2A) đã
biến mất — không còn báo sai cho phòng ĐÃ được xử lý. "phòng đọc sách"
(excludedRooms) vẫn bị loại trừ hoàn toàn (không xuất hiện như 1 phòng,
chỉ còn ghi nhận trong warnings).

## 3. Ban công (Task 2) — Kết quả thật

`balcony-1` (Ban công 1): 4.00m x 1.03m = 4.11m², tầng 2, viền nét đứt
màu xanh (`stroke-dasharray="4,2"`, phân biệt trực quan với phòng nội
thất) — mô hình "inset" (lõm vào trong footprint), đúng theo cho phép
của Task 2 ("an inset front balcony inside the footprint is acceptable").
Kết nối qua circulation (cùng cơ chế hub circulation đã có từ Stage 1.7).
KHÔNG tính công-xôn/kết cấu (ghi rõ trong assumptions).

## 4. Area Targets và Hard Maximums (Task 3) — Bug thật đã sửa

`roomConstraints.ts` thêm `preferredAreaMin/Max`/`hardAreaMax` cho mọi
loại phòng (living/kitchen/bedroom/wc/worshipRoom/balcony). Nhưng CHỈ
thêm validation là chưa đủ — vì vậy `geometry.ts` được viết lại để chủ
động GIỚI HẠN kích thước khi đặt hình (không chỉ validate sau khi đã lỡ
đặt to): `capDepthsWithResidual()` giới hạn chiều sâu mỗi phòng theo
`preferredAreaMax`, không bao giờ vượt chiều sâu lý tưởng theo
areaWeight (chỉ co lại). Phần dư trả về thành residual (Task 4).

**2 bug thật phát hiện trong lúc làm capping**:
- Cap theo diện tích thuần tuý có thể ép tỷ lệ khung hình vượt ngưỡng
  cứng (WC ở cột rộng 4m, cap diện tích ra chiều sâu 1.5m → tỷ lệ
  2.67:1, vượt hard 2.5:1). Sửa: thêm sàn `minDepthForAspect =
  width/hardAspectRatioMax`, không bao giờ cap thấp hơn mức này.
- Thêm phòng thờ+ban công đẩy số phòng "rest" từ 3 lên 5 trên CÙNG tầng
  trên cùng, kích hoạt nhánh chia 2 cột cũ (ngưỡng `rest.length>=4`) —
  colWidth lúc đó (2.0m) nhỏ hơn minWidth phòng ngủ (2.4m), gãy cứng
  ("bedroom-3/4 rộng 2.00m — nhỏ hơn tối thiểu 2.4m"). Sửa: chỉ chia 2
  cột khi CẢ `rest.length>=4` VÀ `colWidth` đủ cho `minWidth` lớn nhất
  trong số phòng sẽ vào cột — nếu không, xếp 1 cột duy nhất bất kể số
  lượng.

## 5. Residual Space tường minh (Task 4) — Kết quả thật

```
Tầng trệt: "Không gian chưa phân bổ" x2 — 1.88m² (cạnh WC) + 12.00m² (cạnh cầu thang)
Tầng 1:    "Không gian chưa phân bổ" x2 — 5.60m² (cạnh WC) + 12.00m² (cạnh cầu thang)
Tầng 2:    "Không gian chưa phân bổ" x1 — 12.00m² (cạnh cầu thang)
```

Mỗi residual có `type: "residual"`, hình chữ nhật thật, KHÔNG tính vào
số phòng ngủ/WC bắt buộc (xác nhận qua `poc:townhouse` assertion 13),
và mỗi sheet có residual sẽ có assumption riêng nhắc "cần khách hàng/
kiến trúc sư xác nhận công năng, KHÔNG tự ý gán cho 1 phòng nào". 12m²
cạnh cầu thang khá lớn (do STAIRCASE_WIDTH=2.0m hẹp hơn nhiều so với
mặt tiền 5m) — đã ghi rõ đây là hệ quả trực tiếp, trung thực của việc
thu nhỏ cầu thang về kích thước thực tế (Task 5), không phải lỗi.

## 6. Stair Core thực tế (Task 5) — Kết quả thật

```json
{
  "id": "staircase",
  "polygon": [{"x":3,"y":12},{"x":5,"y":12},{"x":5,"y":16},{"x":3,"y":16}],
  "levels": [0, 1, 2],
  "width": 2,
  "direction": "vertical"
}
```

Rộng 2.0m (trong khoảng 1.8-2.4m), diện tích 8.0m² (trong khoảng 6-10m²),
VẪN thẳng hàng tuyệt đối trên cả 3 tầng (polygon giống hệt, xác nhận lại
bởi `validateVerticalConnections`) — vị trí vẫn tính THUẦN theo envelope
(góc phải-sau, không phụ thuộc phòng khác), chỉ đổi CÔNG THỨC kích thước
(`STAIRCASE_WIDTH=2.0`, `STAIRCASE_DEPTH=4.0`), giữ nguyên cơ chế đảm bảo
thẳng hàng đã được Stage 2A chấp nhận.

## 7. Nhãn phòng toàn nhà (Task 6) — Kết quả thật

```
Tầng trệt: Phòng khách, Bếp, WC 1
Tầng 1:    Phòng ngủ 1, Phòng ngủ 2, WC 2
Tầng 2:    Phòng ngủ 3, Phòng ngủ 4, WC 3, Phòng thờ 1, Ban công 1
```

Sửa bằng cách lấy số thứ tự TỪ CHÍNH id phòng (vd "bedroom-3" → số 3,
id đã global-unique từ `floorAllocation.ts`), thay vì bộ đếm reset mỗi
tầng như trước. Hạ tầng dùng chung (circulation/staircase/residual/
entrance) không đánh số — đúng yêu cầu Task 6.

## 8. Chú thích bản vẽ (Task 7) — Kết quả thật

- **Dimension lane**: overall-width dimension ("5 m") tại y=84; dimension
  từng phòng ("4.0 m"/"1.0 m") tại y=103 — cách nhau 19px (trước ~2px,
  chồng lấn). `DIM_TOP` tăng 28→44 để chừa đủ 2 lane.
- **Nhãn cầu thang**: lệch trục mũi tên — mũi tên tại x=369.31 (chính
  giữa phòng), nhãn "Cầu thang"/diện tích tại x=350.34 (lệch trái ~19px,
  đo trực tiếp từ SVG thật) — không còn đè lên đường mũi tên.
- **Warning marker**: thay `⚠` bằng text "CẢNH BÁO:" — xác nhận SVG
  sinh ra hoàn toàn KHÔNG còn ký tự `⚠` (assertion 15/32 của
  `poc:townhouse`).

## 9. Warnings/assumptions theo đúng phạm vi sheet (Task 8)

`warningsForFloor()` (mới, `drawingDocument.ts`) lọc theo tiền tố
`[Tầng N]` (đã có sẵn từ Stage 2A cho lỗi geometry validation, mở rộng
thêm cho door/window warnings) — cảnh báo tầng nào chỉ hiện đúng sheet
đó; cảnh báo KHÔNG gắn tầng (heuristic phân bổ tầng...) coi là toàn nhà,
hiện mọi sheet. Assumption về phòng thờ/ban công/residual chỉ thêm vào
sheet THỰC SỰ có phòng đó (kiểm tra qua `floorPlan.rooms`), không lặp
lại ở mọi sheet như Stage 2A.

## 10. Validation Guard + Assertion mới (Task 9)

`geometryValidator.ts` thêm `assertSingleFloorScope()` — throw NGAY nếu
lỡ truyền LayoutGraph gộp nhiều tầng, hoặc Geometry nhiều tầng khi
`checkAggregateCounts=false` — đóng đúng lỗ hổng đã tự ghi nhận ở
Completion Report Stage 2A ("chưa có guard tường minh chặn việc gọi sai
ở tương lai").

## 11. Kết quả kiểm thử

```
npx tsc --noEmit        -> PASS (0 lỗi)
npm run poc:proposal    -> 4/4 PASS
npm run poc:drawing     -> 26/26 PASS (simple-house, Stage 1.7 regression — không đổi)
npm run poc:townhouse   -> 32/32 PASS (19 cũ Stage 2A + 13 mới Stage 2B — xem danh sách dưới)
npx next build          -> PASS (route /projects/[id]/design build thành công, 37.8 kB)
```

13 assertion mới của `poc:townhouse` (Stage 2B): phòng thờ phân bổ đúng
1 lần, ban công phân bổ đúng 1 lần, phòng đọc sách không xuất hiện như
1 phòng (nhưng vẫn ghi nhận loại trừ trong warnings), không WC/phòng
ngủ nào vượt hardAreaMax, StaircaseCore đúng khoảng rộng (1.8-2.4m) và
diện tích (6-10m²), có residual space tường minh (không silent-absorb),
residual không tính vào số phòng bắt buộc, nhãn phòng ngủ đúng thứ tự
toàn nhà, warnings không dùng ký hiệu Unicode không nhất quán.

**Lưu ý trung thực**: `simple-house` giờ có thêm 3 warning MỚI (diện
tích phòng khách/bếp/phòng ngủ-2 dưới mức preferredAreaMin — 17.14m² <
18m², 8.93m² < 10m²/9m²) — đây là hệ quả TỰ NHIÊN của việc thêm ràng
buộc diện tích tối thiểu (Task 3) áp dụng chung cho mọi fixture; lô đất
`simple-house` (6m x 10m, nhỏ hơn townhouse) vốn dĩ cho phòng nhỏ hơn
mức "lý tưởng" đã đặt cho bản demo townhouse — vẫn chỉ là warning, không
chặn, và validation vẫn PASS 26/26 như trước.

## 12. File đính kèm

`apps/web/demo-output/townhouse/`: `README.md`,
`townhouse-layout-graphs.json`, `townhouse-geometry.json`,
`townhouse-drawing-package.json`, `townhouse-staircase-core.json` (mục
6), `townhouse-floor-plan-0/1/2.svg`, `townhouse-floor-plan-print.html`
(3 trang, page-break-after), `townhouse-artifacts.zip`.

`apps/web/demo-output/simple-house/` (regression, không đổi cấu trúc):
tương tự, `simple-house-artifacts.zip`.

### Phụ lục — Bảng phòng đầy đủ (townhouse, số liệu thật)

```
TẦNG TRỆT:
  Phòng khách              5.00m x 5.79m  = 28.97m²
  Bếp                      4.00m x 4.14m  = 16.55m²
  WC 1                     4.00m x 1.60m  =  6.40m²
  Không gian chưa phân bổ  4.00m x 0.47m  =  1.88m²
  Sảnh / Hành lang         1.00m x 6.21m  =  6.21m²
  Cầu thang                2.00m x 4.00m  =  8.00m²
  Không gian chưa phân bổ  3.00m x 4.00m  = 12.00m²

TẦNG 1:
  Phòng ngủ 1              4.00m x 4.50m  = 18.00m²
  Phòng ngủ 2              4.00m x 4.50m  = 18.00m²
  WC 2                     4.00m x 1.60m  =  6.40m²
  Không gian chưa phân bổ  4.00m x 1.40m  =  5.60m²
  Sảnh / Hành lang         1.00m x 12.00m = 12.00m²
  Cầu thang                2.00m x 4.00m  =  8.00m²
  Không gian chưa phân bổ  3.00m x 4.00m  = 12.00m²

TẦNG 2 (Tầng trên cùng):
  Phòng ngủ 3              4.00m x 3.43m  = 13.71m²
  Phòng ngủ 4              4.00m x 3.43m  = 13.71m²
  WC 3                     4.00m x 1.60m  =  6.40m²
  Phòng thờ 1              4.00m x 2.40m  =  9.60m²
  Ban công 1               4.00m x 1.03m  =  4.11m²
  Sảnh / Hành lang         1.00m x 12.00m = 12.00m²
  Cầu thang                2.00m x 4.00m  =  8.00m²
  Không gian chưa phân bổ  3.00m x 4.00m  = 12.00m²
```

## 13. Giới hạn còn lại / chưa xử lý

- **Chưa xác nhận thị giác thật** (không có browser trong môi trường
  này) — đã bù bằng số liệu SVG thật (toạ độ, khoảng cách lane, offset
  nhãn — xem mục 8) đo trực tiếp từ file sinh ra. Đề nghị Tech Lead mở
  `townhouse-floor-plan-print.html` bằng trình duyệt thật để xác nhận
  cuối cùng.
- **Circulation tầng trên vẫn khá lớn (12m²)** — Task 3's danh sách mặc
  định KHÔNG có ràng buộc diện tích cho circulation (chỉ living/kitchen/
  bedroom/wc/worshipRoom) nên không áp dụng capping cho nó; đây là hệ
  quả của thiết kế "hành lang chạy suốt chiều sâu dải" đã được Stage 1.7
  chấp nhận và đóng băng — chưa đổi trong Stage 2B vì không nằm trong 10
  task được giao.
- **Residual cạnh cầu thang lớn (12m²/tầng)** — hệ quả trung thực của
  việc thu nhỏ cầu thang xuống 2.0m (thực tế) trên mặt tiền 5m; nếu
  Founder muốn giảm residual này, có thể cân nhắc dùng phần diện tích đó
  cho 1 phòng phụ (kho, WC phụ) ở stage sau — hiện tại CHỦ ĐỘNG không tự
  gán công năng (đúng Task 4).
- **Vị trí cầu thang/circulation giả định luôn ở cạnh PHẢI** — công thức
  `geometry.ts` đặt circulation + staircase ở cùng 1 phía (bên phải) khi
  dùng bố cục 1 cột; nếu 1 fixture tương lai buộc phải dùng nhánh chia 2
  cột (circulation ở GIỮA), cầu thang góc phải sẽ không còn liền kề
  circulation — chưa xảy ra ở 2 fixture hiện có (luôn dùng 1 cột) nhưng
  là 1 giả định ngầm cần lưu ý nếu mở rộng fixture sau này.
