# Data Model CUỐI CÙNG — trình để đóng băng

**Ngày:** 2026-07-16
**Người soạn:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Trạng thái:** TRÌNH ĐỂ ĐÓNG BĂNG. **Chưa implement dòng code nào.**
**Nguồn:** Founder Decision (2 vòng) + Data Model Review + P0 Final Proposal

> Nếu Founder không còn câu hỏi → đóng băng. Chỉ còn **1 câu hỏi bắt buộc** (mục 6)
> do hai lần quyết định của Founder lệch nhau về `location`, cùng vài mục "thêm trước
> khi đóng băng" cần Yes/No nhanh (mục 5).

---

# 0. Các quyết định đã nạp

| Quyết định | Đã áp dụng vào |
|---|---|
| `coreFunctionalNeeds` = bedrooms + livingRoom + kitchen; bathroom KHÔNG chặn | Mục 3 |
| Enum tách khỏi UI, nhãn hiển thị riêng | Mục 4 |
| **Score ≠ Readiness** — Score chỉ hiển thị tiến độ, Readiness là business rule riêng | Mục 2 & 3 |
| Kiến trúc 3 cờ brief/quantity/pricing, chỉ implement `briefReady` | Mục 3 |
| Implement ngay: basementLevels, province, district, addressDetail | Mục 1 |

---

# 1. Requirement — cấu trúc cuối cùng

Ký hiệu: **[MỚI]** field mới · **[ĐỔI]** đổi tên/kiểu · **[?]** đề xuất thêm, chờ Yes/No (mục 5)

## project

| Field | Kiểu | Ghi chú |
|---|---|---|
| `projectType` | enum \| null | `new_build` · `renovation` · `interior` · **[?]** `extension` |
| `buildingType` | enum \| null | `townhouse` · `villa` · `apartment` · `other` · **[?]** `level4` · **[?]** `shophouse` |
| `province` | string \| null | **[MỚI]** "Hà Nội" — dùng cho Pricing |
| `district` | string \| null | **[MỚI]** "Đan Phượng" — dùng cho Pricing |
| `addressDetail` | string \| null | **[MỚI]** phần địa chỉ còn lại — cho Proposal/Contract |

> `location` cũ bị **bỏ**, thay bằng 3 field trên (Founder Decision 4).

## site

| Field | Kiểu | Ghi chú |
|---|---|---|
| `landArea` | number \| null | m² — diện tích khu đất |
| `buildingFootprint` | number \| null | **[MỚI]** m² — diện tích chiếm đất (tầng 1) |
| `totalFloorArea` | number \| null | **[MỚI]** m² — **TỔNG diện tích sàn**, biến chính của BOQ |
| `frontage` | number \| null | m |
| `depth` | number \| null | m |
| `roadWidth` | number \| null | m |

> `constructionArea` cũ (mơ hồ "mỗi tầng") bị **bỏ**, tách thành `buildingFootprint`
> + `totalFloorArea` (Data Model Review 2.3).

## building

| Field | Kiểu | Ghi chú |
|---|---|---|
| `floors` | number \| null | **số tầng nổi chính**, KHÔNG tính tum/lửng/hầm |
| `basementLevels` | number \| null | **[MỚI]** số tầng hầm (0 = không có) |
| `roofType` | enum \| null | **[ĐỔI]** string→enum: `flat` · `japanese` · `thai` · `tile` · `metal` · `sloped` · `other` |
| `roofTypeNote` | string \| null | **[MỚI]** dùng khi `roofType = other` |
| `architecturalStyle` | **[?]** enum \| null | **[?]** đổi string→enum: `modern` · `neoclassical` · `classical` · `minimalist` · `indochine` · `tropical` · `scandinavian` · `other` |
| `foundationType` | enum \| null | **[MỚI]** `single` · `strip` · `raft` · `pile` · `unknown` — **KHÔNG tính Score**, KHÔNG chặn Brief |

## household

| Field | Kiểu | Ghi chú |
|---|---|---|
| `adults` | number \| null | |
| `children` | number \| null | |
| `elderly` | boolean \| null | **[?]** đề xuất đổi tên `hasElderly` cho đúng nghĩa |
| `cars` | number \| null | |

## functional

| Field | Kiểu | Ghi chú |
|---|---|---|
| `bedrooms` | number \| null | |
| `bathrooms` | number \| null | KHÔNG phải hard blocker (Founder Decision 1) |
| `livingRoom` | boolean \| null | hard blocker (coreFunctionalNeeds) |
| `kitchen` | boolean \| null | hard blocker (coreFunctionalNeeds) |
| `worshipRoom` | boolean \| null | |
| `storage` | boolean \| null | |
| `garage` | boolean \| null | |
| `garden` | boolean \| null | |
| `balcony` | boolean \| null | |
| `otherRooms` | **[?]** string[] | **[?]** hứng phòng ngoài danh sách (sân phơi, phòng làm việc...) — chống mất dữ liệu |

## budget

| Field | Kiểu | Ghi chú |
|---|---|---|
| `budgetMin` | number \| null | **[MỚI]** VNĐ — cận dưới |
| `budgetMax` | number \| null | **[MỚI]** VNĐ — cận trên |
| `budgetNote` | string \| null | **[MỚI]** nguyên văn khách nói ("hơn 2 tỷ thì tốt") |
| `constructionScope` | enum \| null | `labor_only` · `rough_and_finishing_labor` · `turnkey` · `turnkey_with_interior` |
| `constructionScopeNote` | string \| null | **[MỚI]** nguyên văn |

> `budget` (số đơn) cũ bị **bỏ**, thay bằng min/max/note (Founder AI1 + Decision).
> "2,5 đến 3 tỷ" → `budgetMin=2.5tỷ, budgetMax=3tỷ`. "khoảng 2 tỷ" → cả hai = 2 tỷ.
> "hơn 2 tỷ" → min=2tỷ, max=null. "dưới 3 tỷ" → min=null, max=3tỷ.

## timeline

| Field | Kiểu | Ghi chú |
|---|---|---|
| `expectedStart` | string \| null | tự do ("đầu năm sau") — giữ cho MVP |
| `expectedFinish` | string \| null | tự do |

## notes

| Field | Kiểu | Ghi chú |
|---|---|---|
| `notes` | string \| null | lưới an toàn cho thông tin không có field riêng |

---

# 2. Requirement Score — CHỈ hiển thị tiến độ

Theo Founder Decision 3: **Score không quyết định readiness.** Vì vậy giữ Score **đơn giản**,
không cần chia Basic/Advanced nữa (việc chia trước đây chỉ để phục vụ readiness — giờ readiness
đã tách ra). Đây là lựa chọn tránh over-engineering (Rule 1).

- Công thức giữ như hiện tại: `% = tổng trọng số field đã có / tổng trọng số`.
- Cập nhật `TRACKED_FIELDS` theo schema mới:
  - **Thêm vào Score:** `province`, `district`, `totalFloorArea`, `basementLevels`.
  - **Đổi tham chiếu:** `budget` → có nếu `budgetMin` hoặc `budgetMax` khác null;
    `constructionArea` → `totalFloorArea`.
  - **KHÔNG đưa vào Score:** `foundationType` (khách không thể biết ở Discovery),
    `addressDetail`, `roofTypeNote`, các `*Note`, `otherRooms`.

> "Lỗi Score nói dối" tôi nêu ở Review mục 4.1 **tự động được hoá giải**: Score cao không
> còn nghĩa là "sẵn sàng" nữa, vì readiness đã là cờ riêng. Score giờ thuần tuý là thanh tiến độ.

---

# 3. Readiness — Business Rule riêng (chỉ `briefReady`)

## Kiến trúc 3 cờ (chuẩn bị, chỉ implement brief)

```ts
readiness: {
  brief: { ready: boolean; missing: string[] };   // implement bây giờ
  // quantity: {...}   // chỗ trống, thêm ở giai đoạn BOQ
  // pricing:  {...}   // chỗ trống, thêm ở giai đoạn Pricing
}
```

## Quy tắc `briefReady`

Theo đúng Founder Decision 3, là **AND boolean thuần**, KHÔNG dùng ngưỡng % :

```
briefReady =
  projectType   != null &&
  buildingType  != null &&
  landArea      != null &&
  floors        != null &&
  bedrooms      != null &&   // coreFunctionalNeeds
  livingRoom    != null &&   // coreFunctionalNeeds
  kitchen       != null      // coreFunctionalNeeds
```

`brief.missing` = danh sách các field trên đang null, để UI chỉ rõ còn thiếu gì.

## Hai điểm tôi diễn giải (implement như dưới, trừ khi Founder sửa)

1. **`bedrooms`**: coi là "có" khi `!= null && >= 1` (0 phòng ngủ = vô nghĩa với nhà ở).
2. **`livingRoom` / `kitchen`**: coi là "có" khi **đã xác định (`!= null`)**, KHÔNG bắt buộc
   phải `= true`. Lý do: nếu khách nói rõ "không cần bếp riêng (bếp mở)" → `kitchen = false`
   vẫn là đã-xác-định, không nên chặn Brief vĩnh viễn. Founder viết `&& kitchen` (truthy);
   tôi đề xuất nới thành "đã xác định" để tránh kẹt. **Nếu Founder muốn đúng nghĩa truthy,
   báo tôi.**

## "Thông tin cần xác nhận" trong Brief

Các field KHÔNG chặn Brief nhưng nên hỏi nốt, đưa thành 1 mục trong Project Brief khi thiếu:
`budgetMin/Max`, `constructionScope`, `totalFloorArea`, `foundationType`.

---

# 4. Enum ↔ UI Label (tách riêng, Founder Decision 2)

Enum là giá trị nội bộ/lưu DB. UI dịch ở tầng hiển thị (`requirement-view.ts`), **không** hiển thị enum thô.

## constructionScope

| Enum | Nhãn UI |
|---|---|
| `labor_only` | Nhân công |
| `rough_and_finishing_labor` | Xây phần thô |
| `turnkey` | Xây trọn gói |
| `turnkey_with_interior` | Xây trọn gói + Nội thất |

## roofType

| Enum | Nhãn UI |
|---|---|
| `flat` | Mái bằng |
| `japanese` | Mái Nhật |
| `thai` | Mái Thái |
| `tile` | Mái ngói |
| `metal` | Mái tôn |
| `sloped` | Mái lệch |
| `other` | (hiển thị `roofTypeNote`) |

## foundationType

| Enum | Nhãn UI |
|---|---|
| `single` | Móng đơn |
| `strip` | Móng băng |
| `raft` | Móng bè |
| `pile` | Móng cọc |
| `unknown` | Chưa khảo sát |

## projectType / buildingType / architecturalStyle
Nhãn tiếng Việt tương ứng, xác nhận sau khi chốt danh sách enum ở mục 5.

---

# 5. Mục "[?]" — thêm trước khi đóng băng? (Yes/No nhanh)

Đây là **lần cuối được đổi Data Model**. Các mục P1 dưới đây rẻ nếu thêm bây giờ, đắt nếu
phải mở băng sau. Xin Founder cho Yes/No từng dòng:

| # | Đề xuất | Vì sao nên cân nhắc thêm ngay |
|---|---|---|
| A | `projectType` thêm `extension` (nâng tầng/cơi nới) | Rất phổ biến, chi phí khác hẳn xây mới |
| B | `buildingType` thêm `level4` (nhà cấp 4), `shophouse` | "Đất ở quê" phần lớn là cấp 4; hiện rơi vào `other`, mất thông tin |
| C | `architecturalStyle` string → enum | Chuẩn hoá cho Pricing, xoá bảng dịch đang bảo trì tay |
| D | `functional.otherRooms: string[]` | Hội thoại thật đã làm rơi "sân phơi", "phòng làm việc" |
| E | `elderly` → đổi tên `hasElderly` | Chỉ sạch code, không ảnh hưởng nghiệp vụ |

**Khuyến nghị của tôi:** A, B, D nên thêm (chống mất dữ liệu thật). C nên thêm (lợi kép).
E tuỳ Founder. Nhưng đây là **quyết định của Founder/ChatGPT**, tôi chỉ đề xuất.

---

# 6. CÂU HỎI BẮT BUỘC — trước khi đóng băng

**Chỉ 1 câu, do hai lần quyết định của Founder lệch nhau:**

> Quyết định **trước** liệt kê `location` là hard blocker của Brief.
> Quyết định **mới** (ví dụ `briefReady`) **KHÔNG** có `location`.
> Đồng thời `location` vừa được tách thành `province` / `district` / `addressDetail`.
>
> **Vậy `briefReady` có cần biết địa điểm không?** 3 phương án:
> - **(a)** Không cần — giữ đúng ví dụ mới của Founder (7 field, không địa điểm).
> - **(b)** Cần `province` (đủ để biết vùng).
> - **(c)** Cần `province` **và** `district`.
>
> Tôi nghiêng về **(b)**: một Project Brief không biết công trình ở tỉnh nào thì KTS/QS
> khó dùng. Nhưng đây là quyết định của Founder.

---

# 7. Ảnh hưởng khi implement (sau khi đóng băng)

| Hạng mục | Việc |
|---|---|
| `packages/shared-types` | Viết lại `RequirementSchema` + enum + `ProjectDetail`/`AnalyzeMessageResult` (thêm `readiness`) |
| `lib/ai/schemas/openai-extract.ts` | Đồng bộ schema strict mới |
| `lib/ai/prompts/extract-requirement.ts` | Dạy AI: budget min/max, 4 gói scope, tách province/district, totalFloorArea vs footprint |
| `lib/ai/provider/MockProvider.ts` | Cập nhật regex theo field mới |
| `lib/ai/parsers/normalize.ts` | Bỏ bảng dịch roofType (đã thành enum); giữ dịch style nếu C được duyệt |
| `scoring.ts` | Cập nhật `TRACKED_FIELDS` + tách `readiness` (business rule riêng) |
| `requirement-view.ts` | Map enum→nhãn UI mục 4 |
| `regression.mjs` | Sửa case budget, scope; thêm case briefReady, totalFloorArea |
| **Database** | **Reset dev** (Founder Decision 3): seed fixture Đan Phượng → thông báo → reset → tạo demo chuẩn. Chốt chặn nếu phát hiện dữ liệu thật. |

**Không cần migration tương thích ngược** (Founder cho phép). Requirement lưu JSON nên dự án
cũ parse-fail sẽ tự thành rỗng; kèm reset có kiểm soát.

---

# 8. Phạm vi & bước tiếp

- Task này **chỉ trình Data Model cuối**, không code.
- Sau khi Founder trả lời mục 5 + mục 6 và **đóng băng**:
  1. Tôi cập nhật `03-Data-Model.md` thành phiên bản chốt (hoặc ChatGPT làm, tuỳ phân công).
  2. Lập task implement (Goal / Scope / Out of Scope / Definition of Done — Rule 6), trình duyệt.
  3. Chỉ code sau khi task được duyệt.

**Không có dòng code nào thay đổi trong task này.**
