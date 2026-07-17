# apps/api — ĐÓNG BĂNG (không dùng trong MVP)

Thư mục này là bản NestJS từ Sprint 1–2. Theo `chatgpt.md`
(`documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-15/chatgpt.md`), MVP đã
chuyển sang **Next.js fullstack** — toàn bộ feature nằm trong `apps/web`.

## Trạng thái

- ❌ **Không chạy.** Đã gỡ khỏi mọi script (`npm run dev`, `build`, `typecheck`).
- ❌ **Không code thêm gì ở đây.**
- ⚠️ **Có thể không compile.** Nó vẫn import `@acc/shared-types`, mà package đó
  đã tiến hoá theo `apps/web`. Đây là chủ ý — giữ file để tham khảo, không
  phải để build.
- 📁 Prisma schema **đã chuyển** sang `apps/web/prisma/schema.prisma`.

## Vì sao giữ lại

`chatgpt.md` ghi rõ: *"Không cần xoá project NestJS. Giữ nguyên thư mục
`apps/api`. Đây là backend tương lai."*

Sau khi MVP thành công và có phản hồi từ nhà thầu, nếu cần tách backend
riêng thì migrate dần business logic từ `apps/web/src/features` sang đây.

## Muốn xem code hiện hành ở đâu?

| Việc | Vị trí mới |
|---|---|
| Truy cập DB | `apps/web/src/lib/db/prisma.ts` |
| Project CRUD | `apps/web/src/features/project/project.repository.ts` |
| Luồng phân tích AI | `apps/web/src/features/requirement/analyze.service.ts` |
| Endpoint | `apps/web/src/app/api/**/route.ts` |
| AI provider | `apps/web/src/lib/ai/provider/` |
