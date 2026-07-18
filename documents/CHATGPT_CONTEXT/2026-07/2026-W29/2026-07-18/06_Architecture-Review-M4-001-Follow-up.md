# M4-001 Follow-up — Architecture Review Response (KHÔNG CODE)

**Ngày:** 2026-07-18
**Phạm vi:** Chỉ kiến trúc/AI workflow/domain model/trade-off — không code,
không migration, không schema thật, không API, không UI (đúng yêu cầu).

---

## Phản hồi nhanh 5 điểm challenge

### 1. Floor Plan Demo — Founder đúng, tôi rút lại đề xuất loại bỏ

Sau khi khảo sát thêm (xem mục A), tôi đồng ý: **Floor Plan Demo khả thi
trong MVP**, KHÔNG cần đến mức constraint-solver/CAD. Lý do tôi đề xuất
loại bỏ ở planning trước là vì mới chỉ nghĩ tới 2 hướng cực đoan (ảnh AI vẽ
mặt bằng, hoặc LLM tự sinh toạ độ chính xác) — cả 2 đều rủi ro cao. Sau khi
khảo sát thêm, có 1 hướng thứ 3 (mục A, Hướng 3) rủi ro thấp hơn nhiều mà
tôi đã bỏ sót. Xin lỗi vì đánh giá thiếu ở vòng trước — đây đúng là loại
sai sót "under-engineering" mà mục D bên dưới tự phản biện.

### 2. Floor Plan không cần là bài toán CAD — đúng, có cơ sở kỹ thuật cụ thể

Founder đúng, và có lý do kỹ thuật rõ ràng (không chỉ là cảm tính): nhà phố
Việt Nam gần như luôn là **1 hình chữ nhật đơn giản** (Requirement đã có
sẵn `site.frontage` × `site.depth`). Bài toán không phải "vẽ mặt bằng kiến
trúc tổng quát" (khó, đúng là gần CAD) mà là **"chia 1 hình chữ nhật đã
biết kích thước thành các phòng không chồng lấn"** — đây là bài toán hình
học/thuật toán ĐÃ CÓ LỜI GIẢI CHUẨN (rectangle subdivision / treemap
algorithm), không phải nghiên cứu mới. Chi tiết ở mục A Hướng 3.

### 3. Interior Concept — nên tách milestone riêng, nhưng thiết kế dữ liệu ngay từ đầu để không phải đổi sau

Đồng ý với Founder là "không nhất thiết làm ngay". Đề xuất: **không làm
trong milestone Floor Plan/Exterior đầu tiên** (lý do chi phí — xem mục
C), nhưng JSON layout (mục B) phải đủ chi tiết để Interior dùng lại được
mà không cần đổi schema — tôi đã thiết kế theo hướng đó (mỗi phòng có
`type`/`zone` đủ để viết prompt nội thất sau này).

### 4. AI Review Loop — đồng ý, đây là 1 bước tôi thiếu ở bản trước

Đã bổ sung bước **"Requirement Sanity Checker"** vào pipeline (mục C,
bước 2) — chạy TRƯỚC khi sinh Concept Strategy, không phải sau.

### 5. Single Source of Truth — đúng hướng, đề xuất làm giàu thêm JSON

Đồng ý đây là hướng đúng. JSON ở planning trước (chỉ có `adjacentTo`) CHƯA
đủ cho Floor Plan hình học + Exterior/Interior prompt nhất quán — đề xuất
bản JSON giàu hơn ở mục B.

---

## A. Floor Plan Demo có khả thi trong MVP không? (4 hướng, so sánh)

### Hướng 1 — Image model vẽ trực tiếp mặt bằng (như ảnh phối cảnh)

LLM/image model sinh thẳng 1 ảnh mặt bằng.

- **Chất lượng:** Thấp-trung bình. Đây là điểm yếu đã biết của image model
  (text/số trong ảnh sai, phòng thiếu/thừa, không khớp với Functional
  Layout JSON dùng ở nơi khác — đúng lỗi đã liệt kê ở planning trước mục
  7.9).
- **Effort:** Thấp (tái dùng hạ tầng ảnh phối cảnh).
- **Tốc độ:** Nhanh.
- **Maintainability:** Kém — không sửa được 1 phòng mà không sinh lại cả
  ảnh; không có dữ liệu cấu trúc đứng sau để đối chiếu.
- **Kết luận:** Loại — không dùng làm nguồn chính.

### Hướng 2 — LLM tự sinh toạ độ (x, y, width, height) tuyệt đối, code chỉ render

- **Chất lượng:** Không ổn định — LLM sinh toạ độ dễ chồng lấn, tỷ lệ vô
  lý, cần validate + retry nhiều.
- **Effort:** Trung bình (cần bộ kiểm tra chồng lấn hình học phức tạp).
- **Tốc độ:** Trung bình (có thể phải retry).
- **Maintainability:** Khá — dữ liệu có cấu trúc, nhưng bước SINH là điểm
  không tin cậy.
- **Kết luận:** Rủi ro cao hơn cần thiết so với Hướng 3 — không chọn làm
  chính, có thể thử nghiệm song song ở POC để so sánh thực tế.

### Hướng 3 — HYBRID: LLM gán vùng/tỷ trọng định tính, thuật toán chia hình chữ nhật (deterministic) tính toạ độ thật ⭐ ĐỀ XUẤT CHÍNH

**Cách hoạt động:**

1. Requirement đã có `frontage` × `depth` (hoặc suy ra từ `buildingFootprint`
   nếu thiếu 1 trong 2) → biết chính xác hình chữ nhật cần chia cho mỗi tầng.
2. LLM (bước Space Planner, mục C) chỉ cần trả lời câu hỏi ĐỊNH TÍNH mà nó
   làm tốt (vì đúng loại suy luận ngôn ngữ tự nhiên nó đã thấy hàng nghìn
   lần trong dữ liệu huấn luyện — bố cục nhà phố Việt Nam rất chuẩn hoá):
   - Mỗi phòng thuộc **vùng** nào (trước/giữa/sau, trái/phải) — vd "phòng
     khách: trước", "bếp: giữa", "WC: sau-góc".
   - **Tỷ trọng diện tích tương đối** giữa các phòng (không phải m² tuyệt
     đối) — vd "phòng khách nặng hơn phòng ngủ 1.3 lần".
   - Phòng nào liền kề phòng nào (`adjacentTo` — đã có ở bản trước).
3. **Thuật toán chia hình chữ nhật** (thuần code, KHÔNG AI — họ thuật toán
   "treemap"/"slice-and-dice partitioning", đã có lời giải chuẩn, không
   phải nghiên cứu mới) đọc vùng + tỷ trọng, tính ra toạ độ (x, y, w, h)
   thật cho từng phòng — **về mặt toán học KHÔNG THỂ chồng lấn** (thuật
   toán chia liên tiếp một hình chữ nhật thành các hình chữ nhật con nhỏ
   hơn, luôn khít nhau).
   - Cửa giữa 2 phòng: đặt tại trung điểm cạnh chung của 2 hình chữ nhật kề
     nhau đã đánh dấu `adjacentTo` — cũng thuần hình học, không cần AI đoán.
   - Cầu thang: ép vị trí (vùng) giống nhau ở mọi tầng — thêm 1 rule ở
     Layout Validator (mục C) để đảm bảo tính nhất quán giữa các tầng,
     đúng thực tế xây dựng.
4. SVG renderer (thuần code) vẽ hình chữ nhật + nhãn tên phòng + icon cầu
   thang + khe cửa — không có bước AI nào trong khâu vẽ.

- **Chất lượng:** Trung bình-cao, VÀ ỔN ĐỊNH — hình học đúng 100% theo
  toán (không chồng lấn, không lệch diện tích so với Requirement), phần
  "đẹp hay không" là vấn đề thiết kế UI (kiểm soát được), không phải rủi
  ro AI.
- **Effort:** Trung bình — thuật toán chia hình chữ nhật (~100-200 dòng
  code thuần, KHÔNG cần thêm dependency mới, đúng yêu cầu "không thêm
  dependency chỉ để thử") + SVG renderer (tương tự độ khó vẽ 1 biểu đồ).
- **Tốc độ:** Nhanh — bước tính toán hình học tức thời, không tốn API
  call, không cần retry (vì input đã qua Layout Validator trước).
- **Maintainability:** Cao — mặt bằng luôn tái tạo được 100% từ đúng 1
  JSON, đổi style/màu không cần gọi lại AI.
- **Giới hạn đã biết:** Giả định footprint là hình chữ nhật đơn giản —
  đúng với đa số nhà phố (khớp `buildingType: townhouse` và property seed
  hiện có: 5m × 18m). Nhà hình L/không đều (biệt thự phức tạp) cần mở rộng
  thuật toán sau (chia thành 2+ hình chữ nhật con trước khi áp dụng) —
  không chặn MVP, vì `buildingType` phổ biến nhất của khách hàng mục tiêu
  là `townhouse`.
- **Kết luận: ĐỀ XUẤT CHÍNH.**

### Hướng 4 — Constraint solver / thuật toán space-planning tổng quát

Giải bài toán bố trí phòng từ đồ thị liền kề một cách tổng quát (không giả
định hình chữ nhật) — đây MỚI thực sự là hướng nghiên cứu học thuật khó
(có hẳn các paper AI/kiến trúc riêng về chủ đề này).

- **Kết luận:** Loại khỏi MVP — đúng như đánh giá ban đầu của tôi, nhưng
  giờ áp dụng cho hướng NÀY (tổng quát), không áp dụng cho toàn bộ bài
  toán Floor Plan như tôi đã nhầm lẫn ở vòng trước.

**Trả lời câu hỏi A:** Có, khả thi trong MVP — bằng Hướng 3. Đề xuất thêm
vào POC (mục G, planning trước): thử cả Hướng 2 và Hướng 3 song song trên
cùng 1 Requirement thật, so sánh trực quan trước khi chốt.

---

## B. JSON Single Source of Truth — bản làm giàu

Đồng ý hướng 1 JSON làm nguồn trung tâm. Bản ở planning trước (chỉ có
`adjacentTo`) chưa đủ cho Hướng 3 + Exterior/Interior nhất quán — đề xuất
bản sau (**vẫn không có toạ độ tuyệt đối** — toạ độ là kết quả TÍNH RA từ
JSON này, không phải một phần của JSON, giữ đúng nguyên tắc "derived vs
persisted tách bạch" đã dùng cho Requirement Score/Readiness):

```json
{
  "buildingContext": {
    "frontage": 5,
    "depth": 18,
    "floors": 3,
    "roofType": "flat",
    "architecturalStyle": "modern"
  },
  "floors": [
    {
      "level": 1,
      "label": "Tầng 1",
      "rooms": [
        {
          "id": "living_room",
          "name": "Phòng khách",
          "type": "living_room",
          "zone": { "depthPosition": "front", "widthPosition": "center" },
          "areaWeight": 1.3,
          "adjacentTo": ["entrance", "staircase"],
          "facade": { "isFrontFacing": true, "hasWindow": true },
          "openTo": null,
          "note": "Gần cửa chính, nhìn ra sân trước"
        },
        {
          "id": "staircase",
          "name": "Cầu thang",
          "type": "staircase",
          "zone": { "depthPosition": "middle", "widthPosition": "center" },
          "areaWeight": 0.4,
          "adjacentTo": ["living_room", "kitchen"],
          "facade": { "isFrontFacing": false, "hasWindow": false },
          "openTo": null,
          "note": "Vị trí phải giữ nguyên ở mọi tầng"
        }
      ]
    }
  ]
}
```

**Vì sao đủ cho cả 4 loại output (đúng câu hỏi B):**

| Output cần | Lấy từ field nào |
|---|---|
| Floor Plan (Hướng 3, mục A) | `zone` + `areaWeight` + `adjacentTo` → input trực tiếp cho thuật toán chia hình chữ nhật |
| Exterior Prompt | `buildingContext` + phòng có `facade.isFrontFacing=true` (số cửa sổ mặt tiền, có ban công không — suy từ phòng nào mở ra ngoài) |
| Interior Prompt (tương lai) | mỗi phòng: `type` + `areaWeight` (ước diện tích) + `note` — đủ viết 1 prompt nội thất riêng |
| Concept Summary | tổng hợp danh sách `rooms[].name` theo `floors[].label` — chính là "Functional Layout" dạng text đã có ở planning trước |
| Estimate Support (tương lai, chưa cần) | `rooms[].areaWeight` × diện tích tầng thật → diện tích m² từng phòng, có thể thay thế hệ số kinh nghiệm thô của Rule R4/R5 sau này |

**Không đủ cho:** hồ sơ kỹ thuật thật (không có độ dày tường, không có cao
độ, không có kích thước cửa chuẩn) — đúng chủ đích, không phải thiếu sót.

---

## C. Pipeline đầy đủ (đã bổ sung các bước Founder chỉ ra)

```text
Project Brief (Brief Ready)
   │
   ▼
[1] Design Brief Normalizer            — LLM, default tier
   │
   ▼
[2] Requirement Sanity Checker  (MỚI — trả lời câu 4)
   - phần deterministic: vài tỷ lệ đơn giản kiểm tra được ngay bằng code
     (vd areaPerBedroom = totalFloorArea / bedrooms — nếu < ngưỡng hợp lý
     thì nghi ngờ)
   - phần LLM (default tier): các trường hợp mâu thuẫn tinh tế hơn code
     không bắt được (vd ngân sách thấp nhưng yêu cầu nhiều phòng + nội
     thất cao cấp)
   - phát hiện vấn đề → KHÔNG generate ngay, hỏi lại Founder/khách hàng
     (tái dùng UI "Thiếu / Câu hỏi" đã có) — đúng ý Founder "không nên cố
     generate output vô lý"
   │
   ▼
[3] Concept Strategy Generator          — LLM, complex tier (3 strategy/1 lần gọi)
   │
   ▼ (lặp 3 lần, 1 lần/concept)
[4] Space Planner (Functional Layout)    — LLM, complex tier
   → sinh đúng JSON mục B (zone + areaWeight + adjacentTo, KHÔNG toạ độ)
   │
   ▼
[5] Layout Validator                     — deterministic (rule ở planning
   trước + rule MỚI: vị trí cầu thang nhất quán giữa các tầng, zone hợp lệ)
   │
   ▼
[6] Layout Optimizer (Geometry Solver)   — MỚI, deterministic, KHÔNG AI
   → thuật toán chia hình chữ nhật (mục A Hướng 3): JSON zone/weight
     → toạ độ (x,y,w,h) thật, không chồng lấn (đúng toán học)
   │
   ▼
[7] Floor Plan Renderer                  — MỚI, deterministic (SVG từ toạ độ bước 6)
   │
   ▼
[8] Prompt Builder                       — deterministic code (không LLM tự
   viết prompt tự do) — đọc CÙNG 1 JSON mục B, sinh prompt Exterior (và
   Interior khi làm sau) → đây chính là cơ chế giữ nhất quán "bằng cấu
   trúc" thay vì kiểm tra sau
   │
   ▼
[9] Exterior Perspective Generator       — image model, 1 ảnh/concept
   │
   ▼
[10] Concept Package Assembler           — deterministic
   │
   ▼
Founder xem → gửi khách hàng xem/chọn/góp ý → Founder tự quyết định
regenerate (không tự động)
```

**Về "Consistency Checker" (Founder hỏi ở câu C):** Phần lớn tính nhất
quán đã được đảm bảo **bằng cấu trúc** — bước 8 lấy dữ liệu từ CÙNG 1 JSON
đã qua validate ở bước 5, nên Floor Plan và Exterior Prompt không thể lệch
nhau về số tầng/số phòng (vì cùng xuất phát từ 1 nguồn). Rủi ro còn lại
DUY NHẤT là: **ảnh do image model vẽ ra có tuân đúng prompt hay không**
(image model có thể "quên" 1 chi tiết dù prompt đúng). Kiểm tra tự động
việc này cần thêm 1 lời gọi LLM có khả năng nhìn ảnh (vision model) — tốn
thêm chi phí + độ trễ. Đề xuất: **giai đoạn MVP, Founder tự xem lại ảnh
bằng mắt (human-in-the-loop)** thay vì xây bước kiểm tra tự động — đây là
lựa chọn cân bằng chi phí/lợi ích, không phải bỏ sót (ghi rõ ở Open
Decision mới, mục cuối).

---

## D. Phản biện over-engineering / under-engineering

**Under-engineering ở bản planning trước (đã sửa ở bản này):**

- Loại bỏ Floor Plan Demo hoàn toàn — sai, đã sửa (mục A).
- Thiếu bước Requirement Sanity Checker — đã bổ sung (mục C bước 2).
- JSON layout quá đơn giản (chỉ adjacency) để làm SSOT thật sự — đã làm
  giàu (mục B).

**Over-engineering cần tránh khi triển khai bản này (tự cảnh báo trước):**

- **Không xây Hướng 4** (constraint solver tổng quát) — Hướng 3 đủ dùng
  cho case chính (nhà phố hình chữ nhật).
- **Không xây Consistency Checker tự động (vision model) ngay** — human
  review thay thế được ở MVP, thêm sau nếu thực tế chứng minh cần.
- **Không mở rộng thuật toán chia hình chữ nhật cho footprint phức tạp
  (chữ L, không đều) ngay** — chỉ xử lý hình chữ nhật đơn giản trước,
  đúng case phổ biến nhất.
- **Không normalize `rooms[]` thành bảng Prisma riêng** — vẫn nằm trong
  `Concept.data` JSON (3 bảng domain model ở planning trước vẫn giữ
  nguyên, KHÔNG cần thêm bảng nào cho những gì bổ sung ở tài liệu này).
- **Không tính toạ độ hình học rồi LƯU LẠI** — tính lại mỗi lần render từ
  JSON zone/weight (như Score/Readiness không lưu, luôn tính lại) — tránh
  2 nguồn dữ liệu có thể lệch nhau.

---

## E. Redesign toàn bộ theo mục tiêu cuối (Project Brief → 3 concept hoàn chỉnh → khách hài lòng)

Pipeline ở mục C **đã là bản redesign** — khác bản planning trước ở 3 điểm
cốt lõi: (1) Floor Plan Demo được đưa lại vào MVP bằng Hướng 3 thay vì bị
cắt, (2) thêm bước Sanity Checker đầu pipeline để không lãng phí tiền
generate cho input vô lý, (3) JSON SSOT đủ giàu để Exterior/Interior/Floor
Plan cùng bắt nguồn 1 chỗ, giảm rủi ro lệch nhau xuống mức thấp nhất có
thể mà không cần thêm 1 bước kiểm tra tốn kém.

Tôi cho rằng pipeline này đã ở mức "đủ tốt để demo, đủ nhỏ để 1 solo
founder làm được" — không thấy điểm nào cần redesign thêm nữa tại thời
điểm này. Nếu POC (xem cập nhật dưới) phát hiện vấn đề mới, sẽ điều chỉnh
tiếp — đúng tinh thần Startup Flexibility.

---

## Cập nhật cho POC (planning trước, mục G)

POC nên mở rộng thêm (so với planning trước): ngoài strategy + ảnh phối
cảnh, thử LUÔN thuật toán chia hình chữ nhật (Hướng 3) trên Requirement
thật (frontage 5m × depth 18m, 3 tầng, 4 phòng ngủ/3 WC) — vì đây giờ là
phần MVP, không phải phần bị cắt. Vẫn không đụng DB/UI, vẫn ngân sách
≤ 2 USD (thuật toán chia hình chữ nhật không tốn phí AI, chỉ tốn phí cho
phần LLM sinh JSON zone/weight — rẻ hơn ảnh nhiều).

## Open Decision mới (bổ sung vào planning trước)

6. **Consistency Checker tự động bằng vision model — làm ngay hay để
   Founder tự xem bằng mắt ở MVP?** (mục C) — đề xuất: để sau, Founder xác
   nhận.
7. **Interior Concept — xác nhận tách milestone riêng sau Floor
   Plan+Exterior**, đúng như Founder đã nói "không nhất thiết làm ngay" —
   chỉ cần xác nhận thứ tự, JSON đã sẵn sàng cho việc này khi làm tới.

---

## Recommendation

Kiến trúc ở tài liệu này (kết hợp với planning M4-001 gốc, trừ phần Floor
Plan đã sửa) đã đủ rõ để chuyển sang POC mở rộng (thử cả Hướng 2 và Hướng
3 cho Floor Plan, cùng lúc với POC strategy+ảnh phối cảnh đã đề xuất
trước). Sau khi Founder xem kết quả POC (bằng mắt: hình chữ nhật chia có
hợp lý không, ảnh có nhất quán không) và chốt 2 Open Decision mới ở trên,
có thể mở milestone implementation đầu tiên.
