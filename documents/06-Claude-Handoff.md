# 06. Claude Handoff

**Project:** AI Construction Copilot\
**Version:** v0.1\
**Audience:** Claude Code\
**Goal:** Đủ thông tin để bắt đầu triển khai MVP mà không phải đoán
nghiệp vụ.

------------------------------------------------------------------------

# 1. Tổng quan dự án

AI Construction Copilot là sản phẩm hỗ trợ chủ thầu xây dựng ở giai đoạn
Presales.

MVP hiện tại chỉ tập trung vào:

-   Thu thập requirement
-   Chuẩn hóa requirement
-   Phát hiện thông tin còn thiếu
-   Sinh Project Brief

Không triển khai BOQ, Pricing hay Proposal trong giai đoạn này.

------------------------------------------------------------------------

# 2. Mục tiêu MVP

Khi kết thúc MVP, người dùng có thể:

1.  Tạo Project.
2.  Chat với AI.
3.  AI sinh Requirement JSON.
4.  AI hỏi thêm thông tin còn thiếu.
5.  AI sinh Project Brief.

Đây là Definition of Success của MVP.

------------------------------------------------------------------------

# 3. Tài liệu phải đọc theo thứ tự

1.  01-Product-Spec-Lite.md
2.  02-UI-Flow.md
3.  03-Data-Model.md
4.  04-Tech-Stack-and-Coding-Convention.md
5.  05-Prompt-and-AI-Contract.md

Nếu có mâu thuẫn: Data Model \> UI \> Product Spec.

------------------------------------------------------------------------

# 4. Công nghệ

Frontend

-   Next.js App Router
-   TypeScript
-   Tailwind
-   shadcn/ui
-   TanStack Query
-   Zustand

Backend

-   NestJS
-   Prisma
-   PostgreSQL

AI

-   OpenAI
-   Structured Output

------------------------------------------------------------------------

# 5. Thứ tự triển khai

Sprint 1

-   Khởi tạo monorepo
-   Prisma
-   NestJS
-   Next.js
-   UI layout

Sprint 2

-   Project CRUD
-   Workspace
-   Chat UI

Sprint 3

-   AI Integration
-   Requirement Extraction
-   Requirement Summary

Sprint 4

-   Missing Detection
-   Question Engine
-   Project Brief

Không tối ưu sớm. Không thêm tính năng ngoài spec.

------------------------------------------------------------------------

# 6. Quy tắc triển khai

-   Không tự thêm business rule.
-   Không thay đổi Data Model nếu chưa được xác nhận.
-   Không tự đổi UI Flow.
-   Không hard-code prompt trong component.
-   Ưu tiên code đơn giản, dễ đọc.

------------------------------------------------------------------------

# 7. Definition of Done

Mỗi feature chỉ hoàn thành khi:

-   Có UI.
-   Có API.
-   Có validation.
-   Có xử lý lỗi cơ bản.
-   Có thể demo.

------------------------------------------------------------------------

# 8. Không làm trong MVP

-   Authentication phức tạp
-   RBAC
-   Microservice
-   Event Bus
-   Redis
-   Queue
-   Upload CAD
-   OCR
-   Voice
-   BOQ
-   Pricing
-   Proposal

------------------------------------------------------------------------

# 9. Nguyên tắc kiến trúc

-   Modular Monolith.
-   Conversation không phải Source of Truth.
-   Requirement là Source of Truth.
-   Business Rule nằm trong backend.
-   AI chỉ hỗ trợ phân tích.

------------------------------------------------------------------------

# 10. Khi cần quyết định

Ưu tiên:

1.  Đơn giản.
2.  Dễ demo.
3.  Dễ sửa.
4.  Không over-engineering.

Nếu có nhiều lựa chọn, chọn phương án giúp ra demo nhanh nhất.

------------------------------------------------------------------------

# 11. Sau MVP

Sau khi demo và thu feedback:

-   Refactor
-   Chuẩn hóa tài liệu
-   Bổ sung versioning
-   Thiết kế Quantity Engine
-   Thiết kế Pricing Engine

Không làm trước khi có phản hồi từ khách hàng.

------------------------------------------------------------------------

# 12. Handoff Checklist

Claude có thể bắt đầu code khi:

-   [x] Product Spec Lite
-   [x] UI Flow
-   [x] Data Model
-   [x] Tech Stack
-   [x] AI Contract

Output mong muốn:

-   Chạy được local.
-   Có thể tạo Project.
-   Có thể chat.
-   Có Requirement Summary.
-   Có Project Brief.
-   Có demo để gặp nhà thầu.
