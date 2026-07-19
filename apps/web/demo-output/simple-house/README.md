# Simple House — Concept Drawing Artifacts (Stage 1.6)

Sinh bởi `npm run drawing:artifacts`. Template: `townhouse-single-floor-v1`.
Geometry validation: PASSED.
Warnings (không chặn, vẫn PASS): Phòng "living" (living) tỷ lệ khung hình 2.10:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được. | Phòng "kitchen" (kitchen) tỷ lệ khung hình 2.94:1 — ngoài khoảng ưu tiên (tối đa 2.2:1), vẫn trong giới hạn chấp nhận được.

## Files

- `simple-house-layout-graph.json` — LayoutGraph (tô-pô, nodes/edges).
- `simple-house-geometry.json` — Geometry (toạ độ polygon, mét).
- `simple-house-drawing-package.json` — Drawing Document đầy đủ (rooms/walls/doors/dimensions/titleBlock/warnings).
- `simple-house-floor-plan.svg` — SVG thô, mở trực tiếp bằng trình duyệt hoặc image viewer bất kỳ để xem.
- `simple-house-floor-plan-print.html` — mở bằng trình duyệt, dùng "In / Save as PDF" (Ctrl+P) để tự tạo file PDF/ảnh chụp màn hình.

## Vì sao không có sẵn file .png/.pdf

Môi trường chạy script này không có trình duyệt/display — không thể tự
chụp ảnh hay xuất PDF thật (đúng quyết định đã chốt: PDF = in chuỗi SVG
qua trình duyệt, không dựng renderer PDF riêng). Mở
`simple-house-floor-plan-print.html` bằng trình duyệt bất kỳ và
Ctrl+P → Save as PDF để có file PDF thật kiểm tra bằng mắt.
