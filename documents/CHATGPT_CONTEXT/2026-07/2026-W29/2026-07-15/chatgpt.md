# AI Construction Copilot - Architecture Update (MVP)

Sau khi review lại toàn bộ roadmap, mình quyết định thay đổi kiến trúc MVP để tối ưu tốc độ phát triển.

Mục tiêu lớn nhất hiện tại KHÔNG phải kiến trúc đẹp hay scalable.

Mục tiêu là:

> Có một bản demo chạy được càng sớm càng tốt để demo cho nhà thầu và thu thập feedback.

Mọi quyết định kỹ thuật phải phục vụ mục tiêu này.

---

# Thay đổi kiến trúc

## Kiến trúc cũ

Browser

↓

Next.js

↓

NestJS

↓

OpenAI

↓

PostgreSQL

---

## Kiến trúc mới (MVP)

Browser

↓

Next.js (Fullstack)

↓

OpenAI API

↓

Prisma

↓

PostgreSQL

NestJS sẽ KHÔNG được sử dụng trong MVP.

Không cần xoá project NestJS.

Giữ nguyên thư mục `apps/api`.

Chỉ không implement feature nào trong đó.

Toàn bộ feature sẽ được phát triển trong `apps/web`.

---

# Lý do

Giảm:

- REST API nội bộ
- DTO mapping
- Validation 2 lần
- CORS
- 2 server
- 2 deployment
- Duplicate types

Tăng:

- tốc độ phát triển
- tốc độ debug
- tốc độ demo

---

# Monorepo

Giữ nguyên

```
apps/
    api/      // Future Backend (không dùng ở MVP)

    web/      // Toàn bộ MVP

packages/

documents/
```

---

# Apps/API

Không xoá.

Không code thêm.

Đây là backend tương lai.

Sau khi MVP thành công sẽ migrate dần business logic sang đây nếu cần.

---

# Apps/Web

Đây là nơi triển khai toàn bộ MVP.

Cấu trúc mong muốn:

```
src/

app/

components/

features/

lib/

services/

types/
```

---

# app/

Chỉ chứa:

- page
- layout
- route
- loading
- error

Không chứa business logic.

---

# components/

Reusable UI components.

Ví dụ:

```
Button

Card

Input

Dialog

Loading
```

Không chứa logic nghiệp vụ.

---

# features/

Business logic của từng module.

Ví dụ:

```
features/

project/

workspace/

chat/

requirement/

brief/
```

Mỗi feature có thể gồm:

```
components/

hooks/

services/

types/

utils/
```

---

# lib/

Chứa code dùng chung.

```
lib/

ai/

db/

utils/

validation/

constants/
```

---

# AI

Tất cả AI nằm trong

```
lib/ai/
```

Không gọi OpenAI trực tiếp trong React Component.

---

Cấu trúc

```
lib/

ai/

provider/

prompts/

schemas/

parsers/
```

---

## provider

```
AIProvider.ts

OpenAIProvider.ts

MockProvider.ts
```

Claude hãy thiết kế theo interface.

Không để code phụ thuộc trực tiếp OpenAI.

Ví dụ

```ts
interface AIProvider {
  analyzeRequirement();

  generateBrief();
}
```

---

## prompts

```
extract-requirement.ts

generate-brief.ts
```

Prompt phải tách riêng.

Không hardcode trong service.

---

## schemas

Chứa

- Requirement Schema
- AI Output Schema

Sử dụng Zod.

---

## parsers

Các hàm parse riêng.

Ví dụ:

- merge requirement
- validate
- normalize

---

# services/

Service gọi Route Handler.

Ví dụ:

```
project.service.ts

chat.service.ts
```

Không gọi OpenAI từ đây.

OpenAI chỉ được gọi bên server.

---

# AI Route

Next.js Route Handler

Ví dụ

```
app/api/projects/[id]/analyze/route.ts
```

Frontend

↓

Route Handler

↓

OpenAIProvider

↓

Prisma

---

# OpenAI

Sử dụng

OpenAI Responses API

Model mặc định:

gpt-5-mini

---

# Environment

```
OPENAI_API_KEY=

OPENAI_MODEL=gpt-5-mini
```

Không bao giờ expose API Key ra frontend.

---

# Requirement Processing

Flow

```
User Message

↓

OpenAI Extract

↓

Requirement JSON

↓

Merge

↓

Validate

↓

Save

↓

Return UI
```

Chỉ gọi AI một lần cho mỗi message.

Không gọi nhiều lần.

---

# Business Rule

Business Rule không nằm trong AI.

Business Rule nằm trong code.

Ví dụ:

Requirement Score

↓

Code

Missing Fields

↓

Code

Brief Ready

↓

Code

Merge Requirement

↓

Code

AI chỉ:

- Extract
- Summary
- Generate Brief

---

# Mock Mode

Phải hỗ trợ

```
AI_PROVIDER=mock
```

Khi đó

UI vẫn chạy

Không gọi OpenAI.

---

# Coding Principles

Ưu tiên:

1. Đơn giản

2. Có thể demo

3. Dễ sửa

Không over-engineering.

Không thêm feature ngoài Product Spec.

Không tối ưu sớm.

---

# MVP Goal

Một người chưa từng dùng hệ thống có thể:

- tạo Project
- chat với AI
- AI sinh Requirement
- AI hỏi tiếp
- sinh Project Brief

trong khoảng dưới 15 phút.

Đó là mục tiêu duy nhất của MVP.

Mọi quyết định kỹ thuật phải phục vụ mục tiêu này.
