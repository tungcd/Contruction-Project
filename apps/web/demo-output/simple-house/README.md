# Simple House Demo — Concept Drawing Artifacts

Sinh bởi `npm run drawing:artifacts`. Template: `townhouse-multi-floor-v1`.
Số tầng / sheet: 1.
Geometry validation: PASSED.
Warnings (không chặn, vẫn PASS): [Tầng 0] Phòng "living" (living) tỷ lệ khung hình 2.10:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được. | [Tầng 0] Phòng "bedroom-1" (bedroom) tỷ lệ khung hình 1.90:1 — ngoài khoảng ưu tiên (tối đa 1.5:1), vẫn trong giới hạn chấp nhận được.
Staircase: không áp dụng (nhà 1 tầng).

## Files

- `simple-house-layout-graphs.json` — LayoutGraph MỖI TẦNG (tô-pô, nodes/edges).
- `simple-house-geometry.json` — Geometry mọi tầng (toạ độ polygon, mét).
- `simple-house-drawing-package.json` — Drawing Document đầy đủ (rooms/walls/doors/windows/dimensions/titleBlock/warnings, 1 sheet/tầng).
- `simple-house-staircase-core.json` — Staircase Core đã xác nhận thẳng hàng (null nếu 1 tầng).
- `simple-house-floor-plan-{N}.svg` — SVG thô từng tầng (N = index sheet, 0 = tầng trệt), mở trực tiếp bằng trình duyệt hoặc image viewer.
- `simple-house-floor-plan-print.html` — mở bằng trình duyệt, dùng "In / Save as PDF" (Ctrl+P) — mỗi tầng tự động sang 1 trang riêng.

## Vì sao không có sẵn file .png/.pdf

Môi trường chạy script này không có trình duyệt/display — không thể tự
chụp ảnh hay xuất PDF thật (đúng quyết định đã chốt: PDF = in chuỗi SVG
qua trình duyệt, không dựng renderer PDF riêng). Mở
`simple-house-floor-plan-print.html` bằng trình duyệt bất kỳ và
Ctrl+P → Save as PDF để có file PDF thật kiểm tra bằng mắt.
