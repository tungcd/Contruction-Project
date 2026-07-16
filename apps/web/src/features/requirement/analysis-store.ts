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

// Tham chiếu cố định, KHÔNG tạo mảng mới trong selector bên dưới. Zustand
// dùng useSyncExternalStore so sánh kết quả selector bằng Object.is — nếu
// fallback là `[] `viết trực tiếp trong selector, mỗi lần gọi sẽ ra một mảng
// mới, khiến React nghĩ snapshot đổi liên tục -> lỗi
// "getServerSnapshot should be cached" / vòng lặp render vô hạn.
const EMPTY_ASSUMPTIONS: string[] = [];

/** Selector tiện dụng: lấy assumptions của một project (mảng rỗng nếu chưa có). */
export function useAssumptions(projectId: string): string[] {
  return useAnalysisStore(
    (s) => s.assumptionsByProject[projectId] ?? EMPTY_ASSUMPTIONS,
  );
}
