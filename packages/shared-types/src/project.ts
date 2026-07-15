import { z } from "zod";
import { RequirementSchema } from "./requirement";

// Trạng thái Project (xem 03-Data-Model mục 5.1)
export const ProjectStatus = z.enum([
  "Discovery",
  "ReadyForBrief",
  "BriefGenerated",
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const MessageRole = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof MessageRole>;

// --- DTO tạo / sửa Project ---
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Tên dự án không được rỗng").max(200),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(50).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// --- DTO gửi tin nhắn vào Discovery Chat (F02) ---
export const CreateMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Nội dung tin nhắn không được rỗng")
    .max(5000, "Tin nhắn quá dài (tối đa 5000 ký tự)"),
});
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;

// --- View models trả về cho FE ---
export interface ConversationMessage {
  id: string;
  role: MessageRole;
  message: string;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  customerName: string | null;
  customerPhone: string | null;
  status: ProjectStatus;
  score: number; // derived
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  requirement: z.infer<typeof RequirementSchema>;
  conversation: ConversationMessage[];
  missingFields: { key: string; label: string }[]; // derived
  questions: string[]; // derived
}
