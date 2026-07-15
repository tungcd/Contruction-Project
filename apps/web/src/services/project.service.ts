import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  UpdateProjectInput,
} from "@acc/shared-types";
import { request } from "./http";

export const projectService = {
  list: () => request<ProjectSummary[]>("/projects"),

  get: (id: string) => request<ProjectDetail>(`/projects/${id}`),

  create: (input: CreateProjectInput) =>
    request<ProjectDetail>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateProjectInput) =>
    request<ProjectDetail>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),
};
