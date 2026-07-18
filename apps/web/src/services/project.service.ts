import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  Requirement,
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

  /** Concept Drawing Stage 1 — bắt buộc trước khi Constraint Set Compiler chạy được. */
  confirmRequirement: (id: string) =>
    request<Requirement>(`/projects/${id}/confirm-requirement`, { method: "POST" }),
};
