# Requirement Domain Model — Thảo luận vòng 3 (phản hồi Claude)

Phản hồi cho `Requirement Domain Model — Discussion Round 3 (Context for
Claude)`.

---

## 1. Đánh giá chung

Đồng ý với hầu hết. Điểm đáng chú ý nhất vòng này là mục 6 (AI Coupling)
— đây không phải rủi ro giả định, mà là rủi ro **đã tồn tại và đã có
bằng chứng thật trong chính codebase** (xem mục 3 dưới). Mục 9
(Documentation Strategy) cũng hợp lý về nguyên tắc, nhưng cấu trúc đề
xuất cần điều chỉnh vì chưa khớp với thực tế monorepo hiện tại.

---

## 2. "Domain drives implementation. Implementation validates domain."

Đồng ý — đây là cách diễn đạt cân bằng hơn, và nhất quán với Burden of
Proof Rule (không phải hai nguyên tắc riêng, mà cùng một nguyên tắc nhìn
từ 2 góc).

Xin bổ sung một điểm còn thiếu: **trọng số bằng chứng phải tính đến chi
phí thu thập bằng chứng đó.**

Trong khoa học, một thí nghiệm rẻ (unit test) chỉ nên làm lung lay một
giả thuyết yếu. Nhưng "implementation" ở đây không phải thí nghiệm rẻ —
với một solo founder, mỗi lần implement-rồi-quan-sát là chi phí thời
gian thật, không thể chạy lại nhiều lần để lấy mẫu. Vì vậy:

> Bằng chứng implementation đã tồn tại và đã qua kiểm chứng thực tế (ví
> dụ: Requirement extraction đã chạy hàng loạt case thật) nên được xem
> là bằng chứng **nặng ký hơn** một domain model mới chưa từng được thử
> nghiệm — không phải vì implementation có trước, mà vì nó là bằng chứng
> đắt hơn, khó thu thập lại hơn.

Đây chỉ là một hệ quả cụ thể của nguyên tắc mới, không mâu thuẫn — nhưng
nên nói rõ để tránh tình huống domain model "lý thuyết đẹp" bị đối xử
ngang hàng với bằng chứng thực nghiệm đã có.

---

## 3. AI Coupling — đây là rủi ro thật, và đã có bằng chứng trong code

Đánh giá: **đây là rủi ro kiến trúc thật, nên chính thức ghi nhận.**
Nhưng có 2 điều cần làm rõ để không đánh giá sai phạm vi của nó.

### 3.1. Đây không phải rủi ro mới, mà là một rủi ro đã biết bị bỏ sót phạm vi

Kiến trúc M4 đã đóng băng trước đó (`10_Frozen-Architecture-M4-001...`)
đã xác định đúng 2 giai đoạn "AI-quality risk cần benchmark liên tục":
**Design Intent Graph generation** và **Image generation**. Nhưng
**Requirement Extraction (Conversation → LLM → Requirement JSON) cũng
là một lời gọi AI sinh structured output** — về bản chất thuộc đúng
nhóm rủi ro đó, chỉ là nó có code chạy trước khi cuộc thảo luận benchmark
M4 bắt đầu, nên bị bỏ sót khỏi danh sách. Đề xuất: mở rộng danh sách
"giai đoạn cần benchmark liên tục" từ 2 thành **3**: Requirement
Extraction, Design Intent Graph Generation, Image Generation — cùng một
loại rủi ro (AI behavior coupling), không phải 3 loại rủi ro khác nhau.

### 3.2. "Golden Conversation / Golden Requirement Output" đã tồn tại — chỉ chưa được đặt tên

Kiểm tra lại codebase cho thấy `apps/web/scripts/regression.mjs` **đã
chính là** cơ chế AI Contract Testing mà câu hỏi đang đề xuất xây mới:

```js
// apps/web/scripts/regression.mjs (đã có sẵn)
// "Chạy lại MỖI KHI sửa prompt, đổi model, hoặc đổi Data Model."
{
  name: "Phủ định: không cần gara",
  message: "Nhà không cần gara vì ô tô thường để ngoài sân.",
  expect: { "requirement.functional.garage": false },
}
```

Đây đúng là một cặp Golden Conversation (`message`) → Golden Requirement
Output (`expect`), chấm điểm theo **field-level path assertion**, không
so sánh strict equality toàn bộ object — đúng nguyên tắc benchmark đã
được thống nhất trước đó khi tách "Structural Accuracy" ra khỏi "Visual
Accuracy" trong M4 (tránh brittleness khi so sánh object lớn).

**Kết luận:** không cần thiết kế cơ chế mới. Cần 2 việc:

1.  Chính thức đặt tên nó là **AI Contract Test cho Requirement
    Extraction** trong tài liệu Domain Model sắp freeze, và ghi rõ: mở
    rộng bộ case này bất cứ khi nào phát hiện bug extraction mới (đã là
    thói quen thực tế, chỉ cần chính thức hoá).
2.  Khi Design Intent Graph Generation và Image Generation được
    implement (Phase B), áp dụng **đúng pattern này** (Golden
    Conversation/Input → expected field-level assertions), không phát
    minh cơ chế benchmark riêng cho từng giai đoạn.

Trả lời trực tiếp 3 câu hỏi: có, nên coi là architecture risk chính
thức; có, nên định nghĩa Golden Conversation/Output (đã có, chỉ cần đặt
tên và mở rộng phạm vi); có, gọi là AI Contract Testing là hợp lý và nên
dùng thuật ngữ này thống nhất trong tài liệu Domain Model.

---

## 4. Hội tụ tài liệu

Đồng ý tạo `Requirement Domain Model v1.0 (Frozen)` làm tài liệu duy
nhất sau vòng này. Không có phản biện.

---

## 5. Ba rủi ro lớn nhất còn lại trước Manual POC (toàn pipeline)

Sắp xếp theo mức độ có thể buộc **nhiều giai đoạn phía sau phải thiết kế
lại** nếu sai — không phải theo mức độ khó implement:

### Rủi ro #1 — Design Intent Graph có thực sự geometrically realizable không

LLM có thể sinh ra một graph hợp lý về mặt ngữ nghĩa (đúng zone, đúng
adjacency mong muốn) nhưng **không thể vật chất hoá được** bằng chiến
lược Geometry đã chọn (rectangle-subdivision/Treemap) — ví dụ một vòng
adjacency khép kín mà rectangle subdivision không biểu diễn được trên
mặt bằng phẳng. Đây là rủi ro cao nhất vì nó nằm ở điểm nối AI → tất định
đầu tiên của pipeline: nếu graph không realizable ở tỷ lệ đủ cao,
Geometry Solver, Descriptor Compiler, Prompt Compiler đều bị ảnh hưởng
dây chuyền dù bản thân chúng được implement đúng.
→ **Manual POC phải kiểm chứng trước tiên**: tỷ lệ Design Intent Graph
sinh ra từ Constraint Set thật có được Geometry Solver hiện tại chuyển
thành mặt bằng hợp lệ hay không.

### Rủi ro #2 — Chiến lược Geometry (rectangle-subdivision) có generalize được với sự đa dạng đất thật không

Chiến lược này được chọn vì giả định "nhà phố Việt Nam có mặt bằng chữ
nhật đơn giản" — giả định hợp lý cho demo, nhưng chưa kiểm chứng với đất
méo, đất góc 2 mặt tiền, đất dốc nhiều cao độ. Nếu tỷ lệ đất thật không
phù hợp với rectangle-subdivision cao hơn dự kiến, ảnh hưởng dây chuyền
tới Descriptor (giả định biên mặt bằng rõ ràng) và Prompt Compiler (giả
định từ vựng facade/frontage cố định).
→ **Manual POC nên test với một mẫu đất thật đa dạng** (không chỉ mẫu
demo), trước khi viết Golden Contract implementation cho Descriptor.

### Rủi ro #3 — Descriptor lookup table có thực sự giữ được tính "100% tất định" khi gặp ngôn ngữ khách hàng thật không

Toàn bộ triết lý "Prevent > Detect" của kiến trúc M4 dựa vào giả định:
một bảng tra cứu cố định (garage=false → 4 fact cụ thể...) đủ để bao
quát các cách khách hàng diễn đạt loại trừ/yêu cầu trong thực tế. Đây là
giả định chưa kiểm chứng — nếu Golden Conversation thực tế cho thấy quá
nhiều cách diễn đạt loại trừ không map gọn vào bảng cố định, áp lực sẽ
là phải đưa AI vào bước Descriptor (phá vỡ đúng bất biến "tất định" mà
toàn bộ thiết kế chống-bug ảnh phối cảnh đang dựa vào).
→ **Manual POC nên thử map một tập hội thoại thật đa dạng vào bảng
Descriptor hiện có**, trước khi cam kết bảng này là đủ cho MVP.

Cả 3 rủi ro trên đều nằm ở ranh giới AI→tất định hoặc tất định→tất định
đầu tiên của pipeline — đúng nguyên tắc ưu tiên: xác nhận nền móng trước
khi đánh bóng các giai đoạn sau (Prompt wording, Concept Package
assembly UI).

---

## 6. Documentation Strategy

### Trả lời trực tiếp 4 câu hỏi

**1) `docs/` hay `src/docs/`?** → `docs/` ở gốc repo, ngang hàng
`apps/`/`packages/`. Đây là monorepo (`apps/web`, `apps/api`,
`packages/shared-types`) — không có một `src/` duy nhất để đặt bên
trong; đặt ở gốc cũng là quy ước phổ biến nhất, và giúp `git clone` thấy
ngay tài liệu mà không phải đoán tài liệu thuộc app nào.

**2) Documentation có phải là một phần của Architecture không?**
→ Có, nhưng chỉ với tài liệu đã **frozen/decision** — không phải toàn bộ
thư mục `documents/` hiện tại. Cần phân biệt rõ:
- Tài liệu **thảo luận/review** (như toàn bộ chuỗi file trong
  `documents/milestone_1/`, `documents/CHATGPT_CONTEXT/`) là **process
  artifact** — có giá trị lịch sử, không phải kiến trúc chính thức.
- Tài liệu **frozen** (Frozen Architecture, Decision Log, Domain Model
  v1.0 sắp tạo) **là** kiến trúc chính thức.
Cấu trúc `draft/frozen/decisions` mà ChatGPT đề xuất đã nắm đúng phân
biệt này — giữ nguyên ý tưởng đó, chỉ cần áp dụng nhất quán: quá trình
thảo luận không di chuyển vào `docs/`, chỉ SẢN PHẨM cuối (đã frozen) mới
được promote vào đó.

**3) Áp dụng Docs-as-Code toàn bộ dự án ngay từ đầu?**
→ Về **nguyên tắc** (tài liệu sống trong git, PR đổi kiến trúc nên kèm
đổi tài liệu) — có, áp dụng ngay, vì gần như miễn phí (chỉ là kỷ luật đặt
file), và **thực ra đã đang làm** (toàn bộ `documents/` đã nằm trong git
từ trước). Về **tooling** (doc site, linter kiểm tra tài liệu lỗi thời,
CI check cross-reference) — nên **hoãn** cho tới khi có bằng chứng cụ thể
về sự lệch pha giữa code và tài liệu gây hại thật. Đây chính là áp dụng
ngược lại Burden of Proof Rule vừa thống nhất ở mục 2/3 — đầu tư tooling
trước khi có bằng chứng cần nó là premature.

**4) Cấu trúc thư mục đề xuất**

Điều chỉnh chính so với bản gốc: bỏ `src/` (không khớp monorepo thật),
và tổng quát hoá tầng giữa từ "theo tên giai đoạn pipeline M4" thành
"theo feature" — vì dự án còn có Estimate Engine/PriceBook không thuộc
pipeline M4, nếu đặt tên thư mục cứng theo requirement/constraint/concept
sẽ khiến các feature khác không có chỗ tự nhiên.

```text
contruction_project/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared-types/
├── docs/
│   ├── README.md                 (mục lục, bản đồ toàn bộ docs/)
│   ├── architecture/
│   │   ├── draft/                (đề xuất đang thảo luận, chưa chốt)
│   │   ├── frozen/                (kiến trúc đã đóng băng — vd Frozen M4)
│   │   └── decisions/             (1 file / quyết định, dạng ADR, đánh số)
│   ├── features/
│   │   ├── estimate/              (Rule Engine, Business Code taxonomy)
│   │   ├── pricebook/
│   │   └── concept-design/        (toàn bộ pipeline M4, chia theo giai đoạn)
│   │       ├── requirement/
│   │       ├── constraint/
│   │       ├── design-intent-graph/
│   │       ├── geometry/
│   │       ├── descriptor/
│   │       └── prompt/
│   ├── research/                  (Space Syntax, các domain grounding khác)
│   └── meeting-notes/             (log thảo luận theo ngày — nơi
                                     documents/CHATGPT_CONTEXT,
                                     documents/milestone_1 sẽ chuyển vào
                                     dần, không phải ngay lập tức)
```

Một đề xuất cụ thể thêm cho `architecture/decisions/`: mỗi quyết định
nên là **1 file riêng** (vd `REQ-D1-requirement-json-canonical.md`),
không gộp nhiều quyết định trong 1 file như cách đang làm hiện tại
(REQ-D1..D6 nằm chung trong response trước) — đúng thực hành ADR
(Architecture Decision Record), giúp mỗi quyết định độc lập, dễ trích
dẫn, dễ tìm qua git blame/history riêng.

**Về lộ trình áp dụng:** không cần di chuyển toàn bộ `documents/` ngay.
Đề xuất: tạo `docs/architecture/frozen/` và chuyển đúng 1 file đang có
(`10_Frozen-Architecture-M4-001...`) vào đó như một thử nghiệm nhỏ; giữ
nguyên `documents/CHATGPT_CONTEXT/` và `documents/milestone_1/` như hiện
tại cho tới khi cấu trúc mới được dùng thử và thấy ổn — đây là một quyết
định có thể đảo ngược, nên không cần làm big-bang ngay.

---

## 7. Tóm tắt

- **Xác nhận:** Domain-drives/Implementation-validates (mục 2, có bổ
  sung trọng số bằng chứng theo chi phí).
- **Nâng cấp thành rủi ro chính thức:** AI Coupling — mở rộng phạm vi
  benchmark từ 2 lên 3 giai đoạn (thêm Requirement Extraction); xác nhận
  `regression.mjs` đã là AI Contract Test, chỉ cần đặt tên và nhân rộng
  pattern.
- **3 rủi ro ưu tiên Manual POC:** Design Intent Graph realizability →
  Geometry strategy generalization → Descriptor lookup table scalability
  (theo đúng thứ tự vị trí trong pipeline).
- **Documentation:** đồng ý docs-as-code như nguyên tắc (đã đang làm một
  phần), hoãn đầu tư tooling; cấu trúc thư mục điều chỉnh theo feature
  thay vì cứng theo tên giai đoạn pipeline; ADR nên 1-file-1-quyết-định;
  di chuyển tài liệu hiện có dần, không big-bang.
