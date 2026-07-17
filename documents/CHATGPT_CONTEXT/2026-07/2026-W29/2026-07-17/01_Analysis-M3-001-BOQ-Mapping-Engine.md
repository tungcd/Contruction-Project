# Phân tích 2 file báo giá để thiết kế Mapping Engine

**Ticket:** M3-001 — Milestone 3
**Ngày:** 2026-07-17
**Người phân tích:** Claude Code (Software Engineer)
**Gửi:** Founder + ChatGPT
**Trạng thái:** CHỈ PHÂN TÍCH. **Không có dòng code nào được viết.**

> Theo đúng ticket: "Không code. Không refactor. Không tạo Excel. Không sửa
> file mẫu. Không tạo Prompt. Không estimate. Không thêm Data Model. Không
> thêm Business Rule." Tài liệu này chỉ để Founder quyết định hướng thiết kế
> Module Estimate.

---

# 0. Tóm tắt cho người bận

Hai file đại diện cho **hai triết lý báo giá hoàn toàn khác nhau**, và đây là
phát hiện quan trọng nhất của toàn bộ phân tích:

| | File 1 (BG Chi Linh) | File 2 (BOQ Mr Hùng) |
|---|---|---|
| Loại công trình | Cải tạo nhà ở có sẵn | Xây mới nhà ở gia đình |
| Kiểu báo giá | Đơn giá trọn gói (vật liệu+nhân công gộp 1 số) theo kinh nghiệm nhà thầu | Dự toán theo Định mức/Đơn giá **Nhà nước công bố** (381/2023 Hà Nội) |
| Độ phức tạp đơn giá | 1 số duy nhất, nhà thầu tự đặt | Tra từ database định mức hao phí (Vật liệu+Bù VL+Nhân công+Ca máy) |
| Có thể mô phỏng bằng Rule Engine đơn giản? | **Có** | **Không** — cần tích hợp database định mức Nhà nước, quy mô hoàn toàn khác |

**Khuyến nghị chiến lược (không phải quyết định — Founder quyết):** nếu làm
Draft BOQ cho MVP, nên mô phỏng theo **phong cách File 1** (đơn giá gộp,
"giá thị trường của nhà thầu"), không theo File 2. File 2 đòi hỏi tích hợp
một hệ cơ sở dữ liệu định mức Nhà nước — vượt xa quy mô "MVP Demo" hiện tại.

Cả hai file đều xác nhận một sự thật không đổi: **~90% khối lượng (Khối
lượng/Quantities) trong cả 2 file đến từ đo đạc bản vẽ thực tế** (dài tường,
đếm cửa, dài ống, số công tắc...) — không thể sinh ra chỉ từ hội thoại khách
hàng. Phần **10% còn lại có thể suy luận bằng Rule Engine** là các hạng mục
đếm theo phòng (ví dụ: số bồn cầu = số WC).

---

# 1. Cấu trúc hai file

## 1.1 File 1 — `260309_BG CHI LINH ver 2.xlsx`

Báo giá gửi khách hàng thật (**cải tạo nhà ở**, KĐT Long Việt, Mê Linh, Hà
Nội — công ty Aria Homes). 6 sheet:

| Sheet | Mục đích | Số dòng có dữ liệu |
|---|---|---|
| `TOTAL` | Tổng hợp — mỗi dòng = 1 hạng mục lớn, **tham chiếu công thức** tới ô subtotal ở sheet con (vd `='XÂY DỰNG'!N8`) | ~40 |
| `XÂY DỰNG` | Xây tô, hoàn thiện sàn/trần, sơn, chống thấm, cầu thang, cửa — chia theo **tầng** | 318 |
| ` THIẾT BỊ` (có khoảng trắng đầu) | Thiết bị vệ sinh + bếp, đếm theo tầng/phòng | 164 |
| `HẠNG MỤC NƯỚC` | Ống cấp nước theo đường kính, tính theo mét dài | 69 |
| ` HẠNG MỤC ĐIỆN` (có khoảng trắng đầu) | Dây điện, thiết bị điện, tính theo mét dài/số lượng | 185 |
| `HẠNG MỤC ĐHKK` | Ống đồng điều hòa theo tầng, tính theo mét dài | 70 |

**Quan hệ giữa sheet:** `TOTAL` là sheet gốc duy nhất người đọc quan tâm — nó
**kéo dữ liệu bằng công thức Excel** từ 5 sheet còn lại (không phải nhập
tay). Không có sheet nào tham chiếu ngược lại `TOTAL`. Cấu trúc 1 tầng
(flat), không có sheet trung gian.

## 1.2 File 2 — `2025.09.22 BOQ BAO GIA Mr Hung_comment.xlsx`

Dự toán chuyên nghiệp cho **nhà ở gia đình xây mới**, xuất ra từ một phần
mềm dự toán xây dựng Việt Nam (dấu hiệu: sheet `Cấu hình` có mã
`DG381_2023HN_XD` = Đơn giá 381/2023 Hà Nội — Quyết định đơn giá xây dựng
chính thức của Nhà nước; `Giá máy 1071/QĐ-SXD năm 2024`). 46 sheet, nhưng
**chỉ ~15 sheet có dữ liệu thật**, còn lại là template rỗng của phần mềm
(giai đoạn Quyết toán/QT, định mức tư vấn... không dùng cho báo giá presales
này).

### Sheet có dữ liệu thật (dùng cho báo giá này)

| Sheet | Mục đích | Số dòng |
|---|---|---|
| `Tong hop` | Tổng hợp 4 hạng mục chính + mục tạm tính + phí quản lý 2% + giảm giá | 24 |
| `Ket cau` (Kết cấu) | Móng cọc BTCT, đào móng, bê tông+thép theo tấn, bể nước/bể phốt | 60 |
| `Kien truc` (Kiến trúc) | Cửa, xây trát, ốp lát, sơn — theo **loại vật liệu** (không chia theo tầng như File 1) | 84 |
| `Dien+ DHKK` | Tủ điện, aptomat, công tắc, ổ cắm — liệt kê từng thiết bị theo mã kỹ thuật (MCB 2P 100A...) | 70 |
| `CTN` (Cấp thoát nước) | Ống PPR theo đường kính, phụ kiện (cút, tê, nối) đếm từng cái | 108 |
| `TH chi phí TB` | Khung tổng hợp chi phí thiết bị — **có công thức nhưng CHƯA điền dữ liệu** trong file này | 21 |
| `Cước VC`, `Cước bộ` | Bảng tính cước vận chuyển vật liệu theo cự ly — máy tính nội bộ của phần mềm, phần lớn công thức bị lỗi `#REF!` (dữ liệu nguồn không đi kèm file) | — |
| `Công trình TL`, `Hệ số`, `Đơn giá TH` | Bảng tra định mức/hệ số gốc của phần mềm — **hầu hết `#REF!`**, không dùng được độc lập | — |
| `Cấu hình` | Metadata phần mềm (tỉnh/thành, mã đơn giá, hệ số công trình) | 79 |

### Sheet rỗng (~25 sheet) — bỏ qua

Toàn bộ nhóm quyết toán (`Quyết toán`, `KL hoàn thành`, `KL phát sinh`, `Hệ
số Pn`...), định mức tư vấn, giá tháng QT... — là template chu trình dự án
đầy đủ của phần mềm dự toán, **không liên quan tới giai đoạn báo giá
presales**.

**Quan hệ giữa sheet:** `Tong hop` kéo formula từ 4 sheet hạng mục chính
(giống mô hình `TOTAL` của File 1). Các sheet `Cước VC`/`Đơn giá TH`/`Hệ số`
là tầng **cơ sở dữ liệu định mức nội bộ** để TÍNH RA cột "Đơn giá" trong
`Ket cau`/`Kien truc`/... — nhưng chuỗi tính đó đã bị đứt (`#REF!`) trong
file được cung cấp, nghĩa là **đơn giá cuối cùng đã "đông cứng" thành số**,
không còn công thức sống động để dò ngược.

### Một chi tiết đáng chú ý: cột Q&A đàm phán

Cả `Ket cau`, `Kien truc`, `Dien+ DHKK`, `CTN` đều có 2 cột cuối **"Câu hỏi
CĐT" / "Nhà thầu trả lời"** — ghi lại hội thoại thật giữa chủ đầu tư và nhà
thầu khi chốt vật tư (vd: *"Sắt thép hãng gì?" → "Hòa Phát"*; *"Bê tông
thương phẩm có hãng cụ thể không?" → "Không quy định hãng - quy định
Mác"*). Đây chính là tên file có đuôi `_comment` — không phải Excel Comment
gốc mà là cột đàm phán tường minh.

---

# 2. Phân loại cột: Input / Formula / Lookup / Output

Cả 2 file dùng chung một MẪU CỘT giống nhau ở mọi sheet hạng mục:

| Vai trò | File 1 (XÂY DỰNG...) | File 2 (Ket cau...) | Ghi chú |
|---|---|---|---|
| **Input** (người dùng gõ tay) | `G/H/I` (kích thước rộng/cao/sâu), `J` (hệ số/số lượng), `M` (đơn giá) | `D` (Khối lượng — số thô, không công thức), `G` (ghi chú hãng) | Đây là nơi con người nhập số đo từ bản vẽ |
| **Formula** (Excel tự tính) | `L=PRODUCT(F:J)` (diện tích/số lượng), `N=PRODUCT(L,M)` (thành tiền), `SUBTOTAL` gộp nhóm | `F=E*D` (thành tiền = đơn giá × khối lượng) | Luôn là phép nhân đơn giản, không có logic nghiệp vụ ẩn |
| **Lookup** (tra từ nguồn khác) | Không có — `M` (đơn giá) là số cố định nhà thầu tự đặt | `E` (Đơn giá) — **về mặt thiết kế** là tra từ `Đơn giá TH`/database định mức Nhà nước; **trong file thực tế** đã là số cố định (chuỗi tra cứu đã đứt) | Khác biệt triết lý cốt lõi giữa 2 file |
| **Output** (kết quả cuối) | `N` (thành tiền dòng), `TOTAL` sheet (tổng công trình) | `F` (thành tiền dòng), `Tong hop` sheet | |

**Kết luận Q2:** Không có cột nào trong 2 file này là "Input từ Requirement".
Toàn bộ input hiện tại là **số đo từ bản vẽ** hoặc **đơn giá do nhà thầu/nhà
nước quy định** — cả hai nguồn đều nằm ngoài phạm vi một cuộc hội thoại
Discovery.

---

# 3. Dữ liệu nào lấy trực tiếp từ Requirement?

Đối chiếu theo đúng ví dụ ticket đưa ra:

```
3 tầng
  → Ảnh hưởng: XÂY DỰNG (số block tường theo tầng), HOÀN THIỆN SÀN/TRẦN
    (nhân số tầng để ước lượng diện tích), THANG (số tầng quyết định số
    bậc/chiếu nghỉ — nhưng KHÔNG suy ra được số bậc chính xác)
```

```
Mái bằng
  → Ảnh hưởng: File 1 không có dòng "làm mái" riêng cho XÂY MỚI (đây là
    file cải tạo, không xây mái mới) — mái bằng chỉ xuất hiện gián tiếp
    qua "CÁN NỀN tầng mái", "HOÀN THIỆN SÀN tầng mái", "CHỐNG THẤM sàn mái".
    Nếu là "mái Nhật/Thái" (mái dốc) sẽ phát sinh thêm hạng mục KẾT CẤU MÁI
    (xà gồ, cầu phong, ngói) HOÀN TOÀN KHÔNG có trong 2 file mẫu này — vì cả
    2 công trình mẫu đều là mái bằng. Đây là một lỗ hổng dữ liệu Ground
    Truth: chưa có ví dụ thật cho nhà mái dốc.
```

```
4 phòng ngủ
  → Ảnh hưởng hạng mục: mỗi phòng ngủ kéo theo (a) diện tích tường bao +
    trát + sơn (không suy ra được số m² chính xác nếu không có bản vẽ,
    NHƯNG có thể ước lượng thô), (b) 1 bộ cửa đi phòng ngủ (File 2 Kien truc
    có dòng "Cửa đi phòng ngủ" — số lượng CÓ THỂ suy ra ≈ số phòng ngủ),
    (c) hệ thống điện cơ bản (1 công tắc + vài ổ cắm/đèn mỗi phòng — Rule
    Engine có thể ước lượng thô số lượng thiết bị điện, KHÔNG suy ra được
    đi dây bao nhiêu mét).
```

Bảng tổng hợp field Requirement hiện tại (theo `03-Data-Model.md` v0.2) và
sheet nó chạm tới:

| Field Requirement | Sheet/hạng mục bị ảnh hưởng | Mức độ ảnh hưởng |
|---|---|---|
| `project.projectType` | Quyết định BỘ HẠNG MỤC nào cần có (xây mới có Kết cấu móng; cải tạo có "Dọn dẹp hiện trạng") | Cao — quyết định cấu trúc BOQ |
| `project.buildingType` | Ảnh hưởng đơn giá tham chiếu (nhà phố khác biệt thự) | Trung bình |
| `project.province`/`district` | File 2 cho thấy đơn giá phụ thuộc TỈNH/THÀNH (`DG381_2023HN` = Hà Nội) | Cao nếu dùng đơn giá Nhà nước; thấp nếu dùng giá nhà thầu tự đặt |
| `site.landArea` | Gián tiếp: sân vườn, cổng hàng rào (File 2: "Cổng và hàng rào" tạm tính riêng, không phụ thuộc landArea trực tiếp) | Thấp-Trung bình |
| `site.buildingFootprint` | **Trực tiếp**: cơ sở ước lượng diện tích móng, diện tích sàn mỗi tầng | Cao (nếu dùng Rule Engine ước lượng thô) |
| `site.totalFloorArea` | **Trực tiếp**: cơ sở ước lượng tổng diện tích tường/sàn/trần/sơn toàn công trình | Cao |
| `building.floors` | **Trực tiếp**: nhân hệ số theo tầng cho hầu hết hạng mục hoàn thiện | Cao |
| `building.basementLevels` | Ket cau: đào móng, chống thấm tầng hầm — hạng mục ĐẮT, hiện KHÔNG có trong cả 2 file mẫu (không nhà nào có hầm) | Không kiểm chứng được — thiếu Ground Truth |
| `building.roofType` | Chỉ ảnh hưởng nếu là mái dốc (không có trong 2 file mẫu — xem lỗ hổng ở trên) | Không kiểm chứng được |
| `building.foundationType` | **Trực tiếp** quyết định hạng mục Kết cấu móng (móng cọc vs móng băng/đơn) — File 2 dùng móng cọc; hai loại móng có BOQ hoàn toàn khác nhau | Cao, nhưng field hiện đang `unknown` phổ biến ở giai đoạn Discovery |
| `functional.bedrooms` | Số cửa phòng ngủ, ước lượng thô diện tích | Trung bình |
| `functional.bathrooms` | **Trực tiếp, đáng tin cậy nhất**: số thiết bị vệ sinh (xí, sen, lavabo, vòi xịt...) gần như = số WC | Cao — đây là field ánh xạ TỐT NHẤT trong toàn bộ Requirement |
| `functional.kitchen` | Thiết bị bếp (chậu rửa, vòi rửa) | Trung bình |
| `functional.garage` | Không có hạng mục gara riêng trong 2 file mẫu (cả 2 đều không có gara ô tô) | Không kiểm chứng được |
| `functional.otherRooms` | Không map được — quá tự do | Thấp |
| `budget.*`, `constructionScope` | Không map trực tiếp vào BOQ — đây là RÀNG BUỘC đầu ra (BOQ nên khớp khoảng ngân sách), không phải input tính toán | Dùng để VALIDATE ngược, không để SINH BOQ |

---

# 4. Dữ liệu AI KHÔNG THỂ tự sinh (đầy đủ)

Đây là phần quan trọng nhất — liệt kê theo từng hạng mục, có trích dẫn dòng
thật trong file:

## 4.1 Nhóm "phải đo từ bản vẽ kiến trúc/kết cấu"

| Dữ liệu | Ví dụ trích dẫn | Vì sao AI không sinh được |
|---|---|---|
| Chiều dài từng đoạn tường | File 1 `XÂY DỰNG!G12`: `=2.4+0.2*2+0.5` (cộng tay từng đoạn đo) | Cần bản vẽ mặt bằng có kích thước từng đoạn tường |
| Diện tích tường trừ cửa/cửa sổ | File 1 `R22`: `J22:-2` (trừ 2 lỗ cửa 0.8×2.4m) | Cần biết vị trí và số lượng lỗ mở trên từng bức tường cụ thể |
| Khối lượng đào móng, số lượng cọc, chiều dài cọc | File 2 `Ket cau!D5`: cọc 350m, `D6`: hệ số ép cọc theo cấp đất | Cần thiết kế móng của kỹ sư kết cấu + khảo sát địa chất |
| Khối lượng thép theo đường kính (tấn) | File 2 `Ket cau!D13-D20`: thép D<10/D<=18/D>18 theo tấn riêng từng cấu kiện | Cần bản vẽ kết cấu chi tiết (bản vẽ thép) |
| Diện tích ván khuôn (coppha) | File 2 `Ket cau!D12`: `0.45` (đơn vị 100m²) | Suy từ hình học cấu kiện bê tông cụ thể, không suy từ Requirement |
| Chiều dài dây điện, ống nước theo mét | File 1 `HẠNG MỤC ĐIỆN!K9`: dây 1×1.5 dài 2250m; File 2 `CTN!D6`: ống D50 dài 20m | Cần bản vẽ đi dây/đi ống (thiết kế M&E) |
| Số lượng phụ kiện ống (cút, tê, nối) | File 2 `CTN!D15-D20`: nối thẳng, cút 90° đếm từng loại theo đường kính | Cần thiết kế tuyến ống chi tiết |
| Số lượng aptomat/công tắc theo tải điện | File 2 `Dien+ DHKK!D10-D20`: từng loại MCB theo dòng điện (25A/32A/40A/100A) | Cần tính toán tải điện (thiết kế điện) |
| Diện tích ốp lát theo từng khu vực | File 1 `HOÀN THIỆN SÀN!L103` v.v. | Suy được THÔ qua Rule Engine (xem mục 5), nhưng số CHÍNH XÁC cần bản vẽ mặt bằng nội thất |
| Số bậc cầu thang, chiều dài lan can | File 1 `THANG!R174`: `bậc 900: 17×3 = 51 bậc` | Cần thiết kế cầu thang cụ thể (chiều cao tầng, độ dốc) |

## 4.2 Nhóm "phải đàm phán/xác nhận với khách"

| Dữ liệu | Ví dụ | Ghi chú |
|---|---|---|
| Thương hiệu vật tư cụ thể | Cột "Câu hỏi CĐT/Nhà thầu trả lời": thép Hòa Phát, thiết bị điện Panasonic/Sino, cửa composite Naviwood/HB Door | Đây là quyết định thương mại, không phải kỹ thuật — không thuộc phạm vi Rule Engine |
| Mẫu gạch/màu sơn cụ thể | File 1: "theo mẫu được duyệt" xuất hiện lặp lại nhiều dòng | Chưa chốt tại thời điểm báo giá — thường để trống hoặc placeholder |

## 4.3 Nhóm "phụ thuộc cơ sở dữ liệu định mức Nhà nước" (chỉ File 2)

Toàn bộ cột **Đơn giá** trong File 2 (không phải khối lượng, mà là ĐƠN GIÁ)
đến từ một cơ sở dữ liệu định mức hao phí (Vật liệu+Nhân công+Ca máy) do
Nhà nước công bố theo từng tỉnh/thời điểm — **AI và cả Rule Engine đơn giản
đều không tự sinh được**, trừ khi Module Estimate tích hợp thẳng cơ sở dữ
liệu này (quy mô dự án hoàn toàn khác, không phải việc của MVP).

---

# 5. Dữ liệu có thể suy luận bằng Rule Engine (không cần chính xác)

Đúng tinh thần ticket — chỉ liệt kê, không tính chính xác:

```
buildingType = nhà phố
  ↓
floors = 3
  ↓
buildingFootprint ≈ landArea × 0.7 (hệ số xây dựng thông thường)
  ↓
totalFloorArea ≈ buildingFootprint × floors
  ↓
≈ tổng diện tích sàn cần hoàn thiện (gạch, trần, sơn)
```

```
totalFloorArea
  ↓
Diện tích tường xây ≈ totalFloorArea × hệ số kinh nghiệm (vd 0.9-1.2 m²
tường/m² sàn — tuỳ mật độ phòng)
  ↓
Diện tích trát = 2 × diện tích tường xây (trong + ngoài)
  ↓
Diện tích sơn ≈ diện tích trát (trừ hao hụt cửa/cửa sổ theo % kinh nghiệm)
```

```
bathrooms = N
  ↓
≈ N bộ: xí + sen cây/vòi sen + lavabo + vòi xịt + giá treo khăn + thoát sàn
  ↓
(Đã kiểm chứng bằng dữ liệu thật: File 1 THIẾT BỊ R22-R27, "Xí"=3,
"Sen cây"=3 — ĐÚNG BẰNG số WC tầng 2+3+áp mái. Đây là ánh xạ đáng tin cậy
nhất tìm được trong toàn bộ phân tích.)
```

```
bedrooms = N
  ↓
≈ N bộ cửa đi phòng ngủ (kích thước chuẩn theo buildingType)
  ↓
≈ N × (1 công tắc + 2-3 ổ cắm + 1 đèn) — SỐ LƯỢNG thiết bị điện cơ bản,
  KHÔNG suy ra được mét dây
```

```
floors = N
  ↓
≈ ước lượng thô số bậc cầu thang (chiều cao tầng thông thường 3.2-3.6m ÷
  chiều cao bậc tiêu chuẩn ~17cm ≈ 18-21 bậc/tầng) — CHỈ DÙNG ĐỂ ƯỚC LƯỢNG,
  sai số cao vì phụ thuộc thiết kế cầu thang thực tế
```

```
constructionScope = turnkey_with_interior
  ↓
Bật thêm nhóm hạng mục "THIẾT BỊ" (File 1) / "Chi phí nội thất" (File 2)
vào Draft BOQ; nếu = labor_only thì loại bỏ toàn bộ hạng mục vật tư, chỉ
giữ dòng nhân công (File 2 Ket cau/Kien truc không tách nhân công riêng
nên KHÔNG áp dụng được cho labor_only — chỉ File 2 dạng đầy đủ đơn giá tổng
hợp mới tách được nhân công/vật liệu/máy)
```

**Nguyên tắc chung rút ra:** Rule Engine suy luận tốt nhất ở cấp độ
**"tổng diện tích/tổng số lượng theo hệ số kinh nghiệm"**, KHÔNG suy luận
được ở cấp độ **"từng đoạn tường/từng mét dây"**. Đây chính là ranh giới tự
nhiên giữa "Draft BOQ 60-70%" (khả thi) và "BOQ chính xác 100%" (cần bản
vẽ, ngoài phạm vi AI).

---

# 6. Đề xuất Mapping Layer (thiết kế, không implement)

```
Requirement (đã đóng băng, Data Model v0.2)
        │
        ▼
┌───────────────────────────────────────────┐
│  RULE ENGINE                               │
│  - Input: Requirement fields               │
│  - Output: BOQDraftLine[] (derived, KHÔNG  │
│    lưu DB — giống Score/Readiness hiện tại)│
│                                             │
│  3 loại rule, độ tin cậy giảm dần:         │
│  (a) Đếm trực tiếp theo phòng               │
│      (bathrooms → thiết bị vệ sinh)         │
│      Độ tin cậy: CAO                        │
│  (b) Ước lượng diện tích theo hệ số         │
│      (totalFloorArea → diện tích tường/sơn) │
│      Độ tin cậy: TRUNG BÌNH                 │
│  (c) Bật/tắt cả nhóm hạng mục theo cấu hình │
│      (foundationType=pile → thêm nhóm       │
│      "móng cọc"; constructionScope → bật/   │
│      tắt nhóm thiết bị)                     │
│      Độ tin cậy: nhị phân (có/không), không │
│      có khái niệm "sai số"                  │
└───────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│  BOQ DRAFT                                  │
│  Mỗi dòng gắn nhãn NGUỒN GỐC (bắt buộc,     │
│  đây là điểm mấu chốt để Founder tin dùng): │
│  - "rule_estimated"  (Rule Engine đoán)     │
│  - "needs_measurement" (placeholder, chưa   │
│    có số — phải đo bản vẽ, hiển thị 0 hoặc  │
│    trống thay vì bịa số)                    │
│  - "needs_survey" (cần khảo sát: móng, địa  │
│    chất...)                                 │
│                                             │
│  Đơn giá: dùng bảng đơn giá THAM CHIẾU đơn   │
│  giản (kiểu File 1 — 1 số/đơn vị, KHÔNG      │
│  theo định mức Nhà nước kiểu File 2), do     │
│  Founder tự nhập/duy trì, KHÔNG do AI sinh  │
└───────────────────────────────────────────┘
        │
        ▼
   Founder chỉnh sửa (sửa số đo thật, chọn vật tư,
   xác nhận các dòng "needs_measurement")
        │
        ▼
   Xuất Excel (cấu trúc tối thiểu: STT/Hạng mục/
   Đơn vị/Khối lượng/Đơn giá/Thành tiền — theo
   MẪU ĐƠN GIẢN của File 1, không theo mẫu Nhà
   nước của File 2)
```

**Điểm thiết kế quan trọng nhất:** BOQ Draft **phải phân biệt rõ** dòng nào
do Rule Engine ước lượng (có thể sai) và dòng nào cần đo thật (chưa có số).
Nếu trộn lẫn, Founder sẽ vô tình báo giá dựa trên số bịa mà không biết —
đúng loại rủi ro đã từng xảy ra với AI ở Module Requirement (constructionArea
bịa từ landArea, xem Status Report Sprint 3).

---

# 7. Field Requirement còn thiếu để đạt Draft BOQ 60-70%

Đối chiếu Data Model v0.2 hiện tại với dữ liệu 2 file mẫu, các field sau
**chưa có** nhưng cần cho ánh xạ ở mục 5:

| Field còn thiếu | Vì sao cần | Độ ưu tiên |
|---|---|---|
| Số lượng WC theo TỪNG loại (xí bệt/xí xổm, có bồn tắm hay không) | Hiện chỉ có `bathrooms: number` tổng, không phân biệt loại thiết bị → BOQ thiết bị vệ sinh (mục ánh xạ tốt nhất) mất độ chi tiết | Cao |
| Loại cầu thang (thẳng/chữ L/chữ U/xoắn) | Ảnh hưởng trực tiếp số bậc, chiều dài lan can — hiện Requirement không có field nào về cầu thang | Trung bình |
| Có sân/sân vườn diện tích bao nhiêu (không chỉ `garden: boolean`) | File 1 có hẳn nhóm "sân vườn" trong hoàn thiện sàn/tôn nền — hiện Requirement chỉ biết có/không, không biết diện tích | Trung bình |
| Vật liệu hoàn thiện mong muốn (tầm giá gạch/sơn: phổ thông/trung/cao cấp) | Đơn giá vật tư trong cả 2 file chênh lệch lớn theo phân khúc (vd gạch 314k vs 440k/m² trong File 2) — Requirement hiện không có field phân khúc vật liệu | Cao — ảnh hưởng trực tiếp độ chính xác giá |
| Đã có bản vẽ kiến trúc/kết cấu hay chưa (boolean) | Quyết định BOQ ở mức "ước lượng thô" hay "có thể nhập số đo thật" — không phải field mô tả công trình, mà là field TRẠNG THÁI DỰ ÁN | Cao — cần để Mapping Layer biết dùng nhánh (a)/(b) hay (c) ở mục 6 |
| Khoảng cách/vị trí thực tế của công trình so với đường (đã có `site.roadWidth`) nhưng CHƯA có "có tầng hầm hay yêu cầu ép cọc không" một cách tường minh (hiện có `foundationType` nhưng thường "unknown") | Kết cấu móng là hạng mục đắt nhất và khác biệt hoàn toàn giữa các loại móng | Đã ghi nhận trong Data Model Review trước — không lặp lại ở đây |

**Lưu ý:** đây là liệt kê observation, **không phải đề xuất thêm Business
Rule hay Data Model** — đúng theo "Không làm" của ticket. Quyết định có
thêm field nào là của Founder/ChatGPT.

---

# 8. Câu hỏi cần Founder quyết định

1. **Chọn triết lý giá:** Module Estimate đi theo phong cách File 1 (đơn
   giá gộp, đơn giản, khả thi cho MVP) hay cố gắng tiệm cận File 2 (đơn giá
   Nhà nước, cần tích hợp database định mức — quy mô lớn hơn nhiều)?
2. **Ground Truth còn thiếu:** cả 2 file mẫu đều là nhà **mái bằng, không
   tầng hầm, móng cọc**. Nếu Module Estimate cần hỗ trợ nhà mái dốc/có tầng
   hầm/móng khác, cần thêm ví dụ Ground Truth tương ứng — hiện chưa có dữ
   liệu thật để đối chiếu.
3. **Ngưỡng "Draft 60-70%"** nên hiểu là: 60-70% **số dòng hạng mục có mặt**
   (dù nhiều dòng chưa có số đo, đánh dấu "needs_measurement"), hay 60-70%
   **độ chính xác về tiền**? Đây là 2 tiêu chí rất khác nhau — ticket dùng
   chữ "Draft BOQ khoảng 60-70%" nhưng không nói rõ đo trên tiêu chí nào.

---

# 9. Xác nhận phạm vi

- ✅ Chỉ đọc và phân tích 2 file Excel — không chỉnh sửa file gốc.
- ✅ Không viết code, không tạo Prompt, không tạo Excel mới.
- ✅ Không thêm Data Model, không thêm Business Rule.
- **DỪNG LẠI Ở ĐÂY.** Chờ Founder dùng tài liệu này để quyết định hướng
  thiết kế Module Estimate.
