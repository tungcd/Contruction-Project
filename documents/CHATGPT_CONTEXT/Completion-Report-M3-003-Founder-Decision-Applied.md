# Completion Report — Áp dụng Founder Decision cho M3-003

**Ngày:** 2026-07-17
**Người thực hiện:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Nguồn duyệt:** Founder Decision (approve toàn bộ 5 quyết định trong
`Completion-Report-M3-003-Estimate-Engine.md`, kèm 2 yêu cầu code + 1 ghi
chú tech debt)
**Trạng thái:** Đã áp dụng xong. Commit `a1c5b7d`.

---

# 1. Tóm tắt

Founder duyệt cả 5 quyết định tôi tự đưa ra ở bản M3-003 trước, kèm 2 việc
code cụ thể và xác nhận 3 điểm là **quyết định chốt** (không còn là câu hỏi
mở). Đã áp dụng đầy đủ, verify lại, commit.

---

# 2. Đối chiếu yêu cầu ↔ đã làm

| # | Founder yêu cầu | Đã làm |
|---|---|---|
| 1 | Giữ `POST /api/estimate` làm entrypoint công khai của prototype | ✅ Không đổi gì — đã đúng từ đầu, chỉ thêm 1 dòng comment ghi rõ đây là quyết định chính thức |
| 2 | Bỏ hẳn `air_conditioning` khỏi MVP, chuyển backlog | ✅ Đã bỏ từ bản trước; cập nhật comment ở `sections.ts` từ "cần xác nhận" → "Founder Decision — CHỐT, chuyển backlog" |
| 3 | Bỏ `coveragePercent`, khái niệm chưa rõ, định nghĩa lại sau khi có case thật | ✅ Đã không tồn tại trong code từ M3-003 ban đầu — không cần sửa gì thêm, chỉ xác nhận đúng hướng |
| 4 | Giữ cửa phòng ngủ là 1 dòng gộp (kèm khoá + phụ kiện) | ✅ Đã đúng từ bản trước; cập nhật comment ở `rules/finishing.ts` (Rule R3) từ "lựa chọn tạm" → "Founder Decision — CHỐT" |
| 5 | Đổi tên `SamplePriceBook` → `DemoPriceBook`, thêm `isDemo=true` để tránh dùng nhầm production | ✅ Đổi tên file + export; thêm field `isDemo` vào `PriceBook`; **echo lên cả `EstimateDraft.priceBookId`/`priceBookIsDemo`** để hiện ngay trong JSON output, không cần lục vào PriceBook mới biết (xem mục 4) |
| — | Tech debt: cân nhắc Rule Catalog khai báo (config-driven) trong tương lai — **KHÔNG refactor ở Milestone 3** | ✅ Ghi chú rõ trong `engine.ts`, nhấn mạnh "KHÔNG refactor trong Milestone 3" để không ai (kể cả phiên làm việc sau) hiểu nhầm là việc cần làm ngay |

---

# 3. Chi tiết thay đổi code

| File | Thay đổi |
|---|---|
| `lib/estimate/types.ts` | `PriceBook` thêm `isDemo: boolean`; `EstimateDraft` thêm `priceBookId`, `priceBookIsDemo`; sửa comment `SectionCode`/`air_conditioning` |
| `lib/estimate/sample-data/price-book.sample.ts` → **`price-book.demo.ts`** | Đổi tên file (git mv, giữ lịch sử); export `SAMPLE_PRICE_BOOK` → `DEMO_PRICE_BOOK`; thêm `isDemo: true` |
| `lib/estimate/schema.ts` | `PriceBookInputSchema` thêm `isDemo: z.boolean().default(false)` — PriceBook thật Founder tự gửi không cần khai báo field này |
| `lib/estimate/engine.ts` | `buildEstimateDraft()` echo thêm `priceBookId`, `priceBookIsDemo` vào output; thêm ghi chú tech debt Rule Catalog |
| `lib/estimate/sections.ts` | Sửa comment `isSectionEnabled` — `air_conditioning` là quyết định chốt, không phải gap tạm |
| `lib/estimate/rules/finishing.ts` | Sửa comment Rule R3 — gộp khoá cửa là quyết định chốt |
| `app/api/estimate/route.ts` | Cập nhật import theo tên mới `DEMO_PRICE_BOOK` |

**Không sửa file nào ngoài module `lib/estimate/` và route `api/estimate`** —
không ảnh hưởng Requirement/Brief/Dashboard.

---

# 4. Verify — bằng chứng thật, không chỉ đọc code

```
npm run typecheck -w apps/web     ->  PASS
npm run build -w apps/web         ->  PASS (route /api/estimate vẫn có mặt)
```

Gọi thật `POST /api/estimate` với Requirement đầy đủ (không mock):

```json
{
  "priceBookId": "demo-price-book",
  "priceBookIsDemo": true,
  "sections": [
    { "order": 1, "code": "structure", ... },
    { "order": 2, "code": "construction", ... },
    { "order": 3, "code": "finishing", ... },
    { "order": 4, "code": "plumbing", ... },
    { "order": 5, "code": "electrical", ... }
  ]
}
```

Xác nhận: `priceBookIsDemo: true` hiện **ngay ở tầng ngoài cùng** của JSON —
đúng mục đích Founder yêu cầu (không cần đọc sâu vào PriceBook mới biết đây
là giá demo). Thứ tự `order` vẫn liền mạch 1-5 (`sanitary_equipment` đúng bị
loại vì test dùng `constructionScope=turnkey`, không phải
`turnkey_with_interior`).

---

# 5. Rút kinh nghiệm quy trình (không phải nội dung code)

Trong lúc verify, tôi **kiểm tra port 3000 trống trước khi xoá `.next`** —
áp dụng bài học từ sự cố lần trước (đã báo cáo ở
`Completion-Report-M3-003-Estimate-Engine.md` mục 6). Không có sự cố nào
lần này. Khi xong việc, chỉ dừng đúng PID server tôi tự khởi động, không
đụng process nào khác.

---

# 6. Xác nhận phạm vi

- ✅ Áp dụng đúng và đủ 5 quyết định + 2 yêu cầu code Founder đã duyệt.
- ✅ Không refactor Rule Catalog (đúng chỉ thị "Do not implement now").
- ✅ Không mở rộng thêm scope ngoài yêu cầu.
- Chờ ticket M3 tiếp theo (Excel Writer, hoặc mở rộng Rule Catalog khi có
  ticket riêng).
