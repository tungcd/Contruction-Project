# Completion Report — Proposal MVP (Prototype)

**Ngày:** 2026-07-18
**Khung diễn đạt:** current recommendation, có thể chỉnh khi demo với
contractor thật cho bằng chứng ngược.

## Compiler/Builder Implementation Summary

- `apps/web/src/lib/proposal/types.ts` — Domain Model đúng như
  `16_Architecture-Proposal-MVP.md` mục 3 (không thêm field ngoài đã
  thiết kế).
- `apps/web/src/lib/proposal/builder.ts` —
  `buildProposal(requirement, estimateDraft, estimateStatus, customer, contractorInfo, settings)`,
  Pure Function, không gọi AI, không tính lại Estimate.
- **Explicit Precondition**: throw `ProposalNotReadyError` nếu
  `requirement.status !== "confirmed"` HOẶC `estimateStatus !==
  "confirmed"` — không sinh Proposal một phần.
- Tái dùng trực tiếp (không viết lại): `buildCoreSections()`,
  `buildScopeSection()` (từ Brief), `buildEstimateSummary()` (từ
  Estimate) — đúng kế hoạch review ở mục 1 tài liệu Architecture.

## Fixture Summary

Không tạo file `expected-proposal.json` riêng — vì 3/5 phần của
Proposal chỉ gọi lại hàm đã có sẵn (brief-view/estimate-view), hand-chép
lại output của chúng sẽ tạo thêm một nơi phải giữ đồng bộ với chính
source code (rủi ro desync đã tránh nhiều lần trong dự án). Thay vào đó
tái dùng 3 Requirement fixture đã có
(`packages/shared-types/fixtures/constraint/{simple-house,townhouse,villa}`),
chạy qua `buildEstimateDraft()` (đã có) rồi `buildProposal()` (mới), và
assert có mục tiêu vào đúng phần MỚI (assumptions/exclusions/timeline/
validity/precondition).

## Manual POC Findings

`npm run poc:proposal` (`apps/web/scripts/proposal-poc.ts`, chạy bằng
`ts-node` transpile-only + `tsconfig-paths` — xem `scripts/register.cjs`,
không cần dev server):

```
Proposal Builder — Manual POC (3 fixtures)

  PASS  simple-house
  PASS  townhouse
  PASS  villa
  PASS  precondition (Requirement draft bị chặn đúng)

4/4 pass
```

Kiểm tra: `exclusions` khớp chính xác `excludedRooms`, `timeline`
pass-through nguyên vẹn, `assumptions` chỉ xuất hiện đúng khi có hạng
mục needs_survey/needs_measurement, `validity.validUntil` = generatedAt
+ 30 ngày chính xác, `paymentPlan` mặc định rỗng, và Requirement chưa
`confirmed` bị chặn đúng loại lỗi.

## Discovered Failure Modes / Cần làm rõ

- Không phát hiện giới hạn nào của Domain Model cần sửa.
- **`ContractorProfile` hiện hardcode trong page** (`DEMO_CONTRACTOR`) —
  chưa có màn hình Settings hồ sơ nhà thầu. Đây là giới hạn đã biết
  trước (task đã loại "Settings" khỏi phạm vi Proposal MVP), không phải
  bug — chỉ cần Founder biết để sửa tay trước khi demo khách thật.
- **Estimate Engine chưa có action "Xác nhận" trên UI** — giống tình
  huống Requirement, `EstimateDraftRecord.status` đã có sẵn trong schema
  nhưng chưa có nút bấm chuyển "draft" → "confirmed" trên trang Estimate
  Editor. Trang Proposal hiện xử lý đúng (báo "chưa có bản Đã xác nhận"
  nếu không tìm thấy), nhưng để demo end-to-end cần bổ sung action này ở
  trang Estimate — ngoài phạm vi Proposal MVP, cần ticket riêng.
- `ts-node` + `tsconfig-paths` hoá ra đã có sẵn trong node_modules
  (transitive, không phải dependency trực tiếp của dự án) — dùng được
  cho Manual POC nhưng chưa khai báo tường minh trong `package.json`
  devDependencies. Nên thêm tường minh nếu muốn script này chạy ổn định
  lâu dài (hiện tại hoạt động, nhưng phụ thuộc ẩn).

## Files

- Mới: `apps/web/src/lib/proposal/{types,builder}.ts`,
  `apps/web/src/features/proposal/components/ProposalView.tsx`,
  `apps/web/src/app/projects/[id]/proposal/page.tsx`,
  `apps/web/scripts/{proposal-poc.ts,register.cjs,tsconfig.script.json}`.
- Sửa: `apps/web/package.json` (script `poc:proposal`).

## Verify

- `npx tsc --noEmit` (apps/web): PASS.
- `npm run poc:proposal`: 4/4 PASS.
- `npx next build`: PASS — route `/projects/[id]/proposal` compile được
  (3.69 kB), không lỗi prerender.

## Next

- Bổ sung action "Xác nhận Estimate Draft" trên UI (chặn Proposal end-
  to-end demo hiện tại).
- Khai báo tường minh `ts-node`/`tsconfig-paths` vào devDependencies nếu
  giữ pattern Manual POC này cho các module sau.
- Excel Export MVP (đã ✅ có sẵn từ Milestone Estimate MVP — không cần
  làm lại, chỉ cần đánh giá độ khớp với 2 file mẫu thật nếu Founder muốn
  nâng chất lượng demo).
