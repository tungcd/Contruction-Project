import type { ConstraintSet } from "@acc/shared-types";
import { generateDesignIntentGraph, type DesignIntentGraph } from "../designIntentGraph";
import { buildLayoutGraphsPerFloor, type LayoutGraph } from "../layoutGraph";

/**
 * Layout Template — Tech Lead Review mục 6: Layout Generator chỉ CHỌN
 * template, template KHÔNG tự giải hình học (không tính toạ độ). Template
 * chỉ chịu trách nhiệm: có áp dụng được không (`appliesWhen`), và dựng
 * LayoutGraph (tô-pô) cho trường hợp của nó.
 *
 * Trả cả `dig` (không chỉ layoutGraphs) — Task 3 (Stage 1.7) cần biết
 * zone (private/service/...) của từng space để validate tô-pô circulation
 * TRƯỚC khi Geometry Solver chạy; LayoutNode không tự mang zone.
 *
 * Stage 2A: `layoutGraphs` (số nhiều) — 1 LayoutGraph MỖI TẦNG (Task 4),
 * không còn gộp chung 1 đồ thị (xem designIntentGraph.ts/layoutGraph.ts).
 */
export interface LayoutTemplate {
  id: string;
  appliesWhen: (ctx: { frontage: number; depth: number; floors: number }) => boolean;
  buildLayoutGraph: (
    constraintSet: ConstraintSet,
    warnings: string[],
  ) => { dig: DesignIntentGraph; layoutGraphs: LayoutGraph[] };
}

/**
 * Nhà ống/nhà cấp 4 — mặt tiền hẹp hơn chiều sâu, 1 tầng HOẶC nhiều
 * tầng (Stage 2A mở rộng: bỏ ràng buộc `floors === 1` của Stage 1, tái
 * dùng NGUYÊN template thay vì tạo template song song — cùng 1 hình
 * dạng lô đất, chỉ khác số tầng). Villa chưa implement (ngoài phạm vi
 * Stage 2A — xem Tech Lead Review "Do not implement villa yet").
 */
export const TOWNHOUSE_TEMPLATE: LayoutTemplate = {
  id: "townhouse-multi-floor-v1",
  appliesWhen: (ctx) => ctx.frontage <= ctx.depth,
  buildLayoutGraph: (constraintSet, warnings) => {
    const dig = generateDesignIntentGraph(constraintSet, warnings);
    return { dig, layoutGraphs: buildLayoutGraphsPerFloor(dig) };
  },
};

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [TOWNHOUSE_TEMPLATE];
