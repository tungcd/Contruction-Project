import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Đã kết nối database.");
    } catch (err) {
      // Cho phép API vẫn boot khi chưa cấu hình DATABASE_URL (Sprint 1).
      this.logger.warn(
        `Chưa kết nối được database (kiểm tra DATABASE_URL trong .env): ${
          (err as Error).message
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
