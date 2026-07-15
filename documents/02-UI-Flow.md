# 02. UI Flow

**Project:** AI Construction Copilot\
**Module:** AI Project Discovery (MVP)\
**Version:** v0.1\
**Status:** Draft\
**Goal:** Đặc tả UI đủ rõ để Claude Code dựng giao diện MVP nhanh.

------------------------------------------------------------------------

# 1. Mục tiêu UI

UI của MVP phải giúp người dùng:

1.  Tạo project nhanh.
2.  Nhập yêu cầu khách hàng bằng ngôn ngữ tự nhiên.
3.  Nhìn thấy AI đã hiểu gì.
4.  Biết còn thiếu thông tin gì.
5.  Trả lời câu hỏi bổ sung.
6.  Sinh Project Brief.

Nguyên tắc:

-   Không dùng wizard nhiều bước.
-   Không dùng form dài.
-   Conversation-first.
-   Requirement hiển thị dạng summary dễ đọc.
-   Người dùng không cần hiểu JSON.

------------------------------------------------------------------------

# 2. Tổng quan màn hình MVP

MVP chỉ cần 3 màn chính:

1.  Dashboard / Project List
2.  Project Workspace
3.  Project Brief Preview

Trong đó **Project Workspace** là màn quan trọng nhất.

------------------------------------------------------------------------

# 3. User Flow tổng thể

``` text
User mở app
    ↓
Dashboard
    ↓
Create New Project
    ↓
Project Workspace
    ↓
Nhập mô tả khách hàng
    ↓
AI phân tích
    ↓
Requirement Summary cập nhật
    ↓
AI hỏi thông tin thiếu
    ↓
User trả lời
    ↓
Requirement Score tăng
    ↓
Generate Project Brief
    ↓
Brief Preview
```

------------------------------------------------------------------------

# 4. Screen 01 - Dashboard / Project List

## Mục tiêu

Cho người dùng thấy các project đang làm và tạo project mới.

## Layout

``` text
+--------------------------------------------------+
| AI Construction Copilot                          |
|--------------------------------------------------|
| [+ New Project]                                  |
|                                                  |
| Recent Projects                                  |
|--------------------------------------------------|
| Anh Hùng - Nhà phố Đan Phượng       Score 75%    |
| Chị Lan - Cải tạo nhà              Score 45%     |
| Anh Minh - Nội thất chung cư       Score 90%     |
+--------------------------------------------------+
```

## Components

-   Header
-   New Project Button
-   Project Card List
-   Empty State

## Project Card hiển thị

-   Project name
-   Location
-   Project type
-   Requirement Score
-   Last updated
-   Status

## Empty State

Nếu chưa có project:

``` text
Chưa có project nào.
Tạo project đầu tiên để bắt đầu khai thác yêu cầu khách hàng.
[+ New Project]
```

## Action

Click `+ New Project`:

-   Tạo project rỗng
-   Điều hướng sang Project Workspace

------------------------------------------------------------------------

# 5. Screen 02 - Project Workspace

## Mục tiêu

Đây là màn chính để AI khai thác requirement.

## Layout Desktop

``` text
+--------------------------------------------------------------------------------+
| Project Header: Anh Hùng - Nhà phố Đan Phượng | Score: 72% | Status: Discovery |
+--------------------------------------------------------------------------------+
|                                                                                |
| Left: Conversation                | Middle: Requirement Summary | Right Panel    |
|                                   |                             |                |
| - User message                    | Project Info                | Missing Info   |
| - AI response                     | Site Info                   | Next Questions |
| - AI questions                    | Building Info               | Assumptions    |
|                                   | Functional Needs            | Conflicts      |
|                                   | Budget & Timeline           |                |
|                                                                                |
+--------------------------------------------------------------------------------+
| Prompt Bar: Nhập yêu cầu hoặc trả lời câu hỏi của AI...                         |
+--------------------------------------------------------------------------------+
```

## Layout Mobile

``` text
Header
↓
Score
↓
Tabs:
- Chat
- Requirement
- Missing
- Brief
↓
Prompt Bar
```

------------------------------------------------------------------------

# 6. Project Header

## Hiển thị

-   Project name
-   Project status
-   Requirement Score
-   Last updated
-   Button: Generate Brief

## Status

``` text
Discovery
Ready for Brief
Brief Generated
```

## Score color gợi ý

-   0-49: Chưa đủ
-   50-79: Có thể tư vấn sơ bộ
-   80-100: Sẵn sàng tạo brief

MVP không cần animation phức tạp.

------------------------------------------------------------------------

# 7. Conversation Panel

## Mục tiêu

Nơi người dùng nhập yêu cầu và AI phản hồi.

## Message types

### User Message

``` text
Khách có đất 90m2 ở Đan Phượng, muốn xây nhà 2 tầng...
```

### AI Summary Message

``` text
Mình đã hiểu sơ bộ:
- Nhà phố xây mới
- Đất 90m2
- 2 tầng
- 3 phòng ngủ
- Có sân để ô tô
```

### AI Question Message

``` text
Mình cần hỏi thêm 3 thông tin:
1. Dự kiến xây bao nhiêu m2 mỗi tầng?
2. Muốn báo giá phần thô hay trọn gói?
3. Đường trước nhà rộng khoảng bao nhiêu mét?
```

### System Message

``` text
Requirement updated.
Score: 62% → 78%
```

------------------------------------------------------------------------

# 8. Prompt Bar

## Vị trí

Luôn nằm dưới cùng của Project Workspace.

## Placeholder

``` text
Nhập mô tả dự án, paste tin nhắn khách, hoặc trả lời câu hỏi của AI...
```

## Actions

-   Send message
-   Enter để gửi
-   Shift + Enter để xuống dòng

## Ví dụ input

``` text
Khách muốn xây nhà 2 tầng, đất 90m2, mặt tiền 5m, có mẹ già ở cùng.
```

``` text
Xây khoảng 70m2 mỗi tầng, báo giá trọn gói, đường vào khoảng 4m.
```

------------------------------------------------------------------------

# 9. Requirement Summary Panel

## Mục tiêu

Hiển thị AI đã hiểu gì dưới dạng dễ đọc.

Không hiển thị JSON thô.

## Nhóm thông tin

### Project Info

-   Loại công trình
-   Loại nhà
-   Địa điểm
-   Khách hàng

### Site Info

-   Diện tích đất
-   Diện tích xây dựng
-   Mặt tiền
-   Chiều sâu
-   Đường vào

### Household Info

-   Số người ở
-   Có người già
-   Có trẻ nhỏ
-   Có ô tô

### Building Info

-   Số tầng
-   Loại mái
-   Phong cách
-   Móng dự kiến

### Functional Needs

-   Phòng ngủ
-   WC
-   Phòng khách
-   Bếp
-   Phòng thờ
-   Gara/sân ô tô
-   Kho
-   Ban công

### Scope / Budget / Timeline

-   Phạm vi thi công
-   Nội thất
-   Ngân sách
-   Thời gian khởi công

------------------------------------------------------------------------

# 10. Field Status UI

Mỗi field có trạng thái:

``` text
Unknown
Known
Assumed
Confirmed
```

## Hiển thị gợi ý

``` text
Địa điểm: Đan Phượng ✅
Diện tích xây dựng: Chưa rõ ⚠️
Mái: Mái Nhật 🤖 Giả định
Ngân sách: 1.5 tỷ ✅
```

## Ý nghĩa

-   ✅ Known/Confirmed
-   ⚠️ Missing
-   🤖 Assumed
-   ❗ Conflict

------------------------------------------------------------------------

# 11. Right Panel - Missing / Questions / Assumptions

## Tabs hoặc sections

1.  Missing Info
2.  Next Questions
3.  Assumptions
4.  Conflicts

## Missing Info

Ví dụ:

``` text
Thiếu thông tin:
- Diện tích xây dựng mỗi tầng
- Phạm vi báo giá
- Đường vào công trình
```

## Next Questions

Hiển thị tối đa 3 câu AI muốn hỏi tiếp.

``` text
1. Anh/chị dự kiến xây khoảng bao nhiêu m2 mỗi tầng?
2. Muốn báo giá phần thô, trọn gói hay cả nội thất?
3. Đường trước nhà xe tải vào được không?
```

## Assumptions

``` text
AI đang giả định:
- Đây là nhà phố dân dụng.
- Có sân để ô tô nhưng chưa rõ có gara hay không.
```

## Conflicts

``` text
Mâu thuẫn:
- Khách muốn 3 phòng ngủ nhưng chỉ xây 45m2/tầng và yêu cầu sân ô tô lớn.
```

------------------------------------------------------------------------

# 12. Requirement Score UI

## Vị trí

-   Header
-   Requirement Summary

## Hiển thị

``` text
Requirement Score: 72%
Có thể tư vấn sơ bộ, nhưng chưa đủ để bóc tách khối lượng.
```

## Score level

``` text
0-49%: Thiếu nhiều thông tin
50-79%: Có thể tư vấn sơ bộ
80-100%: Sẵn sàng tạo Project Brief
```

------------------------------------------------------------------------

# 13. Screen 03 - Project Brief Preview

## Mục tiêu

Hiển thị bản tóm tắt dự án để chủ thầu gửi cho KTS/QS hoặc xác nhận lại
với khách.

## Layout

``` text
+--------------------------------------------------+
| Project Brief                                    |
|--------------------------------------------------|
| 1. Tóm tắt dự án                                 |
| 2. Thông tin khu đất                             |
| 3. Nhu cầu sử dụng                               |
| 4. Công năng chính                               |
| 5. Phong cách / vật liệu                         |
| 6. Ngân sách / tiến độ                           |
| 7. Thông tin còn thiếu                           |
| 8. Giả định                                      |
| 9. Bước tiếp theo                                |
|--------------------------------------------------|
| [Copy Markdown] [Regenerate] [Back to Discovery] |
+--------------------------------------------------+
```

## MVP Actions

-   Copy Markdown
-   Regenerate
-   Back to Discovery

Export PDF để sau.

------------------------------------------------------------------------

# 14. Loading States

## Khi AI đang phân tích

``` text
AI đang phân tích yêu cầu...
```

## Khi AI đang tạo câu hỏi

``` text
AI đang xác định thông tin còn thiếu...
```

## Khi AI đang sinh brief

``` text
AI đang tạo Project Brief...
```

------------------------------------------------------------------------

# 15. Error States

## AI lỗi

``` text
AI chưa xử lý được yêu cầu này. Vui lòng thử lại hoặc nhập ngắn hơn.
```

## JSON lỗi

``` text
AI trả về dữ liệu chưa hợp lệ. Hệ thống đang thử phân tích lại.
```

## Không có input

``` text
Bạn hãy nhập mô tả dự án hoặc paste tin nhắn khách hàng.
```

------------------------------------------------------------------------

# 16. Empty States

## Requirement rỗng

``` text
Chưa có requirement.
Hãy nhập mô tả dự án ở thanh bên dưới.
```

## Missing rỗng

``` text
Chưa phát hiện thông tin thiếu.
```

## Conversation rỗng

``` text
Bắt đầu bằng cách mô tả dự án hoặc paste tin nhắn khách hàng.
```

------------------------------------------------------------------------

# 17. MVP Interaction Rules

-   AI không hỏi quá 3 câu/lượt.
-   User có thể trả lời nhiều câu trong một message.
-   Requirement cập nhật sau mỗi message.
-   Score cập nhật sau mỗi lần requirement thay đổi.
-   Brief chỉ nên generate khi Score \>= 70%.
-   Nếu Score \< 70%, vẫn cho generate nhưng cảnh báo "Brief còn thiếu
    thông tin".

------------------------------------------------------------------------

# 18. Demo Scenario

## Input ban đầu

``` text
Khách có đất 90m2 ở Đan Phượng, mặt tiền 5m, muốn xây nhà 2 tầng, 3 phòng ngủ, có 1 phòng ngủ tầng 1 cho mẹ, có sân để ô tô, mái Nhật, phong cách hiện đại, ngân sách khoảng 1.5 tỷ.
```

## Expected UI

Requirement Summary:

``` text
Loại công trình: Xây mới
Loại nhà: Nhà phố
Địa điểm: Đan Phượng
Đất: 90m2
Mặt tiền: 5m
Số tầng: 2
Phòng ngủ: 3
Người già: Có
Phòng ngủ tầng 1: Có
Ô tô: Có
Mái: Mái Nhật
Phong cách: Hiện đại
Ngân sách: 1.5 tỷ
```

Missing Info:

``` text
- Diện tích xây dựng mỗi tầng
- Phạm vi báo giá: phần thô/trọn gói/nội thất
- Đường vào công trình
```

AI Questions:

``` text
1. Dự kiến xây khoảng bao nhiêu m2 mỗi tầng?
2. Anh/chị muốn báo giá phần thô, trọn gói hay cả nội thất?
3. Đường trước nhà rộng khoảng bao nhiêu mét, xe tải vật liệu có vào được không?
```

------------------------------------------------------------------------

# 19. Definition of Done

UI Flow được coi là đủ cho Claude Code khi:

-   Có đủ 3 màn MVP.
-   Có layout rõ.
-   Có component chính.
-   Có trạng thái loading/error/empty.
-   Có rule interaction.
-   Có demo scenario.
-   Có expected UI output.

------------------------------------------------------------------------

# 20. Next Step

Sau UI Flow, tài liệu tiếp theo là:

``` text
03. Data Model
```

Mục tiêu:

-   Requirement JSON
-   Project model
-   Conversation model
-   Brief model
-   Prisma schema draft
