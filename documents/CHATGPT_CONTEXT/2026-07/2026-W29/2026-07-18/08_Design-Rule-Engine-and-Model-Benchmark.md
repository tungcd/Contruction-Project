# M4-001 Follow-up #3 — Design Rule Engine & Model Consistency Benchmark

**Ngày:** 2026-07-18
**Phạm vi:** Thuần kiến trúc/chiến lược — không code, không implement,
không schema, không API, không UI.
**Bối cảnh:** Founder vừa test thật bằng ChatGPT — ảnh đẹp nhưng SAI
Requirement (Brief nói không gara/không ban công/4 phòng ngủ/75m²/mái
Thái, nhưng output vẫn có gara + ban công). Đây chính là rủi ro tôi đã nêu
ở review #1 (mục 7.9 "prompt injection"/lệch dữ liệu) nhưng lúc đó còn ở
dạng lý thuyết — giờ đã có bằng chứng thật, cần xử lý nghiêm túc.

---

## Chẩn đoán vì sao lỗi này xảy ra

Kiến trúc `Requirement → Prompt → Image` mà Founder đang thấy có 1 lỗ hổng
gốc rễ: **image model có "prior" (thiên kiến mặc định) rất mạnh về "nhà ở
điển hình"** — trong dữ liệu huấn luyện của nó, tuyệt đại đa số ảnh nhà có
gara/ban công, nên khi prompt không nói RÕ RÀNG VÀ MẠNH "không có X", model
có xu hướng tự thêm X vào theo mặc định. Đây không phải lỗi ngẫu nhiên —
đây là hành vi có thể dự đoán trước và PHẢI thiết kế để chống lại, không
thể chờ "may thì đúng".

Kết luận: cần đúng như Founder đề xuất — 1 lớp **Design Rule Engine** độc
lập, đứng giữa Spatial Layout Model và Prompt Builder, có quyền phủ quyết/
ép buộc, không phụ thuộc vào việc AI có "nhớ" đúng constraint hay không.

---

## 1. Rule nào nên nằm trong Rule Engine?

Nguyên tắc phân loại: **rule thuộc Rule Engine khi nó có thể trả lời
ĐÚNG/SAI một cách khách quan, và sai thì có hậu quả thật** (khách hàng
thấy thứ không đặt hàng). Đề xuất 4 nhóm:

### Nhóm 1 — Ràng buộc có/không (Presence/Absence)
`garage: false` → không được xuất hiện Space nào loại `garage`, VÀ
prompt cuối cùng phải có phát biểu phủ định rõ ràng. Đây là nhóm **quan
trọng nhất và dễ bị bỏ sót nhất** — xem mục riêng "Ràng buộc phủ định"
dưới đây, vì đây đúng là loại lỗi Founder vừa gặp phải.

### Nhóm 2 — Ràng buộc định lượng (đếm/kích thước)
Số phòng ngủ = 4, số WC = 3, `buildingFootprint` = 75m², `totalFloorArea`.
Kiểm tra được bằng cách đếm Space trong Spatial Layout Model (không cần
nhìn ảnh) — nhóm này rẻ nhất để đảm bảo đúng vì kiểm tra được TRƯỚC khi
tốn tiền sinh ảnh.

### Nhóm 3 — Ràng buộc định danh chính xác (enum, không suy diễn)
`roofType = thai`, `architecturalStyle`. Đây là nhóm rủi ro ẩn: "mái Thái"
là thuật ngữ tiếng Việt — nếu để LLM tự dịch sang tiếng Anh lúc viết
prompt, nó có thể diễn giải sai hoặc mơ hồ ("Thai roof" với 1 image model
không rành kiến trúc Việt Nam có thể hiểu nhầm). Đề xuất: **bảng tra cứu
thuật ngữ cố định** (roofType → mô tả kiến trúc chuẩn, cụ thể, đã kiểm
chứng trước) do người viết một lần, KHÔNG để LLM tự dịch mỗi lần — đúng
nguyên tắc "không suy diễn ngoài enum" đã áp dụng cho `roofTypeNote`/
`architecturalStyleNote` ở Requirement (không ép về giá trị gần đúng).

### Nhóm 4 — Ràng buộc phủ định (Negative Constraints) — QUAN TRỌNG NHẤT

Đây là nhóm gây ra lỗi Founder vừa gặp, nên tách riêng thành nguyên tắc:

> Mọi field `boolean = false` trong Requirement (garage, balcony, worship
> room...) PHẢI được Rule Engine chuyển thành **1 câu phủ định tường minh,
> độc lập, đặt ở vị trí nổi bật trong prompt** — KHÔNG chỉ dựa vào việc
> "không nhắc tới thì sẽ không có". Image model không hoạt động theo logic
> đó; im lặng ≠ phủ định với model ảnh.

Nếu API/model được dùng có tham số "negative prompt" riêng (nhiều model
dạng Stable-Diffusion/Flux có), Rule Engine nên tách phủ định ra tham số
đó thay vì nhét chung vào 1 đoạn văn — tăng khả năng model tuân thủ.

---

## 2. Rule nào để AI tự quyết?

Bất kỳ điều Requirement ghi `null` (chưa biết) hoặc không có field tương
ứng: màu sắc vật liệu cụ thể, hoạ tiết mặt tiền, tiểu tiết cảnh quan, tỷ
lệ cửa sổ trong khuôn khổ phong cách đã chọn, mood ánh sáng khi render.

**Điểm quan trọng cần nhấn mạnh:** "AI tự quyết" chỉ nên xảy ra **SỚM và
CÓ GHI LẠI** — tức là ở bước Concept Strategy Generator (đã có ở review
#1), nơi AI CAM KẾT một lựa chọn cụ thể kèm giải thích ("chọn mái Thái vì
phù hợp phong cách nhiệt đới của Concept B"), **KHÔNG PHẢI** để mặc định
ngầm xảy ra ở tận bước viết prompt ảnh (nơi không ai kiểm tra lại được lựa
chọn đó là gì hay tại sao). Nguyên tắc: **mọi quyết định sáng tạo phải xảy
ra ở nơi có thể audit lại, không phải trong "hộp đen" của prompt cuối
cùng.**

---

## 3. Boundary giữa Spatial Model và Rule Engine

Đây là câu hỏi quan trọng nhất, vì nếu trộn lẫn 2 khái niệm này thì lỗi
Founder vừa gặp SẼ TÁI DIỄN dù có Rule Engine. Cần phân biệt rõ:

> **Spatial Layout Model = ĐỀ XUẤT của AI** (có thể sai, có thể quên, có
> thể tự ý thêm gara dù không ai bảo). **Rule Engine = THẨM QUYỀN ĐỘC LẬP,
> lấy sự thật TRỰC TIẾP TỪ REQUIREMENT** (không phải từ Spatial Layout
> Model do AI vừa tạo ra).

Nếu Rule Engine chỉ kiểm tra "Spatial Layout Model có tự mâu thuẫn với
chính nó không", nó sẽ BỎ LỠ chính xác loại lỗi Founder vừa thấy — vì nếu
AI đã tự ý nhét 1 Space `garage` vào Spatial Layout Model NGAY TỪ ĐẦU
(sai từ bước 1, không phải sai ở bước prompt), 1 Rule Engine chỉ kiểm tra
nội bộ đồ thị sẽ thấy đồ thị đó "tự nhất quán" và cho qua.

**Vì vậy Rule Engine phải có 2 nguồn dữ liệu độc lập, không phải 1:**

```text
Requirement (đã đóng băng)              Spatial Layout Model (AI đề xuất)
        │                                          │
        ▼                                          │
[Bước A — Deterministic, KHÔNG AI]                  │
Trích "Constraint Set" TRỰC TIẾP từ                 │
Requirement — cùng triết lý pure-function            │
như computeMissingFields/computeReadiness            │
đã có trong codebase:                                │
{                                                    │
  mustNotInclude: ["garage", "balcony"],              │
  mustInclude: {"bedroom": 4, "wc": 3},                │
  exactDimensions: {"footprint": 75},                  │
  exactEnum: {"roofType": "thai"}                       │
}                                                      │
        │                                             │
        ▼◄────────────────────────────────────────────┘
[Bước B — Design Rule Engine — so khớp CHÉO]
- Spatial Layout Model có Space nào nằm trong
  mustNotInclude không? → reject, yêu cầu Space
  Planner sinh lại (không sửa tay, sinh lại có
  kèm lý do lỗi cụ thể để AI tự sửa)
- Có đủ số lượng mustInclude không?
- Có khớp exactDimensions/exactEnum không?
        │
        ▼ (chỉ khi PASS)
[Bước C — Prompt Builder]
Đọc CẢ Constraint Set (bước A) LẪN Spatial Layout
Model đã pass — với mọi mustNotInclude, LUÔN chèn
câu phủ định tường minh vào prompt (kể cả khi Spatial
Layout Model đã đúng — phòng hờ 2 lớp, vì rủi ro
"quên" giờ chuyển sang nằm ở chính image model,
không phải ở dữ liệu nữa)
```

**Trả lời trực tiếp câu hỏi 3:** Ranh giới là **nguồn sự thật**. Spatial
Layout Model không bao giờ được là nguồn duy nhất quyết định "cái gì bắt
buộc phải có/không có" — nguồn đó luôn luôn là Requirement, đọc lại độc
lập ở mỗi bước, không tin tưởng mù quáng vào việc AI đã "chuyển tiếp" đúng
constraint từ bước trước sang bước sau.

---

## 4. Cách giảm phụ thuộc vào model AI

### 4.1 — Constraint Set tách khỏi mọi bước có AI (đã nêu ở mục 3)

Đây là biện pháp giảm phụ thuộc quan trọng nhất: Constraint Set được tính
1 LẦN, bằng code thuần, và được TRUYỀN LẠI (không tính lại, không để AI
tự nhớ) vào mọi bước sau — validate đồ thị, viết prompt, và (nếu làm)
kiểm tra ảnh cuối cùng đều dùng lại ĐÚNG 1 Constraint Set này.

### 4.2 — Tách "NÓI GÌ" khỏi "NÓI VỚI MODEL NÀO NHƯ THẾ NÀO"

Đề xuất kiến trúc Provider giống HỆT pattern `AIProvider` đã có trong
codebase (`lib/ai/provider/`, interface chung + `OpenAIProvider`/
`MockProvider`):

```text
PromptSpec (model-agnostic, thuần dữ liệu — sinh từ Constraint Set +
Spatial Layout Model, KHÔNG phụ thuộc GPT Image/Flux/Gemini/Ideogram)
        │
        ▼
ImageProvider interface (như AIProvider hiện có)
        │
   ┌────┼────┬─────────┬───────────┐
   ▼    ▼    ▼         ▼           ▼
OpenAIImageProvider  FluxProvider  GeminiImageProvider  IdeogramProvider...
(mỗi provider tự biết cách format prompt/negative-prompt/tham số riêng
 của model đó — đổi model chỉ đổi 1 provider, không đổi PromptSpec)
```

Đây trực tiếp trả lời "đổi model nhưng vẫn giữ đúng requirement": vì
PHẦN NỘI DUNG (cái gì bắt buộc phải nói) tách biệt hoàn toàn khỏi PHẦN
ĐỊNH DẠNG (nói kiểu gì cho model X hiểu) — đổi model = viết 1 adapter mới
tuân theo interface cũ, không viết lại toàn bộ logic constraint.

### 4.3 — Kiểm tra ảnh sau khi sinh (đề xuất bổ sung, sau khi thấy lỗi thật)

Ở review #2 tôi đã đề xuất LÙI việc kiểm tra ảnh bằng vision model (lý do
chi phí). Sau khi thấy lỗi thật (gara/ban công xuất hiện dù bị cấm), tôi
xin **điều chỉnh đề xuất đó**: không cần kiểm tra TOÀN DIỆN chất lượng ảnh
(vẫn tốn kém, vẫn để Founder xem bằng mắt), nhưng nên có **1 lượt kiểm tra
RẺ, HẸP, chỉ hỏi đúng câu nhị phân cho từng `mustNotInclude`/`mustInclude`**
— ví dụ 1 lời gọi vision model ngắn: "Ảnh này có gara/chỗ để ô tô không?
Có ban công không?" — rẻ hơn nhiều so với việc chấm điểm kiến trúc toàn
diện, và bắt đúng LOẠI lỗi vừa xảy ra. Nếu phát hiện vi phạm → tự động
sinh lại 1 lần với prompt phủ định được TĂNG CƯỜNG (không phải random
retry — tăng cường có chủ đích: nhấn mạnh lại + đặt ở đầu câu).

### 4.4 — Bộ test hồi quy theo model (tái dùng pattern đã có)

Codebase đã có sẵn đúng công cụ cho việc này:
`apps/web/scripts/regression.mjs` — bộ ca test cố định cho Requirement
Extraction, chạy lại "MỖI KHI sửa prompt, đổi model". Đề xuất áp dụng
NGUYÊN VẸN pattern này cho Image Generation: 1 bộ N Requirement mẫu có
constraint rõ ràng (có ca giống hệt tình huống Founder vừa gặp: garage=
false + balcony=false + phòng ngủ cụ thể + mái cụ thể), chạy qua từng
`ImageProvider` candidate, chấm theo framework benchmark (mục 5) — đây là
cách khách quan để trả lời "model nào đáng tin hơn", không dựa cảm tính.

---

## 5. Đánh giá framework benchmark của Founder

Framework 4 trục (Requirement Accuracy / Layout Accuracy / Rendering
Accuracy / Architectural Quality) là **hướng đúng và tốt hơn hẳn** so với
benchmark "ảnh đẹp" mơ hồ. Đề xuất tinh chỉnh sau khi phân tích kỹ:

### Requirement Accuracy — nên TÁCH LÀM 2

- **Structural Requirement Accuracy** (kiểm tra trên Spatial Layout Model
  JSON, KHÔNG cần nhìn ảnh, chi phí ~0): đếm Space, so khớp Constraint Set
  — bắt lỗi NGAY sau bước Space Planner, trước khi tốn tiền sinh ảnh.
- **Visual Requirement Accuracy** (kiểm tra trên ẢNH cuối, cần vision
  model, có chi phí): đây mới là trục bắt được đúng lỗi Founder vừa gặp
  (dữ liệu JSON có thể đã đúng, nhưng ảnh vẫn sai).

Tách ra vì 2 loại có chi phí và thời điểm phát hiện lỗi khác hẳn nhau —
Structural nên chặn SỚM (rẻ), Visual là lưới an toàn cuối (đắt hơn, chỉ
chạy khi Structural đã pass).

### Layout Accuracy — đề xuất coi đây là kiểm thử phần mềm, KHÔNG phải benchmark AI

Nếu kiến trúc 3 lớp (review #2) được tuân thủ đúng — Floor Plan là kết
quả RENDER THUẦN CODE từ Spatial Layout Model (không qua AI ở bước này) —
thì "Layout Accuracy" phải luôn ~100%, vì renderer không có lý do gì để
vẽ sai chính input của nó. Nếu số đo này KHÔNG phải 100%, đó là **bug
phần mềm trong Materialization/Renderer**, không phải "chất lượng AI kém"
— nên đo bằng unit test (chạy trong CI mỗi lần sửa code), không phải bằng
"benchmark" so sánh giữa các lần chạy AI. Đây là khác biệt quan trọng: 1
trong 4 trục Founder đề xuất **không cùng bản chất** với 3 trục còn lại
(nó đo tính đúng đắn của CODE, không đo tính đáng tin của AI).

### Rendering Accuracy — đây là trục chính để so sánh model ảnh

Giữ nguyên như Founder đề xuất — đây chính là trục "đổi GPT Image sang
Flux/Gemini/Ideogram thì có còn đúng không". Đo bằng vision-check (mục
4.3) trên bộ test cố định (mục 4.4).

### Architectural Quality — nên có rubric rõ ràng, chấp nhận là đánh giá của con người

Đây là trục khó tự động hoá nhất (thẩm mỹ/logic không gian mang tính chủ
quan). Đề xuất: KHÔNG cố tự động hoá hoàn toàn ở giai đoạn này — thay vào
đó, dùng 1 **rubric chấm điểm đơn giản** (thang 1-5 cho vài tiêu chí cụ
thể: "bố cục có hợp lý không", "tỷ lệ mặt tiền có cân đối không", "có nhất
quán với phong cách đã chọn không") để Founder chấm CÓ CẤU TRÚC khi so
sánh model, thay vì chỉ cảm nhận chung chung "đẹp/không đẹp" — vẫn là con
người chấm, nhưng chấm theo tiêu chí cố định thì so sánh giữa các lần
chạy/model mới có ý nghĩa.

### Bảng tổng hợp đề xuất (5 trục thay vì 4)

| Trục | Đo bằng | Chi phí | Khi nào chạy |
|---|---|---|---|
| Structural Requirement Accuracy | Code so khớp Constraint Set ↔ Spatial Layout Model | ~0 | Ngay sau Space Planner, mọi lần |
| Visual Requirement Accuracy | Vision model, câu hỏi nhị phân hẹp | Thấp | Sau khi sinh ảnh, mọi lần (nếu chấp nhận, mục 4.3) |
| Layout Correctness *(đổi tên, không còn gọi "Accuracy" vì bản chất là software test)* | Unit test renderer | ~0 | CI, mỗi lần sửa code renderer |
| Rendering Accuracy | Vision model + bộ test cố định (mục 4.4) | Trung bình | Khi benchmark/so sánh đổi model, không phải mọi lần generate |
| Architectural Quality | Rubric người chấm (1-5/tiêu chí) | Thời gian con người | Khi benchmark/so sánh đổi model |

---

## Recommendation

1. Xác nhận Design Rule Engine là 1 THẨM QUYỀN ĐỘC LẬP đọc thẳng từ
   Requirement (không phải một phần của/hoặc tin tưởng mù quáng vào
   Spatial Layout Model) — đây là điểm sửa quan trọng nhất so với review
   #2, trực tiếp vá lỗi Founder vừa gặp.
2. Prompt Builder phải luôn phát biểu TƯỜNG MINH mọi ràng buộc phủ định
   (`mustNotInclude`), không dựa vào im lặng.
3. Thiết kế `ImageProvider` theo đúng interface pattern đã có với
   `AIProvider` — tách nội dung khỏi định dạng riêng từng model, chuẩn bị
   sẵn cho việc đổi model sau này.
4. Điều chỉnh 1 quyết định ở review #2: chấp nhận thêm 1 lượt kiểm tra
   ảnh RẺ + HẸP (chỉ hỏi nhị phân cho mustNotInclude/mustInclude) thay vì
   hoãn hoàn toàn — vì đã có bằng chứng thật cho thấy đây là lỗi thường
   xảy ra, không phải rủi ro lý thuyết.
5. Benchmark framework của Founder là hướng đúng — đề xuất tách
   Requirement Accuracy thành 2 (Structural/Visual) và đổi "Layout
   Accuracy" từ benchmark AI thành unit test phần mềm.
6. POC (đã đề xuất ở review #1/#2) nên bổ sung: thử LUÔN 1 ca test có
   ràng buộc phủ định rõ ràng (giống ca lỗi Founder vừa gặp — garage=
   false, balcony=false) để xác nhận Rule Engine + negative prompting
   thực sự sửa được lỗi này trước khi mở rộng thêm.

Không có thay đổi nào ở đây làm phình to phạm vi MVP — đây là sửa đúng chỗ
hổng vừa phát hiện bằng dữ liệu thật, đúng tinh thần "giải quyết rủi ro
lớn nhất sớm" của Startup Flexibility Principle.
