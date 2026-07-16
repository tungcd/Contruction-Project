# Implementation Task — Apply Frozen Data Model v0.2

**Ngày:** 2026-07-16
**Người soạn:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT để **phê duyệt trước khi code**
**Trạng thái:** CHỜ DUYỆT. Theo Rule 6, task này chờ approve rồi mới implement.
**Tiền đề:** `03-Data-Model.md` đã đóng băng v0.2 (2026-07-16).

---

# Goal

Đưa toàn bộ code khớp với Data Model v0.2 đã đóng băng, và implement `briefReady`
như một business rule độc lập với Requirement Score.

Kết thúc task: app chạy được với schema mới, `briefReady` hoạt động đúng quy tắc
Founder chốt, regression xanh trên cả mock và openai, DB dev đã reset + có project demo.

---

# Scope (những gì SẼ làm)

## 1. `packages/shared-types` — nền tảng

- Viết lại `RequirementSchema` theo Data Model v0.2:
  - `project`: bỏ `location`; thêm `province`, `district`, `addressDetail`,
    `buildingTypeNote`; `projectType += extension`; `buildingType += level4, shophouse`.
  - `site`: bỏ `constructionArea`; thêm `buildingFootprint`, `totalFloorArea`.
  - `building`: thêm `basementLevels`, `foundationType`, `roofTypeNote`,
    `architecturalStyleNote`; `roofType` và `architecturalStyle` → enum.
  - `household`: `elderly` → `hasElderly`.
  - `functional`: thêm `otherRooms: string[]`.
  - `budget`: bỏ `budget`; thêm `budgetMin`, `budgetMax`, `budgetNote`,
    `constructionScopeNote`; `constructionScope` = 4 enum mới.
- Thêm enum: roofType, architecturalStyle, foundationType, constructionScope (mới).
- Thêm type `Readiness` + `BriefReadiness { ready, missing }` vào `ProjectDetail`
  và `AnalyzeMessageResult`.

## 2. `scoring.ts` — Score (hiển thị) tách khỏi Readiness (business rule)

- Cập nhật `TRACKED_FIELDS`: thêm `province`, `district`, `totalFloorArea`,
  `basementLevels`; đổi `budget` → có nếu `budgetMin||budgetMax`; đổi
  `constructionArea` → `totalFloorArea`. KHÔNG đưa `foundationType` vào Score.
- Thêm `computeBriefReady(requirement): BriefReadiness` — đúng quy tắc mục 5.3.1.
- Thêm `computeToConfirm(requirement)` — budget/scope/totalFloorArea/foundationType.

## 3. Lớp AI (`lib/ai`)

- `schemas/openai-extract.ts`: đồng bộ schema strict với v0.2.
- `prompts/extract-requirement.ts`: dạy AI budget min/max, 4 gói scope,
  tách province/district, phân biệt `buildingFootprint` vs `totalFloorArea`.
- `prompts/generate-brief.ts`: cập nhật field mới (nếu đụng — brief AI thuộc Sprint 4,
  chỉ sửa cho khớp field, không xây luồng mới).
- `provider/MockProvider.ts`: cập nhật regex theo field mới; ghi `*Note`.
- `parsers/normalize.ts`: bỏ bảng dịch `roofType` (đã là enum); giữ dịch
  `architecturalStyle` chỉ nếu cần map giá trị model trả về enum hợp lệ.
- `question-templates.ts`: cập nhật key field đã đổi tên.

## 4. Server (`features` + route)

- `project.repository.ts`, `analyze.service.ts`: map field mới, gắn `readiness`
  vào response, dùng `sanitizeText` như cũ.

## 5. UI

- `requirement-view.ts`: map enum → nhãn UI (mục 5.3.2), hiển thị budget dạng dải,
  thêm nhóm field mới.
- Workspace: hiển thị trạng thái `briefReady` + danh sách `missing` rõ ràng
  (tách khỏi con số Score).
- Brief page: thêm mục "Thông tin cần xác nhận" từ `toConfirm`.

## 6. Database — reset có kiểm soát (đúng 4 điều kiện Founder)

- Tạo fixture `apps/web/prisma/seed-fixtures/dan-phuong.ts` từ hội thoại test hiện có.
- Script `npm run db:seed` dựng lại 1 project demo Đan Phượng đã phân tích.
- Script reset in cảnh báo rõ ràng trước khi xoá.
- **Chốt chặn an toàn:** nếu DB có project không thuộc danh sách seed → dừng, không xoá.
- Cập nhật README ghi rõ chính sách reset chỉ cho DB dev.

## 7. Regression

- Sửa case `budget` (dải → min/max) và `constructionScope` (4 gói mới).
- Thêm case: `briefReady` true/false theo hard blockers; `totalFloorArea` vs
  `buildingFootprint` không lẫn; `province`/`district` tách đúng.
- Mục tiêu: **xanh trên cả `mock` và `openai`**.

---

# Out of Scope (KHÔNG làm trong task này)

- `quantityReady`, `pricingReady`: chỉ để **chỗ trống kiến trúc**, không viết logic.
- **Project Brief sinh bằng AI**: thuộc Sprint 4, không xây luồng mới ở đây.
- Migration tương thích ngược: Founder cho phép reset, không làm.
- Export PDF, Voice, OCR, Auth... (Out of Scope MVP theo `01-Product-Spec` mục 9).
- Sửa `02-UI-Flow.md` mục 12 & 17 (ngưỡng/hiển thị): **thuộc ChatGPT**, tôi chỉ
  implement theo mô tả; nếu cần đổi tài liệu UI sẽ báo.

---

# Definition of Done

- [ ] `RequirementSchema` v0.2 + enum + `Readiness` type hoàn tất trong shared-types.
- [ ] `computeBriefReady` đúng quy tắc mục 5.3.1 (verify bằng regression).
- [ ] Score cập nhật, độc lập với Readiness.
- [ ] AI layer (prompt + mock + normalize) khớp schema mới.
- [ ] UI hiển thị nhãn tiếng Việt, trạng thái briefReady, mục "cần xác nhận".
- [ ] `npm run typecheck` + `npm run build` xanh.
- [ ] `npm run test:regression` **xanh trên cả mock và openai**.
- [ ] DB dev reset xong: fixture đã lưu, có project demo, chốt chặn an toàn hoạt động.
- [ ] `.env` không lọt git; không secret trong diff.
- [ ] Demo được kịch bản `02-UI-Flow` mục 18 đầu-cuối.

---

# Cách chia commit (đề xuất)

Schema đổi làm cả monorepo không typecheck cho tới khi mọi consumer cập nhật xong,
nên **làm trong 1 chuỗi liền mạch**, chia commit theo lớp để dễ review:

1. `shared-types` + `scoring` (nền + readiness)
2. AI layer (prompt + mock + normalize + schema)
3. server + UI
4. seed/reset DB
5. regression + verify

---

# Rủi ro & lưu ý

- **Mất dữ liệu test:** đã được Founder cho phép; fixture Đan Phượng được giữ lại trước reset.
- **AI cần internet + ~7–14s/call:** không đổi so với hiện tại.
- **Nhãn UI scope/foundation:** dùng đúng bảng Founder chốt; nếu sai thực tế thị trường,
  sửa nhãn ở `requirement-view.ts` không đụng schema.
- Ước lượng: ~9–11 file code + 2 script + regression. Gọn trong 1 task, không tách sprint.

---

# Sau khi duyệt

Founder / ChatGPT duyệt task này → tôi implement theo đúng Scope, báo cáo kết quả
(typecheck/build/regression + ảnh chụp luồng demo) để review trước khi coi là Done.

**Chưa code cho tới khi task này được duyệt.**
