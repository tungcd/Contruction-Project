# Completion Report — M3-004: Estimate Draft Review UI

**Trạng thái:** ĐÃ HOÀN THÀNH
**Ngày:** 2026-07-17
**Nguồn duyệt:** Approval commit `a1c5b7d` (M3-003 Founder Decision Applied), giao ticket M3-004

---

## 1. Tóm tắt

Đã thêm 1 trang UI cho phép Founder gọi `POST /api/estimate` hiện có (Ticket
M3-003), xem `EstimateDraft` dưới dạng bảng theo section, sửa `quantity`/
`unitPrice` trực tiếp trên UI và thấy `amount` cập nhật ngay — hoàn toàn ở
local state của trình duyệt, không đụng DB/Prisma/Rule Engine.

## 2. File đã thêm/sửa

**Mới:**
- `apps/web/src/services/estimate.service.ts` — gọi `POST /api/estimate`
- `apps/web/src/features/estimate/estimate-view.ts` — label/màu badge cho
  `quantitySource`/`confidence`, `formatVnd()`, `recomputeAmount()`
- `apps/web/src/features/estimate/components/EstimateSectionTable.tsx` —
  bảng 1 section (input sửa quantity/unitPrice, cột amount/nguồn/tin cậy/ghi chú)
- `apps/web/src/app/projects/[id]/estimate/page.tsx` — trang chính, nút
  "Tạo dự toán", banner cảnh báo `priceBookIsDemo`, giữ `EstimateDraft` ở
  `useState` cục bộ (không React Query cache, không DB)

**Sửa:**
- `apps/web/src/features/workspace/components/WorkspaceHeader.tsx` — thêm
  nút "Dự toán" (icon `Calculator`) cạnh nút "Tạo Project Brief" để vào
  trang mới từ trong dự án

## 3. Cách hoạt động

1. Founder mở dự án → bấm "Dự toán" trên header → vào `/projects/[id]/estimate`.
2. Bấm "Tạo dự toán" → gọi `estimateService.generate(project.requirement)` →
   `POST /api/estimate` (không gửi `settings`/`priceBook` → API tự dùng
   `DEFAULT_ESTIMATE_SETTINGS`/`DEMO_PRICE_BOOK` như M3-003 đã định).
3. Kết quả `EstimateDraft` lưu vào `useState` riêng của trang (KHÔNG phải
   React Query cache) — vì đây là bản nháp đang sửa tay, không phải dữ liệu
   đồng bộ với server.
4. Mỗi section render thành 1 bảng (`EstimateSectionTable`), sắp theo
   `section.order`.
5. Sửa ô "Khối lượng" → tính lại `amount = quantity × unitPrice` (null nếu
   thiếu 1 trong 2, đúng quy ước "không biết thì để trống" của M3-002) VÀ
   đổi `quantitySource` dòng đó thành `user_confirmed`.
6. Sửa ô "Đơn giá" → chỉ tính lại `amount`, **không đổi** `quantitySource`
   (đúng yêu cầu ticket: chỉ sửa quantity mới đánh dấu xác nhận).
7. Nếu `priceBookIsDemo === true` (luôn đúng với `DEMO_PRICE_BOOK`) → banner
   đỏ cảnh báo rõ "giá DEMO — KHÔNG dùng báo giá thật".

## 4. Đúng Out of Scope đã giao

- Không đụng Prisma/DB — `EstimateDraft` chỉ sống trong `useState` của trang,
  rời trang là mất (đúng tinh thần "chưa lưu DB" của M3-003/M3-004).
- Không xuất Excel, không có UI quản lý Price Book, không thêm rule mới,
  không gọi AI, không sửa `apps/web/src/lib/estimate/*` (Rule Engine giữ
  nguyên 100%).
- Không có auth (khớp hiện trạng toàn bộ MVP).

## 5. Verify đã chạy

- `npm run typecheck --workspace=apps/web`: PASS, không lỗi.
- `npm run build --workspace=apps/web`: PASS, route
  `/projects/[id]/estimate` lên đúng (5.14 kB, dynamic).
- Kiểm tra port 3000 trống trước khi bật server test (rút kinh nghiệm sự cố
  lần trước), start `next start` (bản build production vừa tạo) bằng
  `nohup ... &`, xác nhận đúng PID thực sự lắng nghe cổng 3000 qua
  `netstat` (không tin PID job của shell), dừng đúng PID đó bằng
  `Stop-Process -Id <PID>` sau khi xong — không đụng process nào khác.
- Gọi `GET /api/projects` lấy project seed thật ("Anh Hùng - Nhà phố Đan
  Phượng (Demo)"), lấy `requirement` thật của nó, gọi
  `POST /api/estimate` qua HTTP thật (không phải unit test) → nhận đúng
  `EstimateDraft`: `priceBookId="demo-price-book"`, `priceBookIsDemo=true`,
  5 section (`structure, construction, finishing, plumbing, electrical`),
  `order` liền mạch 1–5 (`sanitary_equipment` bị loại đúng vì
  `constructionScope` của project này không phải `turnkey_with_interior`).
- `curl` trang `/projects/[id]/estimate` với id thật → HTTP 200, không có
  `__next_error__`/digest lỗi, SSR shell đúng cấu trúc (hiện state loading
  ban đầu "Đang tải..." trước khi client-side query chạy — đúng hành vi kỳ
  vọng, giống trang Brief đã có).

## 6. Giới hạn đã biết / KHÔNG kiểm chứng được

- **Chưa test bằng trình duyệt thật (click chuột, gõ tay vào ô input).**
  Session này không có công cụ trình duyệt/headless (Playwright/Puppeteer
  không có trong repo, không có browser tool trong môi trường). Đã verify
  bằng: typecheck, build, gọi API thật qua HTTP với dữ liệu seed thật, và
  đọc SSR HTML output — nhưng chưa tận mắt xác nhận: bảng hiển thị đúng khi
  hydrate, gõ số vào input có cập nhật `amount`/badge ngay trên màn hình hay
  không, banner demo có hiện đúng vị trí/màu hay không. Nên Founder tự bấm
  thử ít nhất 1 lần trên trình duyệt trước khi coi UI này "xong".
- Input `quantity`/`unitPrice` dùng `<input type="number">` gõ tay — không
  có validate min/max, không chặn số âm. Chấp nhận được ở mức prototype
  review (ticket không yêu cầu validate).
- Rời trang (refresh/điều hướng) là mất toàn bộ chỉnh sửa — đúng chủ ý (Out
  of Scope: không lưu DB), nhưng cần Founder biết trước khi thao tác nhiều.

## 7. Câu hỏi cần Founder xác nhận

Không có quyết định nghiệp vụ nào cần hỏi thêm — ticket đã đủ rõ, chỉ có 1
lựa chọn kỹ thuật tôi tự quyết vì không ảnh hưởng nghiệp vụ: dùng
`useState` cục bộ (không phải Zustand store như `analysis-store.ts`) để giữ
`EstimateDraft` đang sửa, vì phạm vi chỉ 1 trang, không cần mang state này
sang trang khác như `assumptions` đã làm.

Không code gì thêm ngoài phạm vi trên. Dừng ở đây, chờ Founder duyệt.
