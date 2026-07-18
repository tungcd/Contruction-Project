# Planning — M4-001: AI Concept Design

**Ngày:** 2026-07-18
**Loại:** Planning only — không có code/migration nào trong ticket này.
**Khung diễn đạt:** Toàn bộ nội dung dưới đây là giả thuyết/khuyến nghị tại
thời điểm hiện tại (Startup Flexibility Principle, mục 11 của ticket) —
không phải kiến trúc cuối cùng. Mọi entity/flow/model đều có thể đổi khi có
dữ liệu thực tế từ POC.

---

## A. Current Assessment

### Đã có gì

- **Requirement (Data Model v0.2, đã đóng băng)** — đã đủ phong phú để làm
  input cho Design Brief mà không cần field mới: `project` (loại công
  trình/nhà, địa điểm), `site` (landArea/buildingFootprint/totalFloorArea/
  frontage/depth/roadWidth), `building` (floors/basementLevels/roofType/
  architecturalStyle/foundationType), `household`, `functional` (đếm
  phòng ngủ/WC + boolean từng loại phòng + `otherRooms`), `budget`
  (budgetMin/Max + constructionScope). Ví dụ dữ liệu thật đang seed (project
  "Anh Hùng - Đan Phượng"): đất 90m², xây 70m²/tầng, 3 tầng, mái bằng,
  hiện đại, 4 phòng ngủ/3 WC, có người già, ngân sách 2.5-3 tỷ, turnkey —
  **đủ chi tiết để tạo Design Brief ngay**, không cần hỏi thêm gì mới.
- **Project Brief** — render thuần từ Requirement, KHÔNG dùng AI (P0-001).
  Không tái dùng được cho Concept Design (bài toán khác hẳn: cần AI suy
  luận/sáng tạo, không phải hiển thị lại dữ liệu), nhưng chứng minh pattern
  "structured data → human-readable view" đã quen thuộc với codebase.
- **Estimate Engine** (Milestone Estimate MVP + M3-008) — pattern rất liên
  quan: Rule Engine sinh dữ liệu có cấu trúc (`BOQDraftLine[]`), lưu nhiều
  version/project (không ghi đè), UI bảng antd cho sửa tay từng dòng, xuất
  Excel. Đây là khuôn mẫu tái dùng tốt cho "Concept có thể sửa tay, giữ
  lịch sử version" — nhưng Estimate Engine là deterministic code, KHÔNG
  phải AI, nên logic tính toán không tái dùng được, chỉ tái dùng được
  *pattern kiến trúc* (versioned JSON snapshot + UI sửa tay).
- **AI Provider** (`lib/ai/provider/`) — interface sạch (`AIProvider`),
  2 implementation (Mock/OpenAI), `responses.parse()` + Zod Structured
  Output, retry-1-lần, `sanitizeText` (né lỗi Postgres NULL char),
  `normalizeRequirement` (né AI trả enum tiếng Anh). Vừa thêm
  `lib/ai/models.ts` (M4 ngày 18/7): `MODELS.default` ("gpt-5.6-luna") và
  `MODELS.complex` ("gpt-5.6-terra") — **`MODELS.complex` hiện CHƯA có call
  site nào dùng** — Concept Strategy Generator sẽ là use case ĐẦU TIÊN
  hợp lý cho tier này (xem mục C).

### Chưa có gì (khoảng trống thật sự)

- **Không có tích hợp image generation nào** — không có SDK/client gọi
  DALL·E/gpt-image, không có code liên quan trong repo.
- **Không có object/blob storage** — không có S3, Vercel Blob, Cloudinary,
  hay bất kỳ dependency lưu file nhị phân nào trong `package.json`. Ảnh
  phối cảnh sinh ra sẽ cần lưu ở đâu đó — hiện là con số 0.
- **Không có thư viện dựng hình học/SVG** (không sharp, không canvas, không
  d3/svg layout lib) — nếu muốn tự vẽ mặt bằng bằng code (không phải ảnh
  AI) thì phải chọn/thêm thư viện mới.
- **Không có màn hình khách hàng xem** — toàn bộ UI hiện tại (Dashboard,
  Workspace, Brief, Estimate, PriceBook) là **chỉ dành cho chủ thầu**,
  không có route/luồng nào cho phép người ngoài (khách hàng) xem dữ liệu
  mà không đăng nhập admin. Concept Design là tính năng ĐẦU TIÊN thực sự
  cần "khách hàng xem, so sánh, chọn" — đây là bề mặt sản phẩm mới, không
  chỉ là thêm 1 trang nội bộ.
- **Không có cơ chế version-nhánh-song-song** — Estimate History là tuyến
  tính (v1, v2, v3...); Concept Design cần "3 phương án cùng lúc, chọn 1,
  có thể regenerate" — mô hình dữ liệu khác (xem mục D).

### Rủi ro lớn nhất (xếp theo mức độ nghiêm trọng)

1. **Chưa biết ảnh AI sinh ra có nhất quán với Concept Strategy hay không**
   (đúng số tầng, đúng mái, đúng phong cách) — đây là lỗi thực tế phổ biến
   nhất của image generation (mục 7.9 của ticket cũng nêu). Nếu ảnh sai
   nhiều, sản phẩm mất uy tín ngay từ lần demo đầu.
2. **3 concept có thể không thực sự khác nhau** — rủi ro thuần AI-quality,
   chỉ biết được khi thử thật, không đoán trước bằng code review được.
3. **Chi phí + tốc độ** — ngân sách test ~10 USD/tháng rất hẹp cho image
   generation (mỗi ảnh ~0.04-0.08 USD tuỳ model/độ phân giải; 3 ảnh/lần
   generate × nhiều lần thử = có thể hết ngân sách rất nhanh nếu không
   giới hạn số lần chạy).
4. **Chưa có hạ tầng lưu ảnh** — phải quyết định trước khi code (mục C).
5. **Ranh giới "đây chỉ là concept, không phải bản vẽ thi công"** — khách
   hàng dễ hiểu nhầm ảnh đẹp = nhà xây được ngay; cần ghi chú rõ ràng ở
   MỌI nơi hiển thị (UI, ảnh watermark nếu cần, text disclaimer).

---

## B. Recommended MVP

### Outcome cụ thể

Từ 1 Project Brief đủ điều kiện (dùng lại đúng khái niệm "Brief Ready" đã
có — `computeBriefReady`), Founder bấm 1 nút để sinh **3 gói concept**,
mỗi gói gồm: tên phương án, ý tưởng chủ đạo, **mô tả công năng dạng văn bản
có cấu trúc** (không phải bản vẽ mặt bằng đồ hoạ), **1 ảnh phối cảnh ngoại
thất**, giải thích ưu/nhược điểm, và vị trí chi phí tương đối (thấp/trung
bình/cao — KHÔNG phải số tiền cụ thể do AI bịa). Founder xem trước, sau đó
gửi link cho khách hàng xem/so sánh/chọn hoặc để lại phản hồi dạng text.

### Phạm vi (trong MVP)

- Design Brief normalization + phát hiện thiếu/mâu thuẫn (tái dùng pattern
  Requirement extraction).
- 3 Concept Strategy khác biệt thật sự (có validate chống trùng lặp).
- Functional Layout dạng **JSON có cấu trúc + hiển thị dạng danh sách/bảng
  theo từng tầng** (KHÔNG phải hình vẽ mặt bằng).
- 1 ảnh phối cảnh ngoại thất/concept (không phải nhiều góc, không phải nội
  thất).
- Giải thích + cost tier tương đối.
- Founder xem, chọn, regenerate (có xác nhận trước khi tốn tiền lần nữa).
- Link chia sẻ read-only cho khách hàng xem + để lại phản hồi text/chọn.

### Ngoài phạm vi (deferred — xem lý do ở mục "Challenge Scope")

- **Floor Plan Demo dạng hình vẽ (SVG/đồ hoạ mặt bằng)** — ticket liệt kê
  đây là bắt buộc (mục 4.3), nhưng tôi đề xuất lùi sang milestone kế tiếp
  (xem "Challenge Scope" ngay dưới) — đổi lại bằng bảng/danh sách phòng có
  cấu trúc ở MVP đầu.
- Regenerate tự động theo phản hồi khách hàng (MVP: Founder tự quyết định
  có regenerate hay không sau khi đọc phản hồi — tránh vòng lặp tốn tiền
  không kiểm soát).
- Kết hợp phương án A/B/C thành 1 phương án mới.
- AutoCAD/BIM/hồ sơ kết cấu/MEP/bản vẽ xin phép/photoreal nội thất — đúng
  như ticket mục 8 đã loại trừ.

### Challenge Scope — vì sao đề xuất lùi Floor Plan Demo (hình vẽ)

Ticket mục 8 nói rõ Floor Plan Demo (mục 4.3) là 1 phần MVP. Tôi xin nêu
phản biện (theo đúng quyền "challenge lại nếu scope quá lớn" ở mục 10):

- Sinh **JSON mô tả layout** (phòng, diện tích tương đối, quan hệ liền kề)
  là việc LLM làm được ngay bằng Structured Output — cùng độ khó với
  Requirement Extraction hiện tại.
- Nhưng **render JSON đó thành 1 hình vẽ mặt bằng thật sự đúng tỷ lệ,
  không chồng phòng, đúng hướng cửa** là MỘT bài toán kỹ thuật khác hẳn
  (constraint solving / layout algorithm, hoặc phụ thuộc image model vẽ
  mặt bằng — cả 2 hướng đều rủi ro cao, xem mục 7.3/7.9). Đây là loại rủi
  ro kỹ thuật lớn, không phải việc có thể làm "chỉn chu" trong vài ngày
  của 1 solo founder.
- Rủi ro lớn nhất cần kiểm chứng SỚM (theo đúng nguyên tắc Startup
  Flexibility mục 11: "giải quyết rủi ro lớn nhất sớm") là: **AI có tạo
  được 3 concept THỰC SỰ khác biệt và ảnh phối cảnh có đủ tốt để khách
  hàng thấy giá trị hay không** — câu hỏi này KHÔNG cần bản vẽ mặt bằng để
  trả lời. Bảng/danh sách phòng có cấu trúc là đủ để khách hàng hiểu công
  năng ("tầng 1: phòng khách 24m² cạnh bếp, WC riêng...").
- Đề xuất: xác nhận giá trị bằng MVP không có bản vẽ mặt bằng trước; nếu
  khách hàng phản hồi tốt nhưng thấy thiếu bản vẽ, làm milestone riêng cho
  việc render (M4-008 trong mục F) — **đây là quyết định cần Founder xác
  nhận** (xem mục H, quyết định #2), không phải tôi tự ý cắt.

---

## C. Architecture Proposal

### Flow đề xuất (bản refine của ticket mục 5)

```text
Project Brief (đã có, Brief Ready = true)
   │
   ▼
[LLM - default tier] Design Brief Normalizer
   input: Requirement + Brief
   output: DesignBrief (không lưu riêng — xem mục D)
   → nếu thiếu field quan trọng (vd hoàn toàn không có budget/style) hoặc
     mâu thuẫn rõ ràng → STOP, tái dùng UI "Thiếu / Câu hỏi" đã có, không
     tạo concept khi thiếu input tối thiểu
   │
   ▼
[LLM - complex tier, 1 lần gọi sinh cả 3] Concept Strategy Generator
   output: 3× { name, mainIdea, targetAudience, priorities[], tradeoffs[], costTier }
   → deterministic guard: nếu 2/3 strategy giống nhau quá (so sánh
     priorities[]/costTier trùng) → retry 1 lần (giống pattern retry hiện
     có ở OpenAIProvider), vẫn trùng thì báo lỗi cho Founder, KHÔNG tự ý
     hiển thị 3 phương án na ná nhau
   │
   ▼ (lặp lại 3 lần, 1 lần/concept)
[LLM - complex tier] Functional Layout Generator (per concept)
   input: DesignBrief + 1 ConceptStrategy
   output: FloorLayout JSON (xem mục D — dạng adjacency, KHÔNG toạ độ)
   │
   ▼
[Deterministic code] Layout Validator (mục 7.5, xem chi tiết dưới)
   fail → retry 1 lần (đổi nhẹ prompt: "sửa lỗi X"), vẫn fail → đánh dấu
   concept này "cần xem lại tay", KHÔNG tự ý ship layout sai
   │
   ▼
[Image generation, per concept] Exterior Perspective Generator
   prompt được LẮP GHÉP BẰNG CODE (không phải LLM tự viết prompt tự do) từ
   DesignBrief + ConceptStrategy + roofType/architecturalStyle/floors —
   giữ nhất quán, dễ debug, dễ kiểm soát chi phí (không gọi thêm 1 LLM chỉ
   để viết prompt)
   │
   ▼
[Deterministic code] Concept Package Assembler → lưu DB (mục D)
   │
   ▼
Founder xem trước (UI nội bộ) → gửi link → Khách hàng xem/so sánh/chọn
   hoặc để lại phản hồi text (KHÔNG tự động trigger regenerate)
   │
   ▼
Founder đọc phản hồi → tự quyết định: chọn theo ý khách, hoặc bấm
regenerate tay (có confirm cảnh báo tốn tiền, giống pattern `modal.confirm`
đã có ở trang Estimate)
```

### Trả lời trực tiếp câu hỏi 7.6 — Model Strategy

| Bước | Model tier | Lý do |
|---|---|---|
| Design Brief Normalizer | `MODELS.default` | Cùng loại việc với Requirement Extraction hiện tại (structured output, không cần suy luận sâu) |
| Concept Strategy Generator | `MODELS.complex` | Đúng tiêu chí đã ghi trong `lib/ai/models.ts`: "so sánh nhiều phương án" — **use case đầu tiên thực sự dùng complex tier** |
| Functional Layout Generator | `MODELS.complex` (đề xuất, cần đo lại) | Suy luận không gian khó hơn extract text thuần — bắt đầu ở tier mạnh, hạ xuống `default` sau nếu chất lượng vẫn ổn (đo bằng POC, không giả định) |
| Design Explanation | `MODELS.default` | Viết nội dung thông thường, đúng tiêu chí default |
| Exterior Perspective | Model ảnh riêng (vd OpenAI Images API) | KHÔNG nằm trong 2 tier chat hiện có — cần cơ chế tính chi phí riêng (theo ảnh, không theo token) |

**Kiểm soát ngân sách ~10 USD/tháng (giai đoạn test):** giới hạn cứng số
lần "generate 3 concept" trong POC (vd ≤ 20 lần/tháng = tối đa 60 ảnh ≈
2.4-4.8 USD ở mức giá thấp nhất, còn dư ngân sách cho phần LLM text vốn
rẻ hơn nhiều). Dùng độ phân giải/quality thấp nhất chấp nhận được cho POC.
Log lại model + ước tính chi phí mỗi lần gọi (tái dùng nguyên tắc "Logging"
đã có ở 05-Prompt-and-AI-Contract mục 12: prompt id, response time, token
usage, model name — mở rộng thêm ước tính USD).

### Lưu trữ ảnh (trả lời 1 phần câu hỏi 7.4)

**Đề xuất 2 giai đoạn (reversible, đúng tinh thần Startup Flexibility):**

1. **Giai đoạn POC/giai đoạn đầu MVP:** lưu ảnh dạng base64 trực tiếp
   trong Postgres (cột `text`/`bytea`) — KHÔNG cần thêm hạ tầng mới, số
   lượng ảnh POC rất nhỏ (vài chục ảnh), triển khai nhanh nhất có thể.
2. **Khi đã xác nhận giá trị (sau POC), trước khi ra khách hàng thật:**
   chuyển sang Vercel Blob (nếu deploy trên Vercel — tích hợp gần như
   không cần cấu hình thêm với Next.js) hoặc S3-compatible storage. Đây
   là quyết định có thể lùi lại, không chặn POC.

---

## D. Domain/Data Design

### Nguyên tắc

Theo đúng convention đã dùng cho `Requirement`/`EstimateDraft` trong
codebase: **field có cấu trúc phức tạp nhưng không cần query/filter riêng
lẻ thì lưu dạng JSON column**, không normalize hết thành bảng con. Ticket
gợi ý 10 entity (DesignBrief, Concept, ConceptStrategy, FloorLayout, Room,
Relationship, FloorPlanAsset, PerspectiveAsset, ConceptRevision,
CustomerFeedback) — đề xuất rút gọn còn **3 bảng mới**:

```prisma
/// 1 lần "bấm tạo concept" = 1 ConceptSet, chứa 3 Concept. Nhiều bản/project
/// (không ghi đè, giống EstimateDraft) — giữ lịch sử các lần generate.
model ConceptSet {
  id        String   @id @default(uuid())
  projectId String
  version   Int
  /// Snapshot Requirement.updatedAt lúc tạo — cùng nguyên tắc EstimateDraft.
  generatedFromRequirementVersion DateTime
  /// DesignBrief KHÔNG phải bảng riêng — snapshot ngay trong đây để tái
  /// hiện/debug được, không phải entity độc lập có thể sửa tay.
  designBrief Json
  status    String   // "generating" | "ready" | "failed" | "decided"
  createdAt DateTime @default(now())

  concepts  Concept[]
  feedbacks ConceptFeedback[]

  @@unique([projectId, version])
}

model Concept {
  id           String   @id @default(uuid())
  conceptSetId String
  label        String   // "A" | "B" | "C" (hoặc tên do AI đặt)
  /// Gộp strategy + functionalLayout + explanation + costTier vào 1 JSON —
  /// đây đều là dữ liệu hiển thị/đọc lại nguyên khối, không cần query field
  /// con (giống cách EstimateDraft.data gộp sections/lines).
  data         Json
  perspectiveImage    String?  // base64 (POC) hoặc URL (sau khi có blob storage)
  perspectiveImagePrompt String? // lưu để debug/reproduce, KHÔNG phải để sửa tay
  status       String   // "pending" | "generating" | "ready" | "failed"
  createdAt    DateTime @default(now())
}

model ConceptFeedback {
  id           String   @id @default(uuid())
  conceptSetId String
  selectedConceptId String?
  feedbackText String?
  createdAt    DateTime @default(now())
}
```

So với 10 entity gợi ý: **Strategy/Layout/Explanation/CostTier gộp vào
`Concept.data`** (như `EstimateDraft.data` đang gộp `sections[]`), **bỏ
Room/Relationship làm bảng riêng** (nằm trong JSON của `data`, không có
nhu cầu query "tìm tất cả phòng ngủ của mọi concept" ở MVP), **bỏ
FloorPlanAsset** (MVP không có bản vẽ mặt bằng đồ hoạ, xem mục B),
**ConceptRevision** không cần bảng riêng vì `ConceptSet.version` đã đóng
vai trò đó.

### Structured Output JSON — FloorLayout (trả lời 7.2)

Đề xuất dạng **adjacency (quan hệ liền kề), KHÔNG phải toạ độ pixel** — lý
do: LLM sinh toạ độ chính xác không chồng lấn rất kém tin cậy; adjacency
là việc LLM làm tốt hơn nhiều, và vẫn đủ để hiển thị dạng danh sách/bảng
ở MVP. Có đường nâng cấp lên SVG/DXF sau (milestone M4-008): thêm 1 bước
layout-solver đọc đúng JSON này để tính toạ độ, không cần đổi schema.

```json
{
  "floors": [
    {
      "level": 1,
      "label": "Tầng 1",
      "rooms": [
        {
          "id": "living_room",
          "name": "Phòng khách",
          "type": "living_room",
          "areaSqmApprox": 24,
          "adjacentTo": ["kitchen", "entrance"],
          "note": "Gần cửa chính, nhìn ra sân"
        }
      ]
    }
  ]
}
```

### Validation trước khi render (trả lời 7.5)

Kiểm tra bằng code thuần (giống triết lý Rule Engine — không dùng AI để tự
kiểm tra chính nó):

- Tổng số phòng ngủ/WC trong layout == `Requirement.functional.bedrooms`/
  `bathrooms`.
- Tổng `areaSqmApprox` mọi tầng ≤ `totalFloorArea` × (1 + sai số cho phép,
  vd 10%).
- Diện tích tầng 1 ≤ `buildingFootprint` × (1 + sai số cho phép).
- Nếu `household.hasElderly === true` → tầng 1 phải có ít nhất 1 phòng
  `type: "bedroom"`.
- Không có `room.id` trùng lặp trong cùng 1 tầng.
- Mọi `adjacentTo` phải trỏ tới `id` có thật trong cùng layout (không tham
  chiếu phòng không tồn tại).
- **3 concept phải khác nhau thật** — so sánh footprint sử dụng
  (tổng diện tích theo `type`), số tầng có phòng ngủ, và `costTier` giữa
  3 concept; nếu ≥ 2 concept giống nhau ở toàn bộ 3 tiêu chí → coi là lỗi
  (xem flow ở mục C).

---

## E. UX Flow (tối thiểu)

1. Trang Workspace project: thêm nút "Concept Design" (cạnh "Dự toán"/
   "Tạo Project Brief"), chỉ bật khi Brief Ready (tái dùng
   `readiness.brief.ready` đã có).
2. Trang Concept Design: nếu chưa có `ConceptSet` nào → nút "Tạo 3 Concept"
   (loading state khi đang chạy, ước lượng ~1-2 phút do có bước ảnh).
3. Xem 3 concept dạng thẻ (card) cạnh nhau: tên, 1 câu pitch, badge cost
   tier, ảnh phối cảnh thu nhỏ. Bấm vào để mở chi tiết: bảng công năng
   theo tầng, ảnh phối cảnh full-size, giải thích ưu/nhược điểm.
4. Hành động: "Chọn phương án này" / "Tạo lại" (có `modal.confirm` cảnh
   báo tốn phí, giống pattern đã có ở trang Estimate) / "Sao chép link cho
   khách".
5. **Trang khách hàng xem** (route mới, không auth, URL dài/khó đoán —
   xem quyết định #3 mục H): cùng UI thẻ 3 concept nhưng read-only, có ô
   "Chọn phương án" + "Để lại góp ý" (text) → gọi API tạo `ConceptFeedback`.
6. Banner "Đã chọn: Concept B" hiện lại ở trang Workspace chính sau khi
   quyết định.

Error handling: tái dùng pattern `{success, data, message}` + hiển thị lỗi
bằng đúng cách các trang khác đang làm (`<p className="text-destructive">`
hoặc antd message/Alert) — không cần thiết kế mới.

---

## F. Implementation Plan

Đề xuất chia nhỏ khác thứ tự gợi ý của ticket — ưu tiên **kiểm chứng rủi
ro lớn nhất trước khi xây data model/UI** (đúng nguyên tắc Startup
Flexibility mục 11 điểm 2 "giải quyết rủi ro lớn nhất sớm"):

| # | Milestone | Mục tiêu | Deliverable | Phụ thuộc | Acceptance | Rủi ro | Effort |
|---|---|---|---|---|---|---|---|
| M4-001 | Planning | Tài liệu này | Doc này | — | Founder hiểu rõ + chốt Open Decisions | Thấp | Đã xong |
| M4-002 | POC ảnh + strategy | Kiểm chứng rủi ro #1, #2, #3 (mục A) | Script throwaway (như `import-standard-pricebook.mjs`), dùng project seed thật, gọi thẳng OpenAI, KHÔNG lưu DB, KHÔNG UI | Có OpenAI key sẵn (đã có) | Founder tự đánh giá bằng mắt: 3 strategy khác nhau rõ? Ảnh đúng số tầng/mái/style? Chi phí + thời gian thực đo được | Cao (đây là mục đích của POC) | Nhỏ (1 script) |
| M4-003 | Design Brief + Strategy Generator (persist) | Sinh + lưu strategy thật | 3 bảng mới (mục D) + API + repository | M4-002 kết quả tốt | Gọi API ra đúng `ConceptSet` với 3 strategy khác biệt (validate tự động) | Trung bình | Trung bình |
| M4-004 | Functional Layout + Validator | Sinh layout JSON + validate | Layout Generator + Validator (mục D) | M4-003 | Layout pass hết rule ở mục D cho ≥ 8/10 lần chạy thử | Trung bình-cao (spatial reasoning) | Trung bình |
| M4-005 | Exterior Perspective + Storage | Sinh + lưu ảnh | Image gen call + base64-in-DB (giai đoạn đầu) | M4-002 kết quả tốt | Ảnh lưu được, hiển thị lại đúng qua API | Trung bình | Nhỏ-trung bình |
| M4-006 | Concept Comparison UI (nội bộ) | Founder xem/so sánh/chọn/regenerate | Trang mới + component thẻ | M4-003, 004, 005 | Founder thao tác được hết flow không cần đọc code | Thấp | Trung bình |
| M4-007 | Customer Share Link + Feedback | Khách xem/chọn/góp ý | Route public read-only + `ConceptFeedback` API | M4-006 | Mở link ẩn danh (không login) vẫn xem/chọn được | Trung bình (bảo mật link, xem quyết định #3) | Nhỏ-trung bình |
| M4-008 (tương lai, chưa lên kế hoạch chi tiết) | Floor Plan Demo đồ hoạ | Vẽ mặt bằng thật | SVG renderer hoặc layout-solver | M4-004 + xác nhận giá trị từ khách hàng thật | — | Cao | Chưa ước lượng |

---

## G. Proof of Concept

**Nhỏ nhất có thể, dùng dữ liệu thật, không đụng DB/UI:**

- Input: Requirement thật của project seed "Anh Hùng - Nhà phố Đan Phượng"
  (đã có sẵn trong DB dev, đủ chi tiết — xem mục A).
- Script throwaway (Node, gọi thẳng OpenAI qua `AIProvider` hiện có hoặc
  gọi trực tiếp SDK để tách biệt hoàn toàn khỏi code chính):
  1. Gọi LLM (tier `complex`) sinh 3 Concept Strategy từ Requirement này.
  2. Với mỗi strategy, lắp prompt ảnh bằng code (không LLM viết prompt),
     gọi image API sinh 1 ảnh phối cảnh.
  3. In ra strategy JSON + lưu 3 ảnh ra file cục bộ (không lưu DB).
- Founder + Claude cùng xem: 3 ảnh có khác nhau rõ rệt không? Có khớp mô
  tả (3 tầng, mái bằng, hiện đại) không? Tổng chi phí + thời gian chạy là
  bao nhiêu?
- **Ngân sách đề xuất cho POC: ≤ 2 USD** (đủ cho vài lần thử 3 ảnh).
- Kết quả POC quyết định có tiếp tục M4-003 hay cần đổi hướng (đổi model
  ảnh, đổi cách viết prompt, hoặc phát hiện rủi ro mới chưa lường trước).

---

## H. Open Decisions (Founder cần chốt)

1. **Chọn model ảnh + ngân sách thật** — cần Founder xác nhận provider
   (OpenAI Images API hay khác) và mức chi cho phép ở giai đoạn test, vì
   đây là chi phí thật bằng tiền, không giống các bước LLM text đã dùng.
2. **Floor Plan Demo (bản vẽ mặt bằng đồ hoạ) có bắt buộc ở MVP đầu tiên
   không, hay chấp nhận bảng/danh sách công năng dạng text trước?** (xem
   "Challenge Scope" ở mục B) — đây là thay đổi so với mô tả gốc trong
   ticket, cần Founder xác nhận rõ ràng, không phải quyết định kỹ thuật
   nhỏ tôi tự xử lý được.
3. **Mức độ bảo mật cho link chia sẻ khách hàng** — đây là bề mặt
   customer-facing ĐẦU TIÊN của sản phẩm (mọi thứ trước giờ chỉ chủ thầu
   dùng). Chỉ cần URL dài/khó đoán (không auth) như toàn bộ hệ thống hiện
   tại, hay cần thêm PIN/mã xác nhận vì đây là dữ liệu khách hàng?
4. **Có cho phép "kết hợp A/B/C" trong MVP hay lùi lại?** — ticket liệt kê
   đây là 1 khả năng của AI (mục 6) nhưng không bắt buộc ở mục 8; đề xuất
   lùi lại, cần Founder xác nhận.
5. **Xác nhận ngân sách POC (mục G, đề xuất ≤ 2 USD)** trước khi chạy —
   là chi phí thật, khác hẳn mọi việc đã làm tới giờ (mock/OpenAI text rẻ).

*(Các quyết định kỹ thuật nhỏ khác — vd tên field JSON, cấu trúc bảng
Prisma cụ thể — Claude tự xử lý khi implement, không cần hỏi thêm.)*

---

## I. Recommendation

**Bước tiếp theo cụ thể:** chạy POC (mục G) trước — dùng đúng project
seed thật, ngân sách ≤ 2 USD, KHÔNG động vào DB/schema/UI. Sau khi Founder
xem kết quả POC (3 strategy + 3 ảnh) và trả lời 5 Open Decisions ở mục H,
mới mở implementation task M4-002 → M4-003 theo đúng chế độ Milestone hiện
tại (continuous implementation, không xin duyệt từng bước nhỏ).

Không đề xuất bắt đầu code M4-003 (persist thật) trước khi có kết quả POC
— rủi ro lớn nhất (chất lượng ảnh + độ khác biệt giữa 3 concept) hoàn toàn
là câu hỏi thực nghiệm, không thể trả lời chỉ bằng đọc code/tài liệu.
