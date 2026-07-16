import { z } from "zod";
import { RequirementSchema } from "./requirement";
import type { Readiness } from "./scoring";

/**
 * JSON response thống nhất (xem 04-Tech-Stack mục 5).
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// --- AI: Analyze Message (xem 05-Prompt-and-AI-Contract mục 10) ---
export const AnalyzeMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1),
});
export type AnalyzeMessageInput = z.infer<typeof AnalyzeMessageSchema>;

export interface AnalyzeMessageResult {
  requirement: z.infer<typeof RequirementSchema>;
  missingFields: { key: string; label: string }[];
  /** Derived — không lưu DB (03-Data-Model mục 7). */
  questions: string[];
  /** AI tự suy ra, cần chủ thầu xác nhận. Chỉ có sau mỗi lần phân tích. */
  assumptions: string[];
  /** Câu AI phản hồi lại người dùng, đã lưu vào Conversation. */
  summary: string;
  /** Chỉ hiển thị tiến độ, độc lập với readiness. */
  score: number;
  /** Business rule riêng (chỉ brief ở MVP). */
  readiness: Readiness;
  /** Thông tin cần xác nhận — derived, không lưu DB. */
  toConfirm: { key: string; label: string }[];
}

// --- AI: Requirement Extractor output (xem mục 4) ---
export const ExtractorOutputSchema = z.object({
  requirement: RequirementSchema.partial(),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type ExtractorOutput = z.infer<typeof ExtractorOutputSchema>;

// --- Project Brief ---
export interface ProjectBriefResult {
  id: string;
  projectId: string;
  markdown: string;
  generatedAt: string;
}
