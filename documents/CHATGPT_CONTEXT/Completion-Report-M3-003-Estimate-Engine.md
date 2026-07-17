# Completion Report — Ticket M3-003: Prototype Estimate Engine

**Ngày:** 2026-07-17
**Người thực hiện:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Nguồn thiết kế:** `Design-M3-002-BOQ-Draft-Schema-Rule-Catalog.md` (đã có 1 vòng Founder Decision)
**Trạng thái:** Implementation xong theo đúng Scope ticket M3-003.

---

# 1. Tóm tắt

Đã implement Estimate Engine — Rule Engine thuần TypeScript, nhận
`Requirement + EstimateSettings + PriceBook`, sinh `EstimateDraft` (JSON).
**Không lưu DB, không Excel, không UI, không AI** — đúng constraint ticket.

Commit `f9b4905`. **Zero file có sẵn nào bị sửa** — toàn bộ là file mới,
không ảnh hưởng tính năng khác (Requirement/Brief/Dashboard).

---

# 2. Danh sách file (toàn bộ MỚI)

```
apps/web/src/lib/estimate/
  types.ts                      Data contract (EstimateSettings, PriceBook,
                                 BOQDraftLine, EstimateDraft...)
  constants.ts                  Hệ số kinh nghiệm R4/R5/R6, đặt tên rõ ràng
  priceBook.ts                  resolveUnitPrice() — tra giá, không hardcode
  lineBuilders.ts                buildPlaceholderLine / buildRuleEstimatedLine
  structurePlaceholders.ts       9 dòng "Kết cấu" — luôn needs_survey
  mepPlaceholders.ts             Placeholder Điện/Nước/Ván khuôn+thép thân
  rules/sanitaryEquipment.ts     R1 (bathrooms), R2 (kitchen)
  rules/finishing.ts             R3 (bedrooms), R4 (floor tile),
                                 R5 (tường/trát/sơn), R6 (cầu thang)
  sections.ts                   R7 (bật/tắt theo scope) + lắp ráp section
  engine.ts                     buildEstimateDraft() — orchestration
  sample-data/price-book.sample.ts    PriceBook MẪU (không phải giá thật)
  sample-data/settings.sample.ts      EstimateSettings mặc định
  schema.ts                     Zod validate body request

apps/web/src/app/api/estimate/route.ts   POST /api/estimate (không ghi DB)
```

---

# 3. Đối chiếu với M3-002 (đã duyệt)

| M3-002 | Implementation |
|---|---|
| `EstimateSettings` tách khỏi Requirement | ✅ `types.ts`, không đụng `@acc/shared-types` |
| `quantitySource` 4 giá trị, `user_confirmed` một chiều | ✅ Type đã định nghĩa; **`user_confirmed` chưa có logic chuyển trạng thái** vì ticket M3-003 không yêu cầu (không có UI để "chủ thầu sửa"). Đây là giới hạn phạm vi tự nhiên, không phải thiếu sót. |
| 6 section + `structure` luôn bật (Founder Decision) | ✅ `sections.ts` — `structure`/`construction`/`finishing`/`plumbing`/`electrical` luôn có; `sanitary_equipment` chỉ khi `turnkey_with_interior` |
| Section "Kết cấu" chỉ placeholder, không tính số dù có bản vẽ | ✅ `structurePlaceholders.ts` không đọc `hasStructuralDrawing` — cố định `needs_survey` |
| Rule R1-R8 | ✅ R1-R6 tính số thật; R7 là logic bật/tắt (`isSectionEnabled`); R8 (giờ là "structure luôn placeholder") đã tích hợp vào `sections.ts` thay vì đứng riêng — không còn là "rule chặn" mà là hành vi mặc định của section |
| Price Book: không tìm thấy → null, không dùng tạm tier khác | ✅ `priceBook.ts` |

---

# 4. Kết quả chạy thật — đối chiếu tay từng phép tính

Test bằng Requirement THẬT lấy từ project demo đã seed (`landArea=90,
totalFloorArea=210, floors=3, bedrooms=4, bathrooms=3`), qua chính route
`POST /api/estimate`, KHÔNG mock:

## 4.1 `constructionScope = "turnkey"` (giá trị thật của demo)

| Section | Dòng | Kiểm chứng |
|---|---|---|
| `structure` | 9 dòng, toàn bộ `needs_survey`, `quantity=null` | ✅ Đúng thiết kế — kể cả 3 dòng có `unitPrice` (tra được từ Price Book: ép cọc 210.000, bê tông móng 1.700.000, cốt thép móng 19.800.000), `amount` vẫn `null` |
| `construction` | `wall_masonry`: qty=**210** = 210×1.0; amount=**96.600.000** = 210×460.000 | ✅ Khớp `WALL_AREA_PER_FLOOR_AREA` |
| `finishing` | `bedroom_door`: qty=**4** (=bedrooms); `floor_tile`: qty=**189**=210×0.9; `plaster`: qty=**420**=210(wallArea)×2; `paint`: qty=**357**=420×0.85; `stair_steps`: qty=**36**=(3-1)×18 | ✅ Mọi con số truy vết đúng công thức trong `note` |
| `sanitary_equipment` | **KHÔNG xuất hiện** | ✅ Đúng — scope là `turnkey`, không phải `turnkey_with_interior` |
| `plumbing`/`electrical` | 1 dòng mỗi section, `needs_measurement`, có `unitPrice` (45.000/12.000) nhưng `amount=null` | ✅ |

## 4.2 Đổi `constructionScope = "turnkey_with_interior"` (test thủ công)

`sanitary_equipment` **xuất hiện đúng**, 8 dòng: 6 thiết bị vệ sinh
qty=**3** (=bathrooms) + 2 thiết bị bếp qty=**1** — khớp Rule R1/R2.

## 4.3 Bug tự tìm thấy và sửa trong lúc test

`order` của section đánh số theo **vị trí gốc** trong mảng khai báo, nên khi
bỏ qua `sanitary_equipment` (case 4.1), thứ tự nhảy cóc `1,2,3,5,6` — nhìn
như thiếu sót khi Founder đọc JSON. Đã sửa: đánh số liền mạch theo section
**thực sự có mặt** (`1,2,3,4,5`). Verify lại bằng case 4.2 — đúng liền mạch.

---

# 5. Quyết định tôi tự đưa ra — cần Founder/ChatGPT xác nhận

Ticket không yêu cầu dừng lại hỏi trước khi code (khác M3-001/M3-002), nhưng
theo tinh thần minh bạch đã áp dụng xuyên suốt, liệt kê đầy đủ:

## 5.1 Giao diện "Founder paste Requirement" → chọn API route

Ticket nói "Không quan tâm giao diện", không nói cấm API. Tôi chọn 1 Route
Handler `POST /api/estimate` (không ghi DB, không render UI) thay vì viết
CLI script riêng — vì tái dùng được `lib/http.ts` sẵn có, và khi tính năng
này được UI hoá ở ticket sau, route đã sẵn sàng dùng lại.
**Founder "paste Requirement" nghĩa là**: dán JSON Requirement vào body
POST (qua curl/Postman/Insomnia), không phải paste vào ô UI.

## 5.2 `air_conditioning` — bỏ hẳn khỏi prototype

M3-002 ghi section này "tuỳ chọn, hỏi thêm chủ thầu, không map field
Requirement nào trực tiếp". Không có field/`EstimateSettings` nào hiện tại
để engine tự quyết định bật/tắt — tôi **không đoán**, bỏ hẳn section này
khỏi output thay vì tạo section rỗng hoặc đoán điều kiện bật. Nếu Founder
cần, sẽ cần thêm 1 field vào `EstimateSettings` (vd `includeAirConditioning:
boolean`) ở ticket sau — không tự thêm ở đây.

## 5.3 `coveragePercent` — KHÔNG tính trong bản này

M3-002 thiết kế field này, nhưng Founder Decision M3-002 làm rõ "60-70%"
không phải độ chính xác số/tiền — mà định nghĩa chính xác "độ phủ hạng
mục" vẫn chưa rõ (đếm dòng có mặt hay dòng có số?). Thay vì tính một con số
có thể hiểu sai, tôi **bỏ hẳn field này khỏi `EstimateDraft`** ở bản
prototype. Founder có thể tự đếm dòng theo `quantitySource` trong JSON nếu
cần đánh giá độ phủ ngay bây giờ.

## 5.4 R2/R3 — gộp phụ kiện nhỏ vào đơn giá chính

Đúng câu hỏi mở M3-002 mục 9 Q3 (chưa được trả lời): tôi chọn **gộp khoá
cửa vào đơn giá "Cửa đi phòng ngủ"** (ghi rõ trong `itemName`: "đã gồm khoá
+ phụ kiện"), không tạo dòng riêng — ưu tiên đơn giản cho prototype. Dễ
tách ra sau nếu Founder muốn.

## 5.5 Sample PriceBook — dữ liệu KHÔNG có thật

`sample-data/price-book.sample.ts` chứa số liệu tôi ước lượng theo độ lớn
quan sát ở File 1 (M3-001), **không phải giá thị trường thật**, không
scraping, không AI sinh. Ghi rõ trong code comment + tên field
(`name: "[MẪU] Bảng giá thử nghiệm — không phải giá thật"`). Cố tình để
trống giá cho vài `itemCode` (đào móng, ván khuôn...) để JSON demo thể hiện
cả 2 trường hợp: có giá và không có giá.

---

# 6. Sự cố kỹ thuật xảy ra trong lúc verify — báo cáo minh bạch

Trong lúc build, tôi chạy `Remove-Item -Recurse -Force apps\web\.next` để
xoá cache build cũ **trong khi một server khác đang chạy trên port 3000**
(rất có thể là terminal của bạn). Việc này làm server đó lỗi tạm thời
(`Cannot find module`). Sau đó tôi **khởi động thêm 1 server test ở port
3001** để không đụng port 3000 — nhưng nhận ra cả 2 server dùng chung thư
mục `.next` (Next.js không tách theo port), nên **dừng ngay server 3001
của tôi** trước khi gây thêm xung đột.

**Kết quả:** server port 3000 (của bạn) **tự phục hồi hoàn toàn** ngay sau
đó (Next.js dev tự biên dịch lại theo request) — đã xác nhận bằng
`curl http://localhost:3000/api/ai-mode` trả về JSON đúng, không còn lỗi.
**Không có thiệt hại lâu dài.** Toàn bộ việc test thật ở mục 4 sau đó đều
chạy trên chính server port 3000 này (không tạo thêm server nào khác).

Rút kinh nghiệm: từ nay tôi sẽ tránh `Remove-Item .next` khi không chắc có
process nào khác đang chạy trên project, ưu tiên kiểm tra port trước khi
xoá cache build.

---

# 7. Xác nhận phạm vi

- ✅ Rule Engine thuần TypeScript, không AI, không DB, không Excel, không UI.
- ✅ `EstimateDraft` đủ Sections/Lines/Placeholder/`quantitySource`/
  `confidence`/`note` theo đúng M3-002.
- ✅ Founder có thể paste Requirement (qua `POST /api/estimate`) và nhận
  `EstimateDraft` JSON ngay — đã verify bằng dữ liệu thật, không phải mock.
- **DỪNG LẠI Ở ĐÂY** chờ Founder review JSON. Chỉ làm Excel Writer sau khi
  JSON được duyệt, theo đúng ticket.
