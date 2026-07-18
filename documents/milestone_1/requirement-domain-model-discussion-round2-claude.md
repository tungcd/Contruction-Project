# Requirement Feature — Thảo luận vòng 2 (phản hồi Claude)

Phản hồi cho `Context phản hồi cho Claude — Requirement Feature Discussion
Round 2`.

---

## 1. Đánh giá chung

Đồng ý với hầu hết. Có 2 điểm cần phản biện có chủ đích: (a) nguyên tắc
"Domain Model leads Implementation" cần một tiêu chí dừng, nếu không sẽ
mâu thuẫn với chính "Startup Flexibility Principle" mà Founder đã đặt ra
trước đó; (b) câu hỏi snapshot ở mục 4 phát hiện đúng một lỗ hổng thật
trong đề xuất trước của tôi (REQ-D5/J) — xin ghi nhận và sửa lại.

---

## 2. Về nguyên tắc "Domain Model leads Implementation"

**Đồng ý về nguyên tắc, nhưng đề xuất thêm một tiêu chí dừng cụ thể —
nếu không, nguyên tắc này không thể chứng minh sai (unfalsifiable) và sẽ
tạo áp lực redesign vô hạn.**

Lý do:

- "Domain Model leads" đúng khi Domain Model đang mô tả một khái niệm
  **chưa từng được implement** (Design Intent Graph, Constraint Set,
  Descriptor — đúng là những khái niệm hoàn toàn mới, chưa có code nào
  ràng buộc). Ở đây implementation không tồn tại để mâu thuẫn với domain
  model, nên nguyên tắc không có gì phải bàn.
- Nhưng với Requirement — một khái niệm **đã có implementation chạy
  thật, đã qua kiểm chứng bằng dữ liệu thực tế** (prompt extraction,
  Discovery Chat, Estimate Engine) — "Domain Model leads" cần một câu hỏi
  đi kèm: *domain model mới có giải quyết được vấn đề gì mà implementation
  hiện tại KHÔNG giải quyết được không?* Nếu câu trả lời là "không, chỉ
  là cách trình bày khác thanh thoát hơn" thì đó không phải lý do đủ để
  thay đổi — đó là re-design vì thẩm mỹ, không phải vì domain gap.
- Thực tế CAD-3 và CAD-4 minh hoạ đúng điều này: khi tôi so khớp domain
  model với implementation hiện có, hoá ra implementation **chính là**
  câu trả lời domain đúng (null/true/false đã đúng ngữ nghĩa tri-state;
  2 trục projectType×constructionScope đã đúng cấu trúc) — không phải vì
  "implementation có trước nên thắng", mà vì không tìm được domain gap cụ
  thể nào để bác bỏ nó.
- Rủi ro nếu áp dụng "Domain Model leads" không kèm tiêu chí dừng: đây là
  đúng cơ chế khiến một solo founder rơi vào vòng lặp redesign — luôn có
  một mô hình "thuần" hơn về mặt lý thuyết, và không có gì tự nhiên buộc
  vòng thảo luận phải dừng. Điều này **mâu thuẫn trực tiếp với Startup
  Flexibility Principle** mà chính Founder đã đặt ra: nếu mọi quyết định
  đều là giả thuyết có thể đảo ngược, thì việc tối ưu Domain Model tới
  mức "đẹp" trước khi có bất kỳ dữ liệu sử dụng thực tế nào từ pipeline
  M4 (vốn chưa chạy Manual POC) là rigor đến sớm (premature rigor) —
  chính domain model chưa-được-dùng cũng là một giả thuyết chưa kiểm
  chứng, không hẳn ít rủi ro hơn implementation đã kiểm chứng.

**Đề xuất tiêu chí dừng cụ thể (burden of proof rule):**

> Domain Model chỉ được phép ghi đè lên implementation hiện có khi chỉ
> ra được một **concrete failure mode** — một tình huống dữ liệu thật,
> một use case cụ thể, hoặc một hệ quả sai — mà implementation hiện tại
> gây ra hoặc không xử lý được. Không được ghi đè chỉ vì mô hình mới
> "nhất quán hơn" hoặc "tổng quát hơn" mà chưa có bằng chứng cần tổng
> quát đó.

Đây thực ra chỉ là diễn giải cụ thể hơn của §18 mà chính context document
gốc đã yêu cầu ("Claude should not agree merely for politeness... should
challenge the design when there is a concrete reason") — áp dụng ngược
lại cho phía đề xuất domain model: **cùng một tiêu chuẩn "cần lý do cụ
thể" nên áp dụng cho cả 2 chiều**, không chỉ khi Claude phản biện ChatGPT,
mà cả khi domain model phản biện implementation.

Kết luận: đồng ý về nguyên tắc, với điều kiện có tiêu chí dừng này. Nếu
có case cụ thể nào cho thấy implementation hiện tại thực sự cản trở một
nhu cầu domain thật (ví dụ nhu cầu ở mục 3 dưới đây), tôi sẽ chủ động đề
xuất thay đổi implementation.

---

## 3. Requirement.md snapshot — ghi nhận lỗ hổng, sửa đề xuất trước

Câu hỏi ở mục 4 phát hiện đúng một khoảng trống thật trong đề xuất REQ-D5
trước đó của tôi. Xin làm rõ và sửa lại.

**Vấn đề thật sự:** Tôi từng đề xuất Requirement giữ mô hình single-row,
ghi đè khi cập nhật (không versioning). Nếu vậy, một con trỏ kiểu
"generatedFromRequirementVersion" (timestamp) sẽ **vô nghĩa** sau khi
Requirement bị ghi đè — không còn gì để trỏ tới. Đây là điểm tôi đã bỏ
sót khi viết REQ-D5/J trước đó.

**Nhưng:** vấn đề gốc không phải là thiếu snapshot Requirement.md — mà là
thiếu **snapshot Requirement JSON tại thời điểm generate**. Requirement.md
tự nó là hàm thuần render từ JSON, nên nếu có JSON snapshot, có thể tái
tạo lại .md tương ứng bất cứ lúc nào (miễn logic render không đổi — xem
rủi ro riêng ở mục 4.1 bên dưới).

**Đề xuất sửa (thay REQ-D5/J):**

- Không xây dựng versioning tổng quát cho Requirement (giữ nguyên lý do
  cũ: chưa có nhu cầu so sánh nhiều bản Requirement song song).
- Thay vào đó: khi `ConceptSet` được tạo (theo kiến trúc M4 đã chốt),
  lưu kèm một bản sao **denormalized** của Requirement JSON tại thời
  điểm đó — ví dụ `ConceptSet.requirementSnapshot: Json`. Đây không phải
  version của Requirement, chỉ là một bản copy gắn liền với Concept đó,
  giống cách `EstimateDraft` đã lưu dữ liệu ước tính tại thời điểm tạo
  thay vì trỏ ngược về Requirement sống.
- Việc này rẻ (không cần entity mới, không cần version number, không
  cần supersedes-chain) và giải quyết đúng nhu cầu audit: muốn biết
  Concept V1 được tạo từ Requirement như thế nào → đọc
  `ConceptSet.requirementSnapshot`, không cần Requirement gốc còn giữ
  nguyên trạng thái cũ.

### 3.1. Một rủi ro thêm mà câu hỏi này hé lộ (chưa có trong review trước)

Nếu chỉ snapshot Requirement **JSON**, một rủi ro nhỏ nhưng thật: khi
logic render Requirement.md (Template) thay đổi (v1 → v2 → v3...), tái
tạo lại .md từ JSON snapshot cũ bằng renderer MỚI sẽ cho ra một văn bản
khác với những gì con người thực sự đã thấy tại thời điểm generate. Với
mục đích audit ("khách hàng/Founder đã thấy đúng nội dung gì khi duyệt
Concept V1"), cần thêm cả bản **rendered text** (không chỉ JSON) vào
snapshot — 2 bản sao, không phải 1:

- `requirementSnapshotJson` — để có thể re-run pipeline hoặc so sánh dữ
  liệu.
- `requirementSnapshotMarkdown` — bản text bất biến, đúng những gì đã
  hiển thị, không bao giờ re-render lại.

Cả hai đều rẻ (denormalized copy, không phải version chain), và giải
quyết dứt điểm câu hỏi audit nêu ở mục 4 gốc.

---

## 4. Trả lời câu hỏi cuối

### a) Nguyên tắc kiến trúc nào đang bị bỏ sót?

**Requirement đang phải phục vụ 2 người tiêu dùng có áp lực tiến hoá
khác nhau, và chưa ai quyết định ranh giới giữa chúng.**

- Estimate Engine (Rule Engine hiện có) đọc trực tiếp các field cố định
  của Requirement (`functional.garage`, `budget.constructionScope`, …) để
  quyết định dòng/section nào áp dụng — cần field **phẳng, cố định tên**
  để pattern-match an toàn.
- Concept Design pipeline (M4) đang có xu hướng cần một mô hình **tổng
  quát hơn** — danh sách không gian mở (`otherRooms`, và giờ thêm
  `excludedRooms`) hướng tới một dạng "space list" linh hoạt hơn là field
  cố định.

Áp lực này sẽ tăng dần: càng thêm loại "loại trừ/mong muốn tự do" cho
Concept Design, càng có động lực tổng quát hoá toàn bộ `functional` thành
một danh sách generic — và nếu làm vậy trực tiếp trên Requirement, Rule
Engine của Estimate Engine (đang pattern-match theo tên field cố định) sẽ
âm thầm gãy.

**Đề xuất:** giữ nguyên hình dạng hiện tại của Requirement (ổn định, phục
vụ Estimate Engine), và để **Constraint Set Compiler** (đã có sẵn trong
kiến trúc M4 đã chốt — Golden Contract #3) đóng vai trò anti-corruption
layer: nơi duy nhất chuyển đổi Requirement phẳng thành cấu trúc tổng quát
hơn mà Concept Design cần. Tin tốt: kiến trúc hiện tại **đã có sẵn seam
này** (Constraint Set Compiler vốn dĩ đã được thiết kế để đọc Requirement
và sinh ra cấu trúc khác) — chỉ cần nêu rõ đây là ranh giới có chủ đích,
không để áp lực tổng quát hoá tràn ngược vào Requirement.

### b) Hidden coupling nào chưa được phát hiện?

Chính là điều nêu ở mục (a) — cặp Estimate Engine / Concept Design cùng
đọc Requirement nhưng theo 2 cách khác nhau. Ngoài ra: coupling giữa
**renderer version** và **snapshot** nêu ở mục 3.1 — nếu không nêu rõ,
sẽ là một bug rất khó phát hiện (chỉ lộ ra khi ai đó so sánh Concept cũ
với Requirement.md hiện tại và thấy khác nhau, tưởng nhầm là bug dữ liệu).

### c) Migration risk nào lớn hơn CAD-1 không?

Không có gì lớn hơn CAD-1 (CAD-1 vẫn là rủi ro cấu trúc lớn nhất — chạy
song song 2 khái niệm Requirement). Nhưng risk ở mục (a) — hai người tiêu
dùng kéo Requirement theo 2 hướng — là loại rủi ro **âm thầm hơn**: CAD-1
nếu xảy ra sẽ lộ ra ngay (2 schema rõ ràng khác nhau); risk ở mục (a) sẽ
không lộ ra cho tới khi ai đó sửa `functional` để phục vụ Concept Design
và vô tình làm Estimate Engine tính sai giá — đúng loại bug "silent wrong
price" đã từng xảy ra một lần trong M3-008 (đổi tên field/code mà không
nhận ra một consumer khác đang dựa vào tên cũ). Đáng được ghi nhận và
phòng ngừa chủ động thay vì chờ nó xảy ra.

### d) Đề xuất bổ sung: hội tụ tài liệu

Thảo luận Requirement Feature hiện đang trải qua nhiều vòng (Template v1,
review Claude, context v2, response Claude, round 2 này...) mà chưa có
một tài liệu "Domain Model — phiên bản chốt" duy nhất, trong khi chính dự
án này đã có tiền lệ tốt cho việc này: pipeline M4 sau 5 vòng review đã
được hội tụ vào đúng 1 file `10_Frozen-Architecture-M4-001...`. Đề xuất
áp dụng lại đúng pattern đó cho Requirement Domain Model sau khi vòng này
chốt xong — không phải vì thủ tục, mà vì dự án đã tự chứng minh pattern
này có tác dụng giảm nhầm lẫn.

---

## 5. Tóm tắt thay đổi so với response trước

- **Giữ nguyên:** REQ-D1, D2, D3, D4 (không có phản biện nào làm lung
  lay các quyết định này).
- **Sửa REQ-D5/J:** bổ sung `requirementSnapshotJson` +
  `requirementSnapshotMarkdown` trên `ConceptSet` để giải quyết audit,
  thay vì versioning tổng quát cho Requirement.
- **Thêm nguyên tắc mới:** tiêu chí dừng cho "Domain Model leads
  Implementation" (mục 2).
- **Thêm rủi ro mới cần theo dõi:** ranh giới Requirement giữa Estimate
  Engine và Concept Design pipeline (mục 4.a) — đề xuất Constraint Set
  Compiler là nơi hấp thụ khác biệt, không phải Requirement.

Không có thay đổi nào về Requirement Template v2 — như đã thống nhất,
vòng này tập trung vào Domain Model/boundary/versioning/snapshot, không
quay lại review Template.
