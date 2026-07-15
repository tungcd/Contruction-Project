import type {
  ApiResponse,
  ConversationMessage,
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  UpdateProjectInput,
} from "@acc/shared-types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body || !body.success) {
    throw new Error(body?.message || `Lỗi API (${res.status})`);
  }
  return body.data as T;
}

export const api = {
  listProjects: () => request<ProjectSummary[]>("/projects"),
  getProject: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  createProject: (input: CreateProjectInput) =>
    request<ProjectDetail>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateProject: (id: string, input: UpdateProjectInput) =>
    request<ProjectDetail>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteProject: (id: string) =>
    request<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),

  // --- Discovery Chat (F02) ---
  listMessages: (projectId: string) =>
    request<ConversationMessage[]>(`/projects/${projectId}/messages`),
  sendMessage: (projectId: string, message: string) =>
    request<ConversationMessage>(`/projects/${projectId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
