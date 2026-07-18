# Phase A — Golden Pipeline Specification

**Ngày:** 2026-07-18
**Trạng thái:** Đặc tả (specification) — không code, không schema thật,
không API, không UI. Đây là "golden contract" giữa các module, dùng làm
tài liệu tham chiếu khi Phase B (Manual POC) và sau này implementation.
**Nguồn:** Chốt theo kiến trúc đã đóng băng ở `10_Frozen-Architecture...`.

**Cách đọc tài liệu này:** mỗi giai đoạn là **1 hợp đồng (contract)** độc
lập — Input / Output / Owner / Acceptance Criteria / Failure Handling.
Bất kỳ ai (người hoặc AI) implement 1 giai đoạn chỉ cần đọc đúng phần của
giai đoạn đó, không cần hiểu toàn bộ pipeline.

---

## Bảng tổng quan (13 hợp đồng, đủ toàn bộ pipeline kể cả các bước ẩn ở
tài liệu tóm tắt trước)

| # | Contract | Owner | Rủi ro AI? |
|---|---|---|---|
| 1 | Design Brief Normalizer | AI (LLM default) | Thấp |
| 2 | Requirement Sanity Checker | Deterministic + AI (LLM default) | Thấp |
| 3 | Constraint Set Compiler | Deterministic | Không |
| 4 | Concept Strategy Generator | AI (LLM complex) | Cao |
| 5 | Space Planner (Design Intent Graph Generator) | AI (LLM complex) | **Cao nhất** |
| 6 | Layout Validator | Deterministic | Không |
| 7 | Geometry Solver | Deterministic | Không |
| 8 | Descriptor Compiler | Deterministic | Không |
| 9 | Prompt Compiler | Deterministic (per ImageProvider) | Không |
| 10 | Exterior/Interior Image Generator | AI (Image model) | **Cao nhất** |
| 11 | Visual Constraint Checker *(tuỳ chọn)* | AI (Vision model) | Trung bình |
| 12 | Concept Package Assembler | Deterministic | Không |
| 13 | Customer Feedback Recorder | Deterministic | Không |

Chỉ contract #4, #5, #10 (và #11 nếu làm) thực sự là "rủi ro AI" cần
benchmark liên tục — khớp đúng kết luận đã chốt ở review #4.

---

## Contract #1 — Design Brief Normalizer

- **Owner:** AI, model tier `default`.
- **Input:** `Requirement` (đầy đủ, đã đóng băng) + `ProjectBrief` hiện có.
- **Output:** `DesignBrief` — bản tóm tắt CHUẨN HOÁ (không phải bản sao
  Requirement) tập trung vào các quyết định thiết kế cần: loại công
  trình, kích thước, phong cách ưu tiên (nếu Requirement có), ngân sách
  positioning, danh sách công năng bắt buộc. KHÔNG lưu riêng (mục D, doc
  05) — chỉ tồn tại trong bước xử lý, được snapshot vào `ConceptSet` sau.
- **Acceptance Criteria:**
  - Không có field nào trong output KHÔNG truy được nguồn gốc về
    Requirement (không tự bịa thêm dữ kiện).
  - Mọi field Requirement=null giữ nguyên là "chưa biết" trong DesignBrief
    (không tự đoán).
- **Failure Handling:** Nếu output không parse được theo schema (Zod) →
  retry 1 lần (đúng pattern `withRetry` đã có ở `OpenAIProvider`), vẫn lỗi
  → dừng, báo lỗi kỹ thuật cho Founder (không phải lỗi thiếu dữ liệu).

---

## Contract #2 — Requirement Sanity Checker

- **Owner:** Deterministic (kiểm tra tỷ lệ đơn giản) + AI, model tier
  `default` (trường hợp tinh tế hơn).
- **Input:** `DesignBrief` (#1).
- **Output:** `{ passed: boolean, issues: string[] }`.
- **Acceptance Criteria (ví dụ rule cụ thể, không chỉ ý tưởng chung):**
  - `totalFloorArea / bedrooms < NGƯỠNG` (vd 15m²/phòng) → nghi ngờ mật độ
    phòng quá dày — cần Founder xác nhận hằng số ngưỡng này trước khi
    build (không tự chọn số, xem Open Decision cuối tài liệu).
  - Ngân sách (`budgetMax`) thấp bất thường so với `constructionScope=
    turnkey_with_interior` (cần bảng ngưỡng theo `pricingRegion` — CHƯA
    có dữ liệu thị trường để tự tin định ngưỡng, xem Open Decision).
  - AI (default tier) chỉ xử lý các mâu thuẫn ĐỊNH TÍNH mà rule số không
    bắt được (vd yêu cầu phong cách + công năng xung khắc theo kinh
    nghiệm ngành).
- **Failure Handling:** `passed=false` → **DỪNG pipeline tại đây** — hiển
  thị `issues[]` cho Founder/khách hàng qua UI "Thiếu / Câu hỏi" đã có,
  KHÔNG tiếp tục sinh Concept Strategy khi input đáng ngờ.

---

## Contract #3 — Constraint Set Compiler

- **Owner:** 100% Deterministic — hàm thuần, cùng họ với
  `computeMissingFields`/`computeReadiness` đã có trong codebase.
- **Input:** `Requirement` (chỉ Requirement — KHÔNG nhận DesignBrief hay
  bất kỳ output AI nào làm input, đây là điểm quan trọng nhất của toàn bộ
  kiến trúc).
- **Output:** `ConstraintSet`:
  ```text
  {
    mustNotInclude: SpaceType[]   // vd ["garage", "balcony"] khi field tương ứng = false
    mustInclude: { [SpaceType]: count }  // vd { bedroom: 4, wc: 3 }
    exactDimensions: { footprint?: number, totalFloorArea?: number, floors?: number }
    exactEnum: { roofType?: RoofType, architecturalStyle?: ArchitecturalStyle }
  }
  ```
- **Acceptance Criteria:**
  - Hàm THUẦN (pure function) — cùng input luôn ra cùng output, không gọi
    API, không có side effect.
  - Mọi field Requirement liên quan (boolean công năng, đếm phòng, kích
    thước, enum) PHẢI có mặt trong `ConstraintSet` nếu khác `null` — không
    được bỏ sót field nào (kiểm tra bằng unit test liệt kê đủ field).
- **Failure Handling:** Không áp dụng (deterministic, không có trạng thái
  lỗi ngoài lỗi lập trình — bắt bằng unit test, không phải runtime).

---

## Contract #4 — Concept Strategy Generator

- **Owner:** AI, model tier `complex`.
- **Input:** `DesignBrief` (#1).
- **Output:** `ConceptStrategy[3]` — mỗi phần tử: `{ name, mainIdea,
  targetAudience, priorities[], tradeoffs[], costTier }`.
- **Acceptance Criteria:**
  - Không có 2/3 strategy trùng nhau ở CẢ 3 tiêu chí: `priorities[]`,
    `costTier`, và định hướng công năng chính (kiểm tra bằng so sánh
    deterministic, không phải "cảm thấy giống nhau").
  - Mỗi strategy phải có đủ 6 field, không field nào rỗng.
- **Failure Handling:** Trùng lặp → retry 1 lần (đổi nhẹ prompt, yêu cầu
  "3 phương án phải khác nhau rõ ở đúng các tiêu chí X/Y/Z còn thiếu").
  Vẫn trùng sau retry → dừng, báo Founder (không tự ý hiển thị 3 phương án
  na ná nhau).

---

## Contract #5 — Space Planner (Design Intent Graph Generator)

- **Owner:** AI, model tier `complex`. **Đây là contract rủi ro AI cao
  nhất trong toàn bộ pipeline** — cần benchmark kỹ nhất (Contract #4 ở
  doc 09 mục B).
- **Input:** `DesignBrief` (#1) + 1 phần tử `ConceptStrategy` (#4).
- **Output:** `DesignIntentGraph`:
  ```text
  {
    buildingContext: { frontage, depth, floors, roofType, architecturalStyle },
    floors: [{
      level, label,
      spaces: [{
        id, type, zone, areaWeight,
        facadeExposure: string[],   // vd ["front"]
        note
      }]
    }],
    relationships: [{ type: "adjacency"|"connection"|"visualOpenTo"|"sequence", from, to }]
  }
  ```
- **Acceptance Criteria:** (kiểm tra ở Contract #6, KHÔNG tự kiểm tra ở
  đây — Space Planner chỉ có nhiệm vụ SINH, không tự validate chính mình,
  đúng nguyên tắc "AI không tự kiểm tra AI").
- **Failure Handling:** Không xử lý lỗi ở bước này — mọi lỗi phát hiện ở
  Contract #6 (Layout Validator), quay lại retry Contract #5 với thông tin
  lỗi cụ thể đính kèm prompt.

---

## Contract #6 — Layout Validator

- **Owner:** 100% Deterministic.
- **Input:** `DesignIntentGraph` (#5) + `ConstraintSet` (#3, đọc từ
  Requirement — **KHÔNG đọc lại từ DesignBrief**, đúng nguyên tắc "2 nguồn
  độc lập" ở doc 08 mục 3).
- **Output:** `{ passed: boolean, errors: string[] }`.
- **Acceptance Criteria (rule cụ thể):**
  - Đếm `spaces[].type` khớp CHÍNH XÁC `ConstraintSet.mustInclude`.
  - Không có `spaces[].type` nào nằm trong `ConstraintSet.mustNotInclude`.
  - Tổng `areaWeight` mọi tầng, quy đổi theo `totalFloorArea` thật, lệch
    không quá NGƯỠNG % so với `exactDimensions` (Open Decision: chốt %
    trước khi build — đề xuất khởi điểm 10%, cần Founder xác nhận).
  - Đồ thị `connection` liên thông (mọi Space có đường đi tới Space loại
    `entrance`).
  - `hasElderly=true` → tồn tại `spaces[].type=bedroom` ở `level=1` với
    số bước `connection` tới `entrance` ≤ NGƯỠNG (đề xuất ≤ 2, cần xác
    nhận).
  - Vị trí Zone của `staircase` giống nhau ở mọi tầng.
  - Không `relationships[].from/to` trỏ tới `id` không tồn tại.
- **Failure Handling:** `passed=false` → quay lại Contract #5, retry TỐI
  ĐA 1 lần kèm `errors[]` cụ thể trong prompt sửa. Vẫn fail sau retry →
  đánh dấu Concept này `status=failed`, KHÔNG tự ý đẩy layout sai xuống
  Geometry — hiển thị cho Founder biết 1/3 concept lỗi, không chặn 2
  concept còn lại.

---

## Contract #7 — Geometry Solver (Materialization Strategy)

- **Owner:** 100% Deterministic. Chiến lược cụ thể (Treemap/slice-and-dice
  cho POC — xem doc 06 mục A Hướng 3) CÓ THỂ thay đổi mà không ảnh hưởng
  contract này (input/output giữ nguyên).
- **Input:** `DesignIntentGraph` đã pass Contract #6.
- **Output:** `Geometry`:
  ```text
  { floors: [{ level, spaces: [{ id, x, y, width, height }], doors: [{ betweenIds: [id,id], position }] }] }
  ```
- **Acceptance Criteria:**
  - Không có 2 hình chữ nhật nào chồng lấn (kiểm tra toán học, không cần
    AI).
  - Mọi cặp Space có `relationship.type=connection` PHẢI có cạnh chung
    (để đặt được `doors[]`).
  - Tổng diện tích hình học mỗi tầng khớp `exactDimensions.footprint`
    (sai số ≤ 1% — đây là phép tính, không phải suy luận, nên sai số phải
    RẤT nhỏ, khác hẳn ngưỡng 10% ở Contract #6 vốn đo trọng số tương đối).
- **Failure Handling:** Đây là contract KHÔNG ĐƯỢC PHÉP fail nếu input đã
  qua Contract #6 — nếu fail, đó là **bug phần mềm** trong thuật toán chia
  hình chữ nhật, không phải lỗi input — sửa code, không retry AI.

---

## Contract #8 — Descriptor Compiler

- **Owner:** 100% Deterministic, dùng **bảng tra cứu cố định** (nội dung
  bảng là Open Decision — xem cuối tài liệu).
- **Input:** `ConstraintSet` (#3) + `DesignIntentGraph` (#5, đã pass #6) +
  `Geometry` (#7).
- **Output:** `FacadeDescriptor` (+ `ExteriorDescriptor`, `InteriorDescriptor`
  khi làm Interior):
  ```text
  {
    floors, roofType, architecturalStyle,
    hasVehicleEntrance: boolean, hasPedestrianEntrance: boolean,
    facadeContinuity: boolean, hasProjectingSlab: boolean,
    windowOnly: boolean, ...  // 1 field boolean/enum RÕ RÀNG cho mỗi mục
                              // trong bảng tra cứu, KHÔNG phải câu văn
  }
  ```
- **Acceptance Criteria:**
  - Mọi mục trong `ConstraintSet.mustNotInclude`/`mustInclude` PHẢI có
    ít nhất 1 field tương ứng trong Descriptor (kiểm tra bằng cách đối
    chiếu 2 danh sách — nếu bảng tra cứu thiếu 1 mục, contract này FAIL,
    không được im lặng bỏ qua).
  - Descriptor là DỮ LIệU CÓ KIỂU (boolean/enum/number), không phải chuỗi
    văn xuôi tự do — đây là điều kiện bắt buộc để kiểm tra được (đúng lý
    do có tầng Descriptor, doc 09 mục A).
- **Failure Handling:** Thiếu mục tra cứu cho 1 constraint mới gặp lần đầu
  → dừng, báo "cần bổ sung bảng tra cứu cho constraint X" — đây LÀ MỘT
  loại lỗi hợp lệ cần Founder/Claude bổ sung bảng, không phải bug.

---

## Contract #9 — Prompt Compiler

- **Owner:** 100% Deterministic, 1 implementation/`ImageProvider`.
- **Input:** `FacadeDescriptor`/`ExteriorDescriptor` (#8).
- **Output:** Payload gọi API riêng của 1 `ImageProvider` cụ thể (chuỗi
  prompt + tham số riêng model, vd `negativePrompt` nếu model hỗ trợ).
- **Acceptance Criteria:**
  - Mọi field `true`/giá trị cụ thể trong Descriptor PHẢI xuất hiện dưới
    dạng phát biểu TÍCH CỰC trong prompt (không chỉ dựa vào việc không
    nhắc tới điều bị cấm).
  - Nếu model hỗ trợ tham số phủ định riêng → dùng CẢ 2 lớp (tích cực
    trong prompt chính + phủ định trong tham số riêng) — phòng hờ kép
    (doc 09 mục A).
- **Failure Handling:** Không áp dụng (deterministic, lỗi là lỗi lập
  trình, bắt bằng unit test/snapshot test khi thêm `ImageProvider` mới).

---

## Contract #10 — Exterior/Interior Image Generator

- **Owner:** AI (Image model, qua `ImageProvider`).
- **Input:** Payload từ Contract #9.
- **Output:** 1 ảnh (nhị phân), lưu tạm base64 (giai đoạn POC/MVP đầu,
  doc 05 mục C) hoặc blob storage (sau).
- **Acceptance Criteria:** Không tự động hoá được hoàn toàn — xem Contract
  #11 (tuỳ chọn) cho phần kiểm tra tự động hẹp; phần còn lại là Founder
  xem bằng mắt (Visual/Architectural Quality, doc 08 mục 5).
- **Failure Handling:** Lỗi API (timeout/rate limit) → retry theo chính
  sách riêng của `ImageProvider` (khác nhau theo nhà cung cấp — không
  chuẩn hoá cứng ở tầng contract này).

---

## Contract #11 — Visual Constraint Checker *(tuỳ chọn, quyết định ở Open
Decision cuối tài liệu)*

- **Owner:** AI, vision model, câu hỏi NHỊ PHÂN HẸP (không chấm điểm kiến
  trúc toàn diện — doc 08 mục 4.3).
- **Input:** Ảnh (#10) + `ConstraintSet.mustNotInclude`/`mustInclude`
  (chỉ phần liên quan tới yếu tố NHÌN THẤY ĐƯỢC, vd không kiểm tra "có 4
  phòng ngủ" bằng ảnh ngoại thất vì không thấy được).
- **Output:** `{ violations: string[] }` (rỗng = không vi phạm).
- **Acceptance Criteria:** `violations.length === 0`.
- **Failure Handling:** Có vi phạm → tự động regenerate Contract #10 TỐI
  ĐA 1 lần với prompt tăng cường (nhấn mạnh lại constraint bị vi phạm, đặt
  đầu câu). Vẫn vi phạm sau retry → đánh dấu Concept `status=needs_review`,
  hiển thị cảnh báo rõ cho Founder, KHÔNG tự động gửi cho khách hàng.

---

## Contract #12 — Concept Package Assembler

- **Owner:** 100% Deterministic.
- **Input:** Toàn bộ output #4 → #10 (hoặc #11 nếu có) cho 1 Concept.
- **Output:** 1 `Concept` hoàn chỉnh (đúng domain model doc 05 mục D).
- **Acceptance Criteria:** Không field nào trong Concept bị thiếu so với
  các contract phía trên đã sinh ra (không tự ý bỏ bớt dữ liệu khi đóng
  gói).
- **Failure Handling:** Thiếu 1 phần (vd ảnh generation fail nhưng layout
  vẫn có) → `Concept.status` phản ánh đúng phần nào thiếu, không giả vờ
  hoàn chỉnh.

---

## Contract #13 — Customer Feedback Recorder

- **Owner:** 100% Deterministic.
- **Input:** Lựa chọn/góp ý từ khách hàng (qua link chia sẻ, doc 05 mục E).
- **Output:** `ConceptFeedback` record.
- **Acceptance Criteria:** Append-only — không sửa/xoá feedback cũ.
- **Failure Handling:** Không áp dụng.

---

## Open Decisions cần Founder chốt TRƯỚC Phase B (Manual POC)

Đây là các con số/nội dung cụ thể mà đặc tả ở trên cố tình để trống (đánh
dấu rõ trong từng contract) — không phải quyết định kiến trúc, là NỘI
DUNG cần điền:

1. **Ngưỡng "mật độ phòng đáng ngờ"** ở Contract #2 (đề xuất khởi điểm:
   diện tích/phòng ngủ < 15m² thì nghi ngờ — cần Founder xác nhận theo
   kinh nghiệm thực tế, tôi không có dữ liệu thị trường để tự tin chọn số
   này).
2. **Bảng ngưỡng ngân sách theo `constructionScope`/vùng giá** ở Contract
   #2 — cần dữ liệu thị trường thật từ Founder, tôi không tự bịa được.
3. **Ngưỡng sai số diện tích 10%** ở Contract #6 (so trọng số tương đối)
   — con số đề xuất, không phải đã kiểm chứng.
4. **Ngưỡng "gần cửa chính" cho rule người già** ở Contract #6 (đề xuất
   ≤ 2 bước `connection`) — cần xác nhận đây là mức hợp lý.
5. **Bảng tra cứu Descriptor đầy đủ** ở Contract #8 — hiện chỉ có ví dụ
   garage/balcony (doc 09), cần bổ sung trước khi Manual POC chạy hết các
   ca test thực tế.
6. **Có làm Contract #11 (Visual Constraint Checker) ngay hay để Founder
   tự xem bằng mắt ở Manual POC trước?** — đề xuất: **Manual POC (Phase
   B) tự làm bằng mắt** (đúng bản chất "manual"), Contract #11 chỉ cần
   thiết khi TỰ ĐỘNG HOÁ ở giai đoạn implementation sau này.

*(Quyết định kỹ thuật khác không liệt kê ở đây — Claude tự xử lý khi tới
lúc implement, đúng phạm vi "câu hỏi Founder phải chốt" đã thống nhất từ
đầu, doc 05 mục H.)*

---

## Trạng thái

Phase A hoàn thành. Chờ Founder xác nhận (đặc biệt 6 Open Decision ở
trên, ít nhất là #6 vì ảnh hưởng trực tiếp cách chạy Phase B) trước khi
chuyển sang Phase B — Manual POC.
