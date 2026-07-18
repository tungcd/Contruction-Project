# Completion Report — M3-008: Rule Catalog Refactor (Business Code)

**Ngày:** 2026-07-18

## Done

- Thiết kế Business Code taxonomy (`domain.subject.variant`, vd
  `foundation.concrete.m250`, `masonry.wall_110`, `sanitary.toilet`).
- Refactor toàn bộ Rule Engine: đổi ~28 mã nội bộ (`structure.*`,
  `construction.*`, `finishing.*`) sang Business Code mới, khớp thẳng với
  itemCode của Standard PriceBook — không qua lớp alias.
- Tách 1 số dòng gộp thành nhiều dòng vì PriceBook định giá riêng từng cấu
  kiện (không tách thì không bao giờ tra được giá dưới cơ chế lookup
  BusinessCode+Tier không fallback): trát/sơn trong-ngoài (2→4 dòng, giữ
  nguyên tổng công thức M3-002), điện/nước theo điểm thay vì theo mét (khớp
  đúng cách chủ thầu báo giá thực tế), ván khuôn/cốt thép cột-dầm-sàn, bể
  nước/bể phốt.
- `resolveUnitPrice()` (PriceBook lookup) giữ nguyên — đã đúng yêu cầu
  "BusinessCode + Tier, không fuzzy" từ trước, không cần sửa.
- Refactor + import Standard PriceBook V1 (80 dòng): map itemCode cũ
  (`FND_001`...) sang Business Code mới, bỏ hẳn mã cũ (không migration
  thêm cột chỉ để giữ mã tham khảo).
- Cập nhật `DEMO_PRICE_BOOK` (bảng giá mặc định) khớp toàn bộ mã mới —
  tránh vỡ hành vi mặc định khi không chọn PriceBook nào.

## Files

- Sửa: `structurePlaceholders.ts`, `mepPlaceholders.ts`, `rules/finishing.ts`,
  `rules/sanitaryEquipment.ts`, `sample-data/price-book.demo.ts`
- Mới: `apps/web/scripts/import-standard-pricebook.mjs` (script import,
  idempotent theo tên PriceBook)
- Không đổi: `priceBook.ts`, `sections.ts`, `types.ts`, Prisma schema (không
  cần migration — chỉ đổi giá trị string itemCode, không đổi field/entity)

## Verify

- typecheck: PASS. (Build production không chạy lần này vì dev server của
  Founder đang chạy live trên port 3000 — dùng chính server đó để verify
  qua HTTP thật, mạnh hơn build tĩnh.)
- Import script chạy 2 lần: lần 2 update đúng PriceBook cũ (cùng id, vẫn 80
  entries) — xác nhận idempotent, không tạo trùng.
- Generate Estimate thật (project seed Đan Phượng) với Standard PriceBook
  vừa import: **24/29 dòng có giá tự động** (trước refactor: 0/28).
- Soi tay các dòng tách (masonry.wall_110, plaster.interior/exterior_wall,
  paint.interior/exterior, flooring.tile_600x600): quantity và unitPrice
  đúng, tổng plaster/paint interior+exterior = đúng công thức gộp cũ
  (không đổi Business Rule, chỉ tách hiển thị).
- Generate lại với DEMO_PRICE_BOOK mặc định (không chọn PriceBook): vẫn
  chạy đúng, 14/29 dòng có giá (không regressions).

## Known Issues (đã ghi rõ trong code + không tự sửa)

- **5 dòng không tự tra được giá từ Standard PriceBook** — đều là mismatch
  unit/nghiệp vụ thật, không phải lỗi: `door.bedroom` (đo theo bộ, PriceBook
  định giá theo m2 — cần đổi công thức R3 nếu muốn khớp, là Business Rule
  change, cần Founder duyệt), `stair.step_count` (đo theo bậc, PriceBook chỉ
  có giá theo m3 bê tông — đúng ví dụ cảnh báo của ticket), `foundation.wall_masonry`/
  `foundation.tie_beam`/`masonry.wall_area_measured` (PriceBook chưa có entry
  tương ứng).
- Đã KHÔNG thêm rule mới cho `door.main`/`door.wc`/`electrical.switch_device`...
  dù Standard PriceBook có sẵn — đúng phạm vi "refactor cái đã có", không mở
  rộng Rule Catalog (Founder nêu rõ đây là việc "tương lai").
- `masonry.wall_110`/`flooring.tile_600x600`: chọn 1 phương án mặc định khi
  PriceBook có ≥2 lựa chọn (tường 110 vs 220, gạch 600 vs 800) — giả định đã
  ghi rõ trong code, không phải quyết định ẩn.
