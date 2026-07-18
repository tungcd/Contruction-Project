# Frozen Architecture — M4-001 AI Concept Design

**Ngày đóng băng:** 2026-07-18
**Trạng thái:** ĐÃ ĐÓNG BĂNG — chờ kết quả Manual POC trước khi mở
implementation. Không review/redesign/mở rộng scope thêm ở giai đoạn này
(theo đúng quyết định của Founder).
**Nguồn:** Tổng hợp từ 05_Planning → 06_Review#1 → 07_First-Principles →
08_Rule-Engine → 09_Review#4, tất cả trong cùng thư mục ngày này.

**Lưu ý khung diễn đạt (Startup Flexibility Principle, không đổi):**
"Đóng băng" ở đây có cùng ý nghĩa như Data Model v0.2 đã đóng băng trước
đó trong dự án này — là điểm dừng review có chủ đích để bắt tay vào kiểm
chứng thực tế (POC), KHÔNG phải cam kết không bao giờ thay đổi. Nếu Manual
POC phát hiện vấn đề mới, kiến trúc này mở lại được, có ghi nhận lý do —
đúng tiền lệ đã dùng cho Data Model.

---

## Pipeline cuối cùng (9 giai đoạn)

```text
Requirement (đã đóng băng, nguồn sự thật duy nhất)
   │
   ▼
Constraint Set          — deterministic, compile trực tiếp từ Requirement
   │                       (không qua Design Intent Graph — độc lập)
   ▼
Design Intent Graph      — AI (LLM, tier complex), CORE TECHNOLOGY của
   │                       tính năng: Space[] + Relationship[] (đồ thị,
   │                       KHÔNG hình học) + Zone/Privacy + FacadeExposure
   ▼
Geometry                — deterministic, Materialization Strategy (POC/
   │                       MVP: rectangle-subdivision/treemap), thay được
   ▼
Descriptor (Design Language) — deterministic, Descriptor Compiler dùng
   │                       bảng tra cứu cố định, compile ràng buộc PHỦ
   │                       ĐỊNH (vd garage=false) thành sự thật TÍCH CỰC
   │                       (vd "mặt tiền liền mạch, lối vào bộ hành")
   ▼
Prompt                  — deterministic, Prompt Compiler RIÊNG theo từng
   │                       ImageProvider (model-agnostic content → format
   │                       riêng từng model)
   ▼
Exterior                — image model, 1 ảnh/concept
   ▼
Interior (tương lai, không bắt buộc vòng POC đầu) — cùng cơ chế Descriptor/
   │                       Prompt, khác biệt là scope/chi phí, milestone
   │                       riêng sau Exterior
   ▼
Concept Package          — deterministic, đóng gói Strategy + Design
                            Intent Graph (dạng đọc được) + Geometry render
                            + Exterior + giải thích + cost tier
```

**Nhắc lại boundary quan trọng nhất:** Constraint Set đọc THẲNG từ
Requirement, KHÔNG đi qua Design Intent Graph — để không bị AI "quên"
truyền tiếp 1 ràng buộc từ bước này sang bước sau.

**Chỉ 2/9 giai đoạn còn là rủi ro AI cần benchmark liên tục:** Design
Intent Graph (sinh ra) và Exterior/Interior (render ảnh cuối). Mọi giai
đoạn còn lại là deterministic — kiểm tra 1 lần bằng unit test, tin cậy mãi.

---

## Thuật ngữ chính thức (glossary, thay thế mọi tên gọi cũ trong doc 05-08)

| Thuật ngữ | Định nghĩa ngắn | Tên cũ đã thay thế |
|---|---|---|
| **Constraint Set** | Tập ràng buộc cứng compile trực tiếp từ Requirement (mustInclude/mustNotInclude/exactDimensions/exactEnum) | — (mới từ doc 08) |
| **Design Intent Graph** | Đồ thị Space + Relationship do AI sinh — ý đồ thiết kế định tính, KHÔNG hình học | Spatial Layout Model (doc 05-06) |
| **Space** | Node trong Design Intent Graph — rộng hơn "Room", gồm cả hành lang/cầu thang/giếng trời | Room |
| **Relationship** | Cạnh trong đồ thị, có loại: `adjacency`/`connection`/`visualOpenTo`/`sequence` | adjacentTo (doc 06) |
| **Zone** | Nhóm Space theo mức riêng tư: public/semiPrivate/private/service | — |
| **CirculationDepth** | Số bước di chuyển tối thiểu từ cửa chính — tính từ đồ thị `connection`, không phải AI tự khai | — |
| **Geometry / Materialization Strategy** | Thuật toán deterministic biến Design Intent Graph thành toạ độ thật — Treemap chỉ là 1 chiến lược, thay được | — |
| **Descriptor** (Facade/Exterior/Interior) | Dữ liệu có cấu trúc mô tả sự thật hình ảnh cần render — đứng giữa Geometry và Prompt | Prompt Builder (gộp, doc 08) |
| **Descriptor Compiler** | Bước deterministic compile Constraint Set + Design Intent Graph → Descriptor, dùng bảng tra cứu cố định | — |
| **Prompt Compiler** | Bước deterministic, RIÊNG theo từng `ImageProvider`, biến Descriptor → prompt/tham số đúng cú pháp model đó | — |
| **ImageProvider** | Interface tách biệt model ảnh cụ thể (OpenAI Image/Flux/Gemini/Ideogram...), cùng pattern với `AIProvider` đã có trong code | — |

---

## Domain model tối thiểu (không đổi so với doc 05, chỉ đổi tên trường bên trong)

3 bảng: `ConceptSet` (nhiều bản/project, versioned), `Concept` (1 trong 3,
chứa Design Intent Graph + Descriptor + Geometry-render + Exterior image
dạng JSON/base64, KHÔNG normalize Space/Relationship thành bảng riêng),
`ConceptFeedback` (phản hồi khách hàng, append-only).

---

## Bước tiếp theo: Manual POC (Founder tự thực hiện)

Theo đúng checklist đã đưa ở doc 09 — chạy toàn bộ pipeline **bằng tay**
(không code) trên 2-3 Project Brief thật, qua đúng 9 giai đoạn ở trên.
Chuẩn bị trước khi chạy (không phải quyết định kiến trúc):

1. Mở rộng bảng tra cứu Descriptor (garage/balcony đã có ví dụ — thêm
   garden/worshipRoom/storage).
2. Chọn 1 model ảnh duy nhất cho vòng POC này.
3. Chọn 2-3 Project Brief thật có ràng buộc phủ định rõ ràng.

## Sau khi Manual POC đạt chất lượng

Claude bắt đầu implementation theo milestone đã thống nhất (M4-002 trở
đi, xem doc 05 mục F — thứ tự milestone có thể điều chỉnh nhẹ để phản ánh
đúng 9 giai đoạn ở trên, nhưng KHÔNG thay đổi bản chất kiến trúc đã đóng
băng tại tài liệu này).

**Claude sẽ KHÔNG tự ý viết code/schema/migration cho tính năng này cho
tới khi Founder xác nhận kết quả Manual POC đạt yêu cầu.**
