# 04. Tech Stack & Coding Convention

**Project:** AI Construction Copilot\
**Version:** v0.1\
**Status:** Draft

------------------------------------------------------------------------

# 1. Mục tiêu

Tài liệu này giúp AI Coding (Claude Code) triển khai MVP nhất quán, hạn
chế tự đưa ra quyết định về công nghệ hoặc cấu trúc dự án.

------------------------------------------------------------------------

# 2. Kiến trúc MVP

Monorepo

``` text
apps/
  web/
  api/

packages/
  shared-types/
  ui/
```

Ưu tiên **Modular Monolith**, chưa tách microservice.

------------------------------------------------------------------------

# 3. Tech Stack

## Frontend

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query
-   Zustand
-   React Hook Form
-   Zod

## Backend

-   NestJS
-   Prisma
-   PostgreSQL

## AI

-   OpenAI Responses API
-   Structured Output
-   Tool Calling

------------------------------------------------------------------------

# 4. Quy ước thư mục

## Web

``` text
app/
components/
features/
hooks/
lib/
services/
types/
```

## API

``` text
src/
  modules/
  common/
  ai/
  prisma/
```

------------------------------------------------------------------------

# 5. API Convention

-   REST API
-   JSON response thống nhất

Ví dụ:

``` json
{
  "success": true,
  "data": {},
  "message": ""
}
```

------------------------------------------------------------------------

# 6. Coding Convention

-   TypeScript strict mode.
-   Không dùng `any` nếu có thể.
-   Tách business logic khỏi controller.
-   Không hard-code prompt trong component UI.
-   Shared types dùng chung giữa frontend/backend.

------------------------------------------------------------------------

# 7. UI Convention

-   Mobile responsive.
-   shadcn/ui là component mặc định.
-   Một màn hình = một feature.
-   Loading, Empty, Error phải có.

------------------------------------------------------------------------

# 8. AI Convention

-   Prompt lưu riêng.
-   Output luôn là JSON có schema.
-   Validate trước khi ghi DB.
-   Không để AI tự quyết định business rule.

------------------------------------------------------------------------

# 9. Database Convention

-   UUID cho primary key.
-   Soft delete để sau, MVP chưa cần.
-   createdAt, updatedAt cho mọi entity.

------------------------------------------------------------------------

# 10. Definition of Done

Claude Code có thể bắt đầu implement mà không cần quyết định lại:

-   Tech stack
-   Cấu trúc thư mục
-   Quy ước API
-   Quy ước coding
-   Quy ước AI
