# Townhouse Demo — Concept Drawing Artifacts

Sinh bởi `npm run drawing:artifacts`. Template: `townhouse-multi-floor-v1`.
Số tầng / sheet: 3.
Geometry validation: PASSED.

Staircase: thẳng hàng ở các tầng [0, 1, 2], rộng 5.00m.

## Files

- `townhouse-layout-graphs.json` — LayoutGraph MỖI TẦNG (tô-pô, nodes/edges).
- `townhouse-geometry.json` — Geometry mọi tầng (toạ độ polygon, mét).
- `townhouse-drawing-package.json` — Drawing Document đầy đủ (rooms/walls/doors/windows/dimensions/titleBlock/warnings, 1 sheet/tầng).
- `townhouse-staircase-core.json` — Staircase Core đã xác nhận thẳng hàng (null nếu 1 tầng).
- `townhouse-floor-plan-{N}.svg` — SVG thô từng tầng (N = index sheet, 0 = tầng trệt), mở trực tiếp bằng trình duyệt hoặc image viewer.
- `townhouse-floor-plan-print.html` — mở bằng trình duyệt, dùng "In / Save as PDF" (Ctrl+P) — mỗi tầng tự động sang 1 trang riêng.

## Vì sao không có sẵn file .png/.pdf

Môi trường chạy script này không có trình duyệt/display — không thể tự
chụp ảnh hay xuất PDF thật (đúng quyết định đã chốt: PDF = in chuỗi SVG
qua trình duyệt, không dựng renderer PDF riêng). Mở
`townhouse-floor-plan-print.html` bằng trình duyệt bất kỳ và
Ctrl+P → Save as PDF để có file PDF thật kiểm tra bằng mắt.
