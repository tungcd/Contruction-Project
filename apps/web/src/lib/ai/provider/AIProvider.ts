import type { Requirement } from "@acc/shared-types";
import type { ExtractResult } from "../schemas/extractor";

/**
 * Interface cho mọi AI provider. Code nghiệp vụ chỉ phụ thuộc vào đây,
 * KHÔNG phụ thuộc trực tiếp OpenAI — để đổi provider hoặc chạy mock mà
 * không phải sửa business logic.
 */
export interface AIProvider {
  readonly name: string;

  /**
   * Đọc tin nhắn mới trong ngữ cảnh requirement hiện tại, trích xuất
   * thông tin. Chỉ gọi 1 lần cho mỗi message.
   */
  analyzeRequirement(input: AnalyzeInput): Promise<ExtractResult>;

  /** Sinh Project Brief dạng Markdown từ Requirement. */
  generateBrief(input: GenerateBriefInput): Promise<string>;
}

export interface AnalyzeInput {
  /** Requirement đang có (ngữ cảnh để AI không hỏi lại thứ đã biết). */
  current: Requirement;
  /** Tin nhắn mới của người dùng. */
  message: string;
  /** Các câu AI đã hỏi trước đó — tránh hỏi lặp (05 mục 8). */
  askedQuestions: string[];
}

export interface GenerateBriefInput {
  projectName: string;
  requirement: Requirement;
  missingFields: { key: string; label: string }[];
}

/** AI trả dữ liệu không hợp lệ sau khi đã retry. */
export class AIInvalidOutputError extends Error {
  constructor(message = "AI trả về dữ liệu chưa hợp lệ.") {
    super(message);
  }
}
