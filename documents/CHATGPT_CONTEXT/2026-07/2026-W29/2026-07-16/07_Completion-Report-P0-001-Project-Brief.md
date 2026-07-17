# Completion Report — Ticket P0-001: Generate Project Brief (MVP)

**Ngày:** 2026-07-16
**Người thực hiện:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Nguồn ticket:** `P0-001` — "ticket cuối cùng của Milestone MVP Demo"
**Trạng thái:** Implementation xong theo đúng Scope ticket. **Dừng lại, không triển khai thêm.**

---

# 1. Tóm tắt

Đã implement Project Brief: sinh từ Requirement hiện tại, hiển thị đủ 9 mục
theo đúng Output spec của ticket, render bằng shadcn Card. Commit `2a42388`.

**Quyết định thiết kế quan trọng nhất:** Brief render **hoàn toàn bằng code**
(pure function từ Requirement), **không gọi AI**. Ticket ghi rõ 2 chỗ: mục
"Không làm" liệt kê "AI Rewrite", và section 9 yêu cầu "Không suy đoán ngoài
Requirement". Cùng một Requirement luôn cho ra cùng một Brief — deterministic,
không tốn token, không rủi ro bịa số.

---

# 2. Đối chiếu Output spec ticket ↔ implementation

| # | Ticket yêu cầu | Implement | Nguồn dữ liệu |
|---|---|---|---|
| 1 | Thông tin dự án (loại công trình, loại nhà, địa điểm) | ✅ | `project.projectType/buildingType`, ghép `district+province` |
| 2 | Thông tin khu đất (diện tích đất, xây dựng nếu có, số tầng, mái) | ✅ | `site.landArea`, `buildingFootprint`+`totalFloorArea` (xem mục 4), `building.floors/roofType` |
| 3 | Thông tin gia đình (người lớn, trẻ em, người già) | ✅ | `household.adults/children/hasElderly` |
| 4 | Nhu cầu công năng (9 mục liệt kê) | ✅ | `functional.*` — đúng thứ tự ticket |
| 5 | Ngân sách (nếu có) | ✅ | `budget.budgetMin/Max/Note` — ẩn cả mục nếu không có |
| 6 | Phạm vi báo giá (nếu có) | ✅ | `budget.constructionScope/Note` — ẩn cả mục nếu không có |
| 7 | Thông tin cần xác nhận (từ `toConfirm`) | ✅ | Lấy thẳng `ProjectDetail.toConfirm` (derived, đã có từ Data Model v0.2) |
| 8 | Giả định của AI (`assumptions`) | ✅ | Xem mục 3 — cách xử lý riêng vì không có trong Requirement |
| 9 | Đánh giá sơ bộ (3-5 dòng, không suy đoán ngoài Requirement) | ✅ | Ghép câu thuần từ field đã có, không gọi AI |

---

# 3. Vấn đề tự phát hiện, không có trong ticket: `assumptions` không có chỗ lưu

`assumptions` là output của AI ở bước **analyze** (Sprint 3), không phải field
trong Requirement — mà **Requirement đã đóng băng** (Data Model v0.2, duyệt
2026-07-16), không được tự ý thêm field.

**Cách xử lý:** giữ tạm ở client store (Zustand — dependency đã có sẵn từ
Sprint 1, chưa từng dùng tới), theo từng `projectId`, sống qua điều hướng
Workspace → Brief trong cùng phiên trình duyệt. Không đụng Data Model, không
thêm bảng DB mới.

**Đánh đổi cần Founder/ChatGPT biết:** assumptions **mất khi hard refresh**
hoặc mở tab mới (vì không lưu DB). Với luồng demo liên tục trong DoD ("Chat
→ Generate → Đọc Brief ngay") thì không ảnh hưởng. Nếu sau này cần
assumptions bền vững qua refresh, sẽ cần bổ sung field vào Data Model —
**đó là quyết định mở băng, không tự làm ở đây.**

---

# 4. Một điểm lệch nhỏ so với ticket — cần ghi nhận

Ticket mục 2 chỉ liệt kê **1 dòng** "Diện tích xây dựng (nếu có)". Nhưng Data
Model v0.2 (đã đóng băng) có **2 field độc lập**: `buildingFootprint` (diện
tích tầng 1) và `totalFloorArea` (tổng diện tích sàn) — tách ra chính vì
`constructionArea` cũ từng bị AI hiểu nhầm/bịa số (xem Completion Report Data
Model v0.2, mục 5.3 Data Model Review).

**Xử lý:** hiển thị **cả hai** dòng riêng biệt (ẩn dòng nào null), thay vì gộp
làm một như ticket viết. Đây là chọn lựa kỹ thuật để không mất thông tin hoặc
gây nhầm lẫn 2 khái niệm khác nhau — nhưng là diễn giải của tôi, không phải
yêu cầu tường minh. Xin ChatGPT xác nhận cách hiển thị này ổn không.

---

# 5. Danh sách file thay đổi

6 file, +384/-52 dòng (diff `80c7559` → `HEAD`):

```
apps/web/src/features/requirement/brief-view.ts                [MỚI]  169 dòng
apps/web/src/features/requirement/components/ProjectBriefView.tsx [MỚI]  110 dòng
apps/web/src/features/requirement/analysis-store.ts             [MỚI]   31 dòng
apps/web/src/app/projects/[id]/brief/page.tsx                    (viết lại)
apps/web/src/app/projects/[id]/page.tsx                          (nối store)
apps/web/src/features/requirement/requirement-view.ts           (export thêm helper dùng chung)
```

`requirement-view.ts` chỉ **export thêm** các bảng nhãn enum + helper
(`bool`, `money`, `budgetRange`, `openEnumLabel`...) đã có sẵn — để
`brief-view.ts` tái dùng, tránh trùng lặp bảng enum ở 2 nơi (bài học từ lỗi
trùng lặp trước đây). Không đổi hành vi hiện có.

# 6. Commit

```
2a42388 feat(p0-001): Generate Project Brief từ Requirement (không AI)
```

---

# 7. Kết quả verify

| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck -w apps/web` | ✅ PASS |
| `npm run build -w apps/web` | ✅ PASS |
| `npm run test:regression` (mock) | ✅ **13/13 PASS** — xác nhận không phá vỡ gì |
| 3 trang render HTTP 200 (Dashboard/Workspace/Brief) | ✅ |

## Verify sâu hơn: chạy lại đúng logic 9 section với dữ liệu thật

Môi trường này **không có tool chụp màn hình trình duyệt** (không
Playwright/Puppeteer). Trang Brief là `"use client"` fetch dữ liệu phía
browser sau hydrate, nên HTTP response thô chỉ chứa shell loading — không
đủ để "xem" nội dung qua HTTP thuần.

Để verify nghiêm ngặt hơn ảnh chụp, tôi lấy Requirement **thật** từ project
demo đã seed, chạy lại **chính xác cùng logic** trong `brief-view.ts` bằng
Node độc lập, in ra toàn bộ 9 section:

```
1. Thông tin dự án     -> Xây mới · Nhà phố · Đan Phượng, Hà Nội
2. Thông tin khu đất   -> đất 90m² · xây dựng 70m² · tổng sàn 210m² · 3 tầng · Mái bằng
3. Thông tin gia đình  -> 2 người lớn · 2 trẻ em · Có người già
4. Nhu cầu công năng   -> 4 phòng ngủ, 3 WC, phòng khách/bếp/thờ/gara/ban công/kho: Có,
                          phòng khác: Sân phơi, Phòng làm việc
5. Ngân sách           -> 2,5 tỷ - 3 tỷ (kèm ghi chú nguyên văn)
6. Phạm vi báo giá     -> Xây dựng trọn gói (kèm ghi chú nguyên văn)
9. Đánh giá sơ bộ      -> "Dự án xây mới tại Đan Phượng, Hà Nội. Quy mô: đất
                          90m², 3 tầng. Công năng chính: 4 phòng ngủ, 3 WC.
                          Ngân sách khoảng 2,5 tỷ - 3 tỷ, phạm vi báo giá:
                          xây dựng trọn gói."
```

Không có lỗi runtime, mọi field trích xuất đúng. Section 7 (`toConfirm`) và
8 (`assumptions`) đã verify từ Data Model v0.2 report trước (derived đúng).

**Founder/ChatGPT có thể tự xác nhận bằng mắt:**
```bash
npm run dev
```
Mở Dashboard → project demo "Anh Hùng - Nhà phố Đan Phượng (Demo)" → Workspace
→ "Tạo Project Brief".

---

# 8. Không làm (đúng theo ticket)

Không có: PDF, DOCX, Export file, AI Rewrite, Multi Template, BOQ, Pricing,
Proposal. Nút "Copy" chỉ xuất plain-text ra clipboard — tính năng đã tồn tại
từ trước ticket này (không phải export file mới, không vi phạm "Không làm").

---

# 9. Câu hỏi cần ChatGPT xác nhận

1. **Mục 4 (điểm lệch)**: hiển thị cả `buildingFootprint` và `totalFloorArea`
   thay vì 1 dòng gộp — có chấp nhận được không, hay muốn gộp lại thành 1
   dòng theo đúng nghĩa đen ticket (sẽ mất phân biệt 2 khái niệm)?
2. **Mục 3 (assumptions)**: chấp nhận đánh đổi "mất khi hard refresh" hay cần
   Founder quyết định thêm field vào Data Model để lưu bền vững? (đây là
   quyết định mở băng, tôi không tự làm)

---

# 10. Xác nhận phạm vi & bước tiếp

- ✅ Đúng Scope, Output, Definition of Done trong ticket P0-001.
- ✅ Founder có thể: Tạo Project → Chat → AI extract Requirement → Generate
  Project Brief → Đọc Brief ngay trên giao diện.
- **DỪNG LẠI Ở ĐÂY** — đây là ticket cuối Milestone "MVP Demo". Không triển
  khai thêm feature. Chờ Founder/ChatGPT review.
