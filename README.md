# AI Construction Copilot — MVP

AI Copilot giúp chủ thầu thu thập, làm rõ và chuẩn hoá yêu cầu khách hàng
(module **AI Project Discovery**). Tài liệu nghiệp vụ nằm trong [documents/](documents/).

## Cấu trúc

```
apps/
  web/            TOÀN BỘ MVP — Next.js fullstack (UI + Route Handler + Prisma + AI)
  api/            NestJS — ĐÓNG BĂNG, backend tương lai (xem apps/api/README.md)
packages/
  shared-types/   Contract Requirement (Zod) + computeScore/computeMissingFields
```

Luồng chạy:

```
Browser → Next.js Route Handler → AIProvider → Prisma → PostgreSQL (Neon)
```

> Thứ tự ưu tiên tài liệu: **01_chatgpt.md > Data Model > UI > Product Spec**.

## Yêu cầu

- Node.js >= 20
- 1 database PostgreSQL trên [Neon](https://neon.tech) (free)
- OpenAI API key — **không bắt buộc**, có thể chạy `AI_PROVIDER=mock`

## Setup (làm 1 lần mỗi máy)

```bash
npm install                 # cài deps + tự build shared-types
copy .env.example .env      # rồi điền DATABASE_URL (Neon)
npm run db:push             # tạo bảng trên Neon
npm run dev                 # http://localhost:3000
```

## Chế độ AI

Đổi trong `.env`:

```bash
AI_PROVIDER="mock"    # chạy UI đầy đủ, KHÔNG gọi OpenAI, không tốn tiền
AI_PROVIDER="openai"  # gọi thật, cần OPENAI_API_KEY hợp lệ
```

`mock` dò từ khoá tiếng Việt bằng regex — đủ để demo UI, độ chính xác thấp
hơn OpenAI. Dùng `openai` khi demo với khách thật.

## API (Route Handlers, same-origin)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/projects` | Danh sách / tạo dự án |
| GET/PATCH/DELETE | `/api/projects/:id` | Chi tiết / đổi tên / xoá |
| GET/POST | `/api/projects/:id/messages` | Hội thoại (lưu, không phân tích) |
| POST | `/api/projects/:id/analyze` | **Luồng chính**: lưu tin nhắn + AI phân tích |

Mọi response theo dạng `{ success, data, message }`.

## Làm việc ở 2 máy (công ty + nhà)

- **Code** đồng bộ qua Git.
- **Database** dùng chung 1 Neon (cùng `DATABASE_URL` ở cả 2 máy).
- File **`.env` KHÔNG commit** — copy tay sang máy kia 1 lần.

## Trạng thái

- [x] Sprint 1 — Monorepo + Prisma + 3 màn layout
- [x] Sprint 2 — Project CRUD + Chat UI lưu hội thoại
- [x] Sprint 3 — Chuyển Next.js fullstack + AI Integration + Requirement Extraction
- [ ] Sprint 4 — Project Brief sinh bằng AI + Polish + Demo

### Hạn chế đã biết

- `livingRoom` / `balcony`: `gpt-5-mini` đôi khi trả `false` thay vì `null`
  cho thông tin khách không nhắc tới. Không ảnh hưởng Requirement Score
  (các field này không nằm trong công thức tính điểm).
- Brief hiện dựng từ Requirement bằng code; bản sinh bằng AI thuộc Sprint 4.
