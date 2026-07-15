# 01. Product Spec Lite v2

**Project:** AI Construction Copilot\
**Module:** AI Project Discovery (MVP)\
**Version:** v0.2\
**Status:** Draft (Ready for Implementation)

------------------------------------------------------------------------

# 1. Mục tiêu

Xây dựng một AI Copilot giúp chủ thầu thu thập, làm rõ và chuẩn hóa yêu
cầu khách hàng trước khi thiết kế và bóc tách khối lượng.

## Giá trị mang lại

-   Không bỏ sót requirement.
-   Giảm số lần sửa thiết kế.
-   Chuẩn hóa thông tin giữa Sale → KTS → QS.
-   Tạo đầu vào cho AI Quantity Engine.

------------------------------------------------------------------------

# 2. Pain Point

## Quy trình hiện tại

Khách → Zalo → Khảo sát → Thiết kế → Sửa nhiều lần → Báo giá

## Vấn đề

-   Khách mô tả thiếu hoặc mơ hồ.
-   Chủ thầu quên hỏi thông tin.
-   Thông tin nằm rải rác ở Zalo, điện thoại, ghi chú.
-   KTS và QS phải hỏi lại.
-   Requirement thay đổi nhiều sau khi thiết kế.

## Root Cause

Requirement ban đầu chưa được khai thác và xác nhận đầy đủ.

------------------------------------------------------------------------

# 3. User Persona

## Primary

-   Chủ thầu dân dụng
-   Công ty thiết kế & thi công nhỏ

## Secondary

-   Kiến trúc sư
-   QS

------------------------------------------------------------------------

# 4. MVP Scope

Bao gồm:

-   Project Workspace
-   Discovery Chat
-   Requirement Extraction
-   Missing Detection
-   Question Engine
-   Requirement Summary
-   Requirement Score
-   Project Brief

------------------------------------------------------------------------

# 5. User Flow

1.  Tạo Project.
2.  Paste tin nhắn hoặc nhập yêu cầu.
3.  AI phân tích.
4.  Requirement Summary cập nhật.
5.  AI hỏi thêm thông tin.
6.  User trả lời.
7.  Requirement cập nhật.
8.  Sinh Project Brief.

------------------------------------------------------------------------

# 6. User Stories

## US-01

**Là** chủ thầu

**Tôi muốn** tạo Project mới

**Để** lưu toàn bộ thông tin của một khách hàng.

------------------------------------------------------------------------

## US-02

**Là** chủ thầu

**Tôi muốn** paste đoạn chat Zalo

**Để** AI tự hiểu requirement.

------------------------------------------------------------------------

## US-03

**Là** chủ thầu

**Tôi muốn** AI hỏi tiếp thông tin còn thiếu

**Để** không bỏ sót requirement.

------------------------------------------------------------------------

## US-04

**Là** chủ thầu

**Tôi muốn** xem Requirement Summary

**Để** xác nhận AI đã hiểu đúng.

------------------------------------------------------------------------

## US-05

**Là** chủ thầu

**Tôi muốn** sinh Project Brief

**Để** chuyển cho KTS/QS.

------------------------------------------------------------------------

# 7. Feature List

## F01 Project

-   Create
-   Rename
-   Open Project

## F02 Discovery Chat

-   Chat
-   History
-   Paste hội thoại

## F03 Requirement

-   Extract
-   Merge
-   Summary

## F04 Missing Detection

-   Thiếu dữ liệu
-   Mâu thuẫn
-   Giả định

## F05 Question Engine

-   Sinh tối đa 3 câu hỏi
-   Không hỏi lặp

## F06 Requirement Score

-   Tính mức độ đầy đủ requirement

## F07 Project Brief

-   Generate
-   Regenerate

------------------------------------------------------------------------

# 8. Feature Priority

## P0 (Bắt buộc)

-   Project
-   Workspace
-   Discovery Chat
-   Requirement
-   Missing Detection

## P1 (Nên có)

-   Requirement Score
-   Project Brief

## P2 (Để sau)

-   Export PDF
-   Voice
-   OCR
-   Upload CAD
-   Dark Mode

------------------------------------------------------------------------

# 9. Out of Scope

Không làm trong MVP:

-   BOQ
-   Pricing
-   Proposal
-   ERP
-   Quản lý thi công
-   Multi-user
-   Authentication nâng cao
-   OCR
-   Voice

------------------------------------------------------------------------

# 10. Acceptance Criteria

## F01

Given người dùng mở Dashboard

When chọn "New Project"

Then Project được tạo và chuyển sang Workspace.

------------------------------------------------------------------------

## F02

Given đang ở Workspace

When gửi một message

Then:

-   Message được lưu.
-   AI phản hồi.
-   Requirement được cập nhật.

------------------------------------------------------------------------

## F03

Given AI phân tích thành công

Then Requirement Summary hiển thị dữ liệu đã hiểu.

------------------------------------------------------------------------

## F04

Given Requirement còn thiếu

Then AI sinh tối đa 3 câu hỏi tiếp theo.

------------------------------------------------------------------------

## F05

Given Requirement đủ điều kiện

When chọn Generate Brief

Then sinh Project Brief.

------------------------------------------------------------------------

# 11. Definition of Success

MVP thành công khi một chủ thầu mới có thể:

-   Tạo Project.
-   Paste requirement.
-   Trả lời câu hỏi AI.
-   Có Project Brief.

Trong khoảng dưới 15 phút.

Ngoài ra:

-   Demo được với ít nhất 3 nhà thầu.
-   Thu được phản hồi để cải tiến V2.

------------------------------------------------------------------------

# 12. Development Order

Sprint 1

-   Project
-   Workspace
-   Chat UI

Sprint 2

-   AI Integration
-   Requirement Extraction
-   Requirement Summary

Sprint 3

-   Missing Detection
-   Question Engine
-   Requirement Score

Sprint 4

-   Project Brief
-   Polish UI
-   Demo

------------------------------------------------------------------------

# Ghi chú

Ưu tiên tốc độ ra MVP.

Nếu phải lựa chọn giữa "đẹp" và "demo được", luôn ưu tiên demo được.

Sau khi có phản hồi từ khách hàng thật, Product Spec sẽ được cập nhật
lên V3 dựa trên dữ liệu thực tế.
