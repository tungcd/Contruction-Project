# Data Model Review — trước khi đóng băng

**Ngày:** 2026-07-16
**Người review:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Trạng thái:** ĐỀ XUẤT — chờ phê duyệt. **Chưa implement bất kỳ thay đổi nào.**
**Nguồn:** `chatgpt-report-1.md` Action Item 1, 2, 3, 6

---

# 0. Cách tôi review

Tiêu chí đánh giá mỗi field: **nó có sống sót qua chuỗi này không?**

```
Requirement → BOQ → Pricing → Proposal → Contract
```

Một field "chạy được" ở Discovery nhưng làm QS phải hỏi lại ở BOQ = field hỏng.

Tôi chia đề xuất theo 3 mức:

| Mức | Ý nghĩa |
|---|---|
| **P0** | Nên sửa TRƯỚC khi đóng băng. Sửa sau sẽ phải migrate dữ liệu thật. |
| **P1** | Nên sửa, nhưng sống được nếu hoãn. |
| **P2** | Ghi nhận, để sau MVP. |

**Không có mục nào trong tài liệu này đã được implement.**

---

# 1. ACTION ITEM 1 — Budget Range

## Problem

Hiện tại `budget: number | null` — một con số duy nhất.
Khách nói "2,5 đến 3 tỷ" → hệ thống lưu `2.75 tỷ`.

## Why — Founder đúng, và vấn đề nặng hơn "làm tròn"

Số `2.75 tỷ` **chưa từng tồn tại trong đầu khách hàng**. Nó là số do hệ thống bịa ra.

Hệ quả thật ở các bước sau:

| Bước | Với `2.75 tỷ` (bịa) | Với `[2.5 , 3.0]` (thật) |
|---|---|---|
| BOQ ra 2.9 tỷ | "Vượt ngân sách 150tr" → **sai, thực ra vẫn nằm trong khoảng khách chấp nhận** | "Nằm trong khoảng" → đúng |
| BOQ ra 2.6 tỷ | "Dư 150tr" → gợi ý nâng cấp vật liệu | "Sát cận dưới" → an toàn |
| Proposal | Báo giá 1 con số | Báo được 2 phương án: tiêu chuẩn / nâng cấp |

Đây đúng như Founder nói: **Budget là Requirement (khách muốn gì), không phải Estimate (hệ thống tính ra bao nhiêu).** Requirement phải giữ nguyên văn ý khách.

## Proposed Solution

### Phương án A — `budgetMin` + `budgetMax` (khuyến nghị)

```
budget: {
  budgetMin: number | null,        // VNĐ
  budgetMax: number | null,        // VNĐ
  budgetNote: string | null,       // nguyên văn khách nói
  constructionScope: enum | null,  // giữ nguyên
}
```

Ngữ nghĩa:

| Khách nói | budgetMin | budgetMax | budgetNote |
|---|---|---|---|
| "2,5 đến 3 tỷ" | 2_500_000_000 | 3_000_000_000 | "2,5 đến 3 tỷ" |
| "khoảng 2 tỷ" | 2_000_000_000 | 2_000_000_000 | "khoảng 2 tỷ" |
| "hơn 2 tỷ" | 2_000_000_000 | `null` | "hơn 2 tỷ" |
| "dưới 3 tỷ" / "tối đa 3 tỷ" | `null` | 3_000_000_000 | "dưới 3 tỷ" |
| "2 tỷ" | 2_000_000_000 | 2_000_000_000 | "2 tỷ" |
| "không muốn quá tốn tiền" | `null` | `null` | "không muốn quá tốn tiền" |

`budgetNote` là chi tiết quan trọng: nó giữ **nguyên văn** để chủ thầu tự đọc hiểu
sắc thái mà số không diễn tả được ("hơn 2 tỷ **thì tốt**" ≠ "tối đa 2 tỷ").
Hàng cuối bảng cho thấy vì sao cần: có ý định về tiền nhưng không có số nào.

### Phương án B — object lồng `budget: { min, max }`

Gọn về mặt ngữ nghĩa nhưng thêm một tầng lồng, và `mergeRequirement` hiện chỉ
merge 2 tầng (`group.field`). Sẽ phải sửa parser.
**Không khuyến nghị** — vi phạm Rule 1 (không over-engineering).

### Phương án C — giữ `budget` + thêm `budgetMax`

Tương thích ngược nhưng ngữ nghĩa `budget` thành mơ hồ (là min? là điểm?).
**Không khuyến nghị.**

## Impact nếu duyệt Phương án A

| Chỗ ảnh hưởng | Việc phải làm |
|---|---|
| `packages/shared-types` | `BudgetInfoSchema` đổi field |
| `lib/ai/schemas/openai-extract.ts` | thêm min/max vào schema strict |
| `lib/ai/prompts/extract-requirement.ts` | thêm quy tắc "hơn X" → min, "dưới X" → max |
| `lib/ai/provider/MockProvider.ts` | bỏ logic lấy trung bình |
| `scoring.ts` | `budget` coi là có nếu min **hoặc** max khác null |
| `requirement-view.ts` | hiển thị "2,5 – 3 tỷ" / "từ 2 tỷ" / "dưới 3 tỷ" |
| `regression.mjs` | sửa case "ngân sách dạng dải" |
| **Database** | **Không cần migrate** — requirement lưu dạng JSON, dự án cũ tự parse ra null |

Ước lượng: nhỏ, gọn trong 1 task.

## Recommendation

**Phương án A.** Chờ Founder duyệt. **Chưa code.**

---

# 2. ACTION ITEM 2 — Review toàn bộ Data Model

## 2.1 Bảng review theo từng nhóm

Ký hiệu: 🔴 P0 · 🟡 P1 · ⚪ P2 · ✅ giữ nguyên

### `project`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `projectType` | enum: new_build, renovation, interior | 🟡 Thiếu giá trị phổ biến ở VN | Thêm `extension` (nâng tầng / cơi nới). Rất hay gặp, và chi phí khác hẳn xây mới vì phải kiểm tra kết cấu cũ. |
| `buildingType` | enum: townhouse, villa, apartment, other | 🟡 Thiếu loại phổ biến nhất ở quê | Thêm `level4` (**nhà cấp 4**), `shophouse`. Khách "có miếng đất ở quê" phần lớn xây cấp 4 — hiện rơi vào `other`, mất thông tin. |
| `location` | `string` tự do | 🔴 **Sẽ chặn Pricing** | Xem mục 2.2 |

### `site`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `landArea` | number (m²) | ✅ | Giữ |
| `constructionArea` | number (m²/tầng) | 🔴 **Tên mơ hồ, sẽ gây sai BOQ** | Xem mục 2.3 |
| `frontage` | number (m) | ✅ | Giữ |
| `depth` | number (m) | ✅ | Giữ |
| `roadWidth` | number (m) | ✅ | Giữ — đã đủ để suy ra xe tải vào được không |

### `building`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `floors` | number | 🔴 **Mơ hồ: có tính tum/lửng/hầm không?** | Xem mục 2.4 |
| `roofType` | `string` tự do | 🔴 Nên là enum (Action Item 6 đã duyệt hướng) | Xem mục 3 |
| `architecturalStyle` | `string` tự do | 🟡 Nên là enum | Xem mục 3 |
| — | — | 🔴 **THIẾU `foundationType`** | Xem mục 2.5 |

### `household`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `adults` | number | ✅ | Giữ |
| `children` | number | ✅ | Giữ |
| `elderly` | **boolean** | 🟡 Lệch kiểu với 3 field cùng nhóm | Đổi tên `hasElderly` cho đúng nghĩa, **hoặc** đổi thành number cho đồng nhất. Không ảnh hưởng BOQ, chỉ là sạch code. |
| `cars` | number | ✅ | Giữ |

### `functional`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `bedrooms` | number | ✅ | Giữ |
| `bathrooms` | number | ✅ | Giữ |
| `livingRoom`, `kitchen`, `worshipRoom`, `storage`, `garage`, `garden`, `balcony` | boolean | 🟡 Mất số lượng | Xem mục 2.6 |
| — | — | 🔴 **THIẾU chỗ chứa phòng ngoài danh sách** | Xem mục 2.6 |

### `budget`

Xem Action Item 1.

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `constructionScope` | enum: rough, turnkey, interior | 🔴 **Thiếu gói phổ biến nhất VN** | Xem mục 2.7 |

### `timeline`

| Field | Kiểu hiện tại | Đánh giá | Đề xuất |
|---|---|---|---|
| `expectedStart` | `string` tự do ("đầu năm sau") | ⚪ Không chặn BOQ, sẽ chặn Contract | Giữ cho MVP. Sau này thêm `expectedStartDate` (ISO) khi parse được. |
| `expectedFinish` | `string` tự do | ⚪ | Giữ. Cân nhắc `durationMonths` sau. |

### `notes`

| Field | Đánh giá |
|---|---|
| `notes: string` | ✅ Giữ. Đang làm tốt vai trò lưới an toàn — test thật cho thấy nó hứng được thông tin không có field tương ứng. |

---

## 2.2 🔴 `location` — sẽ chặn Pricing

**Problem:** `location: string` tự do. Test thật cho ra `"Đan Phượng"`, lần khác
`"Đan Phượng, Hà Nội"`.

**Why:** Pricing phụ thuộc vùng — đơn giá nhân công, vật liệu, chi phí vận chuyển
ở Hà Nội khác Đan Phượng khác Hà Giang. Với chuỗi tới Pricing, `location` phải
**join được với bảng đơn giá theo vùng**. Chuỗi tự do không join được.

Ngoài ra Proposal và Contract cần **địa chỉ công trình** đầy đủ, không phải "ở quê".

**Proposed Solution:**

```
project: {
  projectType, buildingType,
  province: string | null,     // "Hà Nội"        <- dùng cho Pricing
  district: string | null,     // "Đan Phượng"    <- dùng cho Pricing
  addressDetail: string | null // phần còn lại, cho Proposal/Contract
}
```

Bỏ `location`, hoặc giữ `location` làm nguyên văn và thêm `province`/`district`.

**Trade-off cần Founder cân nhắc:** tách 3 field làm AI phải chuẩn hoá tên tỉnh/huyện.
Khách nói "ở quê" thì cả 3 đều null — không tệ hơn hiện tại.

**Recommendation:** P0 nếu Pricing nằm trong roadmap gần. Nếu Pricing còn xa,
có thể hoãn — nhưng đây là **lần cuối được đổi**, nên tôi nghiêng về làm luôn.
**Cần ChatGPT quyết định.**

---

## 2.3 🔴 `constructionArea` — tên mơ hồ, rủi ro sai tiền thật

**Problem:** Doc định nghĩa là "diện tích xây dựng **mỗi tầng**". Nhưng:

1. Các tầng **không bằng nhau**: tầng 1 xây hết đất, tum chỉ 40–50%.
   `floors × constructionArea` là phép nhân **sai**.
2. BOQ và Pricing ở VN tính theo **tổng diện tích sàn xây dựng (m² sàn)** — đó là
   con số nhân với đơn giá ra tiền. Đây là **biến số quan trọng nhất của báo giá**.
3. Tên `constructionArea` không nói rõ là "mỗi tầng" hay "tổng". Ai đọc code sau
   này (kể cả AI) đều có thể hiểu nhầm. **Đã xảy ra thật**: `gpt-5-mini` từng gán
   `constructionArea = 90` bằng luôn `landArea` (xem Status Report mục 5, bug #4).

**Proposed Solution:**

```
site: {
  landArea,                          // giữ nguyên
  buildingFootprint: number | null,  // m², diện tích chiếm đất (tầng 1)
  totalFloorArea: number | null,     // m², TỔNG diện tích sàn  <- biến chính của BOQ
  frontage, depth, roadWidth
}
```

- Khách nói "xây 70m² mỗi tầng, 3 tầng" → AI điền `buildingFootprint = 70`.
  **Code** (không phải AI) có thể gợi ý `totalFloorArea ≈ 210`, nhưng phải đánh dấu
  là **giả định cần xác nhận**, vì tum thường nhỏ hơn.
- Khách nói "tổng sàn khoảng 200m²" → `totalFloorArea = 200`.

**Recommendation:** P0. Đổi tên là việc rẻ **bây giờ**, rất đắt sau khi có dữ liệu
thật và BOQ đã dùng. Đây đúng là loại lỗi mà Action Item 2 muốn tìm.

---

## 2.4 🔴 `floors` — "nhà 3 tầng" là mấy sàn?

**Problem:** Ở VN "nhà 3 tầng" có thể là 3 sàn, hoặc 3 sàn + tum, hoặc 1 trệt +
2 lầu. Chưa kể **hầm**.

**Why:** `floors` nhân với diện tích ra tổng sàn → sai 1 tầng là sai vài trăm triệu.
**Tầng hầm** là hạng mục đắt nhất tính theo m² (đào đất, chống thấm, vách chắn) —
bỏ sót nó là sai báo giá nghiêm trọng.

**Proposed Solution:**

```
building: {
  floors: number | null,          // số tầng nổi chính, KHÔNG tính tum/lửng/hầm
  hasMezzanine: boolean | null,   // tầng lửng
  hasRooftop: boolean | null,     // tum / sân thượng có mái che
  basementLevels: number | null,  // số tầng hầm (0 = không có)
  ...
}
```

**Recommendation:** P0 cho `basementLevels`. P1 cho `hasMezzanine`/`hasRooftop`.
Kèm theo: định nghĩa `floors` phải ghi rõ trong `03-Data-Model.md` để AI và người
đều hiểu giống nhau.

---

## 2.5 🔴 THIẾU `foundationType` — và đây là lỗi lệch tài liệu

**Phát hiện:** `02-UI-Flow.md` dòng 313 liệt kê **"Móng dự kiến"** trong Building Info.
`03-Data-Model.md` **không có field này**.

Theo thứ tự ưu tiên (`Data Model > UI`), việc tôi không implement là đúng quy trình.
Nhưng đây là **lệch tài liệu thật**, cần ChatGPT xử lý.

**Why:** Móng là một trong 2–3 hạng mục đắt nhất. Móng cọc khoan nhồi so với móng
đơn chênh nhau **hàng trăm triệu** trên cùng một căn nhà. Không có field này thì
BOQ **không thể** ra số.

**Proposed Solution:** thêm enum `foundationType` (xem mục 3).

Lưu ý thực tế: ở giai đoạn Discovery khách hầu như **không biết** móng gì — cái này
do KTS/kỹ sư quyết sau khi khảo sát địa chất. Vì vậy:

**Recommendation:** Thêm field (P0) nhưng **KHÔNG đưa vào Requirement Score**, vì
bắt khách trả lời câu không thể trả lời sẽ làm Score kẹt vĩnh viễn dưới 100%.

---

## 2.6 🟡 `functional` — mất dữ liệu thật đã quan sát được

**Problem 1 — thiếu chỗ chứa phòng ngoài danh sách.**
Hội thoại thật của Founder có **"sân phơi"** và **"phòng làm việc"**. Cả hai
**không có field** → **bị mất** (chỉ còn sót lại trong `notes` nếu AI tiện ghi).

Đây là mất dữ liệu requirement thật, đúng cái mà `01-Product-Spec` mục 2 nói là
pain point số 1: *"Khách mô tả thiếu"* → giờ thành *"hệ thống làm rơi"*.

**Problem 2 — boolean mất số lượng.**
"Ban công mỗi tầng một chút" = 3 ban công → hệ thống chỉ lưu `balcony = true`.
BOQ cần diện tích/số lượng, không cần biết "có hay không".

**Proposed Solution:**

- P1: thêm `otherRooms: string[]` — hứng mọi phòng không thuộc danh sách cố định.
  Rẻ, chặn được mất dữ liệu ngay.
- P2: nâng `balcony` → `balconyCount: number`, tương tự các phòng đếm được.
  Chưa cần cho MVP.

**Recommendation:** làm `otherRooms` (P1). Hoãn phần đếm.

---

## 2.7 🔴 `constructionScope` — thiếu gói phổ biến nhất ở VN

**Problem:** enum hiện tại `rough | turnkey | interior`.

Thị trường dân dụng VN thực tế có **4 gói**, và gói bị thiếu lại là gói **phổ biến nhất**:

| Gói thực tế | Có trong enum? |
|---|---|
| Xây thô | ✅ `rough` |
| **Thô + nhân công hoàn thiện** (khách tự mua vật tư hoàn thiện) | ❌ **THIẾU** |
| Trọn gói / chìa khoá trao tay | ✅ `turnkey` |
| Trọn gói + nội thất | ✅ `interior` |

**Why:** Đây là **biến số quyết định đơn giá m²**. Ba gói này chênh nhau rất lớn
trên cùng một căn nhà. Thiếu một gói nghĩa là một phần lớn khách hàng bị ép vào
giá trị sai → Pricing sai từ gốc.

**Proposed Solution:**

```
constructionScope: "rough" | "rough_plus_labor" | "turnkey" | "turnkey_with_interior"
```

(đổi tên `interior` → `turnkey_with_interior` cho rõ nghĩa; `interior` hiện dễ nhầm
với `projectType.interior` = chỉ làm nội thất)

**Recommendation:** P0. **Cần Founder xác nhận** — đây là kiến thức thị trường,
thuộc chuyên môn của Founder chứ không phải của tôi. Nếu 4 gói này chưa đúng thực tế
kinh doanh, xin Founder cho danh sách đúng.

---

## 2.8 Bảng tổng: field nào chặn bước nào

| Field | Requirement | BOQ | Pricing | Proposal | Contract |
|---|---|---|---|---|---|
| `totalFloorArea` (đề xuất) | ✅ | 🔴 **chặn** | 🔴 **chặn** | ✅ | ✅ |
| `constructionScope` | ✅ | ✅ | 🔴 **chặn** | 🔴 **chặn** | 🔴 **chặn** |
| `foundationType` (thiếu) | ✅ | 🔴 **chặn** | 🔴 **chặn** | ✅ | ✅ |
| `basementLevels` (thiếu) | ✅ | 🔴 **chặn** | 🔴 **chặn** | ✅ | ✅ |
| `province`/`district` | ✅ | ✅ | 🔴 **chặn** | 🟡 | 🔴 **chặn** |
| `budgetMin`/`budgetMax` | 🔴 **sai lệch** | ✅ | 🟡 so sánh | 🔴 **chặn** | ✅ |
| `roofType` | ✅ | 🟡 | 🟡 | ✅ | ✅ |
| `expectedStart` (text) | ✅ | ✅ | ✅ | 🟡 | 🔴 **chặn** |
| `addressDetail` (thiếu) | ✅ | ✅ | ✅ | 🟡 | 🔴 **chặn** |

Đọc bảng: **5 field sẽ chặn BOQ/Pricing** nếu không sửa trước khi đóng băng.

---

# 3. ACTION ITEM 6 — Review Enum

ChatGPT đã duyệt hướng enum. Đây là danh sách đầy đủ các field nên chuẩn hoá:

## 3.1 `roofType` — string → enum (P0)

```
"flat"        // Mái bằng (bê tông)
"japanese"    // Mái Nhật
"thai"        // Mái Thái
"tile"        // Mái ngói
"metal"       // Mái tôn
"sloped"      // Mái lệch
"other"       // + roofTypeNote: string
```

**Lợi ích kép:** ngoài chuẩn hoá cho Pricing, nó **xoá luôn** bảng dịch Anh→Việt
tôi đang phải bảo trì trong `parsers/normalize.ts` (mục 7.3 Status Report). Model
buộc phải trả 1 trong các giá trị hợp lệ, không thể trả `"flat"` tự do nữa.
UI dịch sang tiếng Việt ở tầng hiển thị — đúng chỗ.

## 3.2 `architecturalStyle` — string → enum (P1)

```
"modern" | "neoclassical" | "classical" | "minimalist"
| "indochine" | "tropical" | "scandinavian" | "other"
```

Kèm `architecturalStyleNote` cho `other`.

## 3.3 `foundationType` — enum mới (P0, không tính Score)

```
"single"    // Móng đơn
"strip"     // Móng băng
"raft"      // Móng bè
"pile"      // Móng cọc (ép / khoan nhồi)
"unknown"   // Chưa khảo sát — giá trị MẶC ĐỊNH hợp lệ ở Discovery
```

`"unknown"` là giá trị **hợp lệ**, không phải null — vì "chưa khảo sát địa chất"
là một trạng thái nghiệp vụ thật, khác với "quên hỏi".

## 3.4 `constructionScope` — mở rộng enum (P0)

Xem mục 2.7.

## 3.5 `projectType` — mở rộng enum (P1)

Thêm `"extension"` (nâng tầng / cơi nới).

## 3.6 `buildingType` — mở rộng enum (P1)

Thêm `"level4"` (nhà cấp 4), `"shophouse"`.

## 3.7 Các field KHÔNG nên enum

| Field | Vì sao giữ string |
|---|---|
| `province` / `district` | 63 tỉnh + hàng trăm huyện → nên là bảng tra cứu, không phải enum trong code |
| `addressDetail`, `notes`, `budgetNote` | Bản chất là văn bản tự do |
| `expectedStart` / `expectedFinish` | Khách nói "đầu năm sau" — enum không diễn tả nổi |

## 3.8 Nguyên tắc đề xuất cho mọi enum

Mỗi enum "mở" (roofType, architecturalStyle, buildingType) nên có `"other"` + một
field note đi kèm. Nếu không, AI gặp giá trị lạ sẽ **buộc phải chọn sai** hoặc trả
null — cả hai đều tệ hơn là ghi lại nguyên văn.

---

# 4. ACTION ITEM 3 — Requirement Score: Basic / Advanced

## 4.1 🔴 Lỗi nghiêm trọng trong công thức hiện tại

Công thức hiện tại: 14 field, tổng trọng số 12.5, `score = filled / 12.5`,
`briefReady = score >= 70`.

**Tôi đã chạy thử bằng số thật:**

| Kịch bản | Score | `briefReady` |
|---|---|---|
| Thiếu **mỗi ngân sách** | **92%** | ✅ **true** |
| Thiếu **ngân sách + phạm vi báo giá** | **84%** | ✅ **true** |
| Thiếu **ngân sách + phạm vi + diện tích xây dựng** | **76%** | ✅ **true** |

Nghĩa là: hệ thống tuyên bố **"Sẵn sàng tạo Project Brief"** trong khi **không biết
khách có bao nhiêu tiền, báo giá phần gì, và xây bao nhiêu m²**.

Nguyên nhân: danh sách **phẳng**. Thiếu 3 field sống-còn chỉ mất 3/12.5 = 24%, trong
khi có đủ 11 field vụn vặt (kể cả `roofType`, `architecturalStyle` — thuần thẩm mỹ)
vẫn kéo Score lên trên ngưỡng.

Đây chính là vấn đề Action Item 3 nêu: *"Score chưa phản ánh đúng tiến độ thu thập"*.
Nó không chỉ *chưa đúng* — nó **nói dối theo hướng nguy hiểm**.

## 4.2 Proposed Solution — chia 2 nhóm

### Basic — thiếu 1 field là KHÔNG thể tư vấn

| Field | Vì sao Basic |
|---|---|
| `projectType` | Xây mới / cải tạo khác nhau hoàn toàn về giá |
| `buildingType` | Quyết định đơn giá |
| `province` / `district` | Quyết định đơn giá vùng |
| `landArea` | Không có thì không bàn được gì |
| `totalFloorArea` (hoặc `buildingFootprint` + `floors`) | **Biến chính của báo giá** |
| `floors` | |
| `budgetMin` **hoặc** `budgetMax` | Không biết tiền = không tư vấn được |
| `constructionScope` | Không biết báo phần gì = con số vô nghĩa |

### Advanced — cần để thiết kế & bóc tách chi tiết

`frontage`, `depth`, `roadWidth`, `basementLevels`, `roofType`,
`architecturalStyle`, `bedrooms`, `bathrooms`, `household.*`, `functional.*`,
`timeline.*`

**Không tính điểm:** `foundationType` (khách không thể biết ở giai đoạn này —
xem mục 2.5).

### Công thức đề xuất

```
basicScore    = % field Basic đã có
advancedScore = % field Advanced đã có
score         = basicScore × 0.7 + advancedScore × 0.3
```

### Quy tắc `briefReady` đề xuất — đây mới là điểm mấu chốt

```
briefReady = (basicScore === 100)
```

**Không** phải `score >= 70`.

Lý do: không có ngoại lệ nào cho việc thiếu ngân sách. Một Brief không có ngân sách
và phạm vi báo giá thì KTS/QS nhận được cũng phải hỏi lại — đúng pain point mà sản
phẩm này sinh ra để diệt.

`02-UI-Flow` mục 17 vẫn được tôn trọng: **vẫn cho phép** bấm Generate khi chưa đủ,
chỉ là hiện cảnh báo. Ta chỉ sửa lại điều kiện của **cờ cảnh báo** cho trung thực.

### Hiển thị đề xuất (UI)

```
Requirement Score: 72%
  Cơ bản:   85%  (thiếu: Ngân sách)
  Chi tiết: 40%
→ Chưa thể tạo Brief: còn thiếu thông tin cơ bản.
```

Rõ hơn hẳn một con số 72% trần trụi: chủ thầu biết **chính xác** phải hỏi gì tiếp.

## 4.3 Impact nếu duyệt

| Chỗ ảnh hưởng | Việc phải làm |
|---|---|
| `scoring.ts` | Chia `TRACKED_FIELDS` thành `BASIC_FIELDS` / `ADVANCED_FIELDS` |
| `AnalyzeMessageResult` | Thêm `basicScore`, `advancedScore` |
| `ProjectDetail` | Thêm 2 field trên |
| UI Workspace + Dashboard | Hiển thị 2 mức |
| `02-UI-Flow` mục 12 & 17 | **Cần ChatGPT cập nhật** ngưỡng và cách hiển thị |
| `regression.mjs` | Thêm case: thiếu ngân sách → `briefReady` PHẢI là false |
| Database | Không migrate — Score là derived, không lưu |

## 4.4 Recommendation

Duyệt chia Basic/Advanced **và** đổi `briefReady = basicScore === 100`.

Nếu chỉ được chọn 1 việc trong toàn bộ tài liệu này, tôi chọn việc này — vì nó là
lỗi **đang sai ngay lúc này**, không phải rủi ro tương lai.

---

# 5. Tổng hợp đề xuất

## P0 — nên sửa trước khi đóng băng

| # | Đề xuất | Mục | Vì sao không hoãn được |
|---|---|---|---|
| 1 | `budgetMin` / `budgetMax` / `budgetNote` | 1 | Founder đã bác cách hiện tại |
| 2 | `briefReady = basicScore === 100` | 4 | **Đang sai ngay bây giờ** |
| 3 | Chia Score Basic / Advanced | 4 | Action Item 3 |
| 4 | `constructionArea` → `buildingFootprint` + `totalFloorArea` | 2.3 | Đổi tên sau khi có data thật rất đắt |
| 5 | Thêm `basementLevels` | 2.4 | Bỏ sót = sai báo giá nghiêm trọng |
| 6 | Thêm `foundationType` (không tính Score) | 2.5 | Lệch với `02-UI-Flow`; BOQ không chạy được |
| 7 | `constructionScope` thêm `rough_plus_labor` | 2.7 | Thiếu gói phổ biến nhất VN |
| 8 | `roofType` → enum | 3.1 | Xoá được bảng dịch đang phải bảo trì |
| 9 | `location` → `province` / `district` / `addressDetail` | 2.2 | Pricing không join được với chuỗi tự do |

## P1 — nên làm, hoãn được

| # | Đề xuất | Mục |
|---|---|---|
| 10 | `otherRooms: string[]` (chặn mất dữ liệu) | 2.6 |
| 11 | `architecturalStyle` → enum | 3.2 |
| 12 | `projectType` thêm `extension` | 2.1 |
| 13 | `buildingType` thêm `level4`, `shophouse` | 2.1 |
| 14 | `hasMezzanine`, `hasRooftop` | 2.4 |
| 15 | `elderly` → `hasElderly` (sạch code) | 2.1 |

## P2 — sau MVP

| # | Đề xuất |
|---|---|
| 16 | Số lượng thay boolean (`balconyCount`...) |
| 17 | `expectedStartDate` (ISO) + `durationMonths` |
| 18 | `hasExistingStructure` (chi phí phá dỡ) |
| 19 | `orientation` (hướng nhà) |
| 20 | `budgetIncludesVat`, `designIncluded` |

## Ước lượng nếu duyệt toàn bộ P0

| Việc | Quy mô |
|---|---|
| Sửa code | ~6 file (`shared-types`, `openai-extract`, `prompt`, `MockProvider`, `scoring`, `requirement-view`) |
| Regression | Sửa 2 case + thêm ~4 case mới |
| **Migrate DB** | **Không cần** — Requirement lưu JSON, `RequirementSchema.safeParse` thất bại sẽ tự trả về requirement rỗng |
| Cập nhật tài liệu | `03-Data-Model.md`, `02-UI-Flow.md` mục 12 & 17 — **thuộc ChatGPT** |

**Cảnh báo về dữ liệu cũ:** dự án `nhà quê đan phượng` hiện có trong DB sẽ mất
requirement khi đổi schema (parse fail → rỗng). Là dữ liệu test nên tôi cho là
chấp nhận được, nhưng **cần Founder xác nhận** trước khi tôi động vào.

---

# 6. Câu hỏi cần Founder / ChatGPT quyết định

1. **Budget**: duyệt Phương án A (`budgetMin`/`budgetMax`/`budgetNote`) chứ?
2. **`constructionScope`**: 4 gói tôi đề xuất ở mục 2.7 có đúng thực tế thị trường
   không? Đây là chuyên môn của Founder, tôi chỉ suy từ quan sát.
3. **`location`**: tách `province`/`district` ngay bây giờ, hay hoãn tới khi làm Pricing?
4. **`briefReady = basicScore === 100`** — có quá chặt không? Có muốn nới thành
   `>= 87.5%` (cho phép thiếu đúng 1 field Basic) không?
5. **Danh sách Basic ở mục 4.2** đã đúng chưa? ChatGPT có muốn thêm/bớt field nào?
6. **Foundation**: `02-UI-Flow` có "Móng dự kiến" nhưng Data Model không có.
   ChatGPT muốn xử lý lệch này thế nào — thêm vào Data Model, hay bỏ khỏi UI Flow?
7. **Dữ liệu test cũ trong DB** có được phép mất khi đổi schema không?
8. **Thứ tự thực hiện**: duyệt toàn bộ P0 làm 1 task, hay tách nhỏ để review từng phần?

---

# 7. Xác nhận phạm vi

Theo `chatgpt-report-1.md`:

- ✅ Action Item 1 — review Budget, đề xuất, **không implement**
- ✅ Action Item 2 — review toàn bộ Data Model, **không implement**
- ✅ Action Item 3 — đề xuất Score Basic/Advanced, **không implement**
- ✅ Action Item 6 — review enum còn cần chuẩn hoá, **không implement**
- ✅ Sprint 4 — **chưa bắt đầu, không code**

**Không có dòng code nào bị thay đổi trong task này.**
Tài liệu này chờ Founder + ChatGPT phê duyệt trước khi implement.
