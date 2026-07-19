# Townhouse Demo — Concept Drawing Artifacts

Sinh bởi `npm run drawing:artifacts`. Template: `townhouse-multi-floor-v1`.
Số tầng / sheet: 3.
Geometry validation: PASSED.
Warnings (không chặn, vẫn PASS): [Tầng 0] Phòng "wc-1" (wc) tỷ lệ khung hình 2.50:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được. | [Tầng 0] Phòng "wc-1" (wc) diện tích 6.40m² — ngoài khoảng ưu tiên (tối đa 6m²), vẫn trong giới hạn chấp nhận được. | [Tầng 1] Phòng "wc-2" (wc) tỷ lệ khung hình 2.50:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được. | [Tầng 1] Phòng "wc-2" (wc) diện tích 6.40m² — ngoài khoảng ưu tiên (tối đa 6m²), vẫn trong giới hạn chấp nhận được. | [Tầng 2] Phòng "wc-3" (wc) tỷ lệ khung hình 2.50:1 — ngoài khoảng ưu tiên (tối đa 1.8:1), vẫn trong giới hạn chấp nhận được. | [Tầng 2] Phòng "wc-3" (wc) diện tích 6.40m² — ngoài khoảng ưu tiên (tối đa 6m²), vẫn trong giới hạn chấp nhận được. | [Tầng 2] Phòng "balcony-1" (balcony) tỷ lệ khung hình 3.89:1 — ngoài khoảng ưu tiên (tối đa 3:1), vẫn trong giới hạn chấp nhận được.
Staircase: thẳng hàng ở các tầng [0, 1, 2], rộng 2.00m.

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
