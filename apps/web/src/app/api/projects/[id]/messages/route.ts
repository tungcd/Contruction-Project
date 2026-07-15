import type { NextRequest } from "next/server";
import { CreateMessageSchema } from "@acc/shared-types";
import { assertUuid, handle, ok } from "@/lib/http";
import { prisma } from "@/lib/db/prisma";
import { sanitizeText } from "@/lib/ai/parsers/normalize";
import { ensureProjectExists } from "@/features/project/project.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const projectId = assertUuid(id);
    await ensureProjectExists(projectId);

    const rows = await prisma.conversation.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
    return ok(
      rows.map((r) => ({
        id: r.id,
        role: r.role,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  });
}

/**
 * Lưu tin nhắn KHÔNG kèm phân tích AI.
 * Luồng chính của Discovery Chat là POST /analyze.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const projectId = assertUuid(id);
    await ensureProjectExists(projectId);

    const { message } = CreateMessageSchema.parse(await req.json());
    const row = await prisma.conversation.create({
      // Postgres không lưu được ký tự NULL trong text (lỗi 22P05).
      data: { projectId, role: "user", message: sanitizeText(message) },
    });
    return ok({
      id: row.id,
      role: row.role,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    });
  });
}
