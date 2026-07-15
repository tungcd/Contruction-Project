import type {
  AnalyzeMessageResult,
  ConversationMessage,
} from "@acc/shared-types";
import { request } from "./http";

export const chatService = {
  listMessages: (projectId: string) =>
    request<ConversationMessage[]>(`/projects/${projectId}/messages`),

  /**
   * Luồng chính của Discovery Chat: gửi tin nhắn và để AI phân tích.
   * OpenAI chỉ được gọi phía server trong Route Handler.
   */
  analyze: (projectId: string, message: string) =>
    request<AnalyzeMessageResult>(`/projects/${projectId}/analyze`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
