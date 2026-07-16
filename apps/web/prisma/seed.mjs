/**
 * Seed DB dev với 1 project demo chuẩn (Đan Phượng).
 *
 * Điều kiện 4 (Task Approval): DETERMINISTIC & OFFLINE.
 * - KHÔNG gọi OpenAI ở đây. Requirement lấy nguyên từ fixture đã chuẩn hoá sẵn.
 * - Chỉ validate lại bằng RequirementSchema (Zod), không suy luận gì thêm.
 *
 * Chạy: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { RequirementSchema } from "@acc/shared-types";
import {
  projectInfo,
  conversation,
  requirement,
} from "./seed-fixtures/dan-phuong.mjs";

const prisma = new PrismaClient();

async function main() {
  // Validate fixture đúng Data Model v0.2 trước khi ghi — không sửa gì,
  // chỉ để fail sớm và rõ ràng nếu fixture lệch schema.
  const validated = RequirementSchema.parse(requirement);

  const existing = await prisma.project.findFirst({
    where: { name: projectInfo.name },
  });
  if (existing) {
    console.log(`[seed] Project "${projectInfo.name}" đã tồn tại, bỏ qua.`);
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: projectInfo.name,
      customerName: projectInfo.customerName,
      customerPhone: projectInfo.customerPhone,
      status: "ReadyForBrief",
      requirement: { create: { data: validated } },
      conversations: {
        create: conversation.map((m) => ({ role: m.role, message: m.message })),
      },
      histories: {
        create: [
          { event: "Project Created" },
          { event: "Requirement Updated" },
          { event: "Seeded from fixture (deterministic, offline)" },
        ],
      },
    },
  });

  console.log(`[seed] Đã tạo project demo: ${project.name} (${project.id})`);
}

main()
  .catch((err) => {
    console.error("[seed] Lỗi:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
