import { Injectable, NotFoundException } from "@nestjs/common";
import type { ConversationMessage, MessageRole } from "@acc/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Discovery Chat (F02). Conversation chỉ là ngữ cảnh, KHÔNG phải nguồn
 * dữ liệu nghiệp vụ — Requirement mới là Source of Truth (03-Data-Model mục 2).
 */
@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string): Promise<ConversationMessage[]> {
    await this.ensureProjectExists(projectId);
    const rows = await this.prisma.conversation.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toMessage(r));
  }

  /** Lưu tin nhắn của người dùng. Việc gọi AI sẽ bổ sung ở Sprint 3. */
  async addUserMessage(
    projectId: string,
    message: string,
  ): Promise<ConversationMessage> {
    await this.ensureProjectExists(projectId);
    const row = await this.prisma.conversation.create({
      data: { projectId, role: "user", message },
    });
    return this.toMessage(row);
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const count = await this.prisma.project.count({
      where: { id: projectId },
    });
    if (count === 0) throw new NotFoundException("Không tìm thấy dự án");
  }

  private toMessage(row: {
    id: string;
    role: string;
    message: string;
    createdAt: Date;
  }): ConversationMessage {
    return {
      id: row.id,
      role: row.role as MessageRole,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
