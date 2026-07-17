# M3-002 — Design BOQ Draft Schema & Rule Catalog

**Ngày:** 2026-07-17
**Người thiết kế:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Trạng thái:** ĐỀ XUẤT THIẾT KẾ — đã cập nhật theo 1 vòng Founder Decision
(giữ section Kết cấu, xem mục 0). Còn 3 câu hỏi mở ở mục 9. **Không có dòng
code nào được viết.**
**Tiền đề:** `01_Analysis-M3-001-BOQ-Mapping-Engine.md` + Founder Decisions (M3-002)

> Theo đúng ticket: "Do not code." Tài liệu này chỉ là data contract + rule
> catalog để Founder/ChatGPT duyệt trước khi có task implementation riêng.

---

# 0. Đã nạp các quyết định của Founder

| Quyết định | Áp dụng vào thiết kế |
|---|---|
| MVP theo triết lý File 1 (đơn giá gộp nhà thầu tự quản lý) | Mục 6 — Price Book đơn giản, không có breakdown Vật liệu/Nhân công/Máy |
| "Draft 60-70%" = độ phủ hạng mục, KHÔNG phải độ chính xác số lượng/tiền | Mục 3/5 — ưu tiên có mặt đủ dòng hạng mục hơn là số chính xác |
| MVP target case: nhà ở, mái bằng, không hầm, đơn giá gộp | Mục 4 — Rule Catalog chỉ cover case này, case khác vào backlog |
| **[Cập nhật]** Giữ section "Kết cấu" — Module Estimate hướng tới nhà xây mới, móng luôn là 1 phần của BOQ. MVP KHÔNG estimate kết cấu — toàn bộ dòng là placeholder `needs_survey`. Nguyên tắc: "Không biết thì để trống. Không được suy đoán." | Mục 3, 3.1, 4 (Rule R8 viết lại), 5 — trả lời câu hỏi 1 ở mục 9 (bản gốc) |
| Không mở lại Requirement Data Model | Mục 1 — `EstimateSettings` là entity TÁCH RIÊNG, không sửa `Requirement` |

---

# 1. BOQ Draft Schema

## 1.1 Nguyên tắc thiết kế

Theo đúng mô hình đã dùng cho `Readiness` (Data Model v0.2): **derived-vs-persisted
tách bạch rõ ràng**. `BOQDraft` **CÓ lưu DB** (khác với Readiness) vì đây là
tài liệu chủ thầu chỉnh sửa tay và cần giữ qua session — không phải dữ liệu
tính lại mỗi lần như Score.

```
EstimateSettings   -- input riêng cho Module Estimate, KHÔNG trong Requirement
       +
Requirement        -- đã đóng băng, chỉ ĐỌC, không sửa
       │
       ▼
   Rule Engine  (mục 4)
       │
       ▼
   BOQDraft  ──┬── BOQSection[] ──┬── BOQDraftLine[]
               │                   │
       PriceBook (mục 6, tra unitPrice khi tạo dòng — không tra lại sau)
```

## 1.2 Entity: `EstimateSettings`

Tách hoàn toàn khỏi Requirement, theo đúng yêu cầu Founder. Gắn theo
`projectId`, 1-1 giống `Requirement`.

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `materialTier` | enum: `standard` \| `mid` \| `premium` | Phân khúc vật liệu — quyết định dòng `PriceBookEntry` nào được chọn khi cùng 1 `itemCode` có nhiều mức giá (đã nêu là field thiếu ở M3-001 mục 7) |
| `hasArchitecturalDrawing` | boolean | Có bản vẽ kiến trúc chưa — quyết định `quantitySource` mặc định là `rule_estimated` hay `needs_measurement` cho nhóm Kiến trúc/Hoàn thiện |
| `hasStructuralDrawing` | boolean | Tương tự, cho nhóm Kết cấu |
| `pricingRegion` | string | Vùng giá — để `PriceBook` lọc đúng bảng giá theo khu vực (Hà Nội, Hải Phòng...); KHÔNG phải `province`/`district` của Requirement (đó là địa điểm công trình, đây là vùng áp giá — có thể khác nhau, vd công trình ở tỉnh lẻ nhưng áp giá theo bảng giá Hà Nội) |
| `priceBookId` | string | Bảng giá nào đang dùng để tạo Draft này (1 nhà thầu có thể có nhiều bảng giá theo thời điểm) |

**Vì sao tách EstimateSettings thay vì thêm vào Requirement:** `materialTier`
không phải là "yêu cầu của khách hàng" (Requirement = khách muốn gì), mà là
"cấu hình tính toán của chủ thầu" (chủ thầu chọn phân khúc giá để báo) —
đúng ranh giới Requirement/Estimate mà Founder đã phân định trong quyết định
M3-002.

## 1.3 Entity: `BOQDraft`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | |
| `projectId` | UUID | 1 project có thể có nhiều BOQDraft theo thời gian (bản nháp lần 1, lần 2 sau khi sửa Requirement) — KHÔNG ghi đè như Requirement, vì chủ thầu cần so sánh lịch sử chỉnh sửa |
| `status` | enum: `draft` \| `confirmed` | `confirmed` = chủ thầu đã duyệt xong, sẵn sàng xuất Excel (xuất Excel là việc của ticket sau, ngoài phạm vi ở đây) |
| `generatedFromRequirementVersion` | timestamp | Ghi lại Requirement được cập nhật lúc nào khi tạo Draft — để cảnh báo "Requirement đã đổi sau khi tạo Draft này" |
| `coveragePercent` | number (derived, tính khi đọc, không lưu) | % hạng mục có mặt / tổng hạng mục kỳ vọng theo `constructionScope` — đúng định nghĩa "60-70%" mục 0 |
| `sections` | `BOQSection[]` | |
| `createdAt`/`updatedAt` | datetime | |

## 1.4 Entity: `BOQSection`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | |
| `boqDraftId` | UUID | |
| `code` | enum (mục 3): `construction` \| `finishing` \| `sanitary_equipment` \| `plumbing` \| `electrical` \| `air_conditioning` | |
| `order` | number | Thứ tự hiển thị |
| `lines` | `BOQDraftLine[]` | |

## 1.5 Entity: `BOQDraftLine` — theo đúng field ticket yêu cầu

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `code` | string | Mã dòng nội bộ (không phải mã định mức Nhà nước — MVP không dùng định mức) |
| `category` | string | Nhóm con trong Section (vd trong `finishing`: "Sơn nước", "Lát nền") — tự do hơn `section.code`, để nhóm hiển thị |
| `itemName` | string | Tên hạng mục, tiếng Việt, hiển thị cho chủ thầu |
| `unit` | string | m², m, cái, bộ, md... (theo đúng đơn vị File 1 dùng — không đổi sang đơn vị định mức Nhà nước) |
| `quantity` | number \| null | `null` khi `quantitySource = needs_measurement/needs_survey` — **KHÔNG bịa số 0**, phải phân biệt "chưa biết" và "bằng 0" |
| `unitPrice` | number \| null | Tra từ `PriceBook` lúc tạo dòng; `null` nếu không tìm thấy entry phù hợp trong bảng giá |
| `amount` | number \| null | `quantity × unitPrice`; `null` nếu 1 trong 2 vế null — KHÔNG tính bằng 0 |
| `quantitySource` | enum (mục 2) | |
| `confidence` | enum: `high` \| `medium` \| `low` \| `n/a` | `n/a` dùng cho `needs_measurement`/`needs_survey` (chưa có số thì không có độ tin cậy để nói) |
| `note` | string \| null | Vd "Ước lượng theo hệ số 0.9m² tường/m² sàn — cần đo lại khi có bản vẽ" |
| `editable` | boolean | Luôn `true` cho MVP — mọi dòng chủ thầu đều sửa được. Field này tồn tại để dành chỗ cho tương lai (dòng khoá không cho sửa), **không** dùng ngay |
| `sourceRuleId` | string \| null | Trỏ về rule nào trong Rule Catalog (mục 4) đã sinh ra dòng này — để truy vết khi Founder hỏi "sao lại ra số này" |

---

# 2. Quantity Source — vòng đời và hành vi chỉnh sửa

## 2.1 Bốn giá trị

| Giá trị | Ý nghĩa | Ai tạo ra |
|---|---|---|
| `rule_estimated` | Rule Engine ước lượng (mục 4) | Hệ thống, lúc tạo Draft |
| `needs_measurement` | Cần đo từ bản vẽ (kiến trúc/kết cấu đã có nhưng chưa đo) | Hệ thống, khi rule không cover được hạng mục này (mục 5) |
| `needs_survey` | Cần khảo sát thực địa (địa chất, hiện trạng...) — nặng hơn `needs_measurement`, vì đo bản vẽ chưa đủ, phải đi hiện trường | Hệ thống, cho nhóm Kết cấu móng khi `EstimateSettings.hasStructuralDrawing = false` |
| `user_confirmed` | Chủ thầu đã tự nhập/sửa số liệu | Chuyển từ 3 giá trị trên **khi chủ thầu chỉnh sửa `quantity`** |

## 2.2 Vòng đời (state machine, mô tả — không phải code)

```
Tạo Draft
   │
   ├─ Rule cover được?  ──Có──▶ rule_estimated  (quantity có số, confidence=medium/high)
   │
   └─ Rule không cover ──▶ hasArchitecturalDrawing/hasStructuralDrawing?
                                │
                                ├─ true  ──▶ needs_measurement (quantity=null, chờ chủ thầu đo & nhập)
                                │
                                └─ false ──▶ needs_survey        (quantity=null, chờ khảo sát)

Bất kỳ trạng thái nào, khi chủ thầu SỬA `quantity` tay:
   rule_estimated / needs_measurement / needs_survey  ──▶  user_confirmed  (KHÔNG quay lại được)
```

**Quy tắc quan trọng nhất:** `user_confirmed` là trạng thái **một chiều**.
Một khi chủ thầu đã tự tay xác nhận số liệu, hệ thống **không được tự ý ghi
đè lại** dù sau này Rule Engine thay đổi (vd do Requirement bị cập nhật).
Đây là nguyên tắc tương tự "không xoá dữ liệu người dùng đã xác nhận" đã áp
dụng ở Requirement Merge (05-Prompt-and-AI-Contract mục 6) — áp dụng lại ở
đây cho nhất quán.

## 2.3 Hành vi khi Requirement đổi sau khi đã tạo Draft

Ngoài phạm vi code, nhưng cần nêu rõ nguyên tắc thiết kế: nếu chủ thầu quay
lại Discovery Chat và Requirement thay đổi (vd thêm 1 phòng ngủ), Draft
**không tự động cập nhật**. `BOQDraft.generatedFromRequirementVersion` dùng
để hiển thị cảnh báo "Requirement đã thay đổi từ lúc tạo Draft này — cân
nhắc tạo Draft mới", nhưng KHÔNG tự sửa các dòng `user_confirmed`. Đây là
quyết định UX cần Founder/ChatGPT xác nhận ở bước implementation, tôi chỉ
nêu nguyên tắc.

---

# 3. MVP BOQ Sections

Dựa theo File 1 (đã duyệt triết lý) + **1 section bổ sung theo Founder
Decision** (Module Estimate hướng tới nhà xây mới, móng luôn là 1 phần của
BOQ dù MVP không estimate được):

| `section.code` | Tên hiển thị | Nguồn | Bao gồm khi nào |
|---|---|---|---|
| `structure` | Kết cấu (móng) | File 2 `Ket cau` — **chỉ để tham khảo danh mục hạng mục, KHÔNG dùng cách tính giá của File 2** | **Luôn có**, toàn bộ dòng placeholder (xem mục 3.2) |
| `construction` | Phần xây dựng thô | `XÂY DỰNG` (phần thô: tường xây, tôn nền, bê tông+thép, cán nền) | Luôn có, trừ `labor_only` (xem dưới) |
| `finishing` | Hoàn thiện | `XÂY DỰNG` (phần hoàn thiện: sơn, chống thấm, lát nền, trần, thang, cửa) | Luôn có |
| `sanitary_equipment` | Thiết bị vệ sinh + bếp | ` THIẾT BỊ` | Chỉ khi `constructionScope = turnkey_with_interior` (xem bảng dưới) |
| `plumbing` | Cấp thoát nước | `HẠNG MỤC NƯỚC` | Luôn có |
| `electrical` | Điện | ` HẠNG MỤC ĐIỆN` | Luôn có |
| `air_conditioning` | Điều hoà (phần ống/dây, chưa gồm máy) | `HẠNG MỤC ĐHKK` | Tuỳ chọn — hỏi thêm chủ thầu, không map field Requirement nào trực tiếp (đúng cách File 1 làm: "CHƯA BAO GỒM MÁY ĐIỀU HÒA") |

## 3.1 Bật/tắt section theo `constructionScope`

| `constructionScope` | structure | construction | finishing | sanitary_equipment | plumbing | electrical | air_conditioning |
|---|---|---|---|---|---|---|---|
| `labor_only` | Có (placeholder) | Có (chỉ dòng nhân công — nhưng Price Book MVP không tách nhân công/vật liệu, xem mục 6.3 hạn chế) | Có | Không | Có | Có | Không |
| `rough_and_finishing_labor` | Có (placeholder) | Có | Có | Không | Có | Có | Không |
| `turnkey` | Có (placeholder) | Có | Có | Không | Có | Có | Tuỳ chọn |
| `turnkey_with_interior` | Có (placeholder) | Có | Có | **Có** | Có | Có | Tuỳ chọn |

`structure` **luôn bật bất kể `constructionScope`** — móng là hạng mục bắt
buộc phải có mặt trong mọi công trình xây mới, không phụ thuộc chủ thầu báo
giá phần nào (kể cả `labor_only` vẫn cần biết khối lượng móng để tính công).

`sanitary_equipment` chỉ bật ở `turnkey_with_interior` vì đây là hạng mục
"nội thất/thiết bị" — đúng theo cách File 1 tách riêng "THIẾT BỊ VỆ SINH+BẾP"
khỏi phần xây dựng, và khớp với field `functional.kitchen`/`bathrooms` chỉ
thật sự cần thiết bị khi khách chọn gói có nội thất.

**Hạn chế đã biết (nêu rõ, không tự sửa):** MVP Price Book (mục 6) không
tách Vật liệu/Nhân công như File 2, nên `labor_only` với `construction` bật
"có" là **chưa chính xác về mặt khái niệm** — chủ thầu sẽ phải tự loại bỏ
phần vật liệu bằng tay. Đây là giới hạn được chấp nhận theo quyết định
"theo triết lý File 1", không phải lỗi thiết kế bỏ sót.

## 3.2 Section "Kết cấu" — nguyên tắc riêng theo Founder Decision

> "Không biết thì để trống. Không được suy đoán."

Khác với mọi section khác (có Rule Catalog cố gắng ước lượng), section
`structure`:

- **KHÔNG có rule nào tính số** — kể cả khi `EstimateSettings.hasStructuralDrawing = true`.
  MVP không cố gắng ước lượng kết cấu dù có bản vẽ hay không; đây là quyết
  định phạm vi (scope cut) rõ ràng, không phải giới hạn kỹ thuật.
- Toàn bộ dòng: `quantitySource = needs_survey`, `quantity = null`,
  `unitPrice` **có thể có** (tra Price Book theo tên hạng mục chuẩn, để
  chủ thầu chỉ cần điền `quantity` là ra `amount`), `amount = null` cho tới
  khi chủ thầu tự điền.
- Founder bổ sung số liệu **sau khi có khảo sát địa chất + bản vẽ kết cấu**
  — ngoài phạm vi Rule Engine, ngoài phạm vi MVP.
- Xem danh mục dòng cụ thể ở mục 5.1.

---

# 4. Rule Catalog

Mỗi rule ghi đủ 5 mục ticket yêu cầu. Xếp theo `confidence` giảm dần.

## Rule R1 — `bathrooms` → thiết bị vệ sinh

- **Input Requirement field:** `functional.bathrooms` (number)
- **Output BOQ line:** trong `sanitary_equipment`, sinh N bộ theo mẫu:
  xí, sen cây/vòi sen, lavabo, vòi xịt, giá treo khăn, giá lô giấy, thoát sàn
- **Calculation:** `quantity = bathrooms` cho mỗi loại thiết bị (1 bộ/WC)
- **Confidence:** `high` — đã kiểm chứng bằng dữ liệu thật (M3-001 mục 5:
  File 1 "Xí"=3, "Sen cây"=3 khớp đúng số WC)
- **Known limitations:** không phân biệt loại xí bệt/xổm, có bồn tắm hay
  không (đã nêu ở M3-001 mục 7 là field thiếu — MVP dùng 1 mẫu chuẩn mặc
  định, note rõ trong `itemName`)

## Rule R2 — `kitchen` → thiết bị bếp

- **Input:** `functional.kitchen` (boolean)
- **Output:** trong `sanitary_equipment`: chậu rửa ×1, vòi rửa ×1
- **Calculation:** `quantity = kitchen ? 1 : 0` — nếu `false` thì **không
  tạo dòng** (không phải tạo dòng quantity=0; xem nguyên tắc mục 5)
- **Confidence:** `high`
- **Known limitations:** không biết loại bếp (bếp đảo/chữ L/thẳng) ảnh
  hưởng số lượng tủ bếp — MVP chỉ ra thiết bị rời (chậu, vòi), không ra tủ bếp

## Rule R3 — `bedrooms` → cửa phòng ngủ

- **Input:** `functional.bedrooms` (number)
- **Output:** trong `finishing`, dòng "Cửa đi phòng ngủ" (kích thước chuẩn
  900×2100, theo mẫu File 1 `XÂY DỰNG!R184`)
- **Calculation:** `quantity = bedrooms`
- **Confidence:** `medium` — số lượng đáng tin, nhưng kích thước/vật liệu
  cửa là giả định (composite, không phải gỗ tự nhiên như File 2 chọn)
- **Known limitations:** không tính khoá cửa, phụ kiện riêng (File 1 có
  dòng "Khóa cửa" riêng — MVP gộp vào đơn giá cửa hoặc bỏ qua, cần Founder
  xác nhận cách xử lý khi implement)

## Rule R4 — `totalFloorArea` → ước lượng diện tích hoàn thiện

- **Input:** `site.totalFloorArea` (number, m²)
- **Output:** nhiều dòng trong `finishing`: lát nền, trát tường (gián tiếp
  qua diện tích tường, xem R5), sơn nước, cán nền
- **Calculation:**
  ```
  floorTileArea ≈ totalFloorArea × 0.9   (trừ hao diện tích tường/cầu thang)
  ```
- **Confidence:** `low` — hệ số 0.9 là kinh nghiệm chung, KHÔNG có trong 2
  file mẫu để đối chiếu trực tiếp (M3-001 chỉ suy luận, không kiểm chứng số
  liệu thật cho hệ số này — cần Founder xác nhận hoặc điều chỉnh hệ số theo
  kinh nghiệm thực tế của chủ thầu)
- **Known limitations:** không phân biệt loại gạch/khu vực (WC dùng gạch
  khác phòng khách) — MVP ra 1 dòng gộp, chủ thầu tự tách khi cần

## Rule R5 — `totalFloorArea` → ước lượng diện tích tường xây/trát/sơn

- **Input:** `site.totalFloorArea` (number)
- **Output:** dòng "Tường xây" + "Trát tường" + "Sơn nước" trong `construction`/`finishing`
- **Calculation:**
  ```
  wallArea ≈ totalFloorArea × 1.0   (hệ số kinh nghiệm, dao động 0.9-1.2)
  plasterArea = wallArea × 2         (trong + ngoài)
  paintArea ≈ plasterArea × 0.85     (trừ hao cửa/cửa sổ)
  ```
- **Confidence:** `low` — sai số cao nhất trong toàn bộ Rule Catalog, vì
  phụ thuộc mật độ tường ngăn phòng (nhà nhiều phòng nhỏ tường nhiều hơn nhà
  ít phòng lớn) mà Requirement hiện không có field nào phản ánh mật độ này
- **Known limitations:** đây là rule RỦI RO NHẤT — cần hiển thị `note` rõ
  ràng "Ước lượng thô, sai số có thể >30%, cần đo lại khi có bản vẽ" để
  chủ thầu không nhầm là số đáng tin

## Rule R6 — `floors` → ước lượng số bậc cầu thang

- **Input:** `building.floors` (number)
- **Output:** dòng "Bậc cầu thang" trong `finishing`
- **Calculation:** `quantity ≈ (floors - 1) × 18` (18 bậc/tầng, chiều cao
  tầng ~3.2m ÷ chiều cao bậc chuẩn ~17.8cm, theo M3-001 mục 5)
- **Confidence:** `low`
- **Known limitations:** không biết loại cầu thang (thẳng/chữ L/chữ U —
  field còn thiếu đã nêu ở M3-001 mục 7), số bậc thực tế lệch nhiều theo
  loại; MVP chỉ ra 1 dòng ước lượng, không tách chiếu nghỉ/lan can

## Rule R7 — `constructionScope` → bật/tắt section

- **Input:** `budget.constructionScope` (enum)
- **Output:** toàn bộ `BOQSection` có mặt trong Draft hay không (mục 3.1)
- **Calculation:** tra bảng mục 3.1, không phải phép tính số học
- **Confidence:** `n/a` (nhị phân có/không, không có khái niệm sai số —
  đúng như M3-001 mục 5 đã kết luận)
- **Known limitations:** không tách được nhân công/vật liệu cho `labor_only`
  (đã nêu ở mục 3.1)

## Rule R8 — `structure` section → luôn sinh placeholder, không tính số

> **[Đã chốt theo Founder Decision]** Giữ section "Kết cấu". Module Estimate
> hướng tới nhà xây mới, móng luôn là 1 phần của BOQ. MVP KHÔNG estimate kết
> cấu. "Không biết thì để trống. Không được suy đoán."

- **Input Requirement field:** không có — đây là rule KHÔNG đọc field nào
  của Requirement để tính số (khác mọi rule khác trong catalog này). Sự có
  mặt của section chỉ phụ thuộc `projectType` (chỉ áp dụng khi xây mới —
  cải tạo/nội thất thuần tuý không cần section này, xem `Known limitations`)
- **Output BOQ line:** toàn bộ dòng trong section `structure` (danh mục cụ
  thể ở mục 5.1), mỗi dòng:
  - `quantitySource = needs_survey`
  - `quantity = null`
  - `unitPrice`: tra Price Book nếu có entry khớp tên hạng mục (để chủ thầu
    đỡ phải tự tra khi điền số sau này), `null` nếu chưa có trong Price Book
  - `amount = null`
- **Calculation:** không có — rule này KHÔNG tính bất kỳ số nào, kể cả khi
  `EstimateSettings.hasStructuralDrawing = true`. Đây là quyết định phạm vi
  (scope cut) cố định cho MVP, không phải nhánh điều kiện trong state
  machine mục 2.2 — `structure` là **ngoại lệ duy nhất** không đi theo state
  machine chung (state machine mục 2.2 vẫn áp dụng cho các section khác).
- **Confidence:** `n/a` — không áp dụng khái niệm độ tin cậy cho dòng chưa
  có số
- **Known limitations:**
  - Nếu `projectType = renovation` hoặc `interior` (cải tạo/chỉ nội thất,
    không đụng móng), section `structure` **có thể không cần thiết** —
    MVP vẫn tạo section này mặc định để không bỏ sót trường hợp cải tạo có
    đụng kết cấu (nâng tầng...); chủ thầu tự bỏ qua nếu không áp dụng. Đây
    là lựa chọn "thà thừa còn hơn thiếu" nhất quán với nguyên tắc Founder.
  - Vẫn chưa có Ground Truth cho móng không phải móng cọc (M3-001 mục 8.2)
    — không ảnh hưởng thiết kế vì MVP không tính số cho section này, nhưng
    danh mục dòng ở mục 5.1 hiện chỉ tham khảo được cấu trúc móng cọc từ
    File 2 (chưa có ví dụ móng băng/đơn/bè để đối chiếu tên hạng mục).

---

# 5. Placeholder Catalog

## 5.1 Section "Kết cấu" — placeholder theo Founder Decision

Danh mục dòng, tham khảo tên hạng mục từ File 2 `Ket cau` (M3-001 mục 4.1)
— **chỉ mượn tên gọi, KHÔNG mượn cách tính/đơn giá định mức Nhà nước**:

| Hạng mục | Đơn vị (tham khảo) | `quantitySource` |
|---|---|---|
| Ép cọc bê tông cốt thép | m | `needs_survey` |
| Đào móng công trình | m³ | `needs_survey` |
| Bê tông lót móng | m³ | `needs_survey` |
| Bê tông móng | m³ | `needs_survey` |
| Cốt thép móng | tấn | `needs_survey` |
| Ván khuôn móng | m² | `needs_survey` |
| Xây tường móng | m³ | `needs_survey` |
| Giằng tường, dầm móng (bê tông + thép + ván khuôn) | m³/tấn/m² | `needs_survey` |
| Bể nước, bể phốt (nếu có) | m³ | `needs_survey` |

Tất cả: `quantity = null`, `amount = null`, `confidence = n/a`, `note` gợi ý
"Chờ khảo sát địa chất và bản vẽ kết cấu — Founder bổ sung thủ công."

## 5.2 Các nhóm placeholder khác (ngoài Kết cấu)

Các dòng **luôn được tạo** (để chủ thầu thấy đủ hạng mục — đúng tinh thần
"60-70% độ phủ") nhưng **không có số** vì Rule Engine không cover:

| Hạng mục | `quantitySource` | Vì sao |
|---|---|---|
| Diện tích tường (đo chính xác, không phải ước lượng R5) | `needs_measurement` | Cần bản vẽ mặt bằng chi tiết từng đoạn tường |
| Ván khuôn (coppha) — phần thân, không phải móng | `needs_measurement` | Suy từ hình học cấu kiện bê tông cụ thể |
| Dây điện (theo mét, theo tiết diện) | `needs_measurement` | Cần bản vẽ đi dây |
| Ống nước (theo mét, theo đường kính) | `needs_measurement` | Cần bản vẽ đi ống |
| Cốt thép sàn/dầm (phần thân, không phải móng) | `needs_measurement` | Cần bản vẽ kết cấu chi tiết phần thân |

Công tác móng (đào đất, ép cọc, bê tông móng, cốt thép móng...) đã liệt kê
riêng ở mục 5.1 — không lặp lại ở đây.

**Nguyên tắc hiển thị:** các dòng này xuất hiện trong đúng Section tương
ứng (không dồn vào 1 chỗ), `quantity = null`, `unitPrice` **vẫn có thể có**
(tra từ Price Book theo tên hạng mục chuẩn) để chủ thầu chỉ cần điền
`quantity` là ra `amount` ngay — giảm thao tác nhập tay.

---

# 6. Price Book Design

## 6.1 Entity: `PriceBook`

| Field | Kiểu |
|---|---|
| `id` | UUID |
| `name` | string (vd "Bảng giá 2026 - Khu vực Hà Nội") |
| `pricingRegion` | string |
| `effectiveFrom` | date |
| `entries` | `PriceBookEntry[]` |

## 6.2 Entity: `PriceBookEntry`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `itemCode` | string | Mã nội bộ, chủ thầu tự đặt (KHÔNG theo mã định mức Nhà nước) |
| `itemName` | string | |
| `unit` | string | |
| `materialTier` | enum: `standard` \| `mid` \| `premium` \| `all` | `all` = giá không phân biệt phân khúc (vd nhân công) |
| `unitPrice` | number | 1 SỐ DUY NHẤT — đúng triết lý File 1 (đơn giá gộp), KHÔNG tách Vật liệu/Nhân công/Máy như File 2 |
| `updatedAt` | datetime | |

## 6.3 Nguyên tắc & hạn chế (đúng "Không làm" của ticket)

- **Không scraping, không AI sinh giá, không tích hợp định mức Nhà nước** —
  `PriceBookEntry` hoàn toàn do chủ thầu nhập tay/import, giống cách File 1
  có các số cố định như "460,000đ/m² tường".
- **Tra giá xảy ra 1 LẦN** lúc Rule Engine tạo `BOQDraftLine` (ghi
  `unitPrice` cứng vào dòng). Nếu `PriceBook` sau đó đổi giá, các Draft cũ
  **không tự cập nhật** — nhất quán với nguyên tắc "Draft không tự đổi sau
  khi tạo" ở mục 2.3.
- **Không tìm thấy entry phù hợp** (vd chưa có giá cho "Cửa đi phòng ngủ"
  ở `materialTier=premium`): `unitPrice = null`, `amount = null`, KHÔNG
  dùng tạm giá của tier khác — tránh báo giá sai âm thầm.

---

# 7. MVP Boundary — xác nhận KHÔNG làm

Đúng theo ticket, các việc sau **không thuộc phạm vi thiết kế hay
implementation ở giai đoạn này**:

- Excel writer (xuất file)
- Prisma schema / migration
- UI (màn hình hiển thị/sửa BOQ Draft)
- AI Prompt (Rule Engine ở đây là code thuần, không gọi AI — đúng ticket
  M3-001 gốc: "Không yêu cầu AI tự tính khối lượng/giá")
- Tích hợp định mức/đơn giá Nhà nước
- Tính khối lượng kết cấu chi tiết (thép theo tấn, coppha theo m²...)
- Tự động tra giá từ Internet

---

# 8. Sơ đồ tổng — đúng Definition of Done

```
Requirement (đã đóng băng, chỉ đọc)
        +
EstimateSettings (materialTier, hasArchitecturalDrawing,
                  hasStructuralDrawing, pricingRegion, priceBookId)
        │
        ▼
   Rule Catalog (R1-R8, mục 4)  ──── tra ──── PriceBook (mục 6)
        │
        ▼
   Draft BOQ (BOQDraft → BOQSection → BOQDraftLine)
   Mỗi dòng có quantitySource: rule_estimated / needs_measurement /
   needs_survey — hiển thị rõ ràng, không trộn lẫn với số đáng tin
        │
        ▼
   Chủ thầu chỉnh sửa
   (sửa quantity → quantitySource chuyển user_confirmed, một chiều)
        │
        ▼
   [Tương lai — ngoài phạm vi task này]
   Xuất Excel
```

---

# 9. Câu hỏi cần Founder/ChatGPT xác nhận

1. ~~Mục 3 không có section "Kết cấu/Móng"~~ — **ĐÃ CHỐT bởi Founder
   Decision:** giữ section `structure`, toàn bộ placeholder `needs_survey`.
   Đã cập nhật mục 3, 3.1, 3.2, Rule R8, mục 5.1.
2. **Các hệ số kinh nghiệm ở Rule R4/R5/R6** (0.9, 1.0, 2, 0.85, 18 bậc/tầng)
   là tôi suy luận từ kiến thức chung, **không kiểm chứng được bằng 2 file
   mẫu** (vì cả 2 file đo trực tiếp, không dùng hệ số). Founder có hệ số
   kinh nghiệm thực tế nào chính xác hơn để thay vào không?
3. **Rule R2/R3 (khoá cửa, loại thiết bị vệ sinh)** — MVP có nên gộp phụ
   kiện nhỏ vào đơn giá chính, hay tạo dòng riêng (tăng độ phủ % nhưng tăng
   độ phức tạp Rule Catalog)?
4. **`BOQDraft` cho phép nhiều bản/project hay chỉ 1 bản mới nhất** — tôi
   đề xuất nhiều bản (giữ lịch sử) ở mục 1.3, cần xác nhận đây có đúng nhu
   cầu Founder không (khác với `Requirement`/`ProjectBrief` hiện tại là
   ghi đè 1 bản duy nhất).

---

# 10. Xác nhận phạm vi

- ✅ Chỉ thiết kế data contract + rule catalog theo đúng Output ticket yêu cầu.
- ✅ Không đụng Requirement Data Model đã đóng băng.
- ✅ Không viết code, không tạo file Excel/Prisma/UI/Prompt.
- **DỪNG LẠI Ở ĐÂY sau khi nộp đề xuất thiết kế.** Chờ Founder/ChatGPT duyệt
  trước khi có task implementation riêng.
