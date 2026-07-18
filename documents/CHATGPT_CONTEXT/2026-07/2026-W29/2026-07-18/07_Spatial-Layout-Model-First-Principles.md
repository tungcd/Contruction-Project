# M4-001 Follow-up #2 — Spatial Layout Model: First-Principles Review

**Ngày:** 2026-07-18
**Phạm vi:** Thuần domain/kiến trúc — không schema, không database, không
code, không migration, không API, không UI.
**Vai trò được yêu cầu:** Domain Architect / AI Research Engineer /
Computational Design Engineer — không phải Fullstack Developer.

---

## Kết luận ngắn gọn trước, chi tiết ở dưới

Founder đúng: **core technology không phải "AI vẽ ảnh/SVG/mặt bằng"**.
Core technology là: **một mô hình đồ thị không gian (spatial graph)** mà
AI có khả năng sinh ra một cách đáng tin cậy từ Requirement — trong đó
**Room không phải entity trung tâm, mà là 1 loại node trong 1 đồ thị quan
hệ (Space + Relationship)**. Hình học/rectangle/SVG chỉ là MỘT trong nhiều
cách "vật chất hoá" (materialize) đồ thị đó — Treemap là một chiến lược vật
chất hoá tạm thời, thay được, không phải nền tảng.

Chi tiết đầy đủ ở các mục A-E.

---

## A. Spatial Layout Model gồm những thành phần nào?

Đây là lý thuyết đã tồn tại trong ngành kiến trúc — không cần phát minh
mới. Lĩnh vực **Space Syntax** (Bill Hillier, giáo sư UCL, thập niên 1980s
tới nay — vẫn là nền tảng học thuật chính thống của phân tích không gian
kiến trúc) mô hình hoá công trình bằng đúng cách Founder đang trực giác
hướng tới: **không phải danh sách phòng, mà là cấu hình quan hệ giữa các
phòng.** Đề xuất áp dụng có chọn lọc (không bê nguyên lý thuyết học thuật,
chỉ lấy phần dùng được):

| Thành phần | Định nghĩa | Vì sao cần |
|---|---|---|
| **Space** | Đơn vị không gian atomic — KHÔNG dùng từ "Room" (xem mục B) vì bao gồm cả hành lang/cầu thang/giếng trời/hiên — những thứ không phải "phòng" theo nghĩa thông thường nhưng vẫn là node trong đồ thị | Đơn vị nền tảng |
| **SpaceType** | Phân loại Space: nhóm "chính" (living/bedroom/kitchen/wc/dining) vs nhóm "phục vụ" (staircase/corridor/storage/mechanical/void) — tương đương khái niệm kiến trúc "served vs servant space" (Louis Kahn) | AI cần biết loại nào là "servant" để không đối xử ngang hàng với phòng chính khi phân bổ diện tích |
| **Relationship** | Cạnh trong đồ thị, CÓ PHÂN LOẠI (xem bảng dưới) — đây là phần **quan trọng hơn bản thân Space** | Trả lời câu hỏi B |
| **Zone** | Nhóm Space theo mức riêng tư: `public` (khách/tiếp khách), `semiPrivate` (sinh hoạt chung/bếp ăn), `private` (ngủ/nghỉ), `service` (kho/kỹ thuật/giặt phơi) | Tương đương khái niệm "privacy gradient" trong Space Syntax — vừa là công cụ AI suy luận, vừa là rule kiểm tra (vd phòng ngủ không nên nằm zone `public`) |
| **Cluster** *(tuỳ chọn, không bắt buộc dùng ngay)* | Nhóm Space lặp lại được thành 1 "module" — vd "cụm ngủ" = 1 phòng ngủ + 1 WC riêng liền kề | Trả lời câu hỏi B (gần "Module" Founder gợi ý) — hữu ích khi 1 concept có nhiều phòng ngủ giống khuôn mẫu, và là bước đệm tự nhiên hướng tới BIM (Revit dùng đúng khái niệm "family"/module lặp lại) |
| **FacadeExposure** | Mỗi Space có thể gắn 0-nhiều mặt tiếp xúc biên công trình: `front`/`rear`/`left`/`right`/`none`, kèm có cửa sổ hay không | Cầu nối trực tiếp tới Exterior Prompt — không cần suy ngược từ hình học |
| **CirculationDepth** *(derived, không phải input AI — TÍNH RA từ đồ thị Connection)* | Số bước di chuyển tối thiểu từ điểm vào (cửa chính) tới 1 Space | Đây là con số **Space Syntax** dùng để đo "riêng tư" một cách khách quan — có thể dùng làm rule validate thay vì chỉ dựa vào Zone do AI tự gán (kiểm tra chéo 2 nguồn) |

### Các loại `Relationship` (trả lời trực tiếp gợi ý "Connection, Hierarchy, Zone, Privacy, Circulation, Relationship, Lighting, Facade")

| Loại quan hệ | Ý nghĩa | Khác gì so với loại còn lại |
|---|---|---|
| `adjacency` | Ở cạnh nhau (chung tường), CHƯA CHẮC có thể đi qua lại | Yếu nhất — chỉ là vị trí tương đối |
| `connection` | Có cửa/lối mở — đi lại được | Đây mới là cạnh dùng để tính `CirculationDepth`, KHÔNG phải `adjacency` |
| `visualOpenTo` | Mở ra không gian ngoài (sân/ban công/giếng trời/void) — không phải quan hệ giữa 2 Space trong nhà mà giữa Space và "bên ngoài" | Phục vụ Exterior (khối nào có khoảng mở) và Lighting (Space nào có sáng tự nhiên) |
| `sequence` *(tuỳ chọn)* | Gợi ý thứ tự trải nghiệm (vd "vào nhà → phòng khách → bếp ăn") | Chỉ cần khi muốn mô tả "luồng di chuyển" tường minh hơn là suy từ `connection` |

**Về Lighting/Facade riêng:** Requirement hiện tại (Data Model v0.2 đã đóng
băng) KHÔNG có field hướng nhà/hướng nắng — đây là khoảng trống dữ liệu
thật (không phải lỗi thiết kế Spatial Layout Model). Ở mức hiện tại, chỉ
suy được "Space nào tiếp xúc mặt tiền" (từ `FacadeExposure`), CHƯA suy
được hướng nắng thật (cần thêm hướng nhà vào Requirement — ngoài phạm vi
review này, nêu ra để Founder biết đây là giới hạn dữ liệu đầu vào, không
phải giới hạn mô hình).

---

## B. Room có phải entity trung tâm không?

**Không.** Và cũng không phải bất kỳ danh từ đơn lẻ nào khác (Space,
Activity, Flow, Module) là "trung tâm" theo nghĩa đứng một mình có ý
nghĩa. Đây chính là luận điểm cốt lõi của Space Syntax mà tôi muốn nêu rõ:

> Một Space đứng riêng lẻ gần như không có ý nghĩa thiết kế. Cái quyết
> định một layout "tốt" hay "tệ" hoàn toàn nằm ở **quan hệ giữa các
> Space** — phòng khách rộng 24m² không nói lên điều gì nếu không biết nó
> có gần cửa chính không, có nhìn ra sân không, có bị đi xuyên qua để tới
> phòng khác không.

Vì vậy câu trả lời chính xác cho câu hỏi B là: **entity trung tâm là bản
thân CÁI ĐỒ THỊ (Space + Relationship cùng nhau), không phải một loại node
nào riêng lẻ.** `Zone`/`Cluster`/`CirculationDepth` không phải các entity
độc lập cạnh tranh vị trí trung tâm với Space — chúng là **những cách nhìn
khác nhau (view) được TÍNH RA từ cùng 1 đồ thị**, đúng tinh thần "mọi thứ
là view của 1 nguồn" mà Founder đã đặt ra ở ticket gốc.

---

## C. Ranh giới AI vs Deterministic Engine ("Rule Engine của thiết kế")

Đối chiếu trực tiếp với Estimate Rule Engine đã xây (đây đúng là mô hình
tương tự, Founder gọi tên chính xác):

| | Estimate Engine (đã có) | Spatial Layout Engine (đang thiết kế) |
|---|---|---|
| AI làm gì | Không làm gì — 100% deterministic | Gán Space + SpaceType + Zone + Relationship + trọng số diện tích tương đối + FacadeExposure. **CHỈ VẬY.** AI KHÔNG BAO GIỜ sinh toạ độ/hình học/SVG |
| Deterministic làm gì | Toàn bộ Rule Catalog + PriceBook lookup | (1) Validate đồ thị (mục dưới), (2) tính `CirculationDepth` từ `connection` graph, (3) chạy 1 "Materialization Strategy" (mục D) ra hình học, (4) render (SVG/text/prompt) |
| Input cố định | Requirement (đóng băng) | Requirement (đóng băng) — Spatial Layout Model KHÔNG sửa Requirement, giống EstimateSettings tách riêng |
| Output | BOQDraftLine[] | Design Intent Graph (Space[] + Relationship[]) |

**Validate đồ thị (deterministic, không AI):**
- Số lượng Space theo `SpaceType=bedroom`/`wc` khớp `Requirement.functional`.
- Tổng trọng số diện tích không vượt `totalFloorArea`/`buildingFootprint`.
- Đồ thị `connection` phải LIÊN THÔNG (mọi Space đều có đường đi tới cửa
  chính qua các cạnh `connection` — không có phòng "cô lập" không vào
  được).
- `hasElderly=true` → tồn tại ít nhất 1 Space `bedroom` ở tầng 1 với
  `CirculationDepth` thấp (gần cửa chính) — dùng đúng độ đo Space Syntax
  thay vì chỉ dựa vào Zone tự khai của AI (kiểm tra chéo, đáng tin hơn).
- Vị trí Zone của cầu thang (`staircase`) nhất quán giữa các tầng.
- 3 concept phải khác nhau thật (so `Zone` phân bổ + `SpaceType` trọng số
  + cost tier).

Đây chính xác là **boundary Founder hỏi ở câu C**: AI đóng vai "kiến trúc
sư đưa ý tưởng", Deterministic Engine đóng vai "kỹ sư kiểm tra tính khả
thi + vẽ ra bản vẽ" — không bao giờ đảo ngược vai trò.

---

## D. Vì sao Treemap KHÔNG nên là nền tảng lâu dài (và nên thay bằng gì)

Founder nói đúng, và bản thân tôi cũng không định đề xuất Treemap là nền
tảng — nó chỉ nên là **1 "Materialization Strategy"** (chiến lược vật chất
hoá đồ thị thành hình học), là lớp NẰM DƯỚI Spatial Layout Model, hoàn
toàn thay thế được mà không đổi 1 dòng nào của đồ thị phía trên. Đề xuất 3
chiến lược có thể thay nhau theo thời gian (không cần chọn ngay, chỉ cần
kiến trúc KHÔNG khoá cứng vào 1 chiến lược):

1. **Treemap/rectangle-subdivision** (đã đề xuất ở review trước) — nhanh,
   rẻ, đủ dùng cho POC + MVP đầu, giới hạn ở footprint hình chữ nhật đơn
   giản.
2. **Constraint-based layout solver** (vd simulated annealing/force-
   directed, tối ưu theo ràng buộc diện tích + adjacency + tỷ lệ khung
   hình) — linh hoạt hơn cho footprint không đều (biệt thự hình L...),
   effort cao hơn nhiều, làm sau khi Treemap chứng minh giá trị.
3. **Pattern/template matching** — xây 1 thư viện các "khuôn mẫu mặt bằng
   nhà phố Việt Nam" đã biết tốt (từ kinh nghiệm thực tế chủ thầu, không
   phải AI bịa), khớp theo "chữ ký" (số phòng + Zone signature) rồi tinh
   chỉnh cục bộ — tiềm năng chất lượng cao nhất vì dựa trên layout THẬT
   đã kiểm chứng, đây là hướng tự nhiên để tiến tới sau này (thậm chí có
   thể học từ dữ liệu project thật tích luỹ dần — nhưng đó là chuyện rất
   xa, không phải quyết định bây giờ).

Điểm mấu chốt trả lời câu D: **Design Intent Graph (Space+Relationship)
không được phép biết/phụ thuộc vào việc nó sẽ bị vật chất hoá bằng chiến
lược nào.** Đây là ranh giới kiến trúc quan trọng nhất của toàn bộ tài
liệu này.

---

## E. Nếu thiết kế lại từ đầu — kiến trúc 3 lớp

Bỏ qua toàn bộ planning trước, tư duy first-principles:

```text
┌─────────────────────────────────────────────────────────┐
│ LỚP 1 — DESIGN INTENT (AI sinh ra — đây là "core         │
│ technology" thật sự của sản phẩm)                        │
│                                                           │
│   Space[] + Relationship[] + Zone + FacadeExposure +     │
│   trọng số diện tích tương đối                            │
│                                                           │
│   = MỘT ĐỒ THỊ, không phải hình học, không phải ảnh      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (deterministic, thay được, KHÔNG AI)
┌─────────────────────────────────────────────────────────┐
│ LỚP 2 — MATERIALIZATION (tính toán thuần)                 │
│                                                           │
│  - Validate đồ thị (mục C)                                │
│  - CirculationDepth (tính từ connection graph)            │
│  - Geometry (1 trong 3 chiến lược mục D — Treemap trước)  │
│  - MassingProfile (tóm tắt khối/mặt tiền cho Exterior)     │
│  - RoomDescriptions (tóm tắt từng Space cho Interior/text) │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (thuần cơ học, không có logic nghiệp vụ)
┌─────────────────────────────────────────────────────────┐
│ LỚP 3 — PRESENTATION (render ra định dạng cụ thể)          │
│                                                           │
│  SVG Floor Plan │ Prompt ảnh Exterior/Interior │           │
│  Text/Markdown Summary │ (tương lai) DXF/IFC export        │
└─────────────────────────────────────────────────────────┘
```

**Vì sao đây là "core technology" đúng nghĩa (trả lời câu hỏi mở đầu của
Founder):** Lớp 1 là phần khó nhất, có giá trị nhất, và ĐỘC NHẤT — không
ai khác dễ dàng copy được (đòi hỏi hiểu đúng cách chủ thầu Việt Nam tổ
chức không gian nhà phố + prompt engineering đúng). Lớp 2 và 3 là kỹ thuật
thuần tuý, thay thế được, không phải lợi thế cạnh tranh — ảnh đẹp/SVG đẹp
ai cũng làm được nếu có đúng dữ liệu đầu vào (Lớp 1). Điều này khớp hoàn
toàn với trực giác ban đầu của Founder ("core technology KHÔNG PHẢI AI tạo
ảnh/SVG").

### Vì sao kiến trúc này "không khoá" tương lai CAD/BIM (trả lời ràng buộc ở challenge #3)

BIM có chuẩn trao đổi dữ liệu thật gọi là **IFC** (Industry Foundation
Classes) — về bản chất IFC cũng là 1 đồ thị không gian có phân loại
(IfcSpace, IfcRelConnectsSpaces...) rất gần với Lớp 1 ở trên. Nghĩa là:
nếu Lớp 1 được thiết kế đúng (Space có type/zone/relationship rõ ràng),
việc thêm 1 "Presentation" mới ở Lớp 3 xuất ra định dạng gần IFC/DXF là
MỞ RỘNG, không phải viết lại — đúng yêu cầu "không khoá kiến trúc" của
Founder.

### Xác nhận ý tưởng #5 của Founder (chỉnh sửa qua hội thoại thay vì generate lại từ đầu)

Kiến trúc 3 lớp này **cho phép trực tiếp** đúng luồng Founder hình dung:

```text
Requirement → Design Intent Graph (Lớp 1)
   → AI Conversation ("đổi bếp sang bên trái", "phòng ngủ 2 nhỏ lại")
   → PATCH trực tiếp vào đồ thị (chỉ sửa đúng Space/Relationship liên quan)
   → chạy lại Lớp 2 + Lớp 3 (nhanh, thuần tính toán, KHÔNG gọi lại AI cho
     toàn bộ concept)
```

Đây là hệ quả TỰ NHIÊN của việc tách 3 lớp rõ ràng — không cần thiết kế gì
thêm để có được khả năng này, nó "miễn phí" đi kèm nếu Lớp 1 được định
nghĩa đúng làm đối tượng có thể địa chỉ hoá (addressable) và patch được.
Đây là bằng chứng gián tiếp cho thấy kiến trúc 3 lớp là hướng đúng.

---

## Cập nhật thực tế: mô hình JSON minh hoạ Lớp 1 (không phải schema — chỉ ví dụ vocabulary)

```json
{
  "spaces": [
    {
      "id": "living_room",
      "type": "living_room",
      "zone": "public",
      "areaWeight": 1.3,
      "facadeExposure": ["front"],
      "note": "Không gian tiếp khách chính"
    },
    {
      "id": "staircase",
      "type": "staircase",
      "zone": "service",
      "areaWeight": 0.4,
      "facadeExposure": [],
      "note": "Vị trí giữ nguyên mọi tầng"
    }
  ],
  "relationships": [
    { "type": "connection", "from": "entrance", "to": "living_room" },
    { "type": "connection", "from": "living_room", "to": "staircase" },
    { "type": "visualOpenTo", "from": "living_room", "to": "exterior_front_yard" }
  ]
}
```

So với bản "zone/areaWeight/adjacentTo" ở review trước: khác biệt cốt lõi
là **`relationships` tách riêng khỏi `spaces`** (đồ thị tường minh, không
nhét quan hệ vào field con của từng phòng) và **phân loại quan hệ rõ ràng**
(`connection` khác `adjacency` khác `visualOpenTo`) — đây chính là thay
đổi phản ánh đúng góp ý "đừng nghĩ Room→Rectangle, hãy nghĩ đồ thị quan hệ"
của Founder.

---

## Trả lời còn lại các câu hỏi Founder nêu

- **Câu A, B, C, D, E:** đã trả lời đầy đủ ở các mục tương ứng phía trên.
- **Challenge #4 (AI không sinh SVG, chỉ sinh ý tưởng):** đã là đúng thiết
  kế Lớp 1/2/3 — AI dừng lại ở Lớp 1.
- **Challenge #1 (không nghĩ về Floor Plan nữa, nghĩ về Spatial Layout
  Model):** đồng ý hoàn toàn — Floor Plan giờ chỉ là 1 sản phẩm đầu ra của
  Lớp 3, không còn là trọng tâm thiết kế.

---

## Recommendation

Kiến trúc 3 lớp này **thay thế** (không phải bổ sung) phần "Floor Plan"
của 2 tài liệu review trước — Lớp 1 (Design Intent Graph) chính là bản
nâng cấp của "Spatial Layout Model", Lớp 2/3 gồm cả Layout Optimizer +
Renderer đã đề cập trước, cộng thêm Prompt Builder giờ đọc từ đúng
`relationships[]` tường minh thay vì suy ngầm từ `adjacentTo`.

POC (đã đề xuất ở 2 tài liệu trước) **không đổi mục tiêu**, chỉ đổi
"hình dạng" dữ liệu cần AI sinh ra: thay vì yêu cầu AI trả lời JSON có
`zone`/`adjacentTo` lồng trong từng phòng, yêu cầu AI trả lời đúng 2 mảng
tách biệt `spaces[]` + `relationships[]` như ví dụ trên — đây là thay đổi
nhỏ về prompt, không thay đổi effort/ngân sách POC đã đề xuất (≤2 USD).

Không có thay đổi nào ở đây làm phình to phạm vi MVP đã thống nhất — đây
là làm ĐÚNG mô hình dữ liệu trước khi build, không phải thêm việc mới.
