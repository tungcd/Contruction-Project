# 04. Tech Stack & Coding Convention

**Project:** AI Construction Copilot\
**Version:** v0.2\
**Status:** Updated

> ⚠️ **KIẾN TRÚC ĐÃ THAY ĐỔI.** Từ bản v0.2, MVP dùng **Next.js fullstack**
> (Route Handlers), **KHÔNG dùng NestJS**. Nguồn sự thật về kiến trúc là
> `01_chatgpt.md`. Nếu tài liệu này mâu thuẫn với `01_chatgpt.md`, **`01_chatgpt.md` thắng**.
> Thư mục `apps/api` (NestJS) được giữ lại làm backend tương lai nhưng đã
> đóng băng — không code thêm, không nằm trong luồng chạy.

------------------------------------------------------------------------

# 1. Mục tiêu

Tài liệu này giúp AI Coding (Claude Code) triển khai MVP nhất quán, hạn
chế tự đưa ra quyết định về công nghệ hoặc cấu trúc dự án.

------------------------------------------------------------------------

# 2. Kiến trúc MVP

Monorepo

``` text
apps/
  web/            // TOÀN BỘ MVP (fullstack: UI + Route Handler + Prisma + AI)
  api/            // NestJS - ĐÓNG BĂNG, backend tương lai, không code thêm

packages/
  shared-types/   // Contract Requirement dùng chung
```

Luồng chạy thực tế:

``` text
Browser -> Next.js (Route Handler) -> AIProvider -> Prisma -> PostgreSQL (Neon)
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

-   Next.js Route Handlers (KHÔNG dùng NestJS trong MVP)
-   Prisma
-   PostgreSQL (Neon)

## AI

-   OpenAI Responses API
-   Structured Output
-   Model mặc định: `gpt-5-mini`
-   Bắt buộc hỗ trợ `AI_PROVIDER=mock` để chạy UI không cần API key

------------------------------------------------------------------------

# 4. Quy ước thư mục

## Web (apps/web/src)

``` text
app/          // page, layout, route handler. KHÔNG chứa business logic
components/   // UI tái sử dụng, không chứa logic nghiệp vụ
features/     // business logic từng module (project, chat, requirement, brief)
lib/          // dùng chung
  ai/
    provider/   // AIProvider (interface), OpenAIProvider, MockProvider
    prompts/    // prompt tách riêng, không hardcode trong service
    schemas/    // schema output của AI (Zod)
    parsers/    // merge, normalize
  db/           // Prisma client singleton
services/     // client gọi Route Handler. KHÔNG gọi OpenAI từ đây
```

Quy tắc: OpenAI **chỉ** được gọi phía server (trong Route Handler).

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
