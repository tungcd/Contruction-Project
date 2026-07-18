# M4-001 — AI Concept Design Planning

## 1. Project Context

Project: **AI Construction Copilot**

Đây là SaaS hỗ trợ chủ thầu xây dựng dân dụng và nội thất trong giai đoạn presales.

Flow hiện tại:

```text
Khách hàng
→ Hội thoại
→ Requirement
→ Project Brief
→ Estimate Draft
→ Báo giá
```

Phần Requirement và Estimate Draft hiện đã có nền tảng ban đầu.

Milestone tiếp theo là phần AI nặng hơn:

```text
Project Brief
→ AI Concept Design
→ 3 phương án tham khảo
→ Khách hàng lựa chọn/phản hồi
→ Đội kỹ thuật hoàn thiện hồ sơ thật
```

AI Concept Design không thay thế kiến trúc sư, kỹ sư kết cấu hoặc đội triển khai kỹ thuật.

Mục tiêu là giúp khách hàng:

- hình dung căn nhà trước khi ký hợp đồng;
- cảm thấy được tư vấn chuyên nghiệp;
- dễ so sánh các phương án;
- chốt phong cách, công năng và ưu tiên;
- giảm số vòng trao đổi mơ hồ giữa khách hàng và chủ thầu.

---

## 2. Current Objective

Claude chưa cần code ngay.

Nhiệm vụ hiện tại là **planning milestone AI Concept Design**.

Claude cần đọc codebase, tài liệu hiện có, Project Brief schema và flow hiện tại để lập kế hoạch triển khai thực tế cho một solo founder.

Kế hoạch cần đủ chi tiết để sau khi Founder duyệt, có thể chuyển sang implementation theo từng bước nhỏ.

Không tạo kế hoạch quá lý tưởng hoặc phụ thuộc vào một đội AI/kiến trúc lớn.

---

## 3. Product Outcome

Từ một Project Brief, hệ thống tạo ra **3 concept design khác nhau** để khách hàng tham khảo.

Ba concept không được chỉ khác màu sơn hoặc vật liệu trang trí.

Chúng cần thể hiện ba hướng giải quyết khác nhau về:

- bố trí công năng;
- hình khối kiến trúc;
- mặt tiền;
- mức độ đầu tư;
- ưu tiên sử dụng;
- trade-off.

Ví dụ định hướng ban đầu:

### Concept A — Tối ưu chi phí

- hình khối đơn giản;
- dễ thi công;
- hạn chế chi tiết phức tạp;
- ưu tiên công năng và ngân sách.

### Concept B — Cân bằng

- cân bằng công năng, thẩm mỹ và chi phí;
- phù hợp với đa số khách hàng;
- có điểm nhấn vừa phải.

### Concept C — Nổi bật / Premium

- mặt tiền và không gian ấn tượng hơn;
- nhiều điểm nhấn kiến trúc;
- có thể tăng chi phí hoặc độ phức tạp thi công.

Đây chỉ là định hướng hiện tại.

Claude được phép đề xuất cách phân nhóm khác nếu hợp lý hơn với UX và dữ liệu thực tế.

---

## 4. Expected Output Per Concept

Mỗi concept nên được xem là một **gói phương án**, không phải một ảnh rời.

Tối thiểu cần nghiên cứu khả năng tạo:

### 4.1 Concept Summary

- tên phương án;
- ý tưởng chủ đạo;
- đối tượng phù hợp;
- ưu tiên thiết kế;
- mô tả ngắn.

### 4.2 Functional Layout

- phân bổ phòng theo từng tầng;
- mối quan hệ giữa các không gian;
- vị trí tương đối của cầu thang, WC, giếng trời, sân, gara;
- diện tích dự kiến hoặc tỷ lệ tương đối;
- lý do bố trí.

### 4.3 Floor Plan Demo

Mặt bằng concept cho từng tầng, đủ chỉn chu để trình bày với khách hàng.

Có thể thể hiện:

- biên đất;
- khối nhà;
- tên phòng;
- cửa ra vào;
- cửa sổ;
- cầu thang;
- WC;
- ban công;
- sân;
- kích thước chính hoặc tỷ lệ tham khảo;
- hướng tiếp cận giao thông nếu có.

Đây không phải hồ sơ thi công.

Không được thể hiện như một bản vẽ đã đủ điều kiện xây dựng.

### 4.4 Exterior Perspective

Ít nhất một ảnh phối cảnh ngoại thất thể hiện đúng concept:

- số tầng;
- tỷ lệ mặt tiền;
- loại mái;
- phong cách;
- ban công;
- cửa;
- sân;
- vật liệu chính;
- bối cảnh phù hợp.

Cần nghiên cứu cách giữ tính nhất quán giữa:

```text
Project Brief
↔ Functional Layout
↔ Floor Plan Demo
↔ Exterior Perspective
```

### 4.5 Design Explanation

Giải thích bằng ngôn ngữ dễ hiểu:

- vì sao bố trí như vậy;
- phương án giải quyết nhu cầu nào;
- điểm mạnh;
- điểm phải đánh đổi;
- rủi ro hoặc thông tin cần xác minh.

### 4.6 Cost Positioning

Không cần dự toán chính xác trong milestone đầu.

Nhưng mỗi concept nên có vị trí chi phí tương đối:

- thấp;
- trung bình;
- cao;

hoặc một mức chênh lệch tham khảo so với baseline nếu hệ thống có đủ dữ liệu.

Không để AI tự bịa đơn giá hoặc tổng chi phí.

Nếu tích hợp Estimate, số liệu phải đến từ Rule Engine/PriceBook.

---

## 5. Suggested User Flow

Claude cần review và refine flow sau:

```text
Project Brief
→ AI kiểm tra dữ liệu đầu vào
→ Phát hiện thiếu/mâu thuẫn
→ Hỏi bổ sung nếu cần
→ Tạo Design Brief chuẩn hóa
→ Sinh 3 Concept Strategies
→ Sinh Functional Layout cho từng concept
→ Validate layout
→ Sinh Floor Plan Demo
→ Sinh Exterior Perspective
→ Tổng hợp Concept Package
→ Khách hàng so sánh
→ Khách chọn hoặc yêu cầu kết hợp/chỉnh sửa
→ Lưu concept được chọn vào Project Brief
→ Chuyển cho đội kỹ thuật hoàn thiện
```

Cần xác định rõ:

- bước nào dùng LLM;
- bước nào dùng deterministic code;
- bước nào dùng image generation;
- bước nào cần human confirmation;
- bước nào có thể retry;
- bước nào phải STOP nếu thiếu dữ liệu.

---

## 6. AI Responsibilities

AI được phép:

- phân tích Project Brief;
- phát hiện yêu cầu mâu thuẫn;
- đề xuất chiến lược thiết kế;
- tạo Design Brief;
- phân bổ công năng sơ bộ;
- tạo structured layout data;
- viết giải thích;
- tạo prompt cho phối cảnh;
- review tính hợp lý ở mức concept;
- tạo các phương án khác biệt;
- tổng hợp phản hồi của khách hàng;
- tạo phương án kết hợp từ các concept đã có.

AI không được:

- khẳng định thiết kế đủ điều kiện thi công;
- tự quyết định kết cấu;
- tự chọn loại móng mà không có khảo sát;
- tạo hồ sơ kết cấu/MEP hoàn chỉnh;
- cam kết kích thước kỹ thuật chính xác;
- tự bịa quy chuẩn, pháp lý hoặc hiện trạng;
- làm mờ ranh giới giữa concept và hồ sơ kỹ thuật.

---

## 7. Technical Questions Claude Must Answer

Kế hoạch cần trả lời tối thiểu các câu hỏi sau.

### 7.1 Domain Model

Cần những entity nào?

Ví dụ:

- DesignBrief;
- Concept;
- ConceptStrategy;
- FloorLayout;
- Room;
- Relationship;
- FloorPlanAsset;
- PerspectiveAsset;
- ConceptRevision;
- CustomerFeedback.

Không bắt buộc dùng đúng các entity trên.

Claude cần đề xuất model nhỏ nhất đủ dùng.

### 7.2 Structured Output

Floor layout nên được biểu diễn thế nào để:

- LLM dễ sinh;
- code dễ validate;
- UI dễ hiển thị;
- sau này có thể export SVG/DXF;
- không phụ thuộc hoàn toàn vào ảnh AI.

Cần đề xuất JSON schema ở mức planning.

### 7.3 Floor Plan Rendering

So sánh các hướng:

1. LLM sinh prompt rồi image model vẽ mặt bằng.
2. LLM sinh JSON, frontend/backend render SVG.
3. LLM sinh JSON rồi dùng thư viện layout/geometry.
4. Kết hợp deterministic layout và image enhancement.
5. Hướng khác nếu phù hợp hơn.

Cần đánh giá:

- độ chính xác;
- tính nhất quán;
- khả năng chỉnh sửa;
- chi phí;
- tốc độ;
- mức độ phù hợp với solo founder.

### 7.4 Exterior Image Generation

Cần nghiên cứu flow tạo ảnh phối cảnh:

- prompt generation;
- reference consistency;
- seed/versioning nếu có;
- regenerate;
- variation;
- image storage;
- moderation;
- cost tracking;
- retry;
- preserving concept identity.

### 7.5 Validation

Cần có validation nào trước khi render?

Ví dụ:

- số phòng có khớp Project Brief;
- tổng diện tích có hợp lý;
- người già có phòng tầng 1 nếu requirement yêu cầu;
- WC và cầu thang có logic;
- không vượt footprint;
- sân/gara có đủ chỗ;
- không gian không bị trùng;
- concept thực sự khác nhau.

Không cần giải bài toán kiến trúc hoàn chỉnh ngay.

Nhưng phải có minimum validation để tránh output vô lý.

### 7.6 Model Strategy

Đề xuất model routing:

- model nào cho requirement/design reasoning;
- model nào cho structured output;
- model nào cho image generation;
- bước nào dùng model mạnh hơn;
- bước nào dùng model rẻ hơn;
- cách kiểm soát ngân sách khoảng 10 USD/tháng trong giai đoạn test.

Không hard-code quyết định nếu chưa cần.

### 7.7 UX

Claude cần đề xuất màn hình và flow tối thiểu:

- tạo concept;
- trạng thái đang xử lý;
- xem 3 concept;
- so sánh;
- xem từng tầng;
- xem phối cảnh;
- xem ưu/nhược điểm;
- regenerate;
- chọn concept;
- yêu cầu chỉnh sửa;
- kết hợp A/B/C;
- lưu revision;
- chuyển sang Project Brief/Estimate.

### 7.8 Persistence

Cần lưu gì vào database?

Cần lưu gì ở object storage?

Cách version concept, prompt, model và output để có thể debug/reproduce ở mức phù hợp.

### 7.9 Failure Modes

Kế hoạch cần liệt kê các lỗi thực tế:

- ảnh đẹp nhưng sai số tầng;
- mặt bằng và phối cảnh không đồng nhất;
- phòng thiếu/thừa;
- layout không khả thi;
- text trong ảnh sai;
- model tạo 3 phương án gần như giống nhau;
- output thay đổi mạnh khi retry;
- chi phí tăng;
- thời gian chờ dài;
- prompt injection từ nội dung Project Brief;
- khách hàng hiểu nhầm đây là bản vẽ xây dựng.

Với mỗi lỗi chính, cần có cách giảm rủi ro.

---

## 8. MVP Boundary

Claude phải đề xuất phạm vi MVP có thể hoàn thành bởi solo founder.

MVP ưu tiên trải nghiệm:

```text
Project Brief
→ 3 phương án concept chỉn chu
→ khách hàng xem, so sánh và chọn
```

MVP không cần:

- AutoCAD hoàn chỉnh;
- Revit/BIM;
- hồ sơ kết cấu;
- hồ sơ điện nước;
- bản vẽ xin phép;
- hồ sơ thi công;
- mô phỏng kết cấu;
- tự động tuân thủ toàn bộ quy chuẩn;
- editor CAD đầy đủ;
- photorealistic interior cho mọi phòng;
- multi-user collaboration phức tạp.

Claude cần challenge lại nếu một phần trong scope vẫn quá lớn.

---

## 9. Planning Deliverables

Claude cần tạo planning theo cấu trúc sau:

### A. Current Assessment

- codebase hiện có hỗ trợ được gì;
- dữ liệu nào đã có;
- thiếu gì;
- rủi ro lớn nhất.

### B. Recommended MVP

- outcome cụ thể;
- phạm vi;
- ngoài phạm vi;
- lý do.

### C. Architecture Proposal

- flow;
- components;
- AI/model responsibilities;
- storage;
- validation;
- rendering.

### D. Domain/Data Design

- entity;
- structured output;
- relationships;
- versioning.

### E. UX Flow

- màn hình;
- action;
- trạng thái;
- error handling.

### F. Implementation Plan

Chia thành các milestone nhỏ có thể demo độc lập.

Ví dụ tham khảo:

```text
M4-001 Design Brief
M4-002 Concept Strategies
M4-003 Structured Floor Layout
M4-004 Floor Plan Renderer
M4-005 Exterior Perspective
M4-006 Concept Comparison
M4-007 Revision & Feedback
```

Claude được phép đề xuất cách chia khác.

Mỗi milestone cần:

- mục tiêu;
- deliverable;
- dependencies;
- acceptance criteria;
- rủi ro;
- effort tương đối.

### G. Proof of Concept

Đề xuất POC nhỏ nhất để kiểm chứng rủi ro lớn nhất trước khi xây toàn bộ.

POC nên dùng một Project Brief thực tế và tạo đủ 3 concept.

### H. Open Decisions

Những quyết định Founder cần chốt trước implementation.

Không hỏi Founder các quyết định kỹ thuật nhỏ mà Claude có thể tự xử lý.

### I. Recommendation

Đề xuất bước tiếp theo cụ thể sau planning.

---

## 10. Working Mode

Claude đóng vai:

- Product Architect;
- AI Engineer;
- Senior Software Engineer;
- người phản biện sản phẩm.

Claude được phép:

- đọc toàn bộ repository;
- đọc schema;
- đọc prompt;
- đọc tài liệu;
- tìm các integration point;
- đề xuất thay đổi flow;
- challenge scope;
- đề xuất POC.

Trong ticket planning này:

- không triển khai feature production;
- không migration database;
- không refactor lớn;
- không thêm dependency chỉ để thử;
- không tự mở rộng sang CAD/BIM hoàn chỉnh.

Có thể viết pseudo-code, JSON schema nháp và sơ đồ kiến trúc để làm rõ kế hoạch.

---

## 11. Startup Flexibility Principle

Dự án đang ở giai đoạn MVP và khám phá thị trường.

Tất cả nội dung trong tài liệu này là giả thuyết và định hướng hiện tại, không phải quyết định vĩnh viễn.

Mọi thứ đều có thể:

- thay đổi;
- bị loại bỏ;
- đơn giản hóa;
- mở rộng;
- hoặc quay 180 độ.

Claude không được over-engineer để bảo vệ một tương lai giả định.

Ưu tiên:

1. kiểm chứng giá trị với khách hàng;
2. giải quyết rủi ro lớn nhất sớm;
3. tạo output đủ chỉn chu để demo;
4. giữ khả năng sửa hoặc xóa;
5. tránh coupling không cần thiết.

Không được dùng “MVP” làm lý do để tạo output cẩu thả hoặc sai bản chất.

Không được dùng “sau này sẽ scale” làm lý do để xây abstraction chưa cần.

Nếu phát hiện hướng tốt hơn đáng kể so với mô tả trong ticket, Claude phải nêu rõ:

- hướng thay thế;
- trade-off;
- tác động;
- đề xuất của Claude.

---

## 12. Definition of Done for Planning

Planning hoàn thành khi Founder có thể hiểu rõ:

- MVP sẽ tạo ra chính xác những gì;
- 3 concept khác nhau như thế nào;
- dữ liệu đi qua hệ thống ra sao;
- phần nào do LLM, code và image model đảm nhiệm;
- POC đầu tiên cần làm gì;
- những rủi ro nào cần kiểm chứng;
- milestone implementation tiếp theo;
- quyết định nào Founder phải chốt.

Không cần report chung chung.

Kế hoạch phải gắn với codebase và Project Brief hiện tại.
