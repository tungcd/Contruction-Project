# P0 Proposal (cập nhật theo Founder Decisions) — chờ duyệt cuối

**Ngày:** 2026-07-16
**Người soạn:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Nguồn quyết định:** `Founder / PO Decisions — Data Model Review`
**Trạng thái:** ĐỀ XUẤT CUỐI — **chưa implement dòng code nào.** Chờ Founder duyệt danh sách P0 ở mục 8.

> Tài liệu này thay thế mục 5 (danh sách P0) trong `02_Data-Model-Review-2026-07-16.md`,
> cập nhật theo đúng các quyết định đã ban hành. Các phần không bị quyết định đụng tới
> vẫn giữ nguyên và được đánh dấu "chờ xác nhận".

---

# 0. Ghi nhận các quyết định

| Quyết định của Founder/PO | Ảnh hưởng tới đề xuất cũ của tôi |
|---|---|
| Enum `constructionScope` mới (4 giá trị khác) | **Thay** đề xuất mục 2.7 của tôi |
| `briefReady = basicScore >= 75 && noBriefHardBlockers` | **Bác** đề xuất `=== 100` của tôi (tôi đã sai — xem 2.0) |
| Ngân sách / scope / foundation / totalFloorArea KHÔNG chặn Brief | Sửa lại tập Basic & khái niệm "cần xác nhận" |
| Chuẩn bị kiến trúc 3 cờ: brief / quantity / pricing | Thêm vào thiết kế, chỉ implement `briefReady` |
| Dữ liệu test được phép mất, có điều kiện | Thêm kế hoạch seed + reset |

---

# 1. Construction Scope — chốt theo Founder

## Enum duyệt

```
constructionScope:
  | "labor_only"                 // Chỉ nhân công (khách lo toàn bộ vật tư)
  | "rough_and_finishing_labor"  // Xây thô + nhân công hoàn thiện
  | "turnkey"                    // Trọn gói (chìa khoá trao tay)
  | "turnkey_with_interior"      // Trọn gói + nội thất

constructionScopeNote: string | null   // nguyên văn khách nói, cho sắc thái
```

## Điểm cần xác nhận nhãn hiển thị (UI)

Tôi hiểu ngữ nghĩa như bảng dưới. **Xin Founder xác nhận nhãn tiếng Việt** trước khi tôi
đưa vào `requirement-view.ts`, vì đây là kiến thức thị trường:

| Enum | Nhãn đề xuất | Ai lo vật tư | Ai lo nhân công |
|---|---|---|---|
| `labor_only` | Chỉ nhân công | Khách (toàn bộ) | Thầu |
| `rough_and_finishing_labor` | Xây thô + nhân công hoàn thiện | Thầu (thô) + Khách (hoàn thiện) | Thầu (toàn bộ) |
| `turnkey` | Trọn gói | Thầu | Thầu |
| `turnkey_with_interior` | Trọn gói + nội thất | Thầu (gồm nội thất) | Thầu |

## Prompt / Mock cần cập nhật

- Prompt: dạy AI phân biệt 4 gói; "trọn gói" → `turnkey`, "thô" → `rough_and_finishing_labor`
  (theo lý do Founder: "thô" ở VN đã gồm nhân công hoàn thiện), "chỉ công/khoán công" → `labor_only`.
- Mock: thay 3 nhánh regex cũ bằng 4 nhánh mới + ghi `constructionScopeNote`.

---

# 2. Brief Readiness — chốt theo Founder

## 2.0 Nhận sai của tôi

Ở `Data-Model-Review` mục 4 tôi lập luận "ngân sách PHẢI chặn Brief". **Sai.**
Tôi đã gộp nhầm `briefReady` với `pricingReady`. Founder tách đúng: Brief là sản phẩm
của Discovery để chuyển cho KTS/QS — thiếu ngân sách thì ghi "cần xác nhận", vẫn tạo được.
Chặn báo giá mới là việc của `pricingReady`. Đề xuất dưới đây theo mô hình của Founder.

## 2.1 Công thức

```
briefReady = basicScore >= 75 && noBriefHardBlockers
```

**Hard blockers (phải có ĐỦ 6, thiếu 1 là chặn Brief bất kể điểm số):**

| Blocker | Điều kiện "có" |
|---|---|
| `projectType` | khác null |
| `buildingType` | khác null |
| `location` | khác null (bất kỳ dạng nào — xem 5.9 về tách province/district) |
| `landArea` | khác null |
| `floors` | khác null |
| `coreFunctionalNeeds` | **cần định nghĩa — xem 2.2** |

**KHÔNG chặn Brief** (thiếu thì đưa vào mục "Thông tin cần xác nhận" của Brief):
`budgetMin`/`budgetMax`, `constructionScope`, `foundationType`, `totalFloorArea`.

## 2.2 Định nghĩa `coreFunctionalNeeds` — cần Founder chốt

Founder liệt kê `coreFunctionalNeeds` là hard blocker nhưng chưa định nghĩa. Tôi đề xuất:

> **`coreFunctionalNeeds` = `functional.bedrooms` đã biết (>= 1).**

Lý do: số phòng ngủ là nhu cầu định hình căn nhà rõ nhất; một Brief không biết mấy phòng
ngủ thì KTS không phác thảo được gì. Các công năng khác (bếp, khách, thờ...) hầu như mặc
định có, thiếu cũng không chặn.

**Phương án chặt hơn (nếu Founder muốn):** `bedrooms` **và** `bathrooms` đều biết.
Xin Founder chọn 1 trong 2.

## 2.3 Tập Basic đề xuất (9 field) — đã kiểm chứng bằng số

| Field | Là hard blocker? |
|---|---|
| projectType | ✅ |
| buildingType | ✅ |
| location | ✅ |
| landArea | ✅ |
| floors | ✅ |
| bedrooms (coreFunctionalNeeds) | ✅ |
| totalFloorArea | — (cần xác nhận nếu thiếu) |
| budget (min hoặc max) | — |
| constructionScope | — |

`basicScore = (số field Basic đã có) / 9 × 100`

**Kết quả chạy thử (đã đo, không phải ước lượng):**

| Kịch bản | basicScore | hardBlockers | **briefReady** |
|---|---|---|---|
| Thiếu mỗi ngân sách | 89% | ✅ | **true** |
| Thiếu ngân sách + scope | 78% | ✅ | **true** |
| Thiếu ngân sách + scope + tổng sàn | 67% | ✅ | **false** |
| Thiếu 1 hard blocker (số tầng), điểm 89% | 89% | ❌ | **false** |
| Đủ cả 9 | 100% | ✅ | **true** |

Hành vi đúng ý Founder: thiếu ngân sách (hoặc + 1 field nữa) vẫn ra Brief; thiếu tới 3
thứ hoặc thiếu 1 hard blocker thì chặn. Ngưỡng 75% cho phép **hụt tối đa 2/9 field**.

**Xin Founder xác nhận:** tập 9 field này, và ngưỡng 75%, có đúng ý không?
(Nếu muốn nới hơn, hạ ngưỡng; muốn chặt hơn, nâng ngưỡng hoặc thêm field vào Basic.)

## 2.4 "Thông tin cần xác nhận" trong Brief

Hàm mới `computeToConfirm(requirement)` trả các field **được kỳ vọng nhưng đang thiếu**:
`budget`, `constructionScope`, `totalFloorArea`, `foundationType`.
Chúng xuất hiện thành một mục trong Project Brief để chủ thầu hỏi nốt trước khi báo giá.

## 2.5 Kiến trúc 3 cờ (chuẩn bị, chỉ implement `briefReady`)

Đề xuất shape trong `AnalyzeMessageResult` / `ProjectDetail`:

```ts
readiness: {
  brief:   { ready: boolean; blockers: string[]; toConfirm: string[] };
  // quantity: {...}  // để trống, thêm ở giai đoạn BOQ
  // pricing:  {...}  // để trống, thêm ở giai đoạn Pricing
}
```

- `scoring.ts` chia sẵn field theo 3 tầng dùng-cho: `brief` / `quantity` / `pricing`,
  nhưng **chỉ tính `brief.ready` bây giờ**. Hai cái kia là chỗ trống có chú thích.
- Không tạo abstraction thừa (Rule 3): chỉ là 1 object có 1 nhánh, mở rộng sau khi cần.

**Xin xác nhận:** shape này đủ để "chuẩn bị kiến trúc" như Founder yêu cầu chưa?

---

# 3. Data Reset Plan — theo điều kiện của Founder

Founder cho phép mất dữ liệu test, KÈM 4 điều kiện. Kế hoạch thực hiện (khi được duyệt implement):

1. **Trước reset — chuyển test case giá trị thành seed.**
   Lưu hội thoại "nhà quê Đan Phượng" (đang trong DB) thành fixture:
   `apps/web/prisma/seed-fixtures/dan-phuong.ts`. Đây là ca test dài, thật, quý.
2. **Thông báo rõ.** Ghi vào README + in cảnh báo khi chạy script reset.
3. **Sau reset — tạo 1 project demo chuẩn.** Script `npm run db:seed` dựng lại
   dự án Đan Phượng đã phân tích sẵn, để mở app là có ngay dữ liệu demo.
4. **Chốt chặn an toàn:** script reset kiểm tra, nếu phát hiện project không nằm trong
   danh sách seed (dấu hiệu có dữ liệu thật) thì **dừng và cảnh báo**, không xoá mù quáng.
   Chính sách reset này chỉ áp dụng cho DB dev.

**Không thực hiện gì trong task này** — chỉ mô tả kế hoạch.

---

# 4. Budget (giữ từ đề xuất trước, không bị bác)

`budgetMin` / `budgetMax` / `budgetNote` — như `Data-Model-Review` mục 1 Phương án A.
Founder không bác, và quyết định 2 xác nhận budget là Requirement (không chặn Brief nhưng
phải hiển thị "cần xác nhận"). Giữ nguyên đề xuất.

Score: `budget` coi là "có" nếu `budgetMin` **hoặc** `budgetMax` khác null.

---

# 5. Các P0 còn lại — cần Founder cho yes/no cuối

Những mục dưới đây các quyết định chưa đụng tới. Tôi giữ nguyên đề xuất và xin chốt:

| # | Đề xuất | Trạng thái | Cần quyết |
|---|---|---|---|
| 5.3 | `constructionArea` → `buildingFootprint` + `totalFloorArea` | Founder có nhắc `totalFloorArea` ⇒ ngầm chấp nhận | Xác nhận đổi tên/tách |
| 5.4 | Thêm `basementLevels` (số tầng hầm) | Chưa quyết | Yes/No |
| 5.5 | Thêm `foundationType` (enum, KHÔNG tính Score) | Founder nhắc như non-blocker ⇒ ngầm chấp nhận | Xác nhận |
| 5.8 | `roofType` string → enum | AI6 đã duyệt hướng enum | Xác nhận áp dụng |
| 5.9 | `location` → `province` / `district` / `addressDetail` | Chưa quyết; hard blocker chỉ ghi "location" | **Tách ngay hay hoãn tới Pricing?** |

`architecturalStyle` → enum và `otherRooms: string[]` tôi vẫn xếp P1 (không gấp).

---

# 6. Danh sách P0 CUỐI để Founder duyệt

| # | Việc | Nguồn | Trạng thái |
|---|---|---|---|
| 1 | Enum `constructionScope` 4 giá trị mới + `constructionScopeNote` | Founder QĐ1 | ✅ đã duyệt, chờ nhãn UI |
| 2 | `briefReady = basicScore >= 75 && noBriefHardBlockers` | Founder QĐ2 | ✅ đã duyệt, chờ chốt `coreFunctionalNeeds` + tập Basic |
| 3 | Chia Score theo tầng brief/quantity/pricing (chỉ implement brief) | Founder QĐ2 | ✅ đã duyệt, chờ xác nhận shape |
| 4 | `budgetMin`/`budgetMax`/`budgetNote` | AI1 | Chờ xác nhận |
| 5 | `constructionArea` → `buildingFootprint` + `totalFloorArea` | Review 5.3 | Chờ xác nhận |
| 6 | Thêm `basementLevels` | Review 5.4 | Chờ Yes/No |
| 7 | Thêm `foundationType` (không tính Score) | Review 5.5 | Chờ xác nhận |
| 8 | `roofType` → enum | AI6 | Chờ xác nhận |
| 9 | `location` → province/district/addressDetail | Review 5.9 | Chờ Yes/No (ngay/hoãn) |
| — | Seed + reset DB dev | Founder QĐ3 | ✅ đã duyệt cách làm |

---

# 7. Câu hỏi chốt (tối thiểu cần trả lời để tôi lập task Sprint tiếp)

1. **Nhãn UI 4 gói scope** ở mục 1 có đúng không?
2. **`coreFunctionalNeeds`** = chỉ `bedrooms`, hay `bedrooms` + `bathrooms`? (mục 2.2)
3. **Tập Basic 9 field + ngưỡng 75%** (mục 2.3) chốt chưa?
4. **Shape 3 cờ** (mục 2.5) đủ chưa?
5. **P0 #6 `basementLevels`**: làm hay hoãn?
6. **P0 #9 tách `location`**: làm ngay hay hoãn tới Pricing?
7. **P0 #5, #7, #8** (tách totalFloorArea / foundationType / roofType enum): xác nhận làm.

---

# 8. Phạm vi & cam kết

- Task này **chỉ cập nhật proposal**, đúng "Next Step" của Founder.
- **Không có dòng code nào bị thay đổi.**
- Sau khi Founder duyệt danh sách P0 mục 6, tôi sẽ:
  1. Lập task implement (Goal / Scope / Out of Scope / Definition of Done — Rule 6).
  2. Trình task đó chờ duyệt.
  3. Chỉ code sau khi task được duyệt.
