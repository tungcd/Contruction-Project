# Completion Report — Milestone Estimate MVP (Feature 1-6)

**Ngày:** 2026-07-17

## Done

- **F1 Persist Estimate Draft** — lưu DB, load lại, không mất khi refresh.
- **F2 Estimate History** — nhiều version/project, `editedBy`, `updatedAt`, dropdown chọn lại bản cũ.
- **F3 Estimate Editor** — sửa quantity/unitPrice/note, amount tính lại ngay, sửa quantity mới đổi `user_confirmed`.
- **F4 Estimate Summary** — subtotal/section, tổng tiền, đếm dòng cần khảo sát/đo đạc, đếm dòng đã xác nhận.
- **F5 PriceBook CRUD** — tạo/sửa/nhân bản/chọn PriceBook khi tạo dự toán, không auth.
- **F6 Export Excel v1** — xuất `.xlsx` trực tiếp từ Draft đang xem (không bắt buộc lưu trước).

## Files

- Prisma: `schema.prisma` (+`EstimateDraft`, `PriceBook`, `PriceBookEntry`, `MaterialTier` enum) — đã `db:generate` + `db:push` lên Neon dev.
- Repository: `features/estimate/boqDraft.repository.ts`, `features/pricebook/{pricebook.repository,pricebook.schema}.ts`
- API: `api/projects/[id]/estimate-drafts/{route,[draftId]/route}.ts`, `api/pricebooks/{route,[id]/route,[id]/duplicate/route}.ts`, `api/estimate/export/route.ts`
- Lib: `lib/estimate/{persistence-types,excelExport}.ts`, `lib/http.ts` (assertUuid nhận message tuỳ chỉnh)
- Frontend: `services/{estimate,pricebook}.service.ts`, `features/estimate/components/{EstimateSectionTable,EstimateSummaryPanel}.tsx`, `features/estimate/estimate-view.ts`, `app/projects/[id]/estimate/page.tsx` (viết lại), `app/pricebooks/{page,[id]/page}.tsx` (mới), `app/page.tsx`/`WorkspaceHeader.tsx` (thêm link)
- Dependency mới: `exceljs`

## Verify

- `typecheck` + `build` (apps/web): PASS.
- Smoke test qua HTTP thật (project seed Đan Phượng): generate → save (v1) → save lại (v2, đúng thứ tự lịch sử) → list history đúng 2 bản → tạo/sửa/nhân bản PriceBook qua API thật → export Excel, round-trip đọc lại bằng `exceljs` xác nhận đúng sheet/section/tổng tiền (263,155,000đ khớp dữ liệu demo).
- Dọn dữ liệu test (2 PriceBook "test smoke") khỏi DB dev sau khi verify; giữ lại 2 version EstimateDraft (dữ liệu thật từ project seed, không phải rác).
- Server test chạy/dừng đúng PID, không đụng process khác (theo lệ đã thống nhất).

## Known Issues / Quyết định kỹ thuật tự chọn

- `EstimateSettings` KHÔNG có bảng riêng — vẫn dùng `DEFAULT_ESTIMATE_SETTINGS` khi generate; đơn giản hoá vì 6 feature không yêu cầu sửa Settings riêng.
- PriceBook Update thay `entries` bằng xoá hết + tạo lại (không diff từng dòng).
- `EstimateDraft.status` (`draft`/`confirmed`) có trong schema (theo Design M3-002) nhưng chưa có UI đổi trạng thái — chưa cần cho 6 feature này.
- DEMO_PRICE_BOOK vẫn là hằng số code (`sample-data/price-book.demo.ts`), KHÔNG có trong bảng `PriceBook` — dropdown chọn PriceBook ở trang Estimate mặc định "Bảng giá demo" khi không chọn gì, PriceBook thật do Founder tự tạo mới xuất hiện trong danh sách.
- Chưa test bằng trình duyệt thật (click/gõ tay) — verify bằng API thật + round-trip Excel, chưa xác nhận UX (dropdown, input, download) trên browser thật.
