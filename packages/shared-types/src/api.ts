import { z } from "zod";
import { RequirementSchema } from "./requirement";

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
  questions: string[];
  score: number;
  briefReady: boolean;
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
