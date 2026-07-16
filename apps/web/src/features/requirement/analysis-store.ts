import { create } from "zustand";

/**
 * Giả định (assumptions) là output của AI ở bước analyze, KHÔNG nằm trong
 * Requirement đã đóng băng nên không có chỗ lưu DB. Giữ tạm ở client store
 * (per project) để mang từ Workspace sang trang Brief trong cùng phiên demo.
 *
 * Đây là dữ liệu dẫn xuất, phù hợp luồng demo liên tục (chat -> generate ->
 * đọc brief) trong Definition of Done. Hard refresh sẽ mất — trang Brief xử
 * lý mềm bằng cách hiện "chưa có giả định trong phiên này".
 */
interface AnalysisState {
  assumptionsByProject: Record<string, string[]>;
  setAssumptions: (projectId: string, assumptions: string[]) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  assumptionsByProject: {},
  setAssumptions: (projectId, assumptions) =>
    set((s) => ({
      assumptionsByProject: {
        ...s.assumptionsByProject,
        [projectId]: assumptions,
      },
    })),
}));

/** Selector tiện dụng: lấy assumptions của một project (mảng rỗng nếu chưa có). */
export function useAssumptions(projectId: string): string[] {
  return useAnalysisStore((s) => s.assumptionsByProject[projectId] ?? []);
}
