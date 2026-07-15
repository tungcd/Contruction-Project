import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * Next.js hot-reload tạo lại module liên tục ở dev — nếu new PrismaClient()
 * mỗi lần sẽ mở quá nhiều connection tới Neon và bị từ chối. Giữ instance
 * trên globalThis để tránh việc đó.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
