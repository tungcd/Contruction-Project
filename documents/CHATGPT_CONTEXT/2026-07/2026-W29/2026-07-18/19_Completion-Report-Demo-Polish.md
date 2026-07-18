# Completion Report — Demo Polish (Task 1-4)

**Ngày:** 2026-07-18

## Task 1 — Estimate Confirmation UI

- `boqDraft.repository.ts`: thêm `confirmDraft(projectId, draftId)` —
  set `status: "confirmed"`, không tự bỏ xác nhận version khác (mỗi
  version độc lập, Proposal luôn dùng bản confirmed MỚI NHẤT).
- API: `PATCH /api/projects/:id/estimate-drafts/:draftId` (`{status:
  "confirmed"}`).
- `estimateService.confirmDraft()`.
- UI: nút "Xác nhận" trên trang Estimate, disabled khi chưa Lưu HOẶC có
  thay đổi chưa lưu (`isDirty` — xem Task 4), badge "Đã xác nhận" khi
  version đang xem đã confirmed.

## Task 2 — Contractor Profile

- Prisma model `ContractorProfile` (singleton — luôn thao tác dòng đầu
  tiên, tạo mới nếu chưa có). Đã `prisma db push` thành công.
- Field: companyName, logoUrl, address, phone, email, website,
  warrantyNote, defaultProposalValidityDays, defaultPaymentPlan (Json).
- Repository + API (`GET/PUT /api/contractor-profile`) + service.
- Trang Settings `/settings/contractor` (antd Form + `Form.List` cho
  payment plan), link từ Dashboard.
- `lib/proposal/types.ts`/`builder.ts` cập nhật: bỏ `ProposalSettings`
  riêng (dư thừa) — `validityDays`/`paymentPlan` giờ đọc thẳng từ
  `ContractorProfile.defaultProposalValidityDays`/`defaultPaymentPlan`.
  Thêm `Proposal.warrantyNote` (trước đó bị loại khỏi Domain Model vì
  chưa có nguồn — nay có).
- Trang Proposal: bỏ `DEMO_CONTRACTOR` hardcode, fetch thật từ API.

## Task 3 — Proposal PDF

- CSS in riêng (`@media print`, scope `.proposal-print-area`): bỏ
  shadow/bo góc Card, `break-inside: avoid` cho từng Card, margin trang
  16mm. Không thêm thư viện PDF — vẫn dùng `window.print()`.

## Task 4 — Demo Review

Xem `18_Demo-Polish-Report.md`. 2 lỗi thật đã sửa ngay (thiếu nav
Proposal trong WorkspaceHeader; xác nhận Estimate có thể bỏ qua thay đổi
chưa lưu). Còn lại là polish nhỏ, không chặn demo.

## Verify

- `npx tsc --noEmit` (apps/web): PASS.
- `npx next build`: PASS — routes mới (`/api/contractor-profile`,
  `/settings/contractor`) compile sạch.
- `npm run poc:proposal`: 4/4 PASS (đã cập nhật fixture/assertion khớp
  `ContractorProfile` mới, không còn `ProposalSettings` riêng).
- `npx prisma db push`: đã áp dụng model `ContractorProfile` lên Neon
  dev DB.

## Files

- Mới: `apps/web/src/features/contractor/contractorProfile.repository.ts`,
  `apps/web/src/app/api/contractor-profile/route.ts`,
  `apps/web/src/services/contractorProfile.service.ts`,
  `apps/web/src/app/settings/contractor/page.tsx`,
  `documents/CHATGPT_CONTEXT/.../18_Demo-Polish-Report.md`.
- Sửa: `apps/web/prisma/schema.prisma` (model `ContractorProfile`),
  `apps/web/src/features/estimate/boqDraft.repository.ts` (`confirmDraft`),
  `apps/web/src/app/api/projects/[id]/estimate-drafts/[draftId]/route.ts` (PATCH),
  `apps/web/src/services/estimate.service.ts` (`confirmDraft`),
  `apps/web/src/app/projects/[id]/estimate/page.tsx` (nút Xác nhận + `isDirty`),
  `apps/web/src/lib/proposal/{types,builder}.ts`,
  `apps/web/src/app/projects/[id]/proposal/page.tsx`,
  `apps/web/src/features/proposal/components/ProposalView.tsx`,
  `apps/web/src/features/workspace/components/WorkspaceHeader.tsx` (nav Proposal),
  `apps/web/src/app/page.tsx` (nav Settings),
  `apps/web/src/app/globals.css` (print CSS),
  `apps/web/scripts/proposal-poc.ts`.

## Next

Founder tự click qua luồng demo thật 1 lượt (đặc biệt thử in Proposal
villa — nhiều dòng nhất) trước khi demo khách hàng thật, theo đúng
khuyến nghị ở Demo Polish Report.
