# STOP — Ticket 07 (Standard PriceBook Import): itemCode không tương thích với Rule Engine

**Ngày:** 2026-07-18
**Lý do dừng:** Stop Condition #3 trong ticket ("itemCode của Rule Engine không tương thích")

## Đã kiểm tra (read-only, chưa import gì vào DB)

**Dữ liệu `standard_pricebook_v1_80_items.json`:** 80 dòng, không trùng `itemCode`, không rỗng
`itemCode`/`itemName`/`unit`, `unitPrice` đều hợp lệ (>0), `tier` toàn bộ là `"standard"` — dữ
liệu bản thân nó SẠCH, không có lỗi validate.

**Vấn đề:** `resolveUnitPrice()` (`apps/web/src/lib/estimate/priceBook.ts`) chỉ tra giá bằng
**so khớp `itemCode` chính xác** (fallback duy nhất là `materialTier="all"`, không có tra theo
tên/category). Rule Engine hiện dùng 28 `itemCode` dạng namespace chấm — ví dụ
`structure.pile_driving`, `finishing.bedroom_door`, `sanitary.toilet`, `kitchen.sink`. Bộ giá
chuẩn dùng 80 `itemCode` dạng tiền tố_số — `PREP_001`, `FND_001`, `STR_001`, `SAN_001`...

**Đối chiếu trực tiếp 28 mã Rule Engine với 80 mã trong file: trùng khớp = 0/28.**

Nếu import nguyên trạng và chọn bảng giá này trong Estimate: **mọi dòng `unitPrice`/`amount`
sẽ ra `null`** — đúng ngược lại mục tiêu ticket ("Estimate sử dụng được bảng giá này... không
cần nhập tay bất kỳ dữ liệu nào").

## Không chỉ là đổi tên 1-1 (đã soi kỹ trước khi báo cáo)

- **Có mục tương ứng nhưng đơn vị khác:** `structure.footing_rebar` (Rule Engine chờ đơn vị
  "tấn") vs `FND_009` "Cốt thép móng..." (đơn vị "kg"). `finishing.stair_steps` (đơn vị "bậc")
  vs `STR_004` "Bê tông cầu thang M250" (đơn vị "m3" — đo cả khối bê tông, không phải số bậc).
- **1 mã Rule Engine ứng với nhiều dòng trong file (không rõ chọn dòng nào):**
  `construction.wall_masonry` (1 mã) vs `MAS_001`/`MAS_002` (tường 110 và 220, 2 giá khác nhau).
  Tương tự `finishing.plaster` vs `MAS_004/005/006`, `finishing.paint` vs `FIN_002/003`.
- **Không có mục tương ứng trong 80 dòng:** `kitchen.sink`, `kitchen.faucet`,
  `sanitary.floor_drain`, `sanitary.towel_rack` (không có category "Bếp", không có "thoát sàn"
  riêng — `SAN_006` gộp nhiều phụ kiện làm 1 dòng).

→ Đây là khác biệt **độ chi tiết catalog** (80 dòng chi tiết theo hạng mục thị trường thật) so
với **Rule Catalog** (28 mã gộp theo rule tính toán, đã duyệt ở M3-002) — không phải lỗi chính
tả itemCode có thể tự sửa.

## Cần Founder quyết định (chọn 1, hoặc nêu hướng khác)

1. **Import nguyên trạng làm bảng giá tham khảo/demo độc lập** — Founder biết trước: chọn bảng
   này trong Estimate hôm nay sẽ KHÔNG tự điền giá dòng nào cả (mọi dòng vẫn `unitPrice=null`),
   dùng để xem/tham khảo/tự đối chiếu tay, không đúng mục tiêu "Estimate dùng được ngay".
2. **Thêm lớp mapping riêng** (bảng alias: mã Rule Engine → itemCode trong bảng giá) — giữ
   nguyên 80 itemCode gốc, thêm mapping cho ~20/28 mã có tương ứng hợp lý; ~8 mã còn lại
   (kitchen.*, sanitary.floor_drain, sanitary.towel_rack, các mã lệch đơn vị) vẫn `null` cho
   tới khi bổ sung dữ liệu. Cần Founder duyệt từng cặp map (đây là quyết định nghiệp vụ, không
   phải kỹ thuật thuần).
3. **Đổi itemCode trong Rule Engine cho khớp bộ mã mới** — phạm vi rộng hơn (sửa
   `structurePlaceholders.ts`, `finishing.ts`, `sanitaryEquipment.ts`, `mepPlaceholders.ts`),
   và vẫn không giải quyết được các mã không có mục tương ứng (mục "Không có mục tương ứng" ở trên).

**Đề xuất của tôi (Claude):** phương án 2, nhưng chỉ làm sau khi Founder duyệt danh sách mapping
cụ thể — tránh tự quyết định "structure.tie_beam map vào dòng nào" mà không có xác nhận.

**Không làm gì thêm ở ticket này cho tới khi có quyết định** — không import DB, không sửa Rule
Engine, không tạo mapping. Dừng đúng theo Stop Condition #3.
