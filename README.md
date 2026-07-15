# AI Construction Copilot — MVP

AI Copilot giúp chủ thầu thu thập, làm rõ và chuẩn hóa yêu cầu khách hàng
(module **AI Project Discovery**). Xem tài liệu nghiệp vụ trong các file `0X-*.md`.

## Cấu trúc (Monorepo — npm workspaces)

```
apps/
  api/            NestJS + Prisma + PostgreSQL (Neon)
  web/            Next.js (App Router) + Tailwind + shadcn-style UI
packages/
  shared-types/   Contract Requirement dùng chung FE/BE (Zod + TS types)
```

> Quy ước: nếu mâu thuẫn tài liệu → **Data Model > UI > Product Spec**.

## Yêu cầu

- Node.js >= 20
- 1 database PostgreSQL trên [Neon](https://neon.tech) (free)
- 1 OpenAI API key

## Setup (làm 1 lần mỗi máy)

```bash
# 1. Cài dependencies cho toàn workspace
npm install

# 2. Tạo file .env từ mẫu, rồi điền DATABASE_URL (Neon) + OPENAI_API_KEY
cp .env.example .env        # Windows PowerShell: copy .env.example .env

# 3. Đẩy schema lên database Neon
npm run db:push

# 4. (tuỳ chọn) Xem dữ liệu bằng Prisma Studio
npm run db:studio
```

## Chạy dev

```bash
npm run dev          # chạy song song api (4000) + web (3000)
# hoặc tách riêng:
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000

## Làm việc ở 2 máy (công ty + nhà)

- **Code** đồng bộ qua Git.
- **Database** dùng chung 1 Neon (cùng `DATABASE_URL` ở cả 2 máy).
- File **`.env` KHÔNG commit** — copy tay sang máy kia 1 lần.

## Trạng thái

- [x] Sprint 1 — Monorepo + Prisma schema + NestJS skeleton + Next.js 3 màn layout
- [ ] Sprint 2 — Project CRUD + Workspace + Chat UI
- [ ] Sprint 3 — AI Integration + Requirement Extraction + Summary
- [ ] Sprint 4 — Missing Detection + Question Engine + Project Brief
