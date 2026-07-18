# Review — Requirement Template v1 (Reviewer: Claude)

**Vai trò:** Principal Software Architect + Residential Design Domain
Reviewer, độc lập với người soạn bản v1 (ChatGPT).
**Nguyên tắc:** Không viết lại toàn bộ template. Chỉ chỉ ra vấn đề, giải
thích lý do, đề xuất cải thiện. Mục tiêu là tìm điểm mù, giả định ẩn, và
lỗ hổng — không phải đồng thuận cho có.

**Lợi thế bối cảnh riêng của tôi (đáng nói rõ trước khi vào review):** Tôi
vừa cùng Founder/ChatGPT chốt xong kiến trúc pipeline M4-001 (Requirement
→ Constraint Set → Design Intent Graph → Geometry → Descriptor → Prompt →
Exterior), bao gồm cả đặc tả "Golden Contract" cho từng bước (input/output/
acceptance criteria). Vì vậy tôi có thể đối chiếu template này TRỰC TIẾP
với những gì bước kế tiếp (Constraint Set Compiler) đã cam kết sẽ đọc từ
Requirement — đây là góc nhìn 1 reviewer khác không có sẵn nếu review độc
lập trong 1 phiên riêng.

---

## Critical Issues

### C1 — Chưa rõ Requirement.md có PHẢI là input trực tiếp cho Constraint Set Compiler hay không

Đây là vấn đề nền tảng nhất, ảnh hưởng tới toàn bộ cách đánh giá các mục
còn lại. Sơ đồ pipeline trong tài liệu context ghi:

```text
Requirement → Constraint → Design Intent Graph → Geometry → Descriptor → Prompt
```

Nếu `Requirement.md` (markdown, bảng thưa, ghi chú tự do) chính là node
"Requirement" trong sơ đồ này, thì có mâu thuẫn với quyết định kiến trúc
đã chốt: **Constraint Set Compiler được thiết kế là 100% deterministic
code**, đọc trực tiếp Requirement, KHÔNG qua AI. Một tài liệu Markdown tự
do (bảng có ô trống, ghi chú câu văn, không có schema cố định) **không thể
được code thuần đọc một cách đáng tin cậy** — sẽ cần 1 bước AI diễn giải ở
giữa, tức là âm thầm đưa AI vào đúng chỗ đã quyết định là deterministic.

Có 2 khả năng, cần làm rõ TRƯỚC khi góp ý sâu hơn về từng mục nhỏ:

- **(a)** `Requirement.md` là bản HIỂN THỊ dành cho người (kiến trúc
  sư/chủ thầu đọc), tương tự cách "Project Brief" hiện tại là bản render
  từ Requirement JSON có cấu trúc (đã đóng băng, Data Model v0.2) — không
  phải bản thân "Requirement" mà pipeline dùng. Nếu vậy, cần nói rõ:
  Requirement JSON có cấu trúc mới là input thật của Constraint Set
  Compiler, `.md` chỉ là 1 view phái sinh.
- **(b)** `Requirement.md` được dùng làm input thật, và Constraint Set
  Compiler sẽ cần 1 bước AI trung gian để đọc nó — nếu vậy, quyết định
  "Constraint Set Compiler = deterministic" cần XÉT LẠI, vì nó phụ thuộc
  trực tiếp vào việc input có cấu trúc đủ chặt hay không.

**Đề xuất:** Xác nhận (a) — giữ đúng quyết định deterministic đã chốt —
và làm rõ `Requirement.md` là 1 rendering, có 1 dạng dữ liệu có cấu trúc
đứng sau nó (không nhất thiết phải đúng y hệt schema JSON hiện tại của
Data Model v0.2, có thể là 1 schema mới riêng cho milestone này, nhưng
PHẢI có cấu trúc máy đọc được).

### C2 — Thiếu field "Phạm vi thi công" (Construction Scope)

Không có mục nào ghi nhận: chỉ khoán nhân công / xây thô / trọn gói /
trọn gói + nội thất. Đây là 1 sự thật có ảnh hưởng rất lớn ở downstream
(hệ thống hiện tại dùng đúng field này để bật/tắt cả section thiết bị vệ
sinh trong Estimate) — và cũng là loại thông tin chắc chắn khách hàng có
thể nói rõ ngay ở giai đoạn phỏng vấn ban đầu, đúng bản chất "Requirement"
(sự thật khách nói ra), không phải suy luận thiết kế. Nên có 1 mục riêng,
không nên chỉ ẩn trong "Mục tiêu xây dựng" (mục 4) lẫn với ngân sách/tiến
độ.

### C3 — Thiếu field "Loại mái" (Roof Type) dưới dạng lựa chọn có kiểm soát

Mục 6 "Phong cách" chỉ có `Phong cách / Hình tham khảo / Điều thích / Điều
không thích` — không có mục riêng cho loại mái. Đây KHÔNG phải chi tiết
nhỏ: pipeline đã chốt (Golden Contract #3, Constraint Set Compiler) đọc
`exactEnum.roofType` trực tiếp từ Requirement để dùng xuyên suốt tới tận
Descriptor/Prompt. Nếu Requirement.md không có chỗ ghi nhận rõ ràng thông
tin này (mái bằng/mái Thái/mái Nhật/mái ngói/mái tôn...), Constraint Set
Compiler không có gì để đọc. Tương tự cho `architecturalStyle` — hiện nằm
chung trong "Phong cách" dạng tự do, nên cân nhắc tách thành 1 field có
danh sách lựa chọn rõ ràng (+ ghi chú tự do khi không khớp lựa chọn nào,
đúng nguyên tắc "enum mở" hệ thống hiện tại đã dùng — không ép về giá trị
gần đúng, cũng không để tự do hoàn toàn).

### C4 — Không có cơ chế ghi nhận "khách từ chối rõ ràng" khác với "khách không nhắc tới"

Đây là điểm quan trọng nhất trong toàn bộ review này, vì nó vừa là lỗ hổng
Requirement Template, vừa là NGUYÊN NHÂN GỐC của 1 lỗi thật đã xảy ra ở
bước sau của pipeline (ảnh AI tự vẽ thêm gara/ban công dù Brief nói không
cần) — team đã phải thiết kế hẳn 1 cơ chế "Constraint Set /
`mustNotInclude`" + "Descriptor Compiler" chỉ để sửa loại lỗi này.

Mục 5 "Công năng mong muốn" là 1 bảng liệt kê KHÔNG GIAN MUỐN CÓ (Không
gian / Số lượng / Ghi chú) — nhưng không có cách nào để ghi "khách nói rõ
KHÔNG CẦN gara" khác với việc đơn giản không liệt kê gara trong bảng. Với
người đọc là kiến trúc sư, sự khác biệt này có thể suy ra được từ ngữ
cảnh hội thoại — nhưng nếu Requirement.md muốn "future AI modules" đọc
được (đúng mục tiêu đề ra), thì đây là dữ liệu bị mất hoàn toàn: bảng chỉ
có positive list, không có negative list.

**Đề xuất cụ thể:** thêm 1 cột "Trạng thái" vào bảng mục 5 (Muốn có /
Không cần — có nghĩa là khách nói rõ / Chưa đề cập), hoặc thêm 1 bảng phụ
"Yêu cầu loại trừ rõ ràng" riêng biệt. Đây chính là dữ liệu tương đương
`mustNotInclude` trong Constraint Set — nên có mặt tường minh từ tận gốc
(Requirement), không phải suy luận lại ở downstream.

---

## Important Suggestions

### I1 — Mục 7 (Hard Constraints), 9 (Unknown Information), 11 (Confidence) có nguy cơ là 3 góc nhìn song song của CÙNG 1 dữ liệu đã có ở mục 2-6

Hiện 3 mục này đứng độc lập, không có hướng dẫn nào giải thích chúng liên
hệ thế nào với dữ liệu "thô" đã khai ở mục 2-6. Rủi ro: cùng 1 sự thật (vd
"ngân sách 2.5-3 tỷ") có thể phải cập nhật ở tới 4 chỗ khác nhau (mục 4:
giá trị thô; mục 7 hoặc 8: có phải bắt buộc không; mục 9: nếu chưa chắc
chắn; mục 11: mức độ tin cậy) — dễ lệch nhau, khó cho cả người điền lẫn
AI đọc lại.

**Đề xuất:** cân nhắc 2 hướng, chọn 1: (a) gắn thẳng thuộc tính
(hard/soft/unknown/confidence) NGAY TRÊN từng dòng dữ liệu gốc ở mục 2-6
(vd thêm 1 cột nhỏ trong mỗi bảng), thay vì tách thành section riêng; hoặc
(b) nếu vẫn muốn giữ section riêng, biến mục 7/9/11 thành **danh sách trỏ
tới** (tham chiếu tên field, không copy lại nội dung) — không lặp dữ liệu.
Mục 8 (Soft Priorities) có bản chất khác (thứ tự ưu tiên/đánh đổi GIỮA các
mối quan tâm khác nhau, không phải độ chắc chắn CỦA 1 dữ liệu) nên có thể
giữ riêng, không gộp vào nhóm này.

### I2 — Ranh giới giữa mục 9 (Unknown Information) và mục 12 (Open Questions) chưa rõ

2 mục này có vẻ mô tả cùng 1 khái niệm từ 2 góc — "cái gì chưa biết" và
"câu hỏi nào còn mở". Nếu đúng là cùng 1 danh sách nhìn từ 2 góc, nên hợp
nhất hoặc ít nhất có 1 câu giải thích ngắn (giống cách mục 5 đã làm tốt
với ghi chú "Chỉ mô tả nhu cầu, chưa quyết định diện tích").

### I3 — "Hình tham khảo" (mục 6) cần ranh giới rõ hơn

Ảnh tham khảo phong cách/mood là Requirement hợp lệ, nhưng nếu ảnh tham
khảo có ngụ ý bố cục/mặt bằng cụ thể thì đã lấn sang "giải pháp kiến trúc"
— đúng loại nội dung template tự khai là "Không thuộc Requirement". Nên
thêm 1 câu hướng dẫn ngắn (vd "chỉ ghi nhận phong cách/vật liệu/tông màu
gợi ý từ ảnh, không diễn giải bố cục trong ảnh").

### I4 — Địa điểm gộp thành 1 dòng, khác với granularity hệ thống hiện tại

Mục 3 chỉ có "Địa điểm:" (1 dòng), trong khi phần còn lại của hệ thống
tách tỉnh/huyện/địa chỉ chi tiết thành 3 field riêng. Không chắc đây là cố
ý đơn giản hoá cho dễ đọc, hay là bỏ sót — nên xác nhận có chủ đích.

### I5 — Bảng "Thành viên" tự do có thể khó trích xuất số liệu ổn định

So với việc hỏi trực tiếp số người lớn/trẻ em/có người già không (như hệ
thống hiện tại đang làm), bảng tự do biểu cảm hơn nhưng khó đảm bảo AI
luôn trích ra đúng số đếm nhất quán giữa các lần chạy khác nhau. Không
phải sai, nhưng nên cân nhắc đánh đổi giữa "tự nhiên khi đọc" và "dễ xử lý
tự động".

---

## Nice to Have

### N1 — Lỗi định dạng Markdown ở mục 7/8/10/12

`## \## 7. Hard Constraints` (và tương tự ở 8, 10, 12) là lỗi hiển thị —
nhìn giống artifact chuyển đổi từ Word/pandoc, khiến heading render sai
(chữ "##" thừa xuất hiện trong tiêu đề). Nên sửa lại thành `## 7. Hard
Constraints` thông thường.

### N2 — Chưa có trường liên kết ngược về hội thoại nguồn

Không bắt buộc, nhưng nếu sau này cần debug "vì sao Requirement ghi thế
này", 1 field tham chiếu đoạn hội thoại/thời điểm tạo sẽ hữu ích.

### N3 — Scalability (villa/nhà phố/chung cư/cải tạo/chỉ nội thất)

Template hiện nghiêng hẳn về nhà xây mới (nhà phố/biệt thự) — mục 3 "Khu
đất" hỏi về đất thô (địa hình, hướng đất, hiện trạng đất) — với dự án
CẢI TẠO hoặc CHỈ NỘI THẤT, câu hỏi cần là về CÔNG TRÌNH HIỆN CÓ (giữ gì,
đập gì, hiện trạng kết cấu), không phải đất. Với CHUNG CƯ, khái niệm "khu
đất/hướng đất" gần như không áp dụng (chỉ có hướng căn hộ/tầng). Đây là
gap thật, nhưng CHẤP NHẬN ĐƯỢC cho v1 nếu phạm vi hiện tại chủ đích tập
trung nhà phố/biệt thự xây mới trước (đúng tinh thần MVP đã thống nhất
xuyên suốt các tài liệu trước) — chỉ cần ghi chú rõ đây là giới hạn có chủ
đích, không phải bỏ sót âm thầm, để không ai ngạc nhiên khi template
không hoạt động tốt cho case cải tạo/chung cư sau này.

---

## Keep As Is

### K1 — Footer "Không thuộc Requirement"

Đây là điểm mạnh nhất của bản v1: liệt kê tường minh những gì KHÔNG được
phép xuất hiện (diện tích từng phòng, bố trí mặt bằng, quan hệ các phòng,
kích thước cầu thang, giải pháp kiến trúc) — đúng kỷ luật ranh giới cần
có giữa các giai đoạn pipeline. Giữ nguyên, có thể cân nhắc thêm (không
bắt buộc) chú thích mỗi mục thuộc về giai đoạn nào sau này (Design Intent
Graph hay Geometry) để rõ hướng đi tiếp theo của dữ liệu.

### K2 — Mẫu ghi chú làm rõ phạm vi ngay trong mục (mục 5)

"Chỉ mô tả nhu cầu, chưa quyết định diện tích" là 1 câu ghi chú tốt, giúp
người điền không lấn phạm vi. Nên áp dụng thêm cho các mục còn mơ hồ khác
(7, 8, 9, 11) thay vì để trống hoàn toàn.

### K3 — Thứ tự tổng thể: Sự thật (1-6) trước, Meta-thông tin (7-12) sau

Cấu trúc lớn này hợp lý, nên giữ — chỉ cần xử lý sự trùng lặp NỘI BỘ trong
khối 7-12 (xem I1).

### K4 — Kỷ luật phạm vi ở các mục sự thật (1-6)

Không phát hiện field nào trong mục 1-6 lấn sang quyết định bố cục/kích
thước phòng/giải pháp thiết kế — kỷ luật ranh giới được giữ tốt xuyên suốt
phần "sự thật", đúng tinh thần đề ra.

---

## Trả lời trực tiếp 6 câu hỏi (tóm tắt, xem chi tiết ở trên)

1. **Thiếu mục nào?** Phạm vi thi công (C2), Loại mái dạng enum (C3), cơ
   chế ghi nhận loại trừ rõ ràng (C4).
2. **Mục nào không cần thiết?** Không có mục nào nên XOÁ hẳn — vấn đề là
   3 mục (7/9/11) TRÙNG LẶP chức năng với nhau và với mục 2-6 (I1), nên
   hợp nhất/tham chiếu thay vì xoá.
3. **Sai giai đoạn?** Không phát hiện field nào rõ ràng thuộc Constraint/
   Design Intent Graph/Geometry bị đặt nhầm ở đây — điểm mạnh của bản
   v1. Chỉ có rủi ro "Hình tham khảo" (I3) có thể trôi dạt nếu không có
   hướng dẫn.
4. **Tổ chức lại thông tin?** Có — hợp nhất/tham chiếu hoá khối 7/9/11
   (I1), làm rõ ranh giới 9 vs 12 (I2). Thứ tự lớn (sự thật trước, meta
   sau) giữ nguyên.
5. **AI Readability?** Vấn đề nền tảng nhất (C1): cần xác nhận
   Requirement.md có phải input thật cho Constraint Set Compiler
   deterministic hay là 1 rendering — quyết định này chi phối toàn bộ
   đánh giá còn lại. Ngoài ra bảng thưa/tự do (I5) khó trích xuất ổn định
   hơn cấu trúc field rời rạc.
6. **Scalability?** Đủ dùng cho nhà phố/biệt thự xây mới (N3) — chưa hỗ
   trợ tốt cải tạo/chỉ nội thất/chung cư, chấp nhận được cho v1 nếu đây là
   giới hạn có chủ đích, không phải bỏ sót.
