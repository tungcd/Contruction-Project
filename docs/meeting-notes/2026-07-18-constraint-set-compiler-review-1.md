# Constraint Set Compiler — Architecture Review #1 (Claude)

> **Document Info**
> - Mục đích: review vòng 1/2 (giới hạn theo quy ước đã thống nhất) cho
>   đề xuất kiến trúc Constraint Set Compiler.
> - Đối tượng đọc chính: ChatGPT, Founder.
> - Trạng thái: Reference lịch sử — không phải quyết định. Nếu một
>   finding được chấp nhận, phải phản ánh vào
>   `docs/features/concept-design/constraint/constraint-domain-model.md`
>   và/hoặc một ADR, không chỉ nằm ở đây.
> - Tài liệu liên quan:
>   `docs/features/concept-design/constraint/constraint-domain-model.md`,
>   `docs/features/concept-design/requirement/requirement-domain-model.md`
>   §6 (Anti-Corruption Layer), §8 (Open Boundary otherRooms/excludedRooms).

Phản hồi cho `Constraint Set Compiler — Architecture Review #1`.

---

## Confirmed Sound

- **Pure Function / Deterministic / No AI** — đúng, nhất quán với Golden
  Contract #3 (Phase A) và với ranh giới "Constraint Set Compiler không
  được diễn giải văn xuôi tự do" đã thống nhất từ vòng Requirement.
- **Not responsible: prompt/graph/geometry/design** — đúng, giữ nguyên
  thứ tự pipeline đã đóng băng, không lấn sang trách nhiệm module khác.
- **Open Boundary otherRooms/excludedRooms được giải quyết ở đây** — đúng
  vị trí, đúng như đã ghi nhận khi freeze Requirement Domain Model.

## Findings

### 1. Thiếu 2 invariant quan trọng

**a) Explicit Precondition (Input Readiness)** — danh sách hiện tại
không nói rõ compiler được phép chạy trên Requirement ở trạng thái nào.
Requirement đã có `status` (`draft/needs_clarification/ready/
confirmed`) chính là để gate việc này. Nếu không ghi rõ "chỉ chạy khi
`status = confirmed`, nếu không thì throw lỗi rõ ràng thay vì âm thầm
compile trên dữ liệu chưa đầy đủ", có rủi ro cụ thể: ai đó gọi compiler
trên một Requirement còn `draft` và nhận về một Constraint Set trông hợp
lệ nhưng dựa trên dữ liệu thiếu — đúng dạng "silent wrong output" đã
từng xảy ra ở M3-008 (đổi tên field không nhận ra consumer khác dựa vào
tên cũ) và ở bug ảnh gara/ban công.

**b) No Silent Drop (đối xứng với No Information Creation)** — "No
Information Creation" đã cấm compiler *bịa* thông tin, nhưng chưa có
nguyên tắc đối xứng cấm compiler *âm thầm bỏ* thông tin mà Requirement
đã ghi nhận. Đây là nguyên tắc quan trọng nhất cần có TRƯỚC khi thiết kế
schema, vì nó ràng buộc trực tiếp cách giải quyết chính Open Boundary
đang được giao cho module này: dù chọn cơ chế nào cho
`otherRooms`/`excludedRooms`, nếu một mục không map được vào constraint
có cấu trúc, nó phải được giữ lại tường minh (dù chỉ là một note chưa
cấu trúc hoá), không được lặng lẽ biến mất chỉ vì không khớp bảng tra
cứu.

**Đề xuất bổ sung nhỏ, không bắt buộc:** nêu rõ tính **Idempotent**
(cùng input → cùng output, mọi lần gọi) như một invariant tường minh,
dù nó vốn được suy ra từ Pure Function + Deterministic — vì đây chính
là lý do kỹ thuật khiến `ConceptSet` chỉ cần snapshot Requirement JSON
(REQ-D5), không cần snapshot cả Constraint Set: miễn compiler idempotent
và không đổi version, Constraint Set luôn tái tạo được từ Requirement
snapshot. Nói rõ giả định này để nó không bị quên khi compiler logic
thay đổi version sau này.

### 2. Hidden coupling trong boundary

**a) "Not responsible: estimate" đang bị diễn giải mơ hồ giữa 2 nghĩa
khác nhau.** Nếu hiểu là "không được đọc field nào Estimate Engine cũng
đọc" (vd `budget.constructionScope`), điều đó sẽ chặn một nhu cầu hợp lý
— Design Intent Graph gần như chắc chắn cần biết `constructionScope` để
biết có nên đưa yếu tố nội thất vào Descriptor hay không
(`turnkey_with_interior` khác `turnkey`). Nếu hiểu đúng là "không tính
giá, không quyết định section Estimate" (tức không triển khai lại logic
của Estimate Engine), thì không có vấn đề gì. Đề xuất: ghi rõ nghĩa thứ
2 trong đặc tả, để tránh compiler tự giới hạn không cần thiết field đầu
vào của mình — đây đúng là dạng "hai consumer kéo Requirement theo 2
hướng" đã nêu khi freeze Requirement (§6), giờ xuất hiện lại dưới dạng
một câu chữ boundary có thể bị hiểu sai.

**b) Ranh giới với Descriptor Compiler chưa rõ cho đúng loại dữ liệu mà
Open Boundary đang nhắc tới.** Descriptor Compiler (giai đoạn sau, đã
biết trước là dùng bảng tra cứu cố định để biến negated constraint
thành positive visual fact — vd `garage=false` →
`hasVehicleEntrance:false`) chỉ biết xử lý các trường **đã được liệt kê
sẵn** trong bảng đó. Nếu Constraint Set Compiler xuất
`excludedRooms`/`otherRooms` dưới dạng constraint có cấu trúc nhưng với
GIÁ TRỊ tự do (vd `mustNotInclude: ["phòng đọc sách"]`), thì đến bước
Descriptor, bảng tra cứu cố định của nó không có mục nào khớp với
"phòng đọc sách" — dữ liệu có nguy cơ **âm thầm biến mất ở ranh giới kế
tiếp**, dù Constraint Set Compiler tự nó xử lý đúng. Đây là hệ quả trực
tiếp của finding 1b (No Silent Drop) nhưng ở một tầng xa hơn: giải quyết
xong trong Constraint Set Compiler không tự động nghĩa là Descriptor
tiêu thụ được. Đề xuất: khi thiết kế schema, Constraint Set Compiler nên
xuất một trường riêng (khác với các constraint có bảng tra cứu cố định
tương ứng) cho các mục "chưa có cơ chế biên dịch tự động" — để Descriptor
(hoặc một bước thủ công trong Manual POC) biết chắc phải xử lý nó, thay
vì không phát hiện ra sự tồn tại của nó.

### 3. Nguyên tắc cần sửa trước khi thiết kế schema

**"Normalize Only" trùng lặp với danh sách Boundary.** Responsibility đã
liệt kê 4 việc (normalize/validate/canonicalize/compile), nhưng invariant
lại chỉ gọi tên một trong số đó ("Normalize Only") như thể nó là ranh
giới duy nhất. Nếu ý định là "không làm gì ngoài 4 việc đó", nên diễn đạt
lại invariant này bằng đúng 4 từ đã có trong Boundary, không đặt tên
khác cho gần như cùng một ý — hai chỗ diễn đạt hơi khác nhau cho cùng
một ranh giới là đúng dạng rủi ro desync tài liệu (I1) đã gặp trước đây,
chỉ khác tầng. Nếu "Normalize Only" thực ra muốn nói điều khác (vd một
cách diễn đạt khác của "No Information Creation" — không được làm giàu
dữ liệu vượt quá những gì Requirement đã có), nên đổi tên rõ ràng hơn
để 2 khái niệm không chồng lấn.

---

## Tóm tắt ưu tiên xử lý trước khi thiết kế schema

1. Thêm 2 invariant: Explicit Precondition (input readiness) và No
   Silent Drop.
2. Làm rõ "not responsible: estimate" chỉ có nghĩa "không tính giá",
   không phải "không đọc field liên quan Estimate".
3. Quyết định: Constraint Set Compiler xuất cho Descriptor biết những
   mục nào CHƯA có cơ chế biên dịch tự động (không để chúng biến mất
   lặng lẽ ở ranh giới kế tiếp).
4. Gộp/đổi tên "Normalize Only" cho khỏi trùng với danh sách Boundary.

*(Vòng review 1/2. Nếu còn bất đồng sau vòng 2, theo quy ước đã thống
nhất, Founder ra quyết định cuối.)*
