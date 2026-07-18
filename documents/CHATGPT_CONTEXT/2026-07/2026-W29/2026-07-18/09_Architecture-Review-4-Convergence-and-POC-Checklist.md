# Architecture Review #4 — Convergence + Manual POC Checklist

**Ngày:** 2026-07-18
**Phạm vi:** Thuần kiến trúc — không code, không schema, không API, không
UI. Đây là vòng review CUỐI trước khi chuyển sang manual POC (theo đúng ý
Founder).

---

## Trả lời 3 câu hỏi trực tiếp

### 1. Có đồng ý với 2 challenge không?

**Đồng ý cả hai, không có bảo lưu.** Cả hai đều là cải tiến thật, không
phải tinh chỉnh nhỏ — chi tiết ở mục A/B dưới.

### 2. Có chỉnh sửa kiến trúc hiện tại không?

**Có, 3 thay đổi cụ thể** (chi tiết mục A/B/C):

1. Tách "Prompt Builder" (doc 08) thành 2 bước: **Descriptor Compiler**
   (nội dung — compile constraint thành sự thật hình ảnh tích cực) và
   **Prompt Compiler** (định dạng — viết đúng cú pháp cho 1 model cụ thể).
2. Thêm acceptance criteria RIÊNG cho từng lớp pipeline (bảng ở mục B),
   không chỉ benchmark output cuối.
3. Đổi tên **Spatial Layout Model → Design Intent Graph** (mục C).

### 3. Còn thiếu quyết định nào trước khi bắt đầu POC?

Có 3 việc nhỏ cần chốt/chuẩn bị trước khi chạy — liệt kê đầy đủ ở mục D,
kèm checklist POC cụ thể có thể làm ngay bằng tay (không cần code).

---

## A. Prevent > Detect — đồng ý, đây là cải tiến đúng hướng

Ví dụ Founder đưa ra (`garage=false` → "pedestrian entrance, fence,
continuous facade, no vehicle entrance, no garage door") chỉ ra đúng 1
nguyên lý prompt engineering đã biết: **image model được huấn luyện chủ
yếu từ caption MÔ TẢ CÁI GÌ CÓ MẶT, hiếm khi caption nói về cái KHÔNG có
mặt** — vì vậy câu phủ định ("no garage") thống kê ra ít được model "nghe
theo" hơn nhiều so với 1 mô tả TÍCH CỰC, cụ thể, mà bản thân nó ĐÃ LOẠI TRỪ
khả năng có gara (vd "mặt tiền liền mạch, lối vào cho người đi bộ" — nếu
mặt tiền liền mạch thì không thể có cửa gara). Đây không phải mẹo vặt —
đây là chuyển 1 ràng buộc PHỦ ĐỊNH thành 1 ràng buộc TÍCH CỰC TƯƠNG ĐƯƠNG
VỀ MẶT LOGIC — cách này đáng tin hơn hẳn so với chỉ thêm "no X" vào cuối
câu.

**Cần tầng Descriptor trung gian hay có thể sinh prompt text luôn?**

Cần. Lý do không chỉ là tổ chức code cho gọn — có 2 lý do kiến trúc thật:

1. **Tách được nội dung khỏi định dạng ở một mức MỚI**, sớm hơn mức tôi
   đề xuất ở doc 08 (lúc đó tôi mới tách ở bước "viết cho model nào").
   Giờ tách sớm hơn: trước tiên compile ra **sự thật hình ảnh** (dữ liệu
   có cấu trúc, đúng/sai kiểm tra được), SAU ĐÓ mới viết thành câu — với
   BẤT KỲ model nào.
2. **Kiểm tra được ở dạng DỮ LIỆU thay vì dò chuỗi text.** Nếu chỉ có 1
   chuỗi prompt cuối cùng, muốn biết "có chắc đã loại trừ gara chưa" phải
   dò tìm chữ trong câu văn (dễ vỡ — sửa câu văn 1 chút là mất dấu vết).
   Nếu có `FacadeDescriptor.hasVehicleEntrance: false` là 1 field có kiểu
   rõ ràng, việc kiểm tra là so sánh boolean — đáng tin tuyệt đối.

**Đề xuất cấu trúc 3 Descriptor** (đúng như Founder gợi ý, giữ nguyên tên):

| Descriptor | Sinh từ | Chứa gì |
|---|---|---|
| `FacadeDescriptor` | Constraint Set + Design Intent Graph (`facadeExposure`) | Vật liệu, số tầng, loại mái, có/không gara-ban công (dạng boolean tường minh), vị trí lối vào |
| `ExteriorDescriptor` | FacadeDescriptor + Geometry (khối nhà, tỷ lệ) | Toàn bộ thông tin cần để dựng 1 ảnh phối cảnh ngoại thất |
| `InteriorDescriptor` *(tương lai, khi làm Interior)* | Design Intent Graph (từng Space) | Loại phòng, phong cách, ánh sáng — 1 descriptor/phòng |

**Compile luật phủ định → sự thật tích cực — nên là bảng tra cứu cố định,
không để LLM tự nghĩ mỗi lần** (đúng nguyên tắc đã dùng cho roofType/style
ở doc 08): mỗi ràng buộc phủ định trong Constraint Set có 1 mục tương ứng
trong bảng, người viết 1 lần, review 1 lần, dùng lại mãi. Ví dụ mở đầu
(cần chuẩn bị thêm vài mục nữa trước POC — xem mục D):

```text
garage=false    → hasVehicleEntrance=false, hasPedestrianEntrance=true,
                  facadeContinuity=true
balcony=false   → hasProjectingSlab=false, facadeType="flush",
                  windowOnly=true
```

**Pipeline cập nhật (thay đoạn Prompt Builder ở doc 08 bằng 2 bước):**

```text
Design Intent Graph + Geometry + Constraint Set
        │
        ▼
[Descriptor Compiler] — deterministic, dùng bảng tra cứu cố định
        │
        ▼
FacadeDescriptor / ExteriorDescriptor / (InteriorDescriptor sau)
        │
        ▼
[Prompt Compiler] — deterministic, RIÊNG theo từng ImageProvider
        │
        ▼
Image
```

---

## B. Benchmark theo từng lớp pipeline — đồng ý, và có 1 hệ quả quan trọng

Sau khi thêm Descriptor, pipeline đầy đủ có 6 lớp. Đề xuất acceptance
criteria + loại kiểm tra cho từng lớp:

| # | Lớp | Acceptance criteria | Loại kiểm tra |
|---|---|---|---|
| 1 | Requirement → Constraint Set | Mọi ràng buộc cứng trong Requirement (bool/đếm/enum/kích thước) có mặt đúng giá trị trong Constraint Set | **Deterministic** — unit test, chạy 1 lần là tin được mãi |
| 2 | Constraint Set + Requirement → Design Intent Graph | Structural Requirement Accuracy (doc 08): đúng số phòng, không có Space bị cấm, tổng diện tích hợp lý | **AI-quality** — cần benchmark liên tục, đây là 1 trong 2 điểm rủi ro AI thật sự |
| 3 | Design Intent Graph → Geometry | Không chồng lấn, tổng diện tích khớp trọng số, cạnh chung tồn tại cho mọi cặp `connection` | **Deterministic** — unit test |
| 4 | Constraint Set + Design Intent Graph + Geometry → Descriptor | Mọi `mustNotInclude`/`mustInclude` có field tương ứng đúng giá trị trong Descriptor | **Deterministic** — unit test (bảng tra cứu cố định, không phải AI sinh) |
| 5 | Descriptor → Prompt (theo từng ImageProvider) | Prompt/tham số chứa đúng nội dung Descriptor, đúng cú pháp riêng của model | **Bán-deterministic** — kiểm tra được sự có mặt của nội dung, chất lượng hành văn cần review người khi thêm model mới |
| 6 | Prompt → Image | Visual Requirement Accuracy + Rendering Accuracy + Architectural Quality (doc 08) | **AI-quality** — điểm rủi ro AI thật sự còn lại |

**Hệ quả quan trọng (đúng tinh thần "Prevent > Detect" của Founder):** Sau
khi thêm Descriptor, **chỉ còn 2/6 lớp thật sự là rủi ro AI cần benchmark
liên tục** (lớp 2 và lớp 6) — 4 lớp còn lại là đúng/sai kiểu phần mềm, kiểm
tra 1 lần bằng unit test rồi tin cậy mãi mãi (không cần "chấm điểm" mỗi
lần chạy). Đây chính là bằng chứng cụ thể cho thấy kiến trúc đang đi đúng
hướng "ngăn ngừa thay vì phát hiện" — càng nhiều lớp trở thành deterministic,
càng ít việc phải "dò lỗi sau khi đã xảy ra".

---

## C. Đổi tên: Spatial Layout Model → Design Intent Graph

**Đồng ý đổi tên.** "Spatial Layout Model" có chữ "Layout" dễ khiến người
đọc nghĩ đây đã là bố cục/hình học — trong khi bản chất (doc 07) là AI chỉ
sinh **ý đồ** (Space nào tồn tại, quan hệ ra sao, mức riêng tư nào), KHÔNG
sinh hình học (đó là việc của Geometry/Materialization, một lớp riêng biệt
phía sau). "Design Intent Graph" gọi đúng 2 bản chất cùng lúc: (1) đây LÀ
1 đồ thị (không phải danh sách phẳng), (2) nó chứa Ý ĐỒ (quyết định định
tính), không phải kết quả đã hiện thực hoá.

Tôi có cân nhắc 1 tên khác trước khi chốt: **"Spatial Program Graph"**
("program" là thuật ngữ kiến trúc chính thống chỉ "yêu cầu chức năng/công
năng phải đáp ứng" — "kiến trúc chương trình hoá") — về mặt học thuật chính
xác không kém, nhưng dễ gây hiểu lầm với "program" theo nghĩa lập trình
trong ngữ cảnh 1 dự án phần mềm, và không trực quan bằng với người không
chuyên kiến trúc (Founder, sau này có thể cả khách hàng đọc tài liệu). Vì
vậy: **giữ đề xuất của Founder — "Design Intent Graph"** — vừa chính xác
vừa dễ hiểu hơn.

Cập nhật thuật ngữ trong toàn bộ pipeline từ đây về sau: mọi chỗ trước đó
gọi "Spatial Layout Model" (doc 06, 07) nên hiểu là **Design Intent Graph**.

---

## D. Còn thiếu quyết định nào? + Checklist Manual POC

### 3 việc cần chuẩn bị trước khi chạy POC (không phải quyết định kiến
trúc — việc chuẩn bị nội dung)

1. **Bảng tra cứu Descriptor ban đầu** — hiện mới có ví dụ cho
   `garage`/`balcony`. Trước khi test, nên chuẩn bị thêm ít nhất cho:
   `garden=false`, `worshipRoom=false`, `storage=false` (đây là các
   boolean khác trong Requirement có khả năng khách hàng nói "không cần"
   trong hội thoại thật) — vài dòng, không cần đầy đủ toàn bộ enum ngay.
2. **Chọn 1 model ảnh duy nhất cho vòng POC này** (giữ nguyên công cụ
   Founder đang dùng) — chưa cần so sánh đa model ở vòng này; benchmark
   đa model (mục B, lớp 6) để dành cho sau khi kỹ thuật "compile tích cực"
   được xác nhận có hiệu quả với 1 model trước đã (1 biến số 1 lần thử).
3. **Chọn 1-2 ca test Requirement thật có ràng buộc phủ định rõ** — dùng
   lại đúng ca vừa gây lỗi (không gara, không ban công, 4 phòng ngủ, 75m²,
   mái Thái) làm ca test #1; có thể thêm 1 ca thứ 2 khác constraint để
   không kết luận vội từ 1 mẫu.

### Checklist Manual POC (làm bằng tay, không cần code)

1. Với Requirement test #1, tự tay soạn **Design Intent Graph** dạng
   `spaces[]` + `relationships[]` (đúng vocabulary doc 07) — có thể nhờ
   ChatGPT sinh, tự kiểm tra bằng mắt: đủ 4 phòng ngủ? không có Space loại
   `garage`/`balcony`?
2. Tự tay áp bảng tra cứu (mục 1 ở trên) để ra **FacadeDescriptor** —
   dạng liệt kê gạch đầu dòng cũng được, chưa cần đúng format JSON.
3. Tự tay viết prompt cuối theo đúng FacadeDescriptor (mô tả TÍCH CỰC, vd
   "mặt tiền liền mạch, lối vào bộ hành, không có cửa gara/lối xe vào") —
   so sánh với cách viết cũ ("không có gara") để thấy khác biệt rõ.
4. Sinh ảnh bằng model đã chọn (việc 2, mục trên).
5. Tự chấm bằng mắt: ảnh có còn xuất hiện gara/ban công không? Nếu KHÔNG
   còn xuất hiện → xác nhận kỹ thuật "compile tích cực" hiệu quả, có thể
   mở rộng bảng tra cứu cho các constraint khác. Nếu VẪN xuất hiện → cần
   xem lại cách diễn đạt Descriptor→prompt (có thể cần nhấn mạnh hơn, đặt
   ở đầu câu, hoặc thử tham số negative-prompt riêng nếu model hỗ trợ).
6. Lặp lại việc 5 tối đa 2-3 lần điều chỉnh cách viết trước khi kết luận.

### Xác nhận hội tụ kiến trúc

Sau doc 05-09, kiến trúc đã đủ rõ để dừng vòng lặp review và chuyển sang
POC — không còn câu hỏi kiến trúc lớn nào bỏ ngỏ. Việc còn lại là NỘI DUNG
(bảng tra cứu, ca test) và THỰC NGHIỆM (POC), không phải THIẾT KẾ THÊM.
