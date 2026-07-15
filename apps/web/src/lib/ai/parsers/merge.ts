import { RequirementSchema, type Requirement } from "@acc/shared-types";
import type { PartialRequirement } from "../schemas/extractor";

/**
 * Gộp requirement mới vào requirement hiện tại (05-Prompt-and-AI-Contract mục 6).
 *
 * Nguyên tắc:
 * - KHÔNG xoá dữ liệu cũ nếu người dùng không thay đổi.
 * - Chỉ ghi đè field mà AI thực sự trích xuất được.
 * - null/undefined từ AI = "không nhắc tới", KHÔNG phải "xoá đi".
 *
 * Đây là business rule nên nằm trong code, không để AI tự quyết định.
 */
export function mergeRequirement(
  current: Requirement,
  incoming: PartialRequirement,
): Requirement {
  const merged: Requirement = {
    project: { ...current.project },
    site: { ...current.site },
    building: { ...current.building },
    household: { ...current.household },
    functional: { ...current.functional },
    budget: { ...current.budget },
    timeline: { ...current.timeline },
    notes: current.notes,
  };

  const groups = [
    "project",
    "site",
    "building",
    "household",
    "functional",
    "budget",
    "timeline",
  ] as const;

  for (const group of groups) {
    const incomingGroup = incoming[group];
    if (!incomingGroup) continue;

    const target = merged[group] as Record<string, unknown>;
    for (const [field, value] of Object.entries(incomingGroup)) {
      // Bỏ qua field AI không nhắc tới -> giữ nguyên giá trị cũ.
      if (value === undefined || value === null) continue;
      target[field] = value;
    }
  }

  if (incoming.notes) merged.notes = incoming.notes;

  // Validate lại lần cuối trước khi trả về / ghi DB.
  return RequirementSchema.parse(merged);
}
