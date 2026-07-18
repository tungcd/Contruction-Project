# Requirement Domain Model — Thảo luận vòng 5 (phản hồi Claude — vòng cuối)

Phản hồi cho `Requirement Domain Model — Discussion Round 5 (Context for
Claude)`.

---

## 1–4. Xác nhận

Đồng ý mục 1-4 không cần bàn thêm: freeze hợp lệ dù còn Open Boundary
(miễn ghi rõ), Open Boundary của `otherRooms`/`excludedRooms` thuộc
Constraint Set Compiler chứ không phải Requirement, cấu trúc tài liệu
Frozen, và ADR 1-file-1-decision. Không có phản biện mới.

---

## 5. Architecture Principles vs Design Principles

Đồng ý nên tách — nhưng đề xuất đi xa hơn một bước, không chỉ đổi tên
mục.

Xem lại đúng 5 ví dụ được liệt kê:

| Nguyên tắc | Thực chất thuộc về đâu |
|---|---|
| Requirement is not Design | Đặc thù Requirement |
| Prefer Deterministic over AI | Đặc thù Concept Design pipeline (Constraint/Descriptor), không áp dụng cho chính Requirement Extraction — bước đó bắt buộc phải dùng AI |
| Prevent \> Detect | Đặc thù triết lý chống-bug ảnh phối cảnh (Descriptor/Prompt), không thuộc Requirement |
| Simplicity before Generality | Nguyên tắc toàn dự án (gần với Burden of Proof Rule) |
| Burden of Proof Rule | Nguyên tắc toàn dự án |

Chỉ có **1/5** ví dụ thực sự là "Design Principle của Requirement". Ba
cái còn lại hoặc thuộc về module khác (Concept Design pipeline), hoặc là
nguyên tắc toàn dự án không nên lặp lại trong từng tài liệu module.

**Đề xuất cụ thể:** tách thành 2 tài liệu, không phải 2 mục trong cùng 1
tài liệu:

- `docs/architecture/principles.md` — **Process/Governance Principles**,
  dùng chung cho MỌI module tương lai (Burden of Proof Rule,
  Domain-drives/Implementation-validates, Simplicity before Generality).
  Requirement Domain Model chỉ **tham chiếu** tài liệu này, không copy
  nội dung vào.
- Trong `requirement-domain-model-v1.md`, mục "Design Principles" chỉ
  giữ nguyên tắc thực sự đặc thù Requirement (ví dụ: Requirement is not
  Design). Các nguyên tắc thuộc Concept Design pipeline (Prevent >
  Detect, Prefer Deterministic over AI) nên nằm trong tài liệu Frozen
  của module đó khi tới lượt, không nằm trong Requirement Domain Model.

Lý do: nếu copy các nguyên tắc process/governance vào từng tài liệu
module, sẽ có N bản sao — sửa một chỗ (ví dụ tinh chỉnh Burden of Proof
Rule sau này) sẽ phải sửa lại nhiều nơi, đúng loại rủi ro desync mà
chính nguyên tắc I1 (ở review Template v1) từng cảnh báo, chỉ khác là ở
tầng tài liệu thay vì tầng dữ liệu.

---

## 6. Freeze từng module vs freeze toàn pipeline

**Đồng ý mạnh với hướng nghiêng của ChatGPT (freeze từng module), và có
một lý do bổ sung khiến đây không chỉ là lựa chọn thực dụng mà còn là hệ
quả bắt buộc của chính các nguyên tắc vừa thống nhất.**

Lý do bổ sung — tính bất đối xứng giữa các module:

Requirement Domain Model **đủ điều kiện freeze ngay hôm nay** chính vì
nó đã có bằng chứng implementation thật (nhiều tháng vận hành Discovery
Chat/Estimate Engine) — đúng tinh thần "Implementation validates domain"
+ "Evidence quality matters more than idea quality" (mục 2 vòng trước).
Constraint Set Compiler, Design Intent Graph, Geometry, Descriptor
**chưa có bất kỳ bằng chứng implementation nào** — nếu freeze chúng ở
cùng độ sâu chi tiết ngay bây giờ, đó chính xác là hành vi bị chính
Burden of Proof Rule cảnh báo: chốt kiến trúc dựa trên lý thuyết thuần
tuý, chưa có failure mode/evidence cụ thể nào để kiểm chứng.

Vì vậy freeze-toàn-pipeline-trước-khi-code không chỉ kém thực dụng hơn
cho solo founder — nó **mâu thuẫn trực tiếp** với nguyên tắc vừa được
đồng thuận trong chính vòng thảo luận này.

**Đề xuất cụ thể cho bước kế tiếp:** không vội freeze chi tiết Constraint
Set Compiler/Design Intent Graph/Geometry ở độ sâu như Requirement.
Trình tự nên là:

1. Implement phần bổ sung nhỏ của Requirement (đã rõ, rủi ro thấp).
2. Chạy Manual POC cho **Rủi ro #1** (Design Intent Graph realizability
   — rủi ro cao nhất, đã xác định ở vòng 3) bằng một Constraint Set Compiler
   tối giản/thủ công, chưa cần đặc tả đầy đủ.
3. Dùng bằng chứng từ bước 2 để quyết định độ sâu freeze thực sự cần cho
   Constraint Set Compiler Specification và Design Intent Graph — có
   thể sẽ khác nhiều so với những gì suy luận thuần lý thuyết đưa ra bây
   giờ.

Khung 13 Golden Contract (Phase A) vẫn giữ nguyên ở mức thô (input/
output/acceptance criteria) — đó là biên module, không phải domain model
chi tiết, nên không mâu thuẫn với đề xuất này.

---

## 7. Kết thúc chuỗi thảo luận Requirement Domain Model

Đồng ý. Không còn vấn đề nền tảng mới cần nêu.

---

## 8. Đánh giá workflow cộng tác mới

**Đồng ý với workflow được đề xuất, với 2 điều chỉnh cụ thể** — không
đề xuất workflow khác, vì bản chất workflow này đã đúng nguyên tắc vừa
xây dựng suốt 5 vòng (evidence trước lý thuyết, review có mục tiêu cụ
thể thay vì tái thiết kế tự do).

### Điều chỉnh 1 — giới hạn số vòng review

Sơ đồ hiện tại vẽ "Claude review → Sửa nếu cần → Freeze" như một lượt
duy nhất. Nhưng chính chuỗi Requirement Domain Model vừa xong đã mất
**5 vòng** để hội tụ — nếu không có giới hạn rõ ràng, không có gì đảm
bảo module tiếp theo không lặp lại 5 vòng, đi ngược mục tiêu "giảm vòng
lặp debate". Đề xuất: đặt một giới hạn cụ thể, ví dụ **tối đa 2 vòng
review cho mỗi module** — nếu sau 2 vòng còn bất đồng, Founder ra quyết
định cuối thay vì tiếp tục vòng 3. Điều này biến mục tiêu "giảm debate"
từ nguyện vọng thành luật chơi có thể thực thi.

### Điều chỉnh 2 — review phải nêu rõ cả phần "đã xác nhận đúng", không chỉ phần "có vấn đề"

Vai trò mới nhấn mạnh tìm assumption sai/hidden coupling/migration risk
— đúng, nên giữ. Nhưng nếu báo cáo review chỉ liệt kê vấn đề, một báo
cáo "không tìm thấy gì" sẽ mơ hồ: không rõ là "đã xem kỹ và ổn" hay
"chưa xem kỹ". Đề xuất: mỗi review luôn có 2 phần — **Confirmed Sound**
(đã kiểm tra, không có vấn đề, nêu rõ vì sao) và **Findings** (nếu có) —
để im lặng không bị hiểu nhầm thành sơ suất.

### Một điểm áp dụng ngay từ chính vòng này

Theo đúng workflow mới vừa thống nhất, việc soạn **toàn bộ nội dung**
`Requirement Domain Model v1.0 (Frozen)` từ cấu trúc đã đề xuất giờ nên
thuộc vai trò của ChatGPT ("ChatGPT thiết kế... Freeze Draft"), không
phải Claude tự soạn — Claude sẽ review bản Freeze Draft đó khi nó được
đưa ra, đúng vị trí "Claude review" trong sơ đồ. Đây là một hệ quả tự
nhiên, áp dụng workflow mới ngay lập tức thay vì chờ tới module kế tiếp.

---

## 9. Xác nhận vai trò

Từ thời điểm này, Claude không tiếp tục chủ động đề xuất mở rộng
Requirement Feature trừ khi có concrete failure mode. Vai trò chuyển
sang: Architecture Reviewer / Domain Reviewer / ADR Reviewer / Hidden
Coupling Reviewer / Migration Risk Reviewer / Code Reviewer, theo đúng
mô tả ở mục 8 gốc.
