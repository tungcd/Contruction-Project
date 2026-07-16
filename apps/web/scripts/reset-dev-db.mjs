/**
 * Reset DB dev — CHỈ xoá dữ liệu khi đủ 4 lớp bảo vệ (Task Approval điều kiện 3).
 *
 * 1. NODE_ENV không phải "production"
 * 2. DATABASE_ENV="development"  (đặt trong .env, đánh dấu đây là DB dev)
 * 3. RESET_DEV_DB="true"          (PHẢI truyền tại thời điểm chạy, KHÔNG để sẵn trong .env)
 * 4. Cờ xác nhận CLI tường minh: --yes
 *
 * Thiếu BẤT KỲ điều kiện nào -> dừng ngay, KHÔNG xoá gì.
 *
 * Giữ nguyên chốt chặn cũ: nếu DB có project KHÔNG nằm trong danh sách seed đã biết
 * (nghĩa là có thể là dữ liệu thật/dữ liệu chưa sao lưu) -> dừng, không xoá mù quáng.
 *
 * Cách chạy (PowerShell, từ apps/web):
 *   $env:RESET_DEV_DB="true"; npx dotenv -e ../../.env -- node scripts/reset-dev-db.mjs --yes
 *
 * Hoặc qua npm script (đã set RESET_DEV_DB trong lệnh, xem package.json):
 *   npm run db:reset:confirm
 */
import { PrismaClient } from "@prisma/client";

/** Tên project được seed tạo ra — KHÔNG phải dữ liệu thật, an toàn để xoá. */
const ALLOWED_SEED_NAMES = ["Anh Hùng - Nhà phố Đan Phượng (Demo)"];

function fail(reason) {
  console.error(`\n[reset-dev-db] TỪ CHỐI CHẠY: ${reason}`);
  console.error("[reset-dev-db] KHÔNG có dữ liệu nào bị xoá.\n");
  process.exit(1);
}

async function main() {
  // --- Lớp 1: NODE_ENV ---
  if (process.env.NODE_ENV === "production") {
    fail('NODE_ENV="production". Script này chỉ chạy trên môi trường dev.');
  }

  // --- Lớp 2: DATABASE_ENV ---
  if (process.env.DATABASE_ENV !== "development") {
    fail(
      'DATABASE_ENV phải là "development" (đặt trong .env). ' +
        `Hiện tại: ${JSON.stringify(process.env.DATABASE_ENV ?? null)}.`,
    );
  }

  // --- Lớp 3: RESET_DEV_DB ---
  if (process.env.RESET_DEV_DB !== "true") {
    fail(
      'Thiếu RESET_DEV_DB="true". Đây là cờ phải TỰ TAY truyền lúc chạy, ' +
        "không được để sẵn trong .env — để tránh reset nhầm.",
    );
  }

  // --- Lớp 4: cờ xác nhận CLI ---
  if (!process.argv.includes("--yes")) {
    fail('Thiếu cờ xác nhận "--yes" trên dòng lệnh.');
  }

  const prisma = new PrismaClient();
  try {
    // --- Chốt chặn: không xoá nếu có project lạ (khả năng là dữ liệu thật) ---
    const projects = await prisma.project.findMany({ select: { id: true, name: true } });
    const unknown = projects.filter((p) => !ALLOWED_SEED_NAMES.includes(p.name));

    if (unknown.length > 0) {
      console.error("\n[reset-dev-db] TỪ CHỐI CHẠY: phát hiện project KHÔNG thuộc danh sách seed:");
      for (const p of unknown) console.error(`  - "${p.name}" (id: ${p.id})`);
      console.error(
        "\nCó thể đây là dữ liệu thật hoặc dữ liệu test chưa được lưu thành fixture.",
      );
      console.error(
        "Nếu chắc chắn muốn xoá: tự tay sao lưu/xoá project đó trước, rồi chạy lại script này.\n",
      );
      process.exit(1);
    }

    console.log("[reset-dev-db] Tất cả điều kiện an toàn đã đạt. Đang xoá dữ liệu dev...");
    // onDelete: Cascade trên Requirement/Conversation/ProjectBrief/History
    // nên xoá Project là đủ dọn sạch toàn bộ.
    const { count } = await prisma.project.deleteMany({});
    console.log(`[reset-dev-db] Đã xoá ${count} project (và toàn bộ dữ liệu liên quan).`);
    console.log("[reset-dev-db] Chạy `npm run db:seed` để tạo lại project demo chuẩn.\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[reset-dev-db] Lỗi không mong muốn:", err);
  process.exit(1);
});
